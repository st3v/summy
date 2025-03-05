#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import TOML from '@iarna/toml';
import { createRequire } from 'module';

const __dirname = import.meta.dirname;

// We need createRequire to import JSON files
const require = createRequire(import.meta.url);

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