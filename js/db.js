// ===== DATA LAYER =====
var LS = {
  get: function(k,d){try{var v=localStorage.getItem(k);return v?JSON.parse(v):d;}catch(e){return d;}},
  set: function(k,v){
    try{localStorage.setItem(k,JSON.stringify(v));return true;}
    catch(e){
      if(e&&(e.name==='QuotaExceededError'||e.name==='NS_ERROR_DOM_QUOTA_REACHED'||e.code===22)){
        showToast('⚠️ الذاكرة ممتلئة! صدّر نسخة احتياطية','#dc2626');
      }
      return false;
    }
  }
};

var DB = {
  products:  LS.get('mc8_products',[]),
  sales:     LS.get('mc8_sales',[]),
  purchases: LS.get('mc8_purchases',[]),
  expenses:  LS.get('mc8_expenses',[]),
  debts:     LS.get('mc8_debts',[]),
  tasks:     LS.get('mc8_tasks',[]),
  empExp:    LS.get('mc8_empexp',[]),
  archive:   LS.get('mc8_archive',{customers:[],suppliers:[],products:[],expDescs:[],serials:[],models:[]}),
  // Customer ledger index: { customerName: { sales:[], debts:[] } } — built on load
};

function persist(){
  try {
    var used=0;
    for(var key in localStorage){if(localStorage.hasOwnProperty(key))used+=localStorage[key].length*2;}
    var usedKB=Math.round(used/1024);
    var syncEl=document.getElementById('sync-status');
    if(syncEl)syncEl.textContent=usedKB>3500?'⚠️ '+usedKB+'KB':'💾 محلي';
    if(usedKB>4500)showToast('⚠️ الذاكرة قاربت الامتلاء ('+usedKB+'KB). صدّر نسخة!','#ea580c');
  }catch(e){}
  LS.set('mc8_products',DB.products);
  LS.set('mc8_sales',DB.sales);
  LS.set('mc8_purchases',DB.purchases);
  LS.set('mc8_expenses',DB.expenses);
  LS.set('mc8_debts',DB.debts);
  LS.set('mc8_tasks',DB.tasks);
  LS.set('mc8_empexp',DB.empExp);
  LS.set('mc8_archive',DB.archive);
}

function addArchive(k,val){
  if(!val)return;
  if(!DB.archive[k])DB.archive[k]=[];
  if(DB.archive[k].includes(val))return;
  DB.archive[k].unshift(val);
  if(DB.archive[k].length>100)DB.archive[k].pop();
}

// ===== UNIQUE ID =====
var _idCounter=0;
function genId(){_idCounter++;return Date.now()*1000+_idCounter%1000;}

// ===== XSS PROTECTION =====
function esc(s){
  if(s===null||s===undefined)return'';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ===== ARABIC NORMALIZE (search) =====
function normalizeAr(s){
  if(!s)return'';
  return String(s).replace(/[أإآا]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').toLowerCase();
}

// ===== AUTO BACKUP =====
var _autoBackupInterval = null;
var AUTO_BACKUP_MINUTES = LS.get('mc8_backup_interval', 60); // default 60 min

function startAutoBackup(){
  if(_autoBackupInterval)clearInterval(_autoBackupInterval);
  if(AUTO_BACKUP_MINUTES <= 0)return;
  _autoBackupInterval = setInterval(function(){
    autoBackupSilent();
  }, AUTO_BACKUP_MINUTES * 60 * 1000);
}

function autoBackupSilent(){
  try{
    var data=Object.assign({},DB,{exportedAt:new Date().toISOString(),version:'8.0'});
    var blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url;
    a.download='mc-backup-'+new Date().toISOString().split('T')[0]+'-'+new Date().toTimeString().slice(0,5).replace(':','')+'.json';
    a.click();
    URL.revokeObjectURL(url);
    LS.set('mc8_last_backup', new Date().toISOString());
    showToast('💾 نسخة احتياطية تلقائية تم تنزيلها','#0d9488');
  }catch(e){showToast('❌ فشل النسخ الاحتياطي التلقائي','#dc2626');}
}

function setBackupInterval(minutes){
  AUTO_BACKUP_MINUTES = minutes;
  LS.set('mc8_backup_interval', minutes);
  startAutoBackup();
}
