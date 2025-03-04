import * as wasm from './wasm/summy_background.js';
import {
  MODEL_KEY,
  API_KEY_KEY,
  DEFAULT_MODEL,
  SHOW_BUTTON_KEY,
  SHOW_BUTTON_DEFAULT
 } from './constants.js';

// Get the version from manifest.json
const manifest = chrome.runtime.getManifest();
document.getElementById('version-number').textContent = manifest.version;

// Initialize the wasm module
await wasm.default({
  module_or_path: './wasm/summy_background_bg.wasm'
});

// Load saved options
async function loadOptions() {
  console.log("Loading options", SHOW_BUTTON_KEY);

  const result = await chrome.storage.sync.get({
    [MODEL_KEY]: DEFAULT_MODEL,
    [API_KEY_KEY]: '',
    [SHOW_BUTTON_KEY]: SHOW_BUTTON_DEFAULT
  });

  document.getElementById('model').value = result[MODEL_KEY];
  document.getElementById('api-key').value = result[API_KEY_KEY];
  document.getElementById('show-button').checked = result[SHOW_BUTTON_KEY];
}

// Save options
async function saveOptions() {
  const model = document.getElementById('model').value;
  const apiKey = document.getElementById('api-key').value;
  const showButton = document.getElementById('show-button').checked;

  await chrome.storage.sync.set({
    [MODEL_KEY]: model,
    [API_KEY_KEY]: apiKey,
    [SHOW_BUTTON_KEY]: showButton
  });

  // Notify all tabs about the button visibility change
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, { msg: "summy_update_button_visibility", show: showButton });
    } catch (error) {
      console.debug(`Could not send message to tab ${tab.id}:`, error);
    }
  }
}

// Test LLM connection
async function testLLM() {
  const responseElement = document.getElementById('test-response');
  responseElement.textContent = 'Testing...';

  try {
    // Save current options before testing
    await saveOptions();

    // Get the current values
    const model = document.getElementById('model').value;
    const apiKey = document.getElementById('api-key').value;

    const result = await wasm.verify_access(model, apiKey);
    responseElement.textContent = result;
  } catch (error) {
    responseElement.textContent = `Error: ${error.message || error}`;
  }
}

await loadOptions();

// Set up event listeners
document.getElementById('model').addEventListener('change', saveOptions);
document.getElementById('api-key').addEventListener('change', saveOptions);
document.getElementById('show-button').addEventListener('change', saveOptions);
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