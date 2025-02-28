console.log("☀️☀️☀️ Hello from Summy! ☀️☀️☀️");

let icon = document.createElement("img");
icon.src = chrome.runtime.getURL("images/button.png");
icon.title = "Summarize with Summy";

let button = document.createElement("button");
button.id = "summy-button";
button.appendChild(icon);
button.classList.add("no-loading");
button.onclick = function() {
    chrome.runtime.sendMessage(
        { 
            msg: "summy_capture"
        }, 
        function (response) {}
    );
}

let buttonDiv = document.createElement("div");
buttonDiv.classList.add("button-container");
buttonDiv.appendChild(button);
document.body.prepend(buttonDiv);

let tldr = document.createElement("div");
tldr.id = "summy-tldr";
document.body.prepend(tldr);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg === "summy_tldr") {
        let data = JSON.parse(request.result);
        console.log("summy_tldr: ", data);

        let pageCategory = document.createElement("div");
        pageCategory.classList.add("page-category");
        pageCategory.innerText = data.category;
        
        let pageSummary = document.createElement("div");
        pageSummary.classList.add("page-summary");
        pageSummary.innerText = data.summary;

        let pageEmojis = document.createElement("div");
        pageEmojis.classList.add("page-emojis");
        pageEmojis.innerText = data.emoji_outline;

        let pageTLDR = document.createElement("div");
        pageTLDR.classList.add("page-tldr");
        pageTLDR.appendChild(pageCategory);
        pageTLDR.appendChild(pageEmojis);
        pageTLDR.appendChild(pageSummary);
        
        let stress = document.createElement("div");
        stress.classList.add("stress-container");

        let stressTitle = document.createElement("div");
        stressTitle.classList.add("stress-title");
        stressTitle.innerText = "Stress Level";
        stress.appendChild(stressTitle);

        let stressScore = document.createElement("div");
        stressScore.classList.add("stress-score");
        if (data.stress_score < 4) stressScore.innerText = "🙂";
        else if (data.stress_score < 7) stressScore.innerText = "😐";
        else stressScore.innerText = "😞";
        stress.appendChild(stressScore);

        let stressCategory = document.createElement("div");
        stressCategory.classList.add("stress-category");
        if (data.stress_score < 4) stressCategory.innerText = "Low";
        else if (data.stress_score < 7) stressCategory.innerText = "Medium";
        else stressCategory.innerText = "High";
        stress.appendChild(stressCategory);

        tldr.innerHTML = "";
        tldr.appendChild(stress);
        tldr.appendChild(pageTLDR);
        tldr.style.display = "flex";
        buttonDiv.style.display = "none";

        console.log("summy_tldr: Summary: \n" + request.summary);
    }
});