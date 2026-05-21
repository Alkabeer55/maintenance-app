// ===== HIJRI (default ON) =====
var _hijri = LS.get('mc8_hijri', true); // NEW: hijri is default

function today(){return new Date().toISOString().split('T')[0];}

function toHijri(d){
  try{var dt=new Date(d);if(isNaN(dt))return d;
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura',{year:'numeric',month:'2-digit',day:'2-digit'}).format(dt);
  }catch(e){return d;}
}

function fmtDate(d){if(!d)return'';return _hijri?toHijri(d):d;}

function toggleHijri(){
  _hijri=document.getElementById('hijri-toggle').checked;
  LS.set('mc8_hijri',_hijri);
  renderSales();renderPurchases();
  showToast(_hijri?'✅ التاريخ الهجري':'✅ التاريخ الميلادي','#16a34a');
}

function dateField(id,label,val){
  if(!_hijri)return fld(id,label,'date',val||today(),'');
  return '<div class="field"><label>'+label+'</label><input id="'+id+'" type="text" value="'+(val?toHijri(val):toHijri(today()))+'" placeholder="مثال: 1446/09/15" style="width:100%;padding:10px 13px;border:2px solid #e2e8f0;border-radius:11px;font-size:14px;font-family:inherit;direction:rtl;background:#f8fafc;outline:none"><div style="font-size:11px;color:#94a3b8;margin-top:3px">التاريخ الهجري</div></div>';
}

// ===== TOAST =====
function showToast(msg,color){
  color=color||'#0f172a';
  var t=document.getElementById('toast');
  t.textContent=msg;t.style.background=color;t.style.display='block';
  setTimeout(function(){t.style.display='none';},2800);
}

// ===== MODAL =====
function openModal(){document.getElementById('modal-overlay').classList.add('open');}
function closeModal(){document.getElementById('modal-overlay').classList.remove('open');}
function confirmAction(msg,cb){
  document.getElementById('confirm-msg').textContent=msg;
  document.getElementById('confirm-yes').onclick=function(){cb();closeConfirm();};
  document.getElementById('confirm-overlay').classList.add('open');
}
function closeConfirm(){document.getElementById('confirm-overlay').classList.remove('open');}

// ===== FIELD BUILDERS =====
function fld(id,label,type,value,placeholder,required){
  value=value===undefined||value===null?'':value;
  return '<div class="field"><label>'+label+(required?'<span class="required">*</span>':'')+'</label><input id="'+id+'" type="'+type+'" value="'+esc(value)+'" placeholder="'+(placeholder||'')+'"></div>';
}

function acField(id,label,type,value,placeholder,archiveKey,required){
  return '<div class="field"><label>'+label+(required?'<span class="required">*</span>':'')+'</label><div class="autocomplete-wrap"><input id="'+id+'" type="'+type+'" value="'+esc(value||'')+'" placeholder="'+placeholder+'" autocomplete="off"><div id="ac-'+id+'" class="autocomplete-list" style="display:none"></div></div></div>';
}

function initAC(id,archiveKey){
  var input=document.getElementById(id);if(!input)return;
  function show(){
    var q=input.value.trim();
    var items=(DB.archive[archiveKey]||[]).filter(function(i){return!q||normalizeAr(i).includes(normalizeAr(q));}).slice(0,8);
    var list=document.getElementById('ac-'+id);
    if(!items.length){list.style.display='none';return;}
    list.innerHTML=items.map(function(i){return '<div class="autocomplete-item" onmousedown="selAC(\''+id+'\',\''+i.replace(/'/g,"&#39;")+'\')">' +esc(i)+'</div>';}).join('');
    list.style.display='block';
  }
  input.addEventListener('focus',show);
  input.addEventListener('input',show);
  input.addEventListener('blur',function(){setTimeout(function(){var l=document.getElementById('ac-'+id);if(l)l.style.display='none';},200);});
}
function selAC(id,value){document.getElementById(id).value=value;var l=document.getElementById('ac-'+id);if(l)l.style.display='none';}

function v(id){var el=document.getElementById(id);return el?el.value:'';}
function fmt(n){return(n||0).toLocaleString('ar-EG')+' ج';}

// ===== DELETE ITEM =====
function delItem(col,id,cb){
  DB[col]=DB[col].filter(function(x){return x.id!==id;});
  persist();cb();renderHome();showToast('🗑️ تم الحذف','#64748b');
}
