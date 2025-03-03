// import the wasm module and the summarize function
import initWasmModule, { summarize, answer } from './wasm/summy_background.js';
import { MODEL_KEY, API_KEY_KEY, DEFAULT_MODEL } from './constants.js';

console.log("Background script started");

// Initialize the WASM module
(async function() {
    await initWasmModule();
})();

const contextMenuId = "summyContextMenu"

chrome.contextMenus.create({
    id: contextMenuId,
    title: "Summarize with Summy",
    contexts:["page"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === contextMenuId) {
        // Execute a content script to get the page HTML
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => document.documentElement.outerHTML
        }, (results) => {
            if (results && results[0] && results[0].result) {
                const html = results[0].result;
                summarizePage(tab, html);
            } else {
                console.error("Failed to get page HTML");
            }
        });
    }
});

function summarizePage(tab, html) {
    // Get the model and API key from storage
    chrome.storage.sync.get({[MODEL_KEY]: DEFAULT_MODEL, [API_KEY_KEY]: ''}, function(items) {
        const model = items[MODEL_KEY];
        const apiKey = items[API_KEY_KEY];

        if (!model) {
            displaySummary(tab, null, "LLM model not set");
            return;
        }

        return summarize(html, model, apiKey).then(function (summary) {
            console.log("summarize success:\n", summary);
            displaySummary(tab, summary, null);
        }).catch(function (error) {
            console.log("summarize error:", error);
            displaySummary(tab, null, "Failed to summarize webpage");
        });
    });
};

function displaySummary(tab, summary, error) {
    chrome.tabs.sendMessage(tab.id,
        {
            msg: "summy_tldr",
            result: summary,
            error: error
        }
    );
}

// Process custom questions using promise syntax
function askQuestion(question, html, apiKey, model) {
    return answer(question, html, model, apiKey)
        .then(result => {
            return {
                success: true,
                answer: result
            };
        })
        .catch(error => {
            console.error("Error processing question:", error);
            return {
                success: false,
                error: error.message || "An error occurred while processing your question."
            };
        });
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    switch (request.msg) {
        case "summy_summarize":
            let params = {
                currentWindow: true,
                active: true
            }

            chrome.tabs.query(params, function (tabs) {
                summarizePage(tabs[0], request.html);
            });

            // acknowledge the message
            sendResponse({received: true});

            // return true to keep the message channel open
            return true;
        case "summy_answer":
            // Get API key and model from storage
            chrome.storage.sync.get({[MODEL_KEY]: DEFAULT_MODEL, [API_KEY_KEY]: ''}, function(items) {
                const model = items[MODEL_KEY];
                const apiKey = items[API_KEY_KEY];

                if (!apiKey) {
                    sendResponse({
                        success: false,
                        error: "API key is not set. Please set it in the extension options."
                    });
                    return;
                }

                // Process the custom question using the WASM function
                askQuestion(request.question, request.html, apiKey, model)
                    .then(result => {
                        sendResponse(result);
                    })
                    .catch(error => {
                        console.error("Error processing custom question:", error);
                        sendResponse({
                            success: false,
                            error: "Failed to process the question. Please try again."
                        });
                    });
            });

            // Return true to indicate we'll respond asynchronously
            return true;
    }
});