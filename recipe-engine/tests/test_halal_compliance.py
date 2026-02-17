"""
Halal Compliance Test Suite
============================
Comprehensive tests for halal filtering in MealVista Recipe Engine.
"""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))
from halal_filter import HalalFilter


def test_halal_filter():
    """Test the halal filter functionality."""
    print("=" * 70)
    print("HALAL COMPLIANCE TEST SUITE")
    print("=" * 70)
    
    halal_filter = HalalFilter()
    
    # Test 1: Individual ingredient validation
    print("\n📋 TEST 1: Individual Ingredient Validation")
    print("-" * 70)
    
    test_ingredients = [
        ('chicken', True),
        ('bacon', False),
        ('tomatoes', True),
        ('pork chop', False),
        ('beef', True),
        ('red wine', False),
        ('olive oil', True),
        ('beer', False),
        ('gelatin', False),
        ('agar-agar', True),
    ]
    
    passed = 0
    failed = 0
    
    for ingredient, expected_halal in test_ingredients:
        is_halal = halal_filter.is_ingredient_halal(ingredient)
        status = "✅ PASS" if is_halal == expected_halal else "❌ FAIL"
        
        if is_halal == expected_halal:
            passed += 1
        else:
            failed += 1
        
        print(f"{status} | '{ingredient}' → {'Halal' if is_halal else 'Non-Halal'} (Expected: {'Halal' if expected_halal else 'Non-Halal'})")
    
    print(f"\nResults: {passed} passed, {failed} failed")
    
    # Test 2: Recipe validation
    print("\n📋 TEST 2: Recipe Validation")
    print("-" * 70)
    
    test_recipes = [
        {
            'name': 'Chicken Curry',
            'recipe': {
                'title': 'Chicken Curry',
                'ingredients': ['chicken', 'tomatoes', 'onions', 'curry powder', 'coconut milk'],
                'description': 'Delicious halal chicken curry'
            },
            'expected_halal': True
        },
        {
            'name': 'Pasta Carbonara',
            'recipe': {
                'title': 'Pasta Carbonara',
                'ingredients': ['pasta', 'eggs', 'bacon', 'parmesan cheese', 'black pepper'],
                'description': 'Classic Italian pasta with bacon'
            },
            'expected_halal': False
        },
        {
            'name': 'Beef Stew',
            'recipe': {
                'title': 'Beef Stew',
                'ingredients': ['beef', 'potatoes', 'carrots', 'red wine', 'onions'],
                'description': 'Hearty beef stew with wine'
            },
            'expected_halal': False
        },
        {
            'name': 'Vegetable Stir Fry',
            'recipe': {
                'title': 'Vegetable Stir Fry',
                'ingredients': ['broccoli', 'carrots', 'bell peppers', 'soy sauce', 'garlic'],
                'description': 'Healthy vegetable stir fry'
            },
            'expected_halal': True
        },
        {
            'name': 'Grilled Fish',
            'recipe': {
                'title': 'Grilled Fish',
                'ingredients': ['fish', 'lemon', 'olive oil', 'herbs', 'salt'],
                'description': 'Simple grilled fish'
            },
            'expected_halal': True
        }
    ]
    
    recipe_passed = 0
    recipe_failed = 0
    
    for test_case in test_recipes:
        is_halal, non_halal_items = halal_filter.validate_recipe(test_case['recipe'])
        status = "✅ PASS" if is_halal == test_case['expected_halal'] else "❌ FAIL"
        
        if is_halal == test_case['expected_halal']:
            recipe_passed += 1
        else:
            recipe_failed += 1
        
        print(f"\n{status} | {test_case['name']}")
        print(f"  Result: {'Halal' if is_halal else 'Non-Halal'} (Expected: {'Halal' if test_case['expected_halal'] else 'Non-Halal'})")
        
        if not is_halal:
            print(f"  Non-halal ingredients: {', '.join(non_halal_items)}")
            for item in non_halal_items:
                alternative = halal_filter.suggest_alternatives(item)
                print(f"    → Alternative for '{item}': {alternative}")
    
    print(f"\nResults: {recipe_passed} passed, {recipe_failed} failed")
    
    # Test 3: Recipe filtering
    print("\n📋 TEST 3: Recipe Filtering")
    print("-" * 70)
    
    all_recipes = [tc['recipe'] for tc in test_recipes]
    halal_recipes = halal_filter.filter_recipes(all_recipes)
    
    expected_halal_count = sum(1 for tc in test_recipes if tc['expected_halal'])
    
    print(f"Total recipes: {len(all_recipes)}")
    print(f"Halal recipes found: {len(halal_recipes)}")
    print(f"Expected halal recipes: {expected_halal_count}")
    
    if len(halal_recipes) == expected_halal_count:
        print("✅ PASS - Filtering works correctly")
    else:
        print("❌ FAIL - Filtering did not work as expected")
    
    print("\nHalal recipes:")
    for recipe in halal_recipes:
        print(f"  ✅ {recipe['title']}")
    
    # Test 4: Edge cases
    print("\n📋 TEST 4: Edge Cases")
    print("-" * 70)
    
    edge_cases = [
        {
            'name': 'Empty ingredients',
            'recipe': {'title': 'Test', 'ingredients': []},
            'expected_halal': True
        },
        {
            'name': 'String ingredients',
            'recipe': {'title': 'Test', 'ingredients': 'chicken, tomatoes'},
            'expected_halal': True
        },
        {
            'name': 'Mixed case bacon',
            'recipe': {'title': 'Test', 'ingredients': ['BACON', 'eggs']},
            'expected_halal': False
        },
        {
            'name': 'Pork in title',
            'recipe': {'title': 'Pork Chops', 'ingredients': ['meat', 'salt']},
            'expected_halal': False
        }
    ]
    
    edge_passed = 0
    edge_failed = 0
    
    for test_case in edge_cases:
        is_halal, _ = halal_filter.validate_recipe(test_case['recipe'])
        status = "✅ PASS" if is_halal == test_case['expected_halal'] else "❌ FAIL"
        
        if is_halal == test_case['expected_halal']:
            edge_passed += 1
        else:
            edge_failed += 1
        
        print(f"{status} | {test_case['name']}: {'Halal' if is_halal else 'Non-Halal'} (Expected: {'Halal' if test_case['expected_halal'] else 'Non-Halal'})")
    
    print(f"\nResults: {edge_passed} passed, {edge_failed} failed")
    
    # Final summary
    print("\n" + "=" * 70)
    print("FINAL SUMMARY")
    print("=" * 70)
    
    total_tests = passed + failed + recipe_passed + recipe_failed + edge_passed + edge_failed + 1
    total_passed = passed + recipe_passed + edge_passed + (1 if len(halal_recipes) == expected_halal_count else 0)
    total_failed = failed + recipe_failed + edge_failed + (0 if len(halal_recipes) == expected_halal_count else 1)
    
    print(f"Total tests: {total_tests}")
    print(f"Passed: {total_passed}")
    print(f"Failed: {total_failed}")
    
    if total_failed == 0:
        print("\n🎉 ALL TESTS PASSED! Halal filtering is working correctly.")
        return True
    else:
        print(f"\n⚠️  {total_failed} test(s) failed. Please review the implementation.")
        return False


if __name__ == "__main__":
    success = test_halal_filter()
    sys.exit(0 if success else 1)
