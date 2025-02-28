// Load CSS file and create elements
fetch(chrome.runtime.getURL('content.css'))
    .then(response => response.text())
    .then(css => {
        addButton(document.body, css);
        addSummary(document.body, css);
    });

function addSummary(root, css) {
    let container = document.createElement("div");
    container.id = "summy-summary";

    // Create a shadow root to isolate styles
    const shadow = container.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);

    chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
        if (request.msg === "summy_tldr") {
            let data = JSON.parse(request.result);
            console.log(data);

            let root = document.createElement("div");
            root.classList.add("page-tldr");

            addStressScore(root, data.stress_score);
            addContent(root, data.category, data.summary);
            addQuestions(root, data.category, data.summary, data.questions, data.answers);

            let emojis = document.createElement("div");
            emojis.classList.add("page-emojis");
            emojis.innerText = data.emoji_outline;
            root.appendChild(emojis);

            shadow.appendChild(root);
            container.style.display = "block";
            hideButton();
        }

        root.appendChild(container);

        // acknowledge the message
        sendResponse({received: true});

        // return true to keep the message channel open
        return true;
    });
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
    button.classList.add("no-loading");
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
                button.classList.remove("no-loading");
            }
        );
    }

    // Create button container
    let container = document.createElement("div");
    container.classList.add("button-container");

    // Create shadow DOM for button to isolate styles
    const shadow = container.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = css;
    shadow.appendChild(style);
    shadow.appendChild(button);

    // Add button to the root
    root.appendChild(container);
}

function hideButton() {
    const container = document.querySelector('.button-container');
    container.style.display = "none";
}

// Add stress score view to root
function addStressScore(root, score) {
    let container = document.createElement("div");
    container.classList.add("stress-container");

    let title = document.createElement("div");
    title.classList.add("stress-title");
    title.innerText = "Stress Level";
    container.appendChild(title);

    let emoji = "😞";
    let level = "High";

    if (score < 4) {
        emoji = "🙂";
        level = "Low";
    } else if (score < 7) {
        emoji = "😐";
        level = "Medium";
    }

    let emojiElem = document.createElement("div");
    emojiElem.classList.add("stress-score");
    emojiElem.innerText = emoji;
    container.appendChild(emojiElem);

    let levelElem = document.createElement("div");
    levelElem.classList.add("stress-category");
    levelElem.innerText = level;
    container.appendChild(levelElem);

    root.appendChild(container);
}

// Add content view to root
function addContent(root, category, summary) {
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
    title.innerText = category;
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