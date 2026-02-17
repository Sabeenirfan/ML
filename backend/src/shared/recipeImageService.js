/**
 * Recipe image lookup via Unsplash Search API.
 * Uses recipe-specific search so the image matches the actual dish (not random).
 * Set UNSPLASH_ACCESS_KEY in .env to enable.
 */

const axios = require('axios');

const UNSPLASH_ACCESS_KEY = (process.env.UNSPLASH_ACCESS_KEY || '').trim();
const UNSPLASH_API = 'https://api.unsplash.com/search/photos';

/**
 * Build a search query that matches the recipe so Unsplash returns the right dish.
 * Prefers image_description (from AI), then title + key ingredients.
 */
function buildRecipeImageQuery(recipe) {
  const title = (recipe.title || recipe.name || '').trim();
  const desc = (recipe.image_description || '').trim();
  const ingredients = recipe.ingredients || [];

  if (desc) {
    return desc.slice(0, 100).replace(/\s+/g, ' ');
  }
  const words = title.split(/\s+/).filter((w) => w.length > 2);
  const keyIng = ingredients
    .slice(0, 3)
    .map((i) => (typeof i === 'string' ? i : (i && i.name) || '').trim())
    .filter(Boolean)
    .map((s) => s.replace(/\d+\s*(g|ml|tbsp|tsp|cup|oz)?\s*/gi, '').trim())
    .filter((s) => s.length > 2);
  const combined = [...words, ...keyIng].slice(0, 5).join(' ');
  return (combined || title).slice(0, 100).replace(/\s+/g, ' ');
}

/**
 * Get a photo URL for a recipe using a query that matches the dish (not random).
 * @param {string} title - Recipe title (fallback if no recipe)
 * @param {{ image_description?: string, ingredients?: string[] }} [recipe] - Optional recipe for specific search
 * @returns {Promise<string|null>} - Image URL or null
 */
async function getRecipeImageUrl(title, recipe = null) {
  if (!UNSPLASH_ACCESS_KEY) return null;
  const query = recipe
    ? buildRecipeImageQuery(recipe)
    : (title && typeof title === 'string' ? title.trim().slice(0, 100).replace(/\s+/g, ' ') : '');
  const searchQuery = (query || title || '').trim();
  if (!searchQuery) return null;

  try {
    const response = await axios.get(UNSPLASH_API, {
      params: {
        query: searchQuery + ' food dish',
        client_id: UNSPLASH_ACCESS_KEY,
        per_page: 1,
        orientation: 'landscape',
      },
      timeout: 5000,
    });
    const results = response.data?.results;
    if (Array.isArray(results) && results.length > 0) {
      const urls = results[0].urls;
      return (urls?.regular || urls?.small || urls?.full) || null;
    }
  } catch (err) {
    if (err.response?.status === 403 || err.response?.status === 401) {
      console.warn('[recipeImageService] Unsplash API key invalid or rate limited');
    }
  }
  return null;
}

/**
 * Attach image_url to each recipe so the image matches the recipe (uses image_description or title + ingredients).
 * Skips if recipe already has image_url.
 */
async function attachRecipeImages(results, concurrency = 3) {
  if (!Array.isArray(results) || results.length === 0) return;
  if (!UNSPLASH_ACCESS_KEY) return;

  const queue = results
    .filter((r) => r && r.recipe && !r.recipe.image_url)
    .map((r) => ({ result: r, recipe: r.recipe, title: r.recipe.title || r.recipe.name || '' }));
  if (queue.length === 0) return;

  for (let i = 0; i < queue.length; i += concurrency) {
    const batch = queue.slice(i, i + concurrency);
    const urls = await Promise.all(
      batch.map(({ title, recipe }) => getRecipeImageUrl(title, recipe))
    );
    batch.forEach(({ result }, j) => {
      if (urls[j]) result.recipe.image_url = urls[j];
    });
  }
}

module.exports = { getRecipeImageUrl, attachRecipeImages, buildRecipeImageQuery };
