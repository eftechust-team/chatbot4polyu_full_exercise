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
        }
    }, 100);
}

// Returns the label for the currently selected record date
function getRecordDateLabel() {
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        return selectedOption ? selectedOption.text : recordDateSelect.value;
    }
    // Fallback: check radio buttons
    const recordDateRadio = document.querySelector('input[name="recordDate"]:checked');
    if (recordDateRadio) {
        const label = recordDateRadio.parentElement.textContent.trim();
        return label;
    }
    return '';
}

// FAQ Modal functionality
const modal = document.getElementById('faqModal');
const helpBtn = document.getElementById('helpBtn');
const closeBtn = document.querySelector('.close');

if (helpBtn) {
    helpBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'block';
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', () => {
        if (modal) modal.style.display = 'none';
    });
}

window.addEventListener('click', (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Global state variables
let chatMessagesEl, selectionStatusEl;
let userSelectionMsgEl = null;
let uploadPromptShown = false;
let step4Active = false;
let step4Temp = { answered: false, handler: null, keyHandler: null };
let currentFlow = 'main';
let snackType = null;
let currentMealName = '';
let recordedMeals = {};
let allDailyRecords = {};
let summaryBubbleShown = false;
let isDateLocked = false;
let pendingRecordOverride = null;
let currentRecordData = {
    mealTime: '',
    location: '',
    amount: ''
};
let mealData = {
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
let pendingAmountQuestions = [];
let currentAmountQuestion = null;
let cameraStream = null;

// Initialize on DOM ready
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

    // Attach chat send listeners
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
    
    // Create or update the hidden select element
    let selectElement = document.getElementById('recordDate');
    if (!selectElement) {
        selectElement = document.createElement('select');
        selectElement.id = 'recordDate';
        selectElement.name = 'recordDate';
        selectElement.style.display = 'none';
        
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
    
    selectElement.value = selectedDate.value;
    showMealOptionsAfterDateSelection();
};

// Show meal options after date selection
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
    
    selectionStatusEl = document.getElementById('mealSelectionStatus');
    
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.addEventListener('click', handleMealOptionClick);
    });
}

// Handle meal option button click
function handleMealOptionClick(e) {
    const btn = e.currentTarget || this;
    
    if (btn.disabled || btn.classList.contains('disabled')) {
        return;
    }
    
    const recordDateSelect = document.getElementById('recordDate');
    if (!recordDateSelect || !recordDateSelect.value) {
        alert('請先選擇記錄日期！');
        return;
    }
    
    document.querySelectorAll('.meal-option').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    const label = btn.textContent.trim();
    const mealName = extractMealName(label);
    const mealValue = btn.getAttribute('data-value');
    
    const selectionStatusEl = document.getElementById('mealSelectionStatus');
    if (selectionStatusEl) selectionStatusEl.textContent = `已選擇餐次：${label}`;

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
    
    summaryBubbleShown = false;
    uploadPromptShown = false;

    if (mealValue === 'breakfast' || mealValue === 'lunch' || mealValue === 'dinner') {
        currentFlow = 'main';
        currentMealName = mealName;
        if (!uploadPromptShown) {
            setTimeout(() => showUploadPrompt(mealName), 500);
            uploadPromptShown = true;
        }
    } else {
        currentFlow = 'snack';
        currentMealName = mealName;
        setTimeout(() => startSnackFlow(), 300);
    }
    
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Extract meal name from label
function extractMealName(label) {
    const match = label.match(/^([^（]+)/);
    return match ? match[1] : label;
}

// Show upload prompt for main meals
function showUploadPrompt(mealName) {
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

// Show upload prompt without divider
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

// Camera functions
window.openCamera = async function() {
    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' },
            audio: false 
        });
        
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

// Handle image upload
window.handleImageUpload = function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const userMsg = document.createElement('div');
            userMsg.className = 'user-message';
            userMsg.innerHTML = `
                <div class="message-content">
                    <img src="${e.target.result}" alt="上傳的照片" class="uploaded-image">
                </div>
            `;
            chatMessagesEl.appendChild(userMsg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            
            mealData.photoCount++;
            mealData.photos.push(e.target.result);
            
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
                    
                    const timeDropdowns = generateTimeDropdowns(currentRecordData.mealTime, 'snackTime');
                    const containers = document.querySelectorAll('#snackTimeContainer');
                    const container = containers.length > 0 ? containers[containers.length - 1] : null;
                    if (container) {
                        container.innerHTML = timeDropdowns.html;
                    }
                }
            }, 500);
        };
        reader.readAsDataURL(file);
    }
};

// Start snack flow
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

// Submit snack type
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

// Show snack upload prompt
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

// Submit snack details
window.submitSnackDetails = function() {
    const timePickerInputs = document.querySelectorAll('#snackTimePicker');
    const timePickerInput = timePickerInputs.length > 0 ? timePickerInputs[timePickerInputs.length - 1] : null;
    const snackNameInputs = document.querySelectorAll('#snackName');
    const snackNameInput = snackNameInputs.length > 0 ? snackNameInputs[snackNameInputs.length - 1] : null;
    const snackAmountInputs = document.querySelectorAll('#snackAmount');
    const snackAmountInput = snackAmountInputs.length > 0 ? snackAmountInputs[snackAmountInputs.length - 1] : null;
    
    const snackName = snackNameInput ? snackNameInput.value.trim() : '';
    const snackAmount = snackAmountInput ? snackAmountInput.value.trim() : '';
    
    if (!timePickerInput || !timePickerInput.value || !snackName || !snackAmount) {
        alert('請填寫所有詳細資訊');
        return;
    }
    
    const snackTime = timePickerInput.value;
    
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
    
    if (summaryBubbleShown) return;
    summaryBubbleShown = true;
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
    
    const timeDropdowns = generateTimeDropdowns(mealData.mealTime, `editSnackTime_${uniqueId}`);
    const container = document.getElementById(`editSnackTimeContainer_${uniqueId}`);
    if (container) {
        container.innerHTML = timeDropdowns.html;
    }
}

// Enable chat input
function enableChatInput() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.focus();
}

// Validate food amounts
function validateFoodAmounts(description) {
    const foodsWithoutAmount = [];
    const items = description.trim().split(/\s+/);
    
    for (const item of items) {
        if (item.trim() === '') continue;
        if (!item.includes('-')) {
            foodsWithoutAmount.push(item);
        }
    }
    
    return foodsWithoutAmount;
}

// Submit additional information
window.submitAdditionalInfo = function() {
    const timePickerInputs = document.querySelectorAll('#mealTimePicker');
    const timePickerInput = timePickerInputs.length > 0 ? timePickerInputs[timePickerInputs.length - 1] : null;
    const location = document.querySelector('input[name="location"]:checked');
    const amount = document.querySelector('input[name="amount"]:checked');

    if (!timePickerInput || !timePickerInput.value || !location || !amount) {
        if (mealData.photos && mealData.photos.length > 0 && mealData.descriptions && mealData.descriptions.length > 0) {
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
    
    const mealTime = timePickerInput.value;
    const locationLabel = location.value;
    const amountLabel = amount.value;
    
    mealData.mealTime = mealTime;
    mealData.location = locationLabel;
    mealData.amount = amountLabel;
    
    currentRecordData.mealTime = mealTime;
    currentRecordData.location = locationLabel;
    currentRecordData.amount = amountLabel;
    
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
};

// Enable Step 4 input
function enableStep4Input() {
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    step4Active = true;
    step4Temp.answered = false;
    
    chatInput.disabled = false;
    chatSend.disabled = false;
    chatInput.placeholder = '如無補充描述，可點擊發送或按回車鍵';
    chatInput.focus();
    
    step4Temp.handler = function() {
        if (step4Temp.answered) return;
        step4Temp.answered = true;
        const message = chatInput.value.trim();
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
        chatSend.removeEventListener('click', step4Temp.handler);
        chatInput.removeEventListener('keypress', step4Temp.keyHandler);
        step4Active = false;
        
        if (summaryBubbleShown) return;
        summaryBubbleShown = true;
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
        
        const timeDropdowns = generateTimeDropdowns(mealData.mealTime, `editMealTime_${uniqueId}`);
        const container = document.getElementById(`editMealTimeContainer_${uniqueId}`);
        if (container) {
            container.innerHTML = timeDropdowns.html;
        }
    };
    
    chatSend.addEventListener('click', step4Temp.handler);
    step4Temp.keyHandler = function(e) {
        if (e.key === 'Enter') {
            step4Temp.handler();
        }
    };
    chatInput.addEventListener('keypress', step4Temp.keyHandler);
}

// Send chat message
function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    const message = chatInput.value.trim();
    if (step4Active) {
        return;
    }
    
    if (message) {
        if (currentAmountQuestion) {
            const amount = message;
            const foodName = currentAmountQuestion.foodName;
            const originalDesc = currentAmountQuestion.originalDesc;
            
            const updatedDesc = originalDesc.replace(foodName, `${foodName}-${amount}`);
            mealData.descriptions[mealData.descriptions.length - 1] = updatedDesc;
            
            const userMsg = document.createElement('div');
            userMsg.className = 'user-message';
            userMsg.innerHTML = `
                <div class="message-content">
                    ${amount}
                </div>
            `;
            chatMessagesEl.appendChild(userMsg);
            chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
            
            chatInput.value = '';
            
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
                currentAmountQuestion = null;
                chatInput.disabled = true;
                document.getElementById('chatSend').disabled = true;
                setTimeout(() => {
                    askMorePhotos();
                }, 500);
            }
            return;
        }
        
        const userMsg = document.createElement('div');
        userMsg.className = 'user-message';
        userMsg.innerHTML = `
            <div class="message-content">
                ${message}
            </div>
        `;
        chatMessagesEl.appendChild(userMsg);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
        
        mealData.descriptions.push(message);
        
        const foodsWithoutAmount = validateFoodAmounts(message);
        
        if (foodsWithoutAmount.length > 0) {
            chatInput.value = '';
            chatInput.disabled = false;
            document.getElementById('chatSend').disabled = false;
            
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
        
        chatInput.value = '';
        chatInput.disabled = true;
        document.getElementById('chatSend').disabled = true;
        
        setTimeout(() => {
            askMorePhotos();
        }, 500);
    }
}

// Reset form
window.resetForm = function() {
    if (confirm('確定要重新開始嗎？所有填寫的資訊將被清除。')) {
        chatMessagesEl.innerHTML = '';
        
        userSelectionMsgEl = null;
        uploadPromptShown = false;
        cameraStream = null;
        currentFlow = 'main';
        snackType = null;
        currentMealName = '';
        recordedMeals = {};
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
        
        const chatInput = document.getElementById('chatInput');
        const chatSend = document.getElementById('chatSend');
        const resetBtn = document.getElementById('resetBtn');
        const actionButtons = document.getElementById('actionButtons');
        
        chatInput.disabled = true;
        chatSend.disabled = true;
        chatInput.style.display = '';
        chatSend.style.display = '';
        if (resetBtn) resetBtn.style.display = '';
        if (actionButtons) actionButtons.style.display = 'none';
        
        const botMsg = document.createElement('div');
        botMsg.className = 'bot-message';
        botMsg.innerHTML = `
            <div class="message-content">
                <strong>記錄流程</strong><br>
                Step 1：選擇記錄日期<br>
                Step 2：選擇餐次記錄卡片<br>
                Step 3：拍照上傳您的飲食圖片並給出簡單的文字描述
            </div>
        `;
        chatMessagesEl.appendChild(botMsg);
        
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
        
        document.querySelectorAll('.meal-option').forEach((btn) => {
            btn.removeEventListener('click', handleMealOptionClick);
            btn.addEventListener('click', handleMealOptionClick);
        });
    }
};

// Start new record
window.startNewRecord = function() {
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
    
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const resetBtn = document.getElementById('resetBtn');
    const actionButtons = document.getElementById('actionButtons');
    
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;
    chatInput.style.display = '';
    chatSend.style.display = '';
    if (resetBtn) resetBtn.style.display = '';
    if (actionButtons) actionButtons.style.display = 'none';
    
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
    
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.removeEventListener('click', handleMealOptionClick);
        btn.addEventListener('click', handleMealOptionClick);
    });
};

// Start new day
window.startNewDay = function() {
    recordedMeals = {};
    
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
    
    isDateLocked = false;
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect) {
        recordDateSelect.value = '';
        recordDateSelect.disabled = false;
    }
    document.querySelectorAll('input[name="recordDate"]').forEach(radio => {
        radio.checked = false;
    });
    
    const chatInput = document.getElementById('chatInput');
    const chatSend = document.getElementById('chatSend');
    const resetBtn = document.getElementById('resetBtn');
    const actionButtons = document.getElementById('actionButtons');
    
    chatInput.value = '';
    chatInput.disabled = true;
    chatSend.disabled = true;
    chatInput.style.display = '';
    chatSend.style.display = '';
    if (resetBtn) resetBtn.style.display = '';
    if (actionButtons) actionButtons.style.display = 'none';
    
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

// Update meal option buttons
function updateMealOptionButtons() {
    const mainMeals = ['早餐', '午餐', '晚餐'];
    document.querySelectorAll('.meal-option').forEach((btn) => {
        const mealValue = btn.getAttribute('data-value');
        if ((mealValue === 'breakfast' || mealValue === 'lunch' || mealValue === 'dinner')) {
            const label = btn.textContent.trim();
            const mealName = extractMealName(label);
            if (recordedMeals[mealName]) {
                btn.disabled = true;
                btn.classList.add('disabled');
            }
        }
    });
}

// Generate time dropdowns (HTML5 time input)
function generateTimeDropdowns(currentTime, idPrefix = '') {
    const normalizeTimeString = (timeStr) => {
        if (timeStr && timeStr.includes(':')) {
            const parts = timeStr.split(':');
            const hour = Math.min(Math.max(parseInt(parts[0], 10) || 0, 0), 23).toString().padStart(2, '0');
            const minute = Math.min(Math.max(parseInt(parts[1], 10) || 0, 0), 59).toString().padStart(2, '0');
            return `${hour}:${minute}`;
        }
        return '00:00';
    };
    
    const timeValue = normalizeTimeString(currentTime);
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

// Finalize record
window.finalizeRecord = function(uniqueId) {
    const editMealType = uniqueId ? document.getElementById(`editMealType_${uniqueId}`) : document.querySelector('[id^="editMealType"]');
    const editMealTimePicker = uniqueId ? document.getElementById(`editMealTimePicker_${uniqueId}`) : document.querySelector('[id^="editMealTimePicker"]');
    const editLocation = uniqueId ? document.getElementById(`editLocation_${uniqueId}`) : document.querySelector('[id^="editLocation"]');
    const editAmount = uniqueId ? document.getElementById(`editAmount_${uniqueId}`) : document.querySelector('[id^="editAmount"]');
    const editAdditionalDesc = uniqueId ? document.getElementById(`editAdditionalDesc_${uniqueId}`) : document.querySelector('[id^="editAdditionalDesc"]');

    let finalData = { ...currentRecordData };

    if (editMealTimePicker) {
        finalData.mealTime = editMealTimePicker.value || finalData.mealTime;
        mealData.mealTime = editMealTimePicker.value || finalData.mealTime;
    }
    if (editLocation) finalData.location = editLocation.value || finalData.location || '';
    if (editAmount) finalData.amount = editAmount.value || finalData.amount || '';
    
    const finalDescriptions = [];
    for (let i = 0; i < mealData.descriptions.length; i++) {
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

    const mealToRecord = editMealType ? editMealType.value : currentMealName;
    
    if (currentFlow === 'snack') {
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
        
        if (!recordedMeals[mealToRecord]) {
            recordedMeals[mealToRecord] = [];
        } else if (!Array.isArray(recordedMeals[mealToRecord])) {
            recordedMeals[mealToRecord] = [recordedMeals[mealToRecord]];
        }
        recordedMeals[mealToRecord].push(snackRecord);
    } else {
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
    
    setTimeout(() => {
        window.updateRecordsSummary();
    }, 100);

    document.querySelectorAll('.meal-option').forEach((btn) => {
        const dataValue = btn.getAttribute('data-value');
        const label = btn.textContent.trim();
        const mealName = extractMealName(label);
        
        if ((dataValue === 'breakfast' || dataValue === 'lunch' || dataValue === 'dinner') && recordedMeals[mealName]) {
            btn.disabled = true;
            btn.classList.add('disabled');
        } else {
            btn.disabled = false;
            btn.classList.remove('disabled', 'selected');
        }
    });
};

// Finish daily record
window.finishDailyRecord = function() {
    const recordDateSelect = document.getElementById('recordDate');
    let dateLabel = '記錄';
    if (recordDateSelect) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        dateLabel = selectedOption.text;
    }
    
    const allMeals = [
        { id: 'breakfast', name: '早餐', time: '6:00-9:00' },
        { id: 'snack_morning', name: '上午加餐', time: '9:00-11:00' },
        { id: 'lunch', name: '午餐', time: '11:00-13:30' },
        { id: 'snack_afternoon', name: '下午加餐', time: '14:00-17:00' },
        { id: 'dinner', name: '晚餐', time: '18:00-20:00' },
        { id: 'snack_night', name: '晚上加餐', time: '20:00-睡前' }
    ];
    
    const recorded = allMeals.filter(m => recordedMeals[m.name]);
    const missing = allMeals.filter(m => !recordedMeals[m.name]);
    
    const totalMeals = allMeals.length;
    const recordedCount = recorded.length;
    const progressPercent = Math.round((recordedCount / totalMeals) * 100);
    
    const recordedList = recorded.flatMap(meal => {
        const record = recordedMeals[meal.name];
        const isSnack = meal.id.includes('snack');
        
        if (Array.isArray(record)) {
            return record.map(snack => {
                const time = snack.mealTime || snack.time || '';
                const amount = snack.snackAmount || snack.amount || '';
                return `•${meal.name}（${time}，${amount}）`;
            });
        } else if (record) {
            const time = record.mealTime || record.time || '';
            if (isSnack) {
                const amount = record.snackAmount || record.amount || '';
                return `•${meal.name}（${time}，${amount}）`;
            } else {
                const location = record.location || '';
                return `•${meal.name}（${time}，${location}）`;
            }
        }
        return [];
    }).join('<br>');
    
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
            
            <strong>可能遺漏：</strong><br>
            ${missingList}<br><br>
            
            <strong>完成率：${progressPercent}%</strong><br>
            <div style="background: #ddd; border-radius: 10px; height: 20px; overflow: hidden; margin: 8px 0;">
                <div style="background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); height: 100%; width: ${progressPercent}%; transition: width 0.3s;"></div>
            </div><br>
            
            <strong>溫馨提示：</strong><br>
            <em>建議您在睡前花 2 分鐘檢查：</em><br>
            1. 是否記錄了所有吃喝的東西？<br>
            2. 每餐是否有拍攝照片？<br>
            3. 時間地點是否填寫？<br><br>
            
            <div class="action-buttons-container" style="display: flex; gap: 10px; margin-top: 15px;">
                <button class="action-btn new-record-btn" onclick="supplementRecords()">立即補充記錄</button>
                <button class="action-btn finish-btn" onclick="continueNextDay()">明日繼續記錄</button>
            </div>
            <button class="action-btn" style="flex: 1; width: 100%; margin-top: 10px; background: #8b5cf6; color: white; padding: 10px 20px; border: none; border-radius: 20px; cursor: pointer; font-size: 13px; font-weight: bold;" onclick="viewAllRecords()">查看我的記錄</button>
        </div>
    `;
    chatMessagesEl.appendChild(botMsg);
    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

// Continue to next day
window.continueNextDay = function() {
    const recordDateSelect = document.getElementById('recordDate');
    let dateLabel = '記錄';
    if (recordDateSelect) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        dateLabel = selectedOption.text;
    }
    
    const today = dateLabel;
    allDailyRecords[today] = { ...recordedMeals };
    
    recordedMeals = {};
    uploadPromptShown = false;
    
    document.querySelectorAll('.meal-option').forEach((btn) => {
        btn.disabled = false;
        btn.classList.remove('disabled');
    });
    
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
    let workdayCount = 0;
    let restdayCount = 0;
    
    for (const date in allDailyRecords) {
        if (date.includes('工作日')) workdayCount++;
        else if (date.includes('休息日')) restdayCount++;
    }
    
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect && recordDateSelect.value && Object.keys(recordedMeals).length > 0) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
        let isCurrentDayRecorded = false;
        for (const date in allDailyRecords) {
            if (date === currentDateLabel) {
                isCurrentDayRecorded = true;
                break;
            }
        }
        
        if (!isCurrentDayRecorded) {
            if (currentDateLabel.includes('工作日')) workdayCount++;
            else if (currentDateLabel.includes('休息日')) restdayCount++;
        }
    }
    
    const mealCounts = {
        '早餐': 0,
        '午餐': 0,
        '晚餐': 0
    };
    
    let totalPhotos = 0;
    
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
    
    const mealCountStr = `早餐×${mealCounts['早餐']}，午餐×${mealCounts['午餐']}，晚餐×${mealCounts['晚餐']}`;
    
    let recordedDaysCount = Object.keys(allDailyRecords).length;
    if (Object.keys(recordedMeals).length > 0 && recordDateSelect && recordDateSelect.value) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
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

// Update records summary
window.updateRecordsSummary = function() {
    const summaryBubble = document.getElementById('recordsSummaryBubble');
    if (!summaryBubble) return;
    
    let workdayCount = 0;
    let restdayCount = 0;
    
    for (const date in allDailyRecords) {
        if (date.includes('工作日')) workdayCount++;
        else if (date.includes('休息日')) restdayCount++;
    }
    
    const recordDateSelect = document.getElementById('recordDate');
    if (recordDateSelect && recordDateSelect.value && Object.keys(recordedMeals).length > 0) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
        let isCurrentDayRecorded = false;
        for (const date in allDailyRecords) {
            if (date === currentDateLabel) {
                isCurrentDayRecorded = true;
                break;
            }
        }
        
        if (!isCurrentDayRecorded) {
            if (currentDateLabel.includes('工作日')) workdayCount++;
            else if (currentDateLabel.includes('休息日')) restdayCount++;
        }
    }
    
    const mealCounts = {
        '早餐': 0,
        '午餐': 0,
        '晚餐': 0
    };
    
    let totalPhotos = 0;
    
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
    
    const mealCountStr = `早餐×${mealCounts['早餐']}，午餐×${mealCounts['午餐']}，晚餐×${mealCounts['晚餐']}`;
    
    let recordedDaysCount = Object.keys(allDailyRecords).length;
    if (Object.keys(recordedMeals).length > 0 && recordDateSelect && recordDateSelect.value) {
        const selectedOption = recordDateSelect.options[recordDateSelect.selectedIndex];
        const currentDateLabel = selectedOption.text;
        
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

// Supplement records
window.supplementRecords = function() {
    window.startNewRecord();
}

// API Functions for saving to database

// Save a single meal record to database
async function saveMealToDatabase(mealRecord, recordDate, recordDateLabel) {
    try {
        const photos = mealRecord.photos.map((photo, index) => ({
            photo_data: photo,
            description: mealRecord.descriptions[index] || ''
        }));

        const payload = {
            record_date: recordDate,
            record_date_label: recordDateLabel,
            meal_type: mealRecord.name,
            meal_time: mealRecord.mealTime || '',
            location: mealRecord.location || '',
            eating_amount: mealRecord.amount || '',
            additional_description: mealRecord.additionalDesc || '',
            is_snack: mealRecord.snackType ? true : false,
            snack_type: mealRecord.snackType || '',
            snack_name: mealRecord.snackName || '',
            snack_amount: mealRecord.snackAmount || '',
            photos: photos
        };

        const response = await fetch('/api/save-meal-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to save meal record:', result.message);
            return false;
        }
        
        console.log('Meal record saved successfully:', result);
        return true;
        
    } catch (error) {
        console.error('Error saving meal record:', error);
        return false;
    }
}

// Mark daily record as completed
async function completeDailyRecordInDatabase(recordDate) {
    try {
        const response = await fetch('/api/complete-daily-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_date: recordDate
            })
        });

        const result = await response.json();
        
        if (!result.success) {
            console.error('Failed to complete daily record:', result.message);
            return false;
        }
        
        console.log('Daily record marked as completed:', result);
        return true;
        
    } catch (error) {
        console.error('Error completing daily record:', error);
        return false;
    }
}

// Modified finalizeRecord function to save to database
const originalFinalizeRecord = window.finalizeRecord;
window.finalizeRecord = async function(uniqueId) {
    // Call original function first
    originalFinalizeRecord(uniqueId);
    
    // Get current record date info
    const recordDateSelect = document.getElementById('recordDate');
    if (!recordDateSelect || !recordDateSelect.value) {
        console.error('No record date selected');
        return;
    }
    
    const recordDate = recordDateSelect.value;
    const recordDateLabel = recordDateSelect.options[recordDateSelect.selectedIndex].text;
    
    // Get the meal record that was just finalized
    const editMealType = uniqueId ? document.getElementById(`editMealType_${uniqueId}`) : document.querySelector('[id^="editMealType"]');
    const mealToRecord = editMealType ? editMealType.value : currentMealName;
    
    // Get the finalized meal data from recordedMeals
    const mealRecord = recordedMeals[mealToRecord];
    
    if (!mealRecord) {
        console.error('No meal record found for:', mealToRecord);
        return;
    }
    
    // Handle array (snacks) or single record
    if (Array.isArray(mealRecord)) {
        // Save the last snack record added
        const lastSnack = mealRecord[mealRecord.length - 1];
        await saveMealToDatabase(lastSnack, recordDate, recordDateLabel);
    } else {
        // Save single meal record
        await saveMealToDatabase(mealRecord, recordDate, recordDateLabel);
    }
};

// Modified continueNextDay to mark daily record as completed
const originalContinueNextDay = window.continueNextDay;
window.continueNextDay = async function() {
    const recordDateSelect = document.getElementById('recordDate');
    
    if (recordDateSelect && recordDateSelect.value) {
        const recordDate = recordDateSelect.value;
        
        // Mark as completed in database
        await completeDailyRecordInDatabase(recordDate);
    }
    
    // Call original function
    originalContinueNextDay();
};