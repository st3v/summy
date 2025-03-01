const fs = require('fs');
const path = require('path');

// Read package.json
const packageJson = require('../package.json');

// Read manifest.json
const manifestPath = path.join(__dirname, '../extension/manifest.json');
const manifest = require(manifestPath);

// Update version
manifest.version = packageJson.version;

// Write back to manifest.json
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`Updated manifest version to ${packageJson.version}`);