"""
Large Recipe Database for MealVista
Provides diverse recipe collection to supplement AI generation.
Optionally load more recipes from a JSON file (e.g. Recipe1M+ or Kaggle export)
via RECIPE_JSON_PATH env var or default path data/recipes.json (no training; retrieval only).
"""

import os
import json

RECIPE_DATABASE = [
    # Chicken Recipes
    {"title": "Classic Roast Chicken", "ingredients": ["chicken", "butter", "garlic", "herbs", "lemon"], "description": "Perfect roasted chicken with crispy skin",
        "cuisine": "American", "prep_time": "15 mins", "cook_time": "1 hour", "servings": 4, "difficulty": "Easy"},
    {"title": "Chicken Tikka Masala", "ingredients": ["chicken", "yogurt", "tomatoes", "cream", "garam masala", "garlic", "ginger"],
        "description": "Creamy Indian curry with marinated chicken", "cuisine": "Indian", "prep_time": "30 mins", "cook_time": "40 mins", "servings": 6, "difficulty": "Medium"},
    {"title": "Chicken Parmesan", "ingredients": ["chicken breast", "breadcrumbs", "parmesan", "mozzarella", "marinara sauce"],
        "description": "Breaded chicken with cheese and tomato sauce", "cuisine": "Italian", "prep_time": "20 mins", "cook_time": "30 mins", "servings": 4, "difficulty": "Medium"},
    {"title": "Chicken Stir Fry", "ingredients": ["chicken", "vegetables", "soy sauce", "ginger", "garlic", "sesame oil"],
        "description": "Quick Asian-style stir fry", "cuisine": "Asian", "prep_time": "15 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Chicken Alfredo", "ingredients": ["chicken", "fettuccine", "cream", "parmesan", "garlic", "butter"],
        "description": "Creamy pasta with chicken", "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "20 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Buffalo Chicken Wings", "ingredients": ["chicken wings", "hot sauce", "butter", "blue cheese", "celery"],
        "description": "Spicy fried chicken wings", "cuisine": "American", "prep_time": "10 mins", "cook_time": "45 mins", "servings": 6, "difficulty": "Easy"},
    {"title": "Chicken Quesadilla", "ingredients": ["chicken", "tortillas", "cheese", "peppers", "onions", "sour cream"],
        "description": "Cheesy grilled tortilla with chicken", "cuisine": "Mexican", "prep_time": "10 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Chicken Curry", "ingredients": ["chicken", "curry powder", "coconut milk", "onions", "tomatoes", "ginger"],
        "description": "Aromatic curry with tender chicken", "cuisine": "Indian", "prep_time": "15 mins", "cook_time": "40 mins", "servings": 6, "difficulty": "Medium"},
    {"title": "Lemon Herb Grilled Chicken", "ingredients": ["chicken", "lemon", "herbs", "olive oil", "garlic"], "description": "Light and flavorful grilled chicken",
        "cuisine": "Mediterranean", "prep_time": "10 mins", "cook_time": "20 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Chicken Teriyaki", "ingredients": ["chicken", "teriyaki sauce", "rice", "vegetables", "sesame seeds"],
        "description": "Sweet and savory Japanese chicken", "cuisine": "Japanese", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},

    # Pasta Recipes
    {"title": "Classic Spaghetti Carbonara", "ingredients": ["spaghetti", "eggs", "bacon", "parmesan cheese", "black pepper"],
        "description": "Traditional Italian pasta with creamy egg sauce", "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "20 mins", "servings": 4, "difficulty": "Medium"},
    {"title": "Penne Arrabiata", "ingredients": ["penne", "tomatoes", "garlic", "chili flakes", "olive oil", "basil"],
        "description": "Spicy tomato pasta", "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "20 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Lasagna", "ingredients": ["lasagna sheets", "ground beef", "ricotta", "mozzarella", "tomato sauce", "parmesan"],
        "description": "Layered pasta bake with meat and cheese", "cuisine": "Italian", "prep_time": "30 mins", "cook_time": "1 hour", "servings": 8, "difficulty": "Hard"},
    {"title": "Pesto Pasta", "ingredients": ["pasta", "basil", "pine nuts", "parmesan", "garlic", "olive oil"], "description": "Fresh basil pesto with pasta",
        "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Mac and Cheese", "ingredients": ["macaroni", "cheddar cheese", "milk", "butter", "flour"], "description": "Creamy comfort food classic",
        "cuisine": "American", "prep_time": "10 mins", "cook_time": "20 mins", "servings": 6, "difficulty": "Easy"},
    {"title": "Pasta Primavera", "ingredients": ["pasta", "vegetables", "garlic", "olive oil", "parmesan"], "description": "Light pasta with fresh vegetables",
        "cuisine": "Italian", "prep_time": "15 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Bolognese", "ingredients": ["spaghetti", "ground beef", "tomatoes", "onions", "carrots", "celery", "wine"],
        "description": "Rich meat sauce pasta", "cuisine": "Italian", "prep_time": "15 mins", "cook_time": "2 hours", "servings": 6, "difficulty": "Medium"},
    {"title": "Cacio e Pepe", "ingredients": ["spaghetti", "pecorino cheese", "black pepper", "pasta water"], "description": "Simple Roman cheese and pepper pasta",
        "cuisine": "Italian", "prep_time": "5 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Medium"},

    # Rice Recipes
    {"title": "Chicken Fried Rice", "ingredients": ["rice", "chicken", "eggs", "soy sauce", "vegetables", "garlic"],
        "description": "Chinese-style fried rice", "cuisine": "Chinese", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Spanish Paella", "ingredients": ["rice", "chicken", "seafood", "saffron", "peppers", "peas"], "description": "Traditional Spanish rice dish",
        "cuisine": "Spanish", "prep_time": "20 mins", "cook_time": "40 mins", "servings": 6, "difficulty": "Hard"},
    {"title": "Risotto", "ingredients": ["arborio rice", "chicken broth", "white wine", "parmesan", "butter", "onions"],
        "description": "Creamy Italian rice", "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "30 mins", "servings": 4, "difficulty": "Medium"},
    {"title": "Biryani", "ingredients": ["rice", "chicken", "yogurt", "spices", "onions", "saffron"], "description": "Aromatic Indian rice dish",
        "cuisine": "Indian", "prep_time": "30 mins", "cook_time": "45 mins", "servings": 6, "difficulty": "Hard"},
    {"title": "Jambalaya", "ingredients": ["rice", "sausage", "chicken", "shrimp", "peppers", "celery", "cajun spices"],
        "description": "Louisiana Creole rice dish", "cuisine": "Cajun", "prep_time": "15 mins", "cook_time": "40 mins", "servings": 8, "difficulty": "Medium"},

    # Beef Recipes
    {"title": "Beef Tacos", "ingredients": ["ground beef", "taco shells", "lettuce", "tomatoes", "cheese", "sour cream"],
        "description": "Classic Mexican tacos with seasoned beef", "cuisine": "Mexican", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Beef Stir Fry", "ingredients": ["beef", "broccoli", "soy sauce", "ginger", "garlic", "oyster sauce"],
        "description": "Quick Asian beef and vegetables", "cuisine": "Asian", "prep_time": "15 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Beef Stew", "ingredients": ["beef chunks", "potatoes", "carrots", "onions", "beef broth", "herbs"],
        "description": "Hearty comfort stew", "cuisine": "American", "prep_time": "20 mins", "cook_time": "2 hours", "servings": 6, "difficulty": "Easy"},
    {"title": "Beef Burger", "ingredients": ["ground beef", "burger buns", "lettuce", "tomato", "cheese", "pickles"],
        "description": "Classic American burger", "cuisine": "American", "prep_time": "10 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Beef Wellington", "ingredients": ["beef tenderloin", "puff pastry", "mushrooms", "pate", "egg"], "description": "Elegant beef wrapped in pastry",
        "cuisine": "British", "prep_time": "30 mins", "cook_time": "40 mins", "servings": 4, "difficulty": "Hard"},

    # Seafood Recipes
    {"title": "Grilled Salmon", "ingredients": ["salmon", "lemon", "dill", "olive oil", "garlic"], "description": "Simple grilled salmon with herbs",
        "cuisine": "Mediterranean", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Shrimp Scampi", "ingredients": ["shrimp", "garlic", "white wine", "butter", "lemon", "parsley"], "description": "Garlic butter shrimp",
        "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Fish Tacos", "ingredients": ["white fish", "tortillas", "cabbage", "lime", "avocado", "sour cream"],
        "description": "Fresh Baja-style fish tacos", "cuisine": "Mexican", "prep_time": "15 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Tuna Poke Bowl", "ingredients": ["tuna", "rice", "avocado", "edamame", "seaweed", "soy sauce"], "description": "Hawaiian raw fish rice bowl",
        "cuisine": "Hawaiian", "prep_time": "15 mins", "cook_time": "0 mins", "servings": 2, "difficulty": "Easy"},
    {"title": "Lobster Roll", "ingredients": ["lobster meat", "hot dog buns", "mayonnaise", "celery", "lemon"], "description": "New England lobster sandwich",
        "cuisine": "American", "prep_time": "15 mins", "cook_time": "5 mins", "servings": 4, "difficulty": "Medium"},

    # Vegetarian Recipes
    {"title": "Greek Salad", "ingredients": ["tomatoes", "cucumber", "olives", "feta cheese", "olive oil", "oregano"],
        "description": "Fresh Mediterranean salad with feta and olives", "cuisine": "Greek", "prep_time": "15 mins", "cook_time": "0 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Vegetable Stir Fry", "ingredients": ["mixed vegetables", "tofu", "soy sauce", "ginger", "garlic"],
        "description": "Healthy vegetable and tofu stir fry", "cuisine": "Asian", "prep_time": "15 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Caprese Salad", "ingredients": ["tomatoes", "mozzarella", "basil", "olive oil", "balsamic"], "description": "Simple Italian salad",
        "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "0 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Vegetable Curry", "ingredients": ["mixed vegetables", "curry paste", "coconut milk", "rice"], "description": "Creamy vegetable curry",
        "cuisine": "Indian", "prep_time": "15 mins", "cook_time": "25 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Pav Bhaji", "ingredients": ["potatoes", "tomatoes", "peas", "cauliflower", "bell peppers", "pav bhaji masala", "butter", "onions", "garlic", "ginger", "coriander", "pav bread rolls"],
        "description": "Indian street food: spiced vegetable mash (bhaji) with buttered pav. Also known as pao bhaji.",
        "cuisine": "Indian", "prep_time": "20 mins", "cook_time": "25 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Buddha Bowl", "ingredients": ["quinoa", "chickpeas", "avocado", "vegetables", "tahini"], "description": "Nutritious grain bowl",
        "cuisine": "Modern", "prep_time": "20 mins", "cook_time": "20 mins", "servings": 2, "difficulty": "Easy"},
    {"title": "Mushroom Risotto", "ingredients": ["arborio rice", "mushrooms", "vegetable broth", "parmesan", "white wine"],
        "description": "Creamy mushroom rice", "cuisine": "Italian", "prep_time": "10 mins", "cook_time": "30 mins", "servings": 4, "difficulty": "Medium"},
    {"title": "Falafel", "ingredients": ["chickpeas", "herbs", "spices", "tahini", "pita bread"], "description": "Middle Eastern chickpea fritters",
        "cuisine": "Middle Eastern", "prep_time": "20 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Medium"},
    {"title": "Ratatouille", "ingredients": ["eggplant", "zucchini", "tomatoes", "peppers", "onions", "herbs"], "description": "French vegetable stew",
        "cuisine": "French", "prep_time": "20 mins", "cook_time": "40 mins", "servings": 6, "difficulty": "Medium"},

    # Breakfast Recipes
    {"title": "Pancakes", "ingredients": ["flour", "eggs", "milk", "butter", "sugar", "baking powder"], "description": "Fluffy American pancakes",
        "cuisine": "American", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "French Toast", "ingredients": ["bread", "eggs", "milk", "cinnamon", "vanilla", "butter"], "description": "Classic breakfast favorite",
        "cuisine": "French", "prep_time": "5 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Eggs Benedict", "ingredients": ["english muffins", "eggs", "canadian bacon", "hollandaise sauce"], "description": "Elegant breakfast dish",
        "cuisine": "American", "prep_time": "15 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Hard"},
    {"title": "Breakfast Burrito", "ingredients": ["tortillas", "eggs", "sausage", "cheese", "peppers", "salsa"],
        "description": "Hearty breakfast wrap", "cuisine": "Mexican", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Omelette", "ingredients": ["eggs", "cheese", "vegetables", "butter"], "description": "Classic egg dish",
        "cuisine": "French", "prep_time": "5 mins", "cook_time": "10 mins", "servings": 2, "difficulty": "Easy"},
    {"title": "Avocado Toast", "ingredients": ["bread", "avocado", "eggs", "tomatoes", "lemon"], "description": "Modern breakfast favorite",
        "cuisine": "Modern", "prep_time": "10 mins", "cook_time": "5 mins", "servings": 2, "difficulty": "Easy"},

    # Desserts
    {"title": "Chocolate Cake", "ingredients": ["flour", "cocoa powder", "eggs", "sugar", "butter", "milk"], "description": "Rich chocolate layer cake",
        "cuisine": "American", "prep_time": "20 mins", "cook_time": "35 mins", "servings": 12, "difficulty": "Medium"},
    {"title": "Tiramisu", "ingredients": ["ladyfingers", "mascarpone", "eggs", "coffee", "cocoa"], "description": "Italian coffee dessert",
        "cuisine": "Italian", "prep_time": "30 mins", "cook_time": "0 mins", "servings": 8, "difficulty": "Medium"},
    {"title": "Cheesecake", "ingredients": ["cream cheese", "graham crackers", "eggs", "sugar", "vanilla"], "description": "Creamy baked cheesecake",
        "cuisine": "American", "prep_time": "20 mins", "cook_time": "1 hour", "servings": 12, "difficulty": "Medium"},
    {"title": "Apple Pie", "ingredients": ["apples", "pie crust", "sugar", "cinnamon", "butter"], "description": "Classic American dessert",
        "cuisine": "American", "prep_time": "30 mins", "cook_time": "45 mins", "servings": 8, "difficulty": "Medium"},
    {"title": "Brownies", "ingredients": ["chocolate", "butter", "eggs", "sugar", "flour"], "description": "Fudgy chocolate brownies",
        "cuisine": "American", "prep_time": "15 mins", "cook_time": "25 mins", "servings": 16, "difficulty": "Easy"},
    {"title": "Creme Brulee", "ingredients": ["cream", "egg yolks", "sugar", "vanilla"], "description": "French custard dessert",
        "cuisine": "French", "prep_time": "15 mins", "cook_time": "40 mins", "servings": 6, "difficulty": "Hard"},

    # Soups
    {"title": "Tomato Soup", "ingredients": ["tomatoes", "onions", "garlic", "cream", "basil", "vegetable broth"],
        "description": "Classic creamy tomato soup", "cuisine": "American", "prep_time": "10 mins", "cook_time": "30 mins", "servings": 6, "difficulty": "Easy"},
    {"title": "Chicken Noodle Soup", "ingredients": ["chicken", "noodles", "carrots", "celery", "onions", "chicken broth"],
        "description": "Comforting chicken soup", "cuisine": "American", "prep_time": "15 mins", "cook_time": "40 mins", "servings": 8, "difficulty": "Easy"},
    {"title": "Minestrone", "ingredients": ["vegetables", "beans", "pasta", "tomatoes", "vegetable broth"], "description": "Italian vegetable soup",
        "cuisine": "Italian", "prep_time": "15 mins", "cook_time": "35 mins", "servings": 8, "difficulty": "Easy"},
    {"title": "French Onion Soup", "ingredients": ["onions", "beef broth", "bread", "gruyere cheese", "white wine"],
        "description": "Classic French soup with cheese", "cuisine": "French", "prep_time": "15 mins", "cook_time": "1 hour", "servings": 4, "difficulty": "Medium"},
    {"title": "Miso Soup", "ingredients": ["miso paste", "tofu", "seaweed", "green onions", "dashi"], "description": "Japanese fermented soybean soup",
        "cuisine": "Japanese", "prep_time": "5 mins", "cook_time": "10 mins", "servings": 4, "difficulty": "Easy"},

    # Seed and mustard (instant results for common single-word searches; avoids slow T5 timeout)
    {"title": "Roasted Pumpkin Seeds", "ingredients": ["pumpkin seeds", "olive oil", "salt", "spices"], "description": "Crunchy roasted pumpkin seeds snack",
        "cuisine": "American", "prep_time": "5 mins", "cook_time": "20 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Sesame Seed Brittle", "ingredients": ["sesame seeds", "sugar", "honey", "butter"], "description": "Sweet brittle with sesame seeds",
        "cuisine": "Asian", "prep_time": "10 mins", "cook_time": "15 mins", "servings": 6, "difficulty": "Medium"},
    {"title": "Honey Mustard Chicken", "ingredients": ["chicken", "mustard", "honey", "garlic", "olive oil"], "description": "Glazed chicken with honey and mustard",
        "cuisine": "American", "prep_time": "10 mins", "cook_time": "25 mins", "servings": 4, "difficulty": "Easy"},
    {"title": "Mustard Glazed Salmon", "ingredients": ["salmon", "dijon mustard", "maple syrup", "herbs"], "description": "Salmon with mustard and maple glaze",
        "cuisine": "American", "prep_time": "5 mins", "cook_time": "15 mins", "servings": 4, "difficulty": "Easy"},
]


def _load_recipes_from_json(path):
    """
    Load recipes from a JSON file (static data only; no training).
    Expected format: list of dicts with at least 'title', 'ingredients';
    optional 'description', 'cuisine', 'prep_time', 'cook_time', 'servings', 'difficulty'.
    Returns list in MealVista format; empty list on missing file or parse error.
    """
    if not path or not os.path.isfile(path):
        return []
    try:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
    except (json.JSONDecodeError, OSError) as e:
        print(f"[recipe_database] Could not load {path}: {e}")
        return []
    if not isinstance(data, list):
        return []
    out = []
    for i, r in enumerate(data):
        if not isinstance(r, dict):
            continue
        title = (r.get("title") or r.get("name") or "").strip()
        if not title:
            continue
        ings = r.get("ingredients") or r.get("ingredients_list") or []
        if isinstance(ings, list):
            ings = [x if isinstance(x, str) else str(x) for x in ings]
        else:
            ings = []
        out.append({
            "title": title,
            "ingredients": ings,
            "description": (r.get("description") or "").strip() or f"Recipe with {title}",
            "cuisine": (r.get("cuisine") or r.get("cuisine_type") or "General").strip(),
            "prep_time": r.get("prep_time") or "15 mins",
            "cook_time": r.get("cook_time") or "30 mins",
            "servings": r.get("servings") or 4,
            "difficulty": r.get("difficulty") or "Medium",
        })
    return out


_CACHED_RECIPES = None


def get_all_recipes():
    """
    Return all recipes: built-in RECIPE_DATABASE plus optional JSON file.
    Set env RECIPE_JSON_PATH to a path (e.g. data/recipes_1m.json) to load more;
    or place data/recipes.json in the recipe-engine directory.
    Result is cached after first load.
    """
    global _CACHED_RECIPES
    if _CACHED_RECIPES is not None:
        return _CACHED_RECIPES
    base = list(RECIPE_DATABASE)
    path = os.environ.get("RECIPE_JSON_PATH")
    if not path:
        default = os.path.join(os.path.dirname(__file__), "data", "recipes.json")
        path = default if os.path.isfile(default) else None
    if path:
        extra = _load_recipes_from_json(path)
        if extra:
            base.extend(extra)
            print(f"[recipe_database] Loaded {len(extra)} recipes from {path}; total {len(base)}")
    _CACHED_RECIPES = base
    return base


def _get_searchable_recipes():
    """Return the list to use for search (same as get_all_recipes for consistency)."""
    return get_all_recipes()


def search_by_ingredients(ingredients):
    """Search recipes that contain any of the specified ingredients"""
    results = []
    ingredients_lower = [ing.lower() for ing in ingredients]
    recipes = _get_searchable_recipes()

    for recipe in recipes:
        recipe_ingredients = [ing.lower() for ing in recipe['ingredients']]
        # Check if any query ingredient matches any recipe ingredient
        if any(query_ing in recipe_ing or recipe_ing in query_ing
               for query_ing in ingredients_lower
               for recipe_ing in recipe_ingredients):
            results.append(recipe)

    return results


# Query synonyms: alternate spellings / names so "pao bhaji" finds "pav bhaji" etc.
QUERY_SYNONYMS = {
    "pao bhaji": "pav bhaji",
    "pao baji": "pav bhaji",
    "pav baji": "pav bhaji",
}


def search_by_query(query):
    """
    Search recipes by relevance: title first (recipe is ABOUT the query),
    then description, then ingredients/cuisine. So "bread" shows bread recipes
    before recipes that only contain "breadcrumbs".
    Uses QUERY_SYNONYMS so e.g. "pao bhaji" matches recipes titled "Pav Bhaji".
    Multi-word queries (e.g. "chicken curry") match when the full phrase or all words appear.
    """
    query_lower = query.lower().strip()
    if not query_lower:
        return []
    # Normalize known alternate spellings so we match DB and AI
    search_terms = [query_lower]
    if query_lower in QUERY_SYNONYMS:
        search_terms.append(QUERY_SYNONYMS[query_lower])
    # Also match when all words in the query appear (e.g. "chicken curry" -> title has both)
    words = [w for w in query_lower.split() if len(w) > 1]
    if len(words) > 1:
        search_terms.append(" ".join(words))
    title_matches = []
    description_matches = []
    ingredient_matches = []
    cuisine_matches = []
    recipes = _get_searchable_recipes()

    def query_matches_text(text: str) -> bool:
        if not text:
            return False
        if any(term in text for term in search_terms):
            return True
        if len(words) > 1 and all(w in text for w in words):
            return True
        return False

    for recipe in recipes:
        title = (recipe.get("title") or "").lower()
        desc = (recipe.get("description") or "").lower()
        ings = recipe.get("ingredients") or []
        ings_str = " ".join((ing if isinstance(ing, str) else "").lower() for ing in ings)
        cuisine = (recipe.get("cuisine") or "").lower()

        if query_matches_text(title):
            title_matches.append(recipe)
        elif query_matches_text(desc):
            description_matches.append(recipe)
        elif any(query_matches_text((ing if isinstance(ing, str) else "").lower()) for ing in ings):
            ingredient_matches.append(recipe)
        elif query_matches_text(cuisine):
            cuisine_matches.append(recipe)

    # Strongest match first: title (recipe is about X), then description, then ingredient/cuisine
    return title_matches + description_matches + ingredient_matches + cuisine_matches
