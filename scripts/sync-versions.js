#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const TOML = require('@iarna/toml');

// Read package.json (source of truth for version)
const packageJson = require('../package.json');
const version = packageJson.version;

console.log(`Syncing version ${version} across all project files...`);

// Update manifest.json
const manifestPath = path.join(__dirname, '../extension/manifest.json');
const manifest = require(manifestPath);
manifest.version = version;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`✓ Updated manifest.json version`);

// Update Cargo.toml
const cargoPath = path.join(__dirname, '../Cargo.toml');
const cargoContent = fs.readFileSync(cargoPath, 'utf8');
const cargo = TOML.parse(cargoContent);
cargo.package.version = version;
fs.writeFileSync(cargoPath, TOML.stringify(cargo));
console.log(`✓ Updated Cargo.toml version`);

console.log(`\nAll versions successfully synced to ${version}`);