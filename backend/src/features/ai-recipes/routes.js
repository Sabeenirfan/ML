/**
 * AI Recipe Routes
 * Enhanced recipe routes that use AI Recipe Engine
 * Place this file in: backend/routes/ai-recipes.js
 */

const express = require('express');
const router = express.Router();
const aiRecipeService = require('../../shared/aiRecipeService');
const aiRecipeGenerator = require('../../shared/aiRecipeGenerator');
const cartStore = require('../../shared/cartStore');
const { attachRecipeImages } = require('../../shared/recipeImageService');
const User = require('../../models/User');

/**
 * Normalize ingredient string for comparison (lowercase, strip leading numbers/units).
 */
function normalizeIngredient(str) {
  if (typeof str !== 'string') str = String(str);
  return str
    .toLowerCase()
    .replace(/^\s*[\d./]+\s*(cup|cups|tbsp|tsp|oz|lb|g|kg|ml|l)\s*/i, '')
    .replace(/^\s*[\d./]+\s*/, '')
    .trim();
}

/**
 * Compute missing ingredients: recipe ingredients not covered by user's ingredients.
 * @param {Array<string|{name?: string}>} recipeIngredients - List of recipe ingredient strings or objects with name
 * @param {string[]} userIngredients - List of ingredients the user has
 * @returns {Array<{name: string, original?: string}>} Missing ingredients (with original text if available)
 */
function getMissingIngredients(recipeIngredients, userIngredients = []) {
  const userNorm = new Set(
    (userIngredients || []).map((i) => normalizeIngredient(i))
  );
  const missing = [];
  const seen = new Set();
  for (const ing of recipeIngredients || []) {
    const text = typeof ing === 'string' ? ing : (ing.name || ing.original || String(ing));
    const norm = normalizeIngredient(text);
    if (!norm || seen.has(norm)) continue;
    const covered = Array.from(userNorm).some(
      (u) => norm.includes(u) || u.includes(norm)
    );
    if (!covered) {
      seen.add(norm);
      missing.push({ name: text, original: text });
    }
  }
  return missing;
}

/**
 * Resolve user profile from JWT or request body (for unified AI layer).
 * For GET requests only JWT is used (no body).
 */
async function getProfileFromRequest(req) {
  const body = req.body || {};
  if (req.method !== 'GET' && (body.dietaryPreferences || body.bmiCategory || body.healthGoal || (body.allergens && body.allergens.length > 0))) {
    return {
      dietaryPreferences: body.dietaryPreferences || [],
      allergens: body.allergens || body.userAllergens || [],
      bmi: body.bmi != null ? body.bmi : 22,
      bmiCategory: body.bmiCategory || 'Normal',
      healthGoal: body.healthGoal || 'maintenance',
    };
  }
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findOne({ _id: decoded.userId, isDeleted: { $ne: true } });
      if (user) {
        return {
          dietaryPreferences: user.dietaryPreferences || [],
          allergens: user.allergens || [],
          bmi: user.bmi,
          bmiCategory: user.bmiCategory || 'Normal',
          healthGoal: user.healthGoal || 'maintenance',
        };
      }
    }
  } catch (_) {}
  return {
    dietaryPreferences: [],
    allergens: [],
    bmi: 22,
    bmiCategory: 'Normal',
    healthGoal: 'maintenance',
  };
}

/**
 * Normalize Node aiRecipeGenerator output to same shape as Python engine (results array).
 * Deduplicates by normalized title so the client never receives repeated recipes.
 */
function nodeRecipesToSearchResponse(query, nodeRecipes) {
  const seen = new Set();
  const unique = [];
  for (const r of nodeRecipes || []) {
    const norm = (r.name || r.title || '').trim().toLowerCase().replace(/\s+/g, ' ');
    if (!norm || seen.has(norm)) continue;
    seen.add(norm);
    unique.push(r);
  }
  const results = unique.map((r, i) => ({
    type: 'generated_fallback',
    recipe: {
      title: r.name,
      name: r.name,
      ingredients: r.ingredients || [],
      directions: (r.instructions || []).map((step) => (typeof step === 'string' ? step : step.text)),
      prep_time: r.prepTime != null ? `${r.prepTime} min` : '15 min',
      cook_time: r.cookTime != null ? `${r.cookTime} min` : '20 min',
      difficulty: r.difficulty || 'Medium',
      description: r.personalizedFor ? `Personalized for ${r.personalizedFor.healthGoal}` : undefined,
    },
    rank: i + 1,
    similarity_score: 0.9,
    substitutions: [],
    recipe_with_substitutions: null,
  }));
  return {
    query,
    query_type: 'name_based',
    results,
    total_results: results.length,
  };
}

/**
 * Normalize recipe title for deduplication (lowercase, trim, collapse spaces).
 */
function normalizeRecipeTitle(recipe) {
  if (!recipe) return '';
  const t = (recipe.name || recipe.title || '').trim();
  return t.toLowerCase().replace(/\s+/g, ' ');
}

/** Strip personalization prefixes so "Light Seed Soup" and "Seed Soup" dedupe to one. */
function baseTitleForDedup(normTitle) {
  if (!normTitle) return normTitle;
  const prefixes = ['light ', 'keto ', 'nutritious ', 'high-protein '];
  let base = normTitle;
  for (const p of prefixes) {
    if (base.startsWith(p)) base = base.slice(p.length).trim();
  }
  return base;
}

/**
 * Generate recipes using Node aiRecipeGenerator (only when Python is unavailable).
 * Deduplicates by base title so we never return the same recipe twice (max 5 unique from generic variants).
 */
async function generateRecipesWithNode(query, userProfile, count = 8) {
  const numRecipes = Math.min(Math.max(count, 5), 15);
  const aiRecipes = [];
  const seenTitles = new Set();
  const seenBases = new Set();
  for (let i = 0; i < numRecipes; i++) {
    try {
      const recipe = await aiRecipeGenerator.generatePersonalizedRecipe(userProfile, query, i);
      if (recipe) {
        const norm = normalizeRecipeTitle(recipe);
        const base = baseTitleForDedup(norm);
        if (norm && !seenTitles.has(norm) && !seenBases.has(base)) {
          seenTitles.add(norm);
          seenBases.add(base);
          aiRecipes.push(recipe);
        }
      }
    } catch (err) {
      console.warn(`Node AI recipe ${i + 1} failed:`, err.message);
    }
  }
  if (aiRecipes.length === 0) {
    for (let i = 0; i < 5; i++) {
      try {
        const recipe = await aiRecipeGenerator.generateWithKnowledgeBase(userProfile, query, i);
        if (recipe) {
          const norm = normalizeRecipeTitle(recipe);
          const base = baseTitleForDedup(norm);
          if (norm && !seenTitles.has(norm) && !seenBases.has(base)) {
            seenTitles.add(norm);
            seenBases.add(base);
            aiRecipes.push(recipe);
          }
        }
      } catch (err) {
        console.warn('Knowledge-base recipe failed:', err.message);
      }
    }
  }
  return aiRecipes;
}

/**
 * @route   GET /api/ai-recipes/health
 * @desc    Check AI Recipe Engine health
 * @access  Public
 */
router.get('/health', async (req, res) => {
  try {
    const health = await aiRecipeService.healthCheck();
    
    res.json({
      success: true,
      aiEngine: health
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-recipes/search
 * @desc    Search or generate recipes using AI
 * @access  Public (or Protected if you add auth)
 * 
 * Body: {
 *   query: string,           // User query
 *   maxResults?: number,     // Optional, default 5
 *   generateIfNoMatch?: boolean,  // Optional, default true
 *   userAllergens?: string[],     // Optional, for FE-3 allergen substitution
 *   preferenceTags?: string[],     // Optional, for FE-6 re-ranking (e.g. ['keto', 'vegetarian'])
 *   dietaryPreferences?: string[], // Optional, for future FE-1 filtering
 *   bmiCategory?: string,    // Optional (e.g. 'Normal', 'Overweight')
 *   healthGoal?: string      // Optional (e.g. 'weight_loss', 'maintenance')
 * }
 */
/**
 * FE-6: Re-rank results by user preference tags (no training).
 * Scores each recipe by how many preference tags appear in title/ingredients/description.
 */
function reRankByPreferenceTags(results, preferenceTags) {
  if (!results || !Array.isArray(results) || !preferenceTags || preferenceTags.length === 0) {
    return results;
  }
  const tags = preferenceTags.map((t) => String(t).toLowerCase());
  function score(item) {
    const recipe = item.recipe || {};
    const title = (recipe.title || recipe.name || '').toLowerCase();
    const desc = (recipe.description || '').toLowerCase();
    const ings = (recipe.ingredients || [])
      .map((i) => (typeof i === 'string' ? i : i.name || '').toLowerCase())
      .join(' ');
    const text = `${title} ${desc} ${ings}`;
    return tags.filter((tag) => text.includes(tag)).length;
  }
  return [...results].sort((a, b) => score(b) - score(a));
}

/** Max length for search query to avoid abuse and ensure consistent behavior. */
const SEARCH_QUERY_MAX_LENGTH = 500;

/** Sanitize search query: trim, limit length, strip control characters. */
function sanitizeSearchQuery(input) {
  if (input == null) return '';
  const str = String(input).replace(/\s+/g, ' ').trim();
  return str.slice(0, SEARCH_QUERY_MAX_LENGTH);
}

router.post('/search', async (req, res) => {
  try {
    const body = req.body || {};
    let query = body.query;
    const preferenceTags = body.preferenceTags;
    const userAllergensFromBody = body.userAllergens || body.allergens;

    if (query == null || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Query is required and must be a string',
        results: [],
        total_results: 0,
      });
    }

    query = sanitizeSearchQuery(query);
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query cannot be empty after trimming',
        results: [],
        total_results: 0,
      });
    }

    const maxResultsNum = Math.min(200, Math.max(1, parseInt(body.maxResults, 10) || 15));
    const generateIfNoMatch = body.generateIfNoMatch !== false;

    const userProfile = await getProfileFromRequest(req);
    const userAllergens = Array.isArray(userAllergensFromBody) && userAllergensFromBody.length > 0
      ? userAllergensFromBody.map((a) => String(a).trim()).filter(Boolean)
      : (userProfile.allergens || []);

    console.log(`📥 AI Recipe Search: "${query}" maxResults=${maxResultsNum} generateIfNoMatch=${generateIfNoMatch}`);

    let data;
    const result = await aiRecipeService.searchRecipes(
      query,
      maxResultsNum,
      generateIfNoMatch,
      userAllergens.length ? userAllergens : null
    );

    if (result.success && result.data) {
      data = result.data;
      const count = Array.isArray(data.results) ? data.results.length : 0;
      if (count > 0) {
        console.log(`✅ Recipe engine returned ${count} recipes for "${query}"`);
      } else {
        console.warn('🔄 Recipe engine returned no results.', data.message || '');
      }
    } else {
      data = {
        query: query.trim(),
        query_type: 'name_based',
        results: [],
        total_results: 0,
        message: 'Recipe engine unavailable. Start it with: cd recipe-engine && python run.py',
      };
    }

    let results = Array.isArray(data.results) ? data.results : [];
    const reRanked = preferenceTags && Array.isArray(preferenceTags) && preferenceTags.length > 0
      ? reRankByPreferenceTags(results, preferenceTags)
      : results;

    await attachRecipeImages(reRanked);

    res.json({
      success: true,
      query: data.query ?? query,
      query_type: data.query_type ?? 'name_based',
      results: reRanked,
      total_results: typeof data.total_results === 'number' ? data.total_results : reRanked.length,
      ingredients: data.ingredients ?? null,
      message: data.message ?? null,
    });
  } catch (error) {
    console.error('❌ Search error:', error);
    const message = error.response?.data?.message || error.message || 'Recipe search failed';
    res.status(500).json({
      success: false,
      message,
      results: [],
      total_results: 0,
    });
  }
});

/**
 * @route   GET /api/ai-recipes/feed
 * @desc    AI-powered feed by category + user profile (preferences, allergens). Replaces Spoonacular/TheMealDB for dashboard.
 * @query   category (optional) - e.g. Italian, Pakistani, Mediterranean
 */
router.get('/feed', async (req, res) => {
  try {
    const category = (req.query.category || '').trim().toLowerCase();
    const userProfile = await getProfileFromRequest(req);
    const preferenceParts = [];
    if (userProfile.dietaryPreferences && userProfile.dietaryPreferences.length > 0) {
      preferenceParts.push(userProfile.dietaryPreferences[0]);
    }
    const categoryLabel = category
      ? category.charAt(0).toUpperCase() + category.slice(1)
      : '';
    const contextQuery = categoryLabel
      ? (preferenceParts.length ? `${categoryLabel} ${preferenceParts[0]} recipes` : `${categoryLabel} recipes`)
      : (preferenceParts.length ? `${preferenceParts[0]} recipes for you` : 'dinner recipes');
    console.log(`📥 AI Feed Request: category=${category || 'none'} -> "${contextQuery}"`);

    let data;
    const result = await aiRecipeService.searchRecipes(
      contextQuery,
      12,
      true,
      userProfile.allergens && userProfile.allergens.length > 0 ? userProfile.allergens : null
    );
    // AI-only: no Node fallback
    if (result.success && result.data && result.data.results && result.data.results.length > 0) {
      data = result.data;
      console.log(`✅ AI (Python) feed returned ${data.results.length} recipes`);
    } else {
      console.log('🔄 AI-only: Python feed returned no results');
      data = { query: contextQuery, query_type: 'name_based', results: [], total_results: 0 };
    }
    const preferenceTags = [...(userProfile.dietaryPreferences || [])];
    if (userProfile.healthGoal && userProfile.healthGoal !== 'maintenance') {
      preferenceTags.push(userProfile.healthGoal);
    }
    if (data.results && preferenceTags.length > 0) {
      data = { ...data, results: reRankByPreferenceTags(data.results, preferenceTags) };
    }
    res.json({
      success: true,
      ...data,
      category: category || null,
    });
  } catch (error) {
    console.error('❌ Feed error:', error);
    res.status(500).json({
      success: false,
      message: 'Feed failed',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-recipes/generate
 * @desc    Generate recipe from ingredients
 * @access  Public (or Protected)
 * 
 * Body: {
 *   ingredients: string[],   // Array of ingredients
 *   numRecipes?: number,     // Optional, default 1
 *   temperature?: number     // Optional, default 1.0 (0.5-2.0)
 * }
 */
router.post('/generate', async (req, res) => {
  try {
    const { ingredients, numRecipes, temperature } = req.body;

    // Validate input
    if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Ingredients array is required and must not be empty'
      });
    }

    console.log(`🧪 Generate Recipe Request: ${ingredients.join(', ')}`);

    // Call AI Recipe Service
    const result = await aiRecipeService.generateRecipe(
      ingredients,
      numRecipes || 1,
      temperature || 1.0
    );

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: 'Recipe generation failed',
        error: result.error
      });
    }

    res.json({
      success: true,
      ...result.data
    });

  } catch (error) {
    console.error('❌ Generation error:', error);
    res.status(500).json({
      success: false,
      message: 'Recipe generation failed',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-recipes/add
 * @desc    Add a recipe to AI searchable database
 * @access  Protected (add auth middleware if needed)
 * 
 * Body: {
 *   title: string,
 *   ingredients: string[],
 *   directions?: string[],
 *   description?: string,
 *   prepTime?: string,
 *   cookTime?: string,
 *   servings?: number
 * }
 */
router.post('/add', async (req, res) => {
  try {
    const recipe = req.body;

    // Validate required fields
    if (!recipe.title || !recipe.ingredients) {
      return res.status(400).json({
        success: false,
        message: 'Title and ingredients are required'
      });
    }

    console.log(`📝 Adding recipe to AI: ${recipe.title}`);

    // Call AI Recipe Service
    const result = await aiRecipeService.addRecipe(recipe);

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: 'Failed to add recipe to AI engine',
        error: result.error
      });
    }

    res.json({
      success: true,
      message: 'Recipe added to AI search database',
      recipe: result.data.recipe
    });

  } catch (error) {
    console.error('❌ Add recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add recipe',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-recipes/stats
 * @desc    Get AI Recipe Engine statistics
 * @access  Public
 */
router.get('/stats', async (req, res) => {
  try {
    const result = await aiRecipeService.getStats();

    if (!result.success) {
      return res.status(503).json({
        success: false,
        message: 'Failed to get stats',
        error: result.error
      });
    }

    res.json({
      success: true,
      ...result.data
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-recipes/examples
 * @desc    Get example queries
 * @access  Public
 */
router.get('/examples', async (req, res) => {
  try {
    const result = await aiRecipeService.getExamples();

    res.json({
      success: true,
      examples: result.data || {
        ingredient_based: [
          "I have chicken, tomatoes, and garlic",
          "chicken, rice, curry powder",
          "pasta, mushrooms, cream"
        ],
        name_based: [
          "pasta carbonara recipe",
          "chicken tikka masala",
          "chocolate cake"
        ]
      }
    });

  } catch (error) {
    res.json({
      success: true,
      examples: {
        ingredient_based: [
          "I have chicken, tomatoes, and garlic",
          "chicken, rice, curry powder"
        ],
        name_based: [
          "pasta carbonara recipe",
          "chicken tikka masala"
        ]
      }
    });
  }
});

/**
 * @route   GET /api/ai-recipes/test
 * @desc    Test route to verify AI connection
 * @access  Public
 */
router.get('/test', async (req, res) => {
  try {
    const health = await aiRecipeService.healthCheck();
    
    res.json({
      success: true,
      message: 'AI Recipe routes are working',
      timestamp: new Date().toISOString(),
      aiEngine: health
    });
  } catch (error) {
    res.json({
      success: false,
      message: 'AI Recipe routes are working but AI engine is not available',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-recipes/allergen-alternatives
 * @desc    Get AI-generated allergen alternatives for recipe ingredients
 * @body    { recipeTitle: string, ingredients: string[], userAllergens?: string[] }
 */
router.post('/allergen-alternatives', async (req, res) => {
  try {
    const { recipeTitle, ingredients, userAllergens } = req.body || {};
    const title = typeof recipeTitle === 'string' ? recipeTitle.trim() : '';
    const ing = Array.isArray(ingredients) ? ingredients : [];
    const result = await aiRecipeGenerator.getAllergenAlternatives(title, ing, userAllergens || []);
    if (result == null) {
      return res.status(503).json({
        success: false,
        message: 'AI is unavailable. Could not load alternatives.'
      });
    }
    return res.json({
      success: true,
      allergens: result.allergens || [],
      alternatives: result.alternatives || []
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || 'Could not load alternatives.'
    });
  }
});

/**
 * @route   POST /api/ai-recipes/missing-ingredients
 * @desc    FE-5: Compute missing ingredients for a recipe given optional user ingredients
 * @body    { recipe: { ingredients: string[] }, userIngredients?: string[] }
 */
router.post('/missing-ingredients', (req, res) => {
  try {
    const { recipe, userIngredients } = req.body || {};
    if (!recipe || !Array.isArray(recipe.ingredients)) {
      return res.status(400).json({
        success: false,
        message: 'recipe.ingredients (array) is required'
      });
    }
    const missing = getMissingIngredients(recipe.ingredients, userIngredients || []);
    res.json({
      success: true,
      missingIngredients: missing,
      recipeTitle: recipe.title || recipe.name
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to compute missing ingredients',
      error: error.message
    });
  }
});

/**
 * @route   POST /api/ai-recipes/add-missing-to-cart
 * @desc    FE-5: Add missing ingredients of a recipe to the grocery cart
 * @body    { recipe: { ingredients: string[], title?: string }, userIngredients?: string[] }
 */
router.post('/add-missing-to-cart', async (req, res) => {
  try {
    const { recipe, userIngredients } = req.body || {};
    if (!recipe || !Array.isArray(recipe.ingredients)) {
      return res.status(400).json({
        success: false,
        message: 'recipe.ingredients (array) is required'
      });
    }
    const missing = getMissingIngredients(recipe.ingredients, userIngredients || []);
    if (missing.length === 0) {
      return res.json({
        success: true,
        message: 'No missing ingredients; you have everything needed.',
        added: 0,
        cart: await cartStore.list()
      });
    }
    const toAdd = missing.map((m) => ({
      name: m.name,
      quantity: 1,
      unit: 'pcs',
      sourceRecipe: recipe.title || recipe.name
    }));
    const added = await cartStore.addMany(toAdd);
    res.json({
      success: true,
      message: `Added ${added.length} missing ingredient(s) to cart`,
      added: added.length,
      missingIngredients: missing,
      cart: await cartStore.list()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to add missing ingredients to cart',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/ai-recipes/cart
 * @desc    Get current grocery cart (for FE-5 / viewCart)
 */
router.get('/cart', async (req, res) => {
  try {
    const cart = await cartStore.list();
    res.json({ success: true, cart });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get cart',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/ai-recipes/cart/:id
 * @desc    Remove item from cart
 */
router.delete('/cart/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'Invalid cart item id' });
    }
    const removed = await cartStore.remove(id);
    if (!removed) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }
    res.json({ success: true, cart: await cartStore.list() });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to remove from cart',
      error: error.message
    });
  }
});

module.exports = router;
