"""Quick test: run recipe search (Gemini then Groq fallback) and print results."""
import os
import sys
from dotenv import load_dotenv

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(_root, "src"))
load_dotenv(dotenv_path=os.path.join(_root, ".env"))

from mealvista_recipe_engine import MealVistaRecipeEngine

def main():
    print("Loading recipe engine (Gemini + Groq fallback)...")
    engine = MealVistaRecipeEngine()
    query = "biryani"
    print(f"\nSearching for: '{query}' (max 15 results)...")
    result = engine.process_query(query=query, max_results=15, generate_if_no_match=True)
    results = result.get("results") or []
    print(f"\nTotal results: {len(results)}")
    by_type = {}
    for r in results:
        t = r.get("type") or "unknown"
        by_type[t] = by_type.get(t, 0) + 1
    for t, count in sorted(by_type.items()):
        print(f"  - {t}: {count}")
    if results:
        print("\nFirst 3 recipes:")
        for i, item in enumerate(results[:3], 1):
            title = (item.get("recipe") or {}).get("title") or (item.get("recipe") or {}).get("name") or "?"
            print(f"  {i}. [{item.get('type')}] {title}")
    else:
        print("No recipes returned.")
    print("\nDone.")

if __name__ == "__main__":
    main()
