"""
Quick test: is Gemini working? Run from recipe-engine folder:
  python tests/test_gemini.py
"""
import os
import sys
from dotenv import load_dotenv

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_root, "src"))
load_dotenv(dotenv_path=os.path.join(_root, ".env"))

def main():
    api_key = (os.getenv("GEMINI_API_KEY") or "").strip()
    print("1. GEMINI_API_KEY in .env:", "set" if api_key else "NOT SET")
    if not api_key:
        print("   -> Add GEMINI_API_KEY=your_key to .env and try again.")
        return

    try:
        from gemini_generator import GeminiRecipeGenerator
    except ImportError as e:
        print("2. Import GeminiRecipeGenerator:", "FAILED -", e)
        return
    print("2. Import GeminiRecipeGenerator: OK")

    gen = GeminiRecipeGenerator()
    print("3. Gemini model loaded:", "YES" if gen.model else "NO")
    if not gen.model:
        print("   -> Check your API key or install: pip install google-generativeai")
        return

    print("4. Requesting 3 recipes for 'salad' from Gemini...")
    recipes = gen.generate_recipes("salad", num_recipes=3)
    print("5. Recipes returned:", len(recipes))
    if recipes:
        for i, r in enumerate(recipes, 1):
            print(f"   - {i}. {r.get('title') or r.get('name')}")
        print("   -> Gemini is working properly.")
    else:
        print("   -> Gemini returned 0 recipes (check key, quota, or see errors above).")

if __name__ == "__main__":
    main()
