#![cfg(target_arch = "wasm32")]
use wasm_bindgen_test::*;
use unicode_segmentation::UnicodeSegmentation;

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

#[wasm_bindgen_test]
async fn summarize_english() {
    let html = r#"
        <!DOCTYPE html>
        <html>
        <head>
            <title>Climate Change Impact</title>
        </head>
        <body>
            <header>
                <h1>Climate Change and Its Impact on Global Weather Patterns</h1>
            </header>
            <article class="main-content">
                <p>Climate change refers to long-term changes in temperature, precipitation, wind patterns, and other elements of the Earth's climate system. These changes are primarily driven by human activities, such as burning fossil fuels, deforestation, and industrial processes, which increase the concentration of greenhouse gases in the atmosphere.</p>
                <p>The impact of climate change is evident in the increasing frequency and intensity of extreme weather events, such as hurricanes, droughts, heatwaves, and heavy rainfall. These events have significant consequences for ecosystems, human health, and economies worldwide.</p>
                <p>Efforts to mitigate climate change include reducing greenhouse gas emissions, transitioning to renewable energy sources, and implementing policies to promote sustainability. Adaptation strategies are also crucial to help communities cope with the inevitable changes that are already occurring.</p>
            </article>
            <footer>
                <p>© 2025 Climate Awareness Organization</p>
            </footer>
        </body>
        </html>
    "#;

    let result = crate::summarize(html, TEST_MODEL, TEST_API_KEY).await;
    assert!(result.is_ok());
    let got = result.unwrap();

    assert_summary_response(&got, "climate change");
}

#[wasm_bindgen_test]
async fn summarize_german() {
    let html = r#"
        <!DOCTYPE html>
        <html>
        <head>
            <title>Auswirkungen des Klimawandels</title>
        </head>
        <body>
            <header>
                <h1>Der Klimawandel und seine Auswirkungen auf globale Wetterphänomene</h1>
            </header>
            <article class="main-content">
                <p>Der Klimawandel bezieht sich auf langfristige Veränderungen der Temperatur, des Niederschlags, der Windmuster und anderer Elemente des Klimasystems der Erde. Diese Veränderungen werden hauptsächlich durch menschliche Aktivitäten verursacht, wie das Verbrennen fossiler Brennstoffe, Abholzung und industrielle Prozesse, die die Konzentration von Treibhausgasen in der Atmosphäre erhöhen.</p>
                <p>Die Auswirkungen des Klimawandels zeigen sich in der zunehmenden Häufigkeit und Intensität extremer Wetterereignisse wie Hurrikane, Dürren, Hitzewellen und Starkregen. Diese Ereignisse haben erhebliche Folgen für Ökosysteme, die menschliche Gesundheit und die Weltwirtschaft.</p>
                <p>Bemühungen zur Minderung des Klimawandels umfassen die Reduzierung von Treibhausgasemissionen, den Übergang zu erneuerbaren Energiequellen und die Umsetzung von Maßnahmen zur Förderung der Nachhaltigkeit. Anpassungsstrategien sind ebenfalls entscheidend, um Gemeinschaften zu helfen, mit den unvermeidlichen Veränderungen umzugehen, die bereits stattfinden.</p>
            </article>
            <footer>
                <p>© 2025 Klimabewusstseinsorganisation</p>
            </footer>
        </body>
        </html>
    "#;

    let result = crate::summarize(html, TEST_MODEL, TEST_API_KEY).await;
    assert!(result.is_ok());
    let got = result.unwrap();

    assert_summary_response(&got, "klimawandel");
}

#[wasm_bindgen_test]
async fn summarize_italian() {
    let html = r#"
        <!DOCTYPE html>
        <html>
        <head>
            <title>Impatto del Cambiamento Climatico</title>
        </head>
        <body>
            <header>
                <h1>Il Cambiamento Climatico e il Suo Impatto sui Modelli Meteorologici Globali</h1>
            </header>
            <article class="main-content">
                <p>Il cambiamento climatico si riferisce a cambiamenti a lungo termine della temperatura, delle precipitazioni, dei modelli di vento e di altri elementi del sistema climatico terrestre. Questi cambiamenti sono principalmente causati dalle attività umane, come la combustione di combustibili fossili, la deforestazione e i processi industriali, che aumentano la concentrazione di gas serra nell'atmosfera.</p>
                <p>L'impatto del cambiamento climatico è evidente nell'aumento della frequenza e dell'intensità degli eventi meteorologici estremi, come uragani, siccità, ondate di calore e forti piogge. Questi eventi hanno conseguenze significative per gli ecosistemi, la salute umana e le economie mondiali.</p>
                <p>Gli sforzi per mitigare il cambiamento climatico includono la riduzione delle emissioni di gas serra, la transizione verso fonti di energia rinnovabile e l'implementazione di politiche per promuovere la sostenibilità. Le strategie di adattamento sono anche cruciali per aiutare le comunità a far fronte ai cambiamenti inevitabili che stanno già avvenendo.</p>
            </article>
            <footer>
                <p>© 2025 Organizzazione per la Consapevolezza Climatica</p>
            </footer>
        </body>
        </html>
    "#;

    let result = crate::summarize(html, TEST_MODEL, TEST_API_KEY).await;
    assert!(result.is_ok());
    let got = result.unwrap();

    assert_summary_response(&got, "cambiamento climatico");
}

#[wasm_bindgen_test]
async fn summarize_korean() {
    let html = r#"
        <!DOCTYPE html>
        <html>
        <head>
            <title>기후 변화의 영향</title>
        </head>
        <body>
            <header>
                <h1>기후 변화와 전 세계 기상 패턴에 미치는 영향</h1>
            </header>
            <article class="main-content">
                <p>기후 변화는 지구의 기후 시스템의 온도, 강수량, 바람 패턴 및 기타 요소의 장기적인 변화를 의미합니다. 이러한 변화는 주로 화석 연료 연소, 산림 벌채 및 산업 공정과 같은 인간 활동에 의해 발생하며, 이로 인해 대기 중 온실 가스 농도가 증가합니다.</p>
                <p>기후 변화의 영향은 허리케인, 가뭄, 열파, 폭우와 같은 극단적인 기상 현상의 빈도와 강도 증가에서 명확히 드러납니다. 이러한 사건들은 전 세계 생태계, 인간 건강 및 경제에 중대한 결과를 초래합니다.</p>
                <p>기후 변화를 완화하기 위한 노력에는 온실 가스 배출 감소, 재생 에너지원으로의 전환, 지속 가능성을 증진하는 정책 시행 등이 포함됩니다. 이미 발생하고 있는 불가피한 변화에 대응하기 위해 지역 사회를 돕기 위한 적응 전략도 중요합니다.</p>
            </article>
            <footer>
                <p>© 2025 기후 인식 조직</p>
            </footer>
        </body>
        </html>
    "#;

    let result = crate::summarize(html, TEST_MODEL, TEST_API_KEY).await;
    assert!(result.is_ok());
    let got = result.unwrap();

    assert_summary_response(&got, "기후 변화");
}

// Helper function to assert summary response properties
fn assert_summary_response(got: &str, expected_topic_term: &str) {
    // parse the JSON response
    let value: serde_json::Value = serde_json::from_str(got).unwrap();

    // Assert summary is a string that contains the main topic
    let summary = value.get("summary").unwrap().as_str().unwrap();
    assert!(
        summary.to_lowercase().contains(expected_topic_term),
        "Expected summary to contain the main topic term '{}', got '{}'",
        expected_topic_term,
        summary
    );

    // Assert category is a string that contains the main topic
    let category = value.get("category").unwrap().as_str().unwrap();
    assert!(
        category.to_lowercase().contains(expected_topic_term),
        "Expected category to contain the main topic term '{}', got '{}'",
        expected_topic_term,
        category
    );

    // Assert questions is an array with 3 non-empty Strings
    let questions = value.get("questions").unwrap().as_array().unwrap();
    assert_eq!(questions.len(), 3);
    for (i, question) in questions.iter().enumerate() {
        assert!(
            question.as_str().unwrap().len() > 0,
            "Expected question {} to be a non-empty String, got {}",
            i,
            question
        );
    }

    // Assert answers is an array with 3 non-empty Strings
    let answers = value.get("answers").unwrap().as_array().unwrap();
    assert_eq!(answers.len(), 3);
    for (i, answer) in answers.iter().enumerate() {
        assert!(
            answer.as_str().unwrap().len() > 0,
            "Expected answer {} to be a non-empty String, got {}",
            i,
            answer
        );
    }

    // Assert stress_score is an integer between 0 and 9
    let stress_score = value.get("stress_score").unwrap().as_i64().unwrap();
    assert!(stress_score >= 0 && stress_score <= 9, "Expected stress_score to be between 0 and 9, got {}", stress_score);

    // Assert trust_score is an integer between 0 and 9
    let trust_score = value.get("trust_score").unwrap().as_i64().unwrap();
    assert!(trust_score >= 0 && trust_score <= 9, "Expected trust_score to be between 0 and 9, got {}", trust_score);

    // Assert emoji_outline is a non-empty String with at least 3 emojis
    let emoji_outline = value.get("emoji_outline").unwrap().as_str().unwrap();
    assert!(emoji_outline.graphemes(true).count() > 3, "Expected emoji_outline to have at least 3 emojis, got {}", emoji_outline);
}