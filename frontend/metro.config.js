// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix Windows: bundle URLs must use forward slashes. path.relative() uses backslashes on Windows,
// which produces invalid URLs (e.g. node_modules\expo-router\_error.bundle) and 500 / MIME errors.
function normalizeUrl(url) {
  return url.replace(/\\/g, '/').replace(/%5C/gi, '/');
}

const defaultRewrite = config.server?.rewriteRequestUrl;
config.server = config.server || {};
config.server.rewriteRequestUrl = (url) => {
  const normalized = normalizeUrl(url);
  const result = defaultRewrite ? defaultRewrite(normalized) : normalized;
  return typeof result === 'string' ? normalizeUrl(result) : result;
};

module.exports = config;
