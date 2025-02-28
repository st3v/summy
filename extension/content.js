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
            addQuestions(div, data.category, data.summary, data.questions, data.answers);

            // Create a container for the badges
            let badges = document.createElement("div");
            badges.classList.add("badges-container");

            // Add close button
            let closeButton = document.createElement("div");
            closeButton.classList.add("close-button");
            closeButton.innerHTML = "x";
            closeButton.title = "Close Summary";
            closeButton.onclick = function() {
                // container.style.display = "none";

                // Remove everything from the shadow root
                shadow.innerHTML = "";

                // Show the button
                showSummyButton();
            };
            badges.appendChild(closeButton);

            // Add the badges container to the root
            div.appendChild(badges);
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

    let symbol = "😞";
    let level = "High";

    if (score < 4) {
        symbol = "🙂";
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

    // Create content view
    let contentView = document.createElement("div");
    contentView.classList.add("content-view");

    // Add title and text sections
    let title = document.createElement("div");
    title.classList.add("content-title");

    let text = document.createElement("div");
    text.classList.add("content-text");

    // Set initial content (summary)
    title.innerHTML = `${category} <span class="inline-emojis">${emojis}</span>`;
    text.innerText = summary;

    contentView.appendChild(title);
    contentView.appendChild(text);

    container.appendChild(contentView);
    root.appendChild(container);
}

// Add questions view to root
function addQuestions(root, category, summary, questions, answers) {
    let container = document.createElement("div");
    container.classList.add("questions-container");

    // Add questions
    questions.forEach((question, index) => {
        let questionElem = document.createElement("div");
        questionElem.classList.add("question-item");
        questionElem.innerHTML = `◂ ${question}`;
        questionElem.onclick = () => {
            let title = root.querySelector(".content-title");
            let text = root.querySelector(".content-text");

            // Update content to show answer
            title.innerHTML = `<span class="back-button">◂ Back</span> ${question}`;
            text.innerText = answers[index];

            // Add back button functionality
            title.querySelector('.back-button').onclick = (e) => {
                e.stopPropagation();
                // Always go back to category and summary
                title.innerText = category;
                text.innerText = summary;
            };
        };
        container.appendChild(questionElem);
    });

    root.appendChild(container);
}