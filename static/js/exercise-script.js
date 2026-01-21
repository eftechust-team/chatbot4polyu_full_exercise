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

// Time block selection state
let selectedTimeBlocks = [];
let isDragging = false;

// Color map for different exercise types
const exerciseColors = {
    '運動': '#ef4444',
    '坐著': '#3b82f6',
    '吃飯': '#f97316',
    '睡覺': '#8b5cf6',
    '其他': '#6b7280'
};

function confirmExerciseDate() {
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
    document.getElementById('exerciseEntryTitle').textContent = `添加${selectedDateLabel}的活動記錄`;
    
    // Initialize time block selector
    initializeTimeBlockSelector();
    
    // Load existing records for this date (disabled for now - no database)
    // loadExerciseRecords();
}

function initializeTimeBlockSelector() {
    const selector = document.getElementById('timeBlockSelector');
    selector.innerHTML = '';
    
    // Generate time blocks from 00:00 to 23:45 (every 15 minutes)
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const block = document.createElement('div');
            block.className = 'time-block';
            block.dataset.time = timeStr;
            block.textContent = timeStr;
            block.style.cssText = `
                padding: 8px 4px;
                border: 1px solid #ddd;
                border-radius: 4px;
                text-align: center;
                cursor: pointer;
                font-size: 11px;
                background: white;
                user-select: none;
                transition: all 0.2s;
            `;
            
            // Mouse events for selection
            block.addEventListener('mousedown', function(e) {
                e.preventDefault();
                isDragging = true;
                toggleTimeBlock(this);
            });
            
            block.addEventListener('mouseenter', function() {
                if (isDragging) {
                    toggleTimeBlock(this);
                }
            });
            
            block.addEventListener('mouseup', function() {
                isDragging = false;
            });
            
            // Touch events for mobile
            block.addEventListener('touchstart', function(e) {
                e.preventDefault();
                toggleTimeBlock(this);
            });
            
            selector.appendChild(block);
        }
    }
    
    // Add global mouseup listener
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // Add final time 24:00 for display purposes
    updateTimelineBlocks();
}

function toggleTimeBlock(block) {
    const time = block.dataset.time;
    const index = selectedTimeBlocks.indexOf(time);
    
    if (index === -1) {
        selectedTimeBlocks.push(time);
        block.style.background = '#3b82f6';
        block.style.color = 'white';
        block.style.borderColor = '#2563eb';
    } else {
        selectedTimeBlocks.splice(index, 1);
        block.style.background = 'white';
        block.style.color = 'black';
        block.style.borderColor = '#ddd';
    }
    
    updateSelectedTimeDisplay();
}

function updateSelectedTimeDisplay() {
    const display = document.getElementById('selectedTimeDisplay');
    
    if (selectedTimeBlocks.length === 0) {
        display.textContent = '未選擇';
        return;
    }
    
    // Sort selected blocks
    selectedTimeBlocks.sort();
    
    // Find continuous ranges
    const ranges = [];
    let rangeStart = selectedTimeBlocks[0];
    let rangeEnd = selectedTimeBlocks[0];
    
    for (let i = 1; i < selectedTimeBlocks.length; i++) {
        const current = selectedTimeBlocks[i];
        const prev = selectedTimeBlocks[i - 1];
        
        // Check if continuous (15 minutes apart)
        if (timeToMinutes(current) - timeToMinutes(prev) === 15) {
            rangeEnd = current;
        } else {
            ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
            rangeStart = current;
            rangeEnd = current;
        }
    }
    
    // Add the last range
    ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
    
    // Display ranges
    display.textContent = ranges.map(r => `${r.start}-${r.end}`).join(', ');
}

function clearTimeSelection() {
    selectedTimeBlocks = [];
    
    // Reset all blocks
    const blocks = document.querySelectorAll('.time-block');
    blocks.forEach(block => {
        block.style.background = 'white';
        block.style.color = 'black';
        block.style.borderColor = '#ddd';
    });
    
    updateSelectedTimeDisplay();
}

function addMinutes(timeStr, minutes) {
    const totalMinutes = timeToMinutes(timeStr) + minutes;
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    if (hours >= 24) return '24:00';
    
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

function addExerciseRecord() {
    const type = document.getElementById('exerciseType').value;
    const intensity = document.getElementById('exerciseIntensity').value;
    const description = document.getElementById('exerciseDescription').value;
    
    // Validation
    if (selectedTimeBlocks.length === 0) {
        alert('請選擇活動時間');
        return;
    }
    
    if (!type) {
        alert('請選擇活動類型');
        return;
    }
    
    if (!intensity) {
        alert('請選擇活動強度');
        return;
    }
    
    // Sort selected blocks and find ranges
    selectedTimeBlocks.sort();
    const ranges = [];
    let rangeStart = selectedTimeBlocks[0];
    let rangeEnd = selectedTimeBlocks[0];
    
    for (let i = 1; i < selectedTimeBlocks.length; i++) {
        const current = selectedTimeBlocks[i];
        const prev = selectedTimeBlocks[i - 1];
        
        if (timeToMinutes(current) - timeToMinutes(prev) === 15) {
            rangeEnd = current;
        } else {
            ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
            rangeStart = current;
            rangeEnd = current;
        }
    }
    ranges.push({ start: rangeStart, end: addMinutes(rangeEnd, 15) });
    
    // Remove all existing "睡覺" records before adding new one
    exerciseRecords = exerciseRecords.filter(r => r.type !== '睡覺');
    
    // Create record objects for each continuous range
    for (const range of ranges) {
        const record = {
            id: Date.now() + Math.random(),
            startTime: range.start,
            endTime: range.end,
            type: type,
            intensity: intensity,
            description: description,
            recordDate: selectedDate
        };
        
        exerciseRecords.push(record);
    }
    
    // Clear form
    clearExerciseForm();
    
    // Update timeline and list
    updateTimelineBlocks();
    updateExerciseList();
    
    // Save to backend (disabled for now - no database table yet)
    // saveExerciseRecord(record);
}

function updateTimelineBlocks() {
    const timelineBlocks = document.getElementById('timelineBlocks');
    const legend = document.getElementById('timelineLegend');
    
    // Clear existing blocks
    timelineBlocks.innerHTML = '';
    legend.innerHTML = '';
    
    // Track used types for legend
    const usedTypes = new Set();
    
    // Create time map (0:00 to 23:59 in full day)
    const timeMap = {};
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            timeMap[timeStr] = null;
        }
    }
    
    // Fill time map with exercise records
    exerciseRecords.forEach(record => {
        const startMinutes = timeToMinutes(record.startTime);
        const endMinutes = timeToMinutes(record.endTime);
        
        for (let m = startMinutes; m < endMinutes; m += 15) {
            const hour = Math.floor(m / 60);
            const minute = m % 60;
            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            
            if (timeMap[timeStr] !== undefined) {
                timeMap[timeStr] = {
                    type: record.type,
                    intensity: record.intensity,
                    description: record.description,
                    startTime: record.startTime,
                    endTime: record.endTime
                };
                usedTypes.add(record.type);
            }
        }
    });
    
    // Create visual blocks for the timeline (1440 minutes in a day, 96 15-minute blocks)
    const blocks = Object.entries(timeMap);
    
    blocks.forEach(([time, data]) => {
        const block = document.createElement('div');
        block.style.cssText = `
            flex: 1;
            height: 100%;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            border-right: 1px solid #d1d5db;
            position: relative;
        `;
        
        if (data) {
            const color = exerciseColors[data.type] || exerciseColors['其他'];
            block.style.backgroundColor = color;
            block.title = `${data.type}\n${data.startTime}-${data.endTime}\n${data.intensity}${data.description ? '\n' + data.description : ''}`;
            
            // Add click handler to show details
            block.addEventListener('click', function() {
                showActionDetails(data);
            });
            
            block.addEventListener('mouseenter', function() {
                this.style.opacity = '0.8';
            });
            
            block.addEventListener('mouseleave', function() {
                this.style.opacity = '1';
            });
        } else {
            block.style.backgroundColor = '#e5e7eb';
        }
        
        timelineBlocks.appendChild(block);
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

function showActionDetails(actionData) {
    document.getElementById('actionDetailsTime').textContent = `${actionData.startTime} - ${actionData.endTime}`;
    document.getElementById('actionDetailsType').textContent = actionData.type;
    document.getElementById('actionDetailsIntensity').textContent = actionData.intensity;
    document.getElementById('actionDetailsDescription').textContent = actionData.description || '(無)';
    
    const modal = document.getElementById('actionDetailsModal');
    modal.style.display = 'flex';
}

function closeActionDetailsModal() {
    document.getElementById('actionDetailsModal').style.display = 'none';
}

function updateTimeline() {
    updateTimelineBlocks();
}

function updateExerciseList() {
    const exerciseItems = document.getElementById('exerciseItems');
    exerciseItems.innerHTML = '';
    
    if (exerciseRecords.length === 0) {
        exerciseItems.innerHTML = '<p style="color: #999; font-size: 14px;">暫無活動記錄</p>';
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
            const intensityDisplay = type === '睡覺' ? '' : `<span style="min-width: 50px;">${record.intensity}</span>`;
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

function deleteExerciseRecord(recordId) {
    if (!confirm('確定要刪除此活動記錄嗎？')) {
        return;
    }
    
    exerciseRecords = exerciseRecords.filter(r => r.id !== recordId);
    updateTimelineBlocks();
    updateExerciseList();
    
    // TODO: Delete from backend
}

function deleteExerciseRecordsByType(type) {
    const count = exerciseRecords.filter(r => r.type === type).length;
    if (!confirm(`確定要刪除${count}條${type}的活動記錄嗎？`)) {
        return;
    }
    
    exerciseRecords = exerciseRecords.filter(r => r.type !== type);
    updateTimelineBlocks();
    updateExerciseList();
}

function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

function clearExerciseForm() {
    clearTimeSelection();
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
        }
    } catch (error) {
        console.error('Save exercise record error:', error);
        alert('保存失敗，請檢查網絡連接');
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
            
            updateTimelineBlocks();
            updateExerciseList();
        }
    } catch (error) {
        console.error('Load exercise records error:', error);
    }
}

async function finishExerciseDay() {
    if (exerciseRecords.length === 0) {
        alert('請至少添加一條活動記錄');
        return;
    }
    
    if (!confirm('確定完成今日活動記錄嗎？')) {
        return;
    }
    
    // Calculate and fill time gaps automatically
    const timeGaps = calculateTimeGaps();
    
    if (timeGaps.length > 0) {
        // Auto-fill gaps with "睡覺"
        for (const gap of timeGaps) {
            const record = {
                id: Date.now() + Math.random(),
                startTime: gap.start,
                endTime: gap.end,
                type: '睡覺',
                intensity: '無',
                description: '',
                recordDate: selectedDate
            };
            exerciseRecords.push(record);
        }
        
        updateTimelineBlocks();
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

function confirmActivityLevel() {
    const activityLevel = document.getElementById('activityLevel').value;
    
    if (!activityLevel) {
        alert('請選擇活動量');
        return;
    }
    
    if (activityLevel !== '平常') {
        const reason = document.getElementById('activityReason').value.trim();
        if (!reason) {
            alert('請填寫原因');
            return;
        }
    }
    
    // Close modal and reset fields
    document.getElementById('activityLevelModal').style.display = 'none';
    document.getElementById('activityLevel').value = '';
    document.getElementById('activityReason').value = '';
    document.getElementById('reasonSection').style.display = 'none';

    // Show summary page (frontend only for now)
    showExerciseSummary();
}

function showExerciseSummary() {
    if (selectedDate) {
        completedExerciseDates.add(selectedDate);
    }

    const totalExerciseCount = exerciseRecords.length;
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

function continueNextExerciseDay() {
    const remainingDays = exerciseDateOptions.filter(opt => !completedExerciseDates.has(opt.value));
    if (remainingDays.length === 0) {
        alert('所有天數均已完成！');
        return;
    }

    // Reset for next day selection
    selectedDate = '';
    selectedDateLabel = '';
    exerciseRecords = [];
    
    // Clear radio button selections
    const radios = document.querySelectorAll('input[name="exerciseDate"]');
    radios.forEach(radio => {
        radio.checked = false;
    });

    // Show date selection section, hide others
    document.getElementById('summarySection').style.display = 'none';
    document.getElementById('dateSection').style.display = 'block';
    document.getElementById('exerciseEntrySection').style.display = 'none';
    document.getElementById('timelineSection').style.display = 'none';
}

async function markNoExercise() {
    if (!confirm('確定將所有未記錄的時間填充為"睡覺"嗎？')) {
        return;
    }
    
    // Calculate time gaps
    const timeGaps = calculateTimeGaps();
    
    if (timeGaps.length === 0) {
        alert('全天都已有活動記錄，無需填充！');
        return;
    }
    
    // Add "睡覺" records for each gap
    for (const gap of timeGaps) {
        const record = {
            id: Date.now() + Math.random(),
            startTime: gap.start,
            endTime: gap.end,
            type: '睡覺',
            intensity: '無',
            description: '',
            recordDate: selectedDate
        };
        
        exerciseRecords.push(record);
        // Save disabled for now - no database
        // await saveExerciseRecord(record);
    }
    
    alert(`已填充 ${timeGaps.length} 個時間段為"睡覺"！`);
    updateTimelineBlocks();
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
