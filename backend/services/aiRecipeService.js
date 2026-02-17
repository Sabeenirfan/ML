/**
 * AI Recipe Service
 * Connects Node.js backend to Python AI Recipe Engine
 * Place this file in: backend/services/aiRecipeService.js
 */

const axios = require('axios');

// Get AI Engine URL from environment or use default
const AI_ENGINE_URL = process.env.AI_RECIPE_ENGINE_URL || 'http://localhost:8000';

class AIRecipeService {
  constructor() {
    this.baseURL = AI_ENGINE_URL;
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 300000, // Increased to 5 minutes (300s) for slow CPU generation/downloads
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log(`🤖 AI Recipe Service initialized: ${this.baseURL}`);
  }

  /**
   * Check if AI Engine is available
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health');
      return {
        available: true,
        status: response.data.status,
        engineLoaded: response.data.engine_loaded
      };
    } catch (error) {
      console.error('❌ AI Engine health check failed:', error.message);
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Search or generate recipes based on user query
   * 
   * @param {string} query - User query (e.g., "chicken curry" or "I have tomatoes and rice")
   * @param {number} maxResults - Maximum number of results to return
   * @param {boolean} generateIfNoMatch - Generate recipe if no search results found
   * @param {string[]} [userAllergens] - Optional list of allergens (e.g. ['dairy', 'nuts']) for safe substitutions
   * @returns {Promise<Object>} Recipe results (may include recipe_with_substitutions and substitutions per result)
   */
  async searchRecipes(query, maxResults = 5, generateIfNoMatch = true, userAllergens = null) {
    try {
      console.log(`🔍 AI Recipe Search: "${query}"`);
      
      const body = {
        query,
        max_results: maxResults,
        generate_if_no_match: generateIfNoMatch
      };
      if (userAllergens && Array.isArray(userAllergens) && userAllergens.length > 0) {
        body.user_allergens = userAllergens;
      }
      
      const response = await this.client.post('/api/recipes/search', body);

      console.log(`✅ Found ${response.data.total_results} recipes`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      const detail = error.response?.data || error.message;
      const code = error.code || error.response?.status;
      console.error('❌ Recipe search failed:', error.message, code ? `(${code})` : '');
      if (error.code === 'ECONNREFUSED') {
        console.warn('💡 Start the Python AI engine for unique recipes: cd recipe-engine && python api.py');
      } else if (error.code === 'ECONNABORTED') {
        console.warn('💡 Python engine timed out. Ensure it is running (python api.py) and not overloaded.');
      }
      return {
        success: false,
        error: detail,
        fallback: true
      };
    }
  }

  /**
   * Generate recipes from a list of ingredients
   * 
   * @param {Array<string>} ingredients - List of ingredients
   * @param {number} numRecipes - Number of recipe variations to generate
   * @param {number} temperature - Creativity level (0.5-2.0)
   * @returns {Promise<Object>} Generated recipes
   */
  async generateRecipe(ingredients, numRecipes = 1, temperature = 1.0) {
    try {
      console.log(`🧪 Generating recipe with: ${ingredients.join(', ')}`);
      
      const response = await this.client.post('/api/recipes/generate', {
        ingredients,
        num_recipes: numRecipes,
        temperature
      });

      console.log(`✅ Generated ${response.data.total_results} recipe(s)`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Recipe generation failed:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Add a recipe to the AI Engine's searchable database
   * 
   * @param {Object} recipe - Recipe object
   * @returns {Promise<Object>} Result
   */
  async addRecipe(recipe) {
    try {
      const response = await this.client.post('/api/recipes/add', recipe);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Add recipe failed:', error.message);
      return {
        success: false,
        error: error.response?.data || error.message
      };
    }
  }

  /**
   * Get statistics about the AI Recipe Engine
   * 
   * @returns {Promise<Object>} Statistics
   */
  async getStats() {
    try {
      const response = await this.client.get('/api/recipes/stats');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Get stats failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get example queries to help users
   * 
   * @returns {Promise<Object>} Example queries
   */
  async getExamples() {
    try {
      const response = await this.client.get('/api/examples');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
module.exports = new AIRecipeService();
