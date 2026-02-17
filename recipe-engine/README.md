# MealVista AI Recipe Engine

AI-powered recipe search and generation service. Uses Gemini (primary) and Groq (fallback) for recipe generation.

## Project Structure

```
recipe-engine/
├── src/                    # Python source code
│   ├── api.py              # FastAPI REST API
│   ├── mealvista_recipe_engine.py
│   ├── recipe_database.py
│   ├── gemini_generator.py
│   ├── groq_generator.py
│   ├── halal_filter.py
│   ├── allergen_substitution.py
│   ├── nutrition_estimator.py
│   ├── nutrition_assistant_rules.py
│   ├── usda_client.py
│   └── frontend_examples.py
├── data/                   # Data files
│   └── allergen_substitution_data.json
├── tests/                  # Test suite
├── run.py                  # Entry point - run with: python run.py
├── requirements.txt
└── .env.example
```

## Quick Start

1. Copy `.env.example` to `.env` and add your API keys:
   ```
   GEMINI_API_KEY=your_key
   GROQ_API_KEY=your_key   # Optional fallback
   ```

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Run the API:
   ```
   python run.py
   ```

   Or with uvicorn directly:
   ```
   cd recipe-engine && python -m uvicorn src.api:app --host 0.0.0.0 --port 8000
   ```

## Running Tests

From the `recipe-engine` directory:
```
python tests/test_search.py
python tests/test_halal_compliance.py
python tests/test_gemini.py
```
