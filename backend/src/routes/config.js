/**
 * Route configuration for dynamic loading.
 * Add new routes here to register them with the app.
 */
const routeConfig = [
  { path: '/api/auth', module: () => require('../features/auth/routes') },
  { path: '/api/auth/google', module: () => require('../features/auth/google-routes') },
  { path: '/api/otp-auth', module: () => require('../features/otp/routes') },
  { path: '/api/recipes', module: () => require('../features/recipes/routes') },
  { path: '/api/ai-recipes', module: () => require('../features/ai-recipes/routes') },
  { path: '/api/recommendations', module: () => require('../features/recommendations/routes') },
  { path: '/api/admin', module: () => require('../features/admin/routes') },
  { path: '/api/admin/inventory', module: () => require('../features/inventory/routes') },
];

module.exports = routeConfig;
