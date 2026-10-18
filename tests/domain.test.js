const test = require('node:test');
const assert = require('node:assert/strict');
const {parseMoney,validDate,validateExpense,validateState,monthlySummary,filteredExpenses,toCsv,exportBackup,importBackup,getPreviousMonth,getNextMonth,monthComparison,dailyAverage}=require('../dist/domain.js');
const expense=(changes={})=>({id:'a',description:'Lunch',amount:1050,date:'2026-10-18',category:'food',...changes});
test('money uses integer cents and accepts a removable zero budget',()=>{assert.equal(parseMoney('0.29'),29);assert.equal(parseMoney('2500.50'),250050);assert.equal(parseMoney('0',true),0);for(const s of ['0','-1','1.001','NaN','Infinity','1e5','1000000000',''])assert.throws(()=>parseMoney(s));});
test('dates reject normalized invalid dates and preserve leap days',()=>{assert.equal(validDate('2026-02-30'),false);assert.equal(validDate('2024-02-29'),true);assert.equal(validDate('2026-02-29'),false);assert.equal(validDate('0000-01-01'),false);assert.equal(validDate('2026-10-18'),true);});
test('saved data rejects unknown categories, malformed records and duplicate IDs',()=>{assert.throws(()=>validateExpense(expense({category:'unknown'})));assert.throws(()=>validateExpense(expense({amount:1.5})));assert.throws(()=>validateExpense(expense({description:' '})));assert.throws(()=>validateState({version:1,expenses:[expense(),expense()],budgets:{}}));assert.throws(()=>validateState({version:1,expenses:[],budgets:{'2026-13':500}}));assert.deepEqual(validateState({version:1,expenses:[expense()],budgets:{'2026-10':100000}}).expenses,[expense()]);});
test('monthly totals and category breakdown exclude other months',()=>{const rows=[expense(),expense({id:'b',amount:2000,category:'transport'}),expense({id:'c',date:'2026-09-30',amount:999999})];const s=monthlySummary(rows,'2026-10',2000);assert.equal(s.total,3050);assert.equal(s.remaining,-1050);assert.equal(s.count,2);assert.equal(s.byCategory[0].id,'transport');assert.equal(s.byCategory[1].total,1050);});
test('category and description filters combine and order newest first',()=>{const rows=[expense({id:'a',date:'2026-10-01'}),expense({id:'b',description:'University lunch'}),expense({id:'c',category:'other'})];assert.deepEqual(filteredExpenses(rows,'food',' LUNCH ').map(e=>e.id),['b','a']);assert.equal(filteredExpenses(rows,'transport','').length,0);});
test('CSV escapes quotes, newlines, commas and spreadsheet formula prefixes',()=>{const csv=toCsv([expense({description:'=SUM(1,2)'}),expense({description:'A "quoted",\nname'})]);assert.match(csv,/"'=SUM\(1,2\)"/);assert.match(csv,/"A ""quoted"",\nname"/);assert.match(csv,/"10\.50"/);assert.equal(csv.charCodeAt(0),0xfeff);});
test('backup export produces valid JSON and import restores validated state',()=>{const original={version:1,expenses:[expense()],budgets:{'2026-10':5000000}};const json=exportBackup(original);assert.match(json,/"version": 1/);assert.match(json,/"exportedAt":/);const restored=importBackup(json);assert.deepEqual(restored.expenses,original.expenses);assert.deepEqual(restored.budgets,original.budgets);for(const invalid of ['not-json','{"version":2}','{"version":1,"expenses":"none"}',null,123])assert.throws(()=>importBackup(invalid));});
test('analytics handles month navigation, comparison metrics and daily averages',()=>{
  assert.equal(getPreviousMonth('2026-10'),'2026-09');
  assert.equal(getPreviousMonth('2026-01'),'2025-12');
  assert.throws(()=>getPreviousMonth('invalid'));
  assert.equal(getNextMonth('2026-10'),'2026-11');
  assert.equal(getNextMonth('2026-12'),'2027-01');
  assert.throws(()=>getNextMonth('invalid'));
  const rows=[
    expense({date:'2026-09-15',amount:100000}),
    expense({date:'2026-10-05',amount:120000}),
    expense({date:'2026-10-12',amount:30000})
  ];
  const comp=monthComparison(rows,'2026-10');
  assert.equal(comp.prevMonth,'2026-09');
  assert.equal(comp.prevTotal,100000);
  assert.equal(comp.currentTotal,150000);
  assert.equal(comp.diff,50000);
  assert.equal(comp.percentChange,50);
  const noPrev=monthComparison(rows,'2026-09');
  assert.equal(noPrev.prevTotal,0);
  assert.equal(noPrev.percentChange,100);
  assert.equal(dailyAverage(310000,'2026-10'),10000);
});
test('filteredExpenses supports multiple sort criteria',()=>{
  const rows=[
    expense({id:'1',amount:1000,date:'2026-10-01'}),
    expense({id:'2',amount:5000,date:'2026-10-05'}),
    expense({id:'3',amount:2500,date:'2026-10-03'})
  ];
  assert.deepEqual(filteredExpenses(rows,'all','','date-asc').map(e=>e.id),['1','3','2']);
  assert.deepEqual(filteredExpenses(rows,'all','','amount-desc').map(e=>e.id),['2','3','1']);
  assert.deepEqual(filteredExpenses(rows,'all','','amount-asc').map(e=>e.id),['1','3','2']);
});



