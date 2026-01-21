// Exercise Recording Script
let selectedDate = '';
let selectedDateLabel = '';
let exerciseRecords = [];
const exerciseDateOptions = [
    { value: 'workday1', label: '第一個工作日' },
    { value: 'workday2', label: '第二個工作日' },
    { value: 'restday', label: '第一個休息日' }
];
const completedExerciseDates = new Set();

// Color map for different exercise types
const exerciseColors = {
    '跑步': '#ef4444',
    '步行': '#3b82f6',
    '騎自行車': '#8b5cf6',
    '游泳': '#06b6d4',
    '瑜伽': '#ec4899',
    '健身': '#f97316',
    '球類運動': '#10b981',
    '舞蹈': '#f59e0b',
    '登山': '#84cc16',
    '無運動': '#d1d5db',
    '其他': '#6b7280'
};

async function confirmExerciseDate() {
    const selectedRadio = document.querySelector('input[name="exerciseDate"]:checked');
    
    if (!selectedRadio) {
        alert('請選擇記錄日期');
        return;
    }
    
    selectedDate = selectedRadio.value;
    const labels = {
        'workday1': '第一個工作日',
        'workday2': '第二個工作日',
        'restday': '第一個休息日'
    };
    selectedDateLabel = labels[selectedDate];
    
    // Hide date section, show exercise entry section
    document.getElementById('dateSection').style.display = 'none';
    document.getElementById('exerciseEntrySection').style.display = 'block';
    document.getElementById('timelineSection').style.display = 'block';
    
    // Update the exercise entry title with the selected date
    document.getElementById('exerciseEntryTitle').textContent = `添加${selectedDateLabel}的運動記錄`;
    
    // Load existing records for this date from backend
    await loadExerciseRecords();
}

async function addExerciseRecord() {
    const startTime = document.getElementById('exerciseStartTime').value;
    const endTime = document.getElementById('exerciseEndTime').value;
    const type = document.getElementById('exerciseType').value;
    const intensity = document.getElementById('exerciseIntensity').value;
    const description = document.getElementById('exerciseDescription').value;
    
    // Validation
    if (!startTime || !endTime) {
        alert('請輸入運動開始和結束時間');
        return;
    }
    
    if (!type) {
        alert('請選擇運動類型');
        return;
    }
    
    if (!intensity) {
        alert('請選擇運動強度');
        return;
    }
    
    // Check time validity
    if (startTime >= endTime) {
        alert('結束時間必須晚於開始時間');
        return;
    }
    
    // Remove all existing "無運動" records before adding new one
    exerciseRecords = exerciseRecords.filter(r => r.type !== '無運動');
    
    // Create record object
    const record = {
        startTime: startTime,
        endTime: endTime,
        type: type,
        intensity: intensity,
        description: description,
        recordDate: selectedDate
    };
    
    // Save to backend first
    const saved = await saveExerciseRecord(record);
    
    if (saved) {
        // Add to local array with the ID from backend
        record.id = saved.exercise_record_id;
        exerciseRecords.push(record);
        
        // Clear form
        clearExerciseForm();
        
        // Update timeline and list
        updateTimeline();
        updateExerciseList();
    }
}

function updateTimeline() {
    const timelineBlocks = document.getElementById('timelineBlocks');
    const legend = document.getElementById('timelineLegend');
    
    // Clear existing blocks
    timelineBlocks.innerHTML = '';
    legend.innerHTML = '';
    
    // Track used types for legend
    const usedTypes = new Set();
    
    // Add exercise blocks
    exerciseRecords.forEach(record => {
        const block = document.createElement('div');
        const color = exerciseColors[record.type] || exerciseColors['其他'];
        
        // Calculate position and width based on time
        const startMinutes = timeToMinutes(record.startTime);
        const endMinutes = timeToMinutes(record.endTime);
        const leftPercent = (startMinutes / 1440) * 100; // 1440 minutes in a day
        const widthPercent = ((endMinutes - startMinutes) / 1440) * 100;
        
        block.style.position = 'absolute';
        block.style.left = leftPercent + '%';
        block.style.width = widthPercent + '%';
        block.style.height = '100%';
        block.style.backgroundColor = color;
        block.style.borderRadius = '4px';
        block.style.border = '1px solid rgba(0,0,0,0.1)';
        block.title = `${record.type} (${record.startTime}-${record.endTime})`;
        
        timelineBlocks.appendChild(block);
        usedTypes.add(record.type);
    });
    
    // Add legend items
    usedTypes.forEach(type => {
        const legendItem = document.createElement('div');
        legendItem.style.display = 'flex';
        legendItem.style.alignItems = 'center';
        legendItem.style.gap = '6px';
        
        const colorBox = document.createElement('div');
        colorBox.style.width = '16px';
        colorBox.style.height = '16px';
        colorBox.style.backgroundColor = exerciseColors[type];
        colorBox.style.borderRadius = '3px';
        colorBox.style.border = '1px solid rgba(0,0,0,0.1)';
        
        const label = document.createElement('span');
        label.textContent = type;
        label.style.color = 'var(--text)';
        
        legendItem.appendChild(colorBox);
        legendItem.appendChild(label);
        legend.appendChild(legendItem);
    });
}

function updateExerciseList() {
    const exerciseItems = document.getElementById('exerciseItems');
    exerciseItems.innerHTML = '';
    
    if (exerciseRecords.length === 0) {
        exerciseItems.innerHTML = '<p style="color: #999; font-size: 14px;">暫無運動記錄</p>';
        return;
    }
    
    // Group records by exercise type
    const groupedByType = {};
    exerciseRecords.forEach(record => {
        if (!groupedByType[record.type]) {
            groupedByType[record.type] = [];
        }
        groupedByType[record.type].push(record);
    });
    
    // Display grouped records
    Object.entries(groupedByType).forEach(([type, records]) => {
        const item = document.createElement('div');
        item.style.border = '1px solid var(--border)';
        item.style.borderRadius = '8px';
        item.style.padding = '12px';
        item.style.marginBottom = '10px';
        item.style.backgroundColor = '#fafafa';
        
        const color = exerciseColors[type] || exerciseColors['其他'];
        item.style.borderLeft = `4px solid ${color}`;
        
        // Sort records by start time
        records.sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
        
        let htmlContent = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: var(--text); margin-bottom: 8px; font-size: 15px;">
                        ${type}
                    </div>
        `;
        
        records.forEach(record => {
            const descDisplay = record.description ? `${record.description}` : '';
            const intensityDisplay = type === '無運動' ? '' : `<span style="min-width: 50px;">${record.intensity}</span>`;
            htmlContent += `
                    <div style="font-size: 13px; color: #666; margin-bottom: 6px; display: flex; gap: 12px; align-items: center;">
                        <span style="min-width: 70px;">${record.startTime}-${record.endTime}</span>
                        ${intensityDisplay}
                        <span>${descDisplay}</span>
                    </div>
            `;
        });
        
        htmlContent += `
                </div>
                <button onclick="deleteExerciseRecordsByType('${type}')" style="background: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; white-space: nowrap; margin-left: 10px; height: fit-content;">刪除</button>
            </div>
        `;
        
        item.innerHTML = htmlContent;
        exerciseItems.appendChild(item);
    });
}

async function deleteExerciseRecordsByType(type) {
    const recordsToDelete = exerciseRecords.filter(r => r.type === type);
    const count = recordsToDelete.length;
    
    if (!confirm(`確定要刪除${count}條${type}的運動記錄嗎？`)) {
        return;
    }
    
    // Delete from backend
    for (const record of recordsToDelete) {
        await deleteExerciseRecordFromBackend(record.id);
    }
    
    // Remove from local array
    exerciseRecords = exerciseRecords.filter(r => r.type !== type);
    updateTimeline();
    updateExerciseList();
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function clearExerciseForm() {
    document.getElementById('exerciseStartTime').value = '';
    document.getElementById('exerciseEndTime').value = '';
    document.getElementById('exerciseType').value = '';
    document.getElementById('exerciseIntensity').value = '';
    document.getElementById('exerciseDescription').value = '';
}

async function saveExerciseRecord(record) {
    try {
        const response = await fetch('/api/save-exercise-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_date: selectedDate,
                record_date_label: selectedDateLabel,
                start_time: record.startTime,
                end_time: record.endTime,
                exercise_type: record.type,
                intensity: record.intensity,
                description: record.description
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Save exercise record error:', result.message);
            alert('保存失敗：' + result.message);
            return null;
        }
        
        return result;
    } catch (error) {
        console.error('Save exercise record error:', error);
        alert('保存失敗，請檢查網絡連接');
        return null;
    }
}

async function loadExerciseRecords() {
    try {
        const response = await fetch(`/api/get-exercise-records?record_date=${selectedDate}`);
        const result = await response.json();
        
        if (result.success && result.records) {
            exerciseRecords = result.records.map(r => ({
                id: r.id,
                startTime: r.start_time,
                endTime: r.end_time,
                type: r.exercise_type,
                intensity: r.intensity,
                description: r.description || '',
                recordDate: r.record_date
            }));
            
            updateTimeline();
            updateExerciseList();
        }
    } catch (error) {
        console.error('Load exercise records error:', error);
    }
}

async function deleteExerciseRecordFromBackend(recordId) {
    try {
        const response = await fetch('/api/delete-exercise-record', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_id: recordId
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            console.error('Delete exercise record error:', result.message);
        }
    } catch (error) {
        console.error('Delete exercise record error:', error);
    }
}

async function finishExerciseDay() {
    if (exerciseRecords.length === 0) {
        alert('請至少添加一條運動記錄');
        return;
    }
    
    if (!confirm('確定完成今日運動記錄嗎？')) {
        return;
    }
    
    // Calculate and fill time gaps automatically
    const timeGaps = calculateTimeGaps();
    
    if (timeGaps.length > 0) {
        // Auto-fill gaps with "無運動"
        for (const gap of timeGaps) {
            const record = {
                startTime: gap.start,
                endTime: gap.end,
                type: '無運動',
                intensity: '無',
                description: '',
                recordDate: selectedDate
            };
            
            // Save to backend
            const saved = await saveExerciseRecord(record);
            if (saved) {
                record.id = saved.exercise_record_id;
                exerciseRecords.push(record);
            }
        }
        
        updateTimeline();
        updateExerciseList();
    }
    
    // Show activity level modal
    document.getElementById('activityLevelModal').style.display = 'flex';
}

function cancelActivityLevel() {
    document.getElementById('activityLevelModal').style.display = 'none';
    document.getElementById('activityLevel').value = '';
    document.getElementById('activityReason').value = '';
    document.getElementById('reasonSection').style.display = 'none';
}

async function confirmActivityLevel() {
    const activityLevel = document.getElementById('activityLevel').value;
    
    if (!activityLevel) {
        alert('請選擇活動量');
        return;
    }
    
    const activityReason = document.getElementById('activityReason').value.trim();
    
    if (activityLevel !== '平常' && !activityReason) {
        alert('請填寫原因');
        return;
    }
    
    // Save activity level to backend
    try {
        const response = await fetch('/api/complete-exercise-day', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                record_date: selectedDate,
                activity_level: activityLevel,
                activity_reason: activityReason
            })
        });
        
        const result = await response.json();
        
        if (!result.success) {
            alert('保存失敗：' + result.message);
            return;
        }
        
        // Close modal and reset fields
        document.getElementById('activityLevelModal').style.display = 'none';
        document.getElementById('activityLevel').value = '';
        document.getElementById('activityReason').value = '';
        document.getElementById('reasonSection').style.display = 'none';

        // Show summary page
        showExerciseSummary();
        
    } catch (error) {
        console.error('Complete exercise day error:', error);
        alert('保存失敗，請檢查網絡連接');
    }
}

function showExerciseSummary() {
    if (selectedDate) {
        completedExerciseDates.add(selectedDate);
    }

    const totalExerciseCount = exerciseRecords.filter(r => r.type !== '無運動').length;
    document.getElementById('summaryDateLabel').textContent = selectedDateLabel || '這一天';
    document.getElementById('summaryTotalCount').textContent = totalExerciseCount;

    const remainingDays = exerciseDateOptions.filter(opt => !completedExerciseDates.has(opt.value));
    const remainingWrapper = document.getElementById('summaryRemainingWrapper');
    const remainingText = document.getElementById('summaryRemainingText');
    const remainingList = document.getElementById('summaryRemainingList');
    remainingList.innerHTML = '';

    if (remainingDays.length > 0) {
        remainingText.textContent = `還有 ${remainingDays.length} 天需要記錄：`;
        remainingWrapper.style.display = 'block';
        remainingDays.forEach(day => {
            const li = document.createElement('li');
            li.textContent = day.label;
            remainingList.appendChild(li);
        });
    } else {
        remainingText.textContent = '所有天數均已完成，感謝記錄！';
        remainingWrapper.style.display = 'block';
    }

    document.getElementById('exerciseEntrySection').style.display = 'none';
    document.getElementById('timelineSection').style.display = 'none';
    document.getElementById('summarySection').style.display = 'block';
}

function returnToExerciseEditing() {
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('exerciseEntrySection').style.display = 'block';
    document.getElementById('timelineSection').style.display = 'block';
}

async function continueNextExerciseDay() {
    const remainingDays = exerciseDateOptions.filter(opt => !completedExerciseDates.has(opt.value));
    if (remainingDays.length === 0) {
        alert('所有天數均已完成！');
        return;
    }

    // Pick the first remaining day
    const nextDay = remainingDays[0];
    selectedDate = nextDay.value;
    selectedDateLabel = nextDay.label;

    // Reset records and UI for the next day
    exerciseRecords = [];
    
    // Load records for the next day
    await loadExerciseRecords();
    
    updateTimeline();
    updateExerciseList();
    clearExerciseForm();

    // Update radio buttons
    const radios = document.querySelectorAll('input[name="exerciseDate"]');
    radios.forEach(radio => {
        radio.checked = radio.value === selectedDate;
    });

    document.getElementById('exerciseEntryTitle').textContent = `添加${selectedDateLabel}的運動記錄`;
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('dateSection').style.display = 'none';
    document.getElementById('exerciseEntrySection').style.display = 'block';
    document.getElementById('timelineSection').style.display = 'block';
}

async function markNoExercise() {
    if (!confirm('確定將所有未記錄的時間填充為"無運動"嗎？')) {
        return;
    }
    
    // Calculate time gaps
    const timeGaps = calculateTimeGaps();
    
    if (timeGaps.length === 0) {
        alert('全天都已有運動記錄，無需填充！');
        return;
    }
    
    // Add "無運動" records for each gap
    for (const gap of timeGaps) {
        const record = {
            startTime: gap.start,
            endTime: gap.end,
            type: '無運動',
            intensity: '無',
            description: '',
            recordDate: selectedDate
        };
        
        // Save to backend
        const saved = await saveExerciseRecord(record);
        if (saved) {
            record.id = saved.exercise_record_id;
            exerciseRecords.push(record);
        }
    }
    
    alert(`已填充 ${timeGaps.length} 個時間段為"無運動"！`);
    updateTimeline();
    updateExerciseList();
}

function calculateTimeGaps() {
    // Sort existing records by start time
    const sortedRecords = [...exerciseRecords].sort((a, b) => {
        return timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    });
    
    const gaps = [];
    let currentTime = '00:00';
    
    for (const record of sortedRecords) {
        if (currentTime < record.startTime) {
            // Found a gap
            gaps.push({
                start: currentTime,
                end: record.startTime
            });
        }
        currentTime = record.endTime;
    }
    
    // Check if there's a gap at the end of the day
    if (currentTime < '24:00') {
        gaps.push({
            start: currentTime,
            end: '24:00'
        });
    }
    
    return gaps;
}

async function logout() {
    if (confirm('確定要登出嗎？')) {
        try {
            const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const result = await response.json();
            if (result.success) {
                window.location.href = result.redirect || '/login';
            }
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = '/login';
        }
    }
}

// Activity level modal logic
document.addEventListener('DOMContentLoaded', function() {
    const activityLevelSelect = document.getElementById('activityLevel');
    const reasonSection = document.getElementById('reasonSection');
    
    if (activityLevelSelect) {
        activityLevelSelect.addEventListener('change', function() {
            if (this.value && this.value !== '平常') {
                reasonSection.style.display = 'block';
            } else {
                reasonSection.style.display = 'none';
            }
        });
    }
});