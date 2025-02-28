use wasm_bindgen::prelude::*;
use leptos::{prelude::*, task::spawn_local};
use summy_options::{StoredOptions, Option};

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace=console)]
    fn log(s: &str);
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
        <div style="padding: 10px; color: white">
            <h1 style="font-size: 16px; font-weight: bold; border-bottom: solid 1px; padding-bottom: 15px; margin-bottom: 15px; margin-top: 0px;">"LLM Options"</h1>
            <div style="display: block; margin-top: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px;">Model:</label>
                <TextInput option=options.llm_model() id="model".to_string()/>
            </div>
            <div style="display: block; margin-top: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: bold; font-size: 13px;">API Key:</label>
                <TextInput option=options.llm_api_key() id="api-key".to_string()/>
            </div>

            <button
                style="width: 100px; margin-top: 20px; padding: 5px; background: lightblue; border: none; font-size: 13px; cursor: pointer; margin-right: 15px;"
                on:click=move |_| {
                    spawn_local(async move {
                        let response = summy_background::test_llm().await;
                        match response {
                            Ok(response) => {
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
            <div style="display: inline; margin-top: 15px;">
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
                style="font-size: 13px; width: -webkit-fill-available; padding: 5px; background: floralwhite; border: none;"
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