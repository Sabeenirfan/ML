/**
 * Dynamic route loader.
 * Mounts all routes from config onto the Express app.
 */
const routeConfig = require('./config');

function loadRoutes(app) {
  for (const { path, module } of routeConfig) {
    const router = typeof module === 'function' ? module() : module;
    if (router && typeof router === 'function') {
      app.use(path, router);
    }
  }
}

module.exports = loadRoutes;
