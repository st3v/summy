use genai::{adapter::AdapterKind, chat::{ChatMessage, ChatOptions, ChatRequest, ChatResponseFormat, JsonSpec}, resolver::{AuthData, AuthResolver}, Client, ModelIden};
use wasm_bindgen::prelude::*;
use dom_content_extraction::{get_content, scraper::Html};
use std::sync::LazyLock;

mod util;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
}

fn extract_text(html: &str) -> Result<String, anyhow::Error> {
    let document = Html::parse_document(html);
    get_content(&document).map_err(Into::into)
}

#[wasm_bindgen]
pub async fn test_llm(model: &str, api_key: &str) -> Result<String, String> {
    let request = ChatRequest::new(vec![
        ChatMessage::system("The user wants to test if they can successfuly interact with you. Reply to them in a single sentence confirming that they have access. Do not greet them or address them directly in any other way. Do not mention anything about chatting or talking with them."),
		ChatMessage::user("Is this working?"),
	]);

    let client = client(api_key);

    match client.exec_chat(&model, request.clone(), None).await {
        Ok(resp) => {
            match resp.content_text_as_str() {
                Some(text) => {
                    Ok(text.to_string())
                },
                _ => Err("No answer".to_string()),
            }
        },
        Err(_) => Err("Could not access the model. Please verify model name and API key.".to_string()),
    }
}

fn client(api_key: &str) -> Client {
    let api_key = api_key.to_string();

    let auth = AuthResolver::from_resolver_fn(
        move |_: ModelIden| -> Result<Option<AuthData>, genai::resolver::Error> {
            Ok(Some(AuthData::from_single(&api_key)))
        },
    );

    Client::builder().with_auth_resolver(auth).build()
}

#[wasm_bindgen]
pub async fn summarize(html: &str, model: &str, api_key: &str) -> Result<String, String> {
    let text = match extract_text(html) {
        Ok(text) => text,
        Err(e) => return Err(format!("Error extracting text: {}", e)),
    };

    let request = ChatRequest::new(vec![
    	ChatMessage::system(SUMMARIZE_SYSTEM_PROMPT),
    	ChatMessage::user(text),
	]);

    let client = client(api_key);
    let options = summarize_chat_options(&client, &model);
    let response = client.exec_chat(&model, request.clone(), Some(&options)).await;

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

fn summarize_chat_options(client: &Client, model: &str) -> ChatOptions {
    let adapter_kind = client.resolve_service_target(model).unwrap().model.adapter_kind;
    log(&format!("Adapter kind: {:?}", adapter_kind.as_str()));
    let options = match adapter_kind {
        AdapterKind::Groq | AdapterKind::Ollama => {
            // Groq and Ollama do currently not support json_schema
            ChatOptions::default().with_response_format(
                ChatResponseFormat::JsonMode
            )
        },
        _ => {
            ChatOptions::default().with_response_format(
                JsonSpec::new(
                    "response",
                    (*SUMMARIZE_JSON_SCHEMA).clone()
                )
            )
        }
    };

    options //.with_temperature(0.7)
}

const SUMMARIZE_SYSTEM_PROMPT: &str = r#"
    Everything you are given is text extracted from an arbitrary website.
    Your job is to summarize this text in 1-3 sentences. Your summary must
    be as concise as possible and must not use unneccessary filler words.

    The text might contain HTML tags, CSS styles, Javascript code, or any
    other content that is not essential and does not add to the topic covered
    in the text. You should ignore all of this as noise and focus only on
    the essence of the given text.

    Do not use terms like "website", "webpage", "page", "doc", "text",
    or any similar term referring to the document you are given. Instead,
    only focus on the actual contents and describe those.

    Sometimes the text may contain multiple ideas or topics. In those cases,
    focus on the most important theme.

    Do not include information about the source of the text or the website
    it was extracted from. In particular, do not include any advertising,
    promotional content, or any information informing about cookies,
    privacy policies, or terms of service.

    In addition to your summary, you are tasked with proposing 3 interesting
    and insightful follow-up questions a user might ask about the text after
    reading your summary. Also provide an answer for each of your questions.
    Make sure your answers are concise but not too short either, they should
    be 2-3 sentences each.

    You are also tasked with assigning what is called a "stress score" to the
    given text. The range is from 0 to 9. A score of 0 means the text will most
    likely cause no stress to the average user, it might even make the user
    happy. A text with a score of 9 does the opposite, it causes the user
    tremendous stress and unhappiness.

    Next, you need to assign a "trust score" to the text representing how much
    you trust its accuracy. The range is 0-9. A trust score of 0 means the text
    contains information that is most definitely not factual and clearly false.
    A score of 9, on the other hand, means that the text contains only factual
    and verified information. You can use the search tool to verify the
    information given in the text.

    Next, be creative and come up with an emoji outline that best represents
    the text. You can use any emoji like for example 🤝 🧑 💻 🤖 🤷‍♂️. Try your
    best and suggest an outline of as many as 5 emojis and combine them into a
    single string separated by spaces. Important: Do not use any letters or
    numbers in your outline! Also, do not use duplicate emojis!

    Last but not least, categorize the text in 1-3 words. If the text contains
    multiple topics, choose the most important one.

    IMPORTANT: Make sure to use the same language for your summary, category,
    questions, and answers as the primary language of the text you are given!

    Only respond with valid JSON using the following format:

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
        "trust_score": <your trust score here>,
        "emoji_outline": "🤝 🧑 💻 🤖 🤷‍♂️"
    }
"#;

static SUMMARIZE_JSON_SCHEMA: LazyLock<serde_json::Value> = LazyLock::new(|| {
    serde_json::json!({
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
            },
            "emoji_outline": {
                "type": "string",
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
    })
});

#[cfg(test)]
mod tests {
    use wasm_bindgen_test::*;
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

        let result = summarize(html, "model", "api_key").await;
        assert!(result.is_ok());
        let result = result.unwrap();
        assert!(!result.is_empty());
    }
}