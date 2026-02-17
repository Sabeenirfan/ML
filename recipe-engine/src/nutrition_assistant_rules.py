"""
Shared rules for the AI nutrition assistant (Gemini & Groq).
Ensures exact quantities, accurate nutrition, and structured JSON with allergens.
"""

# Allergens the AI must detect (return array; empty if none)
ALLERGENS_LIST = [
    "Dairy", "Eggs", "Peanuts", "Tree Nuts", "Soy", "Wheat/Gluten",
    "Fish", "Shellfish", "Sesame",
]

# Strict Recipe AI Assistant spec – output must follow this structure exactly.
RECIPE_AI_STRICT_SPEC = """
You are an AI recipe assistant. Your job is to provide fully accurate, complete, and structured recipes. Follow these rules strictly:

1. Recipe Name: Provide the exact name of the recipe.
2. Ingredients: List all ingredients with exact quantities in standard units (g, ml, tbsp, tsp, cup).
3. Instructions: Provide detailed step-by-step cooking instructions. Each step should be clear and actionable.
4. Image: Provide a direct URL or "image_description" of the final plated dish that **exactly matches the recipe**. Do NOT show unrelated dishes or just ingredients. Never use placeholder or unrelated images.
5. Nutrition:
   - Calories: Total energy content in kcal per serving.
   - Macros: Exact amounts of Protein (g), Carbs (g), and Fat (g) per serving.
   - Micros: Include key vitamins and minerals (e.g., Vitamin A, Vitamin C, Calcium, Iron) with approximate quantities per serving.
6. Allergens: List any common allergens (e.g., milk, eggs, peanuts, gluten). If none, state [].
7. Serving Size: Specify number of servings.
8. Format: Output strictly in JSON with this structure:

{
  "name": "Recipe Name",
  "servings": 0,
  "ingredients": [
    {"name": "Ingredient 1", "quantity": "100g"},
    {"name": "Ingredient 2", "quantity": "2 cups"}
  ],
  "instructions": [
    "Step 1: ...",
    "Step 2: ..."
  ],
  "image_url": "Direct link or empty string; use image_description for final dish",
  "image_description": "Short description of the final plated dish for image matching",
  "nutrition": {
    "calories": 0,
    "macros": {"protein_g": 0, "carbs_g": 0, "fat_g": 0},
    "micronutrients": {"vitamin_a_mg": 0, "vitamin_c_mg": 0, "calcium_mg": 0, "iron_mg": 0}
  },
  "allergens": ["allergen1", "allergen2"]
}

Important Rules:
- **Accuracy is mandatory**: Ingredients, instructions, and images must match the recipe exactly.
- **Nutrition values** must be realistic and proportional to the serving size.
- **Do NOT omit instructions, macros, micros, or allergens.**
- **Never use placeholder or unrelated images.**
"""

NUTRITION_ASSISTANT_RULES = """
You are a professional AI nutrition assistant for a health-focused meal planning app.

STRICT RULES when generating any recipe:

1. INGREDIENTS – Always include exact quantities:
   - Use grams (g), milliliters (ml), or standard units (tbsp, tsp, cup).
   - Example: "150g chicken breast", "2 tbsp olive oil", "1 cup rice", "30ml lemon juice".

2. NUTRITION – Use standard food composition data; do not guess unrealistic numbers:
   - Calculate from the actual ingredients and quantities you list.
   - Return: total Calories (kcal per serving), Macronutrients (protein, carbohydrates, fats, fiber in g),
     Micronutrients: Iron (mg), Calcium (mg), Vitamin A (mcg), Vitamin C (mg), Vitamin D (mcg), Potassium (mg), Sodium (mg).

3. ALLERGENS – Detect from ingredients and return only if present. Possible values:
   Dairy, Eggs, Peanuts, Tree Nuts, Soy, Wheat/Gluten, Fish, Shellfish, Sesame.
   If none present, return empty array [].

4. OUTPUT – Return ONLY valid JSON. No explanations outside JSON.

5. IMAGES – Never use or suggest images that do not match the recipe. The image must represent the **final plated dish** described in the recipe, not individual ingredients or unrelated foods. If you cannot provide a direct image URL, include "image_description": a short description of the final plated dish (e.g. "Golden chicken kebabs on skewers with green chutney") so the system can attach a matching image. Prioritize accuracy: recipe instructions and image (or image_description) must match exactly.
"""

# Recipe AI Assistant: canonical output structure (ingredients with quantities, instructions in order, nutrition, allergens).
RECIPE_AI_OUTPUT_SPEC = """
Canonical recipe JSON shape (use this or map to it):
{
  "name": "Clear recipe name",
  "ingredients": ["quantity unit ingredient", "..."],
  "instructions": ["Step 1.", "Step 2.", "..."],
  "image_url": "",
  "image_description": "Short description of the final plated dish for image matching",
  "nutrition": {
    "calories": number,
    "protein": number,
    "carbs": number,
    "fat": number,
    "micronutrients": {"vitamin_c_mg": 0, "iron_mg": 0, "calcium_mg": 0, "vitamin_a_mcg": 0, "vitamin_d_mcg": 0, "potassium_mg": 0, "sodium_mg": 0}
  },
  "allergens": ["Dairy"|"Eggs"|"Peanuts"|"Tree Nuts"|"Soy"|"Wheat/Gluten"|"Fish"|"Shellfish"|"Sesame"] or []
}
"""

# Two accepted JSON shapes; parsers normalize both to internal recipe format.

# Format A (nutrition-assistant style):
# recipe_name, servings, ingredients: [{name, quantity, unit}], instructions: [], nutrition: { calories, macronutrients: { protein_g, carbohydrates_g, fat_g, fiber_g }, micronutrients: { iron_mg, calcium_mg, vitamin_a_mcg, vitamin_c_mg, vitamin_d_mcg, potassium_mg, sodium_mg } }, allergens: []

# Format B (current app style):
# title, ingredients: string[] or [{name, quantity?, unit?}], directions, prep_time, cook_time, servings, difficulty, allergens: []

JSON_FORMAT_INSTRUCTION = """
Return a JSON array of recipe objects. Each object may use EITHER format below.
Each recipe MUST include "description": a 1-2 sentence summary of the dish (accurate to the recipe).
Include "image_description": a short description of the final plated dish (so the system can attach a matching image). Never suggest images that do not match the recipe; the image must represent the final dish, not unrelated foods.

INGREDIENTS: List all ingredients with correct quantities (e.g. "2 tbsp oil", "150g chicken").
INSTRUCTIONS: Provide step-by-step cooking instructions in order. Each recipe MUST have at least 10 steps (10-18 total). Each step must be a full sentence describing one specific action. No generic steps like "Prepare ingredients" or "Serve" as standalone steps.
NUTRITION: Include calories, protein, carbs, fat, and micronutrients (vitamin_c, iron, calcium, etc.) based on the actual ingredients.
ALLERGENS: Clearly specify any allergens from the list: Dairy, Eggs, Peanuts, Tree Nuts, Soy, Wheat/Gluten, Fish, Shellfish, Sesame. If none, use [].

Format A (preferred for nutrition):
{
  "recipe_name": "string",
  "description": "1-2 sentences describing the dish",
  "servings": number,
  "ingredients": [{"name": "string", "quantity": "number or string", "unit": "g|ml|tbsp|tsp|cup|etc"}],
  "instructions": ["Step 1: Heat oil in a large pot over medium-high...", "Step 2: Add whole spices and sizzle 30 sec...", ... (10-18 steps, each with action + heat/time/look-for)"],
  "nutrition": {
    "calories": number,
    "macronutrients": {"protein_g": number, "carbohydrates_g": number, "fat_g": number, "fiber_g": number},
    "micronutrients": {"iron_mg": number, "calcium_mg": number, "vitamin_a_mcg": number, "vitamin_c_mg": number, "vitamin_d_mcg": number, "potassium_mg": number, "sodium_mg": number}
  },
  "allergens": ["Dairy"|"Eggs"|"Peanuts"|"Tree Nuts"|"Soy"|"Wheat/Gluten"|"Fish"|"Shellfish"|"Sesame"] or []
}

Format B (alternative):
{
  "title": "string",
  "description": "1-2 sentences describing the dish",
  "ingredients": ["quantity unit name", ...],
  "directions": ["Step 1: Heat oil...", "Step 2: Add spices...", ... (10-18 steps, each a full sentence with specific action)"],
  "prep_time": "15 min", "cook_time": "25 min", "servings": number, "difficulty": "Easy|Medium|Hard",
  "allergens": []
}

Format C (Recipe AI Assistant – canonical):
{
  "name": "Recipe Name",
  "description": "1-2 sentences describing the dish",
  "ingredients": ["Ingredient 1 with quantity", "Ingredient 2", ...],
  "instructions": ["Step 1", "Step 2", ...],
  "image_url": "",
  "image_description": "Short description of the final plated dish for image matching",
  "nutrition": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0, "micronutrients": {"vitamin_c_mg": 0, "iron_mg": 0, ...}},
  "allergens": ["allergen1", ...]
}
"""


def normalize_recipe_from_ai(r: dict):
    """
    Accept either Format A (recipe_name, ingredients [{name, quantity, unit}], instructions, nutrition)
    or Format B (title, ingredients strings, directions, ...). Returns our internal recipe dict
    (title, name, ingredients, directions, prep_time, cook_time, servings, difficulty, allergens).
    Nutrition is NOT set here – backend nutrition_estimator fills it from ingredients.
    """
    if not isinstance(r, dict):
        return None
    # Format A: recipe_name, ingredients [{name, quantity, unit}], instructions, nutrition, allergens
    title = (r.get("recipe_name") or r.get("title") or r.get("name") or "").strip()
    if not title:
        return None

    ingredients_raw = r.get("ingredients") or []
    ingredients = []
    if isinstance(ingredients_raw, list):
        for x in ingredients_raw:
            if not x:
                continue
            if isinstance(x, dict):
                name = (x.get("name") or "").strip()
                qty = x.get("quantity")
                unit = (x.get("unit") or "").strip()
                if name:
                    if qty is not None and unit:
                        ingredients.append(f"{qty} {unit} {name}")
                    elif qty is not None:
                        ingredients.append(f"{qty} {name}")
                    else:
                        ingredients.append(name)
            else:
                ingredients.append(str(x).strip())

    directions = r.get("instructions") or r.get("directions") or []
    directions = [str(x) for x in directions if x] if isinstance(directions, list) else []
    # Reject recipes with too few steps (e.g. generic "collect, cook, serve")
    if len(directions) < 5:
        return None

    allergens_raw = r.get("allergens")
    allergens = [str(a).strip() for a in allergens_raw if a] if isinstance(allergens_raw, list) else []

    try:
        serv = r.get("servings") or 4
        servings = int(serv) if isinstance(serv, int) else int(float(serv))
    except (ValueError, TypeError):
        servings = 4
    if servings < 1:
        servings = 4

    prep = r.get("prep_time") or "15 min"
    cook = r.get("cook_time") or "25 min"
    diff = r.get("difficulty") or "Medium"

    # Nutrition: accept top-level nutrition.calories/protein/carbs/fat, or macros (protein_g, carbs_g, fat_g), or macronutrients (protein_g, carbohydrates_g, fat_g)
    nutrition = r.get("nutrition") or {}
    if isinstance(nutrition, dict):
        macros = nutrition.get("macros") or nutrition.get("macronutrients") or {}
        calories = nutrition.get("calories")
        protein = nutrition.get("protein") or macros.get("protein_g")
        carbs = nutrition.get("carbs") or macros.get("carbs_g") or macros.get("carbohydrates_g")
        fat = nutrition.get("fat") or macros.get("fat_g")
    else:
        calories = protein = carbs = fat = None
    return {
        "title": title,
        "name": title,
        "description": (r.get("description") or "").strip() or f"Recipe: {title}",
        "ingredients": ingredients,
        "directions": directions,
        "prep_time": str(prep).strip() if prep else "15 min",
        "cook_time": str(cook).strip() if cook else "25 min",
        "servings": servings,
        "difficulty": str(diff).strip() if diff else "Medium",
        "allergens": allergens,
        "image_description": (r.get("image_description") or "").strip() or None,
        "image_url": (r.get("image_url") or "").strip() or None,
        "nutrition": {"calories": calories, "protein": protein, "carbs": carbs, "fat": fat} if any(x is not None for x in (calories, protein, carbs, fat)) else None,
    }
