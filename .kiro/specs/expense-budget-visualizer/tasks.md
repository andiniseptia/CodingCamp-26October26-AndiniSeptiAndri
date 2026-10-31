# Implementation Plan: Expense & Budget Visualizer

## Overview

Build a fully client-side, single-page web application using plain HTML, CSS, and Vanilla JavaScript. The app lets users record expense transactions, view a running balance, explore spending by category via a Chart.js pie chart, sort and filter the list, and switch between light and dark themes — all persisted in Local Storage with no backend required.

Implementation follows the **Mutate → Persist → Render** pattern defined in the design. Tasks are ordered so each step builds directly on the last, with no orphaned code.

---

## Tasks

- [x] 1. Phase 1 — Project Scaffold

  - [x] 1.1 Create `index.html` with full semantic HTML structure
    - Add `<!DOCTYPE html>`, `<html lang="en">`, `<head>` (charset, viewport, title, CSS link, Chart.js CDN `<script>`)
    - Add `<body>` with: `#app-header` (h1 title + `#theme-toggle-btn` button), `#storage-warning` banner (hidden by default with a dismiss button), `#view-toggle` (two buttons: "Transaction List" and "Monthly Summary"), `#transaction-list-view` section (contains `#input-form`, `#total-balance`, `#sort-control` dropdown, `#transaction-list` `<ul>`, `#chart-container` with `<canvas id="expense-chart">` and a `#no-chart-msg` paragraph), `#monthly-summary-view` section (hidden by default, contains `#monthly-list` and a `#no-monthly-msg` placeholder)
    - Add `<script src="js/app.js">` at the bottom of `<body>`
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 1.2 Create `css/style.css` with CSS custom properties skeleton
    - Define `:root` with all light-theme variables: `--bg-color`, `--text-color`, `--card-bg`, `--border-color`, `--accent-color`, `--error-color`, `--warning-bg`, `--warning-text`
    - Define `body.dark` selector that overrides every custom property with dark-theme values (from design)
    - Apply `background-color: var(--bg-color)` and `color: var(--text-color)` to `body`
    - Add a comment block above each group of rules explaining its purpose
    - _Requirements: 1.2, 1.7, 8.6, 8.7_

  - [x] 1.3 Create `js/app.js` with 8-section skeleton
    - Add eight clearly labeled comment banners: `1. CONSTANTS`, `2. STATE`, `3. STORAGE MANAGER`, `4. VALIDATOR`, `5. KEY ALGORITHMS`, `6. RENDERER`, `7. EVENT HANDLERS`, `8. INIT`
    - Stub out every named function as an empty function (or returning a sensible default): `loadTransactions`, `saveTransactions`, `loadTheme`, `saveTheme`, `validateForm`, `showErrors`, `clearErrors`, `formatCurrency`, `getSortedTransactions`, `getChartData`, `groupByMonth`, `render`, `renderTransactionList`, `renderBalance`, `renderChart`, `renderMonthlySummary`, `handleFormSubmit`, `handleDeleteTransaction`, `handleSortChange`, `handleViewToggle`, `handleThemeToggle`, `init`
    - Define the `state` object: `{ transactions: [], theme: "light", sortOrder: "newest-first", activeView: "list" }`
    - Define constants: `LS_TRANSACTIONS = "ebv_transactions"`, `LS_THEME = "ebv_theme"`, `CATEGORIES`, `CATEGORY_COLORS`, `SORT_OPTIONS`
    - Add `document.addEventListener("DOMContentLoaded", init)` at the end
    - _Requirements: 1.1, 1.2, 1.6_

- [x] 2. Phase 2 — Storage Manager

  - [x] 2.1 Implement `loadTransactions()`
    - Read `localStorage.getItem(LS_TRANSACTIONS)`; if null return `[]`
    - Wrap `JSON.parse()` in a try/catch; on any error log a `console.warn` and return `[]`
    - _Requirements: 6.3, 6.4, 6.5_

  - [x] 2.2 Implement `saveTransactions(transactions)`
    - Wrap `localStorage.setItem(LS_TRANSACTIONS, JSON.stringify(transactions))` in try/catch
    - On success call `hideStorageWarning()` to dismiss any prior warning
    - On error call `console.error(...)` and `showStorageWarning(message)` — show the `#storage-warning` banner (do NOT use `alert()`)
    - Implement `showStorageWarning(message)` and `hideStorageWarning()` helpers that set `banner.textContent` and toggle `banner.hidden`
    - _Requirements: 6.1, 6.2_

  - [x] 2.3 Implement `loadTheme()` and `saveTheme(theme)`
    - `loadTheme()`: read `localStorage.getItem(LS_THEME)`; return `"light"` if null or unexpected value
    - `saveTheme(theme)`: write `localStorage.setItem(LS_THEME, theme)` inside a try/catch (silent failure — theme is non-critical)
    - _Requirements: 8.3, 8.4, 8.5_

  - [ ]* 2.4 Write unit tests for Storage Manager
    - Test `loadTransactions()` returns `[]` on null, on malformed JSON, and on valid JSON
    - Test `saveTransactions()` catches errors and shows the warning banner; hides banner on success
    - Test `loadTheme()` returns `"light"` as default
    - _Requirements: 6.3, 6.4, 6.5_

- [x] 3. Phase 3 — Validator

  - [x] 3.1 Implement `validateForm()`
    - Read values from `#item-name`, `#amount`, `#category` DOM elements
    - Return a plain object: `{ name?: "error msg", amount?: "error msg", category?: "error msg" }`
    - Name invalid if empty string or whitespace-only after `.trim()`
    - Amount invalid if empty, `parseFloat` produces `NaN`, result is `<= 0`, or is not finite
    - Category invalid if value is `""` (placeholder option selected)
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 3.2 Implement `showErrors(errorMap)` and `clearErrors()`
    - `showErrors`: for each key in errorMap, set `textContent` of the matching `<span class="error-msg">` (`#name-error`, `#amount-error`, `#category-error`)
    - `clearErrors`: set all three error spans' `textContent` to `""` so no stale messages remain
    - _Requirements: 2.3, 2.4, 2.5, 2.8_

  - [ ]* 3.3 Write property test for Validator — Property 2
    - **Property 2: Invalid form inputs are always rejected**
    - For any combination where at least one field is invalid, `validateForm()` must return a non-empty error object and no Transaction must be created
    - **Validates: Requirements 2.2, 2.3, 2.4, 2.5**

- [x] 4. Phase 4 — Core Algorithms

  - [x] 4.1 Implement `formatCurrency(amount)`
    - Return `"Rp" + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")`
    - Must produce `"Rp25,000.00"` for `25000` and `"Rp12.50"` for `12.5`
    - _Requirements: 3.2, 4.1, 4.4_

  - [x] 4.2 Implement `getSortedTransactions(transactions, sortOrder)`
    - Always work on `[...transactions]` (spread copy) — never mutate the original array
    - `"newest-first"`: reverse the copy (insertion order newest at end → display newest at top)
    - `"amount-asc"`: sort by `a.amount - b.amount`
    - `"amount-desc"`: sort by `b.amount - a.amount`
    - `"category-az"`: sort by `a.category.localeCompare(b.category)`
    - Default case: return reversed copy (same as newest-first)
    - _Requirements: 9.1, 9.2, 9.3, 9.6_

  - [ ]* 4.3 Write property test for `getSortedTransactions` — Property 10 & 11
    - **Property 10: Sorting operates on a copy; stored insertion order is preserved**
    - **Property 11: Displayed sort order always matches the active sort selection**
    - For any array and any sort order, original array must be unchanged; output must match expected order for all four sort values
    - **Validates: Requirements 9.1, 9.2, 9.3, 9.6**

  - [x] 4.4 Implement `getChartData(transactions)`
    - Accumulate totals per category: `{ Food: 0, Transport: 0, Fun: 0 }`
    - Filter to only categories with totals `> 0`
    - Return `{ labels, datasets: [{ data, backgroundColor }] }` using fixed colors: Food `#FF6384`, Transport `#36A2EB`, Fun `#FFCE56`
    - _Requirements: 5.1, 5.5_

  - [ ]* 4.5 Write property test for `getChartData` — Property 7
    - **Property 7: Chart colors are distinct and consistent per category**
    - For any non-empty transaction array, Food always maps to `#FF6384`, Transport to `#36A2EB`, Fun to `#FFCE56`; no two categories share the same color
    - **Validates: Requirements 5.5**

  - [x] 4.6 Implement `groupByMonth(transactions)`
    - For each transaction parse `createdAt` with `new Date(t.createdAt)`
    - Format month label using `date.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })`
    - Accumulate totals into a plain object `{ "October 2026": total, ... }`
    - Return the object (caller iterates it for display)
    - _Requirements: 10.2, 10.6_

  - [ ]* 4.7 Write property test for `groupByMonth` — Property 12
    - **Property 12: Monthly summary totals derive from in-memory timestamps only**
    - For any transaction array, `groupByMonth` output must equal manually computed per-month sums; must not read localStorage
    - **Validates: Requirements 10.2, 10.3, 10.4, 10.6**

- [ ] 5. Checkpoint — Algorithms verified
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Phase 5 — Renderer

  - [x] 6.1 Implement `renderBalance(transactions)`
    - Sum all `t.amount` values with `.reduce()`
    - Call `formatCurrency(sum)` and write result to `document.getElementById("total-balance").textContent`
    - When the array is empty the sum is `0` → displays `"Rp0.00"`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ]* 6.2 Write property test for `renderBalance` — Property 6
    - **Property 6: Total balance always equals the sum of all transaction amounts**
    - For any set of transactions, displayed balance must equal `formatCurrency(transactions.reduce((s,t) => s + t.amount, 0))`
    - **Validates: Requirements 4.1, 4.2, 4.3**

  - [x] 6.3 Implement `renderTransactionList(sortedTransactions)`
    - Get reference to `#transaction-list` (`<ul>`)
    - If array is empty: set innerHTML to a single `<li class="empty-placeholder">No transactions recorded yet.</li>`
    - Otherwise: build one `<li>` per transaction containing: name `<span>`, formatted amount `<span>`, category `<span>`, and a `<button class="delete-btn" data-id="${t.id}">Delete</button>`
    - Set `ul.innerHTML` to the built HTML string
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 6.4 Write property test for `renderTransactionList` — Property 3 & 4
    - **Property 3: Every rendered transaction item shows correct data**
    - **Property 4: Every rendered transaction item has a delete button**
    - For any non-empty list, number of `<li>` elements equals transaction count; each has correct name/amount/category; every `<li>` has a `[data-id]` delete button
    - **Validates: Requirements 3.2, 3.5**

  - [x] 6.5 Implement `renderChart(transactions)`
    - Keep a module-level `let chartInstance = null`
    - Call `getChartData(transactions)` to get labels and dataset
    - If `transactions.length === 0`: destroy `chartInstance` if it exists, set it to `null`, show `#no-chart-msg`, hide `<canvas>`
    - Otherwise: hide `#no-chart-msg`, show `<canvas>`, destroy previous `chartInstance` if it exists, create a new `Chart(canvas, { type: "pie", data, options: { responsive: true } })` and store in `chartInstance`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [x] 6.6 Implement `renderMonthlySummary(transactions)`
    - Call `groupByMonth(transactions)` to get the map
    - If map has no entries: show `#no-monthly-msg`, clear `#monthly-list`
    - Otherwise: hide `#no-monthly-msg`; build one `<li>` per month entry showing `"Month Label: Rp<total>"` (use `formatCurrency`); set `#monthly-list.innerHTML`
    - _Requirements: 10.2, 10.5_

  - [x] 6.7 Implement `render()` master function
    - Get sorted list: `const sorted = getSortedTransactions(state.transactions, state.sortOrder)`
    - If `state.activeView === "list"`: show `#transaction-list-view`, hide `#monthly-summary-view`, call `renderTransactionList(sorted)`, `renderBalance(state.transactions)`, `renderChart(state.transactions)`
    - If `state.activeView === "monthly"`: hide `#transaction-list-view`, show `#monthly-summary-view`, call `renderMonthlySummary(state.transactions)`
    - _Requirements: 3.1, 3.4, 4.2, 5.2, 10.1, 10.7_

- [x] 7. Phase 6 — Event Handlers & Init

  - [x] 7.1 Implement `handleFormSubmit(event)`
    - Call `event.preventDefault()`
    - Call `validateForm()`; if errors exist call `showErrors(errors)` and return
    - Call `clearErrors()`
    - Build Transaction object: `id` from `crypto.randomUUID()`, `name` from trimmed `#item-name` value, `amount` from `parseFloat(#amount.value)`, `category` from `#category.value`, `createdAt` from `new Date().toISOString()`
    - Push to `state.transactions`; call `saveTransactions(state.transactions)`; reset form with `document.getElementById("input-form").reset()`; call `render()`
    - _Requirements: 2.1, 2.6, 2.7, 2.8_

  - [ ]* 7.2 Write property test for `handleFormSubmit` — Property 1
    - **Property 1: Valid form inputs always produce a well-formed Transaction**
    - For any valid name/amount/category combination, the resulting Transaction must have: exact name, exact positive amount, selected category, valid ISO 8601 `createdAt`, and a UUID-format `id`
    - **Validates: Requirements 2.6**

  - [x] 7.3 Implement `handleDeleteTransaction(id)`
    - Filter: `state.transactions = state.transactions.filter(t => t.id !== id)`
    - Call `saveTransactions(state.transactions)` then `render()`
    - _Requirements: 3.6, 4.3, 5.3_

  - [ ]* 7.4 Write property test for `handleDeleteTransaction` — Property 5
    - **Property 5: Deleting a transaction removes it from the list, balance, and chart**
    - After delete, target transaction must not appear in rendered list; balance must equal sum of remaining; chart must reflect remaining category totals
    - **Validates: Requirements 3.6, 4.3, 5.3**

  - [x] 7.5 Implement `handleSortChange(event)` and `handleViewToggle(view)`
    - `handleSortChange`: set `state.sortOrder = event.target.value`; call `render()`
    - `handleViewToggle(view)`: set `state.activeView = view`; call `render()`
    - _Requirements: 9.2, 9.4, 9.5, 10.1, 10.7_

  - [x] 7.6 Implement `handleThemeToggle()`
    - Flip: `state.theme = state.theme === "light" ? "dark" : "light"`
    - Toggle `body.dark` class: `document.body.classList.toggle("dark", state.theme === "dark")`
    - Update button label: `"☀️ Light Mode"` when dark, `"🌙 Dark Mode"` when light
    - Call `saveTheme(state.theme)`
    - _Requirements: 8.1, 8.2, 8.3, 8.6, 8.7_

  - [x] 7.7 Implement `init()` and wire to `DOMContentLoaded`
    - Step 1 — Load and apply theme first (prevents flash of wrong theme): `state.theme = loadTheme()`, apply `body.dark` class if dark, set theme button label
    - Step 2 — Load transactions: `state.transactions = loadTransactions()`
    - Step 3 — Attach event listeners: form submit → `handleFormSubmit`, `#sort-control` change → `handleSortChange`, view-toggle buttons click → `handleViewToggle`, `#theme-toggle-btn` click → `handleThemeToggle`, `#transaction-list` delegated click → `handleDeleteTransaction` (read `data-id` from closest `.delete-btn`), storage warning dismiss button → `hideStorageWarning`
    - Step 4 — Call `render()`
    - _Requirements: 6.3, 8.4, 8.5, 9.6_

- [ ] 8. Checkpoint — Core logic complete
  - Ensure all tests pass, ask the user if questions arise.

- [x] 9. Phase 7 — CSS Styling

  - [x] 9.1 Style the header and global layout base
    - Style `#app-header`: flexbox row, space-between, padding, `background-color: var(--accent-color)`, `color: var(--text-color)` via CSS variables
    - Set `body` base: `font-family`, `margin: 0`, `background-color: var(--bg-color)`, `color: var(--text-color)`, `transition: background-color 0.2s, color 0.2s` for smooth theme switch
    - Style `#storage-warning` banner: `background-color: var(--warning-bg)`, `color: var(--warning-text)`, padding, full-width, with a dismiss `×` button aligned right; hidden by default via `[hidden]` attribute
    - Style `#view-toggle`: centered button group with clear active/inactive states using `var(--accent-color)`
    - _Requirements: 1.7, 8.1, 8.2, 8.6, 8.7_

  - [x] 9.2 Style the input form
    - Style `.form-group`: block layout, `margin-bottom: 1rem`, labels above inputs
    - Style `label`: `display: block`, `font-weight: bold`, `margin-bottom: 0.25rem`
    - Style `input[type="text"]`, `input[type="number"]`, `select`: `width: 100%`, `box-sizing: border-box`, `min-height: 44px`, `padding: 0.5rem`, `border: 1px solid var(--border-color)`, `background-color: var(--card-bg)`, `color: var(--text-color)`, `border-radius: 4px`
    - Style `.error-msg`: `color: var(--error-color)`, `font-size: 0.85rem`, `display: block`, `min-height: 1.2em` (reserve space to avoid layout shift)
    - Style the submit button: `background-color: var(--accent-color)`, `color: #fff`, `min-height: 44px`, `min-width: 44px`, `padding: 0.5rem 1rem`, full width, `border: none`, `border-radius: 4px`, `cursor: pointer`
    - _Requirements: 2.1, 7.5_

  - [x] 9.3 Style the transaction list and balance display
    - Style `#total-balance`: large font size (`1.5rem`+), bold, prominent placement, `background-color: var(--card-bg)`, padding, `border-radius: 4px`
    - Style `#sort-control` select: same input styles as form controls, `min-height: 44px`
    - Style `#transaction-list` (`<ul>`): `list-style: none`, `padding: 0`, `max-height: 400px`, `overflow-y: auto` (scrollable)
    - Style each transaction `<li>`: flexbox row, space-between, `padding: 0.75rem`, `border-bottom: 1px solid var(--border-color)`, `background-color: var(--card-bg)`, `border-radius: 4px`, `margin-bottom: 0.5rem`
    - Style `.empty-placeholder`: italic, centered, `color: var(--text-color)` with reduced opacity
    - Style `.delete-btn`: `min-height: 44px`, `min-width: 44px`, `background-color: var(--error-color)`, `color: #fff`, `border: none`, `border-radius: 4px`, `cursor: pointer`
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 4.1, 7.5_

  - [x] 9.4 Style the chart container and monthly summary view
    - Style `#chart-container`: `background-color: var(--card-bg)`, padding, `border-radius: 4px`, `position: relative`
    - Style `#no-chart-msg`: centered text, `color: var(--text-color)` with reduced opacity
    - Style `#monthly-summary-view`: `background-color: var(--card-bg)`, padding, `border-radius: 4px`
    - Style `#monthly-list` (`<ul>`): `list-style: none`, `padding: 0`; each `<li>`: flexbox row, space-between, `padding: 0.5rem 0`, `border-bottom: 1px solid var(--border-color)`
    - _Requirements: 5.4, 10.2, 10.5_

  - [x] 9.5 Implement responsive layout — mobile-first with 768px breakpoint
    - Base (mobile): `.main-layout` with `display: flex`, `flex-direction: column`, `gap: 1rem`, `padding: 1rem`
    - `@media (min-width: 768px)`: `.main-layout { flex-direction: row; align-items: flex-start; }`, `.left-panel { flex: 1; }`, `.right-panel { flex: 2; }`
    - All major container widths use `%`, `rem`, or `vw` — no fixed `px` widths
    - Ensure `#transaction-list-view` and `#monthly-summary-view` fill their container width with `width: 100%`
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 10. Phase 8 — Integration & Polish

  - [x] 10.1 Verify and finalize Chart.js integration
    - Confirm the module-level `chartInstance` pattern (destroy + recreate) works correctly on every `render()` call — no duplicate charts, no "Canvas is already in use" errors
    - Test adding a transaction, deleting all transactions (empty state shown), adding again (chart reappears)
    - If Chart.js CDN fails to load, confirm all other UI functions still work (chart area stays blank, no JS errors break the rest of the app)
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 10.2 Wire and test the storage warning banner dismiss
    - Clicking the dismiss button on `#storage-warning` calls `hideStorageWarning()` (sets `banner.hidden = true`)
    - A successful `saveTransactions` call also auto-hides the banner
    - Confirm the banner uses `var(--warning-bg)` / `var(--warning-text)` and renders correctly in both light and dark themes
    - _Requirements: 6.1, 6.2_

  - [ ]* 10.3 Write property test for Local Storage round-trip — Property 8
    - **Property 8: Transaction list round-trips through Local Storage**
    - For any array of Transactions, serialize with `JSON.stringify` → store → retrieve → `JSON.parse`; every field (`id`, `name`, `amount`, `category`, `createdAt`) must be identical to the original
    - **Validates: Requirements 6.1, 6.2, 6.3**

  - [ ]* 10.4 Write property test for theme persistence — Property 9
    - **Property 9: Theme preference persists across page reload**
    - For both `"light"` and `"dark"` theme values, after `saveTheme` + `loadTheme`: returned value matches; `body.dark` class present iff theme is `"dark"`
    - **Validates: Requirements 8.3, 8.4**

  - [x] 10.5 Add inline comments to `js/app.js`
    - Every named function must have a one-line comment above it describing what it does
    - Each of the 8 section banner comments must be present and descriptive
    - Major logic blocks within functions (validation loop, sort switch, render branch) must have an explanatory comment
    - _Requirements: 1.6_

  - [ ] 10.6 Add inline comments to `css/style.css`
    - Every major rule block (`:root` variables, `body.dark`, each component section, media query) must have a comment above it explaining its purpose
    - _Requirements: 1.7_

- [ ] 11. Final Checkpoint — Full integration verified
  - Open `index.html` directly via `file://` in Chrome, Firefox, Edge, and Safari
  - Add three transactions (Food, Transport, Fun); verify list, balance, chart, and monthly summary all update
  - Reload the page; verify all transactions persist
  - Delete a transaction; reload; verify it is still gone
  - Toggle dark mode; reload; verify theme persists
  - Change sort order; verify list reorders; check DevTools Local Storage to confirm stored order is insertion order
  - Switch to Monthly Summary view; add a transaction; verify summary updates immediately
  - Ensure all tests pass, ask the user if questions arise.

---

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP build — all core functionality works without them
- The design uses no build step: open `index.html` directly in a browser to run the app
- The `crypto.randomUUID()` API is supported in all target browsers (Chrome 92+, Firefox 95+, Edge 92+, Safari 15.4+) — no polyfill needed
- Chart.js is loaded from CDN; if it fails, the chart area is blank but all other features remain functional
- Every requirement's acceptance criteria is traceable to at least one task via the `_Requirements:` annotation
- Correctness properties from the design are each assigned to a dedicated property test sub-task

---

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2", "1.3"] },
    { "id": 1, "tasks": ["2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "3.1", "4.1"] },
    { "id": 3, "tasks": ["3.2", "4.2", "4.4", "4.6"] },
    { "id": 4, "tasks": ["3.3", "4.3", "4.5", "4.7"] },
    { "id": 5, "tasks": ["6.1", "6.3", "6.5", "6.6"] },
    { "id": 6, "tasks": ["6.2", "6.4", "6.7"] },
    { "id": 7, "tasks": ["7.1", "7.3", "7.5", "7.6"] },
    { "id": 8, "tasks": ["7.2", "7.4", "7.7"] },
    { "id": 9, "tasks": ["9.1", "9.2", "9.3", "9.4", "9.5"] },
    { "id": 10, "tasks": ["10.1", "10.2", "10.5", "10.6"] },
    { "id": 11, "tasks": ["10.3", "10.4"] }
  ]
}
```
