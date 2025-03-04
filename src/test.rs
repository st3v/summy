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

#[wasm_bindgen_test]
fn extract_text() {
    let html = r#"
        <!DOCTYPE html>
            <html>
            <head><title>Test Page</title></head>
            <body>
                <nav>Menu Item 1 | Menu Item 2</nav>
                <div class="sidebar">Side content</div>
                <article class="main-content">
                    This is the main article content.
                    It has multiple paragraphs and should be extracted.
                    <p>This is another paragraph with important information.</p>
                    <a href="\#">Some link</a>
                </article>
                <footer>Copyright 2025</footer>
            </body>
            </html>
        "#;
    let result = crate::extract_text(html);
    assert!(result.is_ok());
    let got = result.unwrap();
    assert!(got.contains("This is the main article content."));
    assert!(got.contains("It has multiple paragraphs and should be extracted."));
    assert!(got.contains("This is another paragraph with important information."));
}

#[wasm_bindgen_test]
fn extract_text_empty() {
    let result = crate::extract_text("");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "");
}

#[wasm_bindgen_test]
fn extract_text_invalid_html() {
    let result = crate::extract_text("<html><body><p>Test</p>");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "Test");
}

#[wasm_bindgen_test]
fn extract_text_no_content() {
    let result = crate::extract_text("<html><body></body></html>");
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "");
}

#[wasm_bindgen_test]
fn extract_text_no_body() {
    let html = r#"
        <!DOCTYPE html>
            <html>
            <head><title>Test Page</title></head>
            <nav>Menu Item 1 | Menu Item 2</nav>
            <div class="sidebar">Side content</div>
            <article class="main-content">
                This is the main article content.
                It has multiple paragraphs and should be extracted.
                <p>This is another paragraph with important information.</p>
                <a href="\#">Some link</a>
            </article>
            <footer>Copyright 2025</footer>
            </html>
        "#;

    let result = crate::extract_text(html);

    assert!(result.is_ok());
    let got = result.unwrap();
    assert!(got.contains("This is the main article content."));
    assert!(got.contains("It has multiple paragraphs and should be extracted."));
    assert!(got.contains("This is another paragraph with important information."));
}

#[wasm_bindgen_test]
fn extract_text_no_html() {
    let html = r#"
        This is the main article content.
        It has multiple paragraphs and should be extracted.
        This is another paragraph with important information.
        "#;

    let result = crate::extract_text(html);

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), "");
}