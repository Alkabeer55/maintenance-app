// ===== DEBTS =====
function renderDebts(){
  var tab=currentDebtTab;
  var list=DB.debts.filter(function(d){return tab==='all'?true:d.type===(tab==='customer'?'customer':'supplier');});
  list.sort(function(a,b){return b.id-a.id;});
  var el=document.getElementById('debts-list');if(!el)return;

  // Summary banner
  var custOwed=DB.debts.filter(function(d){return d.type==='customer';}).reduce(function(s,d){return s+(d.total-(d.paid||0));},0);
  var suppOwed=DB.debts.filter(function(d){return d.type==='supplier';}).reduce(function(s,d){return s+(d.total-(d.paid||0));},0);
  var summaryHtml='<div style="display:flex;gap:8px;margin-bottom:12px">'+
    '<div style="flex:1;background:#fee2e2;border-radius:14px;padding:12px;text-align:center">'+
    '<div style="font-size:11px;color:#dc2626;font-weight:700;margin-bottom:4px">💸 لي عليهم (العملاء)</div>'+
    '<div style="font-size:17px;font-weight:900;color:#dc2626">'+fmt(custOwed)+'</div></div>'+
    '<div style="flex:1;background:#ede9fe;border-radius:14px;padding:12px;text-align:center">'+
    '<div style="font-size:11px;color:#7c3aed;font-weight:700;margin-bottom:4px">💜 علي (للموردين)</div>'+
    '<div style="font-size:17px;font-weight:900;color:#7c3aed">'+fmt(suppOwed)+'</div></div></div>';

  if(!list.length){el.innerHTML=summaryHtml+'<div class="empty">لا توجد ديون</div>';return;}

  el.innerHTML=summaryHtml+list.map(function(d){
    var rem=d.total-(d.paid||0);
    var isPaid=rem<=0;
    var isSupplier=d.type==='supplier';
    var labelColor=isSupplier?'#7c3aed':'#dc2626';
    var dirLabel=isSupplier?'علي أنا 💜':'لي عليه 💸';
    return '<div class="debt-card'+(isSupplier?' supplier':'')+(isPaid?' paid':'')+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:9px">'+
      '<div style="flex:1">'+
      '<div style="font-weight:800;font-size:15px">'+esc(d.name)+'</div>'+
      '<div style="font-size:11px;color:#94a3b8;margin-top:2px">'+esc(fmtDate(d.date))+(d.desc?' — '+esc(d.desc):'')+'</div>'+
      '<span class="badge" style="background:'+labelColor+'22;color:'+labelColor+';margin-top:5px;display:inline-block">'+dirLabel+'</span></div>'+
      '<div style="text-align:left">'+
      '<div style="font-size:13px;color:#64748b">الإجمالي: <b>'+fmt(d.total)+'</b></div>'+
      '<div style="font-size:13px;color:#16a34a">مدفوع: <b>'+fmt(d.paid||0)+'</b></div>'+
      '<div style="font-size:15px;font-weight:900;color:'+(isPaid?'#16a34a':labelColor)+'">'+
      (isPaid?'✅ مسدّد بالكامل':'متبقي: '+fmt(rem))+'</div></div></div>'+
      (d.payments&&d.payments.length?
        '<div style="background:#f8fafc;border-radius:9px;padding:8px 10px;margin-bottom:9px">'+
        '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:5px">سجل الدفعات:</div>'+
        d.payments.map(function(pay){return '<div class="payment-row"><span>'+esc(fmtDate(pay.date))+'</span><b style="color:#16a34a">'+fmt(pay.amount)+'</b></div>';}).join('')+
        '</div>':'')+
      '<div style="display:flex;gap:7px">'+
      (!isPaid?'<button class="btn btn-green btn-full btn-sm" onclick="openPayDebtModal('+d.id+')">💰 سداد</button>':'')+
      '<button class="btn btn-outline btn-sm" onclick="openEditDebtModal('+d.id+')">✏️</button>'+
      '<button class="btn btn-outline btn-sm" style="color:#dc2626;border-color:#dc2626" onclick="confirmAction(\'هتحذف الدين ده؟\',function(){delItem(\'debts\','+d.id+',renderDebts)})">🗑️</button>'+
      '</div></div>';
  }).join('');
}

function openDebtModal(type){
  document.getElementById('modal-title').textContent=type==='customer'?'💸 دين على عميل':'💜 دين لمورد';
  document.getElementById('modal-body').innerHTML=
    acField('debt-name',type==='customer'?'اسم العميل':'اسم المورد','text','','','customers')+
    fld('debt-desc','البيان','text','','مثال: فاتورة صيانة')+
    fld('debt-total','المبلغ الكلي (ج)','number','','',true)+
    fld('debt-paid','المدفوع الآن (ج)','number','0')+
    dateField('debt-date','📅 التاريخ',null)+
    '<div class="modal-actions"><button class="btn btn-red btn-full" onclick="saveDebt(\''+type+'\')">إضافة</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  initAC('debt-name',type==='customer'?'customers':'suppliers');
  openModal();
}

function saveDebt(type){
  var name=v('debt-name'),total=+v('debt-total');
  if(!name)return showToast('⚠️ الاسم مطلوب','#dc2626');
  if(!total||total<=0)return showToast('⚠️ المبلغ غير صحيح','#dc2626');
  var paid=+v('debt-paid')||0;
  DB.debts.push({id:genId(),type:type,name:name,desc:v('debt-desc'),total:total,paid:paid,date:v('debt-date'),payments:paid>0?[{amount:paid,date:v('debt-date')}]:[]});
  addArchive(type==='customer'?'customers':'suppliers',name);
  persist();closeModal();renderDebts();
  showToast('✅ تم إضافة الدين','#16a34a');
}

function openEditDebtModal(id){
  var d=DB.debts.find(function(x){return x.id===id;});if(!d)return;
  document.getElementById('modal-title').textContent='✏️ تعديل الدين';
  document.getElementById('modal-body').innerHTML=
    fld('debt-name-e','الاسم','text',d.name)+
    fld('debt-desc-e','البيان','text',d.desc||'')+
    fld('debt-total-e','المبلغ الكلي (ج)','number',d.total)+
    '<div class="modal-actions"><button class="btn btn-green btn-full" onclick="saveEditDebt('+d.id+')">حفظ</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  openModal();
}

function saveEditDebt(id){
  DB.debts=DB.debts.map(function(d){
    return d.id===id?Object.assign({},d,{name:v('debt-name-e'),desc:v('debt-desc-e'),total:+v('debt-total-e')||d.total}):d;
  });
  persist();closeModal();renderDebts();showToast('✅ تم التعديل','#16a34a');
}

function openPayDebtModal(id){
  var d=DB.debts.find(function(x){return x.id===id;});if(!d)return;
  var rem=d.total-(d.paid||0);
  document.getElementById('modal-title').textContent='💰 سداد — '+esc(d.name);
  document.getElementById('modal-body').innerHTML=
    '<div style="background:#f8fafc;border-radius:11px;padding:12px;margin-bottom:14px">'+
    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>الإجمالي</span><b>'+fmt(d.total)+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px"><span>مدفوع</span><b style="color:#16a34a">'+fmt(d.paid||0)+'</b></div>'+
    '<div style="display:flex;justify-content:space-between;font-size:15px;font-weight:900"><span>المتبقي</span><b style="color:#dc2626">'+fmt(rem)+'</b></div></div>'+
    fld('pay-amount','مبلغ السداد (ج)','number',rem)+
    dateField('pay-date','📅 التاريخ',null)+
    '<div class="modal-actions"><button class="btn btn-green btn-full" onclick="payDebt('+id+')">تسجيل السداد</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  openModal();
}

function payDebt(id){
  var amount=+v('pay-amount');
  if(!amount||amount<=0)return showToast('⚠️ المبلغ غير صحيح','#dc2626');
  DB.debts=DB.debts.map(function(d){
    if(d.id!==id)return d;
    var newPaid=Math.min((d.paid||0)+amount,d.total);
    var payments=(d.payments||[]).concat([{amount:amount,date:v('pay-date')}]);
    return Object.assign({},d,{paid:newPaid,payments:payments});
  });
  persist();closeModal();renderDebts();renderHome();
  showToast('✅ تم تسجيل السداد','#16a34a');
}
