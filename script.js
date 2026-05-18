// script.js
// الرجاء استبدال الرابط أدناه برابط التطبيق النصي الخاص بك
const API_URL = 'https://script.google.com/macros/s/AKfycbwGxRL15DSuWv2mVZaey3L6sYJ3cVkJ_DdA23-S0MKOV3sdrrNWibE1CfIxEjO7O6o/exec';
let allContracts = [];
let amountByProfessionChart, contractsByNationalityChart, amountOverTimeChart;

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    document.getElementById('professionFilter').addEventListener('change', applyFilters);
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('nationalityFilter').addEventListener('change', applyFilters);
    document.getElementById('resetFilters').addEventListener('click', resetFilters);
});

function fetchData() {
    showLoading();
    fetch(API_URL)
        .then(response => response.json())
        .then(result => {
            if (result.success) {
                allContracts = result.data;
                populateFilters(allContracts);
                applyFilters();
            } else {
                console.error('API Error:', result.error);
                showError('فشل تحميل البيانات. يرجى مراجعة وحدة التحكم.');
            }
        })
        .catch(error => {
            console.error('Network Error:', error);
            showError('خطأ في الشبكة. تأكد من صحة رابط API ونشر التطبيق النصي.');
        });
}

function populateFilters(contracts) {
    const professions = [...new Set(contracts.map(c => c['المهنة']).filter(p => p && p !== ''))].sort();
    const professionSelect = document.getElementById('professionFilter');
    professionSelect.innerHTML = '<option value="all">جميع المهن</option>';
    professions.forEach(p => {
        const option = document.createElement('option');
        option.value = escapeHtml(p);
        option.textContent = escapeHtml(p);
        professionSelect.appendChild(option);
    });
    
    const statuses = [...new Set(contracts.map(c => c['حالة العقد'] || c['الحالة']).filter(s => s && s !== ''))].sort();
    const statusSelect = document.getElementById('statusFilter');
    statusSelect.innerHTML = '<option value="all">جميع الحالات</option>';
    statuses.forEach(s => {
        const option = document.createElement('option');
        option.value = escapeHtml(s);
        option.textContent = escapeHtml(s);
        statusSelect.appendChild(option);
    });
    
    const nationalities = [...new Set(contracts.map(c => c['الجنسية']).filter(n => n && n !== ''))].sort();
    const nationalitySelect = document.getElementById('nationalityFilter');
    nationalitySelect.innerHTML = '<option value="all">جميع الجنسيات</option>';
    nationalities.forEach(n => {
        const option = document.createElement('option');
        option.value = escapeHtml(n);
        option.textContent = escapeHtml(n);
        nationalitySelect.appendChild(option);
    });
}

function applyFilters() {
    const profession = document.getElementById('professionFilter').value;
    const status = document.getElementById('statusFilter').value;
    const nationality = document.getElementById('nationalityFilter').value;
    
    const filteredContracts = allContracts.filter(contract => {
        if (profession !== 'all' && contract['المهنة'] !== profession) return false;
        const contractStatus = contract['حالة العقد'] || contract['الحالة'];
        if (status !== 'all' && contractStatus !== status) return false;
        if (nationality !== 'all' && contract['الجنسية'] !== nationality) return false;
        return true;
    });
    
    updateKPIs(filteredContracts);
    updateCharts(filteredContracts);
}

function updateKPIs(contracts) {
    document.getElementById('totalContracts').textContent = contracts.length;
    
    const totalAmount = contracts.reduce((sum, contract) => {
        const amount = parseFloat(contract['المبلغ المستحق']) || 0;
        return sum + amount;
    }, 0);
    document.getElementById('totalAmountDue').textContent = totalAmount.toLocaleString() + ' ر.س';
    
    const avgDuration = contracts.reduce((sum, contract) => {
        const duration = parseFloat(contract['مدة الاستقدام']) || 0;
        return sum + duration;
    }, 0) / (contracts.length || 1);
    document.getElementById('avgDuration').textContent = avgDuration.toFixed(1);
}

function updateCharts(contracts) {
    updateAmountByProfessionChart(contracts);
    updateContractsByNationalityChart(contracts);
    updateAmountOverTimeChart(contracts);
}

function updateAmountByProfessionChart(contracts) {
    const professionAmounts = {};
    contracts.forEach(contract => {
        const profession = contract['المهنة'];
        const amount = parseFloat(contract['المبلغ المستحق']) || 0;
        if (profession) {
            professionAmounts[profession] = (professionAmounts[profession] || 0) + amount;
        }
    });
    const sorted = Object.entries(professionAmounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    
    if (amountByProfessionChart) amountByProfessionChart.destroy();
    const ctx = document.getElementById('amountByProfessionChart').getContext('2d');
    amountByProfessionChart = new Chart(ctx, {
        type: 'bar',
        data: { labels, datasets: [{ label: 'إجمالي المبلغ المستحق (ر.س)', data, backgroundColor: 'rgba(102, 126, 234, 0.7)', borderColor: 'rgba(102, 126, 234, 1)', borderWidth: 1, borderRadius: 8 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'أعلى 10 مهن من حيث المبلغ المستحق' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'المبلغ (ر.س)' } }, x: { title: { display: true, text: 'المهنة' } } } }
    });
}

function updateContractsByNationalityChart(contracts) {
    const nationalityCount = {};
    contracts.forEach(contract => {
        const nationality = contract['الجنسية'];
        if (nationality) nationalityCount[nationality] = (nationalityCount[nationality] || 0) + 1;
    });
    const sorted = Object.entries(nationalityCount).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const labels = sorted.map(item => item[0]);
    const data = sorted.map(item => item[1]);
    
    if (contractsByNationalityChart) contractsByNationalityChart.destroy();
    const ctx = document.getElementById('contractsByNationalityChart').getContext('2d');
    contractsByNationalityChart = new Chart(ctx, {
        type: 'pie',
        data: { labels, datasets: [{ data, backgroundColor: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe', '#43e97b', '#38f9d7', '#fa709a', '#fee140'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'right' }, title: { display: true, text: 'العقود حسب الجنسية' } } }
    });
}

function updateAmountOverTimeChart(contracts) {
    const monthlyAmounts = {};
    
    contracts.forEach(contract => {
        let startDate = contract['تاريخ بداية العقد'];
        if (!startDate) return;
        
        let date;
        // If it's already a Date object (from Apps Script)
        if (startDate instanceof Date) {
            date = startDate;
        } 
        // If it's a string like "9/15/2025 13:34"
        else if (typeof startDate === 'string') {
            // Try to parse MDY with time
            const parts = startDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/);
            if (parts) {
                const month = parseInt(parts[1], 10) - 1; // JS months: 0-11
                const day = parseInt(parts[2], 10);
                const year = parseInt(parts[3], 10);
                const hour = parts[4] ? parseInt(parts[4], 10) : 0;
                const minute = parts[5] ? parseInt(parts[5], 10) : 0;
                date = new Date(year, month, day, hour, minute);
            } else {
                // Fallback to standard parsing
                date = new Date(startDate);
            }
        } 
        else {
            // Unknown type, try converting
            date = new Date(startDate);
        }
        
        if (date && !isNaN(date.getTime())) {
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const amount = parseFloat(contract['المبلغ المستحق']) || 0;
            monthlyAmounts[monthKey] = (monthlyAmounts[monthKey] || 0) + amount;
        }
    });
    
    const sortedMonths = Object.keys(monthlyAmounts).sort();
    const data = sortedMonths.map(month => monthlyAmounts[month]);
    
    if (amountOverTimeChart) amountOverTimeChart.destroy();
    const ctx = document.getElementById('amountOverTimeChart').getContext('2d');
    amountOverTimeChart = new Chart(ctx, {
        type: 'line',
        data: { labels: sortedMonths, datasets: [{ label: 'إجمالي المبلغ المستحق شهرياً', data, borderColor: '#764ba2', backgroundColor: 'rgba(118, 75, 162, 0.1)', borderWidth: 3, tension: 0.4, fill: true, pointBackgroundColor: '#667eea', pointBorderColor: '#fff', pointRadius: 5, pointHoverRadius: 7 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'top' }, title: { display: true, text: 'المبلغ المستحق عبر الزمن' } }, scales: { y: { beginAtZero: true, title: { display: true, text: 'المبلغ (ر.س)' } }, x: { title: { display: true, text: 'الشهر' } } } }
    });
}
function resetFilters() {
    document.getElementById('professionFilter').value = 'all';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('nationalityFilter').value = 'all';
    applyFilters();
}

function showLoading() {
    document.getElementById('totalContracts').textContent = 'جاري التحميل...';
    document.getElementById('totalAmountDue').textContent = 'جاري التحميل...';
    document.getElementById('avgDuration').textContent = 'جاري التحميل...';
}

function showError(message) {
    document.getElementById('totalContracts').textContent = 'خطأ';
    document.getElementById('totalAmountDue').textContent = 'خطأ';
    document.getElementById('avgDuration').textContent = 'خطأ';
    console.error(message);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
