"""
MealVista Frontend Integration Examples
========================================
Examples for integrating the Recipe Engine API with various frontends.
"""

# ============================================================================
# REACT INTEGRATION EXAMPLE
# ============================================================================

"""
File: RecipeSearch.jsx

A React component for searching and displaying recipes from MealVista API.
"""

REACT_COMPONENT = '''
import React, { useState } from 'react';
import axios from 'axios';

const RecipeSearch = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = 'http://localhost:8000';

  const searchRecipes = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/recipes/search`, {
        query: query,
        max_results: 5,
        generate_if_no_match: true
      });

      setResults(response.data);
    } catch (err) {
      setError('Failed to fetch recipes. Please try again.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    searchRecipes();
  };

  return (
    <div className="recipe-search-container">
      <h1>MealVista Recipe Search</h1>
      
      {/* Search Form */}
      <form onSubmit={handleSubmit} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for recipes or enter ingredients..."
          className="search-input"
        />
        <button type="submit" disabled={loading} className="search-button">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Example Queries */}
      <div className="example-queries">
        <p>Try:</p>
        <button onClick={() => setQuery('chicken, tomatoes, garlic')}>
          Chicken, Tomatoes, Garlic
        </button>
        <button onClick={() => setQuery('pasta recipe')}>
          Pasta Recipe
        </button>
        <button onClick={() => setQuery('I have eggs and cheese')}>
          Eggs and Cheese
        </button>
      </div>

      {/* Error Message */}
      {error && <div className="error-message">{error}</div>}

      {/* Results */}
      {results && (
        <div className="results-container">
          <div className="results-header">
            <h2>Results ({results.total_results})</h2>
            <p className="query-type">
              Query Type: <strong>{results.query_type}</strong>
            </p>
          </div>

          <div className="recipes-grid">
            {results.results.map((item, index) => (
              <RecipeCard key={index} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RecipeCard = ({ item }) => {
  const { recipe, type, similarity_score, rank } = item;
  
  return (
    <div className={`recipe-card ${type}`}>
      <div className="recipe-header">
        <h3>{recipe.title || 'Untitled Recipe'}</h3>
        <span className={`badge ${type}`}>
          {type === 'generated' ? '🤖 AI Generated' : '🔍 Search Result'}
        </span>
      </div>

      {similarity_score && (
        <div className="similarity-score">
          Match: {(similarity_score * 100).toFixed(0)}%
        </div>
      )}

      {recipe.description && (
        <p className="description">{recipe.description}</p>
      )}

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <div className="ingredients">
          <h4>Ingredients:</h4>
          <ul>
            {recipe.ingredients.slice(0, 5).map((ing, i) => (
              <li key={i}>{ing}</li>
            ))}
            {recipe.ingredients.length > 5 && (
              <li>...and {recipe.ingredients.length - 5} more</li>
            )}
          </ul>
        </div>
      )}

      {recipe.directions && recipe.directions.length > 0 && (
        <div className="directions">
          <h4>Directions:</h4>
          <ol>
            {recipe.directions.slice(0, 3).map((step, i) => (
              <li key={i}>{step}</li>
            ))}
            {recipe.directions.length > 3 && (
              <li>...{recipe.directions.length - 3} more steps</li>
            )}
          </ol>
        </div>
      )}
    </div>
  );
};

export default RecipeSearch;
'''

# ============================================================================
# VANILLA JAVASCRIPT EXAMPLE
# ============================================================================

VANILLA_JS = '''
// File: recipe-search.js

class RecipeSearchApp {
  constructor() {
    this.apiUrl = 'http://localhost:8000';
    this.searchButton = document.getElementById('search-button');
    this.searchInput = document.getElementById('search-input');
    this.resultsContainer = document.getElementById('results-container');
    
    this.init();
  }

  init() {
    this.searchButton.addEventListener('click', () => this.searchRecipes());
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.searchRecipes();
    });
  }

  async searchRecipes() {
    const query = this.searchInput.value.trim();
    if (!query) return;

    this.showLoading();

    try {
      const response = await fetch(`${this.apiUrl}/api/recipes/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          max_results: 5,
          generate_if_no_match: true
        })
      });

      if (!response.ok) throw new Error('API request failed');

      const data = await response.json();
      this.displayResults(data);
    } catch (error) {
      this.showError('Failed to fetch recipes. Please try again.');
      console.error('Error:', error);
    }
  }

  showLoading() {
    this.resultsContainer.innerHTML = `
      <div class="loading">
        <div class="spinner"></div>
        <p>Searching for recipes...</p>
      </div>
    `;
  }

  showError(message) {
    this.resultsContainer.innerHTML = `
      <div class="error">
        <p>${message}</p>
      </div>
    `;
  }

  displayResults(data) {
    if (!data.results || data.results.length === 0) {
      this.resultsContainer.innerHTML = '<p>No recipes found.</p>';
      return;
    }

    const recipesHtml = data.results.map(item => this.createRecipeCard(item)).join('');
    
    this.resultsContainer.innerHTML = `
      <div class="results-header">
        <h2>Found ${data.total_results} recipes</h2>
        <p>Query type: <strong>${data.query_type}</strong></p>
      </div>
      <div class="recipes-grid">
        ${recipesHtml}
      </div>
    `;
  }

  createRecipeCard(item) {
    const { recipe, type, similarity_score } = item;
    
    const ingredientsHtml = recipe.ingredients && recipe.ingredients.length > 0
      ? `
        <div class="ingredients">
          <h4>Ingredients:</h4>
          <ul>
            ${recipe.ingredients.slice(0, 5).map(ing => `<li>${ing}</li>`).join('')}
            ${recipe.ingredients.length > 5 ? `<li>...and ${recipe.ingredients.length - 5} more</li>` : ''}
          </ul>
        </div>
      `
      : '';

    const scoreHtml = similarity_score
      ? `<div class="similarity-score">Match: ${(similarity_score * 100).toFixed(0)}%</div>`
      : '';

    return `
      <div class="recipe-card ${type}">
        <div class="recipe-header">
          <h3>${recipe.title || 'Untitled Recipe'}</h3>
          <span class="badge ${type}">
            ${type === 'generated' ? '🤖 AI Generated' : '🔍 Search Result'}
          </span>
        </div>
        ${scoreHtml}
        ${recipe.description ? `<p class="description">${recipe.description}</p>` : ''}
        ${ingredientsHtml}
      </div>
    `;
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RecipeSearchApp();
});
'''

# ============================================================================
# HTML TEMPLATE
# ============================================================================

HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MealVista Recipe Search</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 2.5em;
        }

        .search-form {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
        }

        .search-input {
            flex: 1;
            padding: 15px;
            border: 2px solid #ddd;
            border-radius: 10px;
            font-size: 16px;
            transition: border-color 0.3s;
        }

        .search-input:focus {
            outline: none;
            border-color: #667eea;
        }

        .search-button {
            padding: 15px 40px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
        }

        .search-button:hover {
            background: #5568d3;
        }

        .search-button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }

        .example-queries {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
            align-items: center;
        }

        .example-queries p {
            color: #666;
            font-weight: bold;
        }

        .example-queries button {
            padding: 8px 15px;
            background: #f0f0f0;
            border: 1px solid #ddd;
            border-radius: 5px;
            cursor: pointer;
            transition: all 0.3s;
        }

        .example-queries button:hover {
            background: #667eea;
            color: white;
            border-color: #667eea;
        }

        .results-header {
            margin: 30px 0 20px 0;
            padding-bottom: 15px;
            border-bottom: 2px solid #f0f0f0;
        }

        .results-header h2 {
            color: #333;
            margin-bottom: 10px;
        }

        .query-type {
            color: #666;
        }

        .recipes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }

        .recipe-card {
            background: white;
            border: 2px solid #f0f0f0;
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s;
        }

        .recipe-card:hover {
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
            transform: translateY(-5px);
        }

        .recipe-card.generated {
            border-color: #667eea;
            background: linear-gradient(135deg, #f5f7ff 0%, #ffffff 100%);
        }

        .recipe-card.search {
            border-color: #48bb78;
            background: linear-gradient(135deg, #f0fff4 0%, #ffffff 100%);
        }

        .recipe-header {
            display: flex;
            justify-content: space-between;
            align-items: start;
            margin-bottom: 15px;
        }

        .recipe-header h3 {
            color: #333;
            font-size: 1.3em;
            flex: 1;
        }

        .badge {
            padding: 5px 12px;
            border-radius: 20px;
            font-size: 0.8em;
            font-weight: bold;
            white-space: nowrap;
        }

        .badge.generated {
            background: #667eea;
            color: white;
        }

        .badge.search {
            background: #48bb78;
            color: white;
        }

        .similarity-score {
            background: #f0f0f0;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-weight: bold;
            color: #666;
        }

        .description {
            color: #666;
            margin-bottom: 15px;
            line-height: 1.6;
        }

        .ingredients, .directions {
            margin-top: 15px;
        }

        .ingredients h4, .directions h4 {
            color: #333;
            margin-bottom: 10px;
            font-size: 1.1em;
        }

        .ingredients ul, .directions ol {
            margin-left: 20px;
            color: #666;
        }

        .ingredients li, .directions li {
            margin-bottom: 5px;
        }

        .loading {
            text-align: center;
            padding: 60px 20px;
        }

        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        .error {
            background: #fee;
            border: 2px solid #fcc;
            border-radius: 10px;
            padding: 20px;
            color: #c33;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🍳 MealVista Recipe Search</h1>
        
        <div class="search-form">
            <input 
                type="text" 
                id="search-input" 
                class="search-input" 
                placeholder="Search for recipes or enter ingredients..."
            />
            <button id="search-button" class="search-button">Search</button>
        </div>

        <div class="example-queries">
            <p>Try:</p>
            <button onclick="document.getElementById('search-input').value = 'chicken, tomatoes, garlic'; document.getElementById('search-button').click();">
                Chicken, Tomatoes, Garlic
            </button>
            <button onclick="document.getElementById('search-input').value = 'pasta recipe'; document.getElementById('search-button').click();">
                Pasta Recipe
            </button>
            <button onclick="document.getElementById('search-input').value = 'I have eggs and cheese'; document.getElementById('search-button').click();">
                Eggs and Cheese
            </button>
        </div>

        <div id="results-container"></div>
    </div>

    <script src="recipe-search.js"></script>
</body>
</html>
'''

# ============================================================================
# PYTHON REQUESTS EXAMPLE
# ============================================================================

PYTHON_EXAMPLE = '''
#!/usr/bin/env python3
"""
Simple Python client for MealVista Recipe Engine API
"""

import requests
import json

class MealVistaClient:
    def __init__(self, base_url='http://localhost:8000'):
        self.base_url = base_url
    
    def search_recipes(self, query, max_results=5):
        """Search for recipes."""
        url = f'{self.base_url}/api/recipes/search'
        payload = {
            'query': query,
            'max_results': max_results,
            'generate_if_no_match': True
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    
    def generate_recipe(self, ingredients, num_recipes=1):
        """Generate recipe from ingredients."""
        url = f'{self.base_url}/api/recipes/generate'
        payload = {
            'ingredients': ingredients,
            'num_recipes': num_recipes,
            'temperature': 1.0
        }
        
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()
    
    def add_recipe(self, recipe_data):
        """Add a new recipe."""
        url = f'{self.base_url}/api/recipes/add'
        response = requests.post(url, json=recipe_data)
        response.raise_for_status()
        return response.json()

# Example usage
if __name__ == '__main__':
    client = MealVistaClient()
    
    # Search for recipes
    results = client.search_recipes('chicken and tomatoes')
    print(f"Found {results['total_results']} recipes")
    
    for item in results['results']:
        recipe = item['recipe']
        print(f"- {recipe.get('title', 'Untitled')} ({item['type']})")
    
    # Generate recipe
    recipe_data = client.generate_recipe(['pasta', 'mushrooms', 'cream'])
    print(f"\\nGenerated {len(recipe_data['results'])} recipe(s)")
'''

# Save all examples
if __name__ == "__main__":
    examples = {
        'frontend/RecipeSearch.jsx': REACT_COMPONENT,
        'frontend/recipe-search.js': VANILLA_JS,
        'frontend/index.html': HTML_TEMPLATE,
        'examples/python_client.py': PYTHON_EXAMPLE
    }
    
    print("Frontend Integration Examples")
    print("=" * 70)
    print()
    print("The following examples demonstrate how to integrate")
    print("the MealVista Recipe Engine API with various frontends:")
    print()
    
    for filename, content in examples.items():
        print(f"📄 {filename}")
        print(f"   {len(content)} characters")
    
    print()
    print("To use these examples:")
    print("1. Start the API server: python api.py")
    print("2. Copy the appropriate example for your frontend")
    print("3. Update the API_BASE_URL if needed")
    print("4. Integrate into your MealVista application")
