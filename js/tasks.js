// ===== TASKS =====
function renderTasks(){
  var list=[].concat(DB.tasks).sort(function(a,b){
    var order={'عاجل':0,'متوسط':1,'عادي':2};
    if(a.status==='done'&&b.status!=='done')return 1;
    if(b.status==='done'&&a.status!=='done')return -1;
    return (order[a.priority]||2)-(order[b.priority]||2);
  });
  var el=document.getElementById('tasks-list');if(!el)return;
  if(!list.length){el.innerHTML='<div class="empty">لا توجد مهمات</div>';return;}
  var pc=function(p){return p==='عاجل'?'#dc2626':p==='متوسط'?'#ca8a04':'#16a34a';};
  el.innerHTML=list.map(function(t){
    var isDone=t.status==='done';
    return '<div class="task-card" style="border-right:4px solid '+(isDone?'#94a3b8':pc(t.priority))+'">'+
      '<div style="display:flex;justify-content:space-between;align-items:flex-start">'+
      '<div style="flex:1">'+
      '<div style="font-weight:800;font-size:15px;color:'+(isDone?'#94a3b8':'#0f172a')+';text-decoration:'+(isDone?'line-through':'none')+'">'+esc(t.title)+'</div>'+
      (t.desc?'<div class="item-sub">'+esc(t.desc)+'</div>':'')+
      (t.dueDate?'<div class="item-sub" style="color:#ea580c">📅 '+esc(fmtDate(t.dueDate))+'</div>':'')+
      '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap">'+
      '<span class="badge" style="background:'+pc(t.priority)+'22;color:'+pc(t.priority)+'">'+esc(t.priority)+'</span>'+
      (isDone?'<span class="badge" style="background:#dcfce7;color:#16a34a">✅ منجزة</span>':'')+
      '</div></div>'+
      '<div style="display:flex;gap:5px">'+
      (!isDone?'<button class="btn-ic" style="background:#dcfce7" onclick="openMarkDoneModal('+t.id+')">✅</button>':'')+
      '<button class="btn-ic" style="background:#dbeafe" onclick="openTaskModal('+t.id+')">✏️</button>'+
      '<button class="btn-ic" style="background:#fee2e2" onclick="confirmAction(\'هتحذف المهمة دي؟\',function(){delItem(\'tasks\','+t.id+',renderTasks)})">🗑️</button>'+
      '</div></div></div>';
  }).join('');
}

var _taskId=null;
function openTaskModal(id){
  _taskId=id||null;
  var t=id?DB.tasks.find(function(x){return x.id===id;}):null;
  document.getElementById('modal-title').textContent=t?'تعديل المهمة':'مهمة جديدة';
  document.getElementById('modal-body').innerHTML=
    fld('task-title','عنوان المهمة','text',t?t.title:'','',true)+
    fld('task-desc','تفاصيل (اختياري)','text',t?t.desc||'':'')+
    '<div class="field"><label>الأولوية</label><select id="task-priority" style="width:100%;padding:10px 13px;border:2px solid #e2e8f0;border-radius:11px;font-size:14px;font-family:inherit">'+
    ['عاجل','متوسط','عادي'].map(function(p){return '<option value="'+p+'"'+(t&&t.priority===p?' selected':'')+'>'+p+'</option>';}).join('')+
    '</select></div>'+
    dateField('task-due','📅 تاريخ الاستحقاق',t?t.dueDate:null)+
    '<div class="modal-actions"><button class="btn btn-primary btn-full" onclick="saveTask()">'+(t?'حفظ':'إضافة')+'</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  openModal();
}

function saveTask(){
  var title=v('task-title');
  if(!title)return showToast('⚠️ عنوان المهمة مطلوب','#dc2626');
  var obj={title:title,desc:v('task-desc'),priority:v('task-priority'),dueDate:v('task-due'),status:'pending'};
  if(_taskId){
    DB.tasks=DB.tasks.map(function(t){return t.id===_taskId?Object.assign({},t,obj):t;});
  }else{
    DB.tasks.push(Object.assign({id:genId()},obj));
  }
  persist();closeModal();renderTasks();renderHome();
  showToast(_taskId?'✅ تم التعديل':'✅ تم إضافة المهمة','#16a34a');
}

function openMarkDoneModal(id){
  var t=DB.tasks.find(function(x){return x.id===id;});if(!t)return;
  document.getElementById('modal-title').textContent='✅ إنجاز المهمة';
  document.getElementById('modal-body').innerHTML=
    '<div style="text-align:center;padding:16px 0">'+
    '<div style="font-size:40px;margin-bottom:12px">✅</div>'+
    '<div style="font-weight:800;font-size:16px;color:#0f172a;margin-bottom:8px">'+esc(t.title)+'</div>'+
    '<div style="color:#64748b;font-size:13px;margin-bottom:18px">هتسجّل المهمة دي كمنجزة؟</div></div>'+
    '<div class="modal-actions"><button class="btn btn-green btn-full" onclick="markDone('+id+')">✅ نعم، تم الإنجاز</button><button class="btn btn-outline btn-full" onclick="closeModal()">إلغاء</button></div>';
  openModal();
}

function markDone(id){
  DB.tasks=DB.tasks.map(function(t){return t.id===id?Object.assign({},t,{status:'done',doneAt:new Date().toISOString()}):t;});
  persist();closeModal();renderTasks();renderHome();
  showToast('🎉 أحسنت! تم الإنجاز','#16a34a');
}
