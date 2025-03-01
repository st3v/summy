# Summy - Web Page Summarizer

Summy is a Chrome extension that uses generative AI to provide quick, insightful summaries of web pages. It extracts the main content from any webpage and generates a concise summary along with relevant context.

## Features

- 🚀 One-click webpage summarization
- 📊 Stress score for content evaluation
- 💡 Auto-generated follow-up questions and answers
- 🏷️ Smart content categorization
- 😊 Emoji representation of content theme
- 🌐 Multi-language support (adapts to the webpage's language)

## Technical Stack

- **Frontend**: Chrome Extension (HTML, CSS, JavaScript)
- **WebAssembly Module**: Rust compiled to WebAssembly (executed within the browser)
- **AI Integration**: Multiple LLM support including:
  - Google Gemini
  - Anthropic Claude
  - DeepSeek
  - OpenAI
  - Groq
  - Ollama
  - xAI

## Project Structure

```
summy/
├── extension/          # Chrome extension files
│   ├── background.js   # Background script for service worker
│   ├── content.css     # CSS for content script
│   ├── content.js      # Content script for webpage interaction
│   ├── images          # Extension icons
│   ├── manifest.json   # Extension configuration
│   ├── options.css     # CSS for options page
│   ├── options.html    # Options page
│   └── options.js      # JavaScript for options page
└── src/                # Rust code for WASM module
```

## Architecture

Summy uses a hybrid architecture:

- **WASM Module**: Rust code compiled to WebAssembly handles the core summarization logic and interaction with LLMs
- **Options Page**: JavaScript directly interacting with the WASM module
- **Content Script**: JavaScript interacting with the WASM module via a service worker

## Development

1. Install dependencies:
```bash
cargo build
```

2. Build the extension:
```bash
npm run dev      # Development build
npm run release  # Production build
```

3. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `extension` directory

## Configuration

Visit the extension options page to:
- Select your preferred LLM model
- Configure your API key
- Test your LLM connection

## Usage

1. Click the Summy icon in your browser toolbar or use the context menu
2. Wait for the AI to process the page content
3. View the summary with additional insights in the overlay

## License

MIT License

Copyright (c) 2024 st3v

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.