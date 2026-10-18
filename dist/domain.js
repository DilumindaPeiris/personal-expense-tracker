/* Shared, dependency-free data helpers. Amounts are integer cents. */
(function (root) {
  'use strict';
  const CATEGORIES = [
    { id: 'food', name: 'Food & drinks', icon: '◒', color: '#789363', bg: '#eff4e9' },
    { id: 'transport', name: 'Transport', icon: '↗', color: '#a492c4', bg: '#f2eef9' },
    { id: 'shopping', name: 'Shopping', icon: '▧', color: '#ce9b7b', bg: '#fbf0e8' },
    { id: 'education', name: 'Education', icon: '▤', color: '#789da9', bg: '#edf4f6' },
    { id: 'bills', name: 'Bills & utilities', icon: 'ϟ', color: '#b8a76f', bg: '#f8f5e9' },
    { id: 'health', name: 'Health', icon: '+', color: '#c18e9b', bg: '#f8eef1' },
    { id: 'leisure', name: 'Leisure', icon: '☆', color: '#7ba49b', bg: '#edf5f2' },
    { id: 'other', name: 'Other', icon: '···', color: '#929a88', bg: '#f1f3ed' }
  ];
  function parseMoney(value, allowZero = false) {
    const text = String(value).trim();
    if (!/^\d+(\.\d{1,2})?$/.test(text)) throw new Error('Enter an amount with up to two decimal places.');
    const cents = Math.round(Number(text) * 100);
    if (!Number.isSafeInteger(cents) || cents > 99999999999 || cents < (allowZero ? 0 : 1)) throw new Error('Enter a valid amount between ' + (allowZero ? '0' : '0.01') + ' and 999,999,999.99.');
    return cents;
  }
  function validDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const d = new Date(value + 'T12:00:00Z');
    return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value && Number(value.slice(0,4)) >= 1900 && Number(value.slice(0,4)) <= 9999;
  }
  function validateExpense(e) {
    if (!e || typeof e.id !== 'string' || !e.id || typeof e.description !== 'string' || !e.description.trim() || e.description.length > 100 || !Number.isSafeInteger(e.amount) || e.amount <= 0 || e.amount > 99999999999 || !validDate(e.date) || !CATEGORIES.some(c => c.id === e.category)) throw new Error('Expense data is invalid.');
    return { id: e.id, description: e.description.trim(), amount: e.amount, date: e.date, category: e.category };
  }
  function validateState(state) {
    if (!state || state.version !== 1 || !Array.isArray(state.expenses) || !state.budgets || Array.isArray(state.budgets) || typeof state.budgets !== 'object') throw new Error('Saved data could not be read.');
    const expenses = state.expenses.map(validateExpense);
    if (new Set(expenses.map(e => e.id)).size !== expenses.length) throw new Error('Saved data contains duplicate expense IDs.');
    const budgets = {};
    for (const [month, amount] of Object.entries(state.budgets)) {
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month) || !Number.isSafeInteger(amount) || amount < 0 || amount > 99999999999) throw new Error('Saved budget data is invalid.');
      budgets[month] = amount;
    }
    return { version: 1, expenses, budgets };
  }
  function monthlySummary(expenses, month, budget) {
    const rows = expenses.filter(e => e.date.slice(0, 7) === month);
    const total = rows.reduce((sum, e) => sum + e.amount, 0);
    return { rows, total, remaining: budget - total, count: rows.length, byCategory: CATEGORIES.map(c => ({ ...c, total: rows.filter(e => e.category === c.id).reduce((s, e) => s + e.amount, 0) })).filter(c => c.total > 0).sort((a, b) => b.total - a.total) };
  }
  function filteredExpenses(rows, category, query, sortBy = 'date-desc') {
    const term = query.trim().toLowerCase();
    const filtered = rows.filter(e => (category === 'all' || e.category === category) && e.description.toLowerCase().includes(term));
    return filtered.sort((a, b) => {
      if (sortBy === 'date-asc') return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
      if (sortBy === 'amount-desc') return b.amount - a.amount || b.date.localeCompare(a.date);
      if (sortBy === 'amount-asc') return a.amount - b.amount || b.date.localeCompare(a.date);
      return b.date.localeCompare(a.date) || b.id.localeCompare(a.id);
    });
  }
  function toCsv(rows) {
    function cell(value) { let s = String(value); if (/^[\s]*[=+\-@\t\r\n]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; }
    return '\uFEFF' + [['Date','Description','Category','Amount (LKR)'], ...rows.map(e => [e.date, e.description, CATEGORIES.find(c => c.id === e.category).name, (e.amount / 100).toFixed(2)])].map(row => row.map(cell).join(',')).join('\r\n');
  }
  function exportBackup(state) {
    const validated = validateState(state);
    return JSON.stringify({
      version: 1,
      exportedAt: new Date().toISOString(),
      budgets: validated.budgets,
      expenses: validated.expenses
    }, null, 2);
  }
  function importBackup(jsonString) {
    if (typeof jsonString !== 'string') throw new Error('Backup data must be a valid JSON string.');
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (_) {
      throw new Error('Invalid JSON file format.');
    }
    return validateState(parsed);
  }
  function getPreviousMonth(month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid month format.');
    const year = Number(month.slice(0, 4));
    const m = Number(month.slice(5, 7));
    if (m === 1) return (year - 1) + '-12';
    return year + '-' + String(m - 1).padStart(2, '0');
  }
  function getNextMonth(month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid month format.');
    const year = Number(month.slice(0, 4));
    const m = Number(month.slice(5, 7));
    if (m === 12) return (year + 1) + '-01';
    return year + '-' + String(m + 1).padStart(2, '0');
  }
  function monthComparison(expenses, currentMonth) {
    const prevMonth = getPreviousMonth(currentMonth);
    const currentTotal = expenses.filter(e => e.date.slice(0, 7) === currentMonth).reduce((s, e) => s + e.amount, 0);
    const prevTotal = expenses.filter(e => e.date.slice(0, 7) === prevMonth).reduce((s, e) => s + e.amount, 0);
    const diff = currentTotal - prevTotal;
    let percentChange = 0;
    if (prevTotal === 0) {
      percentChange = currentTotal > 0 ? 100 : 0;
    } else {
      percentChange = Math.round(((currentTotal - prevTotal) / prevTotal) * 1000) / 10;
    }
    return { currentMonth, prevMonth, currentTotal, prevTotal, diff, percentChange };
  }
  function dailyAverage(totalCents, month) {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Invalid month format.');
    const days = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
    return Math.round(totalCents / days);
  }
  const api = { CATEGORIES, parseMoney, validDate, validateExpense, validateState, monthlySummary, filteredExpenses, toCsv, exportBackup, importBackup, getPreviousMonth, getNextMonth, monthComparison, dailyAverage };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Pocket = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
