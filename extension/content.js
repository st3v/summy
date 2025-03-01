// Load CSS file and create elements
fetch(chrome.runtime.getURL('content.css'))
    .then(response => response.text())
    .then(css => {
        addButton(document.body, css);
        addSummary(document.body, css);
    });

function addSummary(root, css) {
    let container = document.createElement("div");
    container.id = "summy-summary-root";

    // Create a shadow root to isolate styles
    const shadow = container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = css;

    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
        if (request.msg === "summy_tldr") {
            // acknowledge the message
            sendResponse({received: true});

            // parse the result
            let data = JSON.parse(request.result);

            // Remove any existing elements and add the style
            shadow.innerHTML = "";
            shadow.appendChild(style);

            let div = document.createElement("div");
            div.classList.add("page-tldr");

            addStressScore(div, data.stress_score, data.emoji_outline);
            addContent(div, data.category, data.summary, data.emoji_outline);
            addQuestions(div, data.questions, data.answers);

            // Add close button
            let closeButton = document.createElement("div");
            closeButton.classList.add("close-button");
            closeButton.innerHTML = "×";
            closeButton.title = "Close Summary";
            closeButton.onclick = function() {
                // Remove everything from the shadow root
                shadow.innerHTML = "";

                // Show the button
                showSummyButton();
            };
            div.appendChild(closeButton);

            shadow.appendChild(div);

            // Hide Summy button
            hideSummyButton();
        }

        // return true to keep the message channel open
        return true;
    });

    root.appendChild(container);
}

function addButton(root, css) {
    // Create icon element
    let icon = document.createElement("img");
    icon.src = chrome.runtime.getURL("images/button.png");
    icon.title = "Summarize with Summy";

    // Create button element
    let button = document.createElement("button");
    button.id = "summy-button";
    button.appendChild(icon);
    button.classList.add("not-loading");
    button.onclick = function () {
        chrome.runtime.sendMessage(
            {
                msg: "summy_capture"
            },
            function () {
                if (chrome.runtime.lastError) {
                    console.log("Summy capture error:", chrome.runtime.lastError.message);
                    return;
                }
                button.classList.add("loading");
                button.classList.remove("not-loading");
            }
        );
    }

    // Create button container
    let container = document.createElement("div");
    container.id = "summy-button-root";

    // Create shadow DOM for button to isolate styles
    const shadow = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);
    shadow.appendChild(button);

    // Add button to the root
    root.appendChild(container);
}

function hideSummyButton() {
    const root = document.querySelector('#summy-button-root');
    root.style.display = "none";
}

function showSummyButton() {
    const root = document.querySelector('#summy-button-root');
    const button = root.shadowRoot.querySelector('#summy-button');
    button.classList.remove("loading");
    button.classList.add("not-loading");
    root.style.display = "block";
}

// Add stress score view to root
function addStressScore(root, score) {
    let container = document.createElement("div");
    container.classList.add("stress-container");

    let title = document.createElement("div");
    title.classList.add("stress-title");
    title.innerText = "Stress Level";
    container.appendChild(title);

    let symbol = "😓";
    let level = "High";

    if (score < 4) {
        symbol = "😊";
        level = "Low";
    } else if (score < 7) {
        symbol = "😐";
        level = "Medium";
    }

    let symbolElem = document.createElement("div");
    symbolElem.classList.add("stress-score");
    symbolElem.innerText = symbol;
    container.appendChild(symbolElem);

    let levelElem = document.createElement("div");
    levelElem.classList.add("stress-category");
    levelElem.innerText = level;
    container.appendChild(levelElem);

    root.appendChild(container);
}

// Add content view to root
function addContent(root, category, summary, emojis) {
    let container = document.createElement("div");
    container.classList.add("summary-container");

    let contentView = document.createElement("div");
    contentView.classList.add("content-view");

    let title = document.createElement("div");
    title.classList.add("content-title");

    let titleText = document.createElement("span");
    titleText.classList.add("title-text");
    titleText.textContent = category;

    let titleEmojis = document.createElement("span");
    titleEmojis.classList.add("title-emojis");
    titleEmojis.textContent = emojis;

    title.appendChild(titleText);
    title.appendChild(titleEmojis);

    let contentText = document.createElement("div");
    contentText.classList.add("content-text");
    contentText.innerText = summary;

    contentView.appendChild(title);
    contentView.appendChild(contentText);

    container.appendChild(contentView);
    root.appendChild(container);
}

// Add questions view to root
function addQuestions(root, questions, answers) {
    let container = document.createElement("div");
    container.classList.add("questions-container");

    // Store the original content for back navigation
    // Will be captured on first question click
    const originalContent = {
        title: null,
        summary: null
    };

    // Add questions
    questions.forEach((question, index) => {
        let questionElem = document.createElement("div");
        questionElem.classList.add("question-item");
        questionElem.innerHTML = question;
        questionElem.onclick = () => {
            let title = root.querySelector(".content-title");
            let text = root.querySelector(".content-text");

            // Capture the original title on first question click
            if (!originalContent.title) {
                originalContent.title = title.innerHTML;
            }

            // Capture the original summary on first question click
            if (!originalContent.summary) {
                originalContent.summary = text.innerText;
            }

            let titleText = document.createElement("span");
            titleText.classList.add("title-text");
            titleText.textContent = question;

            let backButton = document.createElement("span");
            backButton.classList.add("back-button");
            backButton.textContent = "Back to Summary";
            backButton.onclick = (e) => {
                e.stopPropagation();
                // Always go back to the original content
                title.innerHTML = originalContent.title;
                text.innerText = originalContent.summary;
            };

            title.innerHTML = "";
            title.appendChild(titleText);
            title.appendChild(backButton);
            text.innerText = answers[index];
        };
        container.appendChild(questionElem);
    });

    root.appendChild(container);
}