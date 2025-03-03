# Summy

Summy is a Chrome extension that uses generative AI to provide quick, insightful summaries of web pages.

Upon user request, Summy extracts the main content from a given webpage and uses an LLM of choice to generate a concise summary along with relevant context.

Summy runs inside the browser. It interacts with the LLM provider of your choice but does not send any data elsewhere.

## Features

- 🚀 One-click webpage summarization
- 🌐 Multi-language support with automatic language detection and matching
- 🏷️ Smart content categorization
- 📊 Content analysis with stress level score
- 😊 Emoji representation of content themes
- 💡 Auto-generated follow-up questions and answers
- ❓ Ask your own questions about the webpage content in the language of your choice

### AI Integration
Summy supports multiple LLMs including:
  - Google Gemini
  - Anthropic Claude
  - OpenAI
  - DeepSeek
  - Groq
  - Ollama
  - xAI

## Installation

Summy is not yet listed in the Chrome Web Store. For the time being, see [Development](#development) on how to build and install the extension.

## Configuration

in Chrome, visit Summy's options page to:
- Select your preferred LLM model
- Configure your API key
- Test your LLM connection

## Usage

1. Click the Summy button floating on the lower right of the webpage or use the context menu
2. Wait for the AI to process the page content
3. View the summary with additional insights:
   - Concise text summary
   - Content category
   - Stress level score (0-9)
   - Follow-up questions and answers
   - Emoji-based content visualization
4. Ask your own questions

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

## License

MIT License

Copyright (c) 2024 st3v

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.