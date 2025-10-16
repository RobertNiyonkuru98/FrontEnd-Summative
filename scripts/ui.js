/* ============================================
   FINANCE TRACKER - UI MODULE
   Rendering and display logic
   ============================================ */

import {
  loadTransactions,
  loadSettings,
  calculateTotal,
  getSpendingByCategory,
  getSpendingForLastDays,
  getTransactionsByDateRange,
  deleteTransaction,
} from "./storage.js";

import { highlightMatches } from "./validators.js";

/* ============================================
   TRANSACTIONS RENDERING
   ============================================ */

/**
 * Render all transactions to the page
 * @param {Array} transactions - Optional filtered transactions array
 * @param {RegExp} searchRegex - Optional regex for highlighting
 */
export function renderTransactions(transactions = null, searchRegex = null) {
  const data = transactions || loadTransactions();

  // Get containers
  const cardsContainer = document.getElementById("transactions-cards");
  const tableBody = document.getElementById("transactions-tbody");
  const emptyState = document.getElementById("empty-state");

  // Clear existing content
  if (cardsContainer) cardsContainer.innerHTML = "";
  if (tableBody) tableBody.innerHTML = "";

  // Show empty state if no transactions
  if (data.length === 0) {
    if (emptyState) emptyState.removeAttribute("hidden");
    return;
  }

  // Hide empty state
  if (emptyState) emptyState.setAttribute("hidden", "");

  // Sort by date (newest first)
  const sorted = [...data].sort((a, b) => new Date(b.date) - new Date(a.date));

  // Render each transaction
  sorted.forEach((transaction) => {
    renderTransactionCard(transaction, cardsContainer, searchRegex);
    renderTransactionRow(transaction, tableBody, searchRegex);
  });
}

/**
 * Render a single transaction as a card (for mobile)
 */
function renderTransactionCard(transaction, container, searchRegex = null) {
  if (!container) return;

  const card = document.createElement("div");
  card.className = "transaction-card";
  card.dataset.id = transaction.id;

  // Apply highlighting if search regex provided
  const description = searchRegex
    ? highlightMatches(transaction.description, searchRegex)
    : escapeHtml(transaction.description);

  const amount = searchRegex
    ? highlightMatches(String(transaction.amount), searchRegex)
    : escapeHtml(String(transaction.amount));

  card.innerHTML = `
        <div class="transaction-card-header">
            <strong class="transaction-description">${description}</strong>
            <span class="transaction-amount">-RWF ${formatNumber(
              transaction.amount
            )}</span>
        </div>
        <div class="transaction-meta">
            ${getCategoryEmoji(transaction.category)} ${escapeHtml(
    transaction.category
  )} • ${formatDate(transaction.date)}
            ${
              transaction.paymentMethod
                ? ` • ${escapeHtml(transaction.paymentMethod)}`
                : ""
            }
        </div>
        <div class="transaction-actions">
            <button class="btn btn-secondary" onclick="window.app.form.showForm(${JSON.stringify(
              transaction
            ).replace(/"/g, "&quot;")})" aria-label="Edit transaction">
                ✏️ Edit
            </button>
            <button class="btn btn-danger" onclick="handleDelete('${
              transaction.id
            }')" aria-label="Delete transaction">
                🗑️ Delete
            </button>
        </div>
    `;

  container.appendChild(card);
}

/**
 * Render a single transaction as a table row (for desktop)
 */
function renderTransactionRow(transaction, tbody, searchRegex = null) {
  if (!tbody) return;

  const row = document.createElement("tr");
  row.dataset.id = transaction.id;

  // Apply highlighting if search regex provided
  const description = searchRegex
    ? highlightMatches(transaction.description, searchRegex)
    : escapeHtml(transaction.description);

  const amount = searchRegex
    ? highlightMatches(String(transaction.amount), searchRegex)
    : formatNumber(transaction.amount);

  row.innerHTML = `
        <td>${formatDate(transaction.date)}</td>
        <td>${description}</td>
        <td>${getCategoryEmoji(transaction.category)} ${escapeHtml(
    transaction.category
  )}</td>
        <td style="color: var(--danger); font-weight: 600;">-RWF ${amount}</td>
        <td>${
          transaction.paymentMethod
            ? escapeHtml(transaction.paymentMethod)
            : "-"
        }</td>
        <td>
            <button class="btn btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="window.app.form.showForm(${JSON.stringify(
              transaction
            ).replace(/"/g, "&quot;")})" aria-label="Edit transaction">
                ✏️
            </button>
            <button class="btn btn-danger" style="padding: 6px 12px; font-size: 12px;" onclick="handleDelete('${
              transaction.id
            }')" aria-label="Delete transaction">
                🗑️
            </button>
        </td>
    `;

  tbody.appendChild(row);
}

/* ============================================
   DASHBOARD RENDERING
   ============================================ */

/**
 * Update all dashboard statistics
 */
export function updateDashboard() {
  updateMetrics();
  updateBudgetStatus();
  updateTrendChart();
  updateTopCategories();
}

/**
 * Update metric cards (Total, Week, Count, Average)
 */
function updateMetrics() {
  const transactions = loadTransactions();

  // Total spent
  const total = calculateTotal(transactions);
  const totalEl = document.getElementById("total-spent");
  if (totalEl) {
    totalEl.textContent = `RWF ${formatNumber(total)}`;
  }

  // This week
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekTransactions = getTransactionsByDateRange(weekAgo, now);
  const weekTotal = calculateTotal(weekTransactions);
  const weekEl = document.getElementById("week-spent");
  if (weekEl) {
    weekEl.textContent = `RWF ${formatNumber(weekTotal)}`;
  }

  // Transaction count
  const countEl = document.getElementById("total-count");
  if (countEl) {
    countEl.textContent = transactions.length;
  }

  // Average
  const average = transactions.length > 0 ? total / transactions.length : 0;
  const avgEl = document.getElementById("average-spent");
  if (avgEl) {
    avgEl.textContent = `RWF ${formatNumber(average)}`;
  }
}

/**
 * Update budget status with progress bar and ARIA live message
 */
function updateBudgetStatus() {
  const settings = loadSettings();
  const transactions = loadTransactions();
  const total = calculateTotal(transactions);
  const budget = settings.monthlyBudget || 100000;

  // Calculate percentage
  const percentage = (total / budget) * 100;

  // Update progress bar
  const progressBar = document.getElementById("budget-progress");
  if (progressBar) {
    progressBar.style.width = `${Math.min(percentage, 100)}%`;
    progressBar.parentElement.setAttribute(
      "aria-valuenow",
      Math.round(percentage)
    );

    // Change color based on status
    progressBar.className = "progress-fill";
    if (percentage >= 100) {
      progressBar.classList.add("danger");
    } else if (percentage >= 80) {
      progressBar.classList.add("warning");
    }
  }

  // Update budget cap display
  const budgetCapEl = document.getElementById("budget-cap");
  if (budgetCapEl) {
    budgetCapEl.textContent = `RWF ${formatNumber(budget)}`;
  }

  // Update message with ARIA live
  const messageEl = document.getElementById("budget-message");
  if (messageEl) {
    const remaining = budget - total;

    messageEl.className = "budget-message";

    if (remaining > 0) {
      messageEl.textContent = `✅ RWF ${formatNumber(remaining)} remaining`;
      messageEl.classList.add("success");
      messageEl.setAttribute("aria-live", "polite");
    } else if (remaining === 0) {
      messageEl.textContent = `⚠️ Budget limit reached`;
      messageEl.classList.add("warning");
      messageEl.setAttribute("aria-live", "assertive");
    } else {
      messageEl.textContent = `❌ RWF ${formatNumber(
        Math.abs(remaining)
      )} over budget!`;
      messageEl.classList.add("danger");
      messageEl.setAttribute("aria-live", "assertive");
    }
  }
}

/**
 * Update 7-day spending trend chart
 */
function updateTrendChart() {
  const chartContainer = document.getElementById("trend-chart");
  if (!chartContainer) return;

  const dailyData = getSpendingForLastDays(7);

  // Clear existing chart
  chartContainer.innerHTML = "";

  // Get max value for scaling
  const values = Object.values(dailyData);
  const maxValue = Math.max(...values, 1);

  // Create bars
  Object.entries(dailyData).forEach(([date, amount]) => {
    const bar = document.createElement("div");
    const heightPercent = (amount / maxValue) * 100;

    bar.style.cssText = `
            flex: 1;
            background: linear-gradient(to top, var(--primary), var(--primary-light));
            border-radius: 4px 4px 0 0;
            height: ${heightPercent}%;
            min-height: ${amount > 0 ? "10px" : "2px"};
            position: relative;
            transition: all 0.3s ease;
        `;

    bar.title = `${formatDate(date)}: RWF ${formatNumber(amount)}`;

    // Add hover effect
    bar.addEventListener("mouseenter", function () {
      this.style.background = "var(--primary-dark)";
    });
    bar.addEventListener("mouseleave", function () {
      this.style.background =
        "linear-gradient(to top, var(--primary), var(--primary-light))";
    });

    chartContainer.appendChild(bar);
  });
}

/**
 * Update top spending categories list
 */
function updateTopCategories() {
  const listEl = document.getElementById("top-categories-list");
  if (!listEl) return;

  const categoryTotals = getSpendingByCategory();

  // Sort by amount (descending)
  const sorted = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5); // Top 5

  listEl.innerHTML = "";

  if (sorted.length === 0) {
    listEl.innerHTML = "<li>No data yet</li>";
    return;
  }

  sorted.forEach(([category, amount]) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <span>${getCategoryEmoji(category)} ${escapeHtml(category)}</span>
            <strong>RWF ${formatNumber(amount)}</strong>
        `;
    listEl.appendChild(li);
  });
}

/* ============================================
   BALANCE PAGE
   ============================================ */

/**
 * Update balance page displays
 */
export function updateBalancePage() {
  updateBalanceAmount();
  updateCategoryBreakdown();
  updateCurrencyConversion();
}

/**
 * Update main balance display
 */
function updateBalanceAmount() {
  const transactions = loadTransactions();
  const settings = loadSettings();
  const totalSpent = calculateTotal(transactions);

  // Calculate remaining balance (budget - spent)
  const monthlyBudget = settings.monthlyBudget || 100000;
  const remainingBalance = monthlyBudget - totalSpent;

  const balanceEl = document.getElementById("balance-amount");
  if (balanceEl) {
    // Show remaining balance (can be negative if overspent)
    if (remainingBalance >= 0) {
      balanceEl.textContent = `RWF ${formatNumber(remainingBalance)}`;
      balanceEl.style.color = "var(--success)";
    } else {
      balanceEl.textContent = `RWF ${formatNumber(Math.abs(remainingBalance))}`;
      balanceEl.style.color = "var(--danger)";
      balanceEl.parentElement.innerHTML = `
                <h3>Available Balance</h3>
                <p class="balance-amount" id="balance-amount" style="color: var(--danger);">-RWF ${formatNumber(
                  Math.abs(remainingBalance)
                )}</p>
                <p class="balance-updated">Over budget by RWF ${formatNumber(
                  Math.abs(remainingBalance)
                )}</p>
            `;
    }
  }

  const updatedEl = document.getElementById("balance-updated");
  if (updatedEl && remainingBalance >= 0) {
    updatedEl.textContent = new Date().toLocaleString();
  }
}

/**
 * Update category breakdown
 */
function updateCategoryBreakdown() {
  const listEl = document.getElementById("category-breakdown-list");
  if (!listEl) return;

  const categoryTotals = getSpendingByCategory();

  listEl.innerHTML = "";

  if (Object.keys(categoryTotals).length === 0) {
    listEl.innerHTML = "<li>No transactions yet</li>";
    return;
  }

  Object.entries(categoryTotals).forEach(([category, amount]) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <span>${getCategoryEmoji(category)} ${escapeHtml(category)}</span>
            <strong style="color: var(--danger);">-RWF ${formatNumber(
              amount
            )}</strong>
        `;
    listEl.appendChild(li);
  });
}

/**
 * Update currency conversion display
 */
function updateCurrencyConversion() {
  const settings = loadSettings();
  const transactions = loadTransactions();
  const totalRWF = calculateTotal(transactions);

  // Convert to USD
  const usdEl = document.getElementById("balance-usd");
  if (usdEl) {
    const usdAmount = totalRWF / settings.usdRate;
    usdEl.textContent = `$${usdAmount.toFixed(2)}`;
  }

  // Convert to EUR
  const eurEl = document.getElementById("balance-eur");
  if (eurEl) {
    const eurAmount = totalRWF / settings.eurRate;
    eurEl.textContent = `€${eurAmount.toFixed(2)}`;
  }
}

/* ============================================
   HISTORY PAGE
   ============================================ */

/**
 * Update history page
 */
export function updateHistoryPage() {
  updateHistoryChart();
  updateMonthlyComparison();
}

/**
 * Update history chart
 */
function updateHistoryChart() {
  const chartContainer = document.getElementById("history-chart");
  if (!chartContainer) return;

  // Similar to trend chart but for selected period
  const dailyData = getSpendingForLastDays(30); // Last 30 days

  chartContainer.innerHTML = "";

  const values = Object.values(dailyData);
  const maxValue = Math.max(...values, 1);

  Object.entries(dailyData).forEach(([date, amount]) => {
    const bar = document.createElement("div");
    const heightPercent = (amount / maxValue) * 100;

    bar.style.cssText = `
            flex: 1;
            background: linear-gradient(to top, var(--primary), var(--primary-light));
            border-radius: 4px 4px 0 0;
            height: ${heightPercent}%;
            min-height: ${amount > 0 ? "5px" : "2px"};
        `;

    bar.title = `${formatDate(date)}: RWF ${formatNumber(amount)}`;

    chartContainer.appendChild(bar);
  });
}

/**
 * Update monthly comparison
 */
function updateMonthlyComparison() {
  const listEl = document.getElementById("monthly-comparison-list");
  if (!listEl) return;

  const transactions = loadTransactions();

  // Group by month
  const monthlyTotals = {};

  transactions.forEach((t) => {
    const date = new Date(t.date);
    const monthKey = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}`;
    const monthName = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });

    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = { name: monthName, total: 0 };
    }
    monthlyTotals[monthKey].total += parseFloat(t.amount);
  });

  // Sort by month (newest first)
  const sorted = Object.entries(monthlyTotals)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 6); // Last 6 months

  listEl.innerHTML = "";

  if (sorted.length === 0) {
    listEl.innerHTML = "<li>No data yet</li>";
    return;
  }

  sorted.forEach(([key, data]) => {
    const li = document.createElement("li");
    li.innerHTML = `
            <span>${data.name}</span>
            <strong>RWF ${formatNumber(data.total)}</strong>
        `;
    listEl.appendChild(li);
  });
}

/* ============================================
   SEARCH & FILTER
   ============================================ */

/**
 * Filter transactions by regex pattern
 * @param {RegExp} regex - Compiled regex pattern
 */
export function filterTransactionsByRegex(regex) {
  const transactions = loadTransactions();

  if (!regex) {
    renderTransactions(transactions);
    return;
  }

  // Filter transactions that match the regex
  const filtered = transactions.filter((t) => {
    return (
      regex.test(t.description) ||
      regex.test(String(t.amount)) ||
      regex.test(t.category) ||
      regex.test(t.date)
    );
  });

  // Render with highlighting
  renderTransactions(filtered, regex);
}

/**
 * Sort transactions by field
 * @param {string} field - Field to sort by (date, description, amount)
 * @param {string} order - Sort order (asc, desc)
 */
export function sortTransactions(field, order = "desc") {
  const transactions = loadTransactions();

  const sorted = [...transactions].sort((a, b) => {
    let aVal, bVal;

    switch (field) {
      case "date":
        aVal = new Date(a.date);
        bVal = new Date(b.date);
        break;
      case "description":
        aVal = a.description.toLowerCase();
        bVal = b.description.toLowerCase();
        break;
      case "amount":
        aVal = parseFloat(a.amount);
        bVal = parseFloat(b.amount);
        break;
      default:
        return 0;
    }

    if (order === "asc") {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  renderTransactions(sorted);

  // Update button text to show sort direction
  updateSortButtonStates(field, order);
}

/**
 * Update sort button states to show active sort
 */
function updateSortButtonStates(field, order) {
  const sortButtons = {
    date: document.getElementById("sort-date"),
    description: document.getElementById("sort-description"),
    amount: document.getElementById("sort-amount"),
  };

  // Reset all buttons
  Object.values(sortButtons).forEach((btn) => {
    if (btn) {
      btn.classList.remove("active");
      btn.style.background = "";
    }
  });

  // Highlight active button
  const activeBtn = sortButtons[field];
  if (activeBtn) {
    activeBtn.classList.add("active");
    activeBtn.style.background = "var(--primary)";
    activeBtn.style.color = "white";

    // Update arrow based on order
    const arrow = order === "asc" ? "⬆️" : "⬇️";
    const btnText = activeBtn.textContent.split(" ")[0]; // Get first word
    activeBtn.textContent = `${btnText} ${arrow}`;
  }
}

/* ============================================
   DELETE HANDLER
   ============================================ */

/**
 * Handle transaction deletion
 * Must be globally accessible for inline onclick handlers
 */
window.handleDelete = function (id) {
  if (!confirm("⚠️ Are you sure you want to delete this transaction?")) {
    return;
  }

  const success = deleteTransaction(id);

  if (success) {
    // Re-render transactions
    renderTransactions();

    // Update all dashboards
    updateDashboard();
    updateBalancePage();
    updateHistoryPage();

    // Update home stats
    if (window.app) {
      window.app.updateHomeStats();
    }

    alert("✅ Transaction deleted successfully");
  } else {
    alert("❌ Failed to delete transaction");
  }
};

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Format number with thousands separator
 */
function formatNumber(num) {
  return parseFloat(num).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/**
 * Format date to readable string
 */
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Get emoji for category
 */
function getCategoryEmoji(category) {
  const emojiMap = {
    Food: "🍔",
    Books: "📚",
    Transport: "🚌",
    Entertainment: "🎮",
    Fees: "📝",
    Other: "📦",
  };
  return emojiMap[category] || "📦";
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/* ============================================
   INITIALIZATION
   ============================================ */

/**
 * Initialize UI when page loads
 */
export function initUI() {
  // Render initial data
  renderTransactions();
  updateDashboard();
  updateBalancePage();
  updateHistoryPage();

  // Set up history time filter buttons
  setupHistoryFilters();

  console.log("🎨 UI initialized");
}

/**
 * Setup history time filter buttons
 */
function setupHistoryFilters() {
  const timeFilterBtns = document.querySelectorAll(".time-filter .btn");

  timeFilterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      timeFilterBtns.forEach((b) => b.classList.remove("active"));

      // Add active class to clicked button
      btn.classList.add("active");

      // Get period
      const period = btn.dataset.period;

      // Update chart based on period
      updateHistoryChartByPeriod(period);
    });
  });
}

/**
 * Update history chart based on selected period
 */
function updateHistoryChartByPeriod(period) {
  const chartContainer = document.getElementById("history-chart");
  if (!chartContainer) return;

  let days;
  switch (period) {
    case "7":
      days = 7;
      break;
    case "30":
      days = 30;
      break;
    case "all":
      // For 'all', show last 90 days
      days = 90;
      break;
    default:
      days = 7;
  }

  const dailyData = getSpendingForLastDays(days);

  // Clear existing chart
  chartContainer.innerHTML = "";

  // Get max value for scaling
  const values = Object.values(dailyData);
  const maxValue = Math.max(...values, 1);

  // Create bars
  Object.entries(dailyData).forEach(([date, amount]) => {
    const bar = document.createElement("div");
    const heightPercent = (amount / maxValue) * 100;

    bar.style.cssText = `
            flex: 1;
            background: linear-gradient(to top, var(--primary), var(--primary-light));
            border-radius: 4px 4px 0 0;
            height: ${heightPercent}%;
            min-height: ${amount > 0 ? "5px" : "2px"};
        `;

    bar.title = `${formatDate(date)}: RWF ${formatNumber(amount)}`;

    chartContainer.appendChild(bar);
  });
}

/* ============================================
   EXPORTS
   ============================================ */

export default {
  renderTransactions,
  updateDashboard,
  updateBalancePage,
  updateHistoryPage,
  filterTransactionsByRegex,
  sortTransactions,
  initUI,
};
