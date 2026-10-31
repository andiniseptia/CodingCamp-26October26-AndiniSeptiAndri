# Requirements Document

## Introduction

The Expense & Budget Visualizer is a fully client-side, single-page web application built with HTML, CSS, and Vanilla JavaScript. It allows users to track personal expenses by recording transactions with a name, amount, and category. The application displays a running total balance, visualizes spending by category using a pie chart, and persists all data in the browser's Local Storage so that no backend server is needed.

The application includes a dark/light mode toggle, the ability to sort the transaction list without altering stored data, and a monthly summary view that aggregates totals per month from transaction timestamps. The codebase is intentionally beginner-friendly: single files per layer (one HTML, one CSS, one JS), CDN-hosted Chart.js, and thorough inline comments on every major section.

---

## Glossary

- **App**: The Expense & Budget Visualizer single-page web application.
- **Transaction**: A single expense record consisting of an item name, a numeric amount, a category, and a creation timestamp.
- **Transaction_List**: The complete ordered collection of Transaction objects currently held in memory and persisted in Local Storage.
- **Input_Form**: The HTML form containing the Item Name field, Amount field, Category dropdown, and Submit button.
- **Category**: A fixed label attached to a Transaction. Valid values are `Food`, `Transport`, and `Fun`.
- **Total_Balance**: The sum of the Amount values of all Transactions currently in the Transaction_List.
- **Chart**: The pie chart rendered by Chart.js that shows spending distribution by Category.
- **Storage**: The browser's Local Storage API used to persist the Transaction_List and user preferences.
- **Theme**: The visual color scheme of the App — either `light` (default) or `dark`.
- **Sort_Control**: The UI element that lets the user choose a sort order for the displayed Transaction_List.
- **Sort_Order**: The current sort criterion applied to the displayed Transaction_List. Valid values are `newest-first` (default, most recently added transaction shown at the top), `amount-asc`, `amount-desc`, and `category-az`.
- **Transaction_List_View**: The primary view showing the Input_Form, Total_Balance, Transaction_List, and Chart.
- **Monthly_Summary_View**: The secondary view showing per-month expense totals derived from Transaction timestamps.
- **View_Toggle**: The UI control that switches the App between Transaction_List_View and Monthly_Summary_View.
- **Validator**: The client-side logic that checks Input_Form fields before a Transaction is accepted.
- **Renderer**: The client-side logic responsible for updating the DOM to reflect the current application state.
- **Storage_Manager**: The client-side logic responsible for reading from and writing to Local Storage.

---

## Requirements

### Requirement 1: Project Structure and Technical Constraints

**User Story:** As a developer, I want the project to follow a strict single-file-per-layer structure so that the codebase remains simple and beginner-friendly.

#### Acceptance Criteria

1. THE App SHALL be delivered as exactly one `index.html` file at the repository root, exactly one CSS file located at `css/style.css`, and exactly one JavaScript file located at `js/app.js`.
2. THE App SHALL use only HTML, CSS, and Vanilla JavaScript — no JavaScript frameworks, build tools, or preprocessors.
3. THE App SHALL load Chart.js exclusively from a CDN `<script>` tag in `index.html` and SHALL NOT bundle or vendor the library.
4. THE App SHALL require no backend server and SHALL function entirely within the user's browser.
5. THE App SHALL be designed and tested to work on the latest stable releases of Chrome, Firefox, Edge, and Safari, with all required features functioning correctly on those browsers.
6. THE `js/app.js` file SHALL contain inline comments above every major functional section explaining its purpose.
7. THE `css/style.css` file SHALL contain inline comments above every major rule block explaining its purpose.

---

### Requirement 2: Input Form

**User Story:** As a user, I want to fill in a form with an item name, amount, and category so that I can record a new expense transaction.

#### Acceptance Criteria

1. THE Input_Form SHALL contain a text field labeled "Item Name" with a maximum length of 100 characters, a number field labeled "Amount" accepting any positive number greater than zero, a dropdown labeled "Category" with a placeholder prompt and options `Food`, `Transport`, and `Fun`, and a submit button labeled "Add Expense".
2. WHEN the user submits the Input_Form, THE Validator SHALL check that the Item Name field is not empty, that the Amount field contains a positive number greater than zero, and that a Category option has been selected.
3. IF the Item Name field is empty on form submission, THEN THE Validator SHALL display an inline error message adjacent to the Item Name field and SHALL prevent the Transaction from being created.
4. IF the Amount field is empty, zero, or a non-positive number on form submission, THEN THE Validator SHALL display an inline error message adjacent to the Amount field stating that a positive number greater than zero is required, and SHALL prevent the Transaction from being created.
5. IF no Category is selected on form submission, THEN THE Validator SHALL display an inline error message adjacent to the Category dropdown and SHALL prevent the Transaction from being created.
6. WHEN the Input_Form passes all validation checks, THE App SHALL create a new Transaction containing the submitted item name, the amount as entered (a positive number greater than zero), the selected category, and the current timestamp in ISO 8601 UTC format, then add it to the Transaction_List.
7. WHEN a Transaction is successfully added, THE Input_Form SHALL reset all fields to their default empty state.
8. WHEN a Transaction is successfully added, THE Renderer SHALL clear all previously displayed inline validation error messages.

---

### Requirement 3: Transaction List

**User Story:** As a user, I want to see all my recorded transactions in a scrollable list so that I can review my spending history.

#### Acceptance Criteria

1. THE Renderer SHALL display the Transaction_List as a scrollable list within the Transaction_List_View.
2. WHILE the Transaction_List contains at least one Transaction, THE Renderer SHALL display each Transaction as a list item showing the item name, formatted amount (with currency symbol), and category label, displayed in the active Sort_Order, which defaults to newest-first (most recently added transaction at the top).
3. WHILE the Transaction_List is empty, THE Renderer SHALL display a placeholder message indicating no transactions have been recorded.
4. WHEN a Transaction is added to the Transaction_List, THE Renderer SHALL update the displayed list within the same page render cycle without requiring a page reload.
5. THE Renderer SHALL display a delete button for each Transaction in the list.
6. WHEN the user activates the delete button for a Transaction, THE App SHALL remove that Transaction from the Transaction_List and update the displayed list, Total_Balance, and Chart immediately.

---

### Requirement 4: Total Balance

**User Story:** As a user, I want to see my total spending displayed prominently at the top of the page so that I always know how much I have spent.

#### Acceptance Criteria

1. THE Renderer SHALL display the Total_Balance at the top of the Transaction_List_View, formatted as a currency value with two decimal places.
2. WHEN a Transaction is added to the Transaction_List, THE Renderer SHALL recalculate and update the displayed Total_Balance immediately.
3. WHEN a Transaction is deleted from the Transaction_List, THE Renderer SHALL recalculate and update the displayed Total_Balance immediately.
4. WHILE the Transaction_List is empty, THE Renderer SHALL display a Total_Balance of zero formatted as a currency value.

---

### Requirement 5: Visual Chart

**User Story:** As a user, I want to see a pie chart of my spending broken down by category so that I can understand where my money goes.

#### Acceptance Criteria

1. THE Renderer SHALL render a pie chart using Chart.js that shows each Category's share of the Total_Balance.
2. WHEN a Transaction is added, THE Renderer SHALL update the Chart to reflect the new category totals without requiring a page reload.
3. WHEN a Transaction is deleted, THE Renderer SHALL update the Chart to reflect the updated category totals without requiring a page reload.
4. WHILE the Transaction_List is empty, THE Renderer SHALL display the Chart canvas in an empty state with a visible message such as "No data to display" in place of the chart segments.
5. THE Chart SHALL assign a distinct, consistent color to each Category so that `Food`, `Transport`, and `Fun` are always visually distinguishable.

---

### Requirement 6: Data Persistence

**User Story:** As a user, I want my transactions to be saved automatically so that my data is still available when I reopen the app.

#### Acceptance Criteria

1. WHEN a Transaction is successfully added, THE Storage_Manager SHALL serialize the updated Transaction_List to JSON and write it to a dedicated Local Storage key.
2. WHEN a Transaction is deleted, THE Storage_Manager SHALL serialize the updated Transaction_List to JSON and write it to the same dedicated Local Storage key.
3. WHEN the App initializes on page load, THE Storage_Manager SHALL read the Transaction_List from Local Storage, deserialize it, and load it into memory before the Renderer first draws the UI.
4. IF no Transaction_List entry exists in Local Storage on page load, THEN THE Storage_Manager SHALL initialize the in-memory Transaction_List as an empty array.
5. IF the Local Storage entry for the Transaction_List is malformed or cannot be deserialized, THEN THE Storage_Manager SHALL initialize the in-memory Transaction_List as an empty array and SHALL log a warning to the browser console.

---

### Requirement 7: Responsive and Mobile-Friendly Layout

**User Story:** As a user, I want the app to work well on my phone as well as on my desktop so that I can log expenses anywhere.

#### Acceptance Criteria

1. THE App SHALL render a usable, non-overlapping layout on viewport widths from 320px to 2560px.
2. WHEN the viewport width is below 768px, THE App SHALL stack the Input_Form, Total_Balance, Transaction_List, and Chart vertically in a single column.
3. WHEN the viewport width is 768px or above, THE App SHALL arrange the Input_Form alongside the Transaction_List and Chart in a multi-column layout.
4. THE App SHALL use relative units (%, rem, or viewport units) rather than fixed pixel widths for all major layout containers so that text and controls scale with the user's browser font size settings.
5. THE App SHALL ensure all interactive controls (buttons, inputs, dropdowns) have a minimum touch target size of 44×44 CSS pixels on mobile viewports.

---

### Requirement 8: Dark/Light Mode Toggle

**User Story:** As a user, I want to switch between a light and dark visual theme so that I can use the app comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE App SHALL display a visible toggle button that switches the Theme between `light` and `dark`.
2. WHEN the user activates the Theme toggle, THE App SHALL apply the selected Theme to the entire page instantly without a page reload.
3. WHEN the user activates the Theme toggle, THE Storage_Manager SHALL persist the selected Theme value to Local Storage.
4. WHEN the App initializes, THE Storage_Manager SHALL read the persisted Theme from Local Storage and apply it before the first render.
5. IF no Theme preference is found in Local Storage on initialization, THEN THE App SHALL default to the `light` Theme.
6. WHILE the `dark` Theme is active, THE App SHALL apply a dark background color and light foreground text color to all visible sections.
7. WHILE the `light` Theme is active, THE App SHALL apply a light background color and dark foreground text color to all visible sections.

---

### Requirement 9: Sort Transactions

**User Story:** As a user, I want to sort my transaction list by amount or category so that I can find and compare entries more easily.

#### Acceptance Criteria

1. THE App SHALL display a Sort_Control dropdown within the Transaction_List_View that offers the following Sort_Order options: `Newest First` (default), `Amount: Low to High`, `Amount: High to Low`, and `Category: A–Z`.
2. WHEN the user changes the Sort_Control selection, THE Renderer SHALL re-render the Transaction_List in the chosen Sort_Order within 300 milliseconds.
3. WHILE any Sort_Order is active, THE App SHALL sort a copy of the Transaction_List for display purposes only and SHALL NOT alter the order of items stored in Local Storage.
4. WHEN a new Transaction is added, THE Renderer SHALL display the updated list sorted according to the active Sort_Order.
5. WHEN a Transaction is deleted, THE Renderer SHALL re-render the remaining Transactions in the active Sort_Order.
6. WHEN the App initializes, THE Sort_Control SHALL default to `Newest First`.

---

### Requirement 10: Monthly Summary View

**User Story:** As a user, I want to view a summary of my expenses grouped by month so that I can track my spending trends over time.

#### Acceptance Criteria

1. THE App SHALL display a View_Toggle control that switches the visible content between Transaction_List_View and Monthly_Summary_View.
2. WHEN the user activates the View_Toggle to show Monthly_Summary_View, THE Renderer SHALL display a list of calendar months for which at least one Transaction exists, each showing the month label (e.g., "October 2026") and the total amount spent in that month.
3. WHEN a Transaction is added while Monthly_Summary_View is active, THE Renderer SHALL update the Monthly_Summary_View to reflect the new monthly total immediately.
4. WHEN a Transaction is deleted while Monthly_Summary_View is active, THE Renderer SHALL update the Monthly_Summary_View to reflect the updated monthly total immediately.
5. WHILE the Transaction_List is empty, THE Renderer SHALL display a placeholder message in Monthly_Summary_View indicating no monthly data is available.
6. THE App SHALL derive each Transaction's month from the UTC timestamp stored on the Transaction at creation time and SHALL NOT re-read Local Storage to compute monthly totals.
7. WHEN the user activates the View_Toggle to return to Transaction_List_View, THE Renderer SHALL restore the Transaction_List_View with the Input_Form, Total_Balance, Transaction_List in the active Sort_Order, and Chart visible.
