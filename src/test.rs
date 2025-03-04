#![cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;

// Configure tests to run in browser
wasm_bindgen_test_configure!(run_in_browser);

const TEST_MODEL: &str = env!("SUMMY_TEST_MODEL");
const TEST_API_KEY: &str = env!("SUMMY_TEST_API_KEY");

#[wasm_bindgen_test]
async fn verify_access() {
    let result = crate::verify_access(TEST_MODEL, TEST_API_KEY).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "Access confirmed");
}

#[wasm_bindgen_test]
async fn verify_access_invalid() {
    let result = crate::verify_access("", "").await;
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Could not access LLM. Please verify model name and API key.");

    let result = crate::verify_access("not_a_valid_model", "").await;
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Could not access LLM. Please verify model name and API key.");

    let result = crate::verify_access("gemini-2.0-flash-lite", "not_a_valid_api_key").await;
    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "Could not access LLM. Please verify model name and API key.");
}