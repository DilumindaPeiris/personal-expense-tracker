/* Pocket UI. No server, build step, or third-party JavaScript. */
'use strict';
const { CATEGORIES, parseMoney, validDate, validateExpense, validateState, monthlySummary, filteredExpenses, toCsv, exportBackup, importBackup } = Pocket;
const $ = id => document.getElementById(id);
const STORAGE_KEY = 'pocket-expenses-v1';
const emptyState = () => ({ version: 1, expenses: [], budgets: {} });
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Colombo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
let state = emptyState(), demo = null, editingId = null, deletingId = null, storageBlocked = false, toastTimer;
const money = cents => 'Rs. ' + (cents / 100).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const compactMoney = cents => 'Rs. ' + (cents / 100).toLocaleString('en-LK', { maximumFractionDigits: 0 });
const currentData = () => demo || state;
const icon = id => '<svg aria-hidden="true"><use href="#i-' + id + '"/></svg>';
function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').hidden = false; toastTimer = setTimeout(() => $('toast').hidden = true, 6500); }
try { const saved = localStorage.getItem(STORAGE_KEY); if (saved) state = validateState(JSON.parse(saved)); }
catch (error) { storageBlocked = true; setTimeout(() => toast('Saved data is unavailable. Changes will stay in memory for this visit; stored data will not be overwritten.'), 200); }
function commit(next) {
  if (demo) { demo = next; return; }
  if (!storageBlocked) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); }
    catch (_) { throw new Error('Could not save. Browser storage may be full or disabled. Your previous data is unchanged.'); }
  }
  state = next;
}
function saveMessage(text) { toast(text + (demo ? ' (demo only)' : storageBlocked ? ' — this visit only; storage is unavailable.' : '')); }
$('month-filter').value = today.slice(0, 7);
$('expense-date').min = '1900-01-01'; $('expense-date').max = '9999-12-31';
CATEGORIES.forEach(c => { $('category-filter').add(new Option(c.name, c.id)); $('expense-category').add(new Option(c.name, c.id)); });
function monthLabel(month) { return new Date(month + '-01T12:00:00').toLocaleDateString('en-GB', { month:'long', year:'numeric' }); }
function render() {
  const month = $('month-filter').value, data = currentData(), budget = data.budgets[month] || 0;
  const summary = monthlySummary(data.expenses, month, budget);
  const rows = filteredExpenses(summary.rows, $('category-filter').value, $('search').value);
  $('demo-banner').hidden = !demo;
  $('budget-value').textContent = money(budget);
  $('spent-value').textContent = money(summary.total);
  $('remaining-value').textContent = budget ? money(summary.remaining) : '—';
  $('remaining-value').classList.toggle('negative', budget > 0 && summary.remaining < 0);
  $('remaining-note').textContent = !budget ? 'Set a budget to see your balance.' : summary.remaining < 0 ? 'Time to give your budget a little attention.' : 'Available for the things that matter.';
  $('expense-count').textContent = summary.count + (summary.count === 1 ? ' expense' : ' expenses') + ' this month';
  const used = budget ? summary.total / budget * 100 : 0;
  $('budget-used').textContent = budget ? used.toFixed(1) + '% of your monthly budget used' : 'Set a budget to get started';
  $('budget-progress-fill').style.width = Math.min(used, 100) + '%';
  document.querySelector('.budget-progress').setAttribute('aria-valuenow', Math.min(100, Math.round(used)));
  $('budget-warning').hidden = !(budget && summary.remaining < 0);
  $('budget-warning').textContent = 'You’ve gone ' + money(-summary.remaining) + ' over your ' + monthLabel(month) + ' budget.';
  renderChart(summary, month); renderCategories(summary);
  $('table-count').textContent = summary.count;
  $('filter-caption').textContent = monthLabel(month);
  $('expense-rows').replaceChildren(...rows.map(expenseRow));
  $('empty-state').hidden = rows.length > 0;
  const isFiltered = summary.count > 0;
  $('empty-state').querySelector('h3').textContent = isFiltered ? 'No matching expenses' : 'A fresh start for your finances';
  $('empty-state').querySelector('p').textContent = isFiltered ? 'Try another category or search term.' : 'Add your first expense and get a clearer picture of your spending.';
  $('empty-add').hidden = isFiltered;
  $('results-caption').textContent = rows.length ? 'Showing ' + rows.length + ' of ' + summary.count + ' expenses · ' + money(rows.reduce((s,e) => s + e.amount,0)) : 'No expenses to show';
  $('export-csv').disabled = rows.length === 0;
}
function expenseRow(e) {
  const c = CATEGORIES.find(c => c.id === e.category), tr = document.createElement('tr');
  tr.style.setProperty('--category-bg', c.bg); tr.style.setProperty('--category-color', c.color);
  const name = document.createElement('td'), wrap = document.createElement('div'); wrap.className = 'expense-name';
  const badge = document.createElement('span'); badge.className = 'expense-icon'; badge.textContent = c.icon; badge.setAttribute('aria-hidden','true');
  const title = document.createElement('span'); title.textContent = e.description; wrap.append(badge,title); name.append(wrap);
  const category = document.createElement('td'), pill = document.createElement('span'); pill.className = 'category-pill'; pill.textContent = c.name; category.append(pill);
  const date = document.createElement('td'); date.textContent = new Date(e.date + 'T12:00:00').toLocaleDateString('en-GB', { day:'2-digit', month:'short', year:'numeric' });
  const amount = document.createElement('td'); amount.className = 'amount-cell'; amount.textContent = money(e.amount);
  const actions = document.createElement('td'), buttons = document.createElement('div'); buttons.className = 'row-actions';
  for (const [action, label] of [['edit','Edit'],['trash','Delete']]) {
    const button = document.createElement('button'); button.className = 'icon-button' + (action === 'trash' ? ' delete-button' : ''); button.innerHTML = icon(action); button.setAttribute('aria-label', label + ' ' + e.description); button.title = label;
    button.addEventListener('click', () => action === 'edit' ? openExpense(e) : openDelete(e)); buttons.append(button);
  }
  actions.append(buttons); tr.append(name,category,date,amount,actions); return tr;
}
function renderChart(summary, month) {
  const days = new Date(Number(month.slice(0,4)),Number(month.slice(5,7)),0).getDate();
  const totals = Array(days).fill(0); summary.rows.forEach(e => totals[Number(e.date.slice(8)) - 1] += e.amount);
  const peak = Math.max(...totals), max = peak || 100000, left = 47, width = 450, bottom = 145, chartHeight = 125, slot = width / days;
  let content = '';
  for (let i=0;i<=4;i++) {
    const y = bottom - i * chartHeight / 4, value = max / 100 * i / 4;
    const label = value >= 1000000 ? (value / 1000000).toFixed(1) + 'm' : value >= 1000 ? (value / 1000).toFixed(value < 10000 ? 1 : 0) + 'k' : Math.round(value);
    content += '<line class="gridline" x1="'+left+'" y1="'+y+'" x2="500" y2="'+y+'"/><text x="36" y="'+(y+3)+'" text-anchor="end">'+label+'</text>';
  }
  totals.forEach((total,i) => {
    const h = total ? Math.max(2,total / max * chartHeight) : 2, x = left+i*slot+slot*.18;
    content += '<rect class="bar '+(total && total === peak ? 'peak' : '')+'" x="'+x+'" y="'+(bottom-h)+'" width="'+(slot*.64)+'" height="'+h+'" rx="2" opacity="'+(total ? 1 : .15)+'"><title>'+month+'-'+String(i+1).padStart(2,'0')+': '+money(total)+'</title></rect>';
    if ([1,5,10,15,20,25,days].includes(i+1)) content += '<text x="'+(left+(i+.5)*slot)+'" y="165" text-anchor="middle">'+String(i+1).padStart(2,'0')+'</text>';
  });
  $('spending-chart').innerHTML = '<svg class="chart-svg" viewBox="0 0 520 178" role="img" aria-label="Daily spending for '+monthLabel(month)+'. Total '+money(summary.total)+'"><text x="2" y="9">LKR</text>'+content+'</svg>';
}
function renderCategories(summary) {
  const donut = $('category-donut'); $('donut-total').textContent = compactMoney(summary.total);
  let cursor = 0;
  const stops = summary.byCategory.map(c => { const start = cursor; cursor += c.total / summary.total * 100; return c.color+' '+start+'% '+cursor+'%'; });
  donut.style.background = stops.length ? 'conic-gradient('+stops.join(',')+')' : '#eff2eb';
  donut.setAttribute('aria-label', summary.byCategory.length ? summary.byCategory.map(c => c.name + ': ' + money(c.total)).join('; ') : 'No spending this month');
  $('category-legend').replaceChildren();
  if (!summary.byCategory.length) { const p=document.createElement('p'); p.className='legend-empty'; p.textContent='A clearer picture starts with your first expense.'; $('category-legend').append(p); }
  summary.byCategory.forEach(c => {
    const row=document.createElement('div'); row.className='legend-row';
    const dot=document.createElement('span'); dot.className='tiny-dot'; dot.style.background=c.color;
    const name=document.createElement('span'); name.textContent=c.name;
    const percent=document.createElement('b'); percent.textContent=Math.round(c.total / summary.total * 100)+'%';
    row.title=money(c.total); row.append(dot,name,percent); $('category-legend').append(row);
  });
}
function openExpense(expense) {
  editingId = expense ? expense.id : null; $('expense-form').reset(); $('expense-error').textContent='';
  $('expense-dialog-title').textContent = expense ? 'Edit expense' : 'Add an expense';
  $('save-expense').textContent = expense ? 'Save changes' : 'Save expense';
  if (expense) { $('description').value=expense.description; $('amount').value=(expense.amount/100).toFixed(2); $('expense-date').value=expense.date; $('expense-category').value=expense.category; }
  else { const month=$('month-filter').value; $('expense-date').value = month === today.slice(0,7) ? today : month+'-01'; }
  $('expense-dialog').showModal(); $('description').focus();
}
function openBudget() { $('budget-month-label').textContent = 'Your plan for '+monthLabel($('month-filter').value); $('budget-input').value = ((currentData().budgets[$('month-filter').value] || 0)/100).toFixed(2); $('budget-error').textContent=''; $('budget-dialog').showModal(); $('budget-input').select(); }
function openDelete(e) { deletingId=e.id; $('delete-description').textContent=e.description+' · '+money(e.amount); $('delete-dialog').showModal(); }
let pendingRestore = null;
function openBackup() { $('backup-error').textContent=''; $('restore-preview').hidden=true; $('restore-file-input').value=''; pendingRestore=null; $('backup-dialog').showModal(); }
['add-expense','empty-add'].forEach(id => $(id).addEventListener('click',()=>openExpense()));
['edit-budget','budget-nav'].forEach(id => $(id).addEventListener('click',openBudget));
$('backup-nav').addEventListener('click',openBackup);
$('export-backup-btn').addEventListener('click',()=>{
  try {
    const json = exportBackup(currentData());
    const blob = new Blob([json],{type:'application/json;charset=utf-8;'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'pocket-backup-'+today+(demo ? '-demo' : '')+'.json'; a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    toast('Backup exported as JSON.');
  } catch(err) { $('backup-error').textContent = err.message; }
});
$('choose-restore-btn').addEventListener('click',()=>$('restore-file-input').click());
$('restore-file-input').addEventListener('change',event=>{
  const file = event.target.files?.[0]; if (!file) return;
  $('backup-error').textContent='';
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const validated = importBackup(reader.result);
      pendingRestore = validated;
      const expCount = validated.expenses.length, bCount = Object.keys(validated.budgets).length;
      $('restore-preview-text').textContent = 'Found '+expCount+' expense'+(expCount === 1 ? '' : 's')+' and '+bCount+' monthly target'+(bCount === 1 ? '' : 's')+'. Restoring will replace existing records.';
      $('restore-preview').hidden = false;
    } catch(err) { pendingRestore=null; $('restore-preview').hidden=true; $('backup-error').textContent = err.message; }
  };
  reader.onerror = () => { $('backup-error').textContent = 'Could not read backup file.'; };
  reader.readAsText(file);
});
$('confirm-restore-btn').addEventListener('click',()=>{
  if (!pendingRestore) return;
  try {
    commit(pendingRestore); pendingRestore = null; $('restore-preview').hidden = true; $('backup-dialog').close(); render();
    saveMessage('Backup successfully restored.');
  } catch(err) { $('backup-error').textContent = err.message; }
});
$('cancel-restore-btn').addEventListener('click',()=>{ pendingRestore = null; $('restore-preview').hidden = true; $('restore-file-input').value = ''; });
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>$(button.dataset.close).close()));
$('expense-form').addEventListener('submit',event=>{
  event.preventDefault();
  try {
    const e=validateExpense({ id: editingId || (globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'e'+Date.now()+Math.random().toString(36).slice(2)), description:$('description').value.trim(), amount:parseMoney($('amount').value), category:$('expense-category').value, date:$('expense-date').value });
    const data=currentData();
    const next={...data, expenses:editingId ? data.expenses.map(row=>row.id === editingId ? e : row) : [...data.expenses,e]};
    commit(next); $('month-filter').value=e.date.slice(0,7); $('category-filter').value='all'; $('search').value=''; $('expense-dialog').close(); render(); saveMessage(editingId ? 'Expense updated.' : 'Expense added.');
  } catch(error) { $('expense-error').textContent=error.message; }
});
$('budget-form').addEventListener('submit',event=>{ event.preventDefault(); try { const value=parseMoney($('budget-input').value,true), data=currentData(); commit({...data,budgets:{...data.budgets,[$('month-filter').value]:value}}); $('budget-dialog').close(); render(); saveMessage('Monthly budget saved.'); } catch(error) { $('budget-error').textContent=error.message; } });
$('confirm-delete').addEventListener('click',()=>{ try { const data=currentData(); commit({...data,expenses:data.expenses.filter(e=>e.id !== deletingId)}); $('delete-dialog').close(); render(); saveMessage('Expense deleted.'); } catch(error) { toast(error.message); } });
$('month-filter').addEventListener('change',()=>{if(!/^\d{4}-(0[1-9]|1[0-2])$/.test($('month-filter').value)) $('month-filter').value=today.slice(0,7);render();});
$('category-filter').addEventListener('change',render); $('search').addEventListener('input',render);
$('export-csv').addEventListener('click',()=>{ const rows=filteredExpenses(monthlySummary(currentData().expenses,$('month-filter').value,0).rows,$('category-filter').value,$('search').value); const url=URL.createObjectURL(new Blob([toCsv(rows)],{type:'text/csv;charset=utf-8;'})); const a=document.createElement('a');a.href=url;a.download='pocket-expenses-'+$('month-filter').value+(demo ? '-demo' : '')+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Filtered expenses exported as CSV.'); });
$('demo-button').addEventListener('click',()=>{
  const month=today.slice(0,7), items=[['Grocery run',325000,'food',2],['Bus & train pass',180000,'transport',4],['Coffee with friends',85000,'food',6],['Internet bill',249000,'bills',8],['New reading list',175000,'education',10],['Weekend lunch',215000,'food',12],['Everyday essentials',320000,'shopping',14],['Movie night',160000,'leisure',16],['Lunch at university',65000,'food',18]];
  demo={version:1,budgets:{[month]:2000000},expenses:items.map((e,i)=>({id:'demo-'+i,description:e[0],amount:e[1],category:e[2],date:month+'-'+String(e[3]).padStart(2,'0')}))};
  $('month-filter').value=month;$('category-filter').value='all';$('search').value='';render();window.scrollTo({top:0,behavior:'smooth'});toast('Demo mode is on. Changes here won’t affect your own data.');
});
$('leave-demo').addEventListener('click',()=>{demo=null;$('month-filter').value=today.slice(0,7);$('category-filter').value='all';$('search').value='';render();toast('Back to your own expenses.');});
window.addEventListener('storage',event=>{if(event.key !== STORAGE_KEY || demo || document.querySelector('dialog[open]'))return;try {state=event.newValue ? validateState(JSON.parse(event.newValue)) : emptyState();render();}catch(_){toast('Another tab changed saved data, but it could not be read.');}});
render();
