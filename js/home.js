// ===== HOME =====
function renderHome(){
  var ts=DB.sales.reduce(function(s,x){return s+x.total;},0);
  var tp=DB.purchases.reduce(function(s,x){return s+x.total;},0);
  var te=DB.expenses.reduce(function(s,x){return s+x.amount;},0);
  var td=DB.debts.reduce(function(s,d){return s+(d.total-(d.paid||0));},0);
  var profit=ts-tp-te;
  document.getElementById('stat-sales').textContent=fmt(ts);
  document.getElementById('stat-profit').textContent=fmt(profit);
  document.getElementById('stat-profit-icon').textContent=profit>=0?'📈':'📉';
  document.getElementById('stat-profit-card').style.background=profit>=0?'#16a34a':'#dc2626';
  document.getElementById('stat-debts').textContent=fmt(td);

  // Low stock alert
  var low=DB.products.filter(function(p){return p.qty<=p.minQty;});
  document.getElementById('low-stock-alert').innerHTML=low.length?
    '<div style="background:#fff7ed;border:1.5px solid #fed7aa;border-radius:14px;padding:13px 14px;margin-bottom:10px;cursor:pointer" onclick="navigate(\'inventory\')">'+
    '<div style="font-weight:800;color:#c2410c;margin-bottom:7px">⚠️ مخزون منخفض</div>'+
    low.map(function(p){return '<div style="font-size:12px;color:#9a3412;padding:4px 0;border-bottom:1px solid #fed7aa;display:flex;justify-content:space-between"><span>'+esc(p.name)+'</span><b>'+p.qty+' '+esc(p.unit)+'</b></div>';}).join('')+'</div>':'';

  renderTasksWidget();
  updateTasksBadge();
}

function renderTasksWidget(){
  var el=document.getElementById('tasks-home-widget');if(!el)return;
  var pending=DB.tasks.filter(function(t){return t.status!=='done';});
  if(!pending.length){el.innerHTML='';return;}
  var pc=function(p){return p==='عاجل'?'#dc2626':p==='متوسط'?'#ca8a04':'#16a34a';};
  el.innerHTML='<div style="background:#fff;border-radius:14px;padding:14px;box-shadow:0 2px 10px rgba(0,0,0,.06);margin-bottom:14px">'+
    '<div style="font-weight:900;font-size:15px;color:#0f172a;margin-bottom:10px;display:flex;justify-content:space-between">'+
    '<span>📋 المهمات ('+pending.length+')</span>'+
    '<button class="btn-add" onclick="navigate(\'tasks\')">عرض الكل</button></div>'+
    pending.slice(0,3).map(function(t){
      return '<div style="border:1.5px solid '+pc(t.priority)+'44;border-radius:11px;padding:11px 13px;margin-bottom:8px">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">'+
        '<span style="font-weight:800;font-size:14px">'+esc(t.title)+'</span>'+
        '<span class="badge" style="background:'+pc(t.priority)+'22;color:'+pc(t.priority)+'">'+t.priority+'</span></div>'+
        (t.desc?'<div style="font-size:12px;color:#64748b;margin-bottom:8px">'+esc(t.desc)+'</div>':'')+
        '<button class="btn btn-green btn-full btn-sm" onclick="openMarkDoneModal('+t.id+')">✅ تم الإنجاز</button></div>';
    }).join('')+'</div>';
}

function updateTasksBadge(){
  var pending=DB.tasks.filter(function(t){return t.status!=='done';});
  var b=document.getElementById('tasks-badge');
  if(b){if(pending.length>0){b.textContent=pending.length;b.style.display='';}else b.style.display='none';}
}
