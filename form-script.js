// Handle skipping step 4 (no additional description needed)
function skipStep4() {
    // Optionally, you can set a flag or update mealData to indicate no extra description
    if (typeof mealData !== 'undefined') {
        mealData.additionalDesc = '無';
    }
    // Disable input for step 4
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    if (chatInput && chatSend) {
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;
        chatInput.placeholder = '輸入訊息...';
    }
    // Remove any temporary event listeners for step 4
    if (typeof step4Temp !== 'undefined' && step4Temp.handler && chatSend && chatInput) {
        chatSend.removeEventListener('click', step4Temp.handler);
        chatInput.removeEventListener('keypress', step4Temp.keyHandler);
        step4Active = false;
    }
    // Always show editable time input for main meals in summary bubble
    if (summaryBubbleShown) return; // avoid duplicate summary bubbles
    summaryBubbleShown = true;
    // Generate unique ID suffix using timestamp
    const uniqueId = Date.now();
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.setAttribute('data-summary-id', uniqueId);
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>記錄摘要：</strong><br><br>
            <strong>記錄日期：</strong>${getRecordDateLabel()}<br>
            <strong>餐次：</strong>
            <select id="editMealType_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                <option value="早餐" ${currentMealName === '早餐' ? 'selected' : ''}>早餐</option>
                <option value="上午加餐" ${currentMealName === '上午加餐' ? 'selected' : ''}>上午加餐</option>
                <option value="午餐" ${currentMealName === '午餐' ? 'selected' : ''}>午餐</option>
                <option value="下午加餐" ${currentMealName === '下午加餐' ? 'selected' : ''}>下午加餐</option>
                <option value="晚餐" ${currentMealName === '晚餐' ? 'selected' : ''}>晚餐</option>
                <option value="晚上加餐" ${currentMealName === '晚上加餐' ? 'selected' : ''}>晚上加餐</option>
            </select><br>
            <br><strong>已上傳照片及描述：</strong>
            ${mealData.photos.map((photo, i) => `
                <div style="margin:8px 0;">
                    <img src="${photo}" alt="照片 ${i + 1}" class="uploaded-image">
                    <br><textarea id="desc${i}_${uniqueId}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; font-family: inherit; font-size: 12px;" rows="2">${mealData.descriptions[i]}</textarea>
                </div>
            `).join('')}
            <strong>用餐時間：</strong><div id="editMealTimeContainer_${uniqueId}" style="display: inline-block;"></div><br>
            <strong>用餐地點：</strong>
            <select id="editLocation_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                <option value="家" ${mealData.location === '家' ? 'selected' : ''}>家</option>
                <option value="工作單位" ${mealData.location === '工作單位' ? 'selected' : ''}>工作單位</option>
                <option value="餐廳/外賣" ${mealData.location === '餐廳/外賣' ? 'selected' : ''}>餐廳/外賣</option>
                <option value="其他" ${mealData.location === '其他' ? 'selected' : ''}>其他</option>
            </select><br>
            <br><strong>進食情況：</strong>
            <select id="editAmount_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                <option value="全部吃完" ${mealData.amount === '全部吃完' ? 'selected' : ''}>全部吃完</option>
                <option value="剩餘一些" ${mealData.amount === '剩餘一些' ? 'selected' : ''}>剩餘一些</option>
                <option value="只吃少量" ${mealData.amount === '只吃少量' ? 'selected' : ''}>只吃少量</option>
            </select><br>
            <br><strong>補充描述：</strong><textarea id="editAdditionalDesc_${uniqueId}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; font-family: inherit; font-size: 12px;" rows="2">${mealData.additionalDesc}</textarea><br><br>
            <button class="submit-info-btn" onclick="finalizeRecord(${uniqueId})" style="margin-top:10px; width: 100%;">保存${currentMealName}記錄</button>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    // Always generate and insert the time dropdowns for main meal summary
    const timeDropdowns = generateTimeDropdowns(mealData.mealTime, `editMealTime_${uniqueId}`);
    const container = document.getElementById(`editMealTimeContainer_${uniqueId}`);
    if (container) {
        container.innerHTML = timeDropdowns.html;
    }
}
// Ask if user wants to upload more photos or continue
function askMorePhotos() {
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            是否還有其他食物照片要上傳？<br>
            <div class="upload-buttons confirm-upload-buttons" style="margin-top:10px; display: flex; gap: 16px;">
                <button class="upload-btn" onclick="showUploadPromptNoDivider()" style="flex: 1;">再上傳一張</button>
                <button class="submit-info-btn" onclick="noMorePhotosMainFlow()" style="flex: 1;">沒有了，繼續</button>
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Handler for "沒有了，繼續" in main meal/photo flow
function noMorePhotosMainFlow() {
    // Show Step 3: 補充資訊 (meal time, location, amount) with same time input as snack
    const step3Msg = document.createElement('div');
    step3Msg.className = 'bot-message';
    step3Msg.innerHTML = `
        <div class="message-content">
            <strong>第3步：補充資訊</strong><br>
            <div class="info-field">
                <div>1. 用餐時間：</div>
                <div id="mealTimeContainer"></div>
            </div>
            <div class="info-field">
                <div>2. 用餐地點：</div>
                <div style="margin-top:2px;">
                    <label style="margin-right:10px;"><input type="radio" name="location" value="家">家</label>
                    <label style="margin-right:10px;"><input type="radio" name="location" value="工作單位">工作單位</label>
                    <label style="margin-right:10px;"><input type="radio" name="location" value="餐廳/外賣">餐廳/外賣</label>
                    <label><input type="radio" name="location" value="其他">其他</label>
                </div>
            </div>
            <div class="info-field">
                <div>3. 進食情況：</div>
                <div style="margin-top:2px;">
                    <label style="margin-right:10px;"><input type="radio" name="amount" value="全部吃完">全部吃完</label>
                    <label style="margin-right:10px;"><input type="radio" name="amount" value="剩餘一些">剩餘一些</label>
                    <label><input type="radio" name="amount" value="只吃少量">只吃少量</label>
                </div>
            </div>
            <button class="submit-info-btn" onclick="submitAdditionalInfo()" style="margin-top:10px; width: 100%;">送出補充資訊</button>
        </div>
    `;
    chatMessagesEl.appendChild(step3Msg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    
    // Generate and insert the time dropdowns for meal form with a small delay to ensure DOM is ready
    setTimeout(() => {
        // Use empty string for time so it shows default "00:00" input fields
        const timeDropdowns = generateTimeDropdowns('', 'mealTime');
        // Find the LAST mealTimeContainer (for handling multiple meals in one session)
        const containers = document.querySelectorAll('#mealTimeContainer');
        const container = containers.length > 0 ? containers[containers.length - 1] : null;
        if (container) {
            container.innerHTML = timeDropdowns.html;
            // HTML5 time input handles everything
        }
    }, 100);
    // Step 4 prompt will be shown after submitAdditionalInfo()
}
// Returns the label for the currently selected record date
function getRecordDateLabel() {
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        return selectedOption ? selectedOption.text : recordDateSelect.value;
    }
    return '';
}

// Form validation and submission
document.getElementById('personalInfoForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('name').value,
        participantId: document.getElementById('participantId').value,
        recordDate: document.getElementById('recordDate').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        age: document.getElementById('age').value
    };
    
    console.log('Form data:', formData);
    // Here you can add code to save the data or send it to a server
});

// FAQ Modal functionality
const modal = document.getElementById('faqModal');
const helpBtn = document.getElementById('helpBtn');
const closeBtn = document.querySelector('.close');

helpBtn.addEventListener('click', () => {
    modal.style.display = 'block';
});

closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
});

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Meal selection handling (single updatable answer bubble)
let chatMessagesEl, selectionStatusEl;
let userSelectionMsgEl = null; // the message-content element to update
let uploadPromptShown = false;
// Step 4 state to prevent global send handler from firing
let step4Active = false;
let step4Temp = { answered: false, handler: null, keyHandler: null };
// Flow control for meal vs snack
let currentFlow = 'main'; // 'main' for 早餐/午餐/晚餐, 'snack' for 加餐
let snackType = null; // selected snack type
let currentMealName = ''; // track the current meal/snack name for save button
// Track recorded meals throughout the day
let recordedMeals = {}; // { mealType: { name, time, location/snackType, snackName?, snackAmount? } }
let allDailyRecords = {}; // store all records by date
let summaryBubbleShown = false; // prevent multiple summary bubbles for same meal

// Ensure event listeners are attached after DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    chatMessagesEl = document.getElementById('chatMessages');
    selectionStatusEl = document.getElementById('mealSelectionStatus');
    
    // Attach listeners to static meal-option buttons (initial render)
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.addEventListener('click', handleMealOptionClick);
    });
    // Attach listener to reset button
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', function() {
            window.resetForm();
        });
    }

    // Attach chat send listeners (for text input and button)
    const chatSend = document.getElementById('chatSend');
    const chatInput = document.getElementById('chatInput');
    if (chatSend) {
        chatSend.addEventListener('click', function() {
            if (!chatSend.disabled) {
                if (typeof step4Active !== 'undefined' && step4Active && step4Temp && typeof step4Temp.handler === 'function') {
                    step4Temp.handler();
                } else {
                    sendChatMessage();
                }
            }
        });
    }
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !chatInput.disabled) {
                if (typeof step4Active !== 'undefined' && step4Active && step4Temp && typeof step4Temp.handler === 'function') {
                    step4Temp.handler();
                } else {
                    sendChatMessage();
                }
            }
        });
    }
});

// Confirm date selection and show meal options
window.confirmDateSelection = function() {
    const selectedDate = document.querySelector('input[name="recordDate"]:checked');
    if (!selectedDate) {
        alert('請選擇記錄日期');
        return;
    }
    
    // Create or update the hidden select element for compatibility with rest of code
    let selectElement = document.getElementById('recordDate');
    if (!selectElement) {
        selectElement = document.createElement('select');
        selectElement.id = 'recordDate';
        selectElement.name = 'recordDate';
        selectElement.style.display = 'none';
        
        // Add options to the select
        const option0 = document.createElement('option');
        option0.value = '';
        option0.text = '請選擇';
        selectElement.appendChild(option0);
        
        const option1 = document.createElement('option');
        option1.value = 'workday1';
        option1.text = '第一個工作日';
        selectElement.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = 'workday2';
        option2.text = '第二個工作日';
        selectElement.appendChild(option2);
        
        const option3 = document.createElement('option');
        option3.value = 'restday';
        option3.text = '第一個休息日';
        selectElement.appendChild(option3);
        
        document.body.appendChild(selectElement);
    }
    
    // Set the value
    selectElement.value = selectedDate.value;
    
    // Show meal options
    showMealOptionsAfterDateSelection();
};

// Show meal options after date is selected
function showMealOptionsAfterDateSelection() {
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>請選擇您要記錄的餐次：</strong>
            <div class="meal-options">
                <button class="meal-option" data-value="breakfast"><strong>早餐</strong>（通常6:00-9:00）</button>
                <button class="meal-option" data-value="snack_morning"><strong>上午加餐</strong>（9:00-11:00）</button>
                <button class="meal-option" data-value="lunch"><strong>午餐</strong>（11:00-13:30）</button>
                <button class="meal-option" data-value="snack_afternoon"><strong>下午加餐</strong>（14:00-17:00）</button>
                <button class="meal-option" data-value="dinner"><strong>晚餐</strong>（17:00-20:00）</button>
                <button class="meal-option" data-value="snack_night"><strong>晚上加餐</strong>（20:00-睡前）</button>
            </div>
            <div id="mealSelectionStatus" class="selection-status"></div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    
    // Update selectionStatusEl to the new dynamically created one
    selectionStatusEl = document.getElementById('mealSelectionStatus');
    
    // Attach click listeners to the new meal-option buttons
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.addEventListener('click', handleMealOptionClick);
    });
}

let isDateLocked = false; // track if the date is locked after first meal
let pendingRecordOverride = null; // store edited record before final save
// Track time/location/amount separately so they don't get mixed between meals
let currentRecordData = {
    mealTime: '',
    location: '',
    amount: ''
};
// Data collection object to track all responses
let mealData = {
    photoCount: 0,
    photos: [], // store image data URLs
    descriptions: [],
    mealTime: '',
    location: '',
    amount: '',
    additionalDesc: '',
    snackName: '',
    snackAmount: ''
};

// Handle meal option button click
function handleMealOptionClick(e) {
    // Use the button element that was clicked
    const btn = e.currentTarget || this;
    
    console.log('Meal button clicked:', btn.textContent);
    
    // Check if button is disabled
    if (btn.disabled || btn.classList.contains('disabled')) {
        console.log('Button is disabled, returning');
        return;
    }
    
    // Check if date is selected first
    const recordDateSelect = document.getElementById('recordDate');
    if (!recordDateSelect.value) {
        alert('請先選擇記錄日期！');
        return;
    }
    
    console.log('Processing meal selection...');
    
    // Toggle selected state
    document.querySelectorAll('.meal-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const label = btn.textContent.trim();
    const mealName = extractMealName(label);
    const mealValue = btn.getAttribute('data-value');
    
    console.log('Meal selected:', label, 'Name:', mealName, 'Value:', mealValue);
    
    // Update inline status text under options
    const selectionStatusEl = document.getElementById('mealSelectionStatus');
    if (selectionStatusEl) selectionStatusEl.textContent = `已選擇餐次：${label}`;

    // Create the user message bubble once, then update it
    if (!userSelectionMsgEl) {
        const wrapper = document.createElement('div');
        wrapper.className = 'user-message';
        const content = document.createElement('div');
        content.className = 'message-content';
        wrapper.appendChild(content);
        chatMessagesEl.appendChild(wrapper);
        userSelectionMsgEl = content;
    }

    userSelectionMsgEl.textContent = `我選擇：${label}`;
    
    // Reset per-meal flags for a fresh flow
    summaryBubbleShown = false;
    uploadPromptShown = false;

    // Branch: main meals vs snacks
    if (mealValue === 'breakfast' || mealValue === 'lunch' || mealValue === 'dinner') {
        currentFlow = 'main';
        currentMealName = mealName;
        if (!uploadPromptShown) {
            console.log('Showing upload prompt for main meal:', mealName);
            setTimeout(() => showUploadPrompt(mealName), 500);
            uploadPromptShown = true;
        }
    } else {
        currentFlow = 'snack';
        currentMealName = mealName;
        console.log('Starting snack flow');
        setTimeout(() => startSnackFlow(), 300);
    }
    
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Extract meal name from label (e.g., "早餐（通常6:00-9:00）" -> "早餐")
function extractMealName(label) {
    const match = label.match(/^([^（]+)/);
    return match ? match[1] : label;
}

function showUploadPrompt(mealName) {
    // Create divider with meal title
    const divider = document.createElement('div');
    divider.className = 'meal-divider';
    divider.innerHTML = `<span>${mealName}記錄</span>`;
    chatMessagesEl.appendChild(divider);
    
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>第1步：上傳照片</strong><br>
            請拍攝您的${mealName}：<br>
            <div class="upload-buttons">
                <button class="upload-btn" onclick="openCamera()">📷 點擊拍照</button>
                <button class="upload-btn" onclick="document.getElementById('galleryInput').click()">🖼️ 選擇照片</button>
            </div>
            <input type="file" id="galleryInput" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="handleImageUpload(event)">
            <div class="photo-tips">
                <strong>【拍攝提示】</strong><br>
                • 將食物放在碗、盤或杯中拍攝<br>
                • 確保光線充足，照片清晰<br>
                • 包裝食品請單獨拍攝營養成分表
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Show upload prompt without divider (for additional photos of same meal)
function showUploadPromptNoDivider() {
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>第1步：上傳照片</strong><br>
            請拍攝您的食物：<br>
            <div class="upload-buttons">
                <button class="upload-btn" onclick="openCamera()">📷 點擊拍照</button>
                <button class="upload-btn" onclick="document.getElementById('galleryInput2').click()">🖼️ 選擇照片</button>
            </div>
            <input type="file" id="galleryInput2" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="handleImageUpload(event)">
            <div class="photo-tips">
                <strong>【拍攝提示】</strong><br>
                • 將食物放在碗、盤或杯中拍攝<br>
                • 確保光線充足，照片清晰<br>
                • 包裝食品請單獨拍攝營養成分表
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

let cameraStream = null;

window.openCamera = async function() {
    try {
        // Request camera access
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
        });
        
        // Create camera modal
        const modal = document.createElement('div');
        modal.className = 'camera-modal';
        modal.innerHTML = `
            <div class="camera-container">
                <video id="cameraVideo" autoplay playsinline></video>
                <div class="camera-controls">
                    <button class="camera-btn capture-btn" onclick="capturePhoto()">📷 拍照</button>
                    <button class="camera-btn close-btn" onclick="closeCamera()">✖ 取消</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Attach stream to video
        const video = document.getElementById('cameraVideo');
        video.srcObject = cameraStream;
        
    } catch (error) {
        console.error('Camera access error:', error);
        alert('無法訪問相機。請檢查相機權限或使用「選擇照片」功能。');
    }
};

window.capturePhoto = function() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // Convert to blob and handle as uploaded image
    canvas.toBlob((blob) => {
        const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
        handleImageUpload({ target: { files: [file] } });
        closeCamera();
    }, 'image/jpeg', 0.9);
};

window.closeCamera = function() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    const modal = document.querySelector('.camera-modal');
    if (modal) modal.remove();
};

window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        console.log('Image uploaded:', file.name);
        
        // Create image preview URL
        const reader = new FileReader();
        reader.onload = function(e) {
            // Create user message with image
            const userMsg = document.createElement('div');
            userMsg.className = 'user-message';
            userMsg.innerHTML = `
                <div class="message-content">
                    <img src="${e.target.result}" alt="上傳的照片" class="uploaded-image">
                </div>
            `;
            chatMessagesEl.appendChild(userMsg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            
            // Track photo
            mealData.photoCount++;
            mealData.photos.push(e.target.result);
            
            // After a short delay, branch by flow
            setTimeout(() => {
                if (currentFlow === 'main') {
                    const botMsg = document.createElement('div');
                    botMsg.className = 'bot-message';
                    botMsg.innerHTML = `
                        <div class="message-content">
                            <strong>第2步：對上傳的食物進行文字描述</strong><br>
                            <span style="font-size: 13px; color: #666;">格式：食物-份量，以空格隔開。<br>例如：蘋果-100g 麵條-一碗 麵包-一拳</span>
                        </div>
                    `;
                    chatMessagesEl.appendChild(botMsg);
                    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
                    // Enable chat input for user to type description
                    enableChatInput();
                } else if (currentFlow === 'snack') {
                    const botMsg = document.createElement('div');
                    botMsg.className = 'bot-message';
                    botMsg.innerHTML = `
                        <div class="message-content">
                            <strong>詳細資訊：</strong><br><br>
                            <div class="info-form">
                                <div class="info-field">
                                    <label>1. 進食時間：</label>
                                    <div id="snackTimeContainer"></div>
                                </div>
                                <div class="info-field">
                                    <label>2. 食物名稱：</label>
                                    <input type="text" id="snackName" class="text-input" placeholder="如：蘋果、餅乾、礦泉水">
                                </div>
                                <div class="info-field">
                                    <label>3. 估計分量：</label>
                                    <input type="text" id="snackAmount" class="text-input" placeholder="如：1個蘋果、半包餅乾">
                                </div>
                                <button class="submit-info-btn" onclick="submitSnackDetails()">提交</button>
                            </div>
                        </div>
                    `;
                    chatMessagesEl.appendChild(botMsg);
                    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
                    
                    // Generate and insert the time dropdowns for snack form immediately
                    const timeDropdowns = generateTimeDropdowns(currentRecordData.mealTime, 'snackTime');
                    // Find the LAST snackTimeContainer (for handling multiple snacks in one session)
                    const containers = document.querySelectorAll('#snackTimeContainer');
                    const container = containers.length > 0 ? containers[containers.length - 1] : null;
                    if (container) {
                        container.innerHTML = timeDropdowns.html;
                        // HTML5 time input handles everything
                    }
                }
            }, 500);
        };
        reader.readAsDataURL(file);
    }
};

// Start snack flow: ask for snack type first
window.startSnackFlow = function() {
    currentFlow = 'snack';
    snackType = null;
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>請選擇加餐類型（即使是小零食或一杯水，也請記錄下來）：</strong>
            <div class="radio-options" style="margin-top:8px;">
                <label class="radio-option"><input type="radio" name="snackType" value="水果"> 水果</label>
                <label class="radio-option"><input type="radio" name="snackType" value="零食"> 零食</label>
                <label class="radio-option"><input type="radio" name="snackType" value="飲料"> 飲料</label>
                <label class="radio-option"><input type="radio" name="snackType" value="堅果"> 堅果</label>
                <label class="radio-option"><input type="radio" name="snackType" value="甜品"> 甜品</label>
                <label class="radio-option"><input type="radio" name="snackType" value="其他"> 其他</label>
            </div>
            <button class="submit-info-btn" onclick="submitSnackType()">下一步</button>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Submit snack type and show upload prompt (no multi-photo loop)
window.submitSnackType = function() {
    const selected = document.querySelector('input[name="snackType"]:checked');
    if (!selected) {
        alert('請選擇加餐類型');
        return;
    }
    snackType = selected.value;
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `
        <div class="message-content">我選擇：${snackType}</div>
    `;
    chatMessagesEl.appendChild(userMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    setTimeout(() => {
        showSnackUploadPrompt();
    }, 300);
};

function showSnackUploadPrompt() {
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>第1步：上傳照片</strong><br>
            請拍攝您的加餐：<br>
            <div class="upload-buttons">
                <button class="upload-btn" onclick="openCamera()">📷 點擊拍照</button>
                <button class="upload-btn" onclick="document.getElementById('snackGalleryInput').click()">🖼️ 選擇照片</button>
            </div>
            <input type="file" id="snackGalleryInput" accept=".jpg,.jpeg,.png,.gif,.webp,image/jpeg,image/png,image/gif,image/webp" style="display:none;" onchange="handleImageUpload(event)">
            <div class="photo-tips">
                <strong>【拍攝提示】</strong><br>
                • 將食物放在碗、盤或杯中拍攝<br>
                • 確保光線充足，照片清晰<br>
                • 包裝食品請單獨拍攝營養成分表
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Submit snack details and finish
window.submitSnackDetails = function() {
    // Find the LAST time picker input (for handling multiple snacks in one session)
    const timePickerInputs = document.querySelectorAll('#snackTimePicker');
    const timePickerInput = timePickerInputs.length > 0 ? timePickerInputs[timePickerInputs.length - 1] : null;
    // Find the LAST snackName input (for handling multiple snacks in one session)
    const snackNameInputs = document.querySelectorAll('#snackName');
    const snackNameInput = snackNameInputs.length > 0 ? snackNameInputs[snackNameInputs.length - 1] : null;
    // Find the LAST snackAmount input (for handling multiple snacks in one session)
    const snackAmountInputs = document.querySelectorAll('#snackAmount');
    const snackAmountInput = snackAmountInputs.length > 0 ? snackAmountInputs[snackAmountInputs.length - 1] : null;
    
    const snackName = snackNameInput ? snackNameInput.value.trim() : '';
    const snackAmount = snackAmountInput ? snackAmountInput.value.trim() : '';
    
    if (!timePickerInput || !timePickerInput.value || !snackName || !snackAmount) {
        alert('請填寫所有詳細資訊');
        return;
    }
    
    // Get time from the time picker
    const snackTime = timePickerInput.value;
    
    // Store snack data
    mealData.mealTime = snackTime;
    mealData.snackName = snackName;
    mealData.snackAmount = snackAmount;
    
    currentRecordData.mealTime = snackTime;
    
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `
        <div class="message-content">
            進食時間：${snackTime}<br>
            食物名稱：${snackName}<br>
            估計分量：${snackAmount}
        </div>
    `;
    chatMessagesEl.appendChild(userMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    // Show summary bubble immediately after snack details
    if (summaryBubbleShown) return; // avoid duplicate summary bubbles
    summaryBubbleShown = true;
    // Generate unique ID suffix using timestamp to avoid duplicate IDs
    const uniqueId = Date.now();
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.setAttribute('data-summary-id', uniqueId);
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>記錄摘要：</strong><br><br>
            <strong>記錄日期：</strong>${getRecordDateLabel()}<br>
            <strong>餐次：</strong>
            <select id="editMealType_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                <option value="早餐" ${currentMealName === '早餐' ? 'selected' : ''}>早餐</option>
                <option value="上午加餐" ${currentMealName === '上午加餐' ? 'selected' : ''}>上午加餐</option>
                <option value="午餐" ${currentMealName === '午餐' ? 'selected' : ''}>午餐</option>
                <option value="下午加餐" ${currentMealName === '下午加餐' ? 'selected' : ''}>下午加餐</option>
                <option value="晚餐" ${currentMealName === '晚餐' ? 'selected' : ''}>晚餐</option>
                <option value="晚上加餐" ${currentMealName === '晚上加餐' ? 'selected' : ''}>晚上加餐</option>
            </select><br>
            <strong>加餐類型：</strong><input type="text" id="editSnackType_${uniqueId}" value="${snackType}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;"><br>
            <strong>已上傳照片：</strong>
            ${mealData.photos.map((photo, i) => `<br><img src="${photo}" alt="照片 ${i + 1}" class="uploaded-image" style="margin:8px 0;">`).join('')}<br>
            <strong>進食時間：</strong><div id="editSnackTimeContainer_${uniqueId}" style="display: inline-block;"></div><br>
            <strong>食物名稱：</strong><input type="text" id="editSnackName_${uniqueId}" value="${mealData.snackName}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;"><br>
            <strong>估計分量：</strong><input type="text" id="editSnackAmount_${uniqueId}" value="${mealData.snackAmount}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;"><br><br>
            <button class="submit-info-btn" onclick="finalizeRecord(${uniqueId})" style="margin-top:10px; width: 100%;">保存${currentMealName}記錄</button>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    // Generate and insert the time dropdowns for the snack summary immediately
    const timeDropdowns = generateTimeDropdowns(mealData.mealTime, `editSnackTime_${uniqueId}`);
    const container = document.getElementById(`editSnackTimeContainer_${uniqueId}`);
    if (container) {
        container.innerHTML = timeDropdowns.html;
    }
}

// Enable chat input and handle sending
function enableChatInput() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
}

// Validate food description format and find foods without amounts
function validateFoodAmounts(description) {
    const foodsWithoutAmount = [];
    
    // Split by spaces to get individual food items
    const items = description.trim().split(/\s+/);
    
    for (const item of items) {
        if (item.trim() === '') continue;
        
        // Check if the item contains a dash (food-amount format)
        if (!item.includes('-')) {
            // This food doesn't have an amount
            foodsWithoutAmount.push(item);
        }
    }
    
    return foodsWithoutAmount;
}

// Submit additional information
window.submitAdditionalInfo = function() {
    // Find the LAST mealTimePicker (for handling multiple meals in one session)
    const timePickerInputs = document.querySelectorAll('#mealTimePicker');
    const timePickerInput = timePickerInputs.length > 0 ? timePickerInputs[timePickerInputs.length - 1] : null;
    const location = document.querySelector('input[name="location"]:checked');
    const amount = document.querySelector('input[name="amount"]:checked');

    // If user already uploaded a photo and description, allow skipping this check
    if (!timePickerInput || !timePickerInput.value || !location || !amount) {
        if (mealData.photos && mealData.photos.length > 0 && mealData.descriptions && mealData.descriptions.length > 0) {
            // Skip to Step 4 (additional description)
            const botMsg = document.createElement('div');
            botMsg.className = 'bot-message';
            botMsg.innerHTML = `
                <div class="message-content">
                    <strong>第4步：如有需要，補充描述</strong><br>
                    <span class="step4-hint">（如果覺得照片無法完全體現，請簡單描述）</span>
                    <div class="more-photos-buttons" style="margin-top:8px;">
                        <button class="no-btn" onclick="skipStep4()">無</button>
                    </div>
                </div>
            `;
            chatMessagesEl.appendChild(botMsg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            enableStep4Input();
            return;
        } else {
            alert('請填寫所有必填資訊');
            return;
        }
    }
    
    // Construct time from the time picker
    const mealTime = timePickerInput.value;
    const locationLabel = location.value;
    const amountLabel = amount.value;
    
    // Save to BOTH mealData and currentRecordData to ensure persistence
    mealData.mealTime = mealTime;
    mealData.location = locationLabel;
    mealData.amount = amountLabel;
    
    currentRecordData.mealTime = mealTime;
    currentRecordData.location = locationLabel;
    currentRecordData.amount = amountLabel;
    
    // Create user response with the submitted info
    const userMsg = document.createElement('div');
    userMsg.className = 'user-message';
    userMsg.innerHTML = `
        <div class="message-content">
            用餐時間：${mealTime}<br>
            用餐地點：${locationLabel}<br>
            進食情況：${amountLabel}
        </div>
    `;
    chatMessagesEl.appendChild(userMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    
    // Show Step 4: Additional description as a question immediately
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>第4步：如有需要，補充描述</strong><br>
            <span class="step4-hint">（如果覺得照片無法完全體現，請簡單描述）</span>
            <div class="more-photos-buttons" style="margin-top:8px;">
                <button class="no-btn" onclick="skipStep4()">無</button>
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    // Enable chat input for user to answer
    enableStep4Input();
};

// Enable chat input for Step 4 answer
function enableStep4Input() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    step4Active = true;
    step4Temp.answered = false;
    
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.placeholder = '如無補充描述，可點擊發送或按回車鍵';
    chatInput.focus();
    
    // Attach temporary event listeners for Step 4
    step4Temp.handler = function() {
        if (step4Temp.answered) return;
        step4Temp.answered = true;
        const message = chatInput.value.trim();
        // Store additional description
        mealData.additionalDesc = message || '無';
        const userMsg = document.createElement('div');
        userMsg.className = 'user-message';
        userMsg.innerHTML = `
            <div class="message-content">
                ${message || '（無補充描述）'}
            </div>
        `;
        chatMessagesEl.appendChild(userMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        chatInput.value = '';
        chatInput.disabled = true;
        chatSend.disabled = true;
        chatInput.placeholder = '輸入訊息...';
        // Remove temporary event listeners
        chatSend.removeEventListener('click', step4Temp.handler);
        chatInput.removeEventListener('keypress', step4Temp.keyHandler);
        step4Active = false;
        // Show summary bubble immediately after Step 4
        if (summaryBubbleShown) return; // avoid duplicate summary bubbles
        summaryBubbleShown = true;
        // Generate unique ID suffix using timestamp
        const uniqueId = Date.now();
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.setAttribute('data-summary-id', uniqueId);
        botMsg.innerHTML = `
            <div class="message-content">
                <strong>記錄摘要：</strong><br><br>
                <strong>記錄日期：</strong>${getRecordDateLabel()}<br>
                <strong>餐次：</strong>
                <select id="editMealType_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                    <option value="早餐" ${currentMealName === '早餐' ? 'selected' : ''}>早餐</option>
                    <option value="上午加餐" ${currentMealName === '上午加餐' ? 'selected' : ''}>上午加餐</option>
                    <option value="午餐" ${currentMealName === '午餐' ? 'selected' : ''}>午餐</option>
                    <option value="下午加餐" ${currentMealName === '下午加餐' ? 'selected' : ''}>下午加餐</option>
                    <option value="晚餐" ${currentMealName === '晚餐' ? 'selected' : ''}>晚餐</option>
                    <option value="晚上加餐" ${currentMealName === '晚上加餐' ? 'selected' : ''}>晚上加餐</option>
                </select><br>
                <br><strong>已上傳照片及描述：</strong>
                ${mealData.photos.map((photo, i) => `
                    <div style="margin:8px 0;">
                        <img src="${photo}" alt="照片 ${i + 1}" class="uploaded-image">
                        <br><textarea id="desc${i}_${uniqueId}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; font-family: inherit; font-size: 12px;" rows="2">${mealData.descriptions[i]}</textarea>
                    </div>
                `).join('')}
                <strong>用餐時間：</strong><div id="editMealTimeContainer_${uniqueId}" style="display: inline-block;"></div><br>
                <strong>用餐地點：</strong>
                <select id="editLocation_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                    <option value="家" ${mealData.location === '家' ? 'selected' : ''}>家</option>
                    <option value="工作單位" ${mealData.location === '工作單位' ? 'selected' : ''}>工作單位</option>
                    <option value="餐廳/外賣" ${mealData.location === '餐廳/外賣' ? 'selected' : ''}>餐廳/外賣</option>
                    <option value="其他" ${mealData.location === '其他' ? 'selected' : ''}>其他</option>
                </select><br>
                <br><strong>進食情況：</strong>
                <select id="editAmount_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                    <option value="全部吃完" ${mealData.amount === '全部吃完' ? 'selected' : ''}>全部吃完</option>
                    <option value="剩餘一些" ${mealData.amount === '剩餘一些' ? 'selected' : ''}>剩餘一些</option>
                    <option value="只吃少量" ${mealData.amount === '只吃少量' ? 'selected' : ''}>只吃少量</option>
                </select><br>
                <br><strong>補充描述：</strong><textarea id="editAdditionalDesc_${uniqueId}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; font-family: inherit; font-size: 12px;" rows="2">${mealData.additionalDesc}</textarea><br><br>
                <button class="submit-info-btn" onclick="finalizeRecord(${uniqueId})" style="margin-top:10px; width: 100%;">保存${currentMealName}記錄</button>
            </div>
        `;
        chatMessagesEl.appendChild(botMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        // Generate and insert the time dropdowns for the main meal summary immediately
        const timeDropdowns = generateTimeDropdowns(mealData.mealTime, `editMealTime_${uniqueId}`);
        const container = document.getElementById(`editMealTimeContainer_${uniqueId}`);
        if (container) {
            container.innerHTML = timeDropdowns.html;
        }
    };
    // Attach listeners for this step only
    chatSend.addEventListener('click', step4Temp.handler);
    step4Temp.keyHandler = function(e) {
        if (e.key === 'Enter') {
            step4Temp.handler();
        }
    };
    chatInput.addEventListener('keypress', step4Temp.keyHandler);
}

// Handle sending chat messages
// Track pending amount questions
let pendingAmountQuestions = [];
let currentAmountQuestion = null;

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (step4Active) {
        return; // Suppress global handler during Step 4
    }
    
    if (message) {
        // If we're waiting for an amount answer
        if (currentAmountQuestion) {
            const amount = message;
            const foodName = currentAmountQuestion.foodName;
            const originalDesc = currentAmountQuestion.originalDesc;
            
            // Update the description with the amount
            const updatedDesc = originalDesc.replace(foodName, `${foodName}-${amount}`);
            mealData.descriptions[mealData.descriptions.length - 1] = updatedDesc;
            
            // Show user message
            const userMsg = document.createElement('div');
            userMsg.className = 'user-message';
            userMsg.innerHTML = `
                <div class="message-content">
                    ${amount}
                </div>
            `;
            chatMessagesEl.appendChild(userMsg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            
            // Clear input
            chatInput.value = '';
            
            // Check if there are more foods without amounts
            pendingAmountQuestions.shift();
            if (pendingAmountQuestions.length > 0) {
                currentAmountQuestion = pendingAmountQuestions[0];
                setTimeout(() => {
                    const botMsg = document.createElement('div');
                    botMsg.className = 'bot-message';
                    botMsg.innerHTML = `
                        <div class="message-content">
                            請問${currentAmountQuestion.foodName}吃了多少？
                        </div>
                    `;
                    chatMessagesEl.appendChild(botMsg);
                    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
                }, 300);
            } else {
                // All amounts collected, proceed to next step
                currentAmountQuestion = null;
                chatInput.disabled = true;
                document.getElementById('chatSend').disabled = true;
                setTimeout(() => {
                    askMorePhotos();
                }, 500);
            }
            return;
        }
        
        // Create user text message
        const userMsg = document.createElement('div');
        userMsg.className = 'user-message';
        userMsg.innerHTML = `
            <div class="message-content">
                ${message}
            </div>
        `;
        chatMessagesEl.appendChild(userMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        
        // Track description
        mealData.descriptions.push(message);
        
        // Validate if all foods have amounts
        const foodsWithoutAmount = validateFoodAmounts(message);
        
        if (foodsWithoutAmount.length > 0) {
            // Keep input enabled for amount questions
            chatInput.value = '';
            chatInput.disabled = false;
            document.getElementById('chatSend').disabled = false;
            
            // Ask for amounts one by one
            pendingAmountQuestions = foodsWithoutAmount.map(food => ({
                foodName: food,
                originalDesc: message
            }));
            currentAmountQuestion = pendingAmountQuestions[0];
            
            setTimeout(() => {
                const botMsg = document.createElement('div');
                botMsg.className = 'bot-message';
                botMsg.innerHTML = `
                    <div class="message-content">
                        請問${currentAmountQuestion.foodName}吃了多少？
                    </div>
                `;
                chatMessagesEl.appendChild(botMsg);
                chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            }, 300);
            return;
        }
        
        // Clear input and disable it
        chatInput.value = '';
        chatInput.disabled = true;
        document.getElementById('chatSend').disabled = true;
        
        // Ask if there are more photos instead of going to Step 3
        setTimeout(() => {
            askMorePhotos();
        }, 500);
    }
}

// Submit Step 4: Additional description
window.submitStep4 = function() {
    const additionalDesc = document.getElementById('additionalDesc').value.trim();
    
    if (additionalDesc) {
        // Create user response with additional description
        const userMsg = document.createElement('div');
        userMsg.className = 'user-message';
        userMsg.innerHTML = `
            <div class="message-content">
                ${additionalDesc}
            </div>
        `;
        chatMessagesEl.appendChild(userMsg);
    }
    
    // Show completion message
    setTimeout(() => {
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.innerHTML = `
            <div class="message-content">
                <strong>感謝您的填寫！</strong><br>
                您的記錄已成功提交。
            </div>
        `;
        chatMessagesEl.appendChild(botMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }, 300);
};

window.resetForm = function() {
    if (confirm('確定要重新開始嗎？所有填寫的資訊將被清除。')) {
        // Clear chat messages
        chatMessagesEl.innerHTML = '';
        
        // Reset personal info form
        document.getElementById('personalInfoForm').reset();
        document.getElementById('participantId').value = '';
        
        // Reset chat state variables
        userSelectionMsgEl = null;
        uploadPromptShown = false;
        cameraStream = null;
        currentFlow = 'main';
        snackType = null;
        currentMealName = '';
        recordedMeals = {}; // reset recorded meals for new day
        recordedMeals = {}; // reset recorded meals
        mealData = {
            photoCount: 0,
            photos: [],
            descriptions: [],
            mealTime: '',
            location: '',
            amount: '',
            additionalDesc: '',
            snackName: '',
            snackAmount: ''
        };
        
        // Reset chat input
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const resetBtn = document.getElementById('resetBtn');
        const actionButtons = document.getElementById('actionButtons');
        
        chatInput.disabled = true;
        chatSend.disabled = true;
        // Make sure input is visible
        chatInput.style.display = '';
        chatSend.style.display = '';
        if (resetBtn) resetBtn.style.display = '';
        if (actionButtons) actionButtons.style.display = 'none';
        
        // Show initial instructions again
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.innerHTML = `
            <div class="message-content">
                <strong>記錄流程</strong><br>
                Step 1：在左側頁面欄輸入您的基本資訊<br>
                Step 2：選擇餐次記錄卡片<br>
                Step 3：拍照上傳您的飲食圖片並給出簡單的文字描述
            </div>
        `;
        chatMessagesEl.appendChild(botMsg);
        
        const mealMsg = document.createElement('div');
        mealMsg.className = 'bot-message';
        mealMsg.innerHTML = `
            <div class="message-content">
                <strong>請選擇您要記錄的餐次：</strong>
                <div class="meal-options">
                    <button class="meal-option" data-value="breakfast"><strong>早餐</strong>（通常6:00-9:00）</button>
                    <button class="meal-option" data-value="snack_morning"><strong>上午加餐</strong>（9:00-11:00）</button>
                    <button class="meal-option" data-value="lunch"><strong>午餐</strong>（11:00-13:30）</button>
                    <button class="meal-option" data-value="snack_afternoon"><strong>下午加餐</strong>（14:00-17:00）</button>
                    <button class="meal-option" data-value="dinner"><strong>晚餐</strong>（17:00-20:00）</button>
                    <button class="meal-option" data-value="snack_night"><strong>晚上加餐</strong>（20:00-睡前）</button>
                </div>
                <div id="mealSelectionStatus" class="selection-status"></div>
            </div>
        `;
        chatMessagesEl.appendChild(mealMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        
        // Re-attach meal option listeners
        document.querySelectorAll('.meal-option').forEach((btn) => {
            btn.removeEventListener('click', handleMealOptionClick);
            btn.addEventListener('click', handleMealOptionClick);
        });
        // Re-attach reset button listener
        const resetBtn2 = document.getElementById('resetBtn');
        if (resetBtn2) {
            resetBtn2.removeEventListener('click', window.resetForm);
            resetBtn2.addEventListener('click', window.resetForm);
        }
    }
};

// Go to exercise tracking page (without clearing data)
window.goToExerciseTracking = function() {
    window.location.href = 'exercise.html';
};

// Start a new record (different from reset - keeps personal info and chat history)
window.startNewRecord = function() {
    // Reset chat state variables (but keep chat history)
    userSelectionMsgEl = null;
    uploadPromptShown = false;
    cameraStream = null;
    currentFlow = 'main';
    snackType = null;
    summaryBubbleShown = false;
    uploadPromptShown = false;
    currentMealName = '';
    currentRecordData = {
        mealTime: '',
        location: '',
        amount: ''
    };
    mealData = {
        photoCount: 0,
        photos: [],
        descriptions: [],
        mealTime: '',
        location: '',
        amount: '',
        additionalDesc: '',
        snackName: '',
        snackAmount: ''
    };
    
    // Reset chat input
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const resetBtn = document.getElementById('resetBtn');
    const actionButtons = document.getElementById('actionButtons');
    
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;
    // Restore normal input area visibility
    chatInput.style.display = '';
    chatSend.style.display = '';
    if (resetBtn) resetBtn.style.display = '';
    if (actionButtons) actionButtons.style.display = 'none';
    
    // Show meal selection directly (skip initial instructions)
    const mealMsg = document.createElement('div');
    mealMsg.className = 'bot-message';
    mealMsg.innerHTML = `
        <div class="message-content">
            <strong>請選擇您要記錄的餐次：</strong>
            <div class="meal-options">
                <button class="meal-option" data-value="breakfast"><strong>早餐</strong>（通常6:00-9:00）</button>
                <button class="meal-option" data-value="snack_morning"><strong>上午加餐</strong>（9:00-11:00）</button>
                <button class="meal-option" data-value="lunch"><strong>午餐</strong>（11:00-13:30）</button>
                <button class="meal-option" data-value="snack_afternoon"><strong>下午加餐</strong>（14:00-17:00）</button>
                <button class="meal-option" data-value="dinner"><strong>晚餐</strong>（17:00-20:00）</button>
                <button class="meal-option" data-value="snack_night"><strong>晚上加餐</strong>（20:00-睡前）</button>
            </div>
            <div id="mealSelectionStatus" class="selection-status"></div>
        </div>
    `;
    chatMessagesEl.appendChild(mealMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    
    // Re-attach meal option listeners
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.removeEventListener('click', handleMealOptionClick);
        btn.addEventListener('click', handleMealOptionClick);
    });
    // Re-attach reset button listener
    const resetBtn2 = document.getElementById('resetBtn');
    if (resetBtn2) {
        resetBtn2.removeEventListener('click', window.resetForm);
        resetBtn2.addEventListener('click', window.resetForm);
    }
};

// Start a new recording day (shows date selection first)
window.startNewDay = function() {
    // Reset all recorded meals for the new day
    recordedMeals = {};
    
    // Reset chat state variables
    userSelectionMsgEl = null;
    uploadPromptShown = false;
    cameraStream = null;
    currentFlow = 'main';
    snackType = null;
    summaryBubbleShown = false;
    uploadPromptShown = false;
    currentMealName = '';
    currentRecordData = {
        mealTime: '',
        location: '',
        amount: ''
    };
    mealData = {
        photoCount: 0,
        photos: [],
        descriptions: [],
        mealTime: '',
        location: '',
        amount: '',
        additionalDesc: '',
        snackName: '',
        snackAmount: ''
    };
    
    // Reset and unlock the date field for next day
    isDateLocked = false;
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect) {
        recordDateSelect.value = '';
        recordDateSelect.disabled = false;
    }
    // Clear all radio button selections
    document.querySelectorAll('input[name="recordDate"]').forEach(radio => {
        radio.checked = false;
    });
    
    // Reset chat input
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const resetBtn = document.getElementById('resetBtn');
    const actionButtons = document.getElementById('actionButtons');
    
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;
    // Restore normal input area visibility
    chatInput.style.display = '';
    chatSend.style.display = '';
    if (resetBtn) resetBtn.style.display = '';
    if (actionButtons) actionButtons.style.display = 'none';
    
    // Show date selection first
    const mealMsg = document.createElement('div');
    mealMsg.className = 'bot-message';
    mealMsg.innerHTML = `
        <div class="message-content">
            <strong>記錄日期：</strong><br>
            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px;">
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="recordDate" value="workday1" style="margin-right: 8px;">
                    <span>第一個工作日</span>
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="recordDate" value="workday2" style="margin-right: 8px;">
                    <span>第二個工作日</span>
                </label>
                <label style="display: flex; align-items: center; cursor: pointer;">
                    <input type="radio" name="recordDate" value="restday" style="margin-right: 8px;">
                    <span>第一個休息日</span>
                </label>
            </div>
            <button onclick="confirmDateSelection()" style="width: 100%; margin-top: 12px; padding: 8px; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;">確認</button>
        </div>
    `;
    chatMessagesEl.appendChild(mealMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
};

// Finish daily record - show detailed summary
window.finishDailyRecord = function() {
    const recordDateSelect = document.getElementById('recordDate');
    let dateLabel = '記錄';
    if (recordDateSelect) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        dateLabel = selectedOption.text;
    }
    
    // Define all meals
    const allMeals = [
        { id: 'breakfast', name: '早餐', time: '6:00-9:00' },
        { id: 'snack_morning', name: '上午加餐', time: '9:00-11:00' },
        { id: 'lunch', name: '午餐', time: '11:00-13:30' },
        { id: 'snack_afternoon', name: '下午加餐', time: '14:00-17:00' },
        { id: 'dinner', name: '晚餐', time: '18:00-20:00' },
        { id: 'snack_night', name: '晚上加餐', time: '20:00-睡前' }
    ];
    
    // Separate recorded and missing meals
    const recorded = allMeals.filter(m => recordedMeals[m.name]);
    const missing = allMeals.filter(m => !recordedMeals[m.name]);
    
    const totalMeals = allMeals.length;
    const recordedCount = recorded.length;
    const progressPercent = Math.round((recordedCount / totalMeals) * 100);
    
    // Build recorded meals list
    const recordedList = recorded.flatMap(meal => {
        const record = recordedMeals[meal.name];
        const isSnack = meal.id.includes('snack');
        
        if (Array.isArray(record)) {
            // Multiple snacks of this type
            return record.map(snack => {
                const time = snack.mealTime || snack.time || '';
                const amount = snack.snackAmount || snack.amount || '';
                return `•${meal.name}（${time}，${amount}）`;
            });
        } else if (record) {
            // Single meal or snack
            const time = record.mealTime || record.time || '';
            if (isSnack) {
                // For snacks, show estimated amount
                const amount = record.snackAmount || record.amount || '';
                return `•${meal.name}（${time}，${amount}）`;
            } else {
                // For main meals, show location
                const location = record.location || '';
                return `•${meal.name}（${time}，${location}）`;
            }
        }
        return [];
    }).join('<br>');
    
    // Build missing meals list
    const missingList = missing.map(meal => {
        return `•${meal.name}（通常${meal.time}）`;
    }).join('<br>');
    
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>${dateLabel}記錄完成情況</strong><br><br>
            
            <strong>已記錄餐次（${recordedCount}）：</strong><br>
            ${recordedList}<br><br>
            
            <strong>可能遅漏：</strong><br>
            ${missingList}<br><br>
            
            <strong>完成率：${progressPercent}%</strong><br>
            <div style="background: #ddd; border-radius: 10px; height: 20px; overflow: hidden; margin: 8px 0;">
                <div style="background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
            </div><br>
            
            <strong>溫骄提示：</strong><br>
            <em>建議您在睡前花 2 分鐘検查：</em><br>
            1. 是否記錄了所有吃喝的東西？<br>
            2. 每餐是否有拍摄照片？<br>
            3. 時間地點是否填寫？<br><br>
            
            <div class="action-buttons-container" style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="action-btn new-record-btn" onclick="supplementRecords()"> 立即補充記錄</button>
                <button class="action-btn finish-btn" onclick="continueNextDay()">明日繼續記錄</button>
            </div>
            <button class="action-btn" style="flex: 1; width: 100%; margin-top: 10px; background: #8b5cf6; color: white; padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold;" onclick="viewAllRecords()">查看我的記錄</button>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Save meal record with edited information
window.saveMealRecordWithEdits = function() {
    // Collect edited values for main meals
    const editMealType = document.getElementById('editMealType');
    // Find the LAST editMealTimePicker (for handling multiple meals in one session)
    const editMealTimePickerInputs = document.querySelectorAll('#editMealTimePicker');
    const editMealTimePicker = editMealTimePickerInputs.length > 0 ? editMealTimePickerInputs[editMealTimePickerInputs.length - 1] : null;
    const editLocation = document.getElementById('editLocation');
    const editAmount = document.getElementById('editAmount');
    const editAdditionalDesc = document.getElementById('editAdditionalDesc');
    const editSnackType = document.getElementById('editSnackType');
    // Find the LAST editSnackTimePicker (for handling multiple meals in one session)
    const editSnackTimePickerInputs = document.querySelectorAll('#editSnackTimePicker');
    const editSnackTimePicker = editSnackTimePickerInputs.length > 0 ? editSnackTimePickerInputs[editSnackTimePickerInputs.length - 1] : null;
    const editSnackName = document.getElementById('editSnackName');
    const editSnackAmount = document.getElementById('editSnackAmount');
    
    // Capture edited meal type as a local variable (do not update global currentMealName)
    let editedMealType = currentMealName;
    if (editMealType) {
        editedMealType = editMealType.value;
    }
    
    // Capture edited values directly from DOM inputs
    let finalData = { ...currentRecordData }; // Start with the recorded values from Step 3
    
    // Override with any user edits from the summary form
    // For main meals
    if (editMealTimePicker && editMealTimePicker.value) {
        finalData.mealTime = editMealTimePicker.value;
        mealData.mealTime = editMealTimePicker.value;
        if (editLocation) finalData.location = editLocation.value || finalData.location || '';
        if (editAmount) finalData.amount = editAmount.value || finalData.amount || '';
        // Update descriptions from textareas
        const finalDescriptions = [];
        for (let i = 0; i < mealData.descriptions.length; i++) {
            const descField = document.getElementById(`desc${i}`);
            if (descField) {
                finalDescriptions.push(descField.value);
            } else {
                finalDescriptions.push(mealData.descriptions[i]);
            }
        }
        mealData.descriptions = finalDescriptions;
    }
    // For snacks
    if (editSnackTimePicker && editSnackTimePicker.value) {
        snackType = editSnackType.value || snackType || '';
        finalData.mealTime = editSnackTimePicker.value;
        mealData.mealTime = editSnackTimePicker.value;
        if (editSnackName) mealData.snackName = editSnackName.value || mealData.snackName || '';
        if (editSnackAmount) mealData.snackAmount = editSnackAmount.value || mealData.snackAmount || '';
    }

    // Update additionalDesc separately
    const editAdditionalDescField = document.getElementById('editAdditionalDesc');
    if (editAdditionalDescField) {
        mealData.additionalDesc = editAdditionalDescField.value || mealData.additionalDesc || '';
    }

    // Prepare final override snapshot with all captured values
    pendingRecordOverride = {
        name: editedMealType,
        mealTime: finalData.mealTime || '不詳',
        location: finalData.location || mealData.snackName || '不詳',
        snackType: snackType || '',
        amount: finalData.amount || '',
        additionalDesc: mealData.additionalDesc || '',
        snackName: mealData.snackName || '',
        snackAmount: mealData.snackAmount || '',
        photoCount: mealData.photoCount || 0,
        photos: [...mealData.photos],
        descriptions: [...mealData.descriptions]
    };
    
    // Convert editable fields back to static text in the same bubble
    // Only replace textarea descriptions with static text if the fields exist
    const editDescFieldExists = document.getElementById('desc0');
    if (editDescFieldExists) {
        for (let i = 0; i < mealData.descriptions.length; i++) {
            const descField = document.getElementById(`desc${i}`);
            if (descField) {
                const parent = descField.parentElement;
                const textNode = document.createElement('div');
                textNode.style.margin = '8px 0';
                textNode.innerHTML = `描述：${mealData.descriptions[i]}`;
                parent.replaceChild(textNode, descField);
            }
        }
    }
    
    // Remove the save button
    const saveBtn = document.querySelector('[onclick="saveMealRecordWithEdits()"]');
    if (saveBtn) {
        saveBtn.remove();
    }
    
    // Scroll to show updated content
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    
    // Now proceed with the regular save flow after a short delay
    setTimeout(() => {
        saveMealRecord();
    }, 300);
};

// Update meal option buttons - disable main meals that have been recorded
function updateMealOptionButtons() {
    const mainMeals = ['早餐', '午餐', '晚餐'];
    document.querySelectorAll('.meal-option').forEach((btn) => {
        const mealValue = btn.getAttribute('data-value');
        // Check if this is a main meal that has been recorded
        if ((mealValue === 'breakfast' || mealValue === 'lunch' || mealValue === 'dinner')) {
            const label = btn.textContent.trim();
            const mealName = extractMealName(label);
            if (recordedMeals[mealName]) {
                // Disable this main meal button
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        }
        // Snack buttons (加餐) remain enabled - they can be done multiple times
    });
}

// Helper: clamp hour/minute strings to HH:mm within 24h
function normalizeTimeInputs(hourId, minId) {
    const normalizePart = (value, max) => {
        const num = parseInt(value, 10);
        if (Number.isNaN(num)) return '00';
        const bounded = Math.min(Math.max(num, 0), max);
        return String(bounded).padStart(2, '0');
    };
    const hourVal = document.getElementById(hourId)?.value;
    const minVal = document.getElementById(minId)?.value;
    const hour = normalizePart(hourVal, 23);
    const minute = normalizePart(minVal, 59);
    const hourEl = document.getElementById(hourId);
    const minEl = document.getElementById(minId);
    if (hourEl) hourEl.value = hour;
    if (minEl) minEl.value = minute;
    return { hour, minute };
}

// Helper: clamp an existing HH:mm string for display
function normalizeTimeString(currentTime) {
    const normalizePart = (value, max) => {
        const num = parseInt(value, 10);
        if (Number.isNaN(num)) return '00';
        const bounded = Math.min(Math.max(num, 0), max);
        return String(bounded).padStart(2, '0');
    };
    if (currentTime && currentTime.includes(':')) {
        const parts = currentTime.split(':');
        const hour = normalizePart(parts[0], 23);
        const minute = normalizePart(parts[1], 59);
        return { hour, minute };
    }
    return { hour: '00', minute: '00' };
}

// Helper function to generate hour and minute time picker (native HTML5 input type="time")
function generateTimeDropdowns(currentTime, idPrefix = '') {
    // Parse current time (format: "HH:mm") and clamp to valid range
    const { hour, minute } = normalizeTimeString(currentTime);
    const timeValue = `${hour}:${minute}`;
    
    const timeId = idPrefix ? `${idPrefix}Picker` : 'mealTimePicker';
    
    return {
        html: `
            <div style="display: flex; align-items: center; gap: 10px; margin-top: 8px;">
                <input id="${timeId}" type="time" value="${timeValue}" style="padding: 8px 12px; font-size: 16px; border: 1px solid #ccc; border-radius: 6px; cursor: pointer;">
            </div>
        `,
        getTime: () => {
            const timeInput = document.getElementById(timeId);
            return timeInput ? timeInput.value : timeValue;
        }
    };
}

// Save meal record and show confirmation
window.saveMealRecord = function() {
    // Only show confirmation after user edits and saves summary
    if (currentFlow !== 'main') {
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.innerHTML = `
            <div class="message-content">
                <strong>感謝您的填寫！</strong><br>
                ${currentMealName}記錄已成功保存。
            </div>
        `;
        chatMessagesEl.appendChild(botMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;

        // Hide chat input, send button, and reset button
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const resetBtn = document.getElementById('resetBtn');
        const actionButtons = document.getElementById('actionButtons');

        if (chatInput) chatInput.style.display = 'none';
        if (chatSend) chatSend.style.display = 'none';
        if (resetBtn) resetBtn.style.display = 'none';
        if (actionButtons) actionButtons.style.display = 'flex';
    }
    
    // Lock the date field after first meal is saved
    if (!isDateLocked) {
        isDateLocked = true;
        const recordDateSelect = document.getElementById('recordDate');
        if (recordDateSelect) {
            recordDateSelect.disabled = true;
        }
    }
    
    // Record this meal for daily summary (store before clearing currentMealName)
    const mealToRecord = currentMealName;
    
    // Use pendingRecordOverride if available (from edited summary), otherwise build from current mealData
    let recordToSave;
    if (pendingRecordOverride) {
        // User edited the summary, use those exact values
        recordToSave = { ...pendingRecordOverride };
        pendingRecordOverride = null;
    } else {
        // No edits, use current mealData values
        recordToSave = {
            name: mealToRecord,
            mealTime: mealData.mealTime || '不詳',
            location: (currentFlow === 'snack')
                ? (snackType || mealData.snackName || '不詳')
                : (mealData.location || '不詳'),
            snackType: snackType || '',
            amount: mealData.amount || '',
            additionalDesc: mealData.additionalDesc || '',
            snackName: mealData.snackName || '',
            snackAmount: mealData.snackAmount || '',
            photoCount: mealData.photoCount || 0,
            photos: [...mealData.photos],
            descriptions: [...mealData.descriptions]
        };
    }
    
    // For snacks, store as array; for main meals, store as single object
    if (currentFlow === 'snack') {
        if (!recordedMeals[mealToRecord]) {
            recordedMeals[mealToRecord] = [];
        } else if (!Array.isArray(recordedMeals[mealToRecord])) {
            // Convert existing single record to array if needed
            recordedMeals[mealToRecord] = [recordedMeals[mealToRecord]];
        }
        recordedMeals[mealToRecord].push(recordToSave);
    } else {
        recordedMeals[mealToRecord] = recordToSave;
    }
    
    // Update meal option buttons - disable main meals that have been recorded
    updateMealOptionButtons();

    // If this was a main meal, show the summary bubble with editable time input (only once)
    if (currentFlow === 'main' && currentMealName && !summaryBubbleShown) {
        summaryBubbleShown = true; // Set flag so we don't show this again
        // Clear current meal name and data after saving (prevents infinite summary loop)
        const mealNameForSummary = currentMealName;
        currentMealName = '';
        currentRecordData = {
            mealTime: '',
            location: '',
            amount: '',
            additionalDesc: '',
            snackName: '',
            snackAmount: '',
            photoCount: 0,
            photos: [],
            descriptions: []
        };
        // Show summary bubble for main meal
        // Generate unique ID suffix using timestamp
        const uniqueId = Date.now();
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.setAttribute('data-summary-id', uniqueId);
        botMsg.innerHTML = `
            <div class="message-content">
                <strong>記錄摘要：</strong><br><br>
                <strong>記錄日期：</strong>${getRecordDateLabel()}<br>
                <strong>餐次：</strong>
                <select id="editMealType_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                    <option value="早餐" ${mealNameForSummary === '早餐' ? 'selected' : ''}>早餐</option>
                    <option value="上午加餐" ${mealNameForSummary === '上午加餐' ? 'selected' : ''}>上午加餐</option>
                    <option value="午餐" ${mealNameForSummary === '午餐' ? 'selected' : ''}>午餐</option>
                    <option value="下午加餐" ${mealNameForSummary === '下午加餐' ? 'selected' : ''}>下午加餐</option>
                    <option value="晚餐" ${mealNameForSummary === '晚餐' ? 'selected' : ''}>晚餐</option>
                    <option value="晚上加餐" ${mealNameForSummary === '晚上加餐' ? 'selected' : ''}>晚上加餐</option>
                </select><br>
                <br><strong>已上傳照片及描述：</strong>
                ${mealData.photos.map((photo, i) => `
                    <div style="margin:8px 0;">
                        <img src="${photo}" alt="照片 ${i + 1}" class="uploaded-image">
                        <br><textarea id="desc${i}_${uniqueId}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; font-family: inherit; font-size: 12px;" rows="2">${mealData.descriptions[i]}</textarea>
                    </div>
                `).join('')}
                <strong>用餐時間：</strong><div id="editMealTimeContainer_${uniqueId}" style="display: inline-block;"></div><br>
                <strong>用餐地點：</strong>
                <select id="editLocation_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                    <option value="家" ${mealData.location === '家' ? 'selected' : ''}>家</option>
                    <option value="工作單位" ${mealData.location === '工作單位' ? 'selected' : ''}>工作單位</option>
                    <option value="餐廳/外賣" ${mealData.location === '餐廳/外賣' ? 'selected' : ''}>餐廳/外賣</option>
                    <option value="其他" ${mealData.location === '其他' ? 'selected' : ''}>其他</option>
                </select><br>
                <br><strong>進食情況：</strong>
                <select id="editAmount_${uniqueId}" style="padding: 5px; border: 1px solid #ccc; border-radius: 5px; width: 100%;">
                    <option value="全部吃完" ${mealData.amount === '全部吃完' ? 'selected' : ''}>全部吃完</option>
                    <option value="剩餘一些" ${mealData.amount === '剩餘一些' ? 'selected' : ''}>剩餘一些</option>
                    <option value="只吃少量" ${mealData.amount === '只吃少量' ? 'selected' : ''}>只吃少量</option>
                </select><br>
                <br><strong>補充描述：</strong><textarea id="editAdditionalDesc_${uniqueId}" style="width: 100%; padding: 5px; border: 1px solid #ccc; border-radius: 5px; font-family: inherit; font-size: 12px;" rows="2">${mealData.additionalDesc}</textarea><br><br>
                <button class="submit-info-btn" onclick="finalizeRecord(${uniqueId})" style="margin-top:10px; width: 100%;">保存${mealNameForSummary}記錄</button>
            </div>
        `;
        chatMessagesEl.appendChild(botMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        // Always generate and insert the time dropdowns for main meal summary
        const timeDropdowns = generateTimeDropdowns(mealData.mealTime, `editMealTime_${uniqueId}`);
        const container = document.getElementById(`editMealTimeContainer_${uniqueId}`);
        if (container) {
            container.innerHTML = timeDropdowns.html;
        }

        // Prevent repeated summary bubble
        currentFlow = '';
    }

    // Clear current meal name and data after saving
    currentMealName = '';
    currentRecordData = {
        mealTime: '',
        location: '',
        amount: ''
    };
    mealData = {
        photoCount: 0,
        photos: [],
        descriptions: [],
        mealTime: '',
        location: '',
        amount: '',
        additionalDesc: '',
        snackName: '',
        snackAmount: ''
    };
    // Reset flow state AFTER saving so snack details are retained
    currentFlow = 'main';
    snackType = null;
};

// Finalize the record and move to next action
window.finalizeRecord = function(uniqueId) {
    // Collect final edited values
    // Use unique ID to find the correct form elements
    const editMealType = uniqueId ? document.getElementById(`editMealType_${uniqueId}`) : document.querySelector('[id^="editMealType"]');
    const editMealTimePicker = uniqueId ? document.getElementById(`editMealTimePicker_${uniqueId}`) : document.querySelector('[id^="editMealTimePicker"]');
    const editMealTimeHour = document.getElementById('editMealTimeHour');
    const editMealTimeMin = document.getElementById('editMealTimeMin');
    const editLocation = uniqueId ? document.getElementById(`editLocation_${uniqueId}`) : document.querySelector('[id^="editLocation"]');
    const editAmount = uniqueId ? document.getElementById(`editAmount_${uniqueId}`) : document.querySelector('[id^="editAmount"]');
    const editAdditionalDesc = uniqueId ? document.getElementById(`editAdditionalDesc_${uniqueId}`) : document.querySelector('[id^="editAdditionalDesc"]');

    // Capture edited values directly from DOM inputs
    let finalData = { ...currentRecordData };

    // Update from editable fields
    if (editMealTimePicker) {
        // HTML5 time input
        finalData.mealTime = editMealTimePicker.value || finalData.mealTime;
        mealData.mealTime = editMealTimePicker.value || finalData.mealTime;
    } else if (editMealTimeHour && editMealTimeMin) {
        // Fallback to old format if needed
        const { hour: editHour, minute: editMinute } = normalizeTimeInputs('editMealTimeHour', 'editMealTimeMin');
        finalData.mealTime = `${editHour}:${editMinute}`;
        mealData.mealTime = `${editHour}:${editMinute}`;
    }
    if (editLocation) finalData.location = editLocation.value || finalData.location || '';
    if (editAmount) finalData.amount = editAmount.value || finalData.amount || '';
    
    // Update descriptions from textareas
    const finalDescriptions = [];
    for (let i = 0; i < mealData.descriptions.length; i++) {
        // Try with unique ID first, then fallback to old ID
        const descField = uniqueId ? document.getElementById(`desc${i}_${uniqueId}`) : document.getElementById(`desc${i}`);
        if (descField) {
            finalDescriptions.push(descField.value);
        } else {
            finalDescriptions.push(mealData.descriptions[i]);
        }
    }
    mealData.descriptions = finalDescriptions;

    if (editAdditionalDesc) {
        mealData.additionalDesc = editAdditionalDesc.value || mealData.additionalDesc || '';
    }

    // Update the recorded meal with final edits (always save, even if not previously recorded)
    const mealToRecord = editMealType ? editMealType.value : currentMealName;
    
    // Handle snacks differently (they can be multiple and have different fields)
    if (currentFlow === 'snack') {
        // For snacks, get snack-specific values using unique ID
        const editSnackType = uniqueId ? document.getElementById(`editSnackType_${uniqueId}`) : document.querySelector('[id^="editSnackType"]');
        const editSnackName = uniqueId ? document.getElementById(`editSnackName_${uniqueId}`) : document.querySelector('[id^="editSnackName"]');
        const editSnackAmount = uniqueId ? document.getElementById(`editSnackAmount_${uniqueId}`) : document.querySelector('[id^="editSnackAmount"]');
        const editSnackTimePicker = uniqueId ? document.getElementById(`editSnackTimePicker_${uniqueId}`) : document.querySelector('[id^="editSnackTimePicker"]');
        
        if (editSnackTimePicker && editSnackTimePicker.value) {
            finalData.mealTime = editSnackTimePicker.value;
            mealData.mealTime = editSnackTimePicker.value;
        }
        
        const snackRecord = {
            name: mealToRecord,
            mealTime: finalData.mealTime || mealData.mealTime || '不詳',
            location: editSnackType ? editSnackType.value : (snackType || mealData.snackName || '不詳'),
            snackType: editSnackType ? editSnackType.value : (snackType || ''),
            amount: mealData.amount || '',
            additionalDesc: mealData.additionalDesc || '',
            snackName: editSnackName ? editSnackName.value : (mealData.snackName || ''),
            snackAmount: editSnackAmount ? editSnackAmount.value : (mealData.snackAmount || ''),
            photoCount: mealData.photoCount || 0,
            photos: [...mealData.photos],
            descriptions: [...mealData.descriptions]
        };
        
        // Store snack as array
        if (!recordedMeals[mealToRecord]) {
            recordedMeals[mealToRecord] = [];
        } else if (!Array.isArray(recordedMeals[mealToRecord])) {
            recordedMeals[mealToRecord] = [recordedMeals[mealToRecord]];
        }
        recordedMeals[mealToRecord].push(snackRecord);
    } else {
        // For main meals
        recordedMeals[mealToRecord] = {
            name: mealToRecord,
            mealTime: finalData.mealTime || '不詳',
            location: finalData.location || '不詳',
            amount: finalData.amount || '',
            additionalDesc: mealData.additionalDesc || '',
            photoCount: mealData.photoCount || 0,
            photos: [...mealData.photos],
            descriptions: [...mealData.descriptions]
        };
    }

    // Keep the summary bubble visible (don't remove it)

    // Reset flags and data
    summaryBubbleShown = false;
    currentMealName = '';
    currentRecordData = {
        mealTime: '',
        location: '',
        amount: ''
    };
    mealData = {
        photoCount: 0,
        photos: [],
        descriptions: [],
        mealTime: '',
        location: '',
        amount: '',
        additionalDesc: '',
        snackName: '',
        snackAmount: ''
    };
    currentFlow = 'main';
    snackType = null;

    // Show success message
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>感謝您的填寫！</strong><br>
            ${mealToRecord}記錄已成功保存。
            <div style="display: flex; gap: 10px; margin-top: 12px;">
                <button class="action-btn new-record-btn" onclick="startNewRecord()" style="flex: 1; padding: 10px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); color: white;">繼續記錄其他餐次</button>
                <button class="action-btn finish-btn" onclick="finishDailyRecord()" style="flex: 1; padding: 10px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; background-color: #6b7280; color: white;">完成今日飲食記錄</button>
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    
    // Update the records summary bubble if it exists
    setTimeout(() => {
        window.updateRecordsSummary();
    }, 100);

    // Re-enable meal selection buttons for next meal
    document.querySelectorAll('.meal-option').forEach((btn) => {
        const dataValue = btn.getAttribute('data-value');
        const label = btn.textContent.trim();
        const mealName = extractMealName(label);
        
        // Only disable main meals that have been recorded
        if ((dataValue === 'breakfast' || dataValue === 'lunch' || dataValue === 'dinner') && recordedMeals[mealName]) {
            btn.disabled = true;
            btn.classList.add('disabled');
        } else {
            btn.disabled = false;
            btn.classList.remove('disabled', 'selected');
        }
    });
};

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
    
    // Reset for new day
    recordedMeals = {}; // Clear recorded meals
    uploadPromptShown = false;
    
    // Re-enable all meal option buttons for the new day
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove('disabled');
    });
    
    // Unlock the date field for next day
    isDateLocked = false;
    if (recordDateSelect) {
        recordDateSelect.disabled = false;
    }
    
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>感謝您的記錄！</strong><br>
            ${today}記錄已保存。<br><br>
            <div class="action-buttons-container" style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="action-btn new-record-btn" onclick="startNewDay()">開始新的記錄日</button>
                <button class="action-btn" style="background: #8b5cf6; color: white;" onclick="viewAllRecords()">查看我的記錄</button>
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// View all records
window.viewAllRecords = function() {
    // Count workdays and rest days
    let workdayCount = 0;
    let restdayCount = 0;
    
    // Count from allDailyRecords (completed days)
    for (const date in allDailyRecords) {
        if (date.includes('工作日')) workdayCount++;
        else if (date.includes('休息日')) restdayCount++;
    }
    
    // Also count current day if there are recorded meals and it hasn't been saved yet
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect && recordDateSelect.value && Object.keys(recordedMeals).length > 0) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
        // Check if current day is already in allDailyRecords
        let isCurrentDayRecorded = false;
        for (const date in allDailyRecords) {
            if (date === currentDateLabel) {
                isCurrentDayRecorded = true;
                break;
            }
        }
        
        // If not recorded yet, count the current day
        if (!isCurrentDayRecorded) {
            if (currentDateLabel.includes('工作日')) workdayCount++;
            else if (currentDateLabel.includes('休息日')) restdayCount++;
        }
    }
    
    // Count each meal type from both allDailyRecords and current recordedMeals
    const mealCounts = {
        '早餐': 0,
        '午餐': 0,
        '晚餐': 0
    };
    
    let totalPhotos = 0;
    
    // Count from all daily records
    for (const date in allDailyRecords) {
        const meals = allDailyRecords[date];
        for (const mealName in meals) {
            const record = meals[mealName];
            
            if (Array.isArray(record)) {
                for (const item of record) {
                    totalPhotos += item.photoCount || 0;
                }
            } else if (record) {
                totalPhotos += record.photoCount || 0;
                
                if (mealName === '早餐') {
                    mealCounts['早餐']++;
                } else if (mealName === '午餐') {
                    mealCounts['午餐']++;
                } else if (mealName === '晚餐') {
                    mealCounts['晚餐']++;
                }
            }
        }
    }
    
    // Also count from current recordedMeals
    for (const mealName in recordedMeals) {
        const record = recordedMeals[mealName];
        
        if (Array.isArray(record)) {
            for (const snack of record) {
                totalPhotos += snack.photoCount || 0;
            }
        } else if (record) {
            totalPhotos += record.photoCount || 0;
            
            if (mealName === '早餐') {
                mealCounts['早餐']++;
            } else if (mealName === '午餐') {
                mealCounts['午餐']++;
            } else if (mealName === '晚餐') {
                mealCounts['晚餐']++;
            }
        }
    }
    
    // Build meal count string
    const mealCountStr = `早餐×${mealCounts['早餐']}，午餐×${mealCounts['午餐']}，晚餐×${mealCounts['晚餐']}`;
    
    // Get the number of recorded days
    let recordedDaysCount = Object.keys(allDailyRecords).length;
    if (Object.keys(recordedMeals).length > 0 && recordDateSelect && recordDateSelect.value) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
        // Check if current day is already in allDailyRecords
        let isCurrentDayRecorded = false;
        for (const date in allDailyRecords) {
            if (date === currentDateLabel) {
                isCurrentDayRecorded = true;
                break;
            }
        }
        
        if (!isCurrentDayRecorded) {
            recordedDaysCount++;
        }
    }
    
    
    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';
    botMsg.id = 'recordsSummaryBubble';
    botMsg.innerHTML = `
        <div class="message-content">
            <strong>恭喜！完成${recordedDaysCount}天記錄</strong><br><br>
            
            <strong>記錄週期：</strong>${workdayCount}個工作日+${restdayCount}個休息日<br>
            <strong>完整餐次：</strong>${mealCountStr}<br>
            <strong>上傳照片：</strong>${totalPhotos}張<br><br>
            
            <strong>非常感謝您的認真配合！您的記錄對我們非常重要。</strong><br><br>
            
            <div class="action-buttons-container" style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="action-btn" onclick="supplementRecords()" style="flex: 1; padding: 10px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); color: white;">立即補充記錄</button>
                <button class="action-btn" onclick="startNewDay()" style="flex: 1; padding: 10px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; background-color: #6b7280; color: white;">明日繼續記錄</button>
            </div>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Function to update the records summary bubble with new data
window.updateRecordsSummary = function() {
    const summaryBubble = document.getElementById('recordsSummaryBubble');
    if (!summaryBubble) return; // Bubble doesn't exist yet
    
    // Count workdays and rest days
    let workdayCount = 0;
    let restdayCount = 0;
    
    // Count from allDailyRecords (completed days)
    for (const date in allDailyRecords) {
        if (date.includes('工作日')) workdayCount++;
        else if (date.includes('休息日')) restdayCount++;
    }
    
    // Also count current day if there are recorded meals and it hasn't been saved yet
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect && recordDateSelect.value && Object.keys(recordedMeals).length > 0) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
        // Check if current day is already in allDailyRecords
        let isCurrentDayRecorded = false;
        for (const date in allDailyRecords) {
            if (date === currentDateLabel) {
                isCurrentDayRecorded = true;
                break;
            }
        }
        
        // If not recorded yet, count the current day
        if (!isCurrentDayRecorded) {
            if (currentDateLabel.includes('工作日')) workdayCount++;
            else if (currentDateLabel.includes('休息日')) restdayCount++;
        }
    }
    
    // Count each meal type from both allDailyRecords and current recordedMeals
    const mealCounts = {
        '早餐': 0,
        '午餐': 0,
        '晚餐': 0
    };
    
    let totalPhotos = 0;
    
    // Count from all daily records
    for (const date in allDailyRecords) {
        const meals = allDailyRecords[date];
        for (const mealName in meals) {
            const record = meals[mealName];
            
            if (Array.isArray(record)) {
                for (const item of record) {
                    totalPhotos += item.photoCount || 0;
                }
            } else if (record) {
                totalPhotos += record.photoCount || 0;
                
                if (mealName === '早餐') {
                    mealCounts['早餐']++;
                } else if (mealName === '午餐') {
                    mealCounts['午餐']++;
                } else if (mealName === '晚餐') {
                    mealCounts['晚餐']++;
                }
            }
        }
    }
    
    // Also count from current recordedMeals
    for (const mealName in recordedMeals) {
        const record = recordedMeals[mealName];
        
        if (Array.isArray(record)) {
            for (const snack of record) {
                totalPhotos += snack.photoCount || 0;
            }
        } else if (record) {
            totalPhotos += record.photoCount || 0;
            
            if (mealName === '早餐') {
                mealCounts['早餐']++;
            } else if (mealName === '午餐') {
                mealCounts['午餐']++;
            } else if (mealName === '晚餐') {
                mealCounts['晚餐']++;
            }
        }
    }
    
    // Build meal count string
    const mealCountStr = `早餐×${mealCounts['早餐']}，午餐×${mealCounts['午餐']}，晚餐×${mealCounts['晚餐']}`;
    
    // Get the number of recorded days
    let recordedDaysCount = Object.keys(allDailyRecords).length;
    if (Object.keys(recordedMeals).length > 0 && recordDateSelect && recordDateSelect.value) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
        // Check if current day is already in allDailyRecords
        let isCurrentDayRecorded = false;
        for (const date in allDailyRecords) {
            if (date === currentDateLabel) {
                isCurrentDayRecorded = true;
                break;
            }
        }
        
        if (!isCurrentDayRecorded) {
            recordedDaysCount++;
        }
    }
    
    // Update the bubble content
    summaryBubble.querySelector('.message-content').innerHTML = `
        <strong>恭喜！完成${recordedDaysCount}天記錄</strong><br><br>
        
        <strong>記錄週期：</strong>${workdayCount}個工作日+${restdayCount}個休息日<br>
        <strong>完整餐次：</strong>${mealCountStr}<br>
        <strong>上傳照片：</strong>${totalPhotos}張<br><br>
        
        <strong>非常感謝您的認真配合！您的記錄對我們非常重要。</strong><br><br>
        
        <div class="action-buttons-container" style="display: flex; gap: 10px; margin-top: 15px;">
            <button class="action-btn" onclick="supplementRecords()" style="flex: 1; padding: 10px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); color: white;">立即補充記錄</button>
            <button class="action-btn" onclick="startNewDay()" style="flex: 1; padding: 10px 12px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold; background-color: #6b7280; color: white;">明日繼續記錄</button>
        </div>
    `;
}

// Supplement records (add more meals for current day)
window.supplementRecords = function() {
    window.startNewRecord();
}
