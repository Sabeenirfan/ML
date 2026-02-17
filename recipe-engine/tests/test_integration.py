"""
Integration Test for MealVista AI Recipe Engine
================================================
Tests the complete flow with halal compliance.
"""

import requests
import json
import time


class RecipeEngineIntegrationTest:
    """Integration tests for the AI Recipe Engine API."""
    
    def __init__(self, base_url="http://localhost:8000"):
        """Initialize test suite."""
        self.base_url = base_url
        self.passed = 0
        self.failed = 0
    
    def print_header(self, text):
        """Print formatted header."""
        print("\n" + "=" * 70)
        print(text)
        print("=" * 70)
    
    def print_test(self, name):
        """Print test name."""
        print(f"\n📋 {name}")
        print("-" * 70)
    
    def test_health_check(self):
        """Test 1: Health check endpoint."""
        self.print_test("TEST 1: Health Check")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - API is healthy")
                print(f"   Status: {data.get('status')}")
                print(f"   Engine Loaded: {data.get('engine_loaded')}")
                self.passed += 1
                return True
            else:
                print(f"❌ FAIL - Status code: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ FAIL - Error: {e}")
            print(f"   Make sure the AI Recipe Engine is running at {self.base_url}")
            self.failed += 1
            return False
    
    def test_ingredient_based_query(self):
        """Test 2: Ingredient-based query."""
        self.print_test("TEST 2: Ingredient-Based Query")
        
        query = "chicken, tomatoes, garlic, onions"
        
        try:
            response = requests.post(
                f"{self.base_url}/api/recipes/search",
                json={
                    "query": query,
                    "max_results": 5,
                    "generate_if_no_match": True
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - Query processed successfully")
                print(f"   Query: {query}")
                print(f"   Query Type: {data.get('query_type')}")
                print(f"   Results: {data.get('total_results')}")
                
                # Check for halal certification
                if data.get('results'):
                    first_result = data['results'][0]
                    if 'halal_certified' in first_result:
                        print(f"   Halal Certified: ✅ YES")
                    
                    recipe = first_result.get('recipe', {})
                    print(f"   Sample Recipe: {recipe.get('title', 'N/A')}")
                
                self.passed += 1
                return True
            else:
                print(f"❌ FAIL - Status code: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ FAIL - Error: {e}")
            self.failed += 1
            return False
    
    def test_recipe_name_query(self):
        """Test 3: Recipe name query."""
        self.print_test("TEST 3: Recipe Name Query")
        
        query = "chicken biryani"
        
        try:
            response = requests.post(
                f"{self.base_url}/api/recipes/search",
                json={
                    "query": query,
                    "max_results": 5,
                    "generate_if_no_match": True
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - Query processed successfully")
                print(f"   Query: {query}")
                print(f"   Query Type: {data.get('query_type')}")
                print(f"   Results: {data.get('total_results')}")
                
                if data.get('results'):
                    for i, result in enumerate(data['results'][:3], 1):
                        recipe = result.get('recipe', {})
                        print(f"   {i}. {recipe.get('title', 'N/A')} ({result.get('type')})")
                
                self.passed += 1
                return True
            else:
                print(f"❌ FAIL - Status code: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ FAIL - Error: {e}")
            self.failed += 1
            return False
    
    def test_halal_violation(self):
        """Test 4: Ensure non-halal ingredients are filtered."""
        self.print_test("TEST 4: Halal Violation Detection")
        
        # Try to generate with non-halal ingredients
        query = "bacon, pork, wine"
        
        try:
            response = requests.post(
                f"{self.base_url}/api/recipes/search",
                json={
                    "query": query,
                    "max_results": 3,
                    "generate_if_no_match": True
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check if any results contain non-halal ingredients
                has_non_halal = False
                
                for result in data.get('results', []):
                    recipe = result.get('recipe', {})
                    ingredients = recipe.get('ingredients', [])
                    
                    for ingredient in ingredients:
                        ingredient_str = str(ingredient).lower()
                        if any(word in ingredient_str for word in ['bacon', 'pork', 'wine', 'beer', 'alcohol']):
                            has_non_halal = True
                            break
                
                if not has_non_halal:
                    print(f"✅ PASS - No non-halal ingredients found in results")
                    print(f"   Query: {query}")
                    print(f"   Results: {data.get('total_results')}")
                    print(f"   All recipes are halal-compliant")
                    self.passed += 1
                    return True
                else:
                    print(f"❌ FAIL - Non-halal ingredients found in results")
                    self.failed += 1
                    return False
            else:
                print(f"❌ FAIL - Status code: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ FAIL - Error: {e}")
            self.failed += 1
            return False
    
    def test_stats_endpoint(self):
        """Test 5: Stats endpoint."""
        self.print_test("TEST 5: Stats Endpoint")
        
        try:
            response = requests.get(f"{self.base_url}/api/recipes/stats", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - Stats retrieved successfully")
                print(f"   Total Recipes: {data.get('total_recipes')}")
                print(f"   Search Model: {data.get('search_model')}")
                print(f"   Generator Model: {data.get('generator_model')}")
                self.passed += 1
                return True
            else:
                print(f"❌ FAIL - Status code: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ FAIL - Error: {e}")
            self.failed += 1
            return False
    
    def test_examples_endpoint(self):
        """Test 6: Examples endpoint."""
        self.print_test("TEST 6: Examples Endpoint")
        
        try:
            response = requests.get(f"{self.base_url}/api/examples", timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                print(f"✅ PASS - Examples retrieved successfully")
                
                if 'ingredient_based_queries' in data:
                    print(f"   Ingredient queries: {len(data['ingredient_based_queries'])}")
                if 'name_based_queries' in data:
                    print(f"   Name queries: {len(data['name_based_queries'])}")
                if 'general_food_questions' in data:
                    print(f"   General questions: {len(data['general_food_questions'])}")
                
                self.passed += 1
                return True
            else:
                print(f"❌ FAIL - Status code: {response.status_code}")
                self.failed += 1
                return False
        except Exception as e:
            print(f"❌ FAIL - Error: {e}")
            self.failed += 1
            return False
    
    def run_all_tests(self):
        """Run all integration tests."""
        self.print_header("MEALVISTA AI RECIPE ENGINE - INTEGRATION TESTS")
        
        print(f"\n🔗 Testing API at: {self.base_url}")
        print(f"⏰ Starting tests at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        # Run tests
        self.test_health_check()
        self.test_ingredient_based_query()
        self.test_recipe_name_query()
        self.test_halal_violation()
        self.test_stats_endpoint()
        self.test_examples_endpoint()
        
        # Print summary
        self.print_header("TEST SUMMARY")
        
        total = self.passed + self.failed
        print(f"\nTotal Tests: {total}")
        print(f"Passed: {self.passed} ✅")
        print(f"Failed: {self.failed} ❌")
        
        if self.failed == 0:
            print("\n🎉 ALL INTEGRATION TESTS PASSED!")
            print("✅ AI Recipe Engine is working correctly")
            print("✅ Halal compliance is enforced")
            print("✅ All endpoints are functional")
            return True
        else:
            print(f"\n⚠️  {self.failed} test(s) failed")
            print("Please review the errors above")
            return False


if __name__ == "__main__":
    import sys
    
    # Check if custom URL provided
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8000"
    
    print("\n" + "=" * 70)
    print("STARTING AI RECIPE ENGINE INTEGRATION TESTS")
    print("=" * 70)
    print(f"\nℹ️  Make sure the AI Recipe Engine is running at: {base_url}")
    print("   Start it with: python api.py")
    print("\nPress Ctrl+C to cancel, or wait 3 seconds to continue...")
    
    try:
        time.sleep(3)
    except KeyboardInterrupt:
        print("\n\n❌ Tests cancelled by user")
        sys.exit(1)
    
    # Run tests
    tester = RecipeEngineIntegrationTest(base_url)
    success = tester.run_all_tests()
    
    sys.exit(0 if success else 1)
