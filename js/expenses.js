// ===== QUICK EXPENSE =====
function openExpenseModal(){
  document.getElementById('modal-title').textContent='💸 تسجيل مصروف سريع';
  document.getElementById('modal-body').innerHTML=
    acField('exp-desc','البيان','text','','مثال: إيجار، كهرباء، بنزين','expDescs',true)+
    fld('exp-amount','المبلغ (ج)','number','','',true)+
    '<div class="field"><label>النوع</label><select id="exp-type" style="width:100%;padding:10px 13px;border:2px solid #e2e8f0;border-radius:11px;font-size:14px;font-family:inherit">'+
    ['تشغيل','إيجار','رواتب','مواصلات','أخرى'].map(function(t){return '<option>'+t+'</option>';}).join('')+
    '</select></div>'+
    dateField('exp-date','📅 التاريخ',null)+
    '<div class="modal-actions"><button class="btn btn-orange btn-full" onclick="saveExpense()">تسجيل</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  initAC('exp-desc','expDescs');
  openModal();
}

function saveExpense(){
  var desc=v('exp-desc'),amount=+v('exp-amount');
  if(!desc)return showToast('⚠️ البيان مطلوب','#dc2626');
  if(!amount||amount<=0)return showToast('⚠️ المبلغ غير صحيح','#dc2626');
  DB.expenses.push({id:genId(),desc:desc,amount:amount,type:v('exp-type'),date:v('exp-date')});
  addArchive('expDescs',desc);
  persist();closeModal();renderHome();
  showToast('✅ تم تسجيل المصروف','#16a34a');
}
