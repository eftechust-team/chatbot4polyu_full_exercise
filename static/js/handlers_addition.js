// Add these handler functions at the end of form-script.js

// Supplement records - show meal selection again
window.supplementRecords = function() {
    startNewRecord();
};

// Continue to next day
window.continueNextDay = function() {
    const recordDateSelect = document.getElementById('recordDate');
    let dateLabel = '記錄';
    if (recordDateSelect) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        dateLabel = selectedOption.text;
    }
    
    // Store today's records
    const today = dateLabel;
    allDailyRecords[today] = { ...recordedMeals };
    
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>感謝您的記錄！</strong><br>
            ${today}記錄已保存。<br>
            祝您明天繼續記錄！
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
};

// View all records
window.viewAllRecords = function() {
    let allRecordsHTML = '<strong>我的所有記錄：</strong><br>';
    
    if (Object.keys(allDailyRecords).length === 0) {
        allRecordsHTML += '暫無記錄。';
    } else {
        for (const date in allDailyRecords) {
            allRecordsHTML += `<strong>${date}：</strong><br>`;
            const meals = allDailyRecords[date];
            for (const mealName in meals) {
                const meal = meals[mealName];
                allRecordsHTML += `•${meal.name}（${meal.time}、${meal.location}）<br>`;
            }
            allRecordsHTML += '<br>';
        }
    }
    
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            ${allRecordsHTML}
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
};
