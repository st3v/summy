import * as backgroundBindings from './wasm/summy_background.js';

// Get the version from manifest.json
const manifest = chrome.runtime.getManifest();
document.getElementById('version-number').textContent = manifest.version;

// Initialize the background module
await backgroundBindings.default({
  module_or_path: './wasm/summy_background_bg.wasm'
});

// Storage keys
const MODEL_KEY = 'llm_model';
const API_KEY_KEY = 'llm_api_key';

// Load saved options
async function loadOptions() {
  const result = await chrome.storage.sync.get({
    [MODEL_KEY]: '',
    [API_KEY_KEY]: ''
  });

  document.getElementById('model').value = result[MODEL_KEY];
  document.getElementById('api-key').value = result[API_KEY_KEY];
}

// Save options
async function saveOptions() {
  const model = document.getElementById('model').value;
  const apiKey = document.getElementById('api-key').value;

  await chrome.storage.sync.set({
    [MODEL_KEY]: model,
    [API_KEY_KEY]: apiKey
  });
}

// Test LLM connection
async function testLLM() {
  const responseElement = document.getElementById('test-response');
  responseElement.textContent = 'Testing...';

  try {
    // Save current options before testing
    await saveOptions();

    // Call the test_llm function from the background module
    const result = await backgroundBindings.test_llm();
    responseElement.textContent = result;
  } catch (error) {
    responseElement.textContent = `Error: ${error.message || error}`;
  }
}

await loadOptions();

// Set up event listeners
document.getElementById('model').addEventListener('change', saveOptions);
document.getElementById('api-key').addEventListener('change', saveOptions);
document.getElementById('test-button').addEventListener('click', testLLM);

// Password visibility toggle
const togglePasswordButton = document.getElementById('toggle-password');
const apiKeyInput = document.getElementById('api-key');

togglePasswordButton.addEventListener('click', function() {
  // Toggle the password visibility
  const type = apiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
  apiKeyInput.setAttribute('type', type);

  // Toggle the icon
  togglePasswordButton.classList.toggle('password-visible');
});