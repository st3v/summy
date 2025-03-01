import initBackgroundSync, * as backgroundBindings from './wasm/summy_background.js';
import initOptionsSync, * as optionsBindings from './wasm/summy_options_ui.js';

// Initialize background first
const backgroundWasm = await initBackgroundSync({
    module_or_path: './wasm/summy_background_bg.wasm'
});

globalThis.summy_background = backgroundBindings;

// Initialize options UI
const optionsWasm = await initOptionsSync({
    module_or_path: './wasm/summy_options_ui_bg.wasm',
});

dispatchEvent(new CustomEvent("TrunkApplicationStarted", {detail: {wasm: optionsWasm}}));