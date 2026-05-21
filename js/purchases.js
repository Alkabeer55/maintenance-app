// ===== PURCHASES =====
function renderPurchases(){
  var q=document.getElementById('purch-search')?normalizeAr(document.getElementById('purch-search').value):'';
  var list=[].concat(DB.purchases).sort(function(a,b){return b.id-a.id;});
  if(q)list=list.filter(function(p){return normalizeAr(p.supplier).includes(q)||p.items.some(function(i){return normalizeAr(i.name).includes(q);});});
  var el=document.getElementById('purchases-list');
  if(!list.length){el.innerHTML='<div class="empty">لا توجد مشتريات</div>';return;}
  el.innerHTML=list.map(function(p){
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="flex:1">'+
    '<div class="item-name">'+esc(p.supplier)+'</div>'+
    '<div class="item-sub" style="color:#94a3b8;font-size:11px">'+esc(fmtDate(p.date))+'</div>'+
    '<div class="item-sub">'+p.items.map(function(i){return esc(i.name)+' × '+i.qty;}).join(' | ')+'</div></div>'+
    '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">'+
    '<div style="font-weight:900;font-size:16px;color:#7c3aed">'+fmt(p.total)+'</div>'+
    '<div style="display:flex;gap:5px">'+
    '<button class="btn-ic" style="background:#ede9fe" onclick="openPurchaseModal('+p.id+')">✏️</button>'+
    '<button class="btn-ic" style="background:#fee2e2" onclick="confirmAction(\'هتحذف المشترى ده؟\',function(){delItem(\'purchases\','+p.id+',renderPurchases)})">🗑️</button>'+
    '</div></div></div></div>';
  }).join('');
}

var _purchId=null, _purchItems=[];

function openPurchaseModal(id){
  _purchId=id||null;
  var p=id?DB.purchases.find(function(x){return x.id===id;}):null;
  _purchItems=p?p.items.slice():[];
  document.getElementById('modal-title').textContent=p?'تعديل المشترى':'مشترى جديد';
  renderPurchBody(p);openModal();
}

function renderPurchBody(p){
  var savedSupplier=document.getElementById('purch-supplier')?v('purch-supplier'):'';
  var savedPaid=document.getElementById('purch-paid')?v('purch-paid'):'';
  var total=_purchItems.reduce(function(s,i){return s+i.qty*i.price;},0);
  var itemsHtml='';
  if(_purchItems.length){
    itemsHtml='<div class="items-list">'+
      _purchItems.map(function(it,i){
        return '<div class="items-list-row">'+
          '<span style="flex:1;font-size:13px">'+esc(it.name)+'</span>'+
          '<div style="display:flex;align-items:center;gap:5px">'+
          '<button onclick="chgPurchQty('+i+',-1)" style="background:#fee2e2;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:14px;font-weight:900;color:#dc2626">−</button>'+
          '<span style="font-weight:900;font-size:14px;min-width:22px;text-align:center">'+it.qty+'</span>'+
          '<button onclick="chgPurchQty('+i+',1)" style="background:#dcfce7;border:none;border-radius:6px;width:26px;height:26px;cursor:pointer;font-size:14px;font-weight:900;color:#16a34a">+</button>'+
          '<input type="number" id="pi-price-'+i+'" value="'+it.price+'" style="width:65px;padding:4px 6px;border:2px solid #e2e8f0;border-radius:7px;font-size:13px;font-family:inherit;text-align:center" oninput="updPurchPrice('+i+',this.value)">'+
          '<button onclick="rmPurchItem('+i+')" style="background:#fee2e2;border:none;border-radius:6px;padding:2px 6px;cursor:pointer;font-size:11px;color:#dc2626">✕</button>'+
          '</div></div>';
      }).join('')+
      '<div class="total-row"><span>الإجمالي</span><span style="color:#7c3aed">'+fmt(total)+'</span></div></div>';
  }
  document.getElementById('modal-body').innerHTML=
    acField('purch-supplier','المورد','text',p?p.supplier:savedSupplier,'','suppliers',true)+
    '<div class="field"><label>إضافة منتج</label>'+
    '<input id="purch-prod-search" type="text" placeholder="اكتب اسم المنتج..." autocomplete="off" style="width:100%;padding:10px 13px;border:2px solid #3b82f6;border-radius:11px;font-size:14px;font-family:inherit;direction:rtl;background:#f8fafc;outline:none;margin-bottom:6px" oninput="filterPurchProds()">'+
    '<div id="purch-prod-results" style="display:none" class="prod-search-results"></div></div>'+
    itemsHtml+
    fld('purch-paid','المبلغ المدفوع (ج)','number',p?p.paid:savedPaid)+
    dateField('purch-date','📅 التاريخ',p?p.date:null)+
    '<div class="modal-actions"><button class="btn btn-purple btn-full" onclick="savePurchase()">'+(p?'حفظ التعديل':'حفظ المشترى')+'</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  initAC('purch-supplier','suppliers');
}

function filterPurchProds(){
  var q=v('purch-prod-search');
  var res=document.getElementById('purch-prod-results');if(!res)return;
  var list=DB.products.filter(function(p){return!q||normalizeAr(p.name).includes(normalizeAr(q));}).slice(0,8);
  if(!list.length){res.style.display='none';return;}
  res.innerHTML=list.map(function(p){
    return '<div class="prod-result-item" onmousedown="addProdToPurch('+p.id+')">'+
      '<div><div style="font-weight:700;font-size:14px">'+esc(p.name)+'</div>'+
      '<div style="font-size:12px;color:#94a3b8">شراء: '+p.buyPrice+' ج</div></div>'+
      '<div style="background:#7c3aed;color:#fff;border-radius:8px;padding:4px 10px;font-size:12px;font-weight:700">+ إضافة</div></div>';
  }).join('');
  res.style.display='block';
}

function addProdToPurch(pid){
  var p=DB.products.find(function(x){return x.id===pid;});if(!p)return;
  var ex=_purchItems.find(function(i){return i.productId===pid;});
  if(ex)ex.qty++;else _purchItems.push({productId:p.id,name:p.name,qty:1,price:p.buyPrice});
  var ss=v('purch-supplier'),sp=v('purch-paid');
  var pur=_purchId?DB.purchases.find(function(x){return x.id===_purchId;}):null;
  renderPurchBody(pur);
  if(ss&&document.getElementById('purch-supplier'))document.getElementById('purch-supplier').value=ss;
  if(sp&&document.getElementById('purch-paid'))document.getElementById('purch-paid').value=sp;
}

function chgPurchQty(idx,delta){
  _purchItems[idx].qty=Math.max(1,_purchItems[idx].qty+delta);
  var ss=v('purch-supplier'),sp=v('purch-paid');
  var pur=_purchId?DB.purchases.find(function(x){return x.id===_purchId;}):null;
  renderPurchBody(pur);
  if(ss&&document.getElementById('purch-supplier'))document.getElementById('purch-supplier').value=ss;
  if(sp&&document.getElementById('purch-paid'))document.getElementById('purch-paid').value=sp;
}

function rmPurchItem(idx){
  _purchItems.splice(idx,1);
  var ss=v('purch-supplier'),sp=v('purch-paid');
  var pur=_purchId?DB.purchases.find(function(x){return x.id===_purchId;}):null;
  renderPurchBody(pur);
  if(ss&&document.getElementById('purch-supplier'))document.getElementById('purch-supplier').value=ss;
  if(sp&&document.getElementById('purch-paid'))document.getElementById('purch-paid').value=sp;
}

function updPurchPrice(idx,val){_purchItems[idx].price=+val||0;}

function savePurchase(){
  var supplier=v('purch-supplier');
  if(!supplier)return showToast('⚠️ اسم المورد مطلوب','#dc2626');
  if(!_purchItems.length)return showToast('⚠️ أضف منتجاً واحداً على الأقل','#dc2626');
  var total=_purchItems.reduce(function(s,i){return s+i.qty*i.price;},0);
  var paid=+v('purch-paid')||0;
  if(_purchId){
    DB.purchases=DB.purchases.map(function(p){
      return p.id===_purchId?Object.assign({},p,{supplier:supplier,date:v('purch-date'),items:_purchItems.slice(),total:total,paid:paid}):p;
    });
  }else{
    DB.purchases.push({id:genId(),supplier:supplier,date:v('purch-date'),items:_purchItems.slice(),total:total,paid:paid});
    _purchItems.forEach(function(item){
      DB.products=DB.products.map(function(p){return p.id===item.productId?Object.assign({},p,{qty:p.qty+item.qty,buyPrice:item.price}):p;});
    });
    if(paid<total)DB.debts.push({id:genId(),type:'supplier',name:supplier,desc:'مشترى',total:total-paid,paid:0,date:v('purch-date'),payments:[]});
  }
  addArchive('suppliers',supplier);
  persist();closeModal();renderPurchases();renderHome();
  showToast(_purchId?'✅ تم التعديل':'✅ تم حفظ المشترى','#16a34a');
}
