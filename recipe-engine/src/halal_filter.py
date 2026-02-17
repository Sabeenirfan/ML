"""
Halal Compliance Filter for MealVista Recipe Engine
====================================================
Ensures all generated recipes comply with halal dietary requirements.
"""

import re
from typing import Dict, List, Tuple


class HalalFilter:
    """
    Filter to ensure recipes comply with halal dietary requirements.
    """

    def __init__(self):
        """Initialize the halal filter with blacklisted ingredients."""
        
        # Non-halal ingredients (comprehensive list)
        self.non_halal_ingredients = {
            # Pork products
            'pork', 'bacon', 'ham', 'sausage', 'pepperoni', 'prosciutto',
            'pancetta', 'salami', 'chorizo', 'pork chop', 'pork belly',
            'pork loin', 'pork ribs', 'pork shoulder', 'pork tenderloin',
            
            # Alcohol and wine
            'wine', 'beer', 'alcohol', 'vodka', 'rum', 'whiskey', 'whisky',
            'brandy', 'cognac', 'sake', 'champagne', 'sherry', 'port',
            'liqueur', 'gin', 'tequila', 'bourbon', 'scotch', 'vermouth',
            'red wine', 'white wine', 'cooking wine', 'rice wine',
            
            # Gelatin and animal-derived products
            'gelatin', 'gelatine', 'lard', 'suet', 'tallow',
            
            # Non-halal meat (if not specified as halal)
            'non-halal', 'non halal',
            
            # Other questionable ingredients
            'vanilla extract',  # Often contains alcohol
        }
        
        # Patterns to detect non-halal ingredients in text
        self.non_halal_patterns = [
            r'\bpork\b',
            r'\bbacon\b',
            r'\bham\b',
            r'\bwine\b',
            r'\bbeer\b',
            r'\balcohol\b',
            r'\bgelatin\b',
            r'\blard\b',
        ]
        
        # Safe alternatives for common non-halal ingredients
        self.halal_alternatives = {
            'bacon': 'turkey bacon (halal)',
            'wine': 'grape juice or vinegar',
            'beer': 'non-alcoholic malt beverage',
            'gelatin': 'agar-agar or halal gelatin',
            'lard': 'vegetable oil or ghee',
            'vanilla extract': 'vanilla essence (alcohol-free)',
        }

    def is_ingredient_halal(self, ingredient: str) -> bool:
        """
        Check if a single ingredient is halal.
        
        Args:
            ingredient: Ingredient name to check
            
        Returns:
            True if halal, False otherwise
        """
        ingredient_lower = ingredient.lower().strip()
        
        # Check against blacklist
        for non_halal in self.non_halal_ingredients:
            if non_halal in ingredient_lower:
                return False
        
        # Check against patterns
        for pattern in self.non_halal_patterns:
            if re.search(pattern, ingredient_lower, re.IGNORECASE):
                return False
        
        return True

    def validate_recipe(self, recipe: Dict) -> Tuple[bool, List[str]]:
        """
        Validate if a recipe is halal-compliant.
        
        Args:
            recipe: Recipe dictionary with 'ingredients' field
            
        Returns:
            Tuple of (is_halal, list_of_non_halal_ingredients)
        """
        non_halal_found = []
        
        # Check ingredients
        ingredients = recipe.get('ingredients', [])
        
        # Handle both list and string formats
        if isinstance(ingredients, str):
            ingredients = [ingredients]
        
        for ingredient in ingredients:
            if isinstance(ingredient, dict):
                ingredient_name = ingredient.get('name', '')
            else:
                ingredient_name = str(ingredient)
            
            if not self.is_ingredient_halal(ingredient_name):
                non_halal_found.append(ingredient_name)
        
        # Also check title and description for mentions
        title = recipe.get('title', '')
        description = recipe.get('description', '')
        
        for text in [title, description]:
            if text:
                for non_halal in self.non_halal_ingredients:
                    if non_halal in text.lower():
                        if non_halal not in non_halal_found:
                            non_halal_found.append(non_halal)
        
        is_halal = len(non_halal_found) == 0
        return is_halal, non_halal_found

    def filter_recipes(self, recipes: List[Dict]) -> List[Dict]:
        """
        Filter a list of recipes to only include halal ones.
        
        Args:
            recipes: List of recipe dictionaries
            
        Returns:
            List of halal-compliant recipes
        """
        halal_recipes = []
        
        for recipe in recipes:
            is_halal, non_halal_items = self.validate_recipe(recipe)
            
            if is_halal:
                halal_recipes.append(recipe)
            else:
                print(f"Filtered non-halal recipe: {recipe.get('title', 'Unknown')}")
                print(f"   Non-halal ingredients: {', '.join(non_halal_items)}")
        
        return halal_recipes

    def suggest_alternatives(self, non_halal_ingredient: str) -> str:
        """
        Suggest halal alternatives for non-halal ingredients.
        
        Args:
            non_halal_ingredient: Non-halal ingredient name
            
        Returns:
            Suggested halal alternative
        """
        ingredient_lower = non_halal_ingredient.lower().strip()
        
        for key, alternative in self.halal_alternatives.items():
            if key in ingredient_lower:
                return alternative
        
        return "halal-certified alternative"

    def clean_recipe_text(self, recipe_text: str) -> str:
        """
        Clean recipe text by removing non-halal ingredient mentions.
        
        Args:
            recipe_text: Raw recipe text
            
        Returns:
            Cleaned recipe text
        """
        cleaned_text = recipe_text
        
        for pattern in self.non_halal_patterns:
            # Replace with placeholder
            cleaned_text = re.sub(
                pattern,
                '[REMOVED - NON-HALAL]',
                cleaned_text,
                flags=re.IGNORECASE
            )
        
        return cleaned_text


# Example usage and testing
if __name__ == "__main__":
    halal_filter = HalalFilter()
    
    # Test recipes
    test_recipes = [
        {
            'title': 'Chicken Curry',
            'ingredients': ['chicken', 'tomatoes', 'onions', 'curry powder'],
            'description': 'Delicious halal chicken curry'
        },
        {
            'title': 'Pasta Carbonara',
            'ingredients': ['pasta', 'eggs', 'bacon', 'parmesan cheese'],
            'description': 'Classic Italian pasta with bacon'
        },
        {
            'title': 'Beef Stew',
            'ingredients': ['beef', 'potatoes', 'carrots', 'red wine'],
            'description': 'Hearty beef stew with wine'
        }
    ]
    
    print("=" * 60)
    print("HALAL COMPLIANCE TESTING")
    print("=" * 60)
    
    for recipe in test_recipes:
        is_halal, non_halal_items = halal_filter.validate_recipe(recipe)
        
        print(f"\nRecipe: {recipe['title']}")
        print(f"Halal: {'✅ YES' if is_halal else '❌ NO'}")
        
        if not is_halal:
            print(f"Non-halal ingredients: {', '.join(non_halal_items)}")
            for item in non_halal_items:
                alternative = halal_filter.suggest_alternatives(item)
                print(f"  → Suggested alternative for '{item}': {alternative}")
    
    print("\n" + "=" * 60)
    print("FILTERING RECIPES")
    print("=" * 60)
    
    halal_recipes = halal_filter.filter_recipes(test_recipes)
    print(f"\nTotal recipes: {len(test_recipes)}")
    print(f"Halal recipes: {len(halal_recipes)}")
    
    for recipe in halal_recipes:
        print(f"  ✅ {recipe['title']}")
