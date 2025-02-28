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

        // Create stress container first
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

        // Create summary container
        let summaryContainer = document.createElement("div");
        summaryContainer.classList.add("summary-container");
        
        // Create content view
        let contentView = document.createElement("div");
        contentView.classList.add("content-view");
        
        // Store summary content for back navigation
        const summaryContent = {
            title: data.category,
            text: data.summary
        };
        
        // Add title and text sections
        let titleSection = document.createElement("div");
        titleSection.classList.add("content-title");
        
        let textSection = document.createElement("div");
        textSection.classList.add("content-text");
        
        // Set initial content (summary)
        titleSection.innerText = summaryContent.title;
        textSection.innerText = summaryContent.text;
        
        contentView.appendChild(titleSection);
        contentView.appendChild(textSection);
        
        summaryContainer.appendChild(contentView);

        // Create questions container
        let questionsContainer = document.createElement("div");
        questionsContainer.classList.add("questions-container");
        
        // Add questions
        data.questions.forEach((question, index) => {
            let questionItem = document.createElement("div");
            questionItem.classList.add("question-item");
            questionItem.innerHTML = `◂ ${question}`;
            questionItem.onclick = () => {
                // Update content to show answer
                titleSection.innerHTML = `<span class="back-button">◂ Back</span> ${question}`;
                textSection.innerText = data.answers[index];
                
                // Add back button functionality
                titleSection.querySelector('.back-button').onclick = (e) => {
                    e.stopPropagation();
                    // Always go back to summary
                    titleSection.innerText = summaryContent.title;
                    textSection.innerText = summaryContent.text;
                };
            };
            questionsContainer.appendChild(questionItem);
        });

        let pageEmojis = document.createElement("div");
        pageEmojis.classList.add("page-emojis");
        pageEmojis.innerText = data.emoji_outline;

        let pageTLDR = document.createElement("div");
        pageTLDR.classList.add("page-tldr");
        pageTLDR.appendChild(stress);
        pageTLDR.appendChild(summaryContainer);
        pageTLDR.appendChild(questionsContainer);
        pageTLDR.appendChild(pageEmojis);
        
        tldr.innerHTML = "";
        tldr.appendChild(pageTLDR);
        tldr.style.display = "flex";
        buttonDiv.style.display = "none";

        console.log("summy_tldr: Summary: \n" + request.summary);
    }
});