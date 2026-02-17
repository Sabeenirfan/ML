"""
Gemini Recipe Generator for MealVista
=====================================
Uses Google Gemini API to generate a variety of recipes for search queries.
Set GEMINI_API_KEY in .env to enable.
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
    ALLERGENS_LIST,
    normalize_recipe_from_ai,
)

try:
    import google.generativeai as genai
except ImportError:
    genai = None
    print("Gemini: install with pip install google-generativeai")


# Try these in order; first one that works (no 404/429) will be used
GEMINI_MODEL_IDS = ["gemini-2.0-flash", "gemini-1.5-pro", "gemini-1.5-flash", "gemini-pro"]


class GeminiRecipeGenerator:
    """
    Generates diverse recipes using Google's Gemini API.
    """

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = (api_key or os.getenv("GEMINI_API_KEY") or "").strip()
        self.model = None
        self._model_id = None
        if self.api_key and genai:
            try:
                genai.configure(api_key=self.api_key)
                for mid in GEMINI_MODEL_IDS:
                    try:
                        self.model = genai.GenerativeModel(mid)
                        self._model_id = mid
                        print(f"Gemini API enabled (model: {mid}).")
                        break
                    except Exception:
                        continue
                if not self.model:
                    self.model = genai.GenerativeModel(GEMINI_MODEL_IDS[0])
                    self._model_id = GEMINI_MODEL_IDS[0]
                    print(f"Gemini API enabled (model: {self._model_id}).")
            except Exception as e:
                print(f"Gemini init warning: {e}")
                self.model = None
        elif not self.api_key:
            print("Gemini: GEMINI_API_KEY not set in .env")

    def generate_recipes(
        self,
        query: str,
        num_recipes: int = 10,
        include_halal_note: bool = True,
        is_ingredient_query: bool = False,
        from_scratch_term: Optional[str] = None,
    ) -> List[Dict]:
        """
        Generate a variety of recipes for the given search query.
        When is_ingredient_query=True, generate recipes that USE those ingredients.
        When from_scratch_term is set (e.g. "ice cream"), generate ONLY recipes to MAKE that item from scratch.
        """
        if not self.model:
            return []

        halal_instruction = ""
        if include_halal_note:
            halal_instruction = (
                " All recipes MUST be halal: no pork, no alcohol, no non-halal meat. "
            )

        detail_rule = """
CRITICAL - Write for complete beginners who have never cooked:
- INGREDIENTS: List EVERY item with exact quantities. Include ALL spices (e.g. "1 tsp cumin", "1/2 tsp turmeric", "1/4 tsp black pepper", "1/2 tsp salt"), oils ("2 tbsp vegetable oil"), herbs ("2 tbsp fresh coriander, chopped"), aromatics ("3 garlic cloves, minced", "1 inch ginger, grated"), garnishes. No shortcuts – a beginner must be able to shop and measure everything.
- DIRECTIONS: Give 8–15 detailed steps, not 3 vague ones. For each step specify: heat level (e.g. "medium heat"), time (e.g. "sauté for 3–4 minutes until onions are soft"), what to look for (e.g. "until golden brown"), when to add what. For baking, give temperature (e.g. "180°C / 350°F") and time. So a person who has never cooked can follow and succeed.
"""
        nutrition_rule = NUTRITION_ASSISTANT_RULES + """
- For each recipe: use exact ingredient quantities in g, ml, tbsp, tsp, or cup. Calculate nutrition from those ingredients using standard food data; do not guess. Include Vitamin D in micronutrients when relevant (e.g. fish, egg yolk, fortified foods). Allergens: only from """ + str(ALLERGENS_LIST) + " – or []."
        if is_ingredient_query:
            prompt = f"""The user has these INGREDIENTS: "{query}".

Generate exactly {num_recipes} DIFFERENT recipes that USE these ingredients. Each recipe must use these ingredients as main components; add full pantry items (spices, oil, salt, onions, garlic, etc.) with quantities. Give variety: e.g. for "chicken, rice, tomatoes" → Chicken Tomato Rice, One-Pot Chicken Rice, Stuffed Tomatoes with Chicken and Rice, etc.{detail_rule}{halal_instruction}
NUTRITION: For each recipe you MUST compute calories and macros FROM the ingredients list you write: sum the nutritional values of those ingredients (by quantity), then divide by servings. No generic or pre-written numbers – only what is actually in that recipe.{nutrition_rule}

""" + JSON_FORMAT_INSTRUCTION + """
Return ONLY a valid JSON array of """ + str(num_recipes) + """ recipe objects. No markdown, no code fences, no text outside JSON.
"""
        else:
            from_scratch_prefix = ""
            if from_scratch_term:
                from_scratch_prefix = f"""CRITICAL - USER WANTS TO MAKE "{from_scratch_term.upper()}" FROM SCRATCH:
You MUST return ONLY recipes for MAKING homemade {from_scratch_term}. Ingredients must be RAW/BASE ingredients (e.g. for ice cream: cream, milk, sugar, egg yolks, vanilla - NOT "ice cream" as an ingredient). NEVER list "{from_scratch_term}" as an ingredient - that would mean using store-bought. No sundaes, pops, cakes, or soups that use {from_scratch_term} as an ingredient. The recipe title should be like "Homemade Vanilla Ice Cream" or "Classic Ice Cream from Scratch".

"""
            prompt = f"""You are a professional chef with deep knowledge of WORLD cuisines: Indian, Pakistani, Bangladeshi, Middle Eastern, Turkish, Thai, Chinese, Japanese, Korean, Vietnamese, Italian, French, Spanish, Mexican, North African, Greek, and all other regional cuisines. The user searched for: "{query}".
{from_scratch_prefix}IMPORTANT: Generate exactly {num_recipes} DIFFERENT recipes - each must be a distinct dish, not repeats. Honor the cuisine the user asks for (e.g. "Pakistani biryani" → Pakistani-style; "Indian curry" → Indian-style; "Thai soup" → Thai; generic "biryani" can include Indian and Pakistani varieties).

- If the search is for something people MAKE FROM SCRATCH (e.g. "ice cream", "yogurt", "bread", "butter", "mayonnaise"): give the recipe TO MAKE THAT ITEM from scratch. Ingredients = raw/base only (cream, milk, sugar for ice cream - never "ice cream" as an ingredient). No sundaes, pops, or dishes that use the ready-made product.
- If the search is a DISH NAME (e.g. biryani, curry, pulao, karahi, dal, naan): give DIFFERENT VARIETIES. Examples:
  * For "biryani" → Chicken Biryani, Lamb Biryani, Hyderabadi Biryani, Pakistani Beef Biryani, Vegetable Biryani, Egg Biryani, etc. (each with its own full recipe).
  * For "curry" → Chicken Curry, Lamb Curry, Chana Curry, Fish Curry, Potato Curry, Thai Green Curry, etc.
  * For "pasta" (as a dish): Pasta Carbonara, Pasta Alfredo, Aglio e Olio, Pasta Primavera, etc.
- If the search is a CUISINE (e.g. "Pakistani", "Indian", "Thai"): give authentic dishes from that cuisine (e.g. Pakistani: biryani, karahi, nihari, haleem, daal; Indian: curries, biryani, dosa, pav bhaji / pao bhaji, etc.).
- If the search is "pao bhaji", "pav bhaji", or "pav bhaji (pao bhaji)": return Pav Bhaji (Indian street food – spiced vegetable mash with buttered bread rolls). Treat both spellings as the same dish.
- If the search is INGREDIENTS: create DIFFERENT DISHES from various cuisines using those ingredients.

Each recipe must have a UNIQUE title.{detail_rule}{halal_instruction}
NUTRITION: For each recipe, CALCULATE calories and macros FROM the ingredients you list; use exact quantities in g/ml/tbsp/cup. No generic values.{nutrition_rule}

""" + JSON_FORMAT_INSTRUCTION + """
Return ONLY a valid JSON array of {num_recipes} recipe objects. No markdown, no code fences, no extra text.
"""

        def _num(x, default: float = 0) -> float:
            if x is None:
                return default
            try:
                return float(x) if isinstance(x, (int, float)) else float(str(x).strip().replace(",", ""))
            except (ValueError, TypeError):
                return default

        def parse_response(text: str) -> List[Dict]:
            if not text:
                return []
            text = re.sub(r"^```(?:json)?\s*", "", text)
            text = re.sub(r"\s*```\s*$", "", text)
            text = text.strip()
            recipes = json.loads(text)
            if not isinstance(recipes, list):
                recipes = [recipes] if isinstance(recipes, dict) else []
            out = []
            for r in recipes:
                recipe = normalize_recipe_from_ai(r)
                if recipe:
                    out.append(recipe)
            return out

        model_ids_to_try = list(GEMINI_MODEL_IDS)
        for model_id in model_ids_to_try:
            if not model_id:
                continue
            try:
                model = genai.GenerativeModel(model_id)
                response = model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.9,
                        max_output_tokens=8192,
                    ),
                )
                text = (response.text or "").strip()
                if not text:
                    print(f"Gemini ({model_id}): empty response.")
                    continue
                return parse_response(text)
            except json.JSONDecodeError as e:
                print(f"Gemini ({model_id}) JSON parse error: {e}")
                continue
            except Exception as e:  # 404, 429, network, etc.
                err_str = str(e).lower()
                if "404" in err_str or "not found" in err_str:
                    print(f"Gemini ({model_id}): model not available (404). Trying next model.")
                elif "429" in err_str or "quota" in err_str or "rate" in err_str:
                    print(f"Gemini ({model_id}): QUOTA EXCEEDED. Free tier limit hit. See https://ai.google.dev/gemini-api/docs/rate-limits")
                else:
                    print(f"Gemini ({model_id}) error: {e}")
                continue

        print("Gemini: all models failed (404 or quota). Recipes will come from database only.")
        return []
