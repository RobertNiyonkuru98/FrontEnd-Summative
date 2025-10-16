/* ============================================
   FINANCE TRACKER - STORAGE MODULE
   LocalStorage data persistence
   ============================================ */

/* ============================================
   CONSTANTS
   ============================================ */

const STORAGE_KEYS = {
  TRANSACTIONS: "financeTracker_transactions",
  SETTINGS: "financeTracker_settings",
  VERSION: "financeTracker_version",
};

const CURRENT_VERSION = "1.0.0";

/* ============================================
   TRANSACTIONS STORAGE
   ============================================ */

/**
 * Load all transactions from localStorage
 * @returns {Array} Array of transaction objects
 */
export function loadTransactions() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!data) {
      return [];
    }

    const transactions = JSON.parse(data);

    // Validate data structure
    if (!Array.isArray(transactions)) {
      console.error("Invalid transactions data structure");
      return [];
    }

    return transactions;
  } catch (error) {
    console.error("Error loading transactions:", error);
    return [];
  }
}

/**
 * Save transactions to localStorage
 * @param {Array} transactions - Array of transaction objects
 * @returns {boolean} Success status
 */
export function saveTransactions(transactions) {
  try {
    if (!Array.isArray(transactions)) {
      throw new Error("Transactions must be an array");
    }

    const data = JSON.stringify(transactions);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, data);

    // Save version info
    localStorage.setItem(STORAGE_KEYS.VERSION, CURRENT_VERSION);

    return true;
  } catch (error) {
    console.error("Error saving transactions:", error);
    return false;
  }
}

/**
 * Add a new transaction
 * @param {Object} transactionData - Transaction data (without id, timestamps)
 * @returns {Object|null} The created transaction or null if failed
 */
export function addTransaction(transactionData) {
  try {
    const transactions = loadTransactions();

    // Generate unique ID
    const id = generateId("txn");

    // Create full transaction object
    const transaction = {
      id,
      ...transactionData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Add to array
    transactions.push(transaction);

    // Save
    const success = saveTransactions(transactions);

    if (success) {
      return transaction;
    }

    return null;
  } catch (error) {
    console.error("Error adding transaction:", error);
    return null;
  }
}

/**
 * Update an existing transaction
 * @param {string} id - Transaction ID
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated transaction or null if not found
 */
export function updateTransaction(id, updates) {
  try {
    const transactions = loadTransactions();
    const index = transactions.findIndex((t) => t.id === id);

    if (index === -1) {
      console.error("Transaction not found:", id);
      return null;
    }

    // Update transaction
    transactions[index] = {
      ...transactions[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Save
    const success = saveTransactions(transactions);

    if (success) {
      return transactions[index];
    }

    return null;
  } catch (error) {
    console.error("Error updating transaction:", error);
    return null;
  }
}

/**
 * Delete a transaction
 * @param {string} id - Transaction ID
 * @returns {boolean} Success status
 */
export function deleteTransaction(id) {
  try {
    const transactions = loadTransactions();
    const filteredTransactions = transactions.filter((t) => t.id !== id);

    if (filteredTransactions.length === transactions.length) {
      console.error("Transaction not found:", id);
      return false;
    }

    return saveTransactions(filteredTransactions);
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return false;
  }
}

/**
 * Get a single transaction by ID
 * @param {string} id - Transaction ID
 * @returns {Object|null} Transaction object or null if not found
 */
export function getTransaction(id) {
  try {
    const transactions = loadTransactions();
    return transactions.find((t) => t.id === id) || null;
  } catch (error) {
    console.error("Error getting transaction:", error);
    return null;
  }
}

/**
 * Clear all transactions
 * @returns {boolean} Success status
 */
export function clearTransactions() {
  try {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    return true;
  } catch (error) {
    console.error("Error clearing transactions:", error);
    return false;
  }
}

/* ============================================
   SETTINGS STORAGE
   ============================================ */

/**
 * Load settings from localStorage
 * @returns {Object} Settings object with defaults
 */
export function loadSettings() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    // Default settings
    const defaults = {
      baseCurrency: "RWF",
      usdRate: 1200,
      eurRate: 1300,
      monthlyBudget: 100000,
      theme: "light",
    };

    if (!data) {
      return defaults;
    }

    const settings = JSON.parse(data);

    // Merge with defaults to handle new settings
    return { ...defaults, ...settings };
  } catch (error) {
    console.error("Error loading settings:", error);
    return {
      baseCurrency: "RWF",
      usdRate: 1200,
      eurRate: 1300,
      monthlyBudget: 100000,
      theme: "light",
    };
  }
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object
 * @returns {boolean} Success status
 */
export function saveSettings(settings) {
  try {
    const data = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEYS.SETTINGS, data);
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}

/**
 * Update specific setting
 * @param {string} key - Setting key
 * @param {*} value - Setting value
 * @returns {boolean} Success status
 */
export function updateSetting(key, value) {
  try {
    const settings = loadSettings();
    settings[key] = value;
    return saveSettings(settings);
  } catch (error) {
    console.error("Error updating setting:", error);
    return false;
  }
}

/* ============================================
   DATA IMPORT/EXPORT
   ============================================ */

/**
 * Export all data as JSON
 * @returns {Object} Complete data export
 */
export function exportData() {
  try {
    return {
      version: CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      transactions: loadTransactions(),
      settings: loadSettings(),
    };
  } catch (error) {
    console.error("Error exporting data:", error);
    return null;
  }
}

/**
 * Import data from JSON
 * Validates structure before importing
 * @param {Object} data - Data object to import
 * @returns {Object} Result with success status and message
 */
export function importData(data) {
  try {
    // Validate data structure
    if (!data || typeof data !== "object") {
      return { success: false, message: "Invalid data format" };
    }

    if (!data.transactions || !Array.isArray(data.transactions)) {
      return {
        success: false,
        message: "Missing or invalid transactions array",
      };
    }

    // Validate each transaction has required fields
    const requiredFields = ["id", "description", "amount", "category", "date"];
    for (const transaction of data.transactions) {
      for (const field of requiredFields) {
        if (!(field in transaction)) {
          return {
            success: false,
            message: `Transaction missing required field: ${field}`,
          };
        }
      }
    }

    // Import transactions
    const transSuccess = saveTransactions(data.transactions);
    if (!transSuccess) {
      return { success: false, message: "Failed to save transactions" };
    }

    // Import settings if present
    if (data.settings && typeof data.settings === "object") {
      saveSettings(data.settings);
    }

    return {
      success: true,
      message: `Successfully imported ${data.transactions.length} transactions`,
    };
  } catch (error) {
    console.error("Error importing data:", error);
    return { success: false, message: error.message };
  }
}

/**
 * Download data as JSON file
 */
export function downloadDataAsFile() {
  try {
    const data = exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `finance-tracker-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return true;
  } catch (error) {
    console.error("Error downloading data:", error);
    return false;
  }
}

/**
 * Upload and import data from file
 * @param {File} file - JSON file to import
 * @returns {Promise<Object>} Import result
 */
export function uploadDataFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error("No file provided"));
      return;
    }

    if (!file.name.endsWith(".json")) {
      reject(new Error("File must be a JSON file"));
      return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        const result = importData(data);
        resolve(result);
      } catch (error) {
        reject(new Error("Invalid JSON file: " + error.message));
      }
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsText(file);
  });
}

/* ============================================
   STATISTICS & QUERIES
   ============================================ */

/**
 * Get transactions within date range
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Array} Filtered transactions
 */
export function getTransactionsByDateRange(startDate, endDate) {
  try {
    const transactions = loadTransactions();
    return transactions.filter((t) => {
      const transDate = new Date(t.date);
      return transDate >= startDate && transDate <= endDate;
    });
  } catch (error) {
    console.error("Error getting transactions by date range:", error);
    return [];
  }
}

/**
 * Get transactions by category
 * @param {string} category - Category name
 * @returns {Array} Filtered transactions
 */
export function getTransactionsByCategory(category) {
  try {
    const transactions = loadTransactions();
    return transactions.filter((t) => t.category === category);
  } catch (error) {
    console.error("Error getting transactions by category:", error);
    return [];
  }
}

/**
 * Calculate total spending
 * @param {Array} transactions - Optional transactions array (uses all if not provided)
 * @returns {number} Total amount
 */
export function calculateTotal(transactions = null) {
  try {
    const data = transactions || loadTransactions();
    return data.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  } catch (error) {
    console.error("Error calculating total:", error);
    return 0;
  }
}

/**
 * Get spending by category
 * @returns {Object} Category totals
 */
export function getSpendingByCategory() {
  try {
    const transactions = loadTransactions();
    const categoryTotals = {};

    transactions.forEach((t) => {
      if (!categoryTotals[t.category]) {
        categoryTotals[t.category] = 0;
      }
      categoryTotals[t.category] += parseFloat(t.amount);
    });

    return categoryTotals;
  } catch (error) {
    console.error("Error getting spending by category:", error);
    return {};
  }
}

/**
 * Get spending for last N days
 * @param {number} days - Number of days
 * @returns {Object} Daily spending data
 */
export function getSpendingForLastDays(days = 7) {
  try {
    const transactions = loadTransactions();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    const dailySpending = {};

    // Initialize all days with 0
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      dailySpending[dateStr] = 0;
    }

    // Sum transactions by day
    transactions.forEach((t) => {
      const transDate = new Date(t.date);
      if (transDate >= startDate && transDate <= endDate) {
        if (dailySpending[t.date] !== undefined) {
          dailySpending[t.date] += parseFloat(t.amount);
        }
      }
    });

    return dailySpending;
  } catch (error) {
    console.error("Error getting spending for last days:", error);
    return {};
  }
}

/* ============================================
   UTILITY FUNCTIONS
   ============================================ */

/**
 * Generate unique ID
 * @param {string} prefix - ID prefix
 * @returns {string} Unique ID
 */
function generateId(prefix = "id") {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Check if localStorage is available
 * @returns {boolean} Availability status
 */
export function isStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get storage usage information
 * @returns {Object} Storage stats
 */
export function getStorageInfo() {
  try {
    const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || "";
    const settings = localStorage.getItem(STORAGE_KEYS.SETTINGS) || "";

    const transactionsSize = new Blob([transactions]).size;
    const settingsSize = new Blob([settings]).size;
    const totalSize = transactionsSize + settingsSize;

    return {
      transactionsSize,
      settingsSize,
      totalSize,
      transactionsCount: loadTransactions().length,
      formattedSize: formatBytes(totalSize),
    };
  } catch (error) {
    console.error("Error getting storage info:", error);
    return {
      transactionsSize: 0,
      settingsSize: 0,
      totalSize: 0,
      transactionsCount: 0,
      formattedSize: "0 B",
    };
  }
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Bytes
 * @returns {string} Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

/* ============================================
   EXPORTS
   ============================================ */

export default {
  // Transactions
  loadTransactions,
  saveTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransaction,
  clearTransactions,

  // Settings
  loadSettings,
  saveSettings,
  updateSetting,

  // Import/Export
  exportData,
  importData,
  downloadDataAsFile,
  uploadDataFromFile,

  // Queries
  getTransactionsByDateRange,
  getTransactionsByCategory,
  calculateTotal,
  getSpendingByCategory,
  getSpendingForLastDays,

  // Utilities
  isStorageAvailable,
  getStorageInfo,
};
