'use strict';
const fs = require('fs');
const path = require('path');

const pkgDir = path.join(__dirname, '..', 'node_modules', '@expo', 'metro-runtime');
const pkgPath = path.join(pkgDir, 'package.json');
const stubPath = path.join(pkgDir, 'ErrorOverlayStub.js');

if (!fs.existsSync(pkgPath)) {
  console.warn('[patch-metro-runtime] @expo/metro-runtime not found, skipping.');
  process.exit(0);
}

const stubContent = `'use strict';
const React = require('react');

function LogBoxInspectorContainer() {
  return React.createElement(React.Fragment, null);
}

module.exports = { LogBoxInspectorContainer };
module.exports.default = LogBoxInspectorContainer;
`;

const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

if (pkg.main === 'async-require.js' && pkg.exports) {
  console.log('[patch-metro-runtime] Already patched.');
  process.exit(0);
}

pkg.main = 'async-require.js';
pkg.exports = {
  '.': './async-require.js',
  './src/error-overlay/ErrorOverlay': './ErrorOverlayStub.js',
  './src/error-overlay': './ErrorOverlayStub.js',
};

fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
fs.writeFileSync(stubPath, stubContent);
console.log('[patch-metro-runtime] Patched @expo/metro-runtime for Windows/Metro resolution.');
process.exit(0);
