use genai::{chat::{ChatMessage, ChatOptions, ChatRequest, JsonSpec}, resolver::{AuthData, AuthResolver}, Client, ModelIden};
use wasm_bindgen::prelude::*;
use dom_content_extraction::{get_content, scraper::Html};
use serde_json::json;

mod util;

/// Makes JS `console.log` available in Rust
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

/// A demo function to test if WASM is callable from background.js
#[wasm_bindgen]
pub fn hello() {
    util::set_panic_hook();
    log("Hello from Summy! ☀️");
}

pub fn extract_text(html: &str) -> Result<String, anyhow::Error> {
    let document = Html::parse_document(html);
    get_content(&document).map_err(Into::into)
}

const MODEL: &str = "gemini-2.0-pro-exp-02-05";
const API_KEY: &str = "";
const SYSTEM_PROMPT: &str = r#"
    You are given text extracted from an arbitrary website. Your job is to 
    summarize this text in 1-3 sentences. You must be as consice as 
    possible and must not use uneccessary filler words. 
    Also, don't use terms like "website", "webpage", "page", "doc", "text",
    or any similar term referring to the document you are given. Instead, 
    only focus on the actual contents and describe those.
    Be careful, sometimes the text may contain multiple ideas or topics,
    so make sure to summarize the most important one. Do not include information
    about the source of the text or the website it was extracted from. In
    particular, do not include any advertising, promotional content, or any information
    with regards to cookies, privacy policies, or terms of service.

    In addition to your summary, propose 3 interesting follow-up questions a user might 
    ask about the text after reading your summary. Provide an answer for each of the 
    questions.

    You are also tasked with assigning what is called a "stress score" to the given text. 
    The range is from 0 to 9. A score of 0 means the text will most likely cause no stress 
    to the average user, it might even make the user happy. A text with a score of 9 does 
    the opposite, it causes the user tremedous stress and unhappiness.

    Next, you need to assign a "trust score" to the text representing how much you trust 
    its accuracy. A trust score 0 means the text contains information that is most definitly
    not factual and clearly false. A score of 9, on the other hand, means that the text 
    contains only factual and verified information. You can use the search tool to verify 
    anything.

    Last but not least, categorize the text in 1-3 words. If the text contains multiple
    topics, choose the most important one.

    Reply with raw JSON using the following structure:

    {
        "summary": "Your summary here",
        "category": "Your category here",
        "questions": [
            "Your first question here",
            "Your second question here",
            "Your third question here"
        ],
        "answers": [
            "The answer to your first question here",
            "The answer to your second question here",
            "The answer to your third question here"
        ],
        "stress_score": <your stress score here>,
        "trust_score": <your trust score here>
    }

    It is important that your entire response represents valid JSON!

    Again, it is important to use the primary language of the provided 
    text for your summary, category, and questions!
"#;

#[wasm_bindgen]
pub async fn summarize(html: &str) -> Result<String, String> {
    let text = match extract_text(html) {
        Ok(text) => text,
        Err(e) => return Err(format!("Error extracting text: {}", e)),
    };

    log(&format!("Extracted text:\n {}", text));

    let request = ChatRequest::new(vec![
		ChatMessage::system(SYSTEM_PROMPT),
		ChatMessage::user(text),
	]);

	let auth_resolver = AuthResolver::from_resolver_fn(
		|_: ModelIden| -> Result<Option<AuthData>, genai::resolver::Error> {
			Ok(Some(AuthData::from_single(API_KEY.to_string())))
		},
	);

	let client = Client::builder().with_auth_resolver(auth_resolver).build();

	let json_schema = json!({
        "type": "object",
        "properties": {
            "summary": {
                "type": "string",
            },
            "category": {
                "type": "string",
            },
            "questions": {
                "type": "array",
                "items": {
                    "type": "string",
                }
            },
            "answers": {
                "type": "array",
                "items": {
                    "type": "string",
                }
            },
            "stress_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9
            },
            "trust_score": {
                "type": "integer",
                "minimum": 0,
                "maximum": 9
            }
        },
        "required": [
            "summary",
            "category",
            "questions",
            "answers",
            "stress_score",
            "trust_score"
        ]
    });
  
    let options = ChatOptions::default().with_response_format(JsonSpec::new("some-schema", json_schema));
    let response = client.exec_chat(MODEL, request.clone(), Some(&options)).await;

    match response {
        Ok(resp) => {
            match resp.content_text_as_str() {
                Some(text) => {
                    Ok(text.to_string())
                },
                _ => Err("No answer".to_string()),
            }
        },
        Err(e) => Err(format!("Error during chat execution: {}", e)),
        
    }
}

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::*;
    use log::info;
    use super::*;

    #[wasm_bindgen_test]
    #[allow(dead_code)]
    async fn test_summarize() {
        let _ = env_logger::builder().is_test(true).try_init();

        let html = r#"
            <html>
                <head>
                    <title>Test</title>
                </head>
                <body>
                    <h1>Test</h1>
                    <p>This is a test</p>
                </body>
            </html>
        "#;

        let result = summarize(html).await;
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(!result.is_empty());
    }
}