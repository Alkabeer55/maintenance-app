// ===== NAVIGATION =====
var currentScreen='home', currentReportTab='period', currentDebtTab='customer';
var _navHistory=['home'];
var navLabels={home:'الرئيسية',inventory:'مخزون',sales:'مبيعات',purchases:'مشتريات',debts:'الديون',reports:'التقارير',tasks:'المهمات',settings:'إعدادات',search:'البحث الشامل',ledger:'سجل العميل'};
var navIcons={home:'🏠',inventory:'📦',sales:'🧾',purchases:'🛒',debts:'💳',reports:'📊',tasks:'📋',settings:'⚙️',search:'🔍',ledger:'👤'};

function navigate(screen){
  if(screen!==currentScreen){_navHistory.push(screen);if(_navHistory.length>15)_navHistory.shift();}
  document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});
  var scEl=document.getElementById('screen-'+screen);
  if(!scEl){console.warn('Screen not found:',screen);return;}
  scEl.classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(function(b){b.classList.toggle('active',b.dataset.screen===screen);});
  var hdr=document.getElementById('header');
  if(screen==='home')hdr.classList.add('hidden');
  else{hdr.classList.remove('hidden');document.getElementById('header-title').textContent=(navIcons[screen]||'')+' '+(navLabels[screen]||screen);}
  currentScreen=screen;
  renderScreen(screen);
  document.getElementById('content').scrollTop=0;
}

function navigateBack(){
  if(_navHistory.length>1){_navHistory.pop();navigate(_navHistory[_navHistory.length-1]);}
  else navigate('home');
}

function renderScreen(s){
  if(s==='home')renderHome();
  else if(s==='inventory')renderInventory();
  else if(s==='sales'){_salesPage=0;renderSales();}
  else if(s==='purchases')renderPurchases();
  else if(s==='debts')renderDebts();
  else if(s==='tasks')renderTasks();
  else if(s==='reports')renderReports();
  else if(s==='settings')renderSettings();
  else if(s==='search')renderGlobalSearch();
  else if(s==='ledger')renderLedger(_currentLedgerCustomer);
}

function switchReportTab(tab,el){
  currentReportTab=tab;
  document.querySelectorAll('#screen-reports .tab').forEach(function(t){t.classList.remove('active');});
  el.classList.add('active');
  ['period','income','balance','expenses'].forEach(function(t){document.getElementById('tab-'+t).style.display=t===tab?'block':'none';});
  renderReports();
}
function switchDebtTab(tab,el){
  currentDebtTab=tab;
  document.querySelectorAll('#screen-debts .tab').forEach(function(t){t.classList.remove('active');});
  el.classList.add('active');
  renderDebts();
}

// ===== GLOBAL SEARCH =====
var _globalSearchTimer=null;
function renderGlobalSearch(q){
  var el=document.getElementById('global-results');if(!el)return;
  q=q||v('global-search-input')||'';
  if(!q.trim()){el.innerHTML='<div class="empty">اكتب للبحث في كل البيانات</div>';return;}
  var qn=normalizeAr(q);
  var results=[];

  // Sales
  DB.sales.forEach(function(s){
    if(normalizeAr(s.customer).includes(qn)||normalizeAr(s.note||'').includes(qn)||normalizeAr(s.counter||'').includes(qn)||s.items.some(function(i){return normalizeAr(i.name).includes(qn);})){
      results.push({type:'sale',label:'فاتورة',icon:'🧾',title:esc(s.customer),sub:fmt(s.total)+' — '+fmtDate(s.date),action:'openSaleModal('+s.id+')'});
    }
  });
  // Products
  DB.products.forEach(function(p){
    if(normalizeAr(p.name).includes(qn)){
      results.push({type:'product',label:'منتج',icon:'📦',title:esc(p.name),sub:'الكمية: '+p.qty+' | بيع: '+p.sellPrice+' ج',action:'navigate(\'inventory\')'});
    }
  });
  // Debts
  DB.debts.forEach(function(d){
    if(normalizeAr(d.name).includes(qn)||normalizeAr(d.desc||'').includes(qn)){
      var rem=d.total-(d.paid||0);
      results.push({type:'debt',label:'دين',icon:'💳',title:esc(d.name),sub:(rem>0?'متبقي: '+fmt(rem):'✅ مسدّد'),action:'navigate(\'debts\')'});
    }
  });
  // Purchases
  DB.purchases.forEach(function(p){
    if(normalizeAr(p.supplier).includes(qn)||p.items.some(function(i){return normalizeAr(i.name).includes(qn);})){
      results.push({type:'purchase',label:'مشترى',icon:'🛒',title:esc(p.supplier),sub:fmt(p.total)+' — '+fmtDate(p.date),action:'navigate(\'purchases\')'});
    }
  });
  // Tasks
  DB.tasks.forEach(function(t){
    if(normalizeAr(t.title).includes(qn)||normalizeAr(t.desc||'').includes(qn)){
      results.push({type:'task',label:'مهمة',icon:'📋',title:esc(t.title),sub:t.status==='done'?'✅ منجزة':t.priority,action:'navigate(\'tasks\')'});
    }
  });
  // Expenses
  DB.expenses.forEach(function(e){
    if(normalizeAr(e.desc).includes(qn)){
      results.push({type:'expense',label:'مصروف',icon:'💸',title:esc(e.desc),sub:fmt(e.amount)+' — '+fmtDate(e.date),action:'navigate(\'reports\')'});
    }
  });

  if(!results.length){el.innerHTML='<div class="empty">لا توجد نتائج لـ "'+esc(q)+'"</div>';return;}
  el.innerHTML='<div style="font-size:12px;color:#64748b;margin-bottom:10px">'+results.length+' نتيجة</div>'+
    results.map(function(r){
      return '<div class="card" style="cursor:pointer;margin-bottom:8px" onclick="'+r.action+';closeModal()">'+
        '<div style="display:flex;align-items:center;gap:10px">'+
        '<span style="font-size:20px">'+r.icon+'</span>'+
        '<div style="flex:1"><div style="font-weight:800;font-size:14px">'+r.title+'</div>'+
        '<div style="font-size:12px;color:#64748b;margin-top:2px">'+r.sub+'</div></div>'+
        '<span class="search-result-tag">'+r.label+'</span></div></div>';
    }).join('');
}

function openGlobalSearch(){
  document.getElementById('modal-title').textContent='🔍 البحث الشامل';
  document.getElementById('modal-body').innerHTML=
    '<input id="global-search-input" type="text" placeholder="ابحث باسم عميل، منتج، مورد، سيريال..." style="width:100%;padding:12px 14px;border:2px solid #3b82f6;border-radius:11px;font-size:15px;font-family:inherit;direction:rtl;background:#f8fafc;outline:none;margin-bottom:12px">'+
    '<div id="global-results"><div class="empty">اكتب للبحث في كل البيانات</div></div>';
  openModal();
  setTimeout(function(){
    var inp=document.getElementById('global-search-input');
    if(inp){
      inp.focus();
      inp.addEventListener('input',function(){
        clearTimeout(_globalSearchTimer);
        _globalSearchTimer=setTimeout(function(){renderGlobalSearch(inp.value);},250);
      });
    }
  },80);
}
