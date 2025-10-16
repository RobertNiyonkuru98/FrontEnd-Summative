/* ============================================
   FINANCE TRACKER - MULTI-PAGE APP
   Works with separate HTML files
   ============================================ */

// Import modules
import {
  validateDescription,
  validateAmount,
  validateDate,
  validateCategory,
} from "./validators.js";
import {
  loadTransactions,
  addTransaction as saveNewTransaction,
  updateTransaction as saveUpdatedTransaction,
  deleteTransaction as removeTransaction,
  clearTransactions,
  loadSettings,
  saveSettings,
  exportData,
  uploadDataFromFile,
} from "./storage.js";
import {
  renderTransactions,
  updateDashboard,
  updateBalancePage,
  updateHistoryPage,
  filterTransactionsByRegex,
  sortTransactions,
} from "./ui.js";

/* ============================================
   PAGE INITIALIZATION
   ============================================ */

class App {
  constructor() {
    this.currentPage = this.detectCurrentPage();
    this.init();
  }

  detectCurrentPage() {
    // Detect which page we're on based on URL
    const path = window.location.pathname;

    if (path.includes("dashboard")) return "dashboard";
    if (path.includes("transaction")) return "transactions";
    if (path.includes("balance")) return "balance";
    if (path.includes("history")) return "history";
    if (path.includes("settings")) return "settings";
    if (path.includes("about")) return "about";
    if (path.includes("home")) return "home";

    return "home"; // default
  }

  init() {
    console.log(`💰 Finance Tracker initialized on ${this.currentPage} page!`);

    // Initialize mobile menu
    this.setupMobileMenu();

    // Initialize based on current page
    switch (this.currentPage) {
      case "home":
        this.initHomePage();
        break;
      case "dashboard":
        this.initDashboardPage();
        break;
      case "transactions":
        this.initTransactionsPage();
        break;
      case "balance":
        this.initBalancePage();
        break;
      case "history":
        this.initHistoryPage();
        break;
      case "settings":
        this.initSettingsPage();
        break;
      case "about":
        this.initAboutPage();
        break;
    }
  }

  setupMobileMenu() {
    const navToggle = document.querySelector(".nav-toggle");
    const navMenu = document.querySelector(".nav-menu");

    if (navToggle && navMenu) {
      navToggle.addEventListener("click", () => {
        const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
        navToggle.setAttribute("aria-expanded", !isExpanded);
        navMenu.classList.toggle("active");
      });
    }
  }

  /* ============================================
     HOME PAGE
     ============================================ */
  initHomePage() {
    const transactions = loadTransactions();

    // Update home stats
    const totalTransactions = document.getElementById(
      "home-total-transactions"
    );
    const totalSpent = document.getElementById("home-total-spent");

    if (totalTransactions) {
      totalTransactions.textContent = transactions.length;
    }

    if (totalSpent) {
      if (transactions.length > 0) {
        const total = transactions.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );
        totalSpent.textContent = `RWF ${total.toLocaleString()}`;
      } else {
        totalSpent.textContent = "RWF 0";
      }
    }
  }

  /* ============================================
     DASHBOARD PAGE
     ============================================ */
  initDashboardPage() {
    updateDashboard();
  }

  /* ============================================
     TRANSACTIONS PAGE
     ============================================ */
  initTransactionsPage() {
    // Render transactions
    renderTransactions();

    // Setup search
    this.setupSearch();

    // Setup sort buttons
    this.setupSortButtons();

    // Setup add transaction button
    const addBtn = document.getElementById("add-transaction-btn");
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        window.location.href = "./add-transaction.html";
      });
    }
  }

  setupSearch() {
    const searchInput = document.getElementById("regex-search");
    const caseSensitive = document.getElementById("case-sensitive");
    const searchError = document.getElementById("search-error");

    if (!searchInput) return;

    let searchTimeout;

    searchInput.addEventListener("input", () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        const pattern = searchInput.value.trim();

        if (!pattern) {
          renderTransactions();
          if (searchError) searchError.textContent = "";
          return;
        }

        try {
          const flags = caseSensitive?.checked ? "" : "i";
          const regex = new RegExp(pattern, flags);

          if (searchError) searchError.textContent = "";
          filterTransactionsByRegex(regex);
        } catch (error) {
          if (searchError) {
            searchError.textContent = `Invalid regex: ${error.message}`;
          }
        }
      }, 300); // Debounce 300ms
    });

    if (caseSensitive) {
      caseSensitive.addEventListener("change", () => {
        searchInput.dispatchEvent(new Event("input"));
      });
    }
  }

  setupSortButtons() {
    let currentSort = { field: "date", order: "desc" };

    const sortBtns = {
      date: document.getElementById("sort-date"),
      description: document.getElementById("sort-description"),
      amount: document.getElementById("sort-amount"),
    };

    Object.entries(sortBtns).forEach(([field, btn]) => {
      if (btn) {
        btn.addEventListener("click", () => {
          // Toggle order if same field
          if (currentSort.field === field) {
            currentSort.order = currentSort.order === "desc" ? "asc" : "desc";
          } else {
            currentSort.field = field;
            currentSort.order = "desc";
          }

          sortTransactions(currentSort.field, currentSort.order);
        });
      }
    });
  }

  /* ============================================
     BALANCE PAGE
     ============================================ */
  initBalancePage() {
    updateBalancePage();
  }

  /* ============================================
     HISTORY PAGE
     ============================================ */
  initHistoryPage() {
    updateHistoryPage();

    // Setup time filter buttons
    const timeFilterBtns = document.querySelectorAll(".time-filter .btn");

    timeFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        // Remove active from all
        timeFilterBtns.forEach((b) => b.classList.remove("active"));

        // Add active to clicked
        btn.classList.add("active");

        // Update chart (this function should be in ui.js)
        const period = btn.dataset.period;
        console.log("Filter history by:", period);
        // You can call a function here to update the chart
      });
    });
  }

  /* ============================================
     SETTINGS PAGE
     ============================================ */
  initSettingsPage() {
    // Load current settings
    const settings = loadSettings();

    // Populate form
    const fields = {
      "base-currency": settings.baseCurrency,
      "usd-rate": settings.usdRate,
      "eur-rate": settings.eurRate,
      "monthly-budget": settings.monthlyBudget,
    };

    Object.entries(fields).forEach(([id, value]) => {
      const el = document.getElementById(id);
      if (el && value !== undefined) el.value = value;
    });

    // Setup form submit
    const settingsForm = document.getElementById("settings-form");
    if (settingsForm) {
      settingsForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.saveSettings();
      });
    }

    // Setup export button
    const exportBtn = document.getElementById("export-data");
    if (exportBtn) {
      exportBtn.addEventListener("click", () => this.exportData());
    }

    // Setup import button
    const importBtn = document.getElementById("import-data");
    if (importBtn) {
      importBtn.addEventListener("change", (e) =>
        this.importData(e.target.files[0])
      );
    }

    // Setup clear button
    const clearBtn = document.getElementById("clear-data");
    if (clearBtn) {
      clearBtn.addEventListener("click", () => this.clearData());
    }
  }

  saveSettings() {
    const settings = {
      baseCurrency: document.getElementById("base-currency").value,
      usdRate: parseFloat(document.getElementById("usd-rate").value),
      eurRate: parseFloat(document.getElementById("eur-rate").value),
      monthlyBudget: parseFloat(
        document.getElementById("monthly-budget").value
      ),
    };

    const success = saveSettings(settings);

    const statusEl = document.getElementById("settings-status");
    if (statusEl) {
      if (success) {
        statusEl.textContent = "✅ Settings saved successfully!";
        statusEl.className = "form-status success";
      } else {
        statusEl.textContent = "❌ Failed to save settings";
        statusEl.className = "form-status error";
      }

      setTimeout(() => {
        statusEl.textContent = "";
        statusEl.className = "form-status";
      }, 3000);
    }
  }

  exportData() {
    const data = exportData();
    if (!data) {
      alert("❌ Failed to export data");
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    alert("✅ Data exported successfully!");
  }

  async importData(file) {
    if (!file) return;

    try {
      const result = await uploadDataFromFile(file);

      if (result.success) {
        alert(`✅ ${result.message}\n\nRefreshing page...`);
        location.reload();
      } else {
        alert(`❌ Import failed: ${result.message}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error.message}`);
    }
  }

  clearData() {
    if (confirm("⚠️ Are you sure? This will delete ALL transactions!")) {
      if (confirm("⚠️ Really sure? This cannot be undone!")) {
        const success = clearTransactions();
        if (success) {
          alert("✅ All data cleared!");
          location.reload();
        } else {
          alert("❌ Failed to clear data");
        }
      }
    }
  }

  /* ============================================
     ABOUT PAGE
     ============================================ */
  initAboutPage() {
    console.log("About page loaded");
    // No special initialization needed
  }
}

/* ============================================
   FORM PAGE (ADD/EDIT TRANSACTION)
   ============================================ */

class TransactionFormPage {
  constructor() {
    this.form = document.getElementById("transaction-form");
    this.editingId = this.getEditingId();

    if (this.form) {
      this.init();
    }
  }

  getEditingId() {
    // Check if we're editing (ID in URL params)
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
  }

  init() {
    // If editing, populate form
    if (this.editingId) {
      this.loadTransactionData();
      document.getElementById("form-heading").textContent = "Edit Transaction";
    }

    // Setup form submit
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleSubmit();
    });

    // Setup cancel button
    const cancelBtn = document.getElementById("cancel-form");
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        window.location.href = "./transaction.html";
      });
    }
  }

  loadTransactionData() {
    const transactions = loadTransactions();
    const transaction = transactions.find((t) => t.id === this.editingId);

    if (transaction) {
      document.getElementById("description").value = transaction.description;
      document.getElementById("amount").value = transaction.amount;
      document.getElementById("category").value = transaction.category;
      document.getElementById("date").value = transaction.date;
      if (transaction.paymentMethod) {
        document.getElementById("payment-method").value =
          transaction.paymentMethod;
      }
    }
  }

  handleSubmit() {
    const formData = {
      description: document.getElementById("description").value.trim(),
      amount: document.getElementById("amount").value.trim(),
      category: document.getElementById("category").value,
      date: document.getElementById("date").value.trim(),
      paymentMethod: document.getElementById("payment-method").value,
    };

    // Validate
    const errors = this.validateForm(formData);

    if (errors.length > 0) {
      this.displayErrors(errors);
      return;
    }

    this.clearErrors();

    // Save
    let result;
    if (this.editingId) {
      result = saveUpdatedTransaction(this.editingId, formData);
    } else {
      result = saveNewTransaction(formData);
    }

    if (result) {
      alert("✅ Transaction saved!");
      window.location.href = "./transaction.html";
    } else {
      alert("❌ Failed to save transaction");
    }
  }

  validateForm(data) {
    const errors = [];

    const descResult = validateDescription(data.description);
    if (!descResult.valid) {
      errors.push({ field: "description", message: descResult.error });
    }

    const amountResult = validateAmount(data.amount);
    if (!amountResult.valid) {
      errors.push({ field: "amount", message: amountResult.error });
    }

    const categoryResult = validateCategory(data.category);
    if (!categoryResult.valid) {
      errors.push({ field: "category", message: categoryResult.error });
    }

    const dateResult = validateDate(data.date);
    if (!dateResult.valid) {
      errors.push({ field: "date", message: dateResult.error });
    }

    return errors;
  }

  displayErrors(errors) {
    errors.forEach((error) => {
      const errorEl = document.getElementById(`${error.field}-error`);
      const inputEl = document.getElementById(error.field);

      if (errorEl) errorEl.textContent = error.message;
      if (inputEl) {
        inputEl.classList.add("error");
        inputEl.setAttribute("aria-invalid", "true");
      }
    });

    // Focus first error
    if (errors.length > 0) {
      const firstField = document.getElementById(errors[0].field);
      if (firstField) firstField.focus();
    }
  }

  clearErrors() {
    document
      .querySelectorAll(".error-message")
      .forEach((el) => (el.textContent = ""));
    document.querySelectorAll(".form-input.error").forEach((el) => {
      el.classList.remove("error");
      el.removeAttribute("aria-invalid");
    });
  }
}

/* ============================================
   GLOBAL DELETE HANDLER
   ============================================ */

window.handleDelete = function (id) {
  if (!confirm("⚠️ Delete this transaction?")) return;

  const success = removeTransaction(id);

  if (success) {
    alert("✅ Transaction deleted!");
    location.reload();
  } else {
    alert("❌ Failed to delete");
  }
};

/* ============================================
   INITIALIZE ON PAGE LOAD
   ============================================ */

document.addEventListener("DOMContentLoaded", () => {
  // Check if we're on a form page
  if (document.getElementById("transaction-form")) {
    window.formPage = new TransactionFormPage();
  } else {
    window.app = new App();
  }
});

// Handle navigation buttons
document.querySelectorAll("[data-navigate]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = btn.getAttribute("data-navigate").trim();
    if (target === "dashboard") {
      window.location.href = "./dashboard.html";
    } else if (target === "transaction") {
      window.location.href = "./transaction.html";
    } else if (target === "task") {
      window.location.href = "./task.html";
    }
  });
});

// Also fix navigation link activation
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    document
      .querySelectorAll(".nav-link")
      .forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
  });
});

export { App, TransactionFormPage };
