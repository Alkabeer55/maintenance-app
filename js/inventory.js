// ===== INVENTORY =====
function renderInventory(){
  var q=document.getElementById('inv-search')?document.getElementById('inv-search').value:'';
  var list=DB.products.filter(function(p){return !q||normalizeAr(p.name).includes(normalizeAr(q));});
  var el=document.getElementById('inventory-list');
  if(!list.length){el.innerHTML='<div class="empty">لا توجد منتجات</div>';return;}
  el.innerHTML=list.map(function(p){
    return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:flex-start"><div style="flex:1">'+
    '<div class="item-name">'+esc(p.name)+'</div>'+
    '<div class="item-sub">الكمية: <b style="color:'+(p.qty<=p.minQty?'#dc2626':'#16a34a')+'">'+p.qty+' '+esc(p.unit)+'</b>'+(p.qty<=p.minQty?' ⚠️':'')+'</div>'+
    '<div class="item-sub">شراء: <b>'+p.buyPrice+' ج</b> | بيع: <b>'+p.sellPrice+' ج</b></div>'+
    '</div><div style="display:flex;gap:6px">'+
    '<button class="btn-ic" style="background:#dbeafe" onclick="openProductModal('+p.id+')">✏️</button>'+
    '<button class="btn-ic" style="background:#fee2e2" onclick="confirmAction(\'هتحذف المنتج ده؟\',function(){delItem(\'products\','+p.id+',renderInventory)})">🗑️</button>'+
    '</div></div></div>';
  }).join('');
}

var _prodId=null;
function openProductModal(id){
  _prodId=id||null;
  var p=id?DB.products.find(function(x){return x.id===id;}):null;
  document.getElementById('modal-title').textContent=p?'تعديل المنتج':'إضافة منتج جديد';
  document.getElementById('modal-body').innerHTML=
    acField('prod-name','اسم المنتج','text',p?p.name:'','مثال: حبر Canon','products',true)+
    fld('prod-unit','الوحدة','text',p?p.unit:'قطعة','قطعة / علبة / رزمة')+
    fld('prod-qty','الكمية','number',p?p.qty:'','',true)+
    fld('prod-minqty','الحد الأدنى للتنبيه','number',p?p.minQty:0)+
    fld('prod-buy','سعر الشراء (ج)','number',p?p.buyPrice:'')+
    fld('prod-sell','سعر البيع (ج)','number',p?p.sellPrice:'')+
    '<div class="modal-actions"><button class="btn btn-green btn-full" onclick="saveProduct()">'+(p?'حفظ التعديل':'إضافة')+'</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  initAC('prod-name','products');
  openModal();
}

function saveProduct(){
  var name=v('prod-name'),qty=+v('prod-qty');
  if(!name)return showToast('⚠️ اسم المنتج مطلوب','#dc2626');
  if(isNaN(qty)||qty<0)return showToast('⚠️ الكمية غير صحيحة','#dc2626');
  var obj={name:name,unit:v('prod-unit')||'قطعة',qty:qty,minQty:+v('prod-minqty')||0,buyPrice:+v('prod-buy')||0,sellPrice:+v('prod-sell')||0};
  if(_prodId){
    DB.products=DB.products.map(function(p){return p.id===_prodId?Object.assign({},p,obj):p;});
  } else {
    DB.products.push(Object.assign({id:genId()},obj));
  }
  addArchive('products',name);
  persist();closeModal();renderInventory();renderHome();
  showToast(_prodId?'✅ تم تعديل المنتج':'✅ تم إضافة المنتج','#16a34a');
}
