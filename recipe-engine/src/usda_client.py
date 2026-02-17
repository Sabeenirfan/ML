"""
USDA FoodData Central API client (optional).
Uses the same type of data as MyFitnessPal: official USDA nutrient database.
Set USDA_API_KEY in .env (get free key at https://fdc.nal.usda.gov/api-key-signup).
If not set, all lookups return None and the estimator uses only the built-in table.
"""

import os
import json
from typing import Optional, Tuple
from dotenv import load_dotenv

_current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(_current_dir, ".env"))

API_BASE = "https://api.nal.usda.gov/fdc/v1"
# FDC nutrient IDs (per 100g in search results)
NUTRIENT_IDS = {"energy_kcal": 1008, "protein": 1003, "carbs": 1005, "fat": 1004, "fiber": 1079}

# In-memory cache: normalized name -> (kcal, protein, carbs, fat, fiber) per 100g
_usda_cache: dict = {}


def _get_nutrient_value(food: dict, nutrient_id: int) -> float:
    """Extract nutrient amount from a food's foodNutrients array (FDC uses nutrientId + value or nutrient.id + amount)."""
    for fn in food.get("foodNutrients") or []:
        n = fn.get("nutrient") or {}
        if fn.get("nutrientId") == nutrient_id or n.get("id") == nutrient_id or n.get("number") == str(nutrient_id):
            return float(fn.get("value") or fn.get("amount") or 0)
        if fn.get("nutrientNumber") == str(nutrient_id):
            return float(fn.get("value") or fn.get("amount") or 0)
    return 0.0


def lookup_nutrients_per_100g(query: str) -> Optional[Tuple[float, float, float, float, float]]:
    """
    Search USDA FoodData Central and return (kcal, protein_g, carbs_g, fat_g, fiber_g) per 100g
    for the first matching food. Returns None if no key, no match, or API error.
    Results are cached by query for the process lifetime.
    """
    api_key = (os.getenv("USDA_API_KEY") or os.getenv("FDC_API_KEY") or "").strip()
    if not api_key:
        return None
    q = (query or "").strip().lower()
    if not q or len(q) < 2:
        return None
    cache_key = q[:50]
    if cache_key in _usda_cache:
        return _usda_cache[cache_key]

    try:
        import urllib.request
        url = f"{API_BASE}/foods/search?api_key={api_key}"
        body = json.dumps({"query": query.strip(), "pageSize": 1, "pageNumber": 1}).encode()
        req = urllib.request.Request(url, data=body, method="POST", headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode())
    except Exception:
        return None

    foods = data.get("foods") or []
    if not foods:
        _usda_cache[cache_key] = None
        return None

    first = foods[0]
    kcal = _get_nutrient_value(first, NUTRIENT_IDS["energy_kcal"])
    protein = _get_nutrient_value(first, NUTRIENT_IDS["protein"])
    carbs = _get_nutrient_value(first, NUTRIENT_IDS["carbs"])
    fat = _get_nutrient_value(first, NUTRIENT_IDS["fat"])
    fiber = _get_nutrient_value(first, NUTRIENT_IDS["fiber"])
    # If no energy, skip (likely wrong or incomplete entry)
    if kcal <= 0:
        _usda_cache[cache_key] = None
        return None
    result = (kcal, protein, carbs, fat, fiber)
    _usda_cache[cache_key] = result
    return result
