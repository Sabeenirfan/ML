"""
Groq Recipe Generator for MealVista
===================================
Uses Groq API (free tier, cloud) to generate recipes at runtime.
No local models – runs in the cloud, so your laptop stays fast.
Set GROQ_API_KEY in .env to enable. Used when Gemini quota is exceeded.
"""

import json
import os
import re
from typing import List, Dict, Optional
from dotenv import load_dotenv

current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(current_dir, "..", ".env"))

from nutrition_assistant_rules import (
    NUTRITION_ASSISTANT_RULES,
    JSON_FORMAT_INSTRUCTION,
    RECIPE_AI_STRICT_SPEC,
    ALLERGENS_LIST,
    normalize_recipe_from_ai,
)

try:
    from groq import Groq
except ImportError:
    Groq = None

# Models to try in order (production only; llama-3.1-70b is decommissioned – see https://console.groq.com/docs/models)
GROQ_MODELS = [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "openai/gpt-oss-20b",
]


def _num(x, default: float = 0) -> float:
    if x is None:
        return default
    try:
        return float(x) if isinstance(x, (int, float)) else float(str(x).strip().replace(",", ""))
    except (ValueError, TypeError):
        return default


def _parse_recipes_from_text(text: str) -> List[Dict]:
    if not text:
        return []
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    try:
        recipes = json.loads(text)
    except json.JSONDecodeError:
        return []
    if not isinstance(recipes, list):
        recipes = [recipes] if isinstance(recipes, dict) else []
    out = []
    for r in recipes:
        recipe = normalize_recipe_from_ai(r)
        if recipe:
            out.append(recipe)
    return out


DETAIL_RULE = """
CRITICAL - Write for complete beginners who have never cooked:

INGREDIENTS: List EVERY item with exact quantities in grams (g), milliliters (ml), or standard units (tbsp, tsp, cup). Include ALL spices, oils, herbs, aromatics, garnishes.

DIRECTIONS – YOU MUST GIVE 10–18 DETAILED STEPS (minimum 10). Never output only 3 or 4 vague steps.

Each step must be ONE clear action. When relevant, include:
- Heat level: low / medium / medium-high / high
- Time: e.g. "5–7 minutes", "until golden"
- What to look for: e.g. "until onions are golden brown", "until fragrant", "until oil separates from the masala"

Start from the very beginning: first step = turn on heat and add first fat or ingredient (e.g. "Heat 2 tbsp oil in a large pot over medium-high heat. Add cumin seeds and let sizzle for 30 seconds.").
For layered dishes (e.g. biryani, pulao): include separate steps for marinating (if any), preparing rice, frying onions/meat, layering, covered cooking/dum, and resting.
For baking: give oven temperature (e.g. 180°C / 350°F) and bake time in the relevant step.

FORBIDDEN – never output generic steps like these:
- "Collect or prepare the ingredients"
- "Cook the dish" or "Make the recipe"
- "Serve" as a standalone step (you may end with "Rest for 5 minutes, then serve hot with raita.")

GOOD step examples:
- "Heat 2 tbsp oil in a large pot over medium-high. Add cumin seeds and let sizzle for 30 seconds."
- "Add sliced onions and fry for 6–8 minutes, stirring occasionally, until golden brown."
- "Add ginger-garlic paste and fry for 1 minute until fragrant. Add tomatoes and cook for 4–5 minutes until soft and oil separates."
- "Stir in the marinated chicken and cook for 8–10 minutes over medium heat until the meat is no longer pink."
- "Layer half the rice over the meat, then the remaining meat, then the rest of the rice. Drizzle saffron milk on top. Cover with a tight lid and cook on low (dum) for 20–25 minutes."
"""
NUTRITION_RULE = NUTRITION_ASSISTANT_RULES + """
- Calculate nutrition from actual ingredients (standard food data). Include Vitamin D in micronutrients when relevant. Allergens only from """ + str(ALLERGENS_LIST) + " – or []."


RECIPE_AI_ROLE = RECIPE_AI_STRICT_SPEC + "\n\nReturn ONLY valid JSON (array of recipe objects). No markdown, no code fences. Each recipe must include name, servings, ingredients (with name and quantity), instructions, image_url and/or image_description, nutrition (calories, macros, micronutrients), and allergens."


def get_recipes_prompt(query: str, num_recipes: int, halal: bool, is_ingredient_query: bool = False, from_scratch_term: Optional[str] = None) -> str:
    halal_instruction = " All recipes MUST be halal: no pork, no alcohol, no non-halal meat. " if halal else ""
    if is_ingredient_query:
        return RECIPE_AI_ROLE + f"""
The user has these INGREDIENTS: "{query}".

Generate exactly {num_recipes} DIFFERENT recipes that USE these ingredients. Add full pantry items (spices, oil, salt, onions, garlic) with quantities. Give variety: e.g. Chicken Tomato Rice, One-Pot Chicken Rice, Stuffed Tomatoes with Chicken and Rice.
DESCRIPTION: For each recipe include "description": 1-2 sentences that accurately describe the dish. DIRECTIONS must match the recipe.{DETAIL_RULE}{halal_instruction}
For each recipe: compute nutrition FROM the ingredients you list – sum calories/macros for those ingredients (by quantity), divide by servings. No generic numbers; only what is actually in that recipe.{NUTRITION_RULE}

""" + JSON_FORMAT_INSTRUCTION + f"""
Each recipe must include name/title, ingredients (with quantities), instructions (step-by-step), image_description (final plated dish for image matching), nutrition, allergens. Return ONLY a valid JSON array of {num_recipes} recipe objects. No markdown, no code fences."""
    from_scratch_prefix = ""
    if from_scratch_term:
        from_scratch_prefix = f"""CRITICAL - USER WANTS TO MAKE "{from_scratch_term.upper()}" FROM SCRATCH:
Return ONLY recipes for MAKING homemade {from_scratch_term}. Ingredients must be RAW/BASE (e.g. ice cream: cream, milk, sugar, egg yolks, vanilla). NEVER list "{from_scratch_term}" as an ingredient. No sundaes, pops, or dishes using store-bought {from_scratch_term}.

"""
    return RECIPE_AI_ROLE + f"""
You are a professional chef with knowledge of WORLD cuisines: Indian, Pakistani, Bangladeshi, Middle Eastern, Thai, Chinese, Japanese, Italian, Mexican, and all others. The user searched for: "{query}".
{from_scratch_prefix}Generate exactly {num_recipes} DIFFERENT recipes - each a distinct dish. Honor the cuisine asked for (e.g. Pakistani biryani, Indian curry, Thai soup).

FROM-SCRATCH: If the user wants "ice cream", "yogurt", "bread", etc., give the recipe TO MAKE that item from scratch (raw ingredients only). Do NOT give recipes that use the product as an ingredient.

If DISH NAME give varieties (e.g. Chicken Biryani, Lamb Biryani, Pakistani Beef Biryani). "pao bhaji" and "pav bhaji" are the same Indian street food – return Pav Bhaji (spiced vegetable mash with buttered pav). If user asks for a CUISINE (e.g. "Pakistani", "Indian") give authentic dishes from that cuisine. If INGREDIENTS create different dishes from various cuisines using them.
DESCRIPTION: For each recipe include a "description" field: 1-2 sentences that accurately describe the dish (taste, style, key ingredients). No generic text – must match this specific recipe.
DIRECTIONS: Instructions must be step-by-step and exactly match the ingredients and title of the recipe (no copy-paste from other dishes).{DETAIL_RULE}{halal_instruction}
NUTRITION: For each recipe, CALCULATE calories and macros FROM the ingredients you list – sum nutritional values for those exact ingredients and quantities, divide by servings. The numbers must match what is actually in the recipe (no generic 300 kcal for everything).{NUTRITION_RULE}

""" + JSON_FORMAT_INSTRUCTION + f"""
Each recipe must include name/title, ingredients (with quantities), instructions (step-by-step), image_description (final plated dish for image matching), nutrition, allergens. Return ONLY a valid JSON array of {num_recipes} recipe objects. No markdown, no code fences."""


class GroqRecipeGenerator:
    """Generate recipes at runtime using Groq API (free tier, cloud – no load on your laptop)."""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or os.getenv("GROQ_API_KEY") or "").strip()
        self.client = None
        if self.api_key and Groq:
            try:
                self.client = Groq(api_key=self.api_key)
                print("Groq API enabled for runtime recipe generation (cloud, free tier).")
            except Exception as e:
                print(f"Groq init warning: {e}")
                self.client = None
        elif not self.api_key:
            print("Groq: GROQ_API_KEY not set in .env (optional fallback when Gemini quota is exceeded).")

    def generate_recipes(
        self,
        query: str,
        num_recipes: int = 10,
        include_halal_note: bool = True,
        is_ingredient_query: bool = False,
        from_scratch_term: Optional[str] = None,
    ) -> List[Dict]:
        """Generate recipes at runtime. When from_scratch_term is set (e.g. 'ice cream'), return only from-scratch recipes."""
        if not self.client:
            return []

        prompt = get_recipes_prompt(query, num_recipes, include_halal_note, is_ingredient_query, from_scratch_term)

        for model_id in GROQ_MODELS:
            try:
                response = self.client.chat.completions.create(
                    messages=[{"role": "user", "content": prompt}],
                    model=model_id,
                    temperature=0.9,
                    max_tokens=8192,
                )
                text = (response.choices[0].message.content or "").strip()
                if not text:
                    continue
                recipes = _parse_recipes_from_text(text)
                if recipes:
                    print(f"Groq ({model_id}) returned {len(recipes)} recipes.")
                    return recipes
            except Exception as e:
                err = str(e).lower()
                if "rate" in err or "429" in err or "quota" in err:
                    print(f"Groq ({model_id}): rate limit. Trying next model.")
                else:
                    print(f"Groq ({model_id}) error: {e}")
                continue

        print("Groq: all models failed.")
        return []


# --- AI Recipe Recommendation Engine (profile-based, no database) ---

RECOMMENDATION_SYSTEM_PROMPT = """You are the AI Recipe Recommendation Engine for a meal planning app.
You GENERATE recipes dynamically. You DO NOT fetch from a database.

OBJECTIVE: Generate exactly 5 or 6 personalized recipes that strictly follow the user's dietary preferences, allergens, and health goals. Never return fewer than 5.

STRICT SAFETY (MANDATORY):
- If user is dairy-free: NEVER include milk, butter, cream, cheese, yogurt, ghee, whey, casein.
- If vegan: NO animal products (no meat, fish, eggs, dairy, honey).
- If halal: NO pork or alcohol.
- If an ingredient is in the user's allergens list, the recipe MUST NOT include it.

HEALTH GOAL:
- Weight loss: lower calories, high protein, lower refined carbs.
- Maintain: balanced macros.
- Weight gain: higher calories, nutrient-dense meals.

DIVERSITY: The 5-6 recipes must be different dishes with variety (e.g. bowl, curry, salad, stir-fry). Do not repeat the same main ingredient.

Return ONLY valid JSON in this exact format (no markdown, no code fence). Include "image_description" for the final plated dish so the system can attach a matching image. Recipe instructions and image_description must match exactly.
{
  "recommendations": [
    {
      "title": "Recipe name",
      "description": "1-2 sentence description",
      "ingredients": ["quantity unit ingredient", "..."],
      "instructions": ["Step 1...", "Step 2...", "..."],
      "image_description": "Short description of the final plated dish",
      "calories": 350,
      "protein": 25,
      "carbs": 30,
      "fat": 12,
      "nutrition": {"calories": 350, "protein": 25, "carbs": 30, "fat": 30, "micronutrients": {}},
      "allergens": [],
      "prep_time": "15 min",
      "cook_time": "25 min",
      "servings": 4,
      "tags": ["tag1", "tag2"],
      "reason": "Why this matches the profile"
    }
  ]
}"""


def _build_recommendation_user_prompt(profile: Dict) -> str:
    prefs = profile.get("dietaryPreferences") or []
    allergens = profile.get("allergens") or []
    goal = (profile.get("healthGoal") or "maintain").lower()
    cuisines = profile.get("preferredCuisines") or []
    parts = [
        "Generate 5 or 6 personalized recipes for this user profile:",
        f"- Dietary preferences: {', '.join(prefs) if prefs else 'none specified'}",
        f"- Allergens to AVOID (must not appear in any recipe): {', '.join(allergens) if allergens else 'none'}",
        f"- Health goal: {goal}",
    ]
    if cuisines:
        parts.append(f"- Preferred cuisines: {', '.join(cuisines)}")
    parts.append("\nRemember: strict dietary and allergen rules. Output only the JSON object.")
    return "\n".join(parts)


def _recipe_text(recipe: Dict) -> str:
    """All searchable text from a recipe for violation checks."""
    title = (recipe.get("title") or recipe.get("name") or "").lower()
    desc = (recipe.get("description") or "").lower()
    ings = recipe.get("ingredients") or []
    ing_str = " ".join(
        (i.get("name", i) if isinstance(i, dict) else str(i)).lower() for i in ings
    )
    return f"{title} {desc} {ing_str}"


def _recipe_violates_profile(recipe: Dict, profile: Dict) -> bool:
    """True if recipe violates dietary or allergen rules."""
    text = _recipe_text(recipe)
    prefs = [str(p).lower() for p in (profile.get("dietaryPreferences") or [])]
    allergens = [str(a).lower() for a in (profile.get("allergens") or [])]

    for a in allergens:
        if a and a in text:
            return True
    if "dairy-free" in prefs or "dairy free" in prefs:
        for w in ["milk", "butter", "cream", "cheese", "yogurt", "ghee", "whey", "casein"]:
            if w in text:
                return True
    if "vegan" in prefs:
        for w in ["chicken", "beef", "pork", "fish", "egg", "meat", "shrimp", "lamb", "turkey", "bacon", "ham", "dairy", "milk", "cheese", "honey"]:
            if w in text:
                return True
    if "halal" in prefs:
        if "pork" in text or "bacon" in text or "alcohol" in text or "wine" in text or "beer" in text:
            return True
    return False


def _parse_recommendation_response(text: str) -> List[Dict]:
    """Parse JSON from model response."""
    if not text:
        return []
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```\s*$", "", text)
    text = text.strip()
    try:
        data = json.loads(text)
        recs = data.get("recommendations")
        return list(recs) if isinstance(recs, list) else []
    except json.JSONDecodeError:
        return []


def _to_engine_recipe(rec: Dict, rank: int) -> Dict:
    """Convert recommendation item to engine result shape (recipe + rank)."""
    title = rec.get("title") or rec.get("name") or "Recipe"
    return {
        "type": "generated",
        "recipe": {
            "title": title,
            "name": title,
            "description": rec.get("description", ""),
            "ingredients": rec.get("ingredients", []),
            "instructions": rec.get("instructions", rec.get("directions", [])),
            "calories": rec.get("calories", 350),
            "protein": rec.get("protein"),
            "carbs": rec.get("carbs"),
            "fat": rec.get("fat"),
            "prep_time": rec.get("prep_time", "15 min"),
            "cook_time": rec.get("cook_time", "25 min"),
            "servings": rec.get("servings", 4),
            "tags": rec.get("tags", []),
            "reason": rec.get("reason", ""),
        },
        "rank": rank,
    }


def generate_personalized_recommendations(
    groq_generator: "GroqRecipeGenerator",
    profile: Dict,
    min_recipes: int = 5,
    max_retries: int = 2,
) -> List[Dict]:
    """
    Generate 5-6 personalized recipes from user profile. No database.
    Validates each recipe; retries until at least min_recipes valid or max_retries.
    Returns list of engine result items: { type, recipe, rank }.
    """
    if not groq_generator.client:
        return []

    user_prompt = _build_recommendation_user_prompt(profile)
    full_prompt = RECOMMENDATION_SYSTEM_PROMPT + "\n\n" + user_prompt

    for attempt in range(max_retries + 1):
        for model_id in GROQ_MODELS:
            try:
                response = groq_generator.client.chat.completions.create(
                    messages=[{"role": "user", "content": full_prompt}],
                    model=model_id,
                    temperature=0.7,
                    max_tokens=8192,
                )
                text = (response.choices[0].message.content or "").strip()
                raw = _parse_recommendation_response(text)
                valid = []
                for r in raw:
                    if _recipe_violates_profile(r, profile):
                        continue
                    valid.append(r)
                if len(valid) >= min_recipes:
                    out = [_to_engine_recipe(valid[i], i + 1) for i in range(len(valid))]
                    print(f"Recommendations: {len(out)} valid from Groq ({model_id}).")
                    return out
            except Exception as e:
                print(f"Groq ({model_id}) recommend error: {e}")
                continue
        if attempt < max_retries:
            print(f"Recommendation attempt {attempt + 1} had <{min_recipes} valid; retrying.")
    print("Recommendations: failed to get at least 5 valid recipes.")
    return []
