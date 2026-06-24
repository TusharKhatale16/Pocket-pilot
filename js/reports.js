// Basic reports page logic for the Smart Expense Manager app.
// This initial version reads transaction data and fills the budget tracker.

const STORAGE_KEY = 'transactions';
const monthlyBudget = 3000;
const budgetLimitText = document.getElementById('budgetLimitText');
const spentAmountText = document.getElementById('spentAmount');
const remainingAmountText = document.getElementById('remainingAmount');
const budgetWarningText = document.getElementById('budgetWarning');
const budgetProgressBar = document.getElementById('budgetProgressBar');
const highestCategoryText = document.getElementById('highestCategory');
const monthlySavingsText = document.getElementById('monthlySavings');
const categoryChartCanvas = document.getElementById('categoryChart');
const monthlyChartCanvas = document.getElementById('monthlyChart');

const mockTransactions = [
    { id: '1', date: '2026-06-02', description: 'Groceries', category: 'Food', amount: 210, type: 'expense' },
    { id: '2', date: '2026-06-05', description: 'Salary', category: 'Income', amount: 4200, type: 'income' },
    { id: '3', date: '2026-06-08', description: 'Utilities', category: 'Bills', amount: 160, type: 'expense' },
    { id: '4', date: '2026-06-10', description: 'Monthly rent', category: 'Housing', amount: 1200, type: 'expense' },
    { id: '5', date: '2026-06-12', description: 'Internet plan', category: 'Bills', amount: 60, type: 'expense' },
    { id: '6', date: '2026-06-14', description: 'Lunch with friends', category: 'Dining', amount: 75, type: 'expense' },
    { id: '7', date: '2026-06-16', description: 'Electricity bill', category: 'Bills', amount: 95, type: 'expense' },
    { id: '8', date: '2026-06-18', description: 'Gas refill', category: 'Transport', amount: 55, type: 'expense' },
    { id: '9', date: '2026-06-20', description: 'Movie night', category: 'Entertainment', amount: 45, type: 'expense' },
    { id: '10', date: '2026-06-22', description: 'Freelance payment', category: 'Income', amount: 850, type: 'income' },
    { id: '11', date: '2026-06-24', description: 'Clothing', category: 'Lifestyle', amount: 130, type: 'expense' },
    { id: '12', date: '2026-06-26', description: 'Gym membership', category: 'Health', amount: 55, type: 'expense' }
];

function seedTransactionsIfEmpty() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockTransactions));
    }
}

function getStoredTransactions() {
    seedTransactionsIfEmpty();
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
        return mockTransactions;
    }

    try {
        const parsed = JSON.parse(stored);
        return Array.isArray(parsed) ? parsed : mockTransactions;
    } catch (error) {
        console.warn('Invalid transaction data in localStorage. Using fallback data.', error);
        return mockTransactions;
    }
}

function calculateTotals(transactions) {
    return transactions.reduce(
        (summary, transaction) => {
            const amount = Number(transaction.amount || 0);
            if (transaction.type === 'income') {
                summary.income += amount;
            } else {
                summary.expenses += amount;
            }
            return summary;
        },
        { income: 0, expenses: 0 }
    );
}

function calculateCategoryTotals(transactions) {
    return transactions.reduce((totals, transaction) => {
        if (transaction.type !== 'expense') {
            return totals;
        }

        const category = transaction.category || 'Other';
        totals[category] = (totals[category] || 0) + Number(transaction.amount || 0);
        return totals;
    }, {});
}

function getHighestCategory(categoryTotals) {
    const entries = Object.entries(categoryTotals);
    if (entries.length === 0) {
        return { category: 'None', amount: 0 };
    }

    return entries.reduce((top, current) => {
        return current[1] > top.amount ? { category: current[0], amount: current[1] } : top;
    }, { category: '', amount: 0 });
}

function renderCategoryChart(categoryTotals) {
    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (window.categoryChartInstance) {
        window.categoryChartInstance.destroy();
    }

    window.categoryChartInstance = new Chart(categoryChartCanvas, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [
                {
                    data,
                    backgroundColor: ['#3b82f6', '#f97316', '#22c55e', '#8b5cf6', '#ef4444', '#0ea5e9', '#facc15'],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                }
            ]
        },
        options: {
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#102a43'
                    }
                }
            },
            maintainAspectRatio: false,
        }
    });
}

function renderMonthlyChart(income, expenses) {
    const labels = ['Income', 'Expenses'];
    const data = [income, expenses];

    if (window.monthlyChartInstance) {
        window.monthlyChartInstance.destroy();
    }

    window.monthlyChartInstance = new Chart(monthlyChartCanvas, {
        type: 'bar',
        data: {
            labels,
            datasets: [
                {
                    label: 'Monthly totals',
                    data,
                    backgroundColor: ['#22c55e', '#ef4444'],
                    borderRadius: 12,
                    borderSkipped: false,
                }
            ]
        },
        options: {
            plugins: {
                legend: { display: false },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#486581'
                    },
                    grid: {
                        color: '#e2e8f0'
                    }
                },
                x: {
                    ticks: {
                        color: '#486581'
                    }
                }
            },
            maintainAspectRatio: false,
        }
    });
}

function updateBudget(expenses) {
    const remaining = Math.max(monthlyBudget - expenses, 0);
    const percent = Math.min(Math.round((expenses / monthlyBudget) * 100), 100);

    budgetLimitText.textContent = `$${monthlyBudget}`;
    spentAmountText.textContent = `$${expenses}`;
    remainingAmountText.textContent = `$${remaining}`;
    budgetProgressBar.style.width = `${percent}%`;
    budgetProgressBar.setAttribute('aria-valuenow', percent);
    document.getElementById('progressLabel').textContent = `${percent}%`;

    if (expenses > monthlyBudget) {
        budgetProgressBar.classList.add('over-budget');
        budgetWarningText.textContent = 'You are over budget. Adjust your spending to stay on track.';
    } else {
        budgetProgressBar.classList.remove('over-budget');
        budgetWarningText.textContent = 'Your spending is within budget for this month.';
    }
}

function initializeReports() {
    const transactions = getStoredTransactions();
    const totals = calculateTotals(transactions);
    const categoryTotals = calculateCategoryTotals(transactions);
    const highestCategory = getHighestCategory(categoryTotals);
    const savings = Math.max(totals.income - totals.expenses, 0);

    updateBudget(totals.expenses);
    renderCategoryChart(categoryTotals);
    renderMonthlyChart(totals.income, totals.expenses);
    highestCategoryText.textContent = `${highestCategory.category} — $${highestCategory.amount}`;
    monthlySavingsText.textContent = `$${savings}`;
}

initializeReports();
