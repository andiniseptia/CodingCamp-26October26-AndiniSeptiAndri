// ============================================================
// 1. CONSTANTS
// Fixed values used throughout the app: Local Storage keys,
// supported categories, chart colors, and sort options.
// ============================================================

// Local Storage keys — centralised so they never get out of sync
const LS_TRANSACTIONS = "ebv_transactions";
const LS_THEME        = "ebv_theme";

// Supported expense categories (order determines dropdown order)
const CATEGORIES = ["Food", "Transport", "Fun"];

// Fixed colors for each category in the Chart.js pie chart
const CATEGORY_COLORS = {
  Food:      "#FF6384",
  Transport: "#36A2EB",
  Fun:       "#FFCE56"
};

// All valid sort-order identifiers for the sort dropdown
const SORT_OPTIONS = [
  "newest-first",
  "amount-asc",
  "amount-desc",
  "category-az"
];


// ============================================================
// 2. STATE
// Single source of truth for all runtime data.
// Every UI update reads from this object — never from Local Storage.
// ============================================================

const state = {
  transactions: [],          // Transaction[] — in insertion order (newest at end)
  theme:        "light",     // "light" | "dark"
  sortOrder:    "newest-first", // active sort option
  activeView:   "list"       // "list" | "monthly"
};


// ============================================================
// 3. STORAGE MANAGER
// Reads and writes data to Local Storage.
// All try/catch error handling for storage operations lives here.
// ============================================================

// Loads the saved transaction array from Local Storage; returns [] on any failure
function loadTransactions() {
  const raw = localStorage.getItem(LS_TRANSACTIONS);
  if (raw === null) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.warn("ebv: could not parse stored transactions — resetting to empty.", e);
    return [];
  }
}

// Persists the current transaction array to Local Storage; shows a warning banner on failure
function saveTransactions(transactions) {
  try {
    localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(transactions));
    hideStorageWarning(); // dismiss any prior warning
  } catch (error) {
    console.error("[ebv] Failed to save to Local Storage:", error);
    showStorageWarning(
      "Your data could not be saved (storage might be full). " +
      "Changes are visible now but may be lost on refresh."
    );
  }
}

// Reads the saved theme preference from Local Storage; returns "light" if none is stored
function loadTheme() {
  const stored = localStorage.getItem(LS_THEME);
  return (stored === "light" || stored === "dark") ? stored : "light";
}

// Writes the current theme preference to Local Storage (silent failure — non-critical)
function saveTheme(theme) {
  try {
    localStorage.setItem(LS_THEME, theme);
  } catch (e) {
    console.warn("[ebv] Could not save theme preference:", e);
  }
}

// Reveals the storage-failure warning banner with the given message text
function showStorageWarning(message) {
  const banner = document.getElementById("storage-warning");
  const msgEl  = document.getElementById("storage-warning-msg");
  msgEl.textContent = message;
  banner.hidden = false;
}

// Hides the storage-failure warning banner
function hideStorageWarning() {
  document.getElementById("storage-warning").hidden = true;
}


// ============================================================
// 4. VALIDATOR
// Validates form field values before a transaction is created.
// Returns an error map; populates or clears inline error spans.
// ============================================================

// Reads the three form fields and returns an object of { field: "error message" } for any invalid inputs
function validateForm() {
  const name     = document.getElementById("item-name").value;
  const amountRaw = document.getElementById("amount").value;
  const category = document.getElementById("category").value;

  const errors = {};

  // Requirement 2.3 — name must not be empty or whitespace-only
  if (name.trim() === "") {
    errors.name = "Item name is required.";
  }

  // Requirement 2.4 — amount must be a finite positive number
  const amountParsed = parseFloat(amountRaw);
  if (amountRaw === "" || isNaN(amountParsed) || amountParsed <= 0 || !isFinite(amountParsed)) {
    errors.amount = "Please enter a positive number greater than zero.";
  }

  // Requirement 2.5 — a category must be chosen (not the placeholder)
  if (category === "") {
    errors.category = "Please select a category.";
  }

  return errors;
}

// Writes error messages into the matching inline error <span> elements below each field
function showErrors(errorMap) {
  const fieldToSpanId = {
    name:     "name-error",
    amount:   "amount-error",
    category: "category-error"
  };

  for (const [field, spanId] of Object.entries(fieldToSpanId)) {
    const span = document.getElementById(spanId);
    if (span) {
      span.textContent = errorMap[field] ?? "";
    }
  }
}

// Clears all inline error <span> elements so no stale messages are shown
function clearErrors() {
  ["name-error", "amount-error", "category-error"].forEach(id => {
    const span = document.getElementById(id);
    if (span) span.textContent = "";
  });
}


// ============================================================
// 5. KEY ALGORITHMS
// Pure functions that transform data for display or storage.
// None of these functions read from or write to the DOM or Local Storage.
// ============================================================

// Returns a formatted currency string (e.g. "Rp25,000.00") for the given numeric amount
function formatCurrency(amount) {
  return "Rp" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Returns a sorted copy of the transactions array for the given sortOrder; never mutates the original
function getSortedTransactions(transactions, sortOrder) {
  const copy = [...transactions]; // never mutate the original

  switch (sortOrder) {
    case "newest-first":
      return copy.reverse();
    case "amount-asc":
      return copy.sort((a, b) => a.amount - b.amount);
    case "amount-desc":
      return copy.sort((a, b) => b.amount - a.amount);
    case "category-az":
      return copy.sort((a, b) => a.category.localeCompare(b.category));
    default:
      return copy.reverse(); // fall back to newest-first
  }
}

// Aggregates per-category totals and returns the data structure expected by Chart.js
function getChartData(transactions) {
  const COLORS = {
    Food:      "#FF6384",
    Transport: "#36A2EB",
    Fun:       "#FFCE56"
  };

  const totals = { Food: 0, Transport: 0, Fun: 0 };
  for (const t of transactions) {
    totals[t.category] += t.amount;
  }

  const labels = Object.keys(totals).filter(k => totals[k] > 0);

  return {
    labels,
    datasets: [{
      data:            labels.map(k => totals[k]),
      backgroundColor: labels.map(k => COLORS[k])
    }]
  };
}

// Groups transactions by calendar month and returns an object of { "Month YYYY": total }
function groupByMonth(transactions) {
  // Result: { "October 2026": 75000, "November 2026": 30000 }
  const map = {};

  for (const t of transactions) {
    const date  = new Date(t.createdAt);     // parse UTC ISO string
    const label = date.toLocaleDateString("en-US", {
      month: "long", year: "numeric", timeZone: "UTC"
    });  // e.g. "October 2026"

    map[label] = (map[label] || 0) + t.amount;
  }

  return map;
}


// ============================================================
// 6. RENDERER
// All DOM-writing functions.
// The Renderer always reads from `state` — never from Local Storage.
// ============================================================

// Holds the active Chart.js instance so it can be destroyed before recreation
let chartInstance = null;

// Master render function — calls the correct sub-renderers based on the active view
function render() {
  const sorted = getSortedTransactions(state.transactions, state.sortOrder);

  if (state.activeView === "list") {
    // List view: show transaction list, balance, and chart; hide monthly summary
    document.getElementById("transaction-list-view").hidden = false;
    document.getElementById("monthly-summary-view").hidden = true;
    renderTransactionList(sorted);
    renderBalance(state.transactions);
    renderChart(state.transactions);
  } else {
    // Monthly view: show monthly summary; hide transaction list, balance, and chart
    document.getElementById("transaction-list-view").hidden = true;
    document.getElementById("monthly-summary-view").hidden = false;
    renderMonthlySummary(state.transactions);
  }
}

// Builds and injects the transaction <li> elements (or an empty placeholder) into #transaction-list
function renderTransactionList(sortedTransactions) {
  const ul = document.getElementById("transaction-list");

  // Requirement 3.3 — show placeholder when the list is empty
  if (sortedTransactions.length === 0) {
    ul.innerHTML = '<li class="empty-placeholder">No transactions recorded yet.</li>';
    return;
  }

  // Requirements 3.1, 3.2, 3.4, 3.5 — one <li> per transaction with name, amount, category, and delete button
  ul.innerHTML = sortedTransactions.map(t => `
    <li class="transaction-item">
      <span class="transaction-name">${t.name}</span>
      <span class="transaction-amount">${formatCurrency(t.amount)}</span>
      <span class="transaction-category">${t.category}</span>
      <button class="delete-btn" data-id="${t.id}">Delete</button>
    </li>
  `).join("");
}

// Computes the running total and writes the formatted balance to #total-balance
function renderBalance(transactions) {
  const sum = transactions.reduce((total, t) => total + t.amount, 0);
  document.getElementById("total-balance").textContent = formatCurrency(sum);
}

// Creates or recreates the Chart.js pie chart inside #expense-chart; shows #no-chart-msg when empty
function renderChart(transactions) {
  const canvas    = document.getElementById("expense-chart");
  const noChartMsg = document.getElementById("no-chart-msg");

  if (transactions.length === 0) {
    // Requirements 5.4, 5.5 — destroy stale chart, show empty-state message, hide canvas
    if (chartInstance) {
      chartInstance.destroy();
      chartInstance = null;
    }
    noChartMsg.hidden = false;
    canvas.hidden     = true;
  } else {
    // Requirements 5.1, 5.2, 5.3 — hide message, show canvas, (re)create chart

    // CDN guard: if Chart.js failed to load, keep canvas hidden and show a neutral message
    if (typeof Chart === "undefined") {
      noChartMsg.textContent = "Chart unavailable (could not load charting library).";
      noChartMsg.hidden = false;
      canvas.hidden     = true;
      return;
    }

    noChartMsg.hidden = true;
    canvas.hidden     = false;

    if (chartInstance) {
      chartInstance.destroy();
    }

    const data = getChartData(transactions);
    chartInstance = new Chart(canvas, {
      type: "pie",
      data,
      options: { responsive: true }
    });
  }
}

// Builds and injects the per-month summary rows into #monthly-list; shows #no-monthly-msg when empty
function renderMonthlySummary(transactions) {
  const map = groupByMonth(transactions);
  const noMsg = document.getElementById("no-monthly-msg");
  const list = document.getElementById("monthly-list");

  const entries = Object.entries(map);

  if (entries.length === 0) {
    noMsg.hidden = false;
    list.innerHTML = "";
  } else {
    noMsg.hidden = true;
    list.innerHTML = entries
      .map(([label, total]) => `<li>${label}: ${formatCurrency(total)}</li>`)
      .join("");
  }
}


// ============================================================
// 7. EVENT HANDLERS
// Functions wired to user interactions (form submit, delete,
// sort change, view toggle, theme toggle).
// Each handler follows: Mutate → Persist → Render.
// ============================================================

// Handles the Add Expense form submission: validates, creates a Transaction, persists, and re-renders
function handleFormSubmit(event) {
  event.preventDefault();

  // Requirement 2.2 — validate all fields before accepting the transaction
  const errors = validateForm();
  if (Object.keys(errors).length > 0) {
    showErrors(errors);
    return;
  }

  // Requirement 2.8 — clear any previously displayed error messages on success
  clearErrors();

  // Requirement 2.6 — build the new Transaction object
  const transaction = {
    id:        crypto.randomUUID(),
    name:      document.getElementById("item-name").value.trim(),
    amount:    parseFloat(document.getElementById("amount").value),
    category:  document.getElementById("category").value,
    createdAt: new Date().toISOString()
  };

  // Mutate → Persist → Render
  state.transactions.push(transaction);
  saveTransactions(state.transactions);

  // Requirement 2.7 — reset the form to its default empty state
  document.getElementById("input-form").reset();

  render();
}

// Removes the transaction with the given id from state, persists the change, and re-renders
function handleDeleteTransaction(id) {
  // Requirement 3.6 — filter out the matching transaction (immutable removal)
  state.transactions = state.transactions.filter(t => t.id !== id);

  // Requirement 6.2 — persist the updated list immediately after deletion
  saveTransactions(state.transactions);

  // Requirements 4.3, 5.3 — re-render so balance and chart update in the same cycle
  render();
}

// Updates the active sort order in state and re-renders the transaction list
function handleSortChange(event) {
  state.sortOrder = event.target.value;
  render();
}

// Switches the active view (list or monthly) in state and re-renders
function handleViewToggle(view) {
  state.activeView = view;

  // Update active class on view-toggle buttons so the selected view is clearly indicated
  document.querySelectorAll(".view-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === view);
  });

  render();
}

// Flips the current theme between light and dark, updates the DOM, and persists the preference
function handleThemeToggle() {
  // 1. Mutate
  state.theme = state.theme === "light" ? "dark" : "light";

  // 2. Apply to DOM immediately
  document.body.classList.toggle("dark", state.theme === "dark");
  document.getElementById("theme-toggle-btn").textContent =
    state.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

  // 3. Persist
  saveTheme(state.theme);
}


// ============================================================
// 8. INIT
// Entry point called on DOMContentLoaded.
// Loads persisted state, wires all event listeners, and draws
// the initial UI.
// ============================================================

// Bootstraps the app: loads theme + transactions from storage, attaches listeners, calls render()
function init() {
  // Step 1 — Load and apply saved theme before first render (prevents flash of wrong theme)
  state.theme = loadTheme();
  document.body.classList.toggle("dark", state.theme === "dark");
  document.getElementById("theme-toggle-btn").textContent =
    state.theme === "dark" ? "☀️ Light Mode" : "🌙 Dark Mode";

  // Step 2 — Load persisted transactions into state
  state.transactions = loadTransactions();

  // Step 3 — Wire all event listeners

  // Form submission → validate and add transaction
  document.getElementById("input-form")
    .addEventListener("submit", handleFormSubmit);

  // Sort control → re-render list in chosen order
  document.getElementById("sort-control")
    .addEventListener("change", handleSortChange);

  // View toggle buttons → switch between list and monthly views
  document.querySelectorAll("[data-view]").forEach(btn => {
    btn.addEventListener("click", () => handleViewToggle(btn.dataset.view));
  });

  // Theme toggle button → flip light/dark
  document.getElementById("theme-toggle-btn")
    .addEventListener("click", handleThemeToggle);

  // Delegated click on #transaction-list → delete the matching transaction
  // Requirements 3.6 — uses event delegation so dynamically added items are covered
  document.getElementById("transaction-list")
    .addEventListener("click", event => {
      const btn = event.target.closest(".delete-btn");
      if (!btn) return; // click was not on a delete button
      handleDeleteTransaction(btn.dataset.id);
    });

  // Storage warning dismiss button → hide the banner
  const dismissBtn = document.getElementById("storage-warning-dismiss");
  if (dismissBtn) {
    dismissBtn.addEventListener("click", hideStorageWarning);
  }

  // Step 4 — Draw the initial UI
  render();
}

// Start the app once the HTML document is fully parsed
document.addEventListener("DOMContentLoaded", init);
