document.addEventListener('DOMContentLoaded', async () => {
    // IMPORTANT: This frontend JavaScript is designed to work with a Django backend API.
    // It will NOT function correctly without a Django server running and exposing the
    // specified API endpoints for authentication and data management.

    // Base URL for your Django API.
    // During development, this is typically http://localhost:8000
    // In production, this will be your deployed Django API URL (e.g., https://api.yourdomain.com)
    const BASE_URL = 'https://spendwise-backend-87n6.onrender.com'; // <<< --- CONFIRM THIS IS CORRECT FOR YOUR BACKEND --- >>>

    // --- GLOBAL STATE ---
    let state = {
        transactions: [],
        budgets: [],
        loans: [],
        currentCurrency: 'INR',
        availableCurrencies: {
            'INR': '₹', 'USD': '$', 'EUR': '€', 'GBP': '£',
            'AUD': 'A$', 'CAD': 'C$', 'CHF': 'CHF', 'CNY': '¥'
        },
        // For unauthenticated app, always set to a "public" user
        user: {
            id: 'public-user',
            email: 'public@spendwise.com',
            username: 'PublicUser',
            mobileNumber: 'N/A',
            isAuthenticated: true // Always true as there's no login/logout
        }
    };

    // --- UI Element References ---
    // Removed authentication-specific UI elements
    const dashProfIcon = document.getElementById('dash-prof-icon');

    const profDisp = document.getElementById('prof-disp');
    const profEdit = document.getElementById('prof-edit');
    const editProfBtn = document.getElementById('edit-prof-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const saveProfBtn = document.getElementById('save-prof-btn');
    const chgPassBtn = document.getElementById('chg-pass-btn');

    const userIdDisp = document.getElementById('user-id-disp');
    const emailDisp = document.getElementById('email-disp');
    const userDisp = document.getElementById('user-disp');
    const mobDisp = document.getElementById('mob-disp');

    const userIdEdit = document.getElementById('user-id-edit');
    const profEmInp = document.getElementById('prof-em-inp');
    const profUserInp = document.getElementById('prof-user-inp');
    const profMobInp = document.getElementById('prof-mob-inp');
    const currPassInp = document.getElementById('curr-pass-inp');
    const newPassInp = document.getElementById('new-pass-inp');
    const confPassInp = document.getElementById('conf-pass-inp');

    const profSaveStat = document.getElementById('prof-save-stat');
    const passStat = document.getElementById('pass-stat');
    const emErr = document.getElementById('em-err');
    const userErr = document.getElementById('user-err');

    const transMod = document.getElementById('trans-mod');
    const modTitle = document.getElementById('mod-title');
    const transForm = document.getElementById('trans-form');
    const addTransBtn = document.getElementById('add-trans-btn');
    const modCancelBtn = document.getElementById('mod-cancel-btn');

    const loanDetMod = document.getElementById('loan-det-mod');
    const loanModTitle = document.getElementById('loan-mod-title');
    const loanDetForm = document.getElementById('loan-det-form');
    const loanModCancel = document.getElementById('loan-mod-cancel');
    const loanStatBtns = document.getElementById('loan-stat-btns');

    // Custom Confirmation Modal elements
    const confirmMod = document.getElementById('confirm-mod');
    const confirmMsg = document.getElementById('confirm-msg');
    const confirmCancelBtn = document.getElementById('confirm-cancel-btn');
    const confirmProceedBtn = document.getElementById('confirm-proceed-btn');
    let confirmCallback = null; // Stores the callback function for confirmation

    const currSel = document.getElementById('curr-sel');

    const expBtn = document.getElementById('exp-btn');
    const expFormat = document.getElementById('exp-format');
    const expInst = document.getElementById('exp-inst');
    const expRangeRadios = document.querySelectorAll('input[name="export-range"]');
    const customDateRangeInputs = document.getElementById('custom-date-range-inputs');
    const expStartDate = document.getElementById('exp-start-date');
    const expEndDate = document.getElementById('exp-end-date');

    const filtStartDate = document.getElementById('filt-start-date');
    const filtEndDate = document.getElementById('filt-end-date');
    const filtKeyword = document.getElementById('filt-keyword');

    // References to specific date inputs for Flatpickr initialization
    const transDateInput = document.getElementById('trans-date');
    const loanDueInput = document.getElementById('loan-due');
    const loanDetDueInput = document.getElementById('loan-det-due');


    // --- HELPER FUNCTIONS FOR API CALLS ---
    // Simplified apiFetch - no token handling needed for unauthenticated app
    const apiFetch = async (url, options = {}) => {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        try {
            const response = await fetch(`${BASE_URL}${url}`, {
                ...options,
                headers,
            });

            if (!response.ok) {
                // Try to parse JSON error, but fall back to text if it's not JSON (e.g., HTML 404)
                let errorData;
                let errorResponseClone; // Declare here so it's accessible in catch
                try {
                    // Clone response to safely attempt reading body multiple times if needed
                    errorResponseClone = response.clone();
                    errorData = await response.json(); // Use original response for first attempt
                } catch (e) {
                    errorData = await errorResponseClone.text(); // Use clone for second attempt
                }
                console.error(`API Fetch Error: ${response.status} for ${url}`, errorData);
                // Return structured error for better alert messages
                return { ok: false, status: response.status, data: errorData };
            }
            return { ok: true, status: response.status, data: await response.json() };
        } catch (error) {
            console.error(`Network or Fetch Error for ${url}:`, error);
            // Return structured error for better alert messages
            return { ok: false, status: 0, data: error.message }; // status 0 for network errors
        }
    };

    // Main function to trigger data fetch from backend and update state
    // Main function to trigger data fetch from backend and update state
    const fetchDataFromBackend = async () => {
        try {
            const [transResponse, budResponse, loanResponse] = await Promise.all([
                apiFetch('/api/transactions/'),
                apiFetch('/api/budgets/'),
                apiFetch('/api/loans/')
            ]);

            // Ensure data is an array from the 'results' property of paginated responses
            if (transResponse.ok && transResponse.data && Array.isArray(transResponse.data.results)) {
                state.transactions = transResponse.data.results; // Extract the 'results' array
                console.log('Transactions fetched:', state.transactions.length);
            } else {
                state.transactions = []; // Default to empty array to prevent TypeError
                // console.error('Failed to fetch transactions or received unexpected data structure:', transResponse.data); // <--- COMMENT OUT OR REMOVE THIS LINE
            }

            if (budResponse.ok && budResponse.data && Array.isArray(budResponse.data.results)) {
                state.budgets = budResponse.data.results; // Extract the 'results' array
                console.log('Budgets fetched:', state.budgets.length);
            } else {
                state.budgets = []; // Default to empty array
                // console.error('Failed to fetch budgets or received unexpected data structure:', budResponse.data); // <--- COMMENT OUT OR REMOVE THIS LINE
            }

            if (loanResponse.ok && loanResponse.data && Array.isArray(loanResponse.data.results)) {
                state.loans = loanResponse.data.results; // Extract the 'results' array
                console.log('Loans fetched:', state.loans.length);
            } else {
                state.loans = []; // Default to empty array
                // console.error('Failed to fetch loans or received unexpected data structure:', loanResponse.data); // <--- COMMENT OUT OR REMOVE THIS LINE
            }

            renderAll(); // Render after all data is fetched and state is updated
        } catch (error) {
            console.error('Error during fetchDataFromBackend:', error);
            alert('An error occurred while fetching data from the backend. Please check your console.');
        }
    };

    // Wrapper function for initial data load and re-renders
    const fetchAndRenderData = () => {
        fetchDataFromBackend();
    };


    // --- UTILITY FUNCTIONS ---
    // Formats a date string into a more readable format (e.g., "Jun 23, 2025")
    const formatDate = (dateString) => {
        if (!dateString) return '';
        if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return new Date(dateString + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        }
        return dateString;
    };

    // Returns today's date inYYYY-MM-DD format for input default
    const todayYYYYMMDD = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    let expensesPieChart, trendsBarChart; // Chart.js instances

    // Formats a numeric amount into a currency string (e.g., "₹ 123.45")
    const formatCurrency = (amount, includeSymbol = true) => { // Added includeSymbol parameter
        const formattedAmount = parseFloat(amount).toFixed(2);
        const symbol = state.availableCurrencies[state.currentCurrency] || '';
        return includeSymbol ? `${symbol} ${formattedAmount}` : formattedAmount;
    };

    // --- NAVIGATION LOGIC ---
    const navLinks = document.querySelectorAll('#main-nav a');
    const mainSections = document.querySelectorAll('.sect');

    const navigateTo = (hash) => {
        navLinks.forEach(link => link.classList.toggle('active', link.hash === hash));
        mainSections.forEach(section => section.classList.toggle('active', `#${section.id}` === hash));
        window.location.hash = hash;
    };

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(link.hash);
        });
    });

    // --- MODAL HANDLING ---
    // Opens the transaction modal for adding or editing
    const openTransMod = (mode, transaction = null) => {
        transForm.reset();
        document.getElementById('trans-id').value = '';

        if (mode === 'add') {
            modTitle.textContent = 'Add Transaction';
            document.getElementById('trans-date').value = todayYYYYMMDD(); // Set default to today's date
        } else { // Edit mode
            modTitle.textContent = 'Edit Transaction';
            document.getElementById('trans-id').value = transaction.id;
            document.getElementById('trans-type').value = transaction.type;
            document.getElementById('trans-desc').value = transaction.description;
            document.getElementById('trans-cat').value = transaction.category;
            document.getElementById('trans-amt').value = transaction.amount;
            document.getElementById('trans-date').value = transaction.date;
        }
        transMod.classList.remove('hidden');
        transMod.classList.add('active');
    };

    const closeTransMod = () => {
        transMod.classList.remove('active');
        transMod.classList.add('hidden');
    };

    transMod.addEventListener('click', (e) => {
        if (e.target === transMod) closeTransMod();
    });

    // Opens the loan details modal for viewing/editing a loan
    const openLoanDetMod = (loan) => {
        loanModTitle.textContent = 'Edit Loan';
        document.getElementById('loan-det-id').value = loan.id;
        document.getElementById('loan-det-lend').value = loan.lender;
        document.getElementById('loan-det-amt').value = loan.amount;
        document.getElementById('loan-det-due').value = loan.due_date;

        loanStatBtns.innerHTML = '';
        if (loan.paid) {
            const unmarkBtn = document.createElement('button');
            unmarkBtn.type = 'button';
            unmarkBtn.className = 'unmark-paid-btn btn-blue px-4 py-2';
            unmarkBtn.textContent = 'Unmark Paid';
            unmarkBtn.dataset.id = loan.id;
            loanStatBtns.appendChild(unmarkBtn);
        } else {
            const markPaidBtn = document.createElement('button');
            markPaidBtn.type = 'button';
            markPaidBtn.className = 'mark-paid-btn btn-main px-4 py-2';
            markPaidBtn.textContent = 'Mark Paid';
            markPaidBtn.dataset.id = loan.id;
            loanStatBtns.appendChild(markPaidBtn);
        }
        loanDetMod.classList.add('active');
    };

    const closeLoanDetMod = () => loanDetMod.classList.remove('active');

    loanModCancel.addEventListener('click', closeLoanDetMod);
    loanDetMod.addEventListener('click', (e) => {
        if (e.target === loanDetMod) closeLoanDetMod();
    });

    // Custom Confirmation Modal Functions
    const openConfirmModal = (message, callback) => {
        confirmMsg.textContent = message;
        confirmCallback = callback;
        confirmMod.classList.add('active');
    };

    const closeConfirmModal = () => {
        confirmMod.classList.remove('active');
        confirmCallback = null; // Clear callback
    };

    confirmCancelBtn.addEventListener('click', () => {
        closeConfirmModal();
        if (confirmCallback) confirmCallback(false); // Call callback with false for cancel
    });

    confirmProceedBtn.addEventListener('click', () => {
        closeConfirmModal();
        if (confirmCallback) confirmCallback(true); // Call callback with true for proceed
    });

    confirmMod.addEventListener('click', (e) => {
        if (e.target === confirmMod) closeConfirmModal();
    });


    // Profile icon always navigates to settings
    dashProfIcon.addEventListener('click', () => {
        navigateTo('#settings');
    });


    // --- RENDERING FUNCTIONS (UI Updates) ---
    const renderAll = () => {
        renderTransTbl();
        renderDashboard();
        renderBudgets();
        renderLoans();
        // No need to update profile UI based on auth, as it's always "public"
        updateProfileDisplay();
    };

    const renderDashboard = () => {
        const income = state.transactions.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
        const expense = state.transactions.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;

        document.getElementById('sum-inc').textContent = formatCurrency(income);
        document.getElementById('sum-exp').textContent = formatCurrency(expense);
        document.getElementById('sum-bal').textContent = formatCurrency(balance);

        const balanceElement = document.getElementById('sum-bal');
        balanceElement.classList.remove('sum-bal', 'negative');
        balanceElement.classList.add('sum-bal');
        if (balance < 0) {
            balanceElement.classList.add('negative');
        }

        const welMsg = document.getElementById('wel-msg');
        welMsg.textContent = `Welcome to SpendWise! Manage your finances here.`;

        renderDashAlerts();
        updateExpPieChart();
        updateTrendBarChart();
    };

    const renderTransTbl = () => {
        const transTblBody = document.getElementById('trans-tbl-body');
        transTblBody.innerHTML = '';

        const startDate = filtStartDate.value;
        const endDate = filtEndDate.value;
        const keyword = filtKeyword.value.toLowerCase();

        const filtered = state.transactions.filter(t => {
            const tDate = new Date(t.date + 'T00:00:00'); // Ensure date comparison is consistent
            const start = startDate ? new Date(startDate + 'T00:00:00') : null;
            const end = endDate ? new Date(endDate + 'T23:59:59') : null;

            if (start && tDate < start) return false;
            if (end && tDate > end) return false;
            if (keyword && !t.description.toLowerCase().includes(keyword) && !t.category.toLowerCase().includes(keyword)) return false;
            return true;
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filtered.length === 0) {
            transTblBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-gray-600">No transactions found.</td></tr>`;
            return;
        }

        filtered.forEach(t => {
            const row = document.createElement('tr');
            row.className = 'tbl-row';
            row.innerHTML = `
                <td class="p-4">${formatDate(t.date)}</td>
                <td class="p-4">
                    <div class="trans-desc-main">${t.description}</div>
                    <div class="trans-desc-sub">${t.type}</div>
                </td>
                <td class="p-4">${t.category}</td>
                <td class="p-4 text-right font-semibold ${t.type === 'Income' ? 'trans-amt-pos' : 'trans-amt-neg'}">${t.type === 'Income' ? '+' : '-'}${formatCurrency(t.amount, false)}</td>
                <td class="p-4 text-center">
                    <button class="trans-edit-btn" data-id="${t.id}"><i class="fas fa-edit"></i></button>
                    <button class="trans-delete-btn" data-id="${t.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            transTblBody.appendChild(row);
        });
    };

    const renderBudgets = () => {
        const budList = document.getElementById('bud-list');
        budList.innerHTML = '';

        if (state.budgets.length === 0) {
            budList.innerHTML = `<div class="box p-6 text-center text-gray-600">No budgets set. Use the form above to add one!</div>`;
            return;
        }

        state.budgets.forEach(b => {
            const spent = state.transactions
                .filter(t => t.type === 'Expense' && t.category === b.category)
                .reduce((sum, t) => sum + t.amount, 0);
            const percentage = Math.min((spent / b.amount) * 100, 100);

            let progressBarColorClass = 'bg-emerald-500';
            let progressBarBgColor = '#34D399'; // Tailwind emerald-500

            if (percentage > 75) {
                progressBarColorClass = 'bg-orange-500';
                progressBarBgColor = '#F97316'; // Tailwind orange-500
            }
            if (percentage >= 100) {
                progressBarColorClass = 'bg-red-500';
                progressBarBgColor = '#EF4444'; // Tailwind red-500
            }

            const div = document.createElement('div');
            div.className = 'box p-4';
            div.innerHTML = `
                <div class="bud-item-head">
                    <span class="bud-cat-name">${b.category}</span>
                    <span class="bud-amt-info">Spent: ${formatCurrency(spent)} / Budget: ${formatCurrency(b.amount)}</span>
                </div>
                <div class="pb-bg">
                    <div class="pb-fill ${progressBarColorClass}" style="width: ${percentage}%; background-color: ${progressBarBgColor};"> ${percentage.toFixed(0)}%</div>
                </div>
            `;
            budList.appendChild(div);
        });
    };

    const renderLoans = () => {
        const loanTblBody = document.getElementById('loan-tbl-body');
        loanTblBody.innerHTML = '';

        if (state.loans.length === 0) {
            loanTblBody.innerHTML = `<tr><td colspan="5" class="text-center p-6 text-gray-600">No loans or debts recorded. Use the form above to add one!</td></tr>`;
            return;
        }

        state.loans.sort((a, b) => a.paid - b.paid || new Date(a.due_date) - new Date(b.due_date)).forEach(l => {
            const row = document.createElement('tr');
            const statusClass = l.paid ? 'loan-status-paid' : 'loan-status-pending';

            const actionButtons = `<button class="loan-edit-btn" data-id="${l.id}"><i class="fas fa-edit"></i> Edit</button>`;
            row.className = 'tbl-row';

            row.innerHTML = `
                <td class="p-4">${l.lender}</td>
                <td class="p-4">${formatCurrency(l.amount)}</td>
                <td class="p-4">${formatDate(l.due_date)}</td>
                <td class="p-4 text-center"><span class="loan-status-tag ${statusClass}">${l.paid ? 'Paid' : 'Pending'}</span></td>
                <td class="p-4 text-center">
                    ${actionButtons}
                </td>
            `;
            loanTblBody.appendChild(row);
        });
    };

    const renderDashAlerts = () => {
        const dashBudAlerts = document.getElementById('dash-bud-alerts');
        dashBudAlerts.innerHTML = '';
        let budgetAlertsFound = false;
        state.budgets.forEach(b => {
            const spent = state.transactions
                .filter(t => t.type === 'Expense' && t.category === b.category)
                .reduce((sum, t) => sum + t.amount, 0);
            if (spent > b.amount) {
                budgetAlertsFound = true;
                dashBudAlerts.innerHTML += `<p class="alert-item text-red-600">Overspent on <strong class="font-semibold">${b.category}</strong> by ${formatCurrency(spent - b.amount)}.</p>`;
            }
        });
        if (!budgetAlertsFound) dashBudAlerts.innerHTML = `<p class="alert-no-data">All budgets are on track!</p>`;

        const dashLoanRem = document.getElementById('dash-loan-rem');
        dashLoanRem.innerHTML = '';
        let loanAlertsFound = false;
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        state.loans.filter(l => !l.paid && new Date(l.due_date + 'T00:00:00') <= sevenDaysFromNow).forEach(l => {
            loanAlertsFound = true;
            dashLoanRem.innerHTML += `<p class="alert-item text-sky-600">Loan from <strong class="font-semibold">${l.lender}</strong> of ${formatCurrency(l.amount)} is due on ${formatDate(l.due_date)}.</p>`;
        });
        if (!loanAlertsFound) dashLoanRem.innerHTML = `<p class="alert-no-data">No loans due soon.</p>`;
    };

    // --- CHARTING FUNCTIONS ---
    const updateExpPieChart = () => {
        const ctx = document.getElementById('exp-pie-chart').getContext('2d');
        const expenseData = state.transactions.filter(t => t.type === 'Expense')
            .reduce((acc, t) => {
                acc[t.category] = (acc[t.category] || 0) + t.amount;
                return acc;
            }, {});

        const labels = Object.keys(expenseData);
        const data = Object.values(expenseData);

        // Hardcoded vibrant color palette for the pie chart
        const pieColors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40',
            '#E7E9ED', '#8AC926', '#1982C4', '#6A4C93', '#FFCA3A', '#6A994E',
            '#F08A5D', '#B8B8F3'
        ];

        if (expensesPieChart) expensesPieChart.destroy();
        expensesPieChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: pieColors,
                    borderColor: '#ffffff', // White border for contrast
                    borderWidth: 4,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: {
                            color: '#333333' // Dark text for legend labels
                        }
                    },
                    tooltip: {
                        titleColor: '#333333',
                        bodyColor: '#333333',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                    }
                }
            }
        });
    };

    const updateTrendBarChart = () => {
        const ctx = document.getElementById('trend-bar-chart').getContext('2d');
        const monthlyData = state.transactions.reduce((acc, t) => {
            const month = new Date(t.date + 'T00:00:00').toLocaleString('default', { month: 'short', year: '2-digit' });
            if (!acc[month]) acc[month] = { income: 0, expense: 0 };
            if (t.type === 'Income') acc[month].income += t.amount;
            else acc[month].expense += t.amount;
            return acc;
        }, {});

        const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date('01 ' + a) - new Date('01 ' + b));

        const labels = sortedMonths;
        const incomeData = sortedMonths.map(m => monthlyData[m].income);
        const expenseData = sortedMonths.map(m => monthlyData[m].expense);

        if (trendsBarChart) trendsBarChart.destroy();
        trendsBarChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    // Hardcoded colors for bar chart
                    { label: 'Income', data: incomeData, backgroundColor: '#4CAF50', barPercentage: 0.4, categoryPercentage: 0.6 }, // Green
                    { label: 'Expense', data: expenseData, backgroundColor: '#F44336', barPercentage: 0.4, categoryPercentage: 0.6 }  // Red
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        stacked: false,
                        ticks: {
                            color: '#333333' // Dark text for x-axis ticks
                        },
                        grid: {
                            color: 'rgba(209, 213, 219, 0.5)'
                        }
                    },
                    y: {
                        stacked: false,
                        beginAtZero: true,
                        ticks: {
                            color: '#333333' // Dark text for y-axis ticks
                        },
                        grid: {
                            color: 'rgba(209, 213, 219, 0.5)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: '#333333' // Dark text for legend labels
                        }
                    },
                    tooltip: {
                        titleColor: '#333333',
                        bodyColor: '#333333',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)'
                    }
                }
            }
        });
    };

    // --- EVENT LISTENERS ---
    // Transaction Form Submission (in modal for Add/Edit)
    transForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('trans-id').value;
        const newTransactionData = {
            type: document.getElementById('trans-type').value,
            description: document.getElementById('trans-desc').value,
            category: document.getElementById('trans-cat').value,
            amount: parseFloat(document.getElementById('trans-amt').value),
            date: document.getElementById('trans-date').value,
        };

        const response = await apiFetch(id ? `/api/transactions/${id}/` : '/api/transactions/', {
            method: id ? 'PUT' : 'POST',
            body: JSON.stringify(newTransactionData)
        });

        if (response.ok) {
            closeTransMod();
            fetchAndRenderData();
        } else {
            const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
            console.error('Failed to save transaction:', errorMessage);
            alert(`Failed to save transaction (Status: ${response.status}): ${errorMessage}`);
        }
    });

    addTransBtn.addEventListener('click', () => openTransMod('add'));
    modCancelBtn.addEventListener('click', closeTransMod);


    // Event delegation for Edit and Delete buttons on the transaction table
    document.getElementById('trans-tbl-body').addEventListener('click', async (e) => {
        // Handle Edit button click
        if (e.target.closest('.trans-edit-btn')) {
            const btn = e.target.closest('.trans-edit-btn');
            const id = btn.dataset.id;
            console.log('Edit button clicked for transaction ID:', id); // Debug log
            // Ensure `id` is compared as a string, as dataset values are strings
            const transaction = state.transactions.find(t => String(t.id) === String(id));
            if (transaction) {
                console.log('Found transaction for editing:', transaction); // Debug log
                openTransMod('edit', transaction);
            } else {
                console.error('Transaction not found for ID:', id, 'Current state.transactions:', state.transactions); // Debug log
                alert('Transaction not found for editing. Check console for details.');
            }
        }
        // Handle Delete button click
        if (e.target.closest('.trans-delete-btn')) {
            const btn = e.target.closest('.trans-delete-btn');
            const id = btn.dataset.id;
            console.log('Delete button clicked for transaction ID:', id); // Debug log
            openConfirmModal('Are you sure you want to delete this transaction?', async (confirmed) => {
                if (confirmed) {
                    const response = await apiFetch(`/api/transactions/${id}/`, { method: 'DELETE' });
                    if (response.ok) {
                        console.log('Transaction deleted successfully:', id); // Debug log
                        fetchAndRenderData();
                    } else {
                        const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
                        console.error('Failed to delete transaction:', errorMessage);
                        alert(`Failed to delete transaction (Status: ${response.status}): ${errorMessage}`);
                    }
                }
            });
        }
    });

    // Event listeners for transaction filter inputs
    filtStartDate.addEventListener('input', renderTransTbl);
    filtEndDate.addEventListener('input', renderTransTbl);
    filtKeyword.addEventListener('input', renderTransTbl);


    // Budget Form Submission
    document.getElementById('bud-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const category = document.getElementById('bud-cat').value;
        const amount = parseFloat(document.getElementById('bud-amt').value);

        // Check if budget for this category already exists
        const existingBudget = state.budgets.find(b => b.category.toLowerCase() === category.toLowerCase());
        if (existingBudget) {
            alert(`Budget set for '${category}' already. Kindly edit if you want.`);
            return; // Stop the function here
        }

        const response = await apiFetch('/api/budgets/', {
            method: 'POST',
            body: JSON.stringify({ category, amount })
        });
        if (response.ok) {
            document.getElementById('bud-form').reset();
            fetchAndRenderData();
        } else {
            const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
            console.error('Failed to save budget:', errorMessage);
            alert(`Failed to save budget (Status: ${response.status}): ${errorMessage}`);
        }
    });

    // Loan Form
    document.getElementById('loan-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const loanData = {
            lender: document.getElementById('loan-lend').value,
            amount: parseFloat(document.getElementById('loan-amt').value),
            due_date: document.getElementById('loan-due').value,
            paid: false,
        };
        const response = await apiFetch('/api/loans/', {
            method: 'POST',
            body: JSON.stringify(loanData)
        });
        if (response.ok) {
            document.getElementById('loan-form').reset();
            fetchAndRenderData();
        } else {
            const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
            console.error('Failed to add loan:', errorMessage);
            alert(`Failed to add loan (Status: ${response.status}): ${errorMessage}`);
        }
    });

    // Event delegation for Edit Loan buttons on the loan table
    document.getElementById('loan-tbl-body').addEventListener('click', async (e) => {
        const editLoanBtn = e.target.closest('.loan-edit-btn');

        if (editLoanBtn) {
            const id = editLoanBtn.dataset.id;
            const loan = state.loans.find(l => String(l.id) === String(id)); // Ensure string comparison
            openLoanDetMod(loan);
        }
    });

    // Event delegation for Mark Paid/Unmark Paid buttons within loan details modal
    loanDetMod.addEventListener('click', async (e) => {
        const unmarkPaidBtn = e.target.closest('.unmark-paid-btn');
        const markPaidBtn = e.target.closest('.mark-paid-btn');
        const loanId = document.getElementById('loan-det-id').value;

        if (unmarkPaidBtn || markPaidBtn) {
            const newPaidStatus = markPaidBtn ? true : false;
            openConfirmModal(`Are you sure you want to mark this loan as ${newPaidStatus ? 'Paid' : 'Pending'}?`, async (confirmed) => {
                if (confirmed) {
                    const response = await apiFetch(`/api/loans/mark-paid/${loanId}/`, {
                        method: 'PUT',
                        body: JSON.stringify({ paid: newPaidStatus })
                    });
                    if (response.ok) {
                        closeLoanDetMod();
                        fetchAndRenderData();
                    } else {
                        const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
                        console.error('Failed to update loan status:', errorMessage);
                        alert(`Failed to update loan status (Status: ${response.status}): ${errorMessage}`);
                    }
                }
            });
        }
    });

    // Loan Details Form Submission (for updating lender/borrower, amount, due date)
    loanDetForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('loan-det-id').value;
        const updatedLoanData = {
            lender: document.getElementById('loan-det-lend').value,
            amount: parseFloat(document.getElementById('loan-det-amt').value),
            due_date: document.getElementById('loan-det-due').value,
        };

        const response = await apiFetch(`/api/loans/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(updatedLoanData)
        });
        if (response.ok) {
            closeLoanDetMod();
            fetchAndRenderData();
        } else {
            const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
            console.error('Failed to save loan changes:', errorMessage);
            alert(`Failed to save loan changes (Status: ${response.status}): ${errorMessage}`);
        }
    });

    // --- Export Logic ---

    // Function to manage the visibility of the custom date range inputs
    const updateExportDateRangeVisibility = () => {
        const selectedRadio = document.querySelector('input[name="export-range"]:checked');
        if (selectedRadio && selectedRadio.value === 'custom') {
            customDateRangeInputs.classList.remove('hidden'); // Show it
            // Initialize Flatpickr specifically for these inputs when they are shown
            initializeFlatpickrForSpecificElement(expStartDate);
            initializeFlatpickrForSpecificElement(expEndDate, { maxDate: "today" }); // Max date for end date
        } else {
            customDateRangeInputs.classList.add('hidden'); // Hide it
            // Clear dates when hiding for a clean state
            if (expStartDate) expStartDate.value = '';
            if (expEndDate) expEndDate.value = '';
        }
    };

    expRangeRadios.forEach(radio => {
        radio.addEventListener('change', updateExportDateRangeVisibility);
    });

    expBtn.addEventListener('click', async () => {
        const format = expFormat.value;
        expInst.classList.add('hidden');

        const selectedRange = document.querySelector('input[name="export-range"]:checked').value;

        let exportUrlPath = `/api/export/${format}/`; // Base URL path for export API
        const params = new URLSearchParams();

        if (selectedRange === 'custom') {
            const startDate = expStartDate.value;
            const endDate = expEndDate.value;

            if (!startDate || !endDate) {
                alert('Please select both start and end dates for custom range export.');
                return;
            }
            params.append('start_date', startDate);
            params.append('end_date', endDate);
        }

        const fullExportUrl = `${BASE_URL}${exportUrlPath}?${params.toString()}`;

        try {
            const response = await fetch(fullExportUrl, { method: 'GET' });

            if (!response.ok) {
                let errorData;
                let errorResponseClone; // Declare here so it's accessible in catch
                try {
                    // Clone response to safely attempt reading body multiple times if needed
                    errorResponseClone = response.clone();
                    errorData = await response.json(); // Try JSON first for backend errors
                } catch (e) {
                    // Fallback to text if JSON parsing fails or if the response is not JSON
                    errorData = await errorResponseClone.text();
                }
                console.error(`Export Error (Status: ${response.status}) for ${fullExportUrl}:`, errorData);
                alert(`Failed to generate report (Status: ${response.status}): ${JSON.stringify(errorData)}`);
                return;
            }

            // If response is OK, it's a file download
            const blob = await response.blob();
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `report.${format}`;

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1];
                }
            }
            saveAs(blob, filename);
            alert("Report generated and download started!");

        } catch (error) {
            console.error(`Network or Fetch Error for export ${fullExportUrl}:`, error);
            alert(`Failed to generate report: ${error.message}`);
        }
    });

    // --- Settings Logic (Currency and Profile) ---
    // Populates the currency selector options
    const populateCurrencyDropdown = () => {
        currSel.innerHTML = ''; // Clear existing options
        for (const code in state.availableCurrencies) {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${code} (${state.availableCurrencies[code]})`;
            currSel.appendChild(option);
        }
        currSel.value = localStorage.getItem('selectedCurrency') || state.currentCurrency;
        state.currentCurrency = currSel.value;
    };

    // Updates the profile display with the current "PublicUser" data
    const updateProfileDisplay = () => {
        userIdDisp.textContent = state.user.id;
        userIdEdit.textContent = state.user.id;
        emailDisp.textContent = state.user.email;
        userDisp.textContent = state.user.username;
        mobDisp.textContent = state.user.mobileNumber || 'N/A';

        profUserInp.value = state.user.username;
        profEmInp.value = state.user.email;
        profMobInp.value = state.user.mobileNumber === 'N/A' ? '' : state.user.mobileNumber;
    };


    // Currency change handler
    currSel.addEventListener('change', (e) => {
        state.currentCurrency = e.target.value;
        localStorage.setItem('selectedCurrency', state.currentCurrency);
        renderAll();
    });

    // Toggles between profile display and edit modes
    const toggleProfileEditMode = (editMode) => {
        if (editMode) {
            profDisp.classList.add('hidden');
            profEdit.classList.remove('hidden');
            profUserInp.value = userDisp.textContent === 'N/A' ? '' : userDisp.textContent;
            profEmInp.value = emailDisp.textContent === 'N/A' ? '' : emailDisp.textContent;
            profMobInp.value = mobDisp.textContent === 'N/A' ? '' : mobDisp.textContent;
            profSaveStat.textContent = '';
            passStat.textContent = '';
            emErr.textContent = '';
            userErr.textContent = '';
            currPassInp.value = '';
            newPassInp.value = '';
            confPassInp.value = '';
        } else {
            profDisp.classList.remove('hidden');
            profEdit.classList.add('hidden');
        }
    };

    // Event listener for "Edit Profile" button
    editProfBtn.addEventListener('click', () => {
        toggleProfileEditMode(true);
    });

    // Event listener for "Cancel" button within the password change section
    // This button is within prof-edit, so we need to ensure prof-edit exists
    if (profEdit) {
        const cancelEditBtnInProfEdit = profEdit.querySelector('.pass-chg-btns #cancel-edit-btn');
        if (cancelEditBtnInProfEdit) {
            cancelEditBtnInProfEdit.addEventListener('click', () => toggleProfileEditMode(false));
        }
    }


    // Event listener for saving profile changes (username/email/mobile)
    saveProfBtn.addEventListener('click', async () => {
        const newUsername = profUserInp.value.trim();
        const newEmail = profEmInp.value.trim();
        const newMobile = profMobInp.value.trim();

        profSaveStat.textContent = "Saving...";
        emErr.textContent = '';
        userErr.textContent = '';

        if (newUsername === '') {
            userErr.textContent = 'Username cannot be empty.';
            profSaveStat.textContent = 'Failed to save changes.';
            return;
        }
        if (newEmail === '') {
            emErr.textContent = 'Email cannot be empty.';
            profSaveStat.textContent = 'Failed to save changes.';
            return;
        }

        const response = await apiFetch('/api/user/profile/', { // This endpoint might need to be adjusted on backend
            method: 'PATCH',
            body: JSON.stringify({
                username: newUsername,
                email: newEmail,
                mobile_number: newMobile
            })
        });

        if (response.ok) {
            const updatedUser = response.data;
            state.user.username = updatedUser.username;
            state.user.email = updatedUser.email;
            state.user.mobileNumber = updatedUser.mobile_number;

            profSaveStat.textContent = "Profile updated successfully!";
            updateProfileDisplay(); // Update UI based on new profile data
            toggleProfileEditMode(false);
        } else {
            const errorMessage = typeof response.data === 'object' ? JSON.stringify(response.data) : response.data;
            console.error('Failed to save profile:', errorMessage);
            if (response.data.username) userErr.textContent = response.data.username[0];
            if (response.data.email) emErr.textContent = response.data.email[0];
            profSaveStat.textContent = `Failed to save changes (Status: ${response.status}): ${errorMessage}`;
        }
    });

    // Event listener for changing password (removed functionality, but keeping button for now)
    chgPassBtn.addEventListener('click', async () => {
        passStat.textContent = "Password change is not available in this unauthenticated mode.";
        currPassInp.value = '';
        newPassInp.value = '';
        confPassInp.value = '';
    });


    // --- INITIALIZATION ---

    // Generic Flatpickr initializer (can be used for fields without special rules)
    const initializeFlatpickrForSpecificElement = (element, extraOptions = {}) => {
        if (typeof flatpickr !== 'undefined' && element) {
            flatpickr(element, {
                dateFormat: "Y-m-d", // For backend compatibility
                altInput: true,
                altFormat: "d-m-Y", // For user display
                allowInput: true,
                ...extraOptions // Merge extra options
            });
            console.log('Flatpickr initialized for:', element.id || element.className);
        } else {
            if (!element) console.warn("Attempted to initialize Flatpickr on a non-existent element.");
            else console.error("Flatpickr library is not loaded. Date pickers will not initialize for:", element.id || element.className);
        }
    };

    // Initialize specific date inputs with their unique requirements
    initializeFlatpickrForSpecificElement(transDateInput, { maxDate: "today" }); // Transaction date must be today or earlier
    initializeFlatpickrForSpecificElement(loanDueInput); // Loan due date (add form)
    initializeFlatpickrForSpecificElement(loanDetDueInput); // Loan details modal due date (edit form)
    initializeFlatpickrForSpecificElement(filtStartDate); // Transaction filter start date
    initializeFlatpickrForSpecificElement(filtEndDate); // Transaction filter end date

    // Call the function to set initial visibility of export date range inputs (this function calls Flatpickr for expStartDate/expEndDate)
    updateExportDateRangeVisibility();

    // Populate currency dropdown on load
    populateCurrencyDropdown();

    // Update profile display with initial public user data
    updateProfileDisplay();

    // Fetch and render data
    fetchAndRenderData();

    // Navigate to the section specified in the URL hash, or to dashboard by default
    if (window.location.hash) {
        navigateTo(window.location.hash);
    } else {
        navigateTo('#dashboard');
    }
});
