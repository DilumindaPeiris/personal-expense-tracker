# Pocket · Personal Expense Tracker

A responsive expense tracker for everyday spending in **Sri Lankan Rupees (LKR)**. Built with HTML, CSS and vanilla JavaScript, with no framework or build step.

## Features

- Add, edit and delete expenses with a description, category, amount and date.
- Set an independent budget for each month, see the remaining balance and get an over-budget warning.
- Filter by month and category, and search descriptions.
- See daily spending and a category breakdown without a charting library.
- Export the currently filtered expense list to CSV.
- Save expenses and budgets automatically in browser `localStorage`.
- Explore sample expenses in a separate, temporary demo mode.
- Responsive layout, labelled forms, keyboard-accessible dialogs and reduced-motion support.

## Run locally

1. Download or clone this repository.
2. Open **dist/index.html** in a modern browser. No installation is required.

For more consistent browser storage behavior, serve the project with the VS Code **Live Server** extension and open `dist/index.html`, or run:

```bash
python -m http.server 8080 --directory dist
```

Then visit `http://localhost:8080`.

## How to use

1. Choose a month and click the pencil on **Monthly budget**.
2. Enter your budget in LKR. Entering 0 removes that month's target.
3. Click **Add expense**, complete the form, and save.
4. Use the row actions to edit or delete an entry.
5. Search or choose a category to narrow the expense list. Summary cards and charts always show the entire selected month.
6. Click **Export CSV** to download the filtered results.
7. Try **Explore with demo data** to preview a populated dashboard. Demo changes are temporary and never replace your real expenses.

## Data and privacy

Records are stored only in the current browser profile, under `pocket-expenses-v1`. There is no backend, account system or cross-device sync. Clearing site data removes saved records. Export your expenses before clearing browser data; CSV export does not include budgets and is not a restorable backup. Keep using the same browser and origin to access your saved records.

Google Fonts is an optional styling request; system fonts are used when unavailable. No expense data is sent to Google or another server. The app itself works without a network connection after the files are downloaded.

If saving fails, the app reports the error without replacing the previous saved state. If existing storage cannot be read, it is left untouched and changes remain in memory for that visit.

## Project structure

```text
dist/
  index.html       Accessible app markup and dialogs
  style.css        Responsive layout and visual design
  domain.js        Validation, money calculations, filtering and CSV export
  script.js        UI interactions and browser storage
  icon.svg         App favicon
tests/
  domain.test.js   Unit tests using Node's built-in test runner
package.json
README.md
LICENSE
```

Amounts are stored as integer cents to avoid floating-point errors. User-entered descriptions are rendered as text. CSV fields are quoted and spreadsheet formula prefixes are neutralized.

## Checks

Node.js 18 or newer is needed only for development checks. No npm dependencies are required.

```bash
npm test
npm run check
```

Tests cover currency precision, invalid dates, saved-data validation, monthly totals, combined filters and safe CSV output.

## Upload to GitHub

1. Create a repository named **personal-expense-tracker** on GitHub.
2. Choose **uploading an existing file** and drag in the extracted project contents.
3. Commit the files with a clear message, such as `Build Pocket expense tracker`.

Or, from the extracted project folder:

```bash
git init
git add .
git commit -m "Build Pocket expense tracker"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/personal-expense-tracker.git
git push -u origin main
```

For GitHub Pages from a branch, place the files inside `dist/` at the repository root, then select that branch and `/ (root)` in Pages settings. The app uses relative asset paths and supports repository subpaths. If you move files out of `dist/`, also update the paths in `package.json` and the test import.

## License

MIT. See [LICENSE](LICENSE).
