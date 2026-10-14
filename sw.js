// Service Worker لتطبيق ابو حوده — v3
// الهدف: تخزين صفحة التطبيق (index.html) ومكتبة Supabase عشان التطبيق يفتح أوفلاين.
// البيانات نفسها في localStorage جوه التطبيق، مش هنا.
//
// v3 — إصلاحات:
//  1) activate كان بيمسح *كل* الكاشات غير كاش التطبيق، ومنها 'mc8-quran-audio' (تلاوات القرآن المنزّلة).
//     دلوقتي بيمسح بس كاشات الـ shell القديمة بتاعتنا.
//  2) مبقاش بيكاش أي حاجة غير index.html والـ SDK (كان بيكاش كل رد 200 من أي موقع، منها ملفات صوت كبيرة).
//  3) بيتعامل مع GET فقط، والصوت وRange وطلبات Supabase وأي موقع تاني بتعدّي من غير تدخّل.
//  4) النت الأول مع مهلة ٤ ثواني: لو النت ضعيف جدًا يفتح من الكاش بدل ما الشاشة تفضل بيضا.
//  5) تحميل الـ shell عنصر عنصر (فشل الـ CDN مبقاش بيمنع كاش index.html)، وتحديث الكاش جوه waitUntil.

var SHELL_PREFIX = 'maintenance-app-shell-';
var CACHE_NAME = SHELL_PREFIX + 'v3';
var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
var URLS_TO_CACHE = ['./', './index.html', SDK_URL];
var NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(URLS_TO_CACHE.map(function(u){
        return cache.add(u).catch(function(){ /* عنصر واحد يفشل مايوقفش الباقي */ });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names
        .filter(function(n){ return n.indexOf(SHELL_PREFIX)===0 && n!==CACHE_NAME; }) // بس كاشات الـ shell القديمة
        .map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

function isOurs(url){
  if(url.origin===self.location.origin) return true;   // index.html وملفات التطبيق
  return url.href===SDK_URL;                           // مكتبة Supabase
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method!=='GET') return;                       // POST وغيره: من غير تدخّل
  if(req.headers.has('range')) return;                 // الصوت/الفيديو (Range): المتصفح يتعامل معاه
  var url;
  try{ url=new URL(req.url); }catch(e){ return; }
  if(!isOurs(url)) return;                             // Supabase / القرآن / أي موقع تاني: من غير كاش

  event.respondWith(networkFirst(event, req));
});

function networkFirst(event, req){
  var fromCache = function(){
    return caches.match(req, {ignoreSearch:true}).then(function(c){
      return c || (req.mode==='navigate' ? caches.match('./index.html') : undefined);
    });
  };
  // cache:'no-store' عشان نجيب آخر نسخة بدل كاش HTTP الداخلي للمتصفح
  var net = fetch(req, {cache:'no-store'}).then(function(res){
    if(res && res.status===200){
      var copy = res.clone();
      event.waitUntil(caches.open(CACHE_NAME).then(function(c){ return c.put(req, copy); }).catch(function(){}));
    }
    return res;
  });
  // سباق: النت أو (بعد المهلة) الكاش — أيهما يجهز الأول، والنت الفاشل يرجع للكاش
  return new Promise(function(resolve){
    var done=false;
    var finish=function(r){ if(!done && r){ done=true; resolve(r); return true; } return false; };
    var timer=setTimeout(function(){ fromCache().then(finish); }, NETWORK_TIMEOUT_MS);
    net.then(function(r){ clearTimeout(timer); finish(r); })
       .catch(function(){ clearTimeout(timer); fromCache().then(function(c){ if(!finish(c)){ net.then(finish, function(){ if(!done){done=true;resolve(Response.error());} }); } }); });
  });
}
