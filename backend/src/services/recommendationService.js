/**
 * Recommendation Engine for MealVista Home Page
 *
 * STRICT RULE: Dietary preferences and allergens are HARD CONSTRAINTS (blocking filters).
 * If a recipe violates them, it MUST NEVER appear in recommendations.
 * Scoring runs ONLY after all strict filters pass. Final validation pass before return.
 */

const axios = require('axios');
const aiRecipeService = require('../shared/aiRecipeService');
const { attachRecipeImages } = require('../shared/recipeImageService');
const User = require('../models/User');
const UserInteraction = require('../models/UserInteraction');
const RecommendationCache = require('../models/RecommendationCache');

const BACKEND_BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 5000}`;

const DEFAULT_LIMIT = 24;
const CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000; // 12 hours

function normalizeAllergenToCanonical(a) {
  if (!a || typeof a !== 'string') return null;
  const s = a.toLowerCase().trim();
  if (s.includes('dairy') || s === 'milk') return 'dairy';
  if (s.includes('egg')) return 'eggs';
  if (s.includes('gluten') || s.includes('wheat')) return 'gluten';
  if (s.includes('nut') && !s.includes('peanut')) return 'nuts';
  if (s.includes('peanut')) return 'peanuts';
  if (s.includes('soy')) return 'soy';
  if (s.includes('fish')) return 'fish';
  if (s.includes('shellfish') || s.includes('shrimp') || s.includes('prawn')) return 'shellfish';
  if (s.includes('sesame')) return 'sesame';
  return s;
}

const ALLERGEN_KEYWORDS = {
  dairy: ['dairy', 'milk', 'cheese', 'cream', 'butter', 'yogurt'],
  eggs: ['egg', 'eggs'],
  gluten: ['gluten', 'wheat', 'flour', 'bread', 'pasta'],
  nuts: ['nut', 'nuts', 'almond', 'walnut', 'cashew'],
  peanuts: ['peanut', 'peanuts'],
  soy: ['soy', 'tofu'],
  fish: ['fish', 'salmon', 'tuna', 'seafood', 'shrimp'],
  shellfish: ['shrimp', 'prawn', 'shellfish', 'crab', 'lobster'],
  sesame: ['sesame'],
};

/**
 * Get a single searchable text string from a recipe (title + ingredients).
 * Handles ingredients as string[] or as { name, quantity?, unit? }[].
 */
function getRecipeSearchableText(recipe) {
  const title = (recipe.title || recipe.name || '').trim();
  const raw = recipe.ingredients || [];
  const parts = raw.map((i) => {
    if (typeof i === 'string') return i;
    if (i && typeof i === 'object') return (i.name || i.ingredient || '').trim();
    return String(i || '');
  });
  const ingredients = parts.filter(Boolean).join(' ');
  return `${title} ${ingredients}`.toLowerCase();
}

function recipeContainsAllergen(recipe, allergenName) {
  const canonical = normalizeAllergenToCanonical(allergenName);
  const keywords = ALLERGEN_KEYWORDS[canonical] || ALLERGEN_KEYWORDS[allergenName?.toLowerCase()];
  if (!keywords) return false;
  const text = getRecipeSearchableText(recipe);
  return keywords.some((kw) => text.includes(kw));
}

/**
 * 1) ALLERGEN HARD BLOCK: recipe.allergens ∩ user.allergens ≠ ∅ → EXCLUDE immediately.
 * Also exclude if ingredients contain user allergen (when recipe.allergens missing).
 * No exceptions. No ranking. No fallback.
 */
function recipeHasAllergenConflict(recipe, userAllergens) {
  if (!userAllergens || userAllergens.length === 0) return false;
  const userCanonical = new Set(
    userAllergens.map(normalizeAllergenToCanonical).filter(Boolean)
  );
  const recipeAllergens = recipe.allergens || [];
  if (Array.isArray(recipeAllergens) && recipeAllergens.length > 0) {
    for (const a of recipeAllergens) {
      const c = normalizeAllergenToCanonical(a);
      if (c && userCanonical.has(c)) return true;
    }
  }
  return userAllergens.some((a) => recipeContainsAllergen(recipe, a));
}

function filterByAllergens(recipes, userAllergens) {
  if (!userAllergens || userAllergens.length === 0) return recipes;
  return recipes.filter((r) => {
    const recipe = r.recipe || r;
    return !recipeHasAllergenConflict(recipe, userAllergens);
  });
}

// Dairy-free: EXCLUDE if recipe contains any of these (spec: milk, butter, cheese, cream, yogurt, whey, casein, ghee, alfredo sauce).
const DAIRY_KEYWORDS = /\b(milk|cream|butter|cheese|yogurt|yoghurt|dairy|whey|casein|ghee|parmesan|mozzarella|ricotta|feta|cheddar|brie|cream cheese|sour cream|heavy cream|half.?and.?half|whipping cream|condensed milk|evaporated milk|alfredo sauce|alfredo)\b/;
// Dish names that are inherently dairy-heavy.
const DAIRY_DISH_NAMES = /\b(alfredo|carbonara|mac\s*and\s*cheese|cheese\s*sauce|cream\s*sauce|creamy\s*pasta|dauphinoise|gratin|scalloped|queso)\b/;

// High-carb ingredients: recipe with these is NOT keto / not low-carb (strict).
const HIGH_CARB_KEYWORDS = /\b(rice|pasta|noodle|bread|flour|wheat|barley|rye|oat|potato|potatoes|sugar|honey|maple syrup|cornstarch|corn starch|tortilla|bagel|couscous|semolina|quinoa|breadcrumb|breading)\b/;

/** Normalize preference for comparison (app sends labels: "Keto", "Low-Carb", "Dairy-Free", etc.). */
function normPref(pref) {
  return (pref || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get recipe carbs/protein per serving (from recipe or macros). Returns null if unknown.
 */
function getRecipeCarbs(recipe) {
  const c = recipe.carbs != null ? Number(recipe.carbs) : (recipe.macros && recipe.macros.carbs != null) ? Number(recipe.macros.carbs) : null;
  return typeof c === 'number' && !Number.isNaN(c) ? c : null;
}
function getRecipeProtein(recipe) {
  const p = recipe.protein != null ? Number(recipe.protein) : (recipe.macros && recipe.macros.protein != null) ? Number(recipe.macros.protein) : null;
  return typeof p === 'number' && !Number.isNaN(p) ? p : null;
}

/**
 * Check if recipe violates a single dietary preference. Uses exact app options:
 * Keto, Vegetarian, Vegan, Gluten-Free, Low-Carb, High-Protein, Dairy-Free.
 * Returns true = recipe must be EXCLUDED (does not meet preference).
 */
function recipeViolatesPreference(recipe, pref) {
  const p = normPref(pref);
  const text = getRecipeSearchableText(recipe);
  const carbs = getRecipeCarbs(recipe);
  const protein = getRecipeProtein(recipe);

  // Vegetarian / Vegan: no meat/fish/shellfish/animal products
  if (p === 'vegetarian' || p === 'vegan') {
    if (/\b(chicken|beef|pork|meat|fish|shrimp|prawn|prawns|lamb|turkey|bacon|ham|shellfish|seafood)\b/.test(text)) return true;
  }
  if (p === 'vegan') {
    if (/\b(egg|eggs|dairy|milk|cheese|butter|cream|yogurt|honey)\b/.test(text)) return true;
  }
  // Gluten-Free: no gluten
  if (p === 'gluten-free' || p === 'gluten free') {
    if (/\b(wheat|flour|barley|rye|bread|pasta|couscous|semolina)\b/.test(text)) return true;
  }
  // Halal (if ever added): no pork/alcohol
  if (p === 'halal') {
    if (/\b(pork|bacon|ham|gelatin|lard|alcohol|wine|beer)\b/.test(text)) return true;
  }
  // Dairy-Free: no dairy (ingredients or known dairy dish names like alfredo, carbonara)
  if (p === 'dairy-free' || p === 'dairy free') {
    if (DAIRY_KEYWORDS.test(text)) return true;
    if (DAIRY_DISH_NAMES.test(text)) return true;
  }
  // Keto: strict low-carb (≤25g) and no high-carb ingredients
  if (p === 'keto') {
    if (HIGH_CARB_KEYWORDS.test(text)) return true;
    if (carbs != null && carbs > 25) return true;
  }
  // Low-Carb: ≤30g carbs and no high-carb ingredients
  if (p === 'low-carb' || p === 'low carb') {
    if (HIGH_CARB_KEYWORDS.test(text)) return true;
    if (carbs != null && carbs > 30) return true;
  }
  // High-Protein: ≥20g protein per serving
  if (p === 'high-protein' || p === 'high protein') {
    if (protein != null && protein < 20) return true;
  }
  return false;
}

/**
 * 2) Dietary filter: exclude recipes that violate ANY user dietary preference.
 * App options: Keto, Vegetarian, Vegan, Gluten-Free, Low-Carb, High-Protein, Dairy-Free.
 */
function filterByDietary(recipes, dietaryPreferences) {
  if (!dietaryPreferences || dietaryPreferences.length === 0) return recipes;
  return recipes.filter((r) => {
    const recipe = r.recipe || r;
    const violates = dietaryPreferences.some((pref) => recipeViolatesPreference(recipe, pref));
    return !violates;
  });
}

/** Normalize healthGoal to lose | maintain | gain for consistent logic. */
function normalizeHealthGoal(healthGoal) {
  if (!healthGoal) return 'maintain';
  const h = (healthGoal || '').toLowerCase();
  if (h === 'lose' || h === 'weight_loss' || h === 'weight loss') return 'lose';
  if (h === 'gain' || h === 'weight_gain' || h === 'weight gain') return 'gain';
  return 'maintain';
}

/**
 * 2b) Health goal filter: strictly follow profile. Lose = exclude high-calorie; gain = exclude very low-calorie.
 */
function filterByHealthGoal(recipes, healthGoal) {
  const goal = normalizeHealthGoal(healthGoal);
  if (goal === 'maintain') return recipes;
  return recipes.filter((r) => {
    const recipe = r.recipe || r;
    const cal = Number(recipe.calories) || (recipe.macros && recipe.macros.calories) || 400;
    if (goal === 'lose') return cal <= 500;
    if (goal === 'gain') return cal >= 300;
    return true;
  });
}

/**
 * VALIDATION: Returns true if recipe violates dietary preferences OR allergens.
 * Used as final gate before returning recommendations. No violating recipe may reach the UI.
 */
function recipeViolatesProfile(recipe, profile) {
  if (recipeHasAllergenConflict(recipe, profile.allergens)) return true;
  if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
    if (profile.dietaryPreferences.some((pref) => recipeViolatesPreference(recipe, pref))) return true;
  }
  return false;
}

/**
 * Count how many dietary preferences the recipe satisfies. Only add to matchedPrefs when recipe truly matches.
 * Uses exact app labels (Keto, Vegetarian, Vegan, Gluten-Free, Low-Carb, High-Protein, Dairy-Free) for tags.
 */
function countDietaryMatches(recipe, dietaryPreferences) {
  if (!dietaryPreferences || dietaryPreferences.length === 0) return { matchCount: 0, total: 0, matchedPrefs: [], score: 1 };
  const recipeLower = getRecipeSearchableText(recipe);
  const carbs = getRecipeCarbs(recipe);
  const protein = getRecipeProtein(recipe);
  const matchedPrefs = [];
  for (const pref of dietaryPreferences) {
    const p = normPref(pref);
    if (recipeViolatesPreference(recipe, pref)) continue;
    // Keto: only tag when clearly keto (carbs ≤25 and no high-carb ingredients already ensured by no violation)
    if (p === 'keto') {
      if ((carbs != null && carbs <= 25) || recipeLower.includes('keto') || recipeLower.includes('low carb')) matchedPrefs.push(pref);
      continue;
    }
    // Low-Carb: only when carbs ≤30 or low carb in text
    if (p === 'low-carb' || p === 'low carb') {
      if ((carbs != null && carbs <= 30) || recipeLower.includes('low carb')) matchedPrefs.push(pref);
      continue;
    }
    // High-Protein: only when protein ≥20
    if (p === 'high-protein' || p === 'high protein') {
      if (protein != null && protein >= 20) matchedPrefs.push(pref);
      continue;
    }
    // Vegetarian, Vegan, Gluten-Free, Dairy-Free, Halal: no violation = matches (ingredients checked)
    if (['vegetarian', 'vegan', 'gluten-free', 'gluten free', 'halal', 'dairy-free', 'dairy free'].includes(p)) {
      matchedPrefs.push(pref);
      continue;
    }
    if (recipeLower.includes(p) || recipeLower.includes(p.replace(/-/g, ' '))) matchedPrefs.push(pref);
  }
  const total = dietaryPreferences.length;
  const matchCount = matchedPrefs.length;
  const score = total === 0 ? 1 : 0.3 + 0.7 * (matchCount / total);
  return { matchCount, total, matchedPrefs, score };
}

/**
 * 2b) Dietary preference match score (0-1). Uses ALL preferences; higher when more match.
 */
function scoreDietaryMatch(recipe, dietaryPreferences) {
  const { score } = countDietaryMatches(recipe, dietaryPreferences);
  return score;
}

/**
 * 3) Health goal alignment (scoring only after strict filters). lose/maintain/gain.
 */
function scoreHealthGoal(recipe, healthGoal, bmiCategory) {
  const goal = normalizeHealthGoal(healthGoal);
  const cal = Number(recipe.calories) || 400;
  const protein = Number(recipe.protein) || (recipe.macros && recipe.macros.protein) || 15;
  const carbs = Number(recipe.carbs) || (recipe.macros && recipe.macros.carbs) || 40;

  if (goal === 'lose') {
    if (cal <= 450 && protein >= 20) return 1;
    if (cal <= 500) return 0.8;
    if (cal > 600) return 0.4;
    return 0.7;
  }
  if (goal === 'gain') {
    if (cal >= 500 && (protein >= 25 || carbs >= 50)) return 1;
    if (cal >= 450) return 0.8;
    if (cal < 350) return 0.5;
    return 0.7;
  }
  if (cal >= 350 && cal <= 550) return 1;
  if (cal >= 300 && cal <= 600) return 0.85;
  return 0.7;
}

/**
 * 4) Behavior boost: same cuisine/category or previously liked/saved/cooked
 */
function getBehaviorBoost(recipe, interactions) {
  if (!interactions || interactions.length === 0) return 0;
  const title = (recipe.title || recipe.name || '').toLowerCase();
  const category = (recipe.category || '').toLowerCase();
  let boost = 0;
  const likedCuisines = new Set();
  const likedTitles = new Set();
  interactions.forEach((i) => {
    if (i.type === 'like' || i.type === 'save' || i.type === 'cooked') {
      if (i.cuisine) likedCuisines.add(i.cuisine.toLowerCase());
      if (i.recipeTitle) likedTitles.add(i.recipeTitle.toLowerCase());
    }
  });
  if (category && likedCuisines.has(category)) boost += 0.3;
  if (likedTitles.has(title)) boost += 0.4;
  likedTitles.forEach((t) => {
    if (title.includes(t) || t.includes(title)) boost += 0.2;
  });
  return Math.min(0.5, boost);
}

/**
 * Build reason string per spec: "Matches your X preference", "Safe for your allergens", "Aligned with weight loss goal".
 */
function buildReason(recipe, profile, behaviorBoost, matchedPrefs = []) {
  const reasons = [];
  const goal = normalizeHealthGoal(profile.healthGoal);
  if (goal === 'lose') reasons.push('Aligned with weight loss goal');
  else if (goal === 'gain') reasons.push('Aligned with weight gain goal');
  else reasons.push('Balanced for your maintenance goal');
  if (matchedPrefs && matchedPrefs.length > 0) {
    const prefText = matchedPrefs.length === 1 ? matchedPrefs[0] : `${matchedPrefs.slice(0, 2).join(' & ')}${matchedPrefs.length > 2 ? ' & more' : ''}`;
    reasons.push(`Matches your ${prefText} preference${matchedPrefs.length > 1 ? 's' : ''}`);
  } else if (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) {
    reasons.push('Matches your dietary preferences');
  }
  if (profile.allergens && profile.allergens.length > 0) {
    reasons.push('Safe for your allergens');
  }
  if (behaviorBoost > 0) reasons.push('Based on your recent activity');
  return reasons.length > 0 ? reasons[0] : 'Recommended for you';
}

/**
 * Normalize AI engine result item to internal recipe object
 */
function normalizeRecipe(item) {
  const r = item.recipe || item;
  const title = r.title || r.name || 'Recipe';
  const prepTime = typeof r.prep_time === 'string' ? parseInt(r.prep_time.replace(/\D/g, ''), 10) || 15 : (r.prepTime || 15);
  const cookTime = typeof r.cook_time === 'string' ? parseInt(r.cook_time.replace(/\D/g, ''), 10) || 20 : (r.cookTime || 20);
  return {
    title,
    name: title,
    ingredients: r.ingredients || [],
    calories: r.calories || 350,
    protein: r.protein || (r.macros && r.macros.protein) || 15,
    carbs: r.carbs || (r.macros && r.macros.carbs) || 35,
    fat: r.fat || (r.macros && r.macros.fat) || 12,
    macros: r.macros || {},
    difficulty: r.difficulty || 'Medium',
    category: r.category || r.cuisine || '',
    prepTime,
    cookTime,
    time: prepTime + cookTime,
    rating: r.rating || 4.5,
    ...r,
  };
}

/**
 * Fetch candidate recipes from backend category API (Spoonacular/TheMealDB).
 * Used when recipe-engine is down or returns no results.
 */
async function fetchCandidatesFromBackendCategories(limit = 60) {
  const categories = ['pakistani', 'italian', 'indian', 'chinese', 'mediterranean', 'thai', 'mexican'];
  const perCategory = Math.ceil(limit / categories.length);
  const allResults = [];
  const seenTitles = new Set();

  for (const cat of categories) {
    try {
      const res = await axios.get(`${BACKEND_BASE_URL}/api/recipes/category/${cat}`, {
        timeout: 15000,
        validateStatus: () => true,
      });
      if (res.status !== 200 || !res.data || !res.data.success || !Array.isArray(res.data.recipes)) continue;
      for (const r of res.data.recipes) {
        const title = (r.name || r.title || '').trim();
        const key = title.toLowerCase();
        if (!key || seenTitles.has(key)) continue;
        seenTitles.add(key);
        allResults.push({
          recipe: {
            title: r.name || r.title,
            name: r.name || r.title,
            ingredients: r.ingredients || [],
            instructions: r.instructions || [],
            calories: r.calories || 350,
            prepTime: r.prepTime || 15,
            cookTime: r.cookTime || 20,
            time: (r.prepTime || 0) + (r.cookTime || 0) || 30,
            difficulty: r.difficulty || 'Medium',
            rating: r.rating || 4.5,
            image: r.image,
            image_url: r.image,
            macros: r.macros || {},
            category: cat,
            allergens: r.allergens || [],
          },
        });
      }
    } catch (err) {
      console.warn(`[recommendations] Backend category ${cat} failed:`, err.message);
    }
  }
  return allResults;
}

/** Max results per AI query (recipe-engine generates up to 20 per call). */
const AI_RESULTS_PER_QUERY = 20;
/** Run AI queries in batches to avoid timeouts / rate limits. */
const AI_BATCH_SIZE = 4;

/**
 * Build many AI-oriented queries so we get a large pool of preference-matching recipes.
 */
function buildRecommendationQueries(profile, limit = 80) {
  const prefs = profile.dietaryPreferences || [];
  const prefStr = prefs.length > 0 ? prefs.map((p) => (p || '').toLowerCase()).join(' ') : '';
  const base = prefStr ? `${prefStr} recipes` : 'healthy dinner recipes';

  const cuisines = ['Pakistani', 'Indian', 'Italian', 'Chinese', 'Mediterranean', 'Thai', 'Mexican', 'Middle Eastern'];
  const queries = cuisines.map((c) => `${c} ${base}`);

  if (prefStr) {
    queries.push(`easy ${base}`, `popular ${base}`, `quick ${base}`, `best ${base}`);
  } else {
    queries.push('easy dinner recipes', 'popular healthy recipes');
  }
  return queries;
}

/** Run a single batch of AI queries and return new items (deduped by seenTitles). */
async function runAiQueryBatch(queries, allergens, seenTitles, allResults) {
  const results = await Promise.allSettled(
    queries.map((q) =>
      aiRecipeService.searchRecipes(q, AI_RESULTS_PER_QUERY, true, allergens)
    )
  );
  for (const settled of results) {
    if (settled.status !== 'fulfilled' || !settled.value?.success || !settled.value?.data?.results) continue;
    for (const item of settled.value.data.results) {
      const norm = (item.recipe && (item.recipe.title || item.recipe.name)) || '';
      const key = norm.trim().toLowerCase();
      if (key && !seenTitles.has(key)) {
        seenTitles.add(key);
        allResults.push(item);
      }
    }
  }
}

/**
 * Convert AI recommend API response to same shape as search results (item.recipe).
 */
function parseMins(val) {
  if (typeof val === 'number' && !Number.isNaN(val)) return val;
  if (typeof val === 'string') return parseInt(val.replace(/\D/g, ''), 10) || 30;
  return 30;
}

function normalizeRecommendItems(recommendations) {
  if (!Array.isArray(recommendations) || recommendations.length === 0) return [];
  return recommendations.map((r) => {
    const prep = parseMins(r.prep_time);
    const cook = parseMins(r.cook_time);
    return {
      recipe: {
        title: r.title || r.name,
        name: r.title || r.name,
        description: r.description,
        image_description: r.image_description || null,
        ingredients: r.ingredients || [],
        instructions: r.instructions || r.directions || [],
        calories: r.calories || 350,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        prep_time: r.prep_time || '15 min',
        cook_time: r.cook_time || '25 min',
        prepTime: prep,
        cookTime: cook,
        time: prep + cook,
        servings: r.servings || 4,
        tags: r.tags || [],
        reason: r.reason,
        difficulty: r.difficulty || 'Medium',
        rating: 4.5,
      },
    };
  });
}

/**
 * Fetch candidate recipes from AI engine. Tries profile-based recommend first (5-6 AI-generated);
 * then runs search queries in batches. Falls back to backend category API when engine is down.
 */
async function fetchCandidateRecipes(profile, limit = 80) {
  const hasProfile = (profile.dietaryPreferences && profile.dietaryPreferences.length > 0) ||
    (profile.allergens && profile.allergens.length > 0) ||
    (profile.healthGoal && profile.healthGoal !== 'maintenance');

  if (hasProfile) {
    try {
      const rec = await aiRecipeService.getRecommendations(profile);
      if (rec.success && rec.data && rec.data.recommendations && rec.data.recommendations.length >= 5) {
        const items = normalizeRecommendItems(rec.data.recommendations);
        console.log(`[recommendations] AI profile-based: ${items.length} recipes`);
        return items;
      }
    } catch (e) {
      console.warn('[recommendations] AI recommend failed, using search flow:', e.message);
    }
  }

  const queries = buildRecommendationQueries(profile, limit);
  const allResults = [];
  const seenTitles = new Set();
  const allergens = profile.allergens && profile.allergens.length > 0 ? profile.allergens : null;

  try {
    for (let i = 0; i < queries.length; i += AI_BATCH_SIZE) {
      const batch = queries.slice(i, i + AI_BATCH_SIZE);
      await runAiQueryBatch(batch, allergens, seenTitles, allResults);
    }

    if (allResults.length > 0) {
      console.log(`[recommendations] AI search: ${allResults.length} unique recipes from ${queries.length} queries`);
    }

    if (allResults.length === 0) {
      const fallback = await aiRecipeService.searchRecipes(
        'dinner recipes',
        AI_RESULTS_PER_QUERY,
        true,
        allergens
      );
      if (fallback.success && fallback.data?.results?.length > 0) {
        console.log(`[recommendations] AI fallback: ${fallback.data.results.length} recipes`);
        return fallback.data.results;
      }
    }
  } catch (err) {
    console.warn('[recommendations] Recipe-engine failed:', err.message);
  }

  if (allResults.length === 0) {
    const fromBackend = await fetchCandidatesFromBackendCategories(limit);
    if (fromBackend.length > 0) {
      console.log(`[recommendations] Using backend categories (not AI): ${fromBackend.length} recipes`);
      return fromBackend;
    }
  }
  return allResults;
}

/**
 * Compute recommendations for a user (cold start or with behavior). Returns array of items for cache/frontend.
 */
async function computeRecommendations(userId, limit = DEFAULT_LIMIT) {
  const user = await User.findById(userId).select('-password');
  if (!user) return [];

  const profile = {
    dietaryPreferences: user.dietaryPreferences || [],
    allergens: user.allergens || [],
    healthGoal: user.healthGoal || 'maintenance',
    bmiCategory: user.bmiCategory || 'Normal',
    bmi: user.bmi,
  };

  const interactions = await UserInteraction.find({ userId })
    .sort({ createdAt: -1 })
    .limit(500)
    .lean();

  const hasRestrictions = (profile.allergens && profile.allergens.length > 0) || (profile.dietaryPreferences && profile.dietaryPreferences.length > 0);
  const candidateLimit = hasRestrictions ? 120 : 80;
  let candidates = await fetchCandidateRecipes(profile, candidateLimit);
  const afterFetch = candidates.length;

  // 1) Allergen filtering (strict) – hard block
  candidates = filterByAllergens(candidates, profile.allergens);
  const afterAllergen = candidates.length;
  if (candidates.length === 0) return [];

  // 2) Dietary filtering: exclude recipes that violate ANY preference (strict)
  candidates = filterByDietary(candidates, profile.dietaryPreferences);
  const afterDietary = candidates.length;

  // If strict filter left none, try a second wave of AI queries focused only on preferences (broader)
  if (candidates.length === 0 && (profile.dietaryPreferences?.length > 0 || profile.allergens?.length > 0)) {
    const prefs = (profile.dietaryPreferences || []).map((p) => (p || '').toLowerCase()).join(' ');
    const extraQueries = prefs ? [`${prefs} dinner recipes`, `simple ${prefs} meals`] : ['healthy dinner recipes'];
    const second = await Promise.allSettled(
      extraQueries.map((q) =>
        aiRecipeService.searchRecipes(q, AI_RESULTS_PER_QUERY, true, profile.allergens?.length ? profile.allergens : null)
      )
    );
    let extra = [];
    const seen = new Set();
    for (const s of second) {
      if (s.status !== 'fulfilled' || !s.value?.data?.results) continue;
      for (const item of s.value.data.results) {
        const key = (item.recipe?.title || item.recipe?.name || '').trim().toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          extra.push(item);
        }
      }
    }
    candidates = filterByAllergens(extra, profile.allergens);
    candidates = filterByDietary(candidates, profile.dietaryPreferences);
  }
  if (candidates.length === 0) return [];

  // 2b) Health goal: strict filter. If it would leave zero, skip so we still show diet/allergen-safe recipes (never break those).
  let afterHealthGoal = filterByHealthGoal(candidates, profile.healthGoal);
  if (afterHealthGoal.length === 0) {
    afterHealthGoal = candidates; // fallback: use all diet/allergen-safe, rank by health goal instead
  }
  candidates = afterHealthGoal;
  if (afterFetch > 0) {
    console.log(`[recommendations] Filter: fetched ${afterFetch} → after allergen ${afterAllergen} → dietary ${afterDietary} → health ${candidates.length}`);
  }

  const scored = candidates.map((item) => {
    const recipe = normalizeRecipe(item);
    const { score: dietaryScore, matchedPrefs } = countDietaryMatches(recipe, profile.dietaryPreferences);
    const healthScore = scoreHealthGoal(recipe, profile.healthGoal, profile.bmiCategory);
    const behaviorBoost = getBehaviorBoost(recipe, interactions);
    const totalScore = dietaryScore * 0.4 + healthScore * 0.4 + 0.2 + behaviorBoost;
    const reason = buildReason(recipe, profile, behaviorBoost, matchedPrefs);
    return {
      item,
      recipe,
      score: totalScore,
      reason,
      matchedPrefs: matchedPrefs || [],
    };
  });

  scored.sort((a, b) => b.score - a.score);

  // VALIDATION PASS: No violating recipe may reach the UI. Remove violators and replace with next valid candidate.
  const validated = [];
  for (const x of scored) {
    if (validated.length >= limit) break;
    if (!recipeViolatesProfile(x.recipe, profile)) validated.push(x);
  }
  const top = validated;

  const tagsFromRecipe = (r, matchedPrefs = []) => {
    const t = [];
    if (r.calories <= 400) t.push('low-calorie');
    if ((r.protein || (r.macros && r.macros.protein)) >= 25) t.push('high-protein');
    if ((r.carbs || (r.macros && r.macros.carbs)) <= 25) t.push('low-carb');
    // Only show dietary tags when the recipe actually matches (never use "user's first preference" as fallback).
    if (matchedPrefs && matchedPrefs.length > 0) {
      t.push(...matchedPrefs.slice(0, 4));
    }
    return t.length ? t : ['balanced'];
  };

  const recipeId = (r) => r.id || `rec-${(r.title || r.name || '').replace(/\s+/g, '-').toLowerCase()}`;

  const output = top.map(({ recipe, reason, score, matchedPrefs }) => ({
    recipeId: recipeId(recipe),
    title: recipe.title || recipe.name,
    imageUrl: recipe.image_url || recipe.image || null,
    calories: recipe.calories || 350,
    tags: tagsFromRecipe(recipe, matchedPrefs),
    reason,
    score,
    category: recipe.category || '',
    time: recipe.time || 30,
    difficulty: recipe.difficulty || 'Medium',
    rating: typeof recipe.rating === 'number' ? recipe.rating : parseFloat(recipe.rating) || 4.5,
    recipeData: {
      id: recipeId(recipe),
      name: recipe.title,
      title: recipe.title,
      image_description: recipe.image_description || null,
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || recipe.directions || [],
      macros: recipe.macros || {},
      allergens: recipe.allergens || [],
    },
  }));

  return output;
}

/**
 * Get recommendations for user: from cache if fresh, else compute and cache.
 * @param {boolean} [skipCache] - If true, recompute and update cache (e.g. after profile change or refresh).
 */
async function getRecommendationsForUser(userId, limit = DEFAULT_LIMIT, skipCache = false) {
  const cache = await RecommendationCache.findOne({ userId }).lean();
  const now = Date.now();
  const cacheFresh = cache && cache.items && cache.items.length > 0 && cache.updatedAt && (now - new Date(cache.updatedAt).getTime() < CACHE_MAX_AGE_MS);
  if (!skipCache && cacheFresh) {
    const list = cache.items.slice(0, limit);
    try {
      await attachRecipeImagesForRecommendations(list);
    } catch (e) {
      console.warn('[recommendations] attachRecipeImages failed', e.message);
    }
    return list;
  }

  const items = await computeRecommendations(userId, limit);
  if (items.length === 0) {
    if (cache && cache.items && cache.items.length > 0) {
      return cache.items.slice(0, limit);
    }
    return [];
  }

  try {
    await attachRecipeImagesForRecommendations(items);
  } catch (e) {
    console.warn('[recommendations] attachRecipeImages failed', e.message);
  }

  await RecommendationCache.findOneAndUpdate(
    { userId },
    { $set: { items, updatedAt: new Date() } },
    { upsert: true }
  );

  return items.slice(0, limit);
}

/**
 * Attach image URLs to recommendation items so the image matches the recipe.
 * Uses image_description or title + ingredients for the search query.
 */
async function attachRecipeImagesForRecommendations(items) {
  const rd = (it) => it.recipeData || {};
  const results = items.map((it) => ({
    recipe: {
      title: it.title,
      name: it.title,
      image_url: it.imageUrl,
      image_description: rd(it).image_description || it.image_description || null,
      ingredients: rd(it).ingredients || it.ingredients || [],
    },
  }));
  await attachRecipeImages(results);
  results.forEach((r, i) => {
    if (items[i] && r.recipe && r.recipe.image_url) {
      items[i].imageUrl = r.recipe.image_url;
    }
  });
}

/**
 * Record a view (or like/save/cooked) for behavior-based recommendations
 */
async function recordInteraction(userId, data) {
  const { recipeId, recipeTitle, type, cuisine, category } = data;
  if (!userId || !recipeId || !type) return;
  await UserInteraction.create({
    userId,
    recipeId,
    recipeTitle: recipeTitle || '',
    type,
    cuisine: cuisine || null,
    category: category || null,
  });
}

/**
 * Refresh cache for a single user (used by cron and on-demand)
 */
async function refreshUserRecommendations(userId) {
  const items = await computeRecommendations(userId, DEFAULT_LIMIT);
  try {
    await attachRecipeImagesForRecommendations(items);
  } catch (e) {
    console.warn('[recommendations] attachRecipeImages failed', e.message);
  }
  await RecommendationCache.findOneAndUpdate(
    { userId },
    { $set: { items, updatedAt: new Date() } },
    { upsert: true }
  );
  return items.length;
}

/**
 * Cron: refresh all users' recommendation caches (active users with cache or recent interaction)
 */
async function refreshAllUsersRecommendations() {
  const userIds = await User.find({ isDeleted: { $ne: true } }).distinct('_id');
  let refreshed = 0;
  for (const uid of userIds) {
    try {
      const n = await refreshUserRecommendations(uid);
      if (n > 0) refreshed++;
    } catch (e) {
      console.warn(`[recommendations] refresh failed for user ${uid}`, e.message);
    }
  }
  console.log(`[recommendations] Cron: refreshed ${refreshed} users`);
  return refreshed;
}

module.exports = {
  getRecommendationsForUser,
  recordInteraction,
  refreshUserRecommendations,
  refreshAllUsersRecommendations,
  computeRecommendations,
  CACHE_MAX_AGE_MS,
};
