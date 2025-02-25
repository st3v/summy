import init, * as bindings from './wasm/summy_options.js';
const wasm = await init({ module_or_path: './wasm/summy_options_bg.wasm' });
window.wasmBindings = bindings;
dispatchEvent(new CustomEvent("TrunkApplicationStarted", {detail: {wasm}}));