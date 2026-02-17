"""
MealVista Recipe Engine
========================
Recipe search: Groq-only. All results come from the Groq API.
Set GROQ_API_KEY in recipe-engine/.env.
"""

import re
from typing import List, Dict, Optional, Any

from halal_filter import HalalFilter
from allergen_substitution import AllergenSubstitution
from groq_generator import GroqRecipeGenerator
from nutrition_estimator import apply_nutrition_to_recipe


class QueryClassifier:
    """
    Classifies user queries to route to appropriate search (ingredient vs name).
    """

    DISH_NAME_BLOCKLIST = frozenset([
        'carbonara', 'tiramisu', 'risotto', 'biryani', 'paella', 'lasagna',
        'bolognese', 'quesadilla', 'falafel', 'hummus',
        'ratatouille', 'jambalaya', 'goulash', 'moussaka', 'tagine',
        'chocolate cake', 'apple pie', 'cheesecake', 'brownies',
        'chicken tikka masala', 'pasta carbonara', 'beef wellington',
        'pav bhaji', 'pao bhaji', 'pav bhaji (pao bhaji)',
    ])
    # Queries for things people make FROM SCRATCH (recipe for the item itself, not using it as ingredient)
    FROM_SCRATCH_QUERIES = frozenset([
        'ice cream', 'yogurt', 'yoghurt', 'bread', 'butter', 'mayonnaise',
        'pasta dough', 'nut butter', 'peanut butter', 'jam', 'sauce',
        'cream cheese', 'ricotta', 'tofu', 'tempeh', 'kimchi', 'sauerkraut',
    ])

    def __init__(self):
        self.ingredient_keywords = [
            'have', 'with', 'using', 'ingredients', 'make with',
            'cook with', 'use', 'got', 'leftover'
        ]

    def classify(self, query: str) -> str:
        query_lower = query.lower().strip()
        for keyword in self.ingredient_keywords:
            if keyword in query_lower:
                return 'ingredient_based'
        if ',' in query and len(query.split(',')) >= 2:
            return 'ingredient_based'
        words = query_lower.split()
        if len(words) <= 2:
            if query_lower in self.DISH_NAME_BLOCKLIST:
                return 'name_based'
            for phrase in self.DISH_NAME_BLOCKLIST:
                if query_lower in phrase or phrase in query_lower:
                    return 'name_based'
            # "ice cream", "yogurt", "bread" etc. → user wants recipe TO MAKE it, not recipes using it
            if query_lower in self.FROM_SCRATCH_QUERIES:
                return 'name_based'
            for phrase in self.FROM_SCRATCH_QUERIES:
                if query_lower in phrase or phrase in query_lower:
                    return 'name_based'
            return 'ingredient_based'
        return 'name_based'

    def extract_ingredients(self, query: str) -> List[str]:
        clean_query = query.lower()
        for phrase in ['i have', 'using', 'with', 'make with', 'cook with', 'got']:
            clean_query = clean_query.replace(phrase, '')
        ingredients = re.split(r',|\sand\s', clean_query)
        return [ing.strip() for ing in ingredients if ing.strip()]


class MealVistaRecipeEngine:
    """
    Recipe Engine: Groq-only. All results come from the Groq API.
    """

    def __init__(self, recipe_database: Optional[List[Dict]] = None):
        self.classifier = QueryClassifier()
        self.halal_filter = HalalFilter()
        self.allergen_substitution = AllergenSubstitution()
        self._added_recipes: List[Dict] = []
        self.groq = GroqRecipeGenerator()
        self.use_groq = self.groq.client is not None
        if self.use_groq:
            print("Initializing MealVista Recipe Engine (Groq-only)...")
        else:
            print("Initializing MealVista Recipe Engine (Groq-only; set GROQ_API_KEY in recipe-engine/.env)...")
        print("MealVista Recipe Engine ready!")

    def _from_scratch_query_term(self, query: str) -> Optional[str]:
        """If the user searched for something we make from scratch (e.g. ice cream), return that term else None."""
        q = (query or "").lower().strip()
        if q in self.classifier.FROM_SCRATCH_QUERIES:
            return q
        for term in self.classifier.FROM_SCRATCH_QUERIES:
            if term in q or q in term:
                return term
        return None

    def _recipe_uses_product_as_ingredient(self, recipe: Dict, product_term: str) -> bool:
        """True if the recipe lists the product (e.g. 'ice cream') as an ingredient = recipe uses store-bought, not from scratch."""
        ingredients = recipe.get("ingredients") or []
        for ing in ingredients:
            s = (ing.get("name") if isinstance(ing, dict) else str(ing)).lower()
            if product_term in s and "homemade" not in s and "from scratch" not in s:
                return True
        return False

    def _apply_allergen_substitutions_to_result(
        self, item: Dict, user_allergens: Optional[List[str]]
    ) -> None:
        if not user_allergens:
            return
        recipe = item.get("recipe")
        if not recipe or not isinstance(recipe, dict):
            return
        recipe_with_subs, substitutions = self.allergen_substitution.apply_substitutions(
            recipe, user_allergens
        )
        if substitutions:
            item["recipe_with_substitutions"] = recipe_with_subs
            item["substitutions"] = substitutions

    @staticmethod
    def _normalize_title(recipe: Dict) -> str:
        if not recipe or not isinstance(recipe, dict):
            return ""
        title = (recipe.get("title") or recipe.get("name") or "").strip()
        return " ".join(title.lower().split())

    def _deduplicate_results_by_title(
        self, results: List[Dict], max_results: int
    ) -> List[Dict]:
        seen = set()
        deduped = []
        for item in results:
            recipe = item.get("recipe") if isinstance(item, dict) else None
            norm = self._normalize_title(recipe) if recipe else ""
            if not norm or norm in seen:
                continue
            seen.add(norm)
            item = dict(item) if isinstance(item, dict) else item
            item["rank"] = len(deduped) + 1
            deduped.append(item)
            if len(deduped) >= max_results:
                break
        return deduped

    def _search_added_recipes(self, query: str, ingredients: List[str]) -> List[Dict]:
        """Search in user-added recipes only."""
        results = []
        query_lower = query.lower()
        all_recipes = self._added_recipes
        for recipe in all_recipes:
            title = (recipe.get("title") or recipe.get("name") or "").lower()
            desc = (recipe.get("description") or "").lower()
            ings = recipe.get("ingredients") or []
            ings_str = " ".join(i.lower() if isinstance(i, str) else str(i).lower() for i in ings)
            if query_lower in title or query_lower in desc or query_lower in ings_str:
                results.append(recipe)
                continue
            if ingredients:
                recipe_ings_lower = [i.lower() if isinstance(i, str) else str(i).lower() for i in ings]
                if any(q in ri or ri in q for q in ingredients for ri in recipe_ings_lower):
                    results.append(recipe)
        return results

    def process_query(
        self,
        query: str,
        max_results: int = 50,
        generate_if_no_match: bool = True,
        user_allergens: Optional[List[str]] = None
    ) -> Dict[str, any]:
        """
        Process query: Groq-only. All results come from the Groq API.
        """
        query_type = self.classifier.classify(query)
        response = {
            'query': query,
            'query_type': query_type,
            'results': []
        }
        if query_type == 'ingredient_based':
            response['ingredients'] = self.classifier.extract_ingredients(query)

        if not self.use_groq:
            response['total_results'] = 0
            response['message'] = "Groq API key required. Set GROQ_API_KEY in recipe-engine/.env"
            return response

        seen_titles = set()
        is_ingredient_query = query_type == 'ingredient_based'
        num_recipes = min(20, max_results)
        from_scratch_term = self._from_scratch_query_term(query)

        try:
            print(f"Requesting {num_recipes} Groq recipes for: '{query}' (ingredient_query={is_ingredient_query})")
            ai_recipes = self.groq.generate_recipes(
                query, num_recipes=num_recipes, is_ingredient_query=is_ingredient_query,
                from_scratch_term=from_scratch_term
            )
        except Exception as e:
            print(f"Groq fetch error: {e}")
            ai_recipes = []

        if ai_recipes:
            for recipe in ai_recipes:
                if len(response['results']) >= max_results:
                    break
                if from_scratch_term and self._recipe_uses_product_as_ingredient(recipe, from_scratch_term):
                    continue
                is_halal, _ = self.halal_filter.validate_recipe(recipe)
                if not is_halal:
                    continue
                norm = self._normalize_title(recipe)
                if norm and norm in seen_titles:
                    continue
                seen_titles.add(norm or " ")
                apply_nutrition_to_recipe(recipe)
                response['results'].append({
                    'type': 'groq_generated',
                    'recipe': recipe,
                    'rank': len(response['results']) + 1,
                    'similarity_score': 0.95
                })

        response['results'] = self._deduplicate_results_by_title(
            response['results'], max_results
        )
        response['message'] = None
        if len(response['results']) == 0:
            response['message'] = (
                "Groq limit reached (30 requests/min). Wait ~1 min and try again. "
                "Daily limit is much higher (e.g. 1000/day)."
            )

        for item in response['results']:
            self._apply_allergen_substitutions_to_result(item, user_allergens)

        response['total_results'] = len(response['results'])
        print(f"Returning {response['total_results']} recipes")
        return response

    def add_recipe_to_database(self, recipe: Dict):
        """Add a recipe to in-memory list (used for search in this process only)."""
        if recipe and isinstance(recipe, dict) and (recipe.get("title") or recipe.get("name")):
            self._added_recipes.append(recipe)
