"""
MealVista Recipe Engine - Test Suite
=====================================
Test script to verify installation and functionality.
"""
import os
import sys
import time
from typing import List, Dict

sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "src"))

def print_header(text: str):
    """Print formatted header."""
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


def test_imports():
    """Test if all required packages are installed."""
    print_header("Testing Package Imports")
    
    required_packages = [
        ('torch', 'PyTorch'),
        ('transformers', 'Transformers'),
        ('numpy', 'NumPy'),
        ('sklearn', 'Scikit-learn'),
    ]
    
    failed = []
    
    for package, name in required_packages:
        try:
            __import__(package)
            print(f"✓ {name:20s} - OK")
        except ImportError:
            print(f"✗ {name:20s} - FAILED")
            failed.append(package)
    
    if failed:
        print(f"\n❌ Missing packages: {', '.join(failed)}")
        print("Run: pip install -r requirements.txt")
        return False
    else:
        print("\n✓ All required packages installed!")
        return True


def test_cuda():
    """Test CUDA availability."""
    print_header("Testing CUDA/GPU Support")
    
    try:
        import torch
        
        cuda_available = torch.cuda.is_available()
        
        if cuda_available:
            print(f"✓ CUDA Available: Yes")
            print(f"  GPU Name: {torch.cuda.get_device_name(0)}")
            print(f"  GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.2f} GB")
        else:
            print(f"⚠ CUDA Available: No (will use CPU)")
            print(f"  Note: GPU is optional but recommended for better performance")
        
        return True
    except Exception as e:
        print(f"❌ Error checking CUDA: {e}")
        return False


def test_model_loading():
    """Test model loading."""
    print_header("Testing Model Loading")
    
    try:
        from mealvista_recipe_engine import RecipeGenerator, RecipeSearchEngine
        
        print("Loading Recipe Generator (this may take a while on first run)...")
        start_time = time.time()
        generator = RecipeGenerator()
        load_time = time.time() - start_time
        print(f"✓ Recipe Generator loaded in {load_time:.2f}s")
        
        print("\nLoading Recipe Search Engine...")
        start_time = time.time()
        search_engine = RecipeSearchEngine()
        load_time = time.time() - start_time
        print(f"✓ Search Engine loaded in {load_time:.2f}s")
        
        return True, generator, search_engine
    except Exception as e:
        print(f"❌ Model loading failed: {e}")
        return False, None, None


def test_recipe_generation(generator):
    """Test recipe generation functionality."""
    print_header("Testing Recipe Generation")
    
    test_ingredients = [
        ['chicken', 'tomatoes', 'garlic'],
        ['pasta', 'mushrooms', 'cream'],
        ['eggs', 'cheese', 'spinach']
    ]
    
    try:
        for ingredients in test_ingredients:
            print(f"\nGenerating recipe with: {', '.join(ingredients)}")
            start_time = time.time()
            
            recipes = generator.generate_recipe(ingredients, num_return_sequences=1)
            
            gen_time = time.time() - start_time
            
            if recipes:
                print(f"✓ Generated in {gen_time:.2f}s")
                print(f"  Preview: {recipes[0][:100]}...")
            else:
                print(f"⚠ No recipe generated")
        
        return True
    except Exception as e:
        print(f"❌ Recipe generation failed: {e}")
        return False


def test_recipe_search(search_engine):
    """Test recipe search functionality."""
    print_header("Testing Recipe Search")
    
    # Add sample recipes
    sample_recipes = [
        {
            'title': 'Classic Spaghetti Carbonara',
            'ingredients': ['spaghetti', 'eggs', 'bacon', 'parmesan', 'pepper'],
            'description': 'Traditional Italian pasta with creamy egg sauce'
        },
        {
            'title': 'Chicken Tikka Masala',
            'ingredients': ['chicken', 'yogurt', 'tomatoes', 'cream', 'garam masala'],
            'description': 'Creamy Indian curry with marinated chicken'
        },
        {
            'title': 'Greek Salad',
            'ingredients': ['tomatoes', 'cucumber', 'olives', 'feta', 'olive oil'],
            'description': 'Fresh Mediterranean salad'
        }
    ]
    
    try:
        print("Adding sample recipes...")
        search_engine.add_recipes(sample_recipes)
        print(f"✓ Added {len(sample_recipes)} recipes")
        
        test_queries = [
            'pasta recipe',
            'chicken curry',
            'salad'
        ]
        
        for query in test_queries:
            print(f"\nSearching for: '{query}'")
            start_time = time.time()
            
            results = search_engine.search(query, top_k=2)
            
            search_time = time.time() - start_time
            
            if results:
                print(f"✓ Found {len(results)} results in {search_time:.3f}s")
                for recipe, score in results:
                    print(f"  - {recipe['title']} (similarity: {score:.3f})")
            else:
                print(f"⚠ No results found")
        
        return True
    except Exception as e:
        print(f"❌ Recipe search failed: {e}")
        return False


def test_full_engine():
    """Test the complete MealVista engine."""
    print_header("Testing Complete MealVista Engine")
    
    try:
        from mealvista_recipe_engine import MealVistaRecipeEngine
        
        print("Initializing MealVista Recipe Engine...")
        
        sample_recipes = [
            {
                'title': 'Classic Spaghetti Carbonara',
                'ingredients': ['spaghetti', 'eggs', 'bacon', 'parmesan', 'pepper'],
                'description': 'Traditional Italian pasta'
            }
        ]
        
        engine = MealVistaRecipeEngine(recipe_database=sample_recipes)
        print("✓ Engine initialized")
        
        # Test different query types
        test_cases = [
            ("I have chicken, tomatoes, and garlic", "ingredient_based"),
            ("Find me a pasta recipe", "name_based"),
            ("chicken, rice, curry powder", "ingredient_based"),
        ]
        
        for query, expected_type in test_cases:
            print(f"\nQuery: '{query}'")
            start_time = time.time()
            
            result = engine.process_query(query, max_results=2)
            
            query_time = time.time() - start_time
            
            print(f"✓ Processed in {query_time:.2f}s")
            print(f"  Query Type: {result['query_type']} (expected: {expected_type})")
            print(f"  Results: {len(result['results'])}")
            
            if result['results']:
                first_result = result['results'][0]
                recipe_title = first_result['recipe'].get('title', 'Untitled')
                print(f"  Top Result: {recipe_title}")
        
        return True
    except Exception as e:
        print(f"❌ Full engine test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_api_server():
    """Test if API server can be imported."""
    print_header("Testing API Server")
    
    try:
        import api
        print("✓ API module imported successfully")
        print("\nTo start the API server, run:")
        print("  python api.py")
        print("\nAPI will be available at:")
        print("  http://localhost:8000")
        print("  http://localhost:8000/docs (Interactive documentation)")
        return True
    except Exception as e:
        print(f"❌ API import failed: {e}")
        return False


def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 70)
    print("  MEALVISTA RECIPE ENGINE - TEST SUITE")
    print("=" * 70)
    
    results = {}
    
    # Test 1: Package imports
    results['imports'] = test_imports()
    
    if not results['imports']:
        print("\n❌ Cannot proceed without required packages. Please install dependencies.")
        return
    
    # Test 2: CUDA support
    results['cuda'] = test_cuda()
    
    # Test 3: Model loading
    success, generator, search_engine = test_model_loading()
    results['model_loading'] = success
    
    if not success:
        print("\n❌ Cannot proceed without models. Please check your installation.")
        return
    
    # Test 4: Recipe generation
    if generator:
        results['generation'] = test_recipe_generation(generator)
    
    # Test 5: Recipe search
    if search_engine:
        results['search'] = test_recipe_search(search_engine)
    
    # Test 6: Full engine
    results['full_engine'] = test_full_engine()
    
    # Test 7: API server
    results['api'] = test_api_server()
    
    # Print summary
    print_header("Test Summary")
    
    total_tests = len(results)
    passed_tests = sum(1 for v in results.values() if v)
    
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{test_name:20s}: {status}")
    
    print(f"\n{passed_tests}/{total_tests} tests passed")
    
    if passed_tests == total_tests:
        print("\n🎉 All tests passed! MealVista Recipe Engine is ready to use.")
        print("\nNext steps:")
        print("1. Start the API server: python api.py")
        print("2. Visit http://localhost:8000/docs for API documentation")
        print("3. Integrate with your MealVista system")
    else:
        print("\n⚠ Some tests failed. Please check the errors above.")


if __name__ == "__main__":
    run_all_tests()
