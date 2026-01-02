let incomeData = [];
let expenseData = [];
let currentFilter = { month: '', year: '' };
let isAdmin = false;

// Initialize page
document.addEventListener('DOMContentLoaded', () => {
    checkAdminStatus();
    loadData();
    setDefaultDate();
});

// Check if user is admin
async function checkAdminStatus() {
    try {
        const response = await fetch('check_admin.php');
        const result = await response.json();
        isAdmin = result.is_admin;
        
        if (isAdmin) {
            const adminStatus = document.getElementById('admin-status');
            adminStatus.textContent = 'Admin: ' + result.admin_name;
            adminStatus.style.display = 'inline-block';
            document.getElementById('add-income-btn').style.display = 'inline-block';
            document.getElementById('add-expense-btn').style.display = 'inline-block';
        }
    } catch (error) {
        const localAdmin = localStorage.getItem('admin_logged_in');
        if (localAdmin === 'true') {
            isAdmin = true;
            const adminName = localStorage.getItem('admin_name') || 'Admin';
            const adminStatus = document.getElementById('admin-status');
            adminStatus.textContent = 'Admin: ' + adminName;
            adminStatus.style.display = 'inline-block';
            document.getElementById('add-income-btn').style.display = 'inline-block';
            document.getElementById('add-expense-btn').style.display = 'inline-block';
        }
    }
}

// Load all data
async function loadData() {
    await Promise.all([loadIncome(), loadExpense()]);
    updateSummary();
    updateCategoryBreakdown();
}

// Load income data
async function loadIncome() {
    try {
        const response = await fetch('get_finance.php?type=income');
        const result = await response.json();
        
        if (result.success) {
            incomeData = result.data;
            displayIncome(incomeData);
        } else {
            document.getElementById('income-tbody').innerHTML = '<tr><td colspan="4" class="loading">কোনো আয়ের তথ্য পাওয়া যায়নি</td></tr>';
        }
    } catch (error) {
        showToast('আয়ের তথ্য লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Load expense data
async function loadExpense() {
    try {
        const response = await fetch('get_finance.php?type=expense');
        const result = await response.json();
        
        if (result.success) {
            expenseData = result.data;
            displayExpense(expenseData);
        } else {
            document.getElementById('expense-tbody').innerHTML = '<tr><td colspan="4" class="loading">কোনো ব্যয়ের তথ্য পাওয়া যায়নি</td></tr>';
        }
    } catch (error) {
        showToast('ব্যয়ের তথ্য লোড করতে সমস্যা হয়েছে', 'error');
    }
}

// Display income table
function displayIncome(data) {
    const tbody = document.getElementById('income-tbody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">কোনো আয়ের তথ্য পাওয়া যায়নি</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr class="clickable-row" onclick="showIncomeDetail(${index})">
            <td>${formatDate(item.date)}</td>
            <td>${item.source}</td>
            <td><strong>${formatMoney(item.amount)}</strong></td>
            <td>${item.description || '-'}</td>
        </tr>
    `).join('');
}

// Display expense table
function displayExpense(data) {
    const tbody = document.getElementById('expense-tbody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">কোনো ব্যয়ের তথ্য পাওয়া যায়নি</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr class="clickable-row" onclick="showExpenseDetail(${index})">
            <td>${formatDate(item.date)}</td>
            <td>${item.category}</td>
            <td><strong>${formatMoney(item.amount)}</strong></td>
            <td>${item.description || '-'}</td>
        </tr>
    `).join('');
}

// Update summary cards
function updateSummary() {
    const filteredIncome = filterData(incomeData);
    const filteredExpense = filterData(expenseData);
    
    const totalIncome = filteredIncome.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalExpense = filteredExpense.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const balance = totalIncome - totalExpense;
    
    document.getElementById('total-income').textContent = formatMoney(totalIncome);
    document.getElementById('total-expense').textContent = formatMoney(totalExpense);
    document.getElementById('balance').textContent = formatMoney(balance);
    
    // Update balance card color
    const balanceCard = document.querySelector('.balance-card .amount');
    balanceCard.style.color = balance < 0 ? '#ef4444' : balance > 0 ? '#10b981' : '#6b7280';
}

// Update category breakdown
function updateCategoryBreakdown() {
    updateIncomeBreakdown();
    updateExpenseBreakdown();
}

// Update income breakdown
function updateIncomeBreakdown() {
    const filteredIncome = filterData(incomeData);
    const sourceTotals = {};
    filteredIncome.forEach(item => {
        const source = item.source || 'অন্যান্য';
        sourceTotals[source] = (sourceTotals[source] || 0) + parseFloat(item.amount);
    });
    
    const breakdownContainer = document.getElementById('income-category-breakdown');
    
    if (Object.keys(sourceTotals).length === 0) {
        breakdownContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1 / -1; text-align: center;">কোনো আয়ের তথ্য পাওয়া যায়নি</p>';
        return;
    }
    
    breakdownContainer.innerHTML = Object.entries(sourceTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([source, amount]) => `
            <div class="breakdown-item income-breakdown-item">
                <h4>${source}</h4>
                <p>${formatMoney(amount)}</p>
            </div>
        `).join('');
}

// Update expense breakdown
function updateExpenseBreakdown() {
    const filteredExpense = filterData(expenseData);
    const categoryTotals = {};
    filteredExpense.forEach(item => {
        const category = item.category || 'অন্যান্য';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(item.amount);
    });
    
    const breakdownContainer = document.getElementById('expense-category-breakdown');
    
    if (Object.keys(categoryTotals).length === 0) {
        breakdownContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1 / -1; text-align: center;">কোনো খাত পাওয়া যায়নি</p>';
        return;
    }
    
    breakdownContainer.innerHTML = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `
            <div class="breakdown-item expense-breakdown-item">
                <h4>${category}</h4>
                <p>${formatMoney(amount)}</p>
            </div>
        `).join('');
}

// Filter data by month/year
function filterData(data) {
    return data.filter(item => {
        const itemDate = new Date(item.date);
        const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
        const itemYear = String(itemDate.getFullYear());
        
        if (currentFilter.month && itemMonth !== currentFilter.month) return false;
        if (currentFilter.year && itemYear !== currentFilter.year) return false;
        
        return true;
    });
}

// Apply filter
function applyFilter() {
    currentFilter.month = document.getElementById('month-filter').value;
    currentFilter.year = document.getElementById('year-filter').value;
    
    displayIncome(filterData(incomeData));
    displayExpense(filterData(expenseData));
    updateSummary();
    updateCategoryBreakdown();
    
    showToast('ফিল্টার প্রয়োগ করা হয়েছে', 'success');
}

// Reset filter
function resetFilter() {
    currentFilter = { month: '', year: '' };
    document.getElementById('month-filter').value = '';
    document.getElementById('year-filter').value = '';
    
    displayIncome(incomeData);
    displayExpense(expenseData);
    updateSummary();
    updateCategoryBreakdown();
    
    showToast('ফিল্টার রিসেট করা হয়েছে', 'success');
}

// Switch tabs
function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'income') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('income-section').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('expense-section').classList.add('active');
    }
}

// Switch breakdown tabs
function switchBreakdownTab(tabName) {
    document.querySelectorAll('.breakdown-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.breakdown-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'income') {
        document.querySelector('.breakdown-tab-btn:first-child').classList.add('active');
        document.getElementById('income-breakdown').classList.add('active');
    } else {
        document.querySelector('.breakdown-tab-btn:last-child').classList.add('active');
        document.getElementById('expense-breakdown').classList.add('active');
    }
}

// Open add modal
function openAddModal(type) {
    if (!isAdmin) {
        showToast('শুধুমাত্র Admin আয়-ব্যয় যোগ করতে পারবেন। অনুগ্রহ করে লগইন করুন।', 'error');
        setTimeout(() => window.location.href = 'admin.html', 2000);
        return;
    }
    
    document.getElementById('add-modal').style.display = 'block';
    document.getElementById('form-type').value = type;
    document.getElementById('add-form').reset();
    setDefaultDate();
    
    if (type === 'income') {
        document.getElementById('modal-title').textContent = 'নতুন আয় যোগ করুন';
        document.querySelector('label[for="source"]').textContent = 'উৎস *';
    } else {
        document.getElementById('modal-title').textContent = 'নতুন ব্যয় যোগ করুন';
        document.querySelector('label[for="source"]').textContent = 'খাত *';
    }
}

// Close add modal
function closeAddModal() {
    document.getElementById('add-modal').style.display = 'none';
}

// Submit form
async function submitForm(event) {
    event.preventDefault();
    
    const type = document.getElementById('form-type').value;
    const source = document.getElementById('source').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    
    const formData = new FormData();
    formData.append('type', type);
    formData.append('source', source);
    formData.append('amount', amount);
    formData.append('date', date);
    
    const descField = document.getElementById('description');
    formData.append('description', descField ? descField.value : '');
    
    try {
        const response = await fetch('add_finance.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(type === 'income' ? 'আয় সফলভাবে যোগ হয়েছে' : 'ব্যয় সফলভাবে যোগ হয়েছে', 'success');
            closeAddModal();
            loadData();
        } else {
            showToast('ত্রুটি: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('ডেটা সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
    }
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('bn-BD', options);
}

function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('bn-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ৳';
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => toast.style.display = 'none', 3000);
}

// Show income detail modal
function showIncomeDetail(index) {
    const data = incomeData[index];
    if (!data) return;
    
    document.getElementById('detail-title').textContent = 'আয়ের বিস্তারিত';
    document.getElementById('detail-label-source').textContent = 'উৎস:';
    document.getElementById('detail-date').textContent = formatDate(data.date);
    document.getElementById('detail-source').textContent = data.source || '-';
    document.getElementById('detail-amount').textContent = formatMoney(data.amount);
    document.getElementById('detail-description').textContent = data.description || 'কোনো বিবরণ নেই';
    
    document.getElementById('detail-modal').style.display = 'block';
}

// Show expense detail modal
function showExpenseDetail(index) {
    const data = expenseData[index];
    if (!data) return;
    
    document.getElementById('detail-title').textContent = 'ব্যয়ের বিস্তারিত';
    document.getElementById('detail-label-source').textContent = 'খাত:';
    document.getElementById('detail-date').textContent = formatDate(data.date);
    document.getElementById('detail-source').textContent = data.category || '-';
    document.getElementById('detail-amount').textContent = formatMoney(data.amount);
    document.getElementById('detail-description').textContent = data.description || 'কোনো বিবরণ নেই';
    
    document.getElementById('detail-modal').style.display = 'block';
}

// Close detail modal
function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('add-modal');
    const detailModal = document.getElementById('detail-modal');
    
    if (event.target === addModal) closeAddModal();
    if (event.target === detailModal) closeDetailModal();
}

async function loadIncome() {
    try {
        const response = await fetch('get_finance.php?type=income');
        const result = await response.json();
        
        if (result.success) {
            incomeData = result.data;
            displayIncome(incomeData);
        } else {
            document.getElementById('income-tbody').innerHTML = '<tr><td colspan="4" class="loading">কোনো আয়ের তথ্য পাওয়া যায়নি</td></tr>';
        }
    } catch (error) {
        showToast('আয়ের তথ্য লোড করতে সমস্যা হয়েছে', 'error');
    }
}

async function loadExpense() {
    try {
        const response = await fetch('get_finance.php?type=expense');
        const result = await response.json();
        
        if (result.success) {
            expenseData = result.data;
            displayExpense(expenseData);
        } else {
            document.getElementById('expense-tbody').innerHTML = '<tr><td colspan="4" class="loading">কোনো ব্যয়ের তথ্য পাওয়া যায়নি</td></tr>';
        }
    } catch (error) {
        showToast('ব্যয়ের তথ্য লোড করতে সমস্যা হয়েছে', 'error');
    }
}

function displayIncome(data) {
    const tbody = document.getElementById('income-tbody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">কোনো আয়ের তথ্য পাওয়া যায়নি</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr class="clickable-row" onclick="showIncomeDetail(${index})">
            <td>${formatDate(item.date)}</td>
            <td>${item.source}</td>
            <td><strong>${formatMoney(item.amount)}</strong></td>
            <td>${item.description || '-'}</td>
        </tr>
    `).join('');
}

function displayExpense(data) {
    const tbody = document.getElementById('expense-tbody');
    
    if (data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="loading">কোনো ব্যয়ের তথ্য পাওয়া যায়নি</td></tr>';
        return;
    }
    
    tbody.innerHTML = data.map((item, index) => `
        <tr class="clickable-row" onclick="showExpenseDetail(${index})">
            <td>${formatDate(item.date)}</td>
            <td>${item.category}</td>
            <td><strong>${formatMoney(item.amount)}</strong></td>
            <td>${item.description || '-'}</td>
        </tr>
    `).join('');
}

function updateSummary() {
    const filteredIncome = filterData(incomeData);
    const filteredExpense = filterData(expenseData);
    
    const totalIncome = filteredIncome.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const totalExpense = filteredExpense.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    const balance = totalIncome - totalExpense;
    
    document.getElementById('total-income').textContent = formatMoney(totalIncome);
    document.getElementById('total-expense').textContent = formatMoney(totalExpense);
    document.getElementById('balance').textContent = formatMoney(balance);
    
    const balanceCard = document.querySelector('.balance-card .amount');
    balanceCard.style.color = balance < 0 ? '#ef4444' : balance > 0 ? '#10b981' : '#6b7280';
}

function updateCategoryBreakdown() {
    updateIncomeBreakdown();
    updateExpenseBreakdown();
}

function updateIncomeBreakdown() {
    const filteredIncome = filterData(incomeData);
    const sourceTotals = {};
    filteredIncome.forEach(item => {
        const source = item.source || 'অন্যান্য';
        sourceTotals[source] = (sourceTotals[source] || 0) + parseFloat(item.amount);
    });
    
    const breakdownContainer = document.getElementById('income-category-breakdown');
    
    if (Object.keys(sourceTotals).length === 0) {
        breakdownContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1 / -1; text-align: center;">কোনো আয়ের তথ্য পাওয়া যায়নি</p>';
        return;
    }
    
    breakdownContainer.innerHTML = Object.entries(sourceTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([source, amount]) => `
            <div class="breakdown-item income-breakdown-item">
                <h4>${source}</h4>
                <p>${formatMoney(amount)}</p>
            </div>
        `).join('');
}

function updateExpenseBreakdown() {
    const filteredExpense = filterData(expenseData);
    const categoryTotals = {};
    filteredExpense.forEach(item => {
        const category = item.category || 'অন্যান্য';
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(item.amount);
    });
    
    const breakdownContainer = document.getElementById('expense-category-breakdown');
    
    if (Object.keys(categoryTotals).length === 0) {
        breakdownContainer.innerHTML = '<p style="color: #9ca3af; grid-column: 1 / -1; text-align: center;">কোনো খাত পাওয়া যায়নি</p>';
        return;
    }
    
    breakdownContainer.innerHTML = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .map(([category, amount]) => `
            <div class="breakdown-item expense-breakdown-item">
                <h4>${category}</h4>
                <p>${formatMoney(amount)}</p>
            </div>
        `).join('');
}

// Filter data by month/year
function filterData(data) {
    return data.filter(item => {
        const itemDate = new Date(item.date);
        const itemMonth = String(itemDate.getMonth() + 1).padStart(2, '0');
        const itemYear = String(itemDate.getFullYear());
        
        if (currentFilter.month && itemMonth !== currentFilter.month) return false;
        if (currentFilter.year && itemYear !== currentFilter.year) return false;
        
        return true;
    });
}

function applyFilter() {
    currentFilter.month = document.getElementById('month-filter').value;
    currentFilter.year = document.getElementById('year-filter').value;
    
    displayIncome(filterData(incomeData));
    displayExpense(filterData(expenseData));
    updateSummary();
    updateCategoryBreakdown();
    
    showToast('ফিল্টার প্রয়োগ করা হয়েছে', 'success');
}

function resetFilter() {
    currentFilter = { month: '', year: '' };
    document.getElementById('month-filter').value = '';
    document.getElementById('year-filter').value = '';
    
    displayIncome(incomeData);
    displayExpense(expenseData);
    updateSummary();
    updateCategoryBreakdown();
    
    showToast('ফিল্টার রিসেট করা হয়েছে', 'success');
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'income') {
        document.querySelector('.tab-btn:first-child').classList.add('active');
        document.getElementById('income-section').classList.add('active');
    } else {
        document.querySelector('.tab-btn:last-child').classList.add('active');
        document.getElementById('expense-section').classList.add('active');
    }
}

function switchBreakdownTab(tabName) {
    document.querySelectorAll('.breakdown-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.breakdown-content').forEach(content => content.classList.remove('active'));
    
    if (tabName === 'income') {
        document.querySelector('.breakdown-tab-btn:first-child').classList.add('active');
        document.getElementById('income-breakdown').classList.add('active');
    } else {
        document.querySelector('.breakdown-tab-btn:last-child').classList.add('active');
        document.getElementById('expense-breakdown').classList.add('active');
    }
}

function openAddModal(type) {
    if (!isAdmin) {
        showToast('শুধুমাত্র Admin আয়-ব্যয় যোগ করতে পারবেন। অনুগ্রহ করে লগইন করুন।', 'error');
        setTimeout(() => window.location.href = 'admin.html', 2000);
        return;
    }
    
    document.getElementById('add-modal').style.display = 'block';
    document.getElementById('form-type').value = type;
    document.getElementById('add-form').reset();
    setDefaultDate();
    
    if (type === 'income') {
        document.getElementById('modal-title').textContent = 'নতুন আয় যোগ করুন';
        document.querySelector('label[for="source"]').textContent = 'উৎস *';
    } else {
        document.getElementById('modal-title').textContent = 'নতুন ব্যয় যোগ করুন';
        document.querySelector('label[for="source"]').textContent = 'খাত *';
    }
}

function closeAddModal() {
    document.getElementById('add-modal').style.display = 'none';
}

async function submitForm(event) {
    event.preventDefault();
    
    const type = document.getElementById('form-type').value;
    const source = document.getElementById('source').value;
    const amount = document.getElementById('amount').value;
    const date = document.getElementById('date').value;
    
    const formData = new FormData();
    formData.append('type', type);
    formData.append('source', source);
    formData.append('amount', amount);
    formData.append('date', date);
    
    const descField = document.getElementById('description');
    formData.append('description', descField ? descField.value : '');
    
    try {
        const response = await fetch('add_finance.php', {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(type === 'income' ? 'আয় সফলভাবে যোগ হয়েছে' : 'ব্যয় সফলভাবে যোগ হয়েছে', 'success');
            closeAddModal();
            loadData();
        } else {
            showToast('ত্রুটি: ' + result.message, 'error');
        }
    } catch (error) {
        showToast('ডেটা সংরক্ষণ করতে সমস্যা হয়েছে', 'error');
    }
}

// Helper functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('bn-BD', options);
}

function formatMoney(amount) {
    return parseFloat(amount).toLocaleString('bn-BD', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }) + ' ৳';
}

function setDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.style.display = 'block';
    
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
}

function showIncomeDetail(index) {
    const data = incomeData[index];
    if (!data) return;
    
    document.getElementById('detail-title').textContent = 'আয়ের বিস্তারিত';
    document.getElementById('detail-label-source').textContent = 'উৎস:';
    document.getElementById('detail-date').textContent = formatDate(data.date);
    document.getElementById('detail-source').textContent = data.source || '-';
    document.getElementById('detail-amount').textContent = formatMoney(data.amount);
    document.getElementById('detail-description').textContent = data.description || 'কোনো বিবরণ নেই';
    
    document.getElementById('detail-modal').style.display = 'block';
}

function showExpenseDetail(index) {
    const data = expenseData[index];
    if (!data) return;
    
    document.getElementById('detail-title').textContent = 'ব্যয়ের বিস্তারিত';
    document.getElementById('detail-label-source').textContent = 'খাত:';
    document.getElementById('detail-date').textContent = formatDate(data.date);
    document.getElementById('detail-source').textContent = data.category || '-';
    document.getElementById('detail-amount').textContent = formatMoney(data.amount);
    document.getElementById('detail-description').textContent = data.description || 'কোনো বিবরণ নেই';
    
    document.getElementById('detail-modal').style.display = 'block';
}

function closeDetailModal() {
    document.getElementById('detail-modal').style.display = 'none';
}

window.onclick = function(event) {
    const addModal = document.getElementById('add-modal');
    const detailModal = document.getElementById('detail-modal');
    
    if (event.target === addModal) closeAddModal();
    if (event.target === detailModal) closeDetailModal();
}
