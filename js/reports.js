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

const mockTransactions = [
    { id: '1', date: '2026-06-02', description: 'Groceries', category: 'Food', amount: 210, type: 'expense' },
    { id: '2', date: '2026-06-05', description: 'Salary', category: 'Income', amount: 4200, type: 'income' },
    { id: '3', date: '2026-06-08', description: 'Utilities', category: 'Bills', amount: 160, type: 'expense' }
];

function getStoredTransactions() {
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
    const savings = Math.max(totals.income - totals.expenses, 0);

    updateBudget(totals.expenses);
    highestCategoryText.textContent = 'Pending category analytics';
    monthlySavingsText.textContent = `$${savings}`;
}

initializeReports();
