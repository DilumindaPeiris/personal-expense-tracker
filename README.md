# Pocket · Personal Expense Tracker

[![CI](https://github.com/DilumindaPeiris/personal-expense-tracker/actions/workflows/ci.yml/badge.svg)](https://github.com/DilumindaPeiris/personal-expense-tracker/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A responsive expense tracker for everyday spending in **Sri Lankan Rupees (LKR)**. Built with HTML, CSS and vanilla JavaScript, with zero external runtime dependencies and no build step.

## Features

- **Expense Tracking**: Add, edit and delete expenses with a description, category, amount (LKR) and date.
- **Monthly Targets**: Set an independent budget for each month, view remaining balances and receive timely over-budget warnings.
- **Month-over-Month Analytics**: Track spending trends compared to the previous month (percentage change) and see daily average expenditures.
- **Flexible Filtering & Sorting**: Filter by month and category, search descriptions, and sort by date (newest/oldest) or amount (highest/lowest).
- **Quick Month Navigation**: Effortlessly step forward and backward between months with one-click navigation arrows.
- **Native Visualizations**: Dynamic daily spending rhythm bar chart and category donut breakdown built entirely with SVG and CSS.
- **Full Data Backup & Restore**: Export complete JSON snapshots of all expenses and budgets, and restore them anytime with automatic schema validation.
- **CSV Export**: Download filtered expenses to CSV with formula prefix sanitization for spreadsheet compatibility.
- **Local Persistence**: Save records and budgets automatically in browser `localStorage`.
- **Interactive Demo Mode**: Explore sample expenses safely without overriding personal records.
- **Accessibility & Polish**: Semantic HTML, labelled forms, keyboard-navigable dialogs, responsive layout, and reduced-motion support.

## Run locally

1. Download or clone this repository:
   ```bash
   git clone https://github.com/DilumindaPeiris/personal-expense-tracker.git
   cd personal-expense-tracker
   ```
2. Open **dist/index.html** directly in any modern browser. No installation or build step is required.

For local server serving:

```bash
python -m http.server 8080 --directory dist
```

Then visit `http://localhost:8080`.

## How to use

1. **Set Monthly Target**: Choose a month and click the pencil icon next to **Monthly budget**. Enter your target in LKR (entering 0 removes target).
2. **Add Expenses**: Click **Add expense**, fill in description, amount, date and category, then save.
3. **Navigate & Filter**:
   - Use the **‹** and **›** buttons or the month picker to jump between months.
   - Filter by category or enter search terms to locate specific entries.
   - Use the sort selector to order expenses by date or amount.
4. **Inspect Insights**: Review the daily spending rhythm bar chart and category breakdown donut. Check month-over-month trend percentages and daily averages.
5. **Backup & Restore**:
   - Click **Backup & restore** in the sidebar.
   - Choose **Export JSON** to save a full backup copy of all expenses and budgets.
   - Choose **Select file…** to restore from a previously exported backup JSON file.
6. **Export CSV**: Click **Export CSV** to download currently filtered expenses for external analysis in Excel or Google Sheets.
7. **Demo Exploration**: Click **Explore with demo data** to try out features with preloaded sample data without touching your saved records.

## Data and privacy

Records are stored locally in your browser under the `pocket-expenses-v1` key. There is no backend, account registration, tracking, or cross-device cloud sync.

- **Full Backups**: Use the **Backup & restore** feature to export a complete JSON snapshot containing all your expenses across all months and your monthly targets.
- **Offline Capable**: Pocket works fully offline. Google Fonts is an optional styling asset; system fonts will gracefully take over if network access is absent.
- **Data Safety**: If saving fails, Pocket retains previous states in memory without corrupting storage.

## Project structure

```text
.github/
  workflows/
    ci.yml           Automated testing on Node 18, 20, 22
dist/
  index.html         Accessible app markup and dialogs
  style.css          Responsive design system and animations
  domain.js          Validation, money math, analytics, backup and CSV export
  script.js          UI interaction controller and local storage management
  icon.svg           Pocket app icon
tests/
  domain.test.js     Automated test suite using Node's native test runner
package.json         Project scripts and development metadata
README.md            Project documentation and guide
LICENSE              MIT license
```

## Automated Verification

Pocket uses Node.js's built-in native test runner with zero npm dependencies:

```bash
npm test
npm run check
```

Automated tests cover:
- Currency precision and integer cents conversion
- Strict date validation and leap year handling
- Corrupt data rejection and duplicate ID detection
- Monthly total exclusions and category breakdowns
- Combined category, text search, and multi-criteria sorting
- Safe CSV formula injection neutralization
- JSON backup export serialization and validated restore deserialization
- Month-over-month trend comparison and daily average calculation

## License

MIT. See [LICENSE](LICENSE).
