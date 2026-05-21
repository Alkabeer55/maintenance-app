// ===== REPORTS =====
var _reportFrom='', _reportTo='';

function renderReports(){
  if(!_reportFrom){var d=new Date();_reportFrom=new Date(d.getFullYear(),d.getMonth(),1).toISOString().split('T')[0];_reportTo=today();}
  var tab=currentReportTab||'period';
  ['period','income','balance','expenses'].forEach(function(t){var el=document.getElementById('tab-'+t);if(el)el.style.display=t===tab?'block':'none';});
  if(tab==='period')renderPeriodReport();
  else if(tab==='income')renderIncomeReport();
  else if(tab==='balance')renderBalanceReport();
  else if(tab==='expenses')renderExpensesReport();
}

function setDateFilter(from,to,el){
  _reportFrom=from;_reportTo=to;
  document.querySelectorAll('.df-btn').forEach(function(b){b.classList.remove('active');});
  if(el)el.classList.add('active');
  renderReports();
}

function filterSalesByPeriod(){
  return DB.sales.filter(function(s){return(!_reportFrom||s.date>=_reportFrom)&&(!_reportTo||s.date<=_reportTo);});
}
function filterPurchByPeriod(){
  return DB.purchases.filter(function(p){return(!_reportFrom||p.date>=_reportFrom)&&(!_reportTo||p.date<=_reportTo);});
}
function filterExpByPeriod(){
  return DB.expenses.filter(function(e){return(!_reportFrom||e.date>=_reportFrom)&&(!_reportTo||e.date<=_reportTo);});
}

function renderPeriodReport(){
  var ps=filterSalesByPeriod();
  var pp=filterPurchByPeriod();
  var pe=filterExpByPeriod();
  var rev=ps.reduce(function(s,x){return s+x.total;},0);
  var cos=ps.reduce(function(s,sale){return s+sale.items.reduce(function(ss,item){return ss+item.qty*(item.buyPrice||0);},0);},0);
  var gross=rev-cos;
  var exp=pe.reduce(function(s,x){return s+x.amount;},0);
  var net=gross-exp;
  var purch=pp.reduce(function(s,x){return s+x.total;},0);
  var el=document.getElementById('tab-period');if(!el)return;
  el.innerHTML=
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+
    '<div class="period-stat"><div class="period-stat-label">المبيعات</div><div class="period-stat-val" style="color:#2563eb">'+fmt(rev)+'</div></div>'+
    '<div class="period-stat"><div class="period-stat-label">التكاليف</div><div class="period-stat-val" style="color:#7c3aed">'+fmt(cos)+'</div></div>'+
    '<div class="period-stat"><div class="period-stat-label">المصروفات</div><div class="period-stat-val" style="color:#ea580c">'+fmt(exp)+'</div></div>'+
    '<div class="period-stat"><div class="period-stat-label">صافي الربح</div><div class="period-stat-val" style="color:'+(net>=0?'#16a34a':'#dc2626')+'">'+fmt(net)+'</div></div>'+
    '</div>'+
    '<div class="card">'+
    '<div class="report-row bold"><span>إجمالي المبيعات</span><span style="color:#2563eb">'+fmt(rev)+'</span></div>'+
    '<div class="report-row indent"><span>تكلفة البضاعة المباعة</span><span style="color:#7c3aed">- '+fmt(cos)+'</span></div>'+
    '<div class="report-row bold"><span>مجمل الربح</span><span>'+fmt(gross)+'</span></div>'+
    '<div class="report-row indent"><span>المصروفات التشغيلية</span><span style="color:#ea580c">- '+fmt(exp)+'</span></div>'+
    '<div class="net-box" style="background:'+(net>=0?'#f0fdf4':'#fef2f2')+'">'+
    '<span style="font-weight:900;font-size:15px">صافي الربح</span>'+
    '<span style="font-weight:900;font-size:18px;color:'+(net>=0?'#16a34a':'#dc2626')+'">'+fmt(net)+'</span></div>'+
    '<div style="border-top:1px solid #f1f5f9;margin-top:10px;padding-top:10px">'+
    '<div class="report-row"><span>إجمالي المشتريات</span><span style="color:#7c3aed">'+fmt(purch)+'</span></div>'+
    '<div class="report-row"><span>عدد الفواتير</span><span>'+ps.length+'</span></div>'+
    '</div></div>';
}

function renderIncomeReport(){
  var ps=filterSalesByPeriod();
  var byStatus={مدفوع:0,جزئي:0,'غير مدفوع':0};
  ps.forEach(function(s){byStatus[s.status]=(byStatus[s.status]||0)+s.total;});
  var el=document.getElementById('tab-income');if(!el)return;
  var rows=ps.slice(0,50).map(function(s){
    return '<div class="report-row">'+
      '<div><div style="font-size:13px;font-weight:700">'+esc(s.customer)+'</div>'+
      '<div style="font-size:11px;color:#94a3b8">'+esc(fmtDate(s.date))+'</div></div>'+
      '<div style="text-align:left"><div style="font-weight:700">'+fmt(s.total)+'</div>'+
      '<span class="badge" style="background:'+(s.status==='مدفوع'?'#dcfce7':s.status==='جزئي'?'#fef9c3':'#fee2e2')+';color:'+(s.status==='مدفوع'?'#16a34a':s.status==='جزئي'?'#ca8a04':'#dc2626')+'">'+s.status+'</span></div></div>';
  }).join('');
  el.innerHTML='<div class="card">'+
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
    '<div style="flex:1;background:#dcfce7;border-radius:11px;padding:10px;text-align:center"><div style="font-size:10px;color:#16a34a;font-weight:700">مدفوع</div><div style="font-weight:900;color:#16a34a">'+fmt(byStatus['مدفوع'])+'</div></div>'+
    '<div style="flex:1;background:#fef9c3;border-radius:11px;padding:10px;text-align:center"><div style="font-size:10px;color:#ca8a04;font-weight:700">جزئي</div><div style="font-weight:900;color:#ca8a04">'+fmt(byStatus['جزئي'])+'</div></div>'+
    '<div style="flex:1;background:#fee2e2;border-radius:11px;padding:10px;text-align:center"><div style="font-size:10px;color:#dc2626;font-weight:700">غير مدفوع</div><div style="font-weight:900;color:#dc2626">'+fmt(byStatus['غير مدفوع'])+'</div></div>'+
    '</div>'+rows+'</div>';
}

function renderBalanceReport(){
  var assets=DB.products.reduce(function(s,p){return s+p.qty*p.buyPrice;},0);
  var custDebt=DB.debts.filter(function(d){return d.type==='customer';}).reduce(function(s,d){return s+(d.total-(d.paid||0));},0);
  var suppDebt=DB.debts.filter(function(d){return d.type==='supplier';}).reduce(function(s,d){return s+(d.total-(d.paid||0));},0);
  var el=document.getElementById('tab-balance');if(!el)return;
  el.innerHTML='<div class="card">'+
    '<div class="card-header"><span class="card-title">الموجودات (الأصول)</span></div>'+
    '<div class="bs-row"><span>قيمة المخزون</span><b>'+fmt(assets)+'</b></div>'+
    '<div class="bs-row"><span>ديون العملاء (لنا)</span><b style="color:#2563eb">'+fmt(custDebt)+'</b></div>'+
    '<div class="bs-row total"><span>إجمالي الموجودات</span><b>'+fmt(assets+custDebt)+'</b></div></div>'+
    '<div class="card">'+
    '<div class="card-header"><span class="card-title">المطلوبات (الديون)</span></div>'+
    '<div class="bs-row"><span>ديون للموردين (علينا)</span><b style="color:#dc2626">'+fmt(suppDebt)+'</b></div>'+
    '<div class="bs-row total"><span>إجمالي المطلوبات</span><b style="color:#dc2626">'+fmt(suppDebt)+'</b></div></div>'+
    '<div class="bs-eq">'+
    '<div style="font-size:12px;opacity:.7;margin-bottom:4px">صافي المركز المالي</div>'+
    '<div style="font-size:22px;font-weight:900">'+fmt(assets+custDebt-suppDebt)+'</div></div>';
}

function renderExpensesReport(){
  var pe=filterExpByPeriod();
  var byType={};
  pe.forEach(function(e){byType[e.type]=(byType[e.type]||0)+e.amount;});
  var total=pe.reduce(function(s,e){return s+e.amount;},0);
  var el=document.getElementById('tab-expenses');if(!el)return;
  el.innerHTML='<div class="card">'+
    '<div class="report-row bold"><span>إجمالي المصروفات</span><span style="color:#ea580c">'+fmt(total)+'</span></div>'+
    Object.keys(byType).map(function(k){return '<div class="report-row indent"><span>'+esc(k)+'</span><span>'+fmt(byType[k])+'</span></div>';}).join('')+
    '</div>'+
    '<div class="card"><div class="card-header"><span class="card-title">تفاصيل المصروفات</span></div>'+
    pe.slice(0,50).map(function(e){return '<div class="report-row"><div><div style="font-size:13px;font-weight:700">'+esc(e.desc)+'</div><div style="font-size:11px;color:#94a3b8">'+esc(fmtDate(e.date))+'</div></div><b style="color:#ea580c">'+fmt(e.amount)+'</b></div>';}).join('')+
    '</div>';
}
