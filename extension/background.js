// A static import is required in b/g scripts because they are executed in their own env
// not connected to the content scripts where wasm is loaded automatically
import initWasmModule, { hello, summarize } from './wasm/summy_background.js';

console.log("Background script started");

// run the wasm initializer before calling wasm methods
// the initializer is generated by wasm_pack
(async () => {
    await initWasmModule();
    hello(); // logs a hello message from wasm
})();

chrome.contextMenus.create({
    id: "summyContextMenuId",
    title: "Summarize with Summy",
    contexts:["page"],
});

chrome.contextMenus.onClicked.addListener((info, tab) =>
    process(tab)
);

function process(tab){
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: DOMtoString,
    }).then(function (results) {
        summarize(results[0].result).then(function (summary) {
            console.log("summarize: Summary: \n" + summary);
            displaySummary(tab, summary);
        })
    }).catch(function (error) {
        console.log("summarize: Error injecting script: \n" + error.message);
    });
};

function displaySummary(tab, summary) {
    chrome.tabs.sendMessage(tab.id,
        {
            msg: "summy_tldr",
            result: summary
        }
    );
}

function DOMtoString() {
    return document.documentElement.outerHTML;
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg === "summy_capture") {
        let params = {
            currentWindow: true,
            active: true
        }

        chrome.tabs.query(params, function (tabs) {
            process(tabs[0]);
        });
    }
});