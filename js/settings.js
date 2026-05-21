// ===== SETTINGS =====
function renderSettings(){
  var el=document.getElementById('settings-body');if(!el)return;
  var lastBackup=LS.get('mc8_last_backup','');
  var backupInterval=LS.get('mc8_backup_interval',60);
  el.innerHTML=
    // Hijri toggle
    '<div class="card"><div class="card-header"><span class="card-title">⚙️ إعدادات عامة</span></div>'+
    '<div class="perm-row"><span class="perm-label">📅 التاريخ الهجري كافتراضي</span>'+
    '<label class="toggle"><input type="checkbox" id="hijri-toggle" '+((_hijri)?'checked':'')+' onchange="toggleHijri()"><span class="slider"></span></label></div>'+
    '</div>'+

    // Backup section
    '<div class="card"><div class="card-header"><span class="card-title">💾 النسخ الاحتياطي</span></div>'+
    '<div style="margin-bottom:12px">'+
    '<div style="font-size:12px;color:#64748b;margin-bottom:8px">النسخة الاحتياطية التلقائية كل:</div>'+
    '<div style="display:flex;gap:6px;flex-wrap:wrap">'+
    [['لا يوجد',0],['30 دقيقة',30],['ساعة',60],['3 ساعات',180],['يومياً',1440]].map(function(opt){
      return '<button onclick="setBackupInterval('+opt[1]+');renderSettings()" style="padding:8px 12px;border:2px solid '+(backupInterval===opt[1]?'#2563eb':'#e2e8f0')+';border-radius:9px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;background:'+(backupInterval===opt[1]?'#dbeafe':'#fff')+';color:'+(backupInterval===opt[1]?'#1e40af':'#64748b')+'">'+opt[0]+'</button>';
    }).join('')+
    '</div>'+
    (lastBackup?'<div style="font-size:11px;color:#94a3b8;margin-top:8px">آخر نسخة: '+lastBackup.replace('T',' ').slice(0,16)+'</div>':'')+
    '</div>'+
    '<button class="settings-btn success" onclick="exportBackup()">📤 تصدير نسخة احتياطية الآن</button>'+
    '<button class="settings-btn" onclick="document.getElementById(\'import-file\').click()">📥 استيراد نسخة احتياطية</button>'+
    '<input type="file" id="import-file" accept=".json" style="display:none" onchange="importBackup(this)">'+
    '</div>'+

    // Data management
    '<div class="card"><div class="card-header"><span class="card-title">🗂️ إدارة البيانات</span></div>'+
    '<button class="settings-btn" onclick="exportCSV()">📊 تصدير CSV للإكسيل</button>'+
    '<button class="settings-btn danger" onclick="confirmAction(\'هتمسح كل البيانات؟ مش هترجع!\',clearAllData)">🗑️ مسح كل البيانات</button>'+
    '</div>'+

    // Storage usage
    '<div class="card"><div class="card-header"><span class="card-title">📊 استخدام التخزين</span></div>'+
    storageUsageHtml()+
    '</div>'+

    // App info
    '<div style="text-align:center;padding:18px 0;color:#94a3b8;font-size:11px">مركز الصيانة v8.0 — بيانات محلية 💾</div>';
}

function storageUsageHtml(){
  var used=0;
  try{for(var key in localStorage){if(localStorage.hasOwnProperty(key))used+=localStorage[key].length*2;}}catch(e){}
  var usedKB=Math.round(used/1024);
  var pct=Math.min(100,Math.round(usedKB/5120*100));
  var color=pct>80?'#dc2626':pct>60?'#ea580c':'#16a34a';
  return '<div style="margin-bottom:6px;display:flex;justify-content:space-between;font-size:13px">'+
    '<span>مستخدم</span><b style="color:'+color+'">'+usedKB+' KB / 5120 KB</b></div>'+
    '<div style="height:10px;background:#e2e8f0;border-radius:5px;overflow:hidden">'+
    '<div style="height:100%;width:'+pct+'%;background:'+color+';border-radius:5px;transition:.3s"></div></div>'+
    '<div style="font-size:11px;color:#94a3b8;margin-top:4px">'+pct+'% مستخدم</div>'+
    '<div style="margin-top:8px;font-size:12px;color:#64748b">'+
    'فواتير: '+DB.sales.length+' | منتجات: '+DB.products.length+' | ديون: '+DB.debts.length+' | مصروفات: '+DB.expenses.length+'</div>';
}

function exportBackup(){
  try{
    var data=Object.assign({},DB,{exportedAt:new Date().toISOString(),version:'8.0'});
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;
    a.download='mc-backup-'+today()+'.json';
    a.click();URL.revokeObjectURL(url);
    LS.set('mc8_last_backup',new Date().toISOString());
    showToast('✅ تم تصدير النسخة الاحتياطية','#16a34a');
    renderSettings();
  }catch(e){showToast('❌ فشل التصدير','#dc2626');}
}

function importBackup(input){
  var file=input.files[0];if(!file)return;
  var r=new FileReader();
  r.onload=function(e){
    try{
      var data=JSON.parse(e.target.result);
      if(!data.sales&&!data.products)return showToast('❌ ملف غير صحيح','#dc2626');
      confirmAction('هتستبدل كل البيانات الحالية بالنسخة دي؟',function(){
        if(data.products)DB.products=data.products;
        if(data.sales)DB.sales=data.sales;
        if(data.purchases)DB.purchases=data.purchases;
        if(data.expenses)DB.expenses=data.expenses;
        if(data.debts)DB.debts=data.debts;
        if(data.tasks)DB.tasks=data.tasks;
        if(data.empExp)DB.empExp=data.empExp;
        if(data.archive)DB.archive=data.archive;
        persist();renderHome();renderSettings();
        showToast('✅ تم استيراد البيانات','#16a34a');
      });
    }catch(ex){showToast('❌ خطأ في قراءة الملف','#dc2626');}
  };
  r.readAsText(file);
  input.value='';
}

function exportCSV(){
  try{
    var rows=[['التاريخ','العميل','الموديل','السيريال','العداد','الإجمالي','المدفوع','الحالة','ملاحظة']];
    DB.sales.forEach(function(s){
      rows.push([s.date,s.customer,s.model||'',s.serial||'',s.counter||'',s.total,s.paid||0,s.status,s.note||'']);
    });
    var csv=rows.map(function(r){return r.map(function(c){return'"'+String(c).replace(/"/g,'""')+'"';}).join(',');}).join('\n');
    var BOM='\uFEFF';
    var blob=new Blob([BOM+csv],{type:'text/csv;charset=utf-8'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');a.href=url;a.download='sales-'+today()+'.csv';
    a.click();URL.revokeObjectURL(url);
    showToast('✅ تم تصدير CSV','#16a34a');
  }catch(e){showToast('❌ فشل التصدير','#dc2626');}
}

function clearAllData(){
  DB.products=[];DB.sales=[];DB.purchases=[];DB.expenses=[];
  DB.debts=[];DB.tasks=[];DB.empExp=[];
  DB.archive={customers:[],suppliers:[],products:[],expDescs:[],serials:[],models:[]};
  persist();renderHome();navigate('home');
  showToast('🗑️ تم مسح كل البيانات','#64748b');
}
