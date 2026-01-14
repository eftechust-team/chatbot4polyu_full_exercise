// Exercise tracking data structure
// exerciseRecords[date][quarter][timeSlot] = { type, intensity, description, timestamp }
let exerciseRecords = {};
let selectedExerciseDate = null;

let currentQuarter = null;
let currentTimeSlot = null;
let userInfo = {};

// Initialize quarters for a specific date
function initializeQuartersForDate(date) {
    if (!exerciseRecords[date]) {
        exerciseRecords[date] = {
            morning: {},      // 0:00-6:00
            afternoon: {},    // 6:00-12:00
            evening: {},      // 12:00-18:00
            night: {}         // 18:00-24:00
        };
    }
    return exerciseRecords[date];
}

// Quarter time ranges
const quarterConfig = {
    morning: { start: 0, end: 6 },
    afternoon: { start: 6, end: 12 },
    evening: { start: 12, end: 18 },
    night: { start: 18, end: 24 }
};

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Setup help button
    const helpBtn = document.getElementById('helpBtn');
    const faqModal = document.getElementById('faqModal');
    const closeBtn = document.querySelector('.close');
    
    if (helpBtn) {
        helpBtn.addEventListener('click', function() {
            faqModal.style.display = 'block';
        });
    }
    
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            faqModal.style.display = 'none';
        });
    }
    
    window.addEventListener('click', function(event) {
        if (event.target === faqModal) {
            faqModal.style.display = 'none';
        }
    });
    
    // Load saved user info if available
    loadUserInfo();
    
    // Auto-save user info when fields change
    ['name', 'participantId', 'age'].forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('change', function() {
                const userInfo = {
                    name: document.getElementById('name')?.value,
                    participantId: document.getElementById('participantId')?.value,
                    gender: document.querySelector('input[name="gender"]:checked')?.value,
                    age: document.getElementById('age')?.value
                };
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
            });
            element.addEventListener('blur', function() {
                const userInfo = {
                    name: document.getElementById('name')?.value,
                    participantId: document.getElementById('participantId')?.value,
                    gender: document.querySelector('input[name="gender"]:checked')?.value,
                    age: document.getElementById('age')?.value
                };
                localStorage.setItem('userInfo', JSON.stringify(userInfo));
            });
        }
    });
    
    // Auto-save gender selection
    document.querySelectorAll('input[name="gender"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const userInfo = {
                name: document.getElementById('name')?.value,
                participantId: document.getElementById('participantId')?.value,
                gender: document.querySelector('input[name="gender"]:checked')?.value,
                age: document.getElementById('age')?.value
            };
            localStorage.setItem('userInfo', JSON.stringify(userInfo));
        });
    });
    
    // Auto-save date selection
    document.querySelectorAll('input[name="exerciseRecordDate"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const selectedDate = this.value;
            localStorage.setItem('selectedRecordDate', selectedDate);
        });
    });
    
    // Load exercise records from localStorage
    const savedExerciseRecords = localStorage.getItem('exerciseRecords');
    if (savedExerciseRecords) {
        try {
            exerciseRecords = JSON.parse(savedExerciseRecords);
        } catch (e) {
            console.error('Error loading exercise records:', e);
            exerciseRecords = {};
        }
    }
    
    // Initialize time slots for all quarters (but they will be hidden until date is selected)
    initializeTimeSlots();
    
    // Add event listener for activity level change in modal
    const activityLevelSelect = document.getElementById('activityLevel');
    if (activityLevelSelect) {
        activityLevelSelect.addEventListener('change', function() {
            const reasonGroup = document.getElementById('reasonGroup');
            if (this.value && this.value !== '平常') {
                reasonGroup.style.display = 'block';
            } else {
                reasonGroup.style.display = 'none';
            }
        });
    }
    
    // Add event listener for exercise type change to hide/show intensity
    const exerciseTypeSelect = document.getElementById('exerciseType');
    if (exerciseTypeSelect) {
        exerciseTypeSelect.addEventListener('change', function() {
            const intensityGroup = document.querySelector('.exercise-form-group:has(#exerciseIntensity)');
            if (this.value === '' || this.value === '無運動') {
                intensityGroup.style.display = 'none';
            } else {
                intensityGroup.style.display = 'block';
            }
        });
    }
    
    // Add event listener for daily activity level change in summary
    const dailyActivityLevelSelect = document.getElementById('dailyActivityLevel');
    if (dailyActivityLevelSelect) {
        dailyActivityLevelSelect.addEventListener('change', function() {
            const dailyReasonGroup = document.getElementById('dailyReasonGroup');
            if (this.value && this.value !== '平常') {
                dailyReasonGroup.style.display = 'block';
            } else {
                dailyReasonGroup.style.display = 'none';
            }
        });
    }
});

// Load user information from localStorage
function loadUserInfo() {
    const savedInfo = localStorage.getItem('userInfo');
    if (savedInfo) {
        userInfo = JSON.parse(savedInfo);
        
        // Auto-fill form
        if (userInfo.name) document.getElementById('name').value = userInfo.name;
        if (userInfo.participantId) document.getElementById('participantId').value = userInfo.participantId;
        if (userInfo.gender) {
            const genderRadio = document.querySelector(`input[name="gender"][value="${userInfo.gender}"]`);
            if (genderRadio) genderRadio.checked = true;
        }
        if (userInfo.age) document.getElementById('age').value = userInfo.age;
    }
    
    // Load selected date
    const savedDate = localStorage.getItem('selectedRecordDate');
    if (savedDate) {
        const dateRadio = document.querySelector(`input[name="exerciseRecordDate"][value="${savedDate}"]`);
        if (dateRadio && !document.querySelector('input[name="exerciseRecordDate"]:checked')) {
            dateRadio.checked = true;
        }
    }
}

// Save user information
function saveUserInfo() {
    const form = document.getElementById('personalInfoForm');
    if (!form.checkValidity()) {
        alert('請填寫所有基本資訊');
        return false;
    }
    
    userInfo = {
        name: document.getElementById('name').value,
        participantId: document.getElementById('participantId').value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        age: document.getElementById('age').value
    };
    
    localStorage.setItem('userInfo', JSON.stringify(userInfo));
    
    // Save selected date when user info is saved
    const selectedDate = document.querySelector('input[name="exerciseRecordDate"]:checked')?.value;
    if (selectedDate) {
        localStorage.setItem('selectedRecordDate', selectedDate);
    }
    
    return true;
}

// Confirm exercise date selection
window.confirmExerciseDate = function() {
    const selectedDate = document.querySelector('input[name="exerciseRecordDate"]:checked');
    if (!selectedDate) {
        alert('請選擇記錄日期');
        return;
    }
    
    // Save user info first
    if (!saveUserInfo()) {
        alert('請先填寫基本資訊');
        return;
    }
    
    selectedExerciseDate = selectedDate.value;
    
    // Initialize quarters for this date
    initializeQuartersForDate(selectedExerciseDate);
    
    // Get date label
    const dateLabels = {
        'workday1': '第一個工作日',
        'workday2': '第二個工作日',
        'restday': '第一個休息日'
    };
    
    // Hide date selection section
    document.getElementById('dateSelectionSection').style.display = 'none';
    
    // Show selected date display
    const dateDisplay = document.getElementById('selectedDateDisplay');
    const dateText = document.getElementById('selectedDateText');
    dateText.textContent = dateLabels[selectedExerciseDate];
    dateDisplay.style.display = 'block';
    
    // Show exercise quarters
    document.getElementById('exerciseQuartersContainer').style.display = 'block';
    
    // Show summary section
    document.getElementById('exerciseSummarySection').style.display = 'block';
    
    // Render all quarters with existing data for this date
    renderTimeSlots('morning');
    renderTimeSlots('afternoon');
    renderTimeSlots('evening');
    renderTimeSlots('night');
    
    // Update summary
    updateExerciseSummary();
    
    // Load daily activity level if saved
    const dailySummary = exerciseRecords[selectedExerciseDate].dailySummary;
    if (dailySummary) {
        document.getElementById('dailyActivityLevel').value = dailySummary.activityLevel || '';
        document.getElementById('dailyActivityReason').value = dailySummary.activityReason || '';
        const dailyReasonGroup = document.getElementById('dailyReasonGroup');
        if (dailySummary.activityLevel && dailySummary.activityLevel !== '平常') {
            dailyReasonGroup.style.display = 'block';
        } else {
            dailyReasonGroup.style.display = 'none';
        }
    }
    
    // Save to localStorage
    saveExerciseRecords();
};

// Save exercise records to localStorage
function saveExerciseRecords() {
    try {
        localStorage.setItem('exerciseRecords', JSON.stringify(exerciseRecords));
    } catch (e) {
        console.error('Error saving exercise records:', e);
    }
}

// Save exercise record to database
function saveExerciseToDB(exerciseRecord, quarter, timeSlot, recordDate) {
    try {
        // Get user info from form
        const nameInput = document.getElementById('name');
        const participantIdInput = document.getElementById('participantId');
        const genderInput = document.querySelector('input[name="gender"]:checked');
        const ageInput = document.getElementById('age');
        
        if (!participantIdInput || !participantIdInput.value) {
            console.warn('[DB] Missing participant ID, skipping database save');
            return;
        }
        
        const dbRecord = {
            participant_id: participantIdInput.value,
            name: nameInput ? nameInput.value : 'Unknown',
            gender: genderInput ? genderInput.value : '',
            age: ageInput ? parseInt(ageInput.value) : null,
            record_date: recordDate,
            quarter: quarter,
            time_slot: timeSlot,
            exercise_type: exerciseRecord.type,
            intensity: exerciseRecord.intensity,
            description: exerciseRecord.description
        };
        
        // Send to API
        fetch('/api/save-exercise', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dbRecord)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`[DB] Exercise saved successfully - ID: ${data.id}`);
            } else {
                console.error('[DB] Failed to save exercise:', data.error);
            }
        })
        .catch(error => {
            console.error('[DB] Error saving exercise:', error);
        });
    } catch (error) {
        console.error('[DB] Exception while saving exercise:', error);
    }
}


// Generate time string in HH:MM format
function generateTimeString(hour, minute) {
    return String(hour).padStart(2, '0') + ':' + String(minute).padStart(2, '0');
}

// Map exercise type to CSS class for color coding
function getExerciseTypeClass(type) {
    const typeMap = {
        '無運動': 'no-exercise',
        '走路': 'walking',
        '跑步': 'running',
        '騎單車': 'cycling',
        '游泳': 'swimming',
        '瑜伽': 'yoga',
        '健身房': 'gym',
        '球類運動': 'sports',
        '其他': 'other'
    };
    return typeMap[type] || 'other';
}

// Initialize time slots for all quarters
function initializeTimeSlots() {
    for (const [quarter, config] of Object.entries(quarterConfig)) {
        renderTimeSlots(quarter);
    }
}

// Render time slots for a specific quarter
function renderTimeSlots(quarter) {
    const grid = document.querySelector(`.time-slots-grid[data-quarter="${quarter}"]`);
    if (!grid) return;
    
    grid.innerHTML = '';
    const config = quarterConfig[quarter];
    
    // Generate 15-minute intervals
    for (let hour = config.start; hour < config.end; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = generateTimeString(hour, minute);
            
            // Check if this time slot has an exercise record
            const dateRecords = selectedExerciseDate && exerciseRecords[selectedExerciseDate];
            const hasExercise = dateRecords && dateRecords[quarter] && dateRecords[quarter][timeStr];
            
            const btn = document.createElement('button');
            const exerciseClass = hasExercise ? `has-exercise exercise-${getExerciseTypeClass(dateRecords[quarter][timeStr].type)}` : '';
            btn.className = `time-slot-btn ${exerciseClass}`;
            btn.textContent = timeStr;
            btn.onclick = (e) => {
                e.preventDefault();
                openExerciseForm(quarter, timeStr);
            };
            
            // Add tooltip showing exercise details if exists
            if (hasExercise) {
                const exercise = dateRecords[quarter][timeStr];
                btn.title = `${exercise.type} - ${exercise.intensity}`;
            }
            
            grid.appendChild(btn);
        }
    }
}

// Open exercise form for a specific time slot
window.openExerciseForm = function(quarter, timeSlot) {
    // Check if date is selected first
    if (!selectedExerciseDate) {
        alert('請先選擇記錄日期！');
        return;
    }
    
    if (!saveUserInfo()) {
        return;
    }
    
    currentQuarter = quarter;
    currentTimeSlot = timeSlot;
    
    const quarterLabels = {
        morning: '凌晨-早晨 (0:00-6:00)',
        afternoon: '上午 (6:00-12:00)',
        evening: '下午 (12:00-18:00)',
        night: '晚上 (18:00-24:00)'
    };
    
    document.getElementById('exerciseModalTitle').textContent = 
        `運動記錄 - ${quarterLabels[quarter]} ${timeSlot}`;
    
    // Load existing data if available
    const dateRecords = exerciseRecords[selectedExerciseDate];
    const existing = dateRecords && dateRecords[quarter] ? dateRecords[quarter][timeSlot] : null;
    const deleteBtn = document.getElementById('deleteExerciseBtn');
    
    if (existing) {
        document.getElementById('exerciseType').value = existing.type;
        document.getElementById('exerciseIntensity').value = existing.intensity;
        document.getElementById('exerciseDescription').value = existing.description || '';
        // Show/hide intensity based on exercise type
        const intensityGroup = document.querySelector('.exercise-form-group:has(#exerciseIntensity)');
        if (existing.type === '' || existing.type === '無運動') {
            intensityGroup.style.display = 'none';
        } else {
            intensityGroup.style.display = 'block';
        }
        // Show delete button for existing records
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
        // Clear form for new entry
        document.getElementById('exerciseType').value = '';
        document.getElementById('exerciseIntensity').value = '';
        document.getElementById('exerciseDescription').value = '';
        // Hide intensity by default since "無運動" is default
        document.querySelector('.exercise-form-group:has(#exerciseIntensity)').style.display = 'none';
        // Hide delete button for new entries
        if (deleteBtn) deleteBtn.style.display = 'none';
    }
    
    // Show modal
    const modal = document.getElementById('exerciseModal');
    modal.style.display = 'flex';
    modal.classList.add('show');
    
    // Focus on type select
    setTimeout(() => {
        document.getElementById('exerciseType').focus();
    }, 100);
};

// Close exercise form
window.closeExerciseForm = function() {
    const modal = document.getElementById('exerciseModal');
    modal.style.display = 'none';
    modal.classList.remove('show');
    currentQuarter = null;
};

// Delete current exercise record
window.deleteCurrentExercise = function() {
    if (confirm('確定要清除這個時段的運動記錄嗎？')) {
        const dateRecords = exerciseRecords[selectedExerciseDate];
        if (currentQuarter && currentTimeSlot && dateRecords && dateRecords[currentQuarter] && dateRecords[currentQuarter][currentTimeSlot]) {
            delete dateRecords[currentQuarter][currentTimeSlot];
            saveExerciseRecords();
            renderTimeSlots(currentQuarter);
            closeExerciseForm();
            showSuccessMessage('運動記錄已清除');
        }
    }
};

// Submit exercise record
window.submitExerciseRecord = function() {
    const type = document.getElementById('exerciseType').value;
    const intensity = document.getElementById('exerciseIntensity').value;
    const description = document.getElementById('exerciseDescription').value;
    
    // If exercise type is selected (not "無運動"), intensity must be selected
    if (type && type !== '無運動' && !intensity) {
        alert('請選擇運動強度');
        return;
    }
    
    // Intensity not required if "無運動"
    const finalIntensity = (type === '' || type === '無運動') ? '未指定' : intensity;
    
    // If no type selected (empty), delete the record if it exists
    if (!type || type === '') {
        const dateRecords = exerciseRecords[selectedExerciseDate];
        if (currentQuarter && currentTimeSlot && dateRecords && dateRecords[currentQuarter] && dateRecords[currentQuarter][currentTimeSlot]) {
            delete dateRecords[currentQuarter][currentTimeSlot];
            saveExerciseRecords();
            renderTimeSlots(currentQuarter);
            closeExerciseForm();
            updateExerciseSummary();
            showSuccessMessage('運動記錄已清除');
        } else {
            closeExerciseForm();
        }
        return;
    }
    
    // Create exercise record
    const exerciseRecord = {
        type: type,
        intensity: finalIntensity,
        description: description,
        timestamp: new Date().toLocaleString('zh-HK')
    };
    
    // Add to current time slot
    if (currentQuarter && currentTimeSlot && selectedExerciseDate) {
        const dateRecords = initializeQuartersForDate(selectedExerciseDate);
        dateRecords[currentQuarter][currentTimeSlot] = exerciseRecord;
        
        // Save to localStorage
        saveExerciseRecords();
        
        // Save to database
        saveExerciseToDB(exerciseRecord, currentQuarter, currentTimeSlot, selectedExerciseDate);
        
        // Update UI
        renderTimeSlots(currentQuarter);
        
        // Update summary if visible
        updateExerciseSummary();
        
        // Close modal
        closeExerciseForm();
        
        // Show success message
        showSuccessMessage(`${type} 運動記錄已保存`);
    }

};

// Show success message
function showSuccessMessage(message) {
    const msg = document.createElement('div');
    msg.textContent = message;
    msg.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        z-index: 2000;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        animation: slideIn 0.3s ease;
    `;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// Add animation styles
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Set all unfilled time slots as "無運動"
window.setAllUnfilledAsEmpty = function() {
    if (!confirm('確定要將所有空白時段設為無運動嗎？')) {
        return;
    }
    
    if (!selectedExerciseDate) {
        alert('請先選擇日期');
        return;
    }
    
    const dateRecords = exerciseRecords[selectedExerciseDate];
    const emptyRecord = {
        type: '無運動',
        intensity: '未指定',
        description: '',
        timestamp: new Date().toLocaleString('zh-HK')
    };
    
    // Set empty time slots
    const quarters = ['morning', 'afternoon', 'evening', 'night'];
    for (const quarter of quarters) {
        const config = quarterConfig[quarter];
        for (let hour = config.start; hour < config.end; hour++) {
            for (let minute = 0; minute < 60; minute += 15) {
                const timeStr = generateTimeString(hour, minute);
                if (!dateRecords[quarter][timeStr]) {
                    dateRecords[quarter][timeStr] = JSON.parse(JSON.stringify(emptyRecord));
                }
            }
        }
    }
    
    saveExerciseRecords();
    
    // Re-render all quarters
    for (const quarter of quarters) {
        renderTimeSlots(quarter);
    }
    
    updateExerciseSummary();
    showSuccessMessage('所有空白時段已設為無運動');
};

// Update exercise summary with sorted by type
window.updateExerciseSummary = function() {
    if (!selectedExerciseDate) return;
    
    const dateRecords = exerciseRecords[selectedExerciseDate];
    const summaryContent = document.getElementById('exerciseSummaryContent');
    const summarySection = document.getElementById('exerciseSummarySection');
    
    // Collect all exercises sorted by type
    const exercisesByType = {};
    
    const quarters = ['morning', 'afternoon', 'evening', 'night'];
    for (const quarter of quarters) {
        const records = dateRecords[quarter];
        for (const timeStr in records) {
            const exercise = records[timeStr];
            if (!exercisesByType[exercise.type]) {
                exercisesByType[exercise.type] = [];
            }
            exercisesByType[exercise.type].push({
                time: timeStr,
                quarter: quarter,
                ...exercise
            });
        }
    }
    
    // Build HTML sorted by type
    let html = '';
    const types = Object.keys(exercisesByType).sort();
    
    for (const type of types) {
        const exercises = exercisesByType[type];
        html += `<div style="margin-bottom: 15px; padding: 12px; background: #f9fafb; border-radius: 8px; border-left: 4px solid var(--accent);">
            <strong style="color: var(--accent);">${type}</strong> (${exercises.length} 個時段)<br>
            <span style="color: #6b7280; font-size: 13px;">時間：${exercises.map(e => e.time).join(', ')}</span>`;
        
        // Add intensity if not "無運動"
        if (type !== '無運動') {
            const intensities = [...new Set(exercises.map(e => e.intensity))];
            if (intensities.length > 0) {
                html += `<br><span style="color: #6b7280; font-size: 13px;">強度：${intensities.join('、')}</span>`;
            }
        }
        
        html += '</div>';
    }
    
    summaryContent.innerHTML = html || '<p style="color: #9ca3af;">未添加任何運動記錄</p>';
};

// Finish exercise record - show summary
window.finishExerciseRecord = function() {
    if (!userInfo.name) {
        alert('請先填寫基本資訊');
        return;
    }
    
    if (!selectedExerciseDate) {
        alert('請先選擇日期');
        return;
    }
    
    const dailyActivityLevel = document.getElementById('dailyActivityLevel').value;
    const dailyActivityReason = document.getElementById('dailyActivityReason').value;
    
    // Validate daily activity level
    if (!dailyActivityLevel) {
        alert('請選擇今日的活動量水平');
        return;
    }
    
    // Validate reason if activity level is not "平常"
    if (dailyActivityLevel && dailyActivityLevel !== '平常' && !dailyActivityReason.trim()) {
        alert('請提供活動量與平常不同的原因');
        return;
    }
    
    // Save daily summary
    if (!exerciseRecords[selectedExerciseDate].dailySummary) {
        exerciseRecords[selectedExerciseDate].dailySummary = {};
    }
    exerciseRecords[selectedExerciseDate].dailySummary = {
        activityLevel: dailyActivityLevel,
        activityReason: dailyActivityReason,
        timestamp: new Date().toLocaleString('zh-HK')
    };
    
    const dateRecords = exerciseRecords[selectedExerciseDate];
    
    // Count total exercises
    let totalExercises = 0;
    let quarterSummary = {};
    
    const quarters = ['morning', 'afternoon', 'evening', 'night'];
    for (const quarter of quarters) {
        const records = dateRecords[quarter];
        const count = Object.keys(records).length;
        totalExercises += count;
        
        if (count > 0) {
            quarterSummary[quarter] = count;
        }
    }
    
    if (totalExercises === 0) {
        alert('還未添加任何運動記錄');
        return;
    }
    
    // Build summary message
    let summaryText = `親愛的 ${userInfo.name}，感謝您完成 ${getExerciseDateLabel(selectedExerciseDate)} 的運動記錄！\n\n`;
    summaryText += `總共記錄：${totalExercises} 項運動\n\n`;
    summaryText += `各時段記錄：\n`;
    
    const quarterLabels = {
        morning: '凌晨-早晨 (0:00-6:00)',
        afternoon: '上午 (6:00-12:00)',
        evening: '下午 (12:00-18:00)',
        night: '晚上 (18:00-24:00)'
    };
    
    for (const quarter in quarterLabels) {
        const count = quarterSummary[quarter] || 0;
        summaryText += `• ${quarterLabels[quarter]}：${count} 項\n`;
    }
    
    summaryText += '\n您的運動記錄已成功保存。';
    
    // Save to localStorage
    const allRecords = {
        userInfo: userInfo,
        exerciseRecords: exerciseRecords,
        savedAt: new Date().toLocaleString('zh-HK')
    };
    
    localStorage.setItem('exerciseData', JSON.stringify(allRecords));
    
    // Save daily summary to database
    saveDailySummaryToDB(selectedExerciseDate, dailyActivityLevel, dailyActivityReason);

    // Check which days are remaining (exclude all days already completed)
    const remainingDates = [];
    const completedDates = [];
    const dateLabels = {
        'workday1': '第一個工作日',
        'workday2': '第二個工作日',
        'restday': '第一個休息日'
    };
    
    for (const dateKey in dateLabels) {
        const hasSummary = exerciseRecords[dateKey] && exerciseRecords[dateKey].dailySummary;
        if (hasSummary) {
            completedDates.push({ key: dateKey, label: dateLabels[dateKey] });
        } else {
            remainingDates.push({ key: dateKey, label: dateLabels[dateKey] });
        }
    }
    
    // Display completion summary in page instead of modal
    showCompletionSummaryInPage(summaryText, remainingDates);
};

// Show completion summary in the page
window.showCompletionSummaryInPage = function(summaryText, remainingDates) {
    // Hide exercise sections
    document.getElementById('exerciseQuartersContainer').style.display = 'none';
    document.getElementById('exerciseSummarySection').style.display = 'none';
    document.querySelector('.exercise-action-buttons').style.display = 'none';
    
    // Show completion summary section
    const completionSection = document.createElement('div');
    completionSection.id = 'completionSummarySection';
    completionSection.style.cssText = `
        margin-top: 30px;
        background: white;
        border-radius: 12px;
        padding: 30px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    `;
    
    let html = `
        <h2 style="color: var(--accent); margin-top: 0; text-align: center; font-size: 22px;">✓ 記錄已保存</h2>
        <div style="padding: 20px; background: #f9fafb; border-radius: 8px; margin-bottom: 20px; line-height: 1.8; white-space: pre-wrap; font-size: 14px;">
            ${summaryText}
        </div>
    `;
    
    if (remainingDates.length > 0) {
        html += `
            <div style="padding: 20px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; margin-bottom: 25px;">
                <strong style="color: #92400e; font-size: 15px;">還有 ${remainingDates.length} 天需要記錄：</strong><br>
                <div style="margin-top: 10px; color: #78350f; font-size: 14px;">
                    ${remainingDates.map((d, i) => `<div>${i + 1}. ${d.label}</div>`).join('')}
                </div>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="resetExercisePageToSelect()" style="flex: 1; padding: 12px; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">繼續記錄下一天</button>
                <button onclick="goToMealTracking()" style="flex: 1; padding: 12px; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">切換至飲食記錄</button>
            </div>
        `;
    } else {
        html += `
            <div style="padding: 20px; background: #d1fae5; border-radius: 8px; border-left: 4px solid #10b981; margin-bottom: 25px;">
                <strong style="color: #065f46; font-size: 15px;">恭喜！您已完成所有三天的運動記錄！</strong>
            </div>
            <div style="display: flex; gap: 12px;">
                <button onclick="goToMealTracking()" style="flex: 1; padding: 12px; background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%); color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">切換至飲食記錄</button>
                <button onclick="resetExercisePageToSelect()" style="flex: 1; padding: 12px; background: #e5e7eb; color: #374151; border: none; border-radius: 8px; font-weight: bold; cursor: pointer; font-size: 14px;">繼續編輯</button>
            </div>
        `;
    }
    
    completionSection.innerHTML = html;
    
    // Remove old completion section if exists
    const oldSection = document.getElementById('completionSummarySection');
    if (oldSection) {
        oldSection.remove();
    }
    
    // Insert after the action buttons
    const actionButtons = document.querySelector('.exercise-action-buttons');
    if (actionButtons && actionButtons.parentNode) {
        actionButtons.parentNode.insertBefore(completionSection, actionButtons.nextSibling);
    }
};

// Reset exercise page and scroll to top
window.resetExercisePageToSelect = function() {
    // Remove completion section
    const completionSection = document.getElementById('completionSummarySection');
    if (completionSection) {
        completionSection.remove();
    }
    
    resetExercisePage();
    
    // Show action buttons again
    document.querySelector('.exercise-action-buttons').style.display = 'flex';
    
    window.scrollTo(0, 0);
};

// Get exercise date label
function getExerciseDateLabel(dateKey) {
    const labels = {
        'workday1': '第一個工作日',
        'workday2': '第二個工作日',
        'restday': '第一個休息日'
    };
    return labels[dateKey] || dateKey;
}

// Reset exercise page to date selection
window.resetExercisePage = function() {
    selectedExerciseDate = null;
    
    // Hide exercise sections
    document.getElementById('dateSelectionSection').style.display = 'block';
    document.getElementById('selectedDateDisplay').style.display = 'none';
    document.getElementById('exerciseQuartersContainer').style.display = 'none';
    document.getElementById('exerciseSummarySection').style.display = 'none';
    
    // Reset form
    document.getElementById('dailyActivityLevel').value = '';
    document.getElementById('dailyActivityReason').value = '';
    document.getElementById('dailyReasonGroup').style.display = 'none';
    
    // Uncheck date radio buttons
    document.querySelectorAll('input[name="exerciseRecordDate"]').forEach(radio => {
        radio.checked = false;
    });
};

// Go to meal tracking page (without clearing data)
window.goToMealTracking = function() {
    // Save user info before switching
    const name = document.getElementById('name')?.value;
    const participantId = document.getElementById('participantId')?.value;
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const age = document.getElementById('age')?.value;
    
    if (name || participantId || gender || age) {
        const userInfo = { name, participantId, gender, age };
        localStorage.setItem('userInfo', JSON.stringify(userInfo));
    }
    
    // Save selected date before switching
    const selectedDate = document.querySelector('input[name="exerciseRecordDate"]:checked')?.value;
    if (selectedDate) {
        localStorage.setItem('selectedRecordDate', selectedDate);
    }
    
    window.location.href = 'form.html';
};

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('exerciseModal');
    if (event.target === modal) {
        closeExerciseForm();
    }
});

// Handle Enter key in form
document.addEventListener('DOMContentLoaded', function() {
    const exerciseModal = document.getElementById('exerciseModal');
    
    // Prevent form submission on Enter in input fields, but allow in textarea
    exerciseModal.addEventListener('keypress', function(event) {
        if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
            event.preventDefault();
        }
    });
});
// Save daily exercise summary to database
function saveDailySummaryToDB(recordDate, dailyActivityLevel, dailyActivityReason) {
    try {
        // Get user info from form
        const participantIdInput = document.getElementById('participantId');
        
        if (!participantIdInput || !participantIdInput.value) {
            console.warn('[DB] Missing participant ID, skipping database save');
            return;
        }
        
        const summaryRecord = {
            participant_id: participantIdInput.value,
            record_date: recordDate,
            daily_activity_level: dailyActivityLevel,
            daily_reason: dailyActivityReason,
            notes: ''
        };
        
        // Send to API
        fetch('/api/save-daily-summary', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(summaryRecord)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                console.log(`[DB] Daily summary saved successfully - ID: ${data.id}`);
            } else {
                console.error('[DB] Failed to save daily summary:', data.error);
            }
        })
        .catch(error => {
            console.error('[DB] Error saving daily summary:', error);
        });
    } catch (error) {
        console.error('[DB] Exception while saving daily summary:', error);
    }
}