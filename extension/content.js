// Load CSS file and create elements
fetch(chrome.runtime.getURL('content.css'))
    .then(response => response.text())
    .then(css => {
        document.body.append(createSummyButton(css));
        document.body.append(createSummyView(css));
    });

function createSummyView(css) {
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

            // Remove any existing elements and add the style
            shadow.innerHTML = "";
            shadow.appendChild(style);

            let div = document.createElement("div");
            div.classList.add("page-tldr");

            if (request.error) {
                div.appendChild(createError(request.error));
                shadow.appendChild(div);
            } else {
                // parse the result and display summary
                let data = JSON.parse(request.result);
                div.appendChild(createStressScore(data.stress_score, data.emoji_outline));
                div.appendChild(createContent(data.category, data.summary, data.emoji_outline));
                div.appendChild(createQuestions(data.questions, data.answers, div));
            }

            // Add close button
            let closeButton = document.createElement("div");
            closeButton.classList.add("close-button");
            closeButton.innerHTML = "×";
            closeButton.title = "Close Summary";
            closeButton.onclick = function() {
                // Add the slide-down animation class
                div.classList.add("slide-down");

                // Wait for the animation to complete before removing the content
                setTimeout(() => {
                    // Remove everything from the shadow root
                    shadow.innerHTML = "";

                    // Show the button
                    showSummyButton();
                }, 400); // Match the animation duration (0.4s)
            };
            div.appendChild(closeButton);

            shadow.appendChild(div);

            // Hide Summy button
            hideSummyButton();
        }

        // return true to keep the message channel open
        return true;
    });

    return container;
}

function createSummyButton(css) {
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
        const domString = document.documentElement.outerHTML;

        chrome.runtime.sendMessage(
            {msg: "summy_capture", html: domString},
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

    return container;
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

// Create error view
function createError(message) {
    let errorView = document.createElement("div");
    errorView.classList.add("error-view");

    // Add error icon
    let errorIcon = document.createElement("div");
    errorIcon.classList.add("error-icon");
    errorIcon.innerHTML = `<svg viewBox="0 0 24 24" width="48" height="48" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    errorView.appendChild(errorIcon);

    // Add error content container
    let errorContent = document.createElement("div");
    errorContent.classList.add("error-content");

    // Add error message
    let errorMessage = document.createElement("h3");
    errorMessage.classList.add("error-message");
    errorMessage.innerText = message;
    errorContent.appendChild(errorMessage);
    errorView.appendChild(errorContent);

    // Add settings link
    let optionsLink = document.createElement("a");
    optionsLink.href = "#";
    optionsLink.innerText = "Verify Settings";
    optionsLink.classList.add("settings-link");
    optionsLink.onclick = function(e) {
        e.preventDefault();
        if (chrome.runtime.openOptionsPage) {
            chrome.runtime.openOptionsPage();
        } else {
            window.open(chrome.runtime.getURL('options.html'));
        }
    };
    errorView.appendChild(optionsLink);

    return errorView;
}

// Create stress score view
function createStressScore(score) {
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

    return container;
}

// Create content view
function createContent(category, summary, emojis) {
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
    return container;
}

// Create questions view
function createQuestions(questions, answers, parent) {
    let container = document.createElement("div");
    container.classList.add("questions-container");

    titleView = parent.querySelector(".content-title");
    textView = parent.querySelector(".content-text");

    // Store the original content for back navigation
    const originalContent = {
        title: titleView.innerHTML,
        summary: textView.innerText
    };

    // Add questions
    questions.forEach((question, index) => {
        let questionElem = document.createElement("div");
        questionElem.classList.add("question-item");
        questionElem.innerHTML = question;
        questionElem.onclick = () => {
            let titleText = document.createElement("span");
            titleText.classList.add("title-text");
            titleText.textContent = question;

            let backButton = document.createElement("span");
            backButton.classList.add("back-button");
            backButton.textContent = "Back to Summary";
            backButton.onclick = (e) => {
                e.stopPropagation();
                // Always go back to the original content
                titleView.innerHTML = originalContent.title;
                textView.innerText = originalContent.summary;
            };

            titleView.innerHTML = "";
            titleView.appendChild(titleText);
            titleView.appendChild(backButton);
            textView.innerText = answers[index];
        };
        container.appendChild(questionElem);
    });

    return container;
}