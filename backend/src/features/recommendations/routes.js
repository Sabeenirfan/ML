/**
 * Recommendation API for Home Page
 * GET /api/recommendations - personalized list (cached, refreshed every 12h)
 * POST /api/recommendations/interaction - record view / like / save / cooked
 */

const express = require('express');
const router = express.Router();
const recommendationService = require('../../services/recommendationService');
const auth = require('../../middleware/auth');

/**
 * Auth middleware that sets req.userId if token present, but does not 401
 */
async function optionalAuth(req, res, next) {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
    }
  } catch (_) {}
  next();
}

/**
 * @route   GET /api/recommendations
 * @desc    Get personalized recipe recommendations for the home page.
 *          Uses cache when fresh; otherwise computes (cold start or behavior-based) and caches.
 * @access  Optional auth: if no token, returns empty; if token, returns personalized list
 * @query   limit (optional) - max items, default 24
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const userId = req.userId || null;
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 24));
    const skipCache = req.query.refresh === 'true' || req.query.refresh === '1';

    if (!userId) {
      return res.json({
        success: true,
        recommendations: [],
        count: 0,
        isAuthenticated: false,
        message: 'Sign in to get personalized recommendations',
      });
    }

    const recommendations = await recommendationService.getRecommendationsForUser(userId, limit, skipCache);

    res.json({
      success: true,
      recommendations,
      count: recommendations.length,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error('[GET /api/recommendations]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to load recommendations',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/recommendations/interaction
 * @desc    Record user interaction (view, like, save, cooked) for behavior-based recommendations.
 * @access  Protected
 * @body    { recipeId, recipeTitle?, type: 'view'|'like'|'save'|'cooked', cuisine?, category? }
 */
router.post('/interaction', auth, async (req, res) => {
  try {
    const userId = req.userId;
    const { recipeId, recipeTitle, type, cuisine, category } = req.body;

    if (!recipeId || !type) {
      return res.status(400).json({
        success: false,
        message: 'recipeId and type (view, like, save, cooked) are required',
      });
    }

    const validTypes = ['view', 'like', 'save', 'cooked'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `type must be one of: ${validTypes.join(', ')}`,
      });
    }

    await recommendationService.recordInteraction(userId, {
      recipeId,
      recipeTitle: recipeTitle || '',
      type,
      cuisine: cuisine || null,
      category: category || null,
    });

    res.json({
      success: true,
      message: 'Interaction recorded',
    });
  } catch (error) {
    console.error('[POST /api/recommendations/interaction]', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record interaction',
      error: error.message,
    });
  }
});

module.exports = router;
