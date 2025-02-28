import initSync, * as bindings from './wasm/summy_options_ui.js';
const wasm = await initSync({ module_or_path: './wasm/summy_options_ui_bg.wasm' });
window.wasmBindings = bindings;
dispatchEvent(new CustomEvent("TrunkApplicationStarted", {detail: {wasm}}));