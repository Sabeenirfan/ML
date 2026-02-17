"""
Allergen Substitution for MealVista Recipe Engine
==================================================
Uses a static mapping to suggest and apply safe alternatives when a recipe
contains ingredients that match the user's allergens. No model training.
"""

import json
import os
import re
from typing import Dict, List, Tuple, Any


class AllergenSubstitution:
    """
    Applies allergen-safe substitutions to recipes using a pre-built mapping.
    """

    def __init__(self, data_path: str = None):
        """
        Initialize with allergen substitution data (JSON).

        Args:
            data_path: Path to allergen_substitution_data.json. If None, uses same directory as this module.
        """
        if data_path is None:
            data_path = os.path.join(
                os.path.dirname(os.path.abspath(__file__)),
                "..", "data", "allergen_substitution_data.json"
            )
        self.data_path = data_path
        self.allergen_categories = []
        self._mapping: List[Dict] = []
        self._load_data()

    def _load_data(self):
        """Load JSON mapping from disk."""
        try:
            with open(self.data_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.allergen_categories = data.get("allergen_categories", [])
            self._mapping = data.get("ingredient_to_allergen_and_alternatives", [])
        except Exception as e:
            print(f"Warning: Could not load allergen substitution data: {e}")
            self._mapping = []

    def _normalize_allergens(self, user_allergens: List[str]) -> List[str]:
        """Normalize user allergen list to lowercase for matching."""
        if not user_allergens:
            return []
        return [a.strip().lower() for a in user_allergens if a and a.strip()]

    def _get_ingredient_text(self, ingredient: Any) -> str:
        """Extract raw text from ingredient (string or dict)."""
        if isinstance(ingredient, dict):
            return ingredient.get("name", ingredient.get("original", str(ingredient)))
        return str(ingredient).strip()

    def _matches_allergen_entry(self, allergen_key: str, user_allergens: List[str]) -> bool:
        """Check if this mapping entry is for one of the user's allergens."""
        allergen_key = allergen_key.lower().replace(" ", "_")
        for u in user_allergens:
            u_norm = u.lower().replace(" ", "_")
            if u_norm == allergen_key or u_norm in allergen_key or allergen_key in u_norm:
                return True
        if allergen_key == "gluten" and "wheat" in user_allergens:
            return True
        if allergen_key == "wheat" and "gluten" in user_allergens:
            return True
        return False

    def apply_substitutions(
        self,
        recipe: Dict,
        user_allergens: List[str]
    ) -> Tuple[Dict, List[Dict[str, str]]]:
        """
        Apply allergen substitutions to a recipe.

        Args:
            recipe: Recipe dict with 'ingredients' (list of strings or dicts with 'name').
            user_allergens: List of allergen names the user avoids (e.g. ['dairy', 'nuts']).

        Returns:
            Tuple of (recipe_with_substitutions, list of {original, alternative, allergen}).
        """
        user_allergens = self._normalize_allergens(user_allergens)
        if not user_allergens or not self._mapping:
            return recipe, []

        ingredients = recipe.get("ingredients", [])
        if isinstance(ingredients, str):
            ingredients = [s.strip() for s in ingredients.split(",") if s.strip()]
        substitutions_made: List[Dict[str, str]] = []
        new_ingredients: List[Any] = []

        for ing in ingredients:
            text = self._get_ingredient_text(ing)
            text_lower = text.lower()
            replaced = False

            for entry in self._mapping:
                allergen_key = entry.get("allergen", "")
                if not self._matches_allergen_entry(allergen_key, user_allergens):
                    continue
                patterns = entry.get("ingredient_patterns", [])
                alternatives = entry.get("alternatives", [])
                if not alternatives:
                    continue
                for pat in patterns:
                    if pat.lower() in text_lower or re.search(
                        r"\b" + re.escape(pat) + r"\b", text_lower
                    ):
                        alternative = alternatives[0]
                        new_ingredients.append(alternative)
                        substitutions_made.append({
                            "original": text,
                            "alternative": alternative,
                            "allergen": allergen_key,
                        })
                        replaced = True
                        break
                if replaced:
                    break

            if not replaced:
                new_ingredients.append(ing if isinstance(ing, str) else text)

        recipe_with_subs = {**recipe, "ingredients": new_ingredients}
        return recipe_with_subs, substitutions_made

    def get_substitutions_for_recipe(
        self,
        recipe: Dict,
        user_allergens: List[str]
    ) -> List[Dict[str, str]]:
        """
        Return only the list of suggested substitutions without modifying the recipe.

        Args:
            recipe: Recipe dict with 'ingredients'.
            user_allergens: List of allergen names.

        Returns:
            List of {original, alternative, allergen}.
        """
        _, substitutions = self.apply_substitutions(recipe, user_allergens)
        return substitutions

    def has_allergen_ingredients(self, recipe: Dict, user_allergens: List[str]) -> bool:
        """
        Check if the recipe contains any ingredients matching user allergens.

        Returns:
            True if at least one ingredient matches a user allergen.
        """
        subs = self.get_substitutions_for_recipe(recipe, user_allergens)
        return len(subs) > 0
