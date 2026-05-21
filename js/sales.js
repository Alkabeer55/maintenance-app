// ===== SALES =====
var _salesPage=0, SALES_PER_PAGE=30;

function renderSales(){
  var q=document.getElementById('sales-search')?normalizeAr(document.getElementById('sales-search').value):'';
  var list=[].concat(DB.sales).sort(function(a,b){return b.id-a.id;});
  if(q)list=list.filter(function(s){
    return normalizeAr(s.customer).includes(q)||
      normalizeAr(s.note||'').includes(q)||
      normalizeAr(s.serial||'').includes(q)||
      normalizeAr(s.model||'').includes(q)||
      normalizeAr(s.counter||'').includes(q)||
      s.items.some(function(i){return normalizeAr(i.name).includes(q);});
  });
  var el=document.getElementById('sales-list');
  if(!list.length){el.innerHTML='<div class="empty">لا توجد فواتير</div>';return;}
  function sc(s){return s==='مدفوع'?'#16a34a':s==='جزئي'?'#ca8a04':'#dc2626';}
  var start=_salesPage*SALES_PER_PAGE;
  var pageItems=list.slice(start,start+SALES_PER_PAGE);
  var totalPages=Math.ceil(list.length/SALES_PER_PAGE);
  el.innerHTML=pageItems.map(function(s){
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="flex:1">'+
    '<div class="item-name" style="cursor:pointer" onclick="openLedger(\''+esc(s.customer)+'\')">'+esc(s.customer)+' <span style="font-size:11px;color:#3b82f6">👤</span></div>'+
    '<div class="item-sub" style="color:#94a3b8;font-size:11px">'+esc(fmtDate(s.date))+'</div>'+
    (s.serial?'<div class="item-sub">🔢 سيريال: <b>'+esc(s.serial)+'</b></div>':'')+
    (s.model?'<div class="item-sub">🖨️ موديل: <b>'+esc(s.model)+'</b></div>':'')+
    (s.counter?'<div class="item-sub">⚫ عداد: <b style="background:#0f172a;color:#fff;padding:1px 7px;border-radius:5px;font-size:12px">'+esc(s.counter)+'</b>'+(s.colorCounter?' 🌈 <b>'+esc(s.colorCounter)+'</b>':'')+'</div>':'')+
    '<div class="item-sub">'+s.items.map(function(i){return esc(i.name)+' × '+i.qty;}).join(' | ')+(s.services&&s.services.length?' | '+s.services.map(function(sv){return esc(sv.name);}).join(' | '):'')+(s.items.length===0&&!s.services&&s.note?' — '+esc(s.note):'')+'</div>'+
    (s.image?'<div style="margin-top:6px"><img src="'+s.image+'" style="width:70px;height:50px;object-fit:cover;border-radius:7px;border:1px solid #e2e8f0" onclick="showImageModal('+s.id+')"></div>':'')+
    '<div style="margin-top:5px"><span class="badge" style="background:'+sc(s.status)+'22;color:'+sc(s.status)+'">'+esc(s.status)+'</span></div>'+
    '</div><div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'+
    '<div style="font-weight:900;font-size:16px">'+fmt(s.total)+'</div>'+
    '<div style="display:flex;gap:5px">'+
    '<button class="btn-ic" style="background:#dbeafe" onclick="openSaleModal('+s.id+')">✏️</button>'+
    '<button class="btn-ic" style="background:#f0fdf4;color:#166534" onclick="printInvoice('+s.id+')">🖨️</button>'+
    '<button class="btn-ic" style="background:#fee2e2" onclick="confirmAction(\'هتحذف الفاتورة دي؟\',function(){delItem(\'sales\','+s.id+',renderSales)})">🗑️</button>'+
    '</div></div></div></div>';
  }).join('')+(totalPages>1?
    '<div style="display:flex;justify-content:center;align-items:center;gap:10px;padding:12px 0">'+
    (_salesPage>0?'<button class="btn btn-outline btn-sm" onclick="_salesPage--;renderSales()">← السابق</button>':'')+
    '<span style="font-size:12px;color:#64748b">'+(_salesPage+1)+' / '+totalPages+'</span>'+
    (_salesPage<totalPages-1?'<button class="btn btn-outline btn-sm" onclick="_salesPage++;renderSales()">التالي →</button>':'')+
    '</div>':'');
}

var _saleId=null, _saleItems=[], _saleServices=[];

function openSaleModal(id){
  _saleId=id||null;
  var s=id?DB.sales.find(function(x){return x.id===id;}):null;
  _saleItems=s?s.items.slice():[];
  _saleServices=s&&s.services?s.services.slice():[];
  document.getElementById('modal-title').textContent=s?'تعديل الفاتورة':'فاتورة بيع جديدة';
  renderSaleBody(s);openModal();
}

function renderSaleBody(s){
  var savedCustomer=document.getElementById('sale-customer')?v('sale-customer'):'';
  var savedPaid=document.getElementById('sale-paid')?v('sale-paid'):'';
  var savedNote=document.getElementById('sale-note')?v('sale-note'):'';
  var savedCounter=document.getElementById('sale-counter')?v('sale-counter'):'';
  var savedColorCounter=document.getElementById('sale-color-counter')?v('sale-color-counter'):'';
  var savedSerial=document.getElementById('sale-serial')?v('sale-serial'):'';
  var savedModel=document.getElementById('sale-model')?v('sale-model'):'';
  var total=_saleItems.reduce(function(s,i){return s+i.qty*i.price;},0)+
            _saleServices.reduce(function(s,sv){return s+sv.price;},0);
  var itemsHtml='';
  if(_saleItems.length||_saleServices.length){
    itemsHtml='<div class="items-list">'+
      _saleItems.map(function(it,i){
        return '<div class="items-list-row">'+
          '<span style="flex:1;font-size:13px">'+esc(it.name)+'</span>'+
          '<div style="display:flex;align-items:center;gap:5px">'+
          '<button onclick="chgQty('+i+',-1)" style="background:#fee2e2;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:14px;font-weight:900;color:#dc2626">−</button>'+
          '<span style="font-weight:900;font-size:14px;min-width:22px;text-align:center">'+it.qty+'</span>'+
          '<button onclick="chgQty('+i+',1)" style="background:#dcfce7;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:14px;font-weight:900;color:#16a34a">+</button>'+
          '<b style="color:#16a34a;min-width:50px;text-align:left;font-size:12px">'+fmt(it.qty*it.price)+'</b>'+
          '<button onclick="rmSaleItem('+i+')" style="background:#fee2e2;border:none;border-radius:6px;padding:2px 6px;cursor:pointer;font-size:11px;color:#dc2626">✕</button>'+
          '</div></div>';
      }).join('')+
      _saleServices.map(function(sv,i){
        return '<div class="items-list-row" style="background:#fef9f0">'+
          '<span style="flex:1;font-size:13px">🔧 '+esc(sv.name)+'</span>'+
          '<div style="display:flex;align-items:center;gap:5px">'+
          '<b style="color:#ea580c;min-width:50px;text-align:left;font-size:12px">'+fmt(sv.price)+'</b>'+
          '<button onclick="rmSaleService('+i+')" style="background:#fee2e2;border:none;border-radius:6px;padding:2px 6px;cursor:pointer;font-size:11px;color:#dc2626">✕</button>'+
          '</div></div>';
      }).join('')+
      '<div class="total-row"><span>الإجمالي</span><span>'+fmt(total)+'</span></div></div>';
  }
  document.getElementById('modal-body').innerHTML=
    acField('sale-customer','اسم العميل','text',s?s.customer:savedCustomer,'','customers',true)+
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">'+
    '<div class="field" style="margin:0"><label>🔢 سيريال المكنة</label><input id="sale-serial" type="text" value="'+esc(s?s.serial||'':savedSerial)+'" placeholder="SN-12345" autocomplete="off"></div>'+
    '<div class="field" style="margin:0"><label>🖨️ موديل المكنة</label><input id="sale-model" type="text" value="'+esc(s?s.model||'':savedModel)+'" placeholder="LBP3000"></div></div>'+
    '<div class="field"><label>🔍 بحث وإضافة قطع الغيار</label>'+
    '<input id="prod-search" type="text" placeholder="اكتب اسم المنتج..." autocomplete="off" style="width:100%;padding:10px 13px;border:2px solid #3b82f6;border-radius:11px;font-size:14px;font-family:inherit;direction:rtl;background:#f8fafc;outline:none;margin-bottom:6px" oninput="filterProds()">'+
    '<div id="prod-results" style="display:none" class="prod-search-results"></div></div>'+
    '<div style="margin-bottom:12px"><button class="btn btn-sm" style="background:#fff7ed;color:#ea580c;border:1.5px solid #fed7aa;width:100%" onclick="addServiceLine()">🔧 + إضافة بند صيانة / زيارة</button></div>'+
    itemsHtml+
    '<div style="display:flex;gap:8px;margin-bottom:12px">'+
    '<div style="flex:1"><label style="display:block;font-size:12px;color:#64748b;margin-bottom:4px;font-weight:700">⚫ عداد أسود</label>'+
    '<input id="sale-counter" type="number" class="counter-black" value="'+esc(s&&s.counter?s.counter:savedCounter)+'" placeholder="0"></div>'+
    '<div style="flex:1"><label style="display:block;font-size:12px;color:#64748b;margin-bottom:4px;font-weight:700">🌈 عداد ألوان</label>'+
    '<input id="sale-color-counter" type="number" style="width:100%;padding:10px 13px;border:2px solid #e2e8f0;border-radius:11px;font-size:14px;font-family:inherit;background:#f8fafc;text-align:center;outline:none" value="'+esc(s&&s.colorCounter?s.colorCounter:savedColorCounter)+'" placeholder="0"></div>'+
    '</div>'+
    fld('sale-note','ملاحظة (اختياري)','text',s?s.note||'':savedNote,'')+
    fld('sale-paid','المبلغ المدفوع (ج)','number',s?s.paid:savedPaid)+
    (!s?'<div class="field"><label>📸 صورة (اختياري)</label><input type="file" id="sale-image" accept="image/*" style="width:100%;padding:8px;border:2px solid #e2e8f0;border-radius:11px;font-size:13px;font-family:inherit;background:#f8fafc"></div>':'')+
    dateField('sale-date','📅 التاريخ',s?s.date:null)+
    '<div class="modal-actions"><button class="btn btn-green btn-full" onclick="saveSale()">'+(s?'حفظ التعديل':'حفظ الفاتورة')+'</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  initAC('sale-customer','customers');
  if(savedCustomer&&!s)setTimeout(function(){if(document.getElementById('sale-customer'))document.getElementById('sale-customer').value=savedCustomer;},10);
  setTimeout(function(){
    var inp=document.getElementById('prod-search');
    if(inp){inp.addEventListener('blur',function(){setTimeout(function(){var r=document.getElementById('prod-results');if(r)r.style.display='none';},200);});}
  },50);
}

function addServiceLine(){
  document.getElementById('modal-title').textContent='إضافة بند صيانة / زيارة';
  // Save current modal state then push sub-modal inline
  var overlay=document.getElementById('modal-body');
  var existingBody=overlay.innerHTML;
  overlay.innerHTML=
    fld('srv-name','اسم الخدمة / البند','text','','مثال: زيارة صيانة، تنظيف، إعادة تعبئة',true)+
    fld('srv-price','السعر (ج)','number','','',true)+
    '<div class="modal-actions">'+
    '<button class="btn btn-orange btn-full" onclick="confirmAddService()">إضافة</button>'+
    '<button class="btn btn-outline btn-full" onclick="cancelAddService()">رجوع</button></div>';
  window._saleBodyBackup=existingBody;
}

function confirmAddService(){
  var name=v('srv-name'),price=+v('srv-price');
  if(!name)return showToast('⚠️ اسم الخدمة مطلوب','#dc2626');
  _saleServices.push({name:name,price:price||0});
  restoreSaleBodyAfterService();
  showToast('✅ تم إضافة البند','#16a34a');
}
function cancelAddService(){restoreSaleBodyAfterService();}
function restoreSaleBodyAfterService(){
  document.getElementById('modal-title').textContent=_saleId?'تعديل الفاتورة':'فاتورة بيع جديدة';
  var saved={customer:v('sale-customer')||'',paid:v('sale-paid')||'',note:v('sale-note')||'',counter:v('sale-counter')||'',colorCounter:v('sale-color-counter')||'',serial:v('sale-serial')||'',model:v('sale-model')||''};
  var s=_saleId?DB.sales.find(function(x){return x.id===_saleId;}):null;
  renderSaleBody(s);
  setTimeout(function(){
    if(saved.customer&&document.getElementById('sale-customer'))document.getElementById('sale-customer').value=saved.customer;
    if(saved.paid&&document.getElementById('sale-paid'))document.getElementById('sale-paid').value=saved.paid;
    if(saved.note&&document.getElementById('sale-note'))document.getElementById('sale-note').value=saved.note;
    if(document.getElementById('sale-counter'))document.getElementById('sale-counter').value=saved.counter;
    if(document.getElementById('sale-color-counter'))document.getElementById('sale-color-counter').value=saved.colorCounter;
    if(document.getElementById('sale-serial'))document.getElementById('sale-serial').value=saved.serial;
    if(document.getElementById('sale-model'))document.getElementById('sale-model').value=saved.model;
  },10);
}

function rmSaleService(idx){
  _saleServices.splice(idx,1);
  var sc=v('sale-customer'),sp=v('sale-paid'),sn=v('sale-note'),sk=v('sale-counter'),slc=v('sale-color-counter'),ss=v('sale-serial'),sm=v('sale-model');
  var s=_saleId?DB.sales.find(function(x){return x.id===_saleId;}):null;
  renderSaleBody(s);restoreSale(sc,sp,sn,sk,slc,ss,sm);
}

function filterProds(){
  var q=v('prod-search');
  var res=document.getElementById('prod-results');if(!res)return;
  var list=DB.products.filter(function(p){return!q||normalizeAr(p.name).includes(normalizeAr(q));}).slice(0,8);
  if(!list.length){res.style.display='none';return;}
  res.innerHTML=list.map(function(p){
    return '<div class="prod-result-item" onmousedown="addProdToSale('+p.id+')">'+
      '<div><div style="font-weight:700;font-size:14px">'+esc(p.name)+'</div>'+
      '<div style="font-size:12px;color:#94a3b8">متوفر: '+p.qty+' '+esc(p.unit)+' | '+p.sellPrice+' ج</div></div>'+
      '<div style="background:#2563eb;color:#fff;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700">+ إضافة</div>'+
      '</div>';
  }).join('');
  res.style.display='block';
}

function addProdToSale(pid){
  var p=DB.products.find(function(x){return x.id===pid;});if(!p)return;
  var ex=_saleItems.find(function(i){return i.productId===pid;});
  if(ex)ex.qty++;else _saleItems.push({productId:p.id,name:p.name,qty:1,price:p.sellPrice,buyPrice:p.buyPrice});
  var sc=v('sale-customer'),sp=v('sale-paid'),sn=v('sale-note'),sk=v('sale-counter'),slc=v('sale-color-counter'),ss=v('sale-serial'),sm=v('sale-model');
  var s=_saleId?DB.sales.find(function(x){return x.id===_saleId;}):null;
  renderSaleBody(s);restoreSale(sc,sp,sn,sk,slc,ss,sm);
  var inp=document.getElementById('prod-search');if(inp)inp.focus();
}

function chgQty(idx,delta){
  _saleItems[idx].qty=Math.max(1,_saleItems[idx].qty+delta);
  var sc=v('sale-customer'),sp=v('sale-paid'),sn=v('sale-note'),sk=v('sale-counter'),slc=v('sale-color-counter'),ss=v('sale-serial'),sm=v('sale-model');
  var s=_saleId?DB.sales.find(function(x){return x.id===_saleId;}):null;
  renderSaleBody(s);restoreSale(sc,sp,sn,sk,slc,ss,sm);
}

function rmSaleItem(idx){
  _saleItems.splice(idx,1);
  var sc=v('sale-customer'),sp=v('sale-paid'),sn=v('sale-note'),sk=v('sale-counter'),slc=v('sale-color-counter'),ss=v('sale-serial'),sm=v('sale-model');
  var s=_saleId?DB.sales.find(function(x){return x.id===_saleId;}):null;
  renderSaleBody(s);restoreSale(sc,sp,sn,sk,slc,ss,sm);
}

function restoreSale(customer,paid,note,counter,colorCounter,serial,model){
  if(document.getElementById('sale-customer')&&customer)document.getElementById('sale-customer').value=customer;
  if(document.getElementById('sale-paid')&&paid)document.getElementById('sale-paid').value=paid;
  if(document.getElementById('sale-note')&&note)document.getElementById('sale-note').value=note;
  if(document.getElementById('sale-counter'))document.getElementById('sale-counter').value=counter||'';
  if(document.getElementById('sale-color-counter'))document.getElementById('sale-color-counter').value=colorCounter||'';
  if(document.getElementById('sale-serial'))document.getElementById('sale-serial').value=serial||'';
  if(document.getElementById('sale-model'))document.getElementById('sale-model').value=model||'';
}

function saveSale(){
  var customer=v('sale-customer');
  if(!customer)return showToast('⚠️ اسم العميل مطلوب','#dc2626');
  var total=_saleItems.reduce(function(s,i){return s+i.qty*i.price;},0)+
            _saleServices.reduce(function(s,sv){return s+sv.price;},0);
  var paid=+v('sale-paid')||0;
  if(!_saleItems.length&&!_saleServices.length&&!paid)return showToast('⚠️ أضف منتجات أو خدمة أو أدخل مبلغ','#dc2626');
  if(!_saleItems.length&&!_saleServices.length&&paid)total=paid;
  var status=paid>=total?'مدفوع':paid>0?'جزئي':'غير مدفوع';
  var serial=v('sale-serial')||'';
  var model=v('sale-model')||'';

  function doSave(img){
    if(_saleId){
      DB.sales=DB.sales.map(function(s){
        return s.id===_saleId?Object.assign({},s,{customer:customer,date:v('sale-date'),items:_saleItems.slice(),services:_saleServices.slice(),total:total,paid:paid,status:status,counter:v('sale-counter'),colorCounter:v('sale-color-counter'),note:v('sale-note'),serial:serial,model:model,image:img||s.image}):s;
      });
    }else{
      // Stock validation
      var stockErrors=[];
      _saleItems.forEach(function(item){
        var prod=DB.products.find(function(p){return p.id===item.productId;});
        if(!prod)stockErrors.push(esc(item.name)+': تم حذفه من المخزون');
        else if(prod.qty<item.qty)stockErrors.push(esc(item.name)+': متوفر فقط '+prod.qty+' '+esc(prod.unit));
      });
      if(stockErrors.length)return showToast('⚠️ '+stockErrors[0],'#dc2626');

      DB.sales.push({id:genId(),customer:customer,date:v('sale-date'),items:_saleItems.slice(),services:_saleServices.slice(),total:total,paid:paid,status:status,counter:v('sale-counter'),colorCounter:v('sale-color-counter'),note:v('sale-note'),serial:serial,model:model,image:img||''});
      _saleItems.forEach(function(item){
        DB.products=DB.products.map(function(p){return p.id===item.productId?Object.assign({},p,{qty:Math.max(0,p.qty-item.qty)}):p;});
      });
      if(paid<total)DB.debts.push({id:genId(),type:'customer',name:customer,desc:'فاتورة'+(serial?' — '+serial:''),total:total-paid,paid:0,date:v('sale-date'),payments:[]});
    }
    if(serial)addArchive('serials',serial);
    if(model)addArchive('models',model);
    addArchive('customers',customer);
    persist();closeModal();renderSales();renderHome();
    showToast(_saleId?'✅ تم تعديل الفاتورة':'✅ تم حفظ الفاتورة','#16a34a');
  }
  var imgInput=document.getElementById('sale-image');
  if(imgInput&&imgInput.files&&imgInput.files[0]){
    var fileSizeKB=imgInput.files[0].size/1024;
    if(fileSizeKB>300)showToast('⚠️ الصورة كبيرة ('+Math.round(fileSizeKB)+'KB). مقترح: أقل من 300KB','#ea580c');
    var r=new FileReader();r.onload=function(e){doSave(e.target.result);};r.readAsDataURL(imgInput.files[0]);
  } else doSave('');
}

function showImageModal(id){
  var s=DB.sales.find(function(x){return x.id===+id;});if(!s||!s.image)return;
  document.getElementById('modal-title').textContent='صورة — '+esc(s.customer);
  document.getElementById('modal-body').innerHTML='<img src="'+s.image+'" style="width:100%;border-radius:12px">';
  openModal();
}

// ===== CUSTOMER LEDGER =====
var _currentLedgerCustomer='';

function openLedger(customerName){
  _currentLedgerCustomer=customerName;
  navigate('ledger');
}

function renderLedger(customerName){
  var el=document.getElementById('screen-ledger');if(!el)return;
  if(!customerName){el.innerHTML='<div class="empty">لم يتم تحديد عميل</div>';return;}
  document.getElementById('header-title').textContent='👤 '+esc(customerName);

  var sales=DB.sales.filter(function(s){return normalizeAr(s.customer)===normalizeAr(customerName);}).sort(function(a,b){return b.id-a.id;});
  var debts=DB.debts.filter(function(d){return d.type==='customer'&&normalizeAr(d.name)===normalizeAr(customerName);});

  var totalSales=sales.reduce(function(s,x){return s+x.total;},0);
  var totalPaid=sales.reduce(function(s,x){return s+(x.paid||0);},0);
  var totalDebt=debts.reduce(function(s,d){return s+(d.total-(d.paid||0));},0);

  var content='<div style="padding:14px 12px 88px">';
  // Summary
  content+='<div class="card" style="background:linear-gradient(135deg,#0f172a,#1e3a5f);color:#fff;margin-bottom:12px">'+
    '<div style="font-size:16px;font-weight:900;margin-bottom:10px">👤 '+esc(customerName)+'</div>'+
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="opacity:.7">إجمالي المبيعات</span><b>'+fmt(totalSales)+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;margin-bottom:6px"><span style="opacity:.7">إجمالي المدفوع</span><b style="color:#86ef
