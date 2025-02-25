console.log("☀️☀️☀️ Hello from Summy! ☀️☀️☀️");

let icon = document.createElement("img");
icon.src = chrome.runtime.getURL("images/button.png");

let button = document.createElement("button");
button.appendChild(icon);
button.style = "border: none; background: none; padding: 0; margin: 0; cursor: pointer;";
button.onclick = function() {
    chrome.runtime.sendMessage(
        { 
            msg: "summy_capture"
        }, 
        function (response) {
            console.log("response from the bg", response)
        }
    );
}

let div = document.createElement("div");
div.id = "summy- button";
div.style = "position: fixed; bottom: 20px; right: 0; z-index: 10001; padding: 20px; opacity: 0.7;";
div.appendChild(button);
document.body.prepend(div);

let tldr = document.createElement("div");
tldr.id = "summy-tldr";
tldr.style = "line-height: 1.6; position: fixed; bottom: 0; right: 0; left: 0; z-index: 9999997; padding-top: 10px; padding-bottom: 10px; width: 100%; color: white; font-size: 14px; text-align: left; font-family: Arial, sans-serif; display: none; background: linear-gradient(314.9161155270921deg, rgb(236, 117, 19) 0%, rgb(212, 17, 115) 100%);";
document.body.prepend(tldr);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg === "summy_tldr") {
        let data = JSON.parse(request.result);

        let pageCategory = document.createElement("div");
        pageCategory.style = "font-weight: bold; font-size: 14px";
        pageCategory.innerText = data.category;
        
        let pageSummary = document.createElement("div");
        pageSummary.style = "font-size: 14px; margin-top: 5px; flex: 15 1 0;";
        pageSummary.innerText = data.summary;

        let pageTLDR = document.createElement("div");
        pageTLDR.style = "font-size: 14px; padding-left: 10px; padding-right: 10px; flex: 15 1 0;";
        pageTLDR.appendChild(pageCategory);
        pageTLDR.appendChild(pageSummary);
        
        let stress = document.createElement("div");
        stress.style = "text-align: center; padding-left: 5px; padding-right: 5px; flex: 1 1 0; font-weight: bold; border-right: 2px solid;";

        let stressTitle = document.createElement("div");
        stressTitle.style = "font-size: 10px; line-height: 1; display: block; margin-top: 5px;";
        stressTitle.innerText = "Stress Level";
        stress.appendChild(stressTitle);

        let stressScore = document.createElement("div");
        stressScore.style = "font-size: 30px; margin-top: 10px; line-height: 1; display: block;";
        // stressScore.innerText = data.stress_score;
        if (data.stress_score < 4) stressScore.innerText = "🙂";
        else if (data.stress_score < 7) stressScore.innerText = "😐";
        else stressScore.innerText = "😞";
        stress.appendChild(stressScore);

        let stressCategory = document.createElement("div");
        stressCategory.style = "font-size: 10px; line-height: 1; display: block; margin-top: 5px;";
        if (data.stress_score < 4) stressCategory.innerText = "Low";
        else if (data.stress_score < 7) stressCategory.innerText = "Medium";
        else stressCategory.innerText = "High";
        stress.appendChild(stressCategory);

        tldr.innerHTML = "";
        tldr.appendChild(stress);
        tldr.appendChild(pageTLDR);
        tldr.style.display = "flex";
        button.style.display = "none";

        console.log("summy_tldr: Summary: \n" + request.summary);
    }
});