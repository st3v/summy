use wasm_bindgen::prelude::*;
use leptos::{prelude::*, task::spawn_local};
use summy_options::{StoredOptions, Option};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);

    #[wasm_bindgen(js_namespace=summy_background, catch)]
    async fn test_llm() -> Result<JsValue, JsValue>;
}

#[wasm_bindgen(start)]
fn run() {
    mount_to_body(App);
}

#[component]
fn App() -> impl IntoView {
    set_panic_hook();

    let options = StoredOptions::new();
    let (test_response, set_test_response) = signal("".to_string());

    view! {
        <div class="options-container">
            <h1 class="options-header">"LLM Options"</h1>
            <div class="input-group">
                <label class="input-label">Model:</label>
                <TextInput option=options.llm_model() id="model".to_string()/>
            </div>
            <div class="input-group">
                <label class="input-label">API Key:</label>
                <TextInput option=options.llm_api_key() id="api-key".to_string()/>
            </div>

            <button
                class="test-button"
                on:click=move |_| {
                    spawn_local(async move {
                        match test_llm().await {
                            Ok(js_value) => {
                                let response = js_value.as_string().unwrap_or_default();
                                set_test_response.set(response);
                            },
                            Err(e) => {
                                set_test_response.set(format!("Error: {:?}", e));
                            }
                        }
                    })
                }
            >
                "Test LLM"
            </button>
            <div class="test-response">
                {test_response}
            </div>
        </div>
    }
}

#[component]
fn TextInput<O: Option<String> + Clone + Send + 'static>(option: O, id: String) -> impl IntoView {
    let opt = option.clone();
    let model = LocalResource::new(
        move || {
            let value = opt.clone();
            async move {
                value.get().await
            }
        }
    );

    let id_input = id.clone();
    let id_datalist = id.clone();
    let suggestions =option.suggestions();

    view! {
        <Suspense
            fallback=move || view! { <p>"Loading..."</p> }
        >
            <input
                list={id_input}
                class="text-input"
                type="text"
                value={move || Suspend::new(async move {
                    match model.await {
                        Ok(model) => {
                            model
                        },
                        Err(e) => e
                    }
                })}
                on:change:target=move |event| {
                    let option = option.clone();
                    spawn_local(async move {
                        log(&format!("changed: {:?}", event.target().value()));
                        match option.set(event.target().value()).await {
                            Ok(_) => log("Set model"),
                            Err(e) => log(&format!("Failed to set model: {:?}", e))
                        }
                    })
                }
            />
            <datalist id={id_datalist}>
                {suggestions.into_iter()
                .map(|s| view! { <option value={s} />})
                .collect_view()}
            </datalist>
        </Suspense>
    }
}


#[allow(dead_code)]
pub fn set_panic_hook() {
    console_error_panic_hook::set_once();
}