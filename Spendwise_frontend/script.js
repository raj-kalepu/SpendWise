// Global state for data and UI
let transactions = JSON.parse(localStorage.getItem('spendwise_transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('spendwise_budgets')) || [];
let loans = JSON.parse(localStorage.getItem('spendwise_loans')) || [];
// userProfile will be initialized after checking onboarding status
let userProfile = null;

let currentPage = 'dashboard';
let expenseChart = null; // To store the Chart.js instance

// --- Date Formatting Utility Functions ---

/**
 * Converts a date string from YYYY-MM-DD to DD-MM-YYYY.
 * @param {string} dateString - Date string in YYYY-MM-DD format.
 * @returns {string} Date string in DD-MM-YYYY format.
 */
function formatDateForDisplay(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString; // Return as is if format is unexpected
}

/**
 * Converts a date string from DD-MM-YYYY to YYYY-MM-DD.
 * @param {string} dateString - Date string in DD-MM-YYYY format.
 * @returns {string} Date string in YYYY-MM-DD format.
 */
function parseDateForStorage(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString; // Return as is if format is unexpected
}

// --- General Utility Functions ---

/**
 * Generates a unique ID for new items.
 * @returns {string} A unique ID.
 */
function generateUniqueId() {
    return '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Saves all data to localStorage.
 */
function saveData() {
    localStorage.setItem('spendwise_transactions', JSON.stringify(transactions));
    localStorage.setItem('spendwise_budgets', JSON.stringify(budgets));
    localStorage.setItem('spendwise_loans', JSON.stringify(loans));
    localStorage.setItem('spendwise_user_profile', JSON.stringify(userProfile));
}

/**
 * Formats a number as currency based on the selected currency.
 * @param {number} amount - The amount to format.
 * @returns {string} The formatted currency string.
 */
function formatCurrency(amount) {
    const currencyOptions = {
        'USD': { symbol: '$', locale: 'en-US' },
        'EUR': { symbol: '€', locale: 'de-DE' },
        'INR': { symbol: '₹', locale: 'en-IN' }
    };
    const { symbol, locale } = currencyOptions[userProfile.currency] || currencyOptions['INR']; // Default to INR
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: userProfile.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

/**
 * Displays a custom message box instead of alert().
 * @param {string} title - The title of the message box.
 * @param {string} message - The message to display.
 */
function showMessageBox(title, message) {
    document.getElementById('messageBoxTitle').textContent = title;
    document.getElementById('messageBoxMessage').textContent = message;
    document.getElementById('messageBox').style.display = 'flex';
}

/**
 * Opens a modal by setting its display style to 'flex'.
 * @param {string} modalId - The ID of the modal to open.
 */
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'flex';
}

/**
 * Closes a modal by setting its display style to 'none'.
 * @param {string} modalId - The ID of the modal to close.
 */
function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// --- Onboarding Functions ---

/**
 * Initializes user profile based on localStorage or shows onboarding.
 */
function initializeUserProfile() {
    userProfile = JSON.parse(localStorage.getItem('spendwise_user_profile'));
    const onboardingCompletedFlag = localStorage.getItem('spendwise_onboarding_completed');

    if (!userProfile) { // No existing profile
        if (onboardingCompletedFlag === 'true') { // User previously skipped or used dummy
            userProfile = {
                username: 'John Doe',
                email: 'john.doe@example.com',
                mobile: '+1234567890',
                currency: 'INR'
            };
            saveData(); // Save this dummy profile to localStorage
            renderCurrentPage(); // Render app content
        } else { // First time user, show onboarding modal
            openModal('onboardingModal');
            // Set up onboarding form handlers
            document.getElementById('onboardingForm').onsubmit = handleOnboardingSubmit;
            document.getElementById('skipOnboardingBtn').onclick = skipOnboarding;
        }
    } else { // Profile already exists, just render the app
        renderCurrentPage();
    }
}

/**
 * Handles the submission of the onboarding form.
 * @param {Event} event - The form submission event.
 */
function handleOnboardingSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('onboardingName').value.trim();
    const email = document.getElementById('onboardingEmail').value.trim();

    userProfile = {
        username: name || 'John Doe', // Use dummy if empty
        email: email || 'john.doe@example.com', // Use dummy if empty
        mobile: '+1234567890', // Default mobile
        currency: 'INR' // Default currency
    };
    localStorage.setItem('spendwise_onboarding_completed', 'true'); // Mark onboarding as completed
    saveData();
    closeModal('onboardingModal');
    renderCurrentPage(); // Render app content
}

/**
 * Skips the onboarding process and uses dummy data.
 */
function skipOnboarding() {
    userProfile = {
        username: 'John Doe',
        email: 'john.doe@example.com',
        mobile: '+1234567890',
        currency: 'INR'
    };
    localStorage.setItem('spendwise_onboarding_completed', 'true'); // Mark onboarding as completed
    saveData();
    closeModal('onboardingModal');
    renderCurrentPage(); // Render app content
}


// --- Page Rendering Functions ---

/**
 * Renders the Dashboard page content.
 */
function renderDashboard() {
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-8 text-gray-900">Dashboard</h1>

        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-6 rounded-lg shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold">Total Income</h3>
                    <i class="fas fa-arrow-down text-2xl opacity-75"></i>
                </div>
                <p class="text-3xl font-bold" id="totalIncome">Loading...</p>
            </div>
            <div class="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-lg shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold">Total Expenses</h3>
                    <i class="fas fa-arrow-up text-2xl opacity-75"></i>
                </div>
                <p class="text-3xl font-bold" id="totalExpenses">Loading...</p>
            </div>
            <div class="bg-gradient-to-br from-green-500 to-green-600 text-white p-6 rounded-lg shadow-lg">
                <div class="flex items-center justify-between mb-2">
                    <h3 class="text-lg font-semibold">Balance</h3>
                    <i class="fas fa-balance-scale text-2xl opacity-75"></i>
                </div>
                <p class="text-3xl font-bold" id="accountBalance">Loading...</p>
            </div>
        </div>

        <!-- Spending Patterns Chart & Budget Alerts -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold mb-4 text-gray-800">Spending by Category</h3>
                <div class="relative h-64">
                    <canvas id="expenseChart"></canvas>
                </div>
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h3 class="text-xl font-bold mb-4 text-gray-800">Budget Alerts</h3>
                <div id="budgetAlerts" class="space-y-3">
                    <p class="text-gray-600">No budget alerts at the moment.</p>
                </div>
            </div>
        </div>

        <!-- Recent Transactions -->
        <div class="bg-white p-6 rounded-lg shadow-md">
            <h3 class="text-xl font-bold mb-4 text-gray-800">Recent Transactions</h3>
            <div class="overflow-x-auto">
                <table class="min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        </tr>
                    </thead>
                    <tbody id="recentTransactionsTableBody" class="bg-white divide-y divide-gray-200">
                        <!-- Recent transactions will be loaded here -->
                    </tbody>
                </table>
            </div>
            <p id="noRecentTransactions" class="text-gray-600 text-center py-4 hidden">No recent transactions.</p>
        </div>
    `;
    updateDashboardSummary();
    renderExpenseChart();
    renderBudgetAlerts();
    renderRecentTransactions();
}

/**
 * Updates the summary cards on the dashboard.
 */
function updateDashboardSummary() {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const accountBalance = totalIncome - totalExpenses;

    document.getElementById('totalIncome').textContent = formatCurrency(totalIncome);
    document.getElementById('totalExpenses').textContent = formatCurrency(totalExpenses);
    document.getElementById('accountBalance').textContent = formatCurrency(accountBalance);
}

/**
 * Renders the expense distribution pie chart using Chart.js.
 */
function renderExpenseChart() {
    if (expenseChart) {
        expenseChart.destroy(); // Destroy previous chart instance if exists
    }

    const expenseCategories = {};
    transactions.filter(t => t.type === 'expense').forEach(t => {
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + parseFloat(t.amount);
    });

    const labels = Object.keys(expenseCategories);
    const data = Object.values(expenseCategories);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    expenseChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22'
                ],
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                label += formatCurrency(context.parsed);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Renders budget alerts on the dashboard.
 */
function renderBudgetAlerts() {
    const budgetAlertsDiv = document.getElementById('budgetAlerts');
    budgetAlertsDiv.innerHTML = ''; // Clear previous alerts

    let hasAlerts = false;
    budgets.forEach(budget => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === budget.category)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        if (spent > parseFloat(budget.limit)) {
            hasAlerts = true;
            budgetAlertsDiv.innerHTML += `
                <div class="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p class="font-bold">Budget Overrun!</p>
                    <p>You have spent ${formatCurrency(spent)} in '${budget.category}' category, exceeding your budget of ${formatCurrency(parseFloat(budget.limit))}.</p>
                </div>
            `;
        } else if (spent / parseFloat(budget.limit) >= 0.8 && parseFloat(budget.limit) > 0) {
             hasAlerts = true;
            budgetAlertsDiv.innerHTML += `
                <div class="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded-md" role="alert">
                    <p class="font-bold">Budget Nearing Limit!</p>
                    <p>You have spent ${formatCurrency(spent)} in '${budget.category}' category, which is close to your budget of ${formatCurrency(parseFloat(budget.limit))}.</p>
                </div>
            `;
        }
    });

    if (!hasAlerts) {
        budgetAlertsDiv.innerHTML = '<p class="text-gray-600">No budget alerts at the moment.</p>';
    }
}

/**
 * Renders recent transactions on the dashboard.
 */
function renderRecentTransactions() {
    const recentTransactionsTableBody = document.getElementById('recentTransactionsTableBody');
    recentTransactionsTableBody.innerHTML = ''; // Clear previous entries

    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recent = sortedTransactions.slice(0, 5); // Get up to 5 most recent

    if (recent.length === 0) {
        document.getElementById('noRecentTransactions').classList.remove('hidden');
        return;
    } else {
        document.getElementById('noRecentTransactions').classList.add('hidden');
    }

    recent.forEach(t => {
        const row = document.createElement('tr');
        const amountClass = t.type === 'income' ? 'text-green-600' : 'text-red-600';
        row.innerHTML = `
            <td class="px-4 py-2 whitespace-nowrap">${formatDateForDisplay(t.date)}</td>
            <td class="px-4 py-2 whitespace-nowrap">${t.description || '-'}</td>
            <td class="px-4 py-2 whitespace-nowrap">${t.category}</td>
            <td class="px-4 py-2 whitespace-nowrap ${amountClass}">${formatCurrency(parseFloat(t.amount))}</td>
            <td class="px-4 py-2 whitespace-nowrap capitalize">${t.type}</td>
        `;
        recentTransactionsTableBody.appendChild(row);
    });
}


/**
 * Renders the Transactions page content.
 */
function renderTransactions() {
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-8 text-gray-900">Transactions</h1>

        <div class="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
            <div class="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                <input type="text" id="transactionFilterDateRange" class="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full md:w-48" placeholder="Filter by Date Range">
                <input type="text" id="transactionSearch" class="p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 w-full md:w-64" placeholder="Search by description or category">
            </div>
            <button id="addTransactionBtn" class="btn-primary w-full md:w-auto flex items-center justify-center">
                <i class="fas fa-plus mr-2"></i> Add Transaction
            </button>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="transactionsTableBody" class="bg-white divide-y divide-gray-200">
                    <!-- Transactions will be loaded here -->
                </tbody>
            </table>
            <p id="noTransactions" class="text-gray-600 text-center py-4 hidden">No transactions recorded yet.</p>
        </div>
    `;

    document.getElementById('addTransactionBtn').onclick = () => showTransactionModal();
    document.getElementById('transactionForm').onsubmit = handleTransactionSubmit;

    // Initialize Flatpickr for date range filtering
    flatpickr("#transactionFilterDateRange", {
        mode: "range",
        dateFormat: "d-m-Y", // Set date format for Flatpickr
        onChange: function(selectedDates, dateStr, instance) {
            filterAndRenderTransactions();
        }
    });

    document.getElementById('transactionSearch').addEventListener('input', filterAndRenderTransactions);

    renderTransactionsTable();
}

/**
 * Renders the transactions table based on current filters.
 */
function renderTransactionsTable() {
    const transactionsTableBody = document.getElementById('transactionsTableBody');
    transactionsTableBody.innerHTML = ''; // Clear previous entries

    const searchKeyword = document.getElementById('transactionSearch').value.toLowerCase();
    const dateRangeInput = document.getElementById('transactionFilterDateRange').value;
    let startDate = null;
    let endDate = null;

    if (dateRangeInput) {
        const dates = dateRangeInput.split(' to ');
        if (dates.length === 2) {
            startDate = new Date(parseDateForStorage(dates[0]));
            endDate = new Date(parseDateForStorage(dates[1]));
        } else if (dates.length === 1) {
            startDate = new Date(parseDateForStorage(dates[0]));
            endDate = new Date(parseDateForStorage(dates[0]));
        }
    }

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = (t.description && t.description.toLowerCase().includes(searchKeyword)) ||
                              t.category.toLowerCase().includes(searchKeyword);

        const transactionDate = new Date(t.date); // Date is already in YYYY-MM-DD for comparison
        const matchesDate = (!startDate || transactionDate >= startDate) &&
                            (!endDate || transactionDate <= endDate);

        return matchesSearch && matchesDate;
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date descending

    if (filteredTransactions.length === 0) {
        document.getElementById('noTransactions').classList.remove('hidden');
        return;
    } else {
        document.getElementById('noTransactions').classList.add('hidden');
    }

    filteredTransactions.forEach(t => {
        const row = document.createElement('tr');
        const amountClass = t.type === 'income' ? 'text-green-600' : 'text-red-600';
        row.innerHTML = `
            <td class="px-4 py-2 whitespace-nowrap">${formatDateForDisplay(t.date)}</td>
            <td class="px-4 py-2 whitespace-nowrap">${t.description || '-'}</td>
            <td class="px-4 py-2 whitespace-nowrap">${t.category}</td>
            <td class="px-4 py-2 whitespace-nowrap ${amountClass}">${formatCurrency(parseFloat(t.amount))}</td>
            <td class="px-4 py-2 whitespace-nowrap capitalize">${t.type}</td>
            <td class="px-4 py-2 whitespace-nowrap">
                <button onclick="showTransactionModal('${t.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTransaction('${t.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        transactionsTableBody.appendChild(row);
    });
}

/**
 * Filters and re-renders the transaction table.
 */
function filterAndRenderTransactions() {
    renderTransactionsTable();
    updateDashboardSummary(); // Update dashboard summary if transactions change
    renderExpenseChart(); // Update chart if transactions change
    renderBudgetAlerts(); // Update alerts if transactions change
}

/**
 * Shows the transaction modal for adding or editing.
 * @param {string} [id] - The ID of the transaction to edit. If not provided, a new transaction is added.
 */
function showTransactionModal(id = null) {
    const modalTitle = document.getElementById('transactionModalTitle');
    const form = document.getElementById('transactionForm');
    const transactionIdInput = document.getElementById('transactionId');
    const amountInput = document.getElementById('transactionAmount');
    const categoryInput = document.getElementById('transactionCategory');
    const typeInput = document.getElementById('transactionType');
    const dateInput = document.getElementById('transactionDate');
    const descriptionInput = document.getElementById('transactionDescription');

    form.reset(); // Clear form fields
    transactionIdInput.value = ''; // Clear ID

    let defaultDateValue = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for new transactions

    if (id) {
        modalTitle.textContent = 'Edit Transaction';
        const transaction = transactions.find(t => t.id === id);
        if (transaction) {
            transactionIdInput.value = transaction.id;
            amountInput.value = transaction.amount;
            categoryInput.value = transaction.category;
            typeInput.value = transaction.type;
            defaultDateValue = transaction.date; // Use stored YYYY-MM-DD date
            descriptionInput.value = transaction.description;
        }
    } else {
        modalTitle.textContent = 'Add Transaction';
    }

    // Initialize Flatpickr for the date input
    flatpickr(dateInput, {
        dateFormat: "d-m-Y", // Set date format for Flatpickr input
        defaultDate: formatDateForDisplay(defaultDateValue) // Display in DD-MM-YYYY
    });

    openModal('transactionModal');
}

/**
 * Handles form submission for transactions (add/edit).
 * @param {Event} event - The form submission event.
 */
function handleTransactionSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('transactionId').value;
    const amount = parseFloat(document.getElementById('transactionAmount').value);
    const category = document.getElementById('transactionCategory').value;
    const type = document.getElementById('transactionType').value;
    // Parse date from DD-MM-YYYY to YYYY-MM-DD for storage
    const date = parseDateForStorage(document.getElementById('transactionDate').value);
    const description = document.getElementById('transactionDescription').value;

    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Input Error', 'Please enter a valid amount.');
        return;
    }
    if (!category) {
        showMessageBox('Input Error', 'Please select a category.');
        return;
    }
    if (!date) {
        showMessageBox('Input Error', 'Please select a date.');
        return;
    }

    if (id) {
        // Edit existing transaction
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = { id, amount, category, type, date, description };
            showMessageBox('Success', 'Transaction updated successfully!');
        }
    } else {
        // Add new transaction
        const newTransaction = {
            id: generateUniqueId(),
            amount,
            category,
            type,
            date,
            description
        };
        transactions.push(newTransaction);
        showMessageBox('Success', 'Transaction added successfully!');
    }
    saveData();
    closeModal('transactionModal');
    renderTransactionsTable(); // Re-render table after change
    updateDashboardSummary(); // Update dashboard summary if transactions change
    renderExpenseChart(); // Update chart if transactions change
    renderBudgetAlerts(); // Update alerts if transactions change
}

/**
 * Deletes a transaction.
 * @param {string} id - The ID of the transaction to delete.
 */
function deleteTransaction(id) {
    if (confirm('Are you sure you want to delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        showMessageBox('Success', 'Transaction deleted successfully!');
        renderTransactionsTable(); // Re-render table after deletion
        updateDashboardSummary(); // Update dashboard summary
        renderExpenseChart(); // Update chart
        renderBudgetAlerts(); // Update alerts
    }
}

/**
 * Renders the Budgets page content.
 */
function renderBudgets() {
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-8 text-gray-900">Budgets</h1>

        <div class="flex justify-end mb-6">
            <button id="addBudgetBtn" class="btn-primary flex items-center justify-center">
                <i class="fas fa-plus mr-2"></i> Create Budget
            </button>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remaining</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progress</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="budgetsTableBody" class="bg-white divide-y divide-gray-200">
                    <!-- Budgets will be loaded here -->
                </tbody>
            </table>
            <p id="noBudgets" class="text-gray-600 text-center py-4 hidden">No budgets created yet.</p>
        </div>
    `;

    document.getElementById('addBudgetBtn').onclick = () => showBudgetModal();
    document.getElementById('budgetForm').onsubmit = handleBudgetSubmit;

    renderBudgetsTable();
}

/**
 * Renders the budgets table.
 */
function renderBudgetsTable() {
    const budgetsTableBody = document.getElementById('budgetsTableBody');
    budgetsTableBody.innerHTML = ''; // Clear previous entries

    if (budgets.length === 0) {
        document.getElementById('noBudgets').classList.remove('hidden');
        return;
    } else {
        document.getElementById('noBudgets').classList.add('hidden');
    }

    budgets.forEach(b => {
        const spent = transactions
            .filter(t => t.type === 'expense' && t.category === b.category)
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const remaining = parseFloat(b.limit) - spent;
        const progress = (spent / parseFloat(b.limit)) * 100;
        const progressBarColor = progress > 100 ? 'bg-red-500' : (progress > 80 ? 'bg-yellow-500' : 'bg-blue-500');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 whitespace-nowrap">${b.category}</td>
            <td class="px-4 py-2 whitespace-nowrap">${formatCurrency(parseFloat(b.limit))}</td>
            <td class="px-4 py-2 whitespace-nowrap">${formatCurrency(spent)}</td>
            <td class="px-4 py-2 whitespace-nowrap ${remaining < 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(remaining)}</td>
            <td class="px-4 py-2 whitespace-nowrap">
                <div class="w-full bg-gray-200 rounded-full h-2.5">
                    <div class="${progressBarColor} h-2.5 rounded-full" style="width: ${Math.min(100, progress)}%;"></div>
                </div>
                <span class="text-xs text-gray-600">${progress.toFixed(1)}%</span>
            </td>
            <td class="px-4 py-2 whitespace-nowrap">
                <button onclick="showBudgetModal('${b.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteBudget('${b.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        budgetsTableBody.appendChild(row);
    });
}

/**
 * Shows the budget modal for adding or editing.
 * @param {string} [id] - The ID of the budget to edit. If not provided, a new budget is added.
 */
function showBudgetModal(id = null) {
    const modalTitle = document.getElementById('budgetModalTitle');
    const form = document.getElementById('budgetForm');
    const budgetIdInput = document.getElementById('budgetId');
    const categoryInput = document.getElementById('budgetCategory');
    const limitInput = document.getElementById('budgetLimit');

    form.reset();
    budgetIdInput.value = '';

    if (id) {
        modalTitle.textContent = 'Edit Budget';
        const budget = budgets.find(b => b.id === id);
        if (budget) {
            budgetIdInput.value = budget.id;
            categoryInput.value = budget.category;
            limitInput.value = budget.limit;
        }
    } else {
        modalTitle.textContent = 'Create Budget';
    }
    openModal('budgetModal');
}

/**
 * Handles form submission for budgets (add/edit).
 * @param {Event} event - The form submission event.
 */
function handleBudgetSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('budgetId').value;
    const category = document.getElementById('budgetCategory').value;
    const limit = parseFloat(document.getElementById('budgetLimit').value);

    if (!category) {
        showMessageBox('Input Error', 'Please select a category.');
        return;
    }
    if (isNaN(limit) || limit < 0) {
        showMessageBox('Input Error', 'Please enter a valid limit (non-negative).');
        return;
    }

    if (id) {
        // Edit existing budget
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = { id, category, limit };
            showMessageBox('Success', 'Budget updated successfully!');
        }
    } else {
        // Add new budget
        // Check if budget for this category already exists
        if (budgets.some(b => b.category === category)) {
            showMessageBox('Error', `A budget for '${category}' already exists. Please edit the existing one.`);
            return;
        }
        const newBudget = {
            id: generateUniqueId(),
            category,
            limit
        };
        budgets.push(newBudget);
        showMessageBox('Success', 'Budget created successfully!');
    }
    saveData();
    closeModal('budgetModal');
    renderBudgetsTable(); // Re-render table
    renderBudgetAlerts(); // Update dashboard alerts
}

/**
 * Deletes a budget.
 * @param {string} id - The ID of the budget to delete.
 */
function deleteBudget(id) {
    if (confirm('Are you sure you want to delete this budget?')) {
        budgets = budgets.filter(b => b.id !== id);
        saveData();
        showMessageBox('Success', 'Budget deleted successfully!');
        renderBudgetsTable(); // Re-render table
        renderBudgetAlerts(); // Update dashboard alerts
    }
}

/**
 * Renders the Loans page content.
 */
function renderLoans() {
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-8 text-gray-900">Loans</h1>

        <div class="flex justify-end mb-6">
            <button id="addLoanBtn" class="btn-primary flex items-center justify-center">
                <i class="fas fa-plus mr-2"></i> Add Loan
            </button>
        </div>

        <div class="bg-white p-6 rounded-lg shadow-md overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lender</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Rate</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repayment Date</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody id="loansTableBody" class="bg-white divide-y divide-gray-200">
                    <!-- Loans will be loaded here -->
                </tbody>
            </table>
            <p id="noLoans" class="text-gray-600 text-center py-4 hidden">No loans recorded yet.</p>
        </div>
    `;

    document.getElementById('addLoanBtn').onclick = () => showLoanModal();
    document.getElementById('loanForm').onsubmit = handleLoanSubmit;

    renderLoansTable();
}

/**
 * Renders the loans table.
 */
function renderLoansTable() {
    const loansTableBody = document.getElementById('loansTableBody');
    loansTableBody.innerHTML = ''; // Clear previous entries

    if (loans.length === 0) {
        document.getElementById('noLoans').classList.remove('hidden');
        return;
    } else {
        document.getElementById('noLoans').classList.add('hidden');
    }

    loans.forEach(l => {
        const statusClass = l.status === 'Paid' ? 'text-green-600' : 'text-red-600';
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-4 py-2 whitespace-nowrap">${l.lender}</td>
            <td class="px-4 py-2 whitespace-nowrap">${formatCurrency(parseFloat(l.amount))}</td>
            <td class="px-4 py-2 whitespace-nowrap">${l.interestRate ? `${l.interestRate}%` : '-'}</td>
            <td class="px-4 py-2 whitespace-nowrap">${formatDateForDisplay(l.repaymentDate) || '-'}</td>
            <td class="px-4 py-2 whitespace-nowrap ${statusClass}">${l.status}</td>
            <td class="px-4 py-2 whitespace-nowrap">
                <button onclick="toggleLoanStatus('${l.id}')" class="text-gray-600 hover:text-gray-800 mr-2">
                    <i class="fas fa-check-circle"></i>
                </button>
                <button onclick="showLoanModal('${l.id}')" class="text-blue-600 hover:text-blue-800 mr-2">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteLoan('${l.id}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        `;
        loansTableBody.appendChild(row);
    });
}

/**
 * Shows the loan modal for adding or editing.
 * @param {string} [id] - The ID of the loan to edit. If not provided, a new loan is added.
 */
function showLoanModal(id = null) {
    const modalTitle = document.getElementById('loanModalTitle');
    const form = document.getElementById('loanForm');
    const loanIdInput = document.getElementById('loanId');
    const amountInput = document.getElementById('loanAmount');
    const interestRateInput = document.getElementById('loanInterestRate');
    const repaymentDateInput = document.getElementById('loanRepaymentDate');
    const lenderInput = document.getElementById('loanLender');
    const descriptionInput = document.getElementById('loanDescription');

    form.reset();
    loanIdInput.value = '';

    let defaultRepaymentDateValue = ''; // YYYY-MM-DD for new loans

    if (id) {
        modalTitle.textContent = 'Edit Loan';
        const loan = loans.find(l => l.id === id);
        if (loan) {
            loanIdInput.value = loan.id;
            amountInput.value = loan.amount;
            interestRateInput.value = loan.interestRate;
            defaultRepaymentDateValue = loan.repaymentDate; // Use stored YYYY-MM-DD date
            lenderInput.value = loan.lender;
            descriptionInput.value = loan.description;
        }
    } else {
        modalTitle.textContent = 'Add Loan';
    }

    // Initialize Flatpickr for the date input
    flatpickr(repaymentDateInput, {
        dateFormat: "d-m-Y", // Set date format for Flatpickr input
        defaultDate: formatDateForDisplay(defaultRepaymentDateValue) || null // Display in DD-MM-YYYY
    });

    openModal('loanModal');
}

/**
 * Handles form submission for loans (add/edit).
 * @param {Event} event - The form submission event.
 */
function handleLoanSubmit(event) {
    event.preventDefault();
    const id = document.getElementById('loanId').value;
    const amount = parseFloat(document.getElementById('loanAmount').value);
    const interestRate = parseFloat(document.getElementById('loanInterestRate').value) || 0;
    // Parse date from DD-MM-YYYY to YYYY-MM-DD for storage
    const repaymentDate = parseDateForStorage(document.getElementById('loanRepaymentDate').value);
    const lender = document.getElementById('loanLender').value;
    const description = document.getElementById('loanDescription').value;

    if (isNaN(amount) || amount <= 0) {
        showMessageBox('Input Error', 'Please enter a valid amount.');
        return;
    }
    if (!lender) {
        showMessageBox('Input Error', 'Please enter a lender.');
        return;
    }

    if (id) {
        // Edit existing loan
        const index = loans.findIndex(l => l.id === id);
        if (index !== -1) {
            loans[index] = { ...loans[index], amount, interestRate, repaymentDate, lender, description };
            showMessageBox('Success', 'Loan updated successfully!');
        }
    } else {
        // Add new loan
        const newLoan = {
            id: generateUniqueId(),
            amount,
            interestRate,
            repaymentDate,
            lender,
            description,
            status: 'Unpaid' // Default status
        };
        loans.push(newLoan);
        showMessageBox('Success', 'Loan added successfully!');
    }
    saveData();
    closeModal('loanModal');
    renderLoansTable(); // Re-render table
}

/**
 * Toggles the paid/unpaid status of a loan.
 * @param {string} id - The ID of the loan to toggle.
 */
function toggleLoanStatus(id) {
    const loan = loans.find(l => l.id === id);
    if (loan) {
        loan.status = loan.status === 'Paid' ? 'Unpaid' : 'Paid';
        saveData();
        showMessageBox('Status Updated', `Loan from ${loan.lender} is now ${loan.status}.`);
        renderLoansTable();
    }
}

/**
 * Deletes a loan.
 * @param {string} id - The ID of the loan to delete.
 */
function deleteLoan(id) {
    if (confirm('Are you sure you want to delete this loan?')) {
        loans = loans.filter(l => l.id !== id);
        saveData();
        showMessageBox('Success', 'Loan deleted successfully!');
        renderLoansTable();
    }
}

/**
 * Renders the Profile page content.
 */
function renderProfile() {
    const pageContent = document.getElementById('page-content');
    pageContent.innerHTML = `
        <h1 class="text-3xl font-bold mb-8 text-gray-900">User Profile</h1>

        <div class="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
            <form id="profileForm" class="space-y-4">
                <div>
                    <label for="profileUsername" class="block text-gray-700 text-sm font-semibold mb-2">Username</label>
                    <input type="text" id="profileUsername" class="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="profileEmail" class="block text-gray-700 text-sm font-semibold mb-2">Email</label>
                    <input type="email" id="profileEmail" class="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                </div>
                <div>
                    <label for="profileMobile" class="block text-gray-700 text-sm font-semibold mb-2">Mobile Number</label>
                    <input type="text" id="profileMobile" class="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500">
                </div>
                <div>
                    <label for="profileCurrency" class="block text-gray-700 text-sm font-semibold mb-2">Currency</label>
                    <select id="profileCurrency" class="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" required>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="INR">INR (₹)</option>
                    </select>
                </div>
                <div class="flex justify-end mt-6">
                    <button type="submit" class="btn-primary">Save Profile</button>
                </div>
            </form>
        </div>
    `;

    // Populate form with current profile data
    document.getElementById('profileUsername').value = userProfile.username;
    document.getElementById('profileEmail').value = userProfile.email;
    document.getElementById('profileMobile').value = userProfile.mobile;
    document.getElementById('profileCurrency').value = userProfile.currency;

    document.getElementById('profileForm').onsubmit = handleProfileSubmit;
}

/**
 * Handles form submission for user profile.
 * @param {Event} event - The form submission event.
 */
function handleProfileSubmit(event) {
    event.preventDefault();
    userProfile.username = document.getElementById('profileUsername').value;
    userProfile.email = document.getElementById('profileEmail').value;
    userProfile.mobile = document.getElementById('profileMobile').value;
    const newCurrency = document.getElementById('profileCurrency').value;

    if (newCurrency !== userProfile.currency) {
        userProfile.currency = newCurrency;
        showMessageBox('Success', 'Profile updated successfully! Currency change applied.');
        // Re-render current page to reflect currency change
        renderCurrentPage();
    } else {
        showMessageBox('Success', 'Profile updated successfully!');
    }
    saveData();
}

/**
 * Renders the current page based on the `currentPage` state.
 */
function renderCurrentPage() {
    // Remove active class from all sidebar links
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });

    // Add active class to the current page's link
    const activeLink = document.querySelector(`.sidebar-link[data-page="${currentPage}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    switch (currentPage) {
        case 'dashboard':
            renderDashboard();
            break;
        case 'transactions':
            renderTransactions();
            break;
        case 'budgets':
            renderBudgets();
            break;
        case 'loans':
            renderLoans();
            break;
        case 'profile':
            renderProfile();
            break;
        default:
            renderDashboard(); // Fallback
    }
}

// --- Event Listeners and Initial Setup ---

/**
 * Handles sidebar link clicks for client-side routing.
 * @param {Event} event - The click event.
 */
function handleSidebarClick(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const page = target.dataset.page;
    if (page) {
        currentPage = page;
        history.pushState({ page: currentPage }, '', `#${currentPage}`); // Update URL hash
        renderCurrentPage();
        // Close sidebar on mobile after selection
        if (window.innerWidth <= 768) {
            document.getElementById('sidebar').classList.remove('open');
        }
    }
}

/**
 * Handles browser history changes (e.g., back/forward buttons).
 * @param {Event} event - The popstate event.
 */
window.onpopstate = function(event) {
    if (event.state && event.state.page) {
        currentPage = event.state.page;
    } else {
        currentPage = window.location.hash.substring(1) || 'dashboard';
    }
    renderCurrentPage();
};

/**
 * Initializes the application when the DOM is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    // Set up sidebar link event listeners
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', handleSidebarClick);
    });

    // Sidebar collapse/expand toggle for desktop
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('mainContent');
    const collapseToggle = document.getElementById('collapseToggle');
    const sidebarLinks = document.querySelectorAll('.sidebar-link span'); // Text part of links

    collapseToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('sidebar.collapsed'); // This class applies margin-left
        sidebarLinks.forEach(span => {
            span.classList.toggle('hidden');
        });
        collapseToggle.querySelector('i').classList.toggle('fa-chevron-left');
        collapseToggle.querySelector('i').classList.toggle('fa-chevron-right');
    });

    // Mobile menu toggle
    const menuToggle = document.getElementById('menuToggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (event) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open') &&
            !sidebar.contains(event.target) && !menuToggle.contains(event.target)) {
            sidebar.classList.remove('open');
        }
    });

    // Handle modal closing when clicking outside the modal content
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) { // Only close if clicking on the modal background itself
                closeModal(this.id);
            }
        });
    });

    // Initialize user profile and potentially show onboarding
    initializeUserProfile();
});

// Initial data for demonstration if localStorage is empty
// Dates are now in YYYY-MM-DD format for internal consistency
if (transactions.length === 0 && budgets.length === 0 && loans.length === 0) {
    transactions = [
        { id: generateUniqueId(), amount: 1200, category: 'Salary', type: 'income', date: '2025-06-01', description: 'Monthly Salary' },
        { id: generateUniqueId(), amount: 50.75, category: 'Food', type: 'expense', date: '2025-06-05', description: 'Groceries' },
        { id: generateUniqueId(), amount: 30, category: 'Transport', type: 'expense', date: '2025-06-07', description: 'Bus fare' },
        { id: generateUniqueId(), amount: 150, category: 'Shopping', type: 'expense', date: '2025-06-10', description: 'New clothes' },
        { id: generateUniqueId(), amount: 800, category: 'Rent', type: 'expense', date: '2025-06-01', description: 'Monthly Rent' },
        { id: generateUniqueId(), amount: 75, category: 'Entertainment', type: 'expense', date: '2025-06-15', description: 'Movie tickets' },
        { id: generateUniqueId(), amount: 200, category: 'Salary', type: 'income', date: '2025-06-15', description: 'Freelance work' }
    ];
    budgets = [
        { id: generateUniqueId(), category: 'Food', limit: 200 },
        { id: generateUniqueId(), category: 'Transport', limit: 100 },
        { id: generateUniqueId(), category: 'Entertainment', limit: 150 }
    ];
    loans = [
        { id: generateUniqueId(), amount: 500, interestRate: 10, repaymentDate: '2025-09-30', lender: 'Friend A', description: 'Borrowed for emergency', status: 'Unpaid' },
        { id: generateUniqueId(), amount: 2000, interestRate: 5, repaymentDate: '2026-01-15', lender: 'Bank B', description: 'Car loan downpayment', status: 'Unpaid' }
    ];
    saveData(); // Save initial data to localStorage
}
