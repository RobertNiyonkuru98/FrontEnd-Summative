/* ============================================
   FINANCE TRACKER - VALIDATION MODULE
   Regex-based input validation
   ============================================ */

/* ============================================
   REGEX PATTERNS
   ============================================ */

// 1. Description/Title - No leading/trailing spaces, collapse doubles
// Pattern: Must start and end with non-whitespace, no consecutive spaces
const DESCRIPTION_REGEX = /^\S+(?:\s\S+)*$/;

// 2. Numeric Field (Amount) - Positive number with max 2 decimals
// Pattern: Matches: 0, 1, 10, 100.50, 1234.99
// Rejects: 01, -5, 100.123
const AMOUNT_REGEX = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// 3. Date (YYYY-MM-DD) - ISO date format
// Pattern: Year (4 digits), month (01-12), day (01-31)
const DATE_REGEX = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// 4. Category/Tag - Letters, spaces, hyphens only
// Pattern: Must start with letter, can contain spaces or hyphens between words
const CATEGORY_REGEX = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// 5. ADVANCED - Duplicate Words Detection (back-reference)
// Pattern: Detects repeated words like "the the" or "coffee coffee"
const DUPLICATE_WORD_REGEX = /\b(\w+)\s+\1\b/i;

// 6. ADVANCED - Cents Present (lookahead for decimal cents)
// Pattern: Finds amounts with exactly 2 decimal places
const CENTS_REGEX = /\.\d{2}\b/;

// 7. ADVANCED - Beverage Keywords (for search functionality)
// Pattern: Case-insensitive match for common beverages
const BEVERAGE_REGEX = /(coffee|tea|juice|soda|water)/i;

// 8. Email validation (for About page contact)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/* ============================================
   VALIDATION FUNCTIONS
   ============================================ */

/**
 * Validate description/title field
 * Rules:
 * - No leading/trailing whitespace
 * - No consecutive spaces
 * - Minimum 3 characters
 * - Maximum 100 characters
 *
 * @param {string} description - The description to validate
 * @returns {object} { valid: boolean, error: string }
 */
export function validateDescription(description) {
  if (!description || typeof description !== "string") {
    return { valid: false, error: "Description is required" };
  }

  const trimmed = description.trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: "Description must be at least 3 characters long",
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: "Description must not exceed 100 characters",
    };
  }

  // Check for leading/trailing spaces in original string
  if (description !== trimmed) {
    return {
      valid: false,
      error: "Description cannot have leading or trailing spaces",
    };
  }

  // Check for proper format (no consecutive spaces)
  if (!DESCRIPTION_REGEX.test(description)) {
    return {
      valid: false,
      error: "Description cannot contain consecutive spaces",
    };
  }

  // ADVANCED: Check for duplicate words
  if (DUPLICATE_WORD_REGEX.test(description)) {
    return { valid: false, error: "Description contains duplicate words" };
  }

  return { valid: true, error: "" };
}

/**
 * Validate amount field
 * Rules:
 * - Must be a positive number
 * - No leading zeros (except for 0.xx)
 * - Maximum 2 decimal places
 * - Cannot exceed 9,999,999.99
 *
 * @param {string|number} amount - The amount to validate
 * @returns {object} { valid: boolean, error: string }
 */
export function validateAmount(amount) {
  if (amount === null || amount === undefined || amount === "") {
    return { valid: false, error: "Amount is required" };
  }

  const amountStr = String(amount).trim();

  // Check regex pattern
  if (!AMOUNT_REGEX.test(amountStr)) {
    return {
      valid: false,
      error:
        "Amount must be a positive number with max 2 decimals (e.g., 12.50)",
    };
  }

  const numValue = parseFloat(amountStr);

  // Check if it's a valid number
  if (isNaN(numValue)) {
    return { valid: false, error: "Amount must be a valid number" };
  }

  // Check minimum value
  if (numValue <= 0) {
    return { valid: false, error: "Amount must be greater than 0" };
  }

  // Check maximum value (reasonable limit)
  if (numValue > 9999999.99) {
    return { valid: false, error: "Amount is too large (max: 9,999,999.99)" };
  }

  return { valid: true, error: "" };
}

/**
 * Validate date field
 * Rules:
 * - Must be in YYYY-MM-DD format
 * - Must be a valid calendar date
 * - Cannot be in the future
 * - Cannot be more than 10 years in the past
 *
 * @param {string} date - The date to validate
 * @returns {object} { valid: boolean, error: string }
 */
export function validateDate(date) {
  if (!date || typeof date !== "string") {
    return { valid: false, error: "Date is required" };
  }

  const trimmed = date.trim();

  // Check format with regex
  if (!DATE_REGEX.test(trimmed)) {
    return { valid: false, error: "Date must be in YYYY-MM-DD format" };
  }

  // Parse the date
  const [year, month, day] = trimmed.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);

  // Check if it's a valid calendar date
  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() !== month - 1 ||
    dateObj.getDate() !== day
  ) {
    return {
      valid: false,
      error: "Invalid date (e.g., Feb 30 does not exist)",
    };
  }

  // Check if date is in the future
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (dateObj > today) {
    return { valid: false, error: "Date cannot be in the future" };
  }

  // Check if date is too far in the past (10 years)
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);
  tenYearsAgo.setHours(0, 0, 0, 0);

  if (dateObj < tenYearsAgo) {
    return {
      valid: false,
      error: "Date cannot be more than 10 years in the past",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Validate category field
 * Rules:
 * - Must contain only letters, spaces, or hyphens
 * - Must start and end with a letter
 * - Cannot have consecutive spaces or hyphens
 * - Minimum 3 characters, maximum 30 characters
 *
 * @param {string} category - The category to validate
 * @returns {object} { valid: boolean, error: string }
 */
export function validateCategory(category) {
  if (!category || typeof category !== "string") {
    return { valid: false, error: "Category is required" };
  }

  const trimmed = category.trim();

  if (trimmed.length < 3) {
    return {
      valid: false,
      error: "Category must be at least 3 characters long",
    };
  }

  if (trimmed.length > 30) {
    return { valid: false, error: "Category must not exceed 30 characters" };
  }

  // Check pattern
  if (!CATEGORY_REGEX.test(trimmed)) {
    return {
      valid: false,
      error: "Category can only contain letters, spaces, or hyphens",
    };
  }

  return { valid: true, error: "" };
}

/**
 * Validate email address (for About page)
 *
 * @param {string} email - The email to validate
 * @returns {object} { valid: boolean, error: string }
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") {
    return { valid: false, error: "Email is required" };
  }

  const trimmed = email.trim();

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Invalid email address format" };
  }

  return { valid: true, error: "" };
}

/* ============================================
   SEARCH/FILTER REGEX HELPERS
   ============================================ */

/**
 * Safely compile a user-provided regex pattern
 * Handles errors and returns null if invalid
 *
 * @param {string} pattern - The regex pattern string
 * @param {string} flags - Optional regex flags (default: 'i' for case-insensitive)
 * @returns {RegExp|null} Compiled regex or null if invalid
 */
export function compileRegex(pattern, flags = "i") {
  if (!pattern || typeof pattern !== "string") {
    return null;
  }

  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    console.error("Invalid regex pattern:", error.message);
    return null;
  }
}

/**
 * Check if text contains cents (decimal with 2 places)
 * Used for filtering transactions with specific decimal amounts
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if contains .XX pattern
 */
export function hasCents(text) {
  return CENTS_REGEX.test(String(text));
}

/**
 * Check if text mentions a beverage
 * Used for filtering food/beverage related transactions
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if mentions coffee, tea, juice, etc.
 */
export function isBeverage(text) {
  return BEVERAGE_REGEX.test(String(text));
}

/**
 * Check if text contains duplicate consecutive words
 * Used for data quality checks
 *
 * @param {string} text - Text to check
 * @returns {boolean} True if contains duplicate words
 */
export function hasDuplicateWords(text) {
  return DUPLICATE_WORD_REGEX.test(String(text));
}

/**
 * Highlight regex matches in text using <mark> tags
 * Safe for accessibility - preserves text structure
 *
 * @param {string} text - Original text
 * @param {RegExp} regex - Compiled regex pattern
 * @returns {string} HTML string with <mark> tags around matches
 */
export function highlightMatches(text, regex) {
  if (!regex || !text) {
    return text;
  }

  try {
    // Escape HTML to prevent XSS
    const escaped = String(text).replace(/[&<>"']/g, (char) => {
      const escapeMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };
      return escapeMap[char];
    });

    // Highlight matches
    return escaped.replace(regex, (match) => `<mark>${match}</mark>`);
  } catch (error) {
    console.error("Error highlighting matches:", error);
    return text;
  }
}

/* ============================================
   VALIDATION HELPERS
   ============================================ */

/**
 * Validate entire transaction object
 * Runs all validations and returns combined results
 *
 * @param {object} transaction - Transaction data object
 * @returns {object} { valid: boolean, errors: array }
 */
export function validateTransaction(transaction) {
  const errors = [];

  // Validate description
  const descResult = validateDescription(transaction.description);
  if (!descResult.valid) {
    errors.push({ field: "description", message: descResult.error });
  }

  // Validate amount
  const amountResult = validateAmount(transaction.amount);
  if (!amountResult.valid) {
    errors.push({ field: "amount", message: amountResult.error });
  }

  // Validate category
  const categoryResult = validateCategory(transaction.category);
  if (!categoryResult.valid) {
    errors.push({ field: "category", message: categoryResult.error });
  }

  // Validate date
  const dateResult = validateDate(transaction.date);
  if (!dateResult.valid) {
    errors.push({ field: "date", message: dateResult.error });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitize user input to prevent XSS
 *
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") {
    return "";
  }

  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .substring(0, 200); // Limit length
}

/* ============================================
   EXPORT REGEX PATTERNS (for testing)
   ============================================ */
export const PATTERNS = {
  DESCRIPTION: DESCRIPTION_REGEX,
  AMOUNT: AMOUNT_REGEX,
  DATE: DATE_REGEX,
  CATEGORY: CATEGORY_REGEX,
  DUPLICATE_WORD: DUPLICATE_WORD_REGEX,
  CENTS: CENTS_REGEX,
  BEVERAGE: BEVERAGE_REGEX,
  EMAIL: EMAIL_REGEX,
};

// Export all validators as default
export default {
  validateDescription,
  validateAmount,
  validateDate,
  validateCategory,
  validateEmail,
  validateTransaction,
  compileRegex,
  highlightMatches,
  hasCents,
  isBeverage,
  hasDuplicateWords,
  sanitizeInput,
  PATTERNS,
};
