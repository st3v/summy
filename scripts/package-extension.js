#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import AdmZip from 'adm-zip';

// Script to package the Summy extension for publishing
console.log("Packaging Summy extension for publishing...");

// Define absolute paths
const __dirname = import.meta.dirname;
const PROJECT_ROOT = path.dirname(__dirname);
const OUTPUT_DIR = path.join(PROJECT_ROOT, 'dist');

// Create output directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const OUTPUT_FILE = path.join(OUTPUT_DIR, 'summy.zip');

// Create a clean directory for packaging
const PACKAGE_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'summy-package-'));
console.log(`Using temporary directory: ${PACKAGE_DIR}`);

// Copy required extension files
const copyRecursiveSync = (src, dest) => {
  const exists = fs.existsSync(src);
  if (!exists) return;

  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    // Skip source maps and macOS .DS_Store files
    if (src.endsWith('.map') || path.basename(src) === '.DS_Store') {
      return;
    }
    fs.copyFileSync(src, dest);
  }
};

copyRecursiveSync(path.join(PROJECT_ROOT, 'extension'), PACKAGE_DIR);

// Remove previous zip if it exists
if (fs.existsSync(OUTPUT_FILE)) {
  fs.unlinkSync(OUTPUT_FILE);
}

// Create zip file using adm-zip
try {
  const zip = new AdmZip();

  // Add the entire package directory to the zip
  zip.addLocalFolder(PACKAGE_DIR);

  // Write the zip file
  zip.writeZip(OUTPUT_FILE);

  console.log(`Extension packaged successfully to: ${OUTPUT_FILE}`);
} catch (error) {
  console.error(`Error creating zip file: ${error.message}`);
  process.exit(1);
}

// Clean up temporary directory
fs.rmSync(PACKAGE_DIR, { recursive: true, force: true });

console.log("");
console.log("Now you can upload this zip file to the Chrome Web Store Developer Dashboard.");
console.log("Visit: https://chrome.google.com/webstore/devconsole/");