use leptos::prelude::*;
use wasm_bindgen::prelude::*;

#[wasm_bindgen(start)]
fn run() {
    mount_to_body(App);
}

#[component]
fn App() -> impl IntoView {
    let (count, set_count) = signal(0);
        
    view! {
        <button 
            on:click=move |_| *set_count.write() += 1
        >
            "Click me: "
            {count}
        </button>

        <progress
            style="width: 100px;"
            value=double_count(count)
        />
    }
}

fn double_count(count: ReadSignal<i32>) -> impl Fn() -> i32 {
    move || { count.get() * 2}
}