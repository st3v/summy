#!/bin/bash
set -e

# Script to package the Summy extension for publishing

echo "Packaging Summy extension for publishing..."

# Define absolute paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

OUTPUT_DIR="$PROJECT_ROOT/dist"
mkdir -p "$OUTPUT_DIR"

OUTPUT_FILE="$OUTPUT_DIR/summy.zip"

# Create a clean directory for packaging
PACKAGE_DIR=$(mktemp -d)
echo "Using temporary directory: $PACKAGE_DIR"

# Copy required extension files
cp -r "$PROJECT_ROOT/extension/"* "$PACKAGE_DIR"/

# Remove any development or unnecessary files
rm -rf "$PACKAGE_DIR"/*.map
rm -rf "$PACKAGE_DIR"/.DS_Store

# Remove previous zip if it exists
if [ -f "$OUTPUT_FILE" ]; then
  rm "$OUTPUT_FILE"
fi

# Create a zip file with all the extension files
cd "$PACKAGE_DIR" && zip -r "$OUTPUT_FILE" .

# Check if zip was created successfully
if [ -f "$OUTPUT_FILE" ]; then
  echo "Extension packaged successfully to: $OUTPUT_FILE"
else
  echo "Error: Failed to create zip file at $OUTPUT_FILE"
  exit 1
fi

# Clean up temporary directory
rm -rf "$PACKAGE_DIR"

echo ""
echo "Now you can upload this zip file to the Chrome Web Store Developer Dashboard."
echo "Visit: https://chrome.google.com/webstore/devconsole/"