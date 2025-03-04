#!/bin/bash
set -e

# Script to package the Summy extension for publishing

echo "Packaging Summy extension for publishing..."

# Create a clean directory for packaging
PACKAGE_DIR=$(mktemp -d)
echo "Using temporary directory: $PACKAGE_DIR"

# Copy required extension files
cp -r $(dirname "$0")/../extension/* "$PACKAGE_DIR"/

# Remove any development or unnecessary files
rm -rf "$PACKAGE_DIR"/*.map
rm -rf "$PACKAGE_DIR"/.DS_Store

# Create the zip file
OUTPUT_FILE="$(dirname "$0")/../summy-extension.zip"

# Remove previous zip if it exists
if [ -f "$OUTPUT_FILE" ]; then
  rm "$OUTPUT_FILE"
fi

# Create a zip file with all the extension files
cd "$PACKAGE_DIR" && zip -r "$OUTPUT_FILE" .

# Clean up temporary directory
rm -rf "$PACKAGE_DIR"

echo "Extension packaged successfully to: $OUTPUT_FILE"
echo ""
echo "Now you can upload this zip file to the Chrome Web Store Developer Dashboard."
echo "Visit: https://chrome.google.com/webstore/devconsole/"