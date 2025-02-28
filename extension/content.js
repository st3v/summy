console.log("☀️☀️☀️ Hello from Summy! ☀️☀️☀️");

let style = document.createElement("style");
style.textContent = `
 .loading {
    height: 40px;
    width: 40px;
    border: 0px;
    aspect-ratio: 1;
    box-sizing: border-box;
    display: grid;
    mix-blend-mode: darken;
    border-radius: 50%;
    opacity: 0.6;
  }

  .loading:before{
    content: "";
    margin: auto;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    color: #794fcd;
    background: currentColor;
    filter: blur(5px);
    box-shadow: -20px 0, 20px 0, 0 20px, 0 -20px;
    animation: loading 1s infinite alternate;
  }

  .loading img {
    display: none;
    position: absolute;
    top: 0;
    left: 0;
  }

  .no-loading img {
    position: absolute;
    top: 0;
    left: 0;
  }

  .no-loading:hover {
    opacity: 1;
  }

  .no-loading {
    margin: auto;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background-color: rgba(128, 34, 179, 0.3);
    mix-blend-mode: darken;
    padding: 0px;
    border: none;
    opacity: 0.6;
  }

  @keyframes loading {
    80%,100% {box-shadow: -5px 0, 5px 0, 0 5px, 0 -5px; transform: rotate(180deg);}
  }
`
document.head.appendChild(style);

let icon = document.createElement("img");
icon.src = chrome.runtime.getURL("images/button.png");
icon.title = "Summarize with Summy";
icon.style = "transition: opacity 1s;";

let button = document.createElement("button");
button.id = "summy-button";
button.style = "transition: opacity 1s;";
button.appendChild(icon);
// button.style = "border: none; background: none; padding: 0; margin: 0; cursor: pointer;";
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
buttonDiv.style = "position: fixed; bottom: 30px; right: 30px; z-index: 9999998; height: 40px; width: 40px;";
buttonDiv.appendChild(button);
document.body.prepend(buttonDiv);

let tldr = document.createElement("div");
tldr.id = "summy-tldr";
tldr.style = "border-top: thin solid rgb(210, 223, 210); line-height: 1.6; position: fixed; bottom: 0; right: 0; left: 0; z-index: 9999997; padding-top: 10px; padding-bottom: 10px; width: 100%; color: white; font-size: 14px; text-align: left; font-family: Arial, sans-serif; display: none; background: linear-gradient(90deg, rgb(45 14 99) 10%, rgb(212, 17, 115) 100%);";
document.body.prepend(tldr);

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.msg === "summy_tldr") {
        let data = JSON.parse(request.result);
        console.log("summy_tldr: ", data);

        let pageCategory = document.createElement("div");
        pageCategory.style = "font-weight: bold; font-size: 14px";
        pageCategory.innerText = data.category;
        
        let pageSummary = document.createElement("div");
        pageSummary.style = "font-size: 14px; margin-top: 5px; flex: 15 1 0;";
        pageSummary.innerText = data.summary;

        let pageEmojis = document.createElement("div");
        pageEmojis.style = "font-size: 15px; padding: 5px 15px; top: -18px; right: 0; margin-right: 10px; border: thin solid #d2dfd2; background: rgb(78 17 103); border-radius: 25px; position: absolute;";
        pageEmojis.innerText = data.emoji_outline;

        let pageTLDR = document.createElement("div");
        pageTLDR.style = "font-size: 14px; padding-left: 20px; padding-right: 10px; flex: 15 1 0;";
        pageTLDR.appendChild(pageCategory);
        pageTLDR.appendChild(pageEmojis);
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
        buttonDiv.style.display = "none";

        console.log("summy_tldr: Summary: \n" + request.summary);
    }
});