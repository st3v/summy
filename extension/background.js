// import the wasm module and the summarize function
import * as wasm from './wasm/summy_background.js';
import { MODEL_KEY, API_KEY_KEY, DEFAULT_MODEL } from './constants.js';

(async function() {
    await wasm.default();
})();

console.log("Background script started");

const CONTEXT_MENU_KEY = "summyContextMenu"

chrome.contextMenus.create({
    id: CONTEXT_MENU_KEY,
    title: "Summarize with Summy",
    contexts:["page"],
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === CONTEXT_MENU_KEY) {
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

        return wasm.summarize(getSessionId(tab), html, model, apiKey).then(function (summary) {
            console.log("summarize success:\n", summary);
            displaySummary(tab, summary, null);
        }).catch(function (error) {
            console.log("summarize error:", error);
            displaySummary(tab, null, "Failed to summarize webpage");
        });
    });
};

function displaySummary(tab, summary, error) {
    try {
        chrome.tabs.sendMessage(tab.id,
            {
                msg: "summy_tldr",
                result: summary,
                error: error
            }
        ).catch(err => console.debug(`Could not send message to tab ${tab.id}:`, err));
    } catch (error) {
        console.debug(`Error sending message to tab ${tab.id}:`, error);
    }
}
// User has a follow-up question or comment
function followUp(tab, question) {
    // Get API key and model from storage
    return chrome.storage.sync.get({[MODEL_KEY]: DEFAULT_MODEL, [API_KEY_KEY]: ''})
        .then(items => {
            const model = items[MODEL_KEY];
            const apiKey = items[API_KEY_KEY];

            if (!apiKey) {
                throw new Error("API key is not set. Please set it in the extension options.");
            }

            return wasm.follow_up(getSessionId(tab), question, model, apiKey);
        });
}

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
    switch (request.msg) {
        case "summy_summarize":
            try {
                getCurrentTab(tab => {
                    if (tab) {
                        summarizePage(tab, request.html);
                    }
                });

                sendResponse({success: true});
            } catch (error) {
                console.error("Error processing summarize message:", error);
                sendResponse({success: false});
            }
            break;
        case "summy_answer":
            getCurrentTab(tab => {
                followUp(tab, request.question).then(answer => {
                    console.log("Follow-up:", answer);
                    sendResponse({
                        success: true,
                        answer: answer
                    });
                }).catch(error => {
                    console.error("Error processing follow-up question:", error);
                    sendResponse({
                        success: false,
                        error: error
                    });
                });
            });
            break;
        case "summy_cleanup":
            try {
                getCurrentTab(tab => {
                    wasm.cleanup(getSessionId(tab));
                });
                sendResponse({success: true});
            } catch (error) {
                console.error("Error cleaning up session:", error);
                sendResponse({success: false, error: error.message});
            }
            break;
    }

    // Return true to indicate we will respond asynchronously
    return true;
});

function getCurrentTab(callback) {
    let queryOptions = { active: true, lastFocusedWindow: true };
    chrome.tabs.query(queryOptions, ([tab]) => {
        if (chrome.runtime.lastError) throw new Error(chrome.runtime.lastError);
        callback(tab);
    });
}

// Get the session ID for a tab
function getSessionId(tab) {
    // use tab ID as session ID
    return String(tab.id);
}
