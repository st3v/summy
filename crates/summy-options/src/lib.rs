use js_sys::{Object, Reflect};
use wasm_bindgen::JsValue;
use std::rc::Rc;
use serde_wasm_bindgen::{to_value, from_value};
use web_extensions_sys::StorageArea;

pub trait Option<T> {
    fn get(&self) -> impl std::future::Future<Output = Result<T, String>>;
    fn set(&self, value: T) -> impl std::future::Future<Output = Result<bool, String>>;
    fn suggestions (&self) -> Vec<T>;
    fn choices (&self) -> Vec<T>;
}

pub struct StoredOptions {
    storage: Rc<StorageArea>,
}

impl Default for StoredOptions {
    fn default() -> Self {
        Self::new()
    }
}

impl StoredOptions {
    pub fn new() -> StoredOptions {
        let sync = web_extensions_sys::chrome().storage().sync();
            StoredOptions {
                storage: Rc::new(sync) 
            }
        }

    pub fn llm_model(&self) -> StoredOption<String> {
        let suggestions = models();

        StoredOption::new(
            "llm_model",
            suggestions.first().unwrap().to_string(),
            suggestions,
            Vec::new(),
            self.storage.clone(),
        )
    }

    pub fn llm_api_key(&self) -> StoredOption<String> {
        StoredOption::new(
            "llm_api_key",
            "".to_string(),
            Vec::new(),
            Vec::new(),
            self.storage.clone(),
        )
    }
}

#[derive(Clone)]
pub struct StoredOption<T> {
    key: JsValue,
    default: T,
    choices: Vec<T>,
    suggestions: Vec<T>,
    storage: Rc<StorageArea>,
}

unsafe impl<T: Send> Send for StoredOption<T> {}

impl<T> StoredOption<T> {
    pub fn new(key: &str, default: T, suggestions: Vec<T>, choices: Vec<T>, storage: Rc<StorageArea>) -> StoredOption<T> {
        StoredOption {
            key: key.into(),
            default,
            suggestions,
            choices,
            storage
        }
    }
}

impl<T: serde::Serialize + for<'a> serde::Deserialize<'a> + Clone> Option<T> for StoredOption<T> {
    async fn get(&self) -> Result<T, String> {
        match self.storage.get(&self.key).await {
            Ok(value) => {
                // default if not set
                if value.is_null() || value.is_undefined() {
                    return Ok(self.default.clone());
                }

                // extract value from object using key or error
                let value = Reflect::get(&value, &self.key)
                    .map_err(|e| format!("Failed to get value from object: {:?}", e))?;

                if value.is_null() || value.is_undefined() {
                    return Ok(self.default.clone());
                }

                let value = from_value(value)
                    .map_err(|e| format!("Failed to convert value to expected type: {:?}", e))?;
                
                Ok(value)
            },
            Err(e) => {
                // Convert JS error to string
                Err(format!("Failed to read from storage: {:?}", e))
            }
        }
    } 

    async fn set(&self, value: T) -> Result<bool, String> {
        let object = Object::new();

         // Use to_value instead of JsValue::from_serde
         let value = to_value(&value)
            .map_err(|e| format!("Failed to serialize value: {:?}", e))?;

        Reflect::set(&object, &self.key, &value)
            .map_err(|e| format!("Failed to set object property: {:?}", e))?;

        self.storage.set(&object).await
            .map_err(|e| format!("Failed to save to storage: {:?}", e))?;

        Ok(true)
    }

    fn suggestions (&self) -> Vec<T> {
        self.suggestions.clone()
    }

    fn choices (&self) -> Vec<T> {
        self.choices.clone()
    }
}

fn models() -> Vec<String> {
    let models: Vec<String> = vec![
        // google
        "gemini-2.0-flash-lite",
        "gemini-2.0-flash",
        "gemini-1.5-pro",
        "gemini-1.5-flash",
        "gemini-1.5-flash-8b",
        "gemini-1.0-pro",
        "gemini-1.5-flash-latest",
        // anthropic
        "claude-3-7-sonnet-latest",
        "claude-3-5-haiku-latest",
        "claude-3-opus-20240229",
        "claude-3-haiku-20240307",
        // deepseek
        "deepseek-chat", 
        "deepseek-reasoner",
        // openai
        "gpt-4o",
        "gpt-4o-mini",
        "o3-mini",
        "o1",
        "o1-mini",
        // groq
        "llama-3.3-70b-versatile",
        "llama-3.2-3b-preview",
        "llama-3.2-1b-preview",
        "llama-3.1-405b-reasoning",
        "llama-3.1-70b-versatile",
        "llama-3.1-8b-instant",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
        "llama3-8b-8192",
        "llama-guard-3-8b",
        "llama3-70b-8192",
        "deepseek-r1-distill-llama-70b",
        "llama-3.3-70b-specdec",
        "llama-3.2-1b-preview",
        "llama-3.2-3b-preview",
        "llama-3.2-11b-vision-preview",
        "llama-3.2-90b-vision-preview",
    ].iter().map(|s| s.to_string()).collect();

    models
}
