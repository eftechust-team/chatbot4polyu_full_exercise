let savedActualDates = {};

const recordDateLabels = {
    workday1: '第一個工作日',
    workday2: '第二個工作日',
    restday: '第一個休息日'
};

function selectMode(mode) {
    document.getElementById('addFlow').style.display = mode === 'add' ? 'block' : 'none';
    document.getElementById('viewFlow').style.display = mode === 'view' ? 'block' : 'none';
}

function isoDateToDDMMYYYY(isoDate) {
    if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
        return '';
    }
    const parts = isoDate.split('-');
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function setTodayDate() {
    const input = document.getElementById('recordRealDate');
    if (!input) return;
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    input.value = `${year}-${month}-${day}`;
}

function goToAdd(type) {
    const key = document.getElementById('recordDateKey').value;
    const realDateRaw = document.getElementById('recordRealDate').value;
    const realDate = isoDateToDDMMYYYY(realDateRaw);

    if (!key) {
        alert('請先選擇第x個xx日');
        return;
    }
    if (!realDate) {
        alert('請選擇實際日期');
        return;
    }

    const realDateMap = JSON.parse(localStorage.getItem('recordRealDates') || '{}');
    realDateMap[key] = realDate;
    localStorage.setItem('recordRealDates', JSON.stringify(realDateMap));

    savedActualDates[key] = realDate;

    const label = recordDateLabels[key] || key;
    const params = new URLSearchParams({ mode: 'add', record_date: key, record_date_label: label, real_date: realDate });

    if (type === 'food') {
        window.location.href = `/form?${params.toString()}`;
    } else {
        window.location.href = `/exercise?${params.toString()}`;
    }
}

function goToView(type) {
    const key = document.getElementById('viewDateKey').value;
    if (!key) {
        alert('請先選擇第x個xx日');
        return;
    }

    const label = recordDateLabels[key] || key;
    const realDateMap = JSON.parse(localStorage.getItem('recordRealDates') || '{}');
    const realDate = realDateMap[key] || '';
    const params = new URLSearchParams({ mode: 'view', record_date: key, record_date_label: label, real_date: realDate });

    if (type === 'food') {
        window.location.href = `/form?${params.toString()}`;
    } else {
        window.location.href = `/exercise?${params.toString()}`;
    }
}

async function logout() {
    if (!confirm('確定要登出嗎？')) return;
    try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const result = await response.json();
        if (result.success) {
            window.location.href = result.redirect || '/login';
        }
    } catch (e) {
        console.error('Logout error:', e);
        window.location.href = '/login';
    }
}



document.addEventListener('DOMContentLoaded', async function() {
    await loadSavedActualDates();
    checkSavedDate();  // 檢查默認選中項
});

// ========== 從後端拉已存的 actual_date ==========
async function loadSavedActualDates() {
    try {
        const resp = await fetch('/api/get-actual-dates');
        const data = await resp.json();
        if (data.success && data.date_map) {
            savedActualDates = data.date_map;
        }
    } catch (e) {
        console.error('Load actual dates error:', e);
    }
    
    // 同時合併 localStorage（兜底）
    const localMap = JSON.parse(localStorage.getItem('recordRealDates') || '{}');
    for (const [k, v] of Object.entries(localMap)) {
        if (!savedActualDates[k] && v) {
            savedActualDates[k] = v;
        }
    }
}

// ========== dropdown 切換時檢查 ==========
document.getElementById('recordDateKey').addEventListener('change', function() {
    checkSavedDate();
});

function checkSavedDate() {
    const selectedKey = document.getElementById('recordDateKey').value;
    const datePickerSection = document.getElementById('datePickerSection');
    const dateLocked = document.getElementById('dateLocked');
    const lockedDateText = document.getElementById('lockedDateText');

    if (!selectedKey) {
        datePickerSection.style.display = 'block';
        dateLocked.style.display = 'none';
        return;
    }

    if (savedActualDates[selectedKey]) {
        // ✅ 已有 → 鎖定顯示
        datePickerSection.style.display = 'none';
        dateLocked.style.display = 'block';
        lockedDateText.textContent = savedActualDates[selectedKey];

        // 把值填入隱藏的 input，讓 goToAdd 能讀到
        document.getElementById('recordRealDate').value = ddmmyyyyToISO(savedActualDates[selectedKey]);
    } else {
        // 沒有 → 正常選擇
        datePickerSection.style.display = 'block';
        dateLocked.style.display = 'none';
        document.getElementById('recordRealDate').value = '';
    }
}

// dd/mm/yyyy → yyyy-mm-dd
function ddmmyyyyToISO(str) {
    if (!str) return '';
    const parts = str.split('/');
    if (parts.length === 3) {
        return parts[2] + '-' + parts[1] + '-' + parts[0];
    }
    return str;
}

window.selectMode = selectMode;
window.goToAdd = goToAdd;
window.goToView = goToView;
window.setTodayDate = setTodayDate;
window.logout = logout;
