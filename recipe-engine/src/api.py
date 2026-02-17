"""
MealVista Recipe Engine - REST API Implementation
==================================================
FastAPI-based REST API for the recipe engine.
"""

import os
from dotenv import load_dotenv

# Load .env from project root (parent of src/)
_current_dir = os.path.dirname(os.path.abspath(__file__))
load_dotenv(dotenv_path=os.path.join(_current_dir, "..", ".env"))

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uvicorn
from mealvista_recipe_engine import MealVistaRecipeEngine
from recipe_database import get_all_recipes
from groq_generator import generate_personalized_recommendations
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
if os.getenv("GEMINI_API_KEY"):
    logger.info("GEMINI_API_KEY found in environment")

# Initialize FastAPI app
app = FastAPI(
    title="MealVista Recipe Engine API",
    description="Recipe search API (database only, no AI models)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global recipe engine instance
recipe_engine: Optional[MealVistaRecipeEngine] = None


# Pydantic Models for Request/Response
class RecipeRequest(BaseModel):
    """Request model for recipe queries."""
    query: str = Field(..., description="User query for recipes", min_length=1)
    max_results: int = Field(
        50, description="Maximum number of results", ge=1, le=200)
    generate_if_no_match: bool = Field(
        True, description="Generate recipe if no search results")
    user_allergens: Optional[List[str]] = Field(
        None, description="User allergen list for safe substitutions (e.g. ['dairy', 'nuts'])")


class RecipeIngredient(BaseModel):
    """Model for recipe ingredients."""
    name: str
    quantity: Optional[str] = None
    unit: Optional[str] = None


class RecipeDetail(BaseModel):
    """Model for recipe details."""
    title: Optional[str] = None
    ingredients: List[Any] = []
    directions: List[str] = []
    description: Optional[str] = None
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    servings: Optional[int] = None
    calories: Optional[int] = None
    macros: Optional[Dict[str, str]] = None
    micros: Optional[Dict[str, str]] = None


class RecipeResult(BaseModel):
    """Model for a single recipe result."""
    type: str = Field(..., description="Type of result: 'search', 'generated', or 'generated_fallback'")
    recipe: Dict[str, Any]
    rank: int
    similarity_score: Optional[float] = None
    raw_text: Optional[str] = None
    recipe_with_substitutions: Optional[Dict[str, Any]] = Field(
        None, description="Recipe with allergen-safe substitutions applied (when user_allergens provided)")
    substitutions: Optional[List[Dict[str, Any]]] = Field(
        None, description="List of {original, alternative, allergen} (when user_allergens provided)")


class RecipeResponse(BaseModel):
    """Response model for recipe queries."""
    query: str
    query_type: str
    results: List[RecipeResult]
    ingredients: Optional[List[str]] = None
    total_results: int
    message: Optional[str] = None  # e.g. "AI limit reached - try again in a few minutes"


class AddRecipeRequest(BaseModel):
    """Request model for adding a new recipe."""
    title: str = Field(..., min_length=1)
    ingredients: List[str] = Field(..., min_length=1)
    directions: Optional[List[str]] = None
    description: Optional[str] = None
    prep_time: Optional[str] = None
    cook_time: Optional[str] = None
    servings: Optional[int] = None


class RecommendRequest(BaseModel):
    """Request for AI-generated personalized recommendations (no database)."""
    dietary_preferences: Optional[List[str]] = Field(
        default_factory=list, description="e.g. dairy-free, vegan, halal")
    allergens: Optional[List[str]] = Field(
        default_factory=list, description="Ingredients to avoid")
    health_goal: Optional[str] = Field(
        "maintain", description="lose | maintain | gain")
    bmi_category: Optional[str] = Field(None, description="Optional")
    preferred_cuisines: Optional[List[str]] = Field(
        default_factory=list, description="Optional cuisines")


class GenerateRecipeRequest(BaseModel):
    """Request model for generating recipes from ingredients."""
    ingredients: List[str] = Field(..., min_length=1,
                                   description="List of ingredients")
    num_recipes: int = Field(
        1, ge=1, le=5, description="Number of recipe variations")
    temperature: float = Field(
        1.0, ge=0.1, le=2.0, description="Generation temperature")


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str
    engine_loaded: bool
    version: str


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize the recipe engine on startup (database only, no AI models)."""
    global recipe_engine

    logger.info("Initializing MealVista Recipe Engine (database only)...")
    try:
        recipe_engine = MealVistaRecipeEngine()
        count = len(get_all_recipes())
        logger.info(f"Recipe Engine ready. Database has {count} recipes.")
    except Exception as e:
        logger.error(f"Failed to initialize Recipe Engine: {e}")
        raise


@app.get("/", response_model=HealthCheckResponse)
async def root():
    """Root endpoint - health check."""
    return {
        "status": "healthy",
        "engine_loaded": recipe_engine is not None,
        "version": "1.0.0"
    }


@app.get("/health", response_model=HealthCheckResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy" if recipe_engine else "unhealthy",
        "engine_loaded": recipe_engine is not None,
        "version": "1.0.0"
    }


@app.post("/api/recipes/search", response_model=RecipeResponse)
async def search_recipes(request: RecipeRequest):
    """
    Search or generate recipes based on user query.

    This endpoint intelligently routes queries to either:
    - Recipe generation (for ingredient-based queries)
    - Semantic search (for name-based queries)
    """
    if not recipe_engine:
        raise HTTPException(
            status_code=503, detail="Recipe engine not initialized")

    try:
        logger.info(f"Processing query: {request.query}")

        result = recipe_engine.process_query(
            query=request.query,
            max_results=request.max_results,
            generate_if_no_match=request.generate_if_no_match,
            user_allergens=request.user_allergens
        )

        # Convert to response model (use engine's total_results when present)
        results_list = result.get('results') or []
        total = result.get('total_results')
        if total is None:
            total = len(results_list)

        response = RecipeResponse(
            query=result['query'],
            query_type=result.get('query_type', 'name_based'),
            results=[RecipeResult(**r) for r in results_list],
            ingredients=result.get('ingredients'),
            total_results=total,
            message=result.get('message'),
        )

        logger.info(f"Returning {response.total_results} results")
        # Log the first result's keys for structure debugging
        if response.results:
            logger.info(f"Top result keys: {list(response.results[0].recipe.keys())}")
            
        return response

    except Exception as e:
        logger.error(f"Error processing query: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/recipes/recommend")
async def recommend_recipes(request: RecommendRequest):
    """
    Generate 5-6 personalized recipes from user profile using AI only (no database).
    Strict dietary, allergen, and health-goal rules. Retries until at least 5 valid recipes.
    """
    if not recipe_engine or not recipe_engine.groq or not recipe_engine.groq.client:
        raise HTTPException(
            status_code=503,
            detail="Recommendation engine not available. Set GROQ_API_KEY in recipe-engine/.env",
        )
    profile = {
        "dietaryPreferences": request.dietary_preferences or [],
        "allergens": request.allergens or [],
        "healthGoal": (request.health_goal or "maintain").strip().lower(),
        "bmiCategory": request.bmi_category,
        "preferredCuisines": request.preferred_cuisines or [],
    }
    try:
        results = generate_personalized_recommendations(
            recipe_engine.groq,
            profile,
            min_recipes=5,
            max_retries=2,
        )
    except Exception as e:
        logger.exception("Recommendation generation failed")
        raise HTTPException(status_code=500, detail=str(e))
    # Return both engine shape (for backend) and spec shape (recommendations array)
    recommendations = []
    for item in results:
        r = item.get("recipe") or {}
        recommendations.append({
            "title": r.get("title") or r.get("name"),
            "description": r.get("description", ""),
            "ingredients": r.get("ingredients", []),
            "instructions": r.get("instructions", r.get("directions", [])),
            "calories": r.get("calories", 350),
            "tags": r.get("tags", []),
            "reason": r.get("reason", ""),
            "prep_time": r.get("prep_time"),
            "cook_time": r.get("cook_time"),
            "servings": r.get("servings"),
            "protein": r.get("protein"),
            "carbs": r.get("carbs"),
            "fat": r.get("fat"),
        })
    return {
        "recommendations": recommendations,
        "results": results,
        "total_results": len(recommendations),
    }


@app.post("/api/recipes/generate")
async def generate_recipes(request: GenerateRecipeRequest):
    """
    Recipe generation is disabled (no AI models). Use POST /api/recipes/search
    with a query like "chicken, rice, tomatoes" to find recipes by ingredients.
    """
    if not recipe_engine:
        raise HTTPException(
            status_code=503, detail="Recipe engine not initialized")
    raise HTTPException(
        status_code=501,
        detail="Recipe generation is disabled. Use POST /api/recipes/search with your ingredients as the query."
    )


@app.post("/api/recipes/add")
async def add_recipe(request: AddRecipeRequest):
    """
    Add a new recipe to the searchable database.
    """
    if not recipe_engine:
        raise HTTPException(
            status_code=503, detail="Recipe engine not initialized")

    try:
        recipe_dict = request.dict()
        recipe_engine.add_recipe_to_database(recipe_dict)

        logger.info(f"Added recipe: {request.title}")

        return {
            "status": "success",
            "message": f"Recipe '{request.title}' added successfully",
            "recipe": recipe_dict
        }

    except Exception as e:
        logger.error(f"Error adding recipe: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/recipes/stats")
async def get_stats():
    """
    Get statistics about the recipe database (database only, no AI models).
    """
    if not recipe_engine:
        raise HTTPException(
            status_code=503, detail="Recipe engine not initialized")
    try:
        total_recipes = len(get_all_recipes())
        return {
            "total_recipes": total_recipes,
            "mode": "database_only"
        }
    except Exception as e:
        logger.error(f"Error getting stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# Example queries endpoint for documentation
@app.get("/api/examples")
async def get_example_queries():
    """
    Get example queries to help users understand the API.
    """
    return {
        "ingredient_based_queries": [
            "I have chicken, tomatoes, and garlic",
            "chicken, rice, curry powder",
            "make something with eggs and cheese",
            "pasta, mushrooms, cream"
        ],
        "name_based_queries": [
            "Find me a pasta recipe",
            "Greek salad recipe",
            "chicken tikka masala",
            "chocolate cake"
        ],
        "general_food_questions": [
            "what is the difference between baking soda and baking powder?",
            "how long to boil eggs?",
            "what temperature to bake bread?",
            "is quinoa gluten-free?"
        ],
        "tips": [
            "For ingredient-based queries, list ingredients with commas or use phrases like 'I have...'",
            "For name-based queries, specify the dish name or type",
            "The engine uses database search only (no AI generation)",
            "All recipes are halal-certified and filtered for compliance"
        ]
    }


if __name__ == "__main__":
    # Run the API server
    uvicorn.run(
        "api:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Set to False in production
        log_level="info"
    )
