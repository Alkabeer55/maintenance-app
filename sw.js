// Service Worker لتطبيق الصيانة — v1
// الهدف الوحيد: تخزين صفحة التطبيق نفسها (index.html) ومكتبة Supabase، عشان
// التطبيق يقدر يفتح حتى لو مفيش نت خالص (مش بس انقطاع مؤقت أثناء الاستخدام).
// البيانات نفسها (المنتجات، الفواتير...) متخزنة أصلاً في localStorage جوه التطبيق،
// مش هنا — الكاش ده بس لملفات التطبيق (الشكل/الكود) عشان الصفحة "تفتح" أصلاً أوفلاين.

var CACHE_NAME = 'maintenance-app-shell-v1';
var URLS_TO_CACHE = [
  './',
  './index.html',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(URLS_TO_CACHE).catch(function(){ /* لو فشل كاش عنصر واحد، منوقفش التركيب كله */ });
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n!==CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// استراتيجية: النت الأول (عشان تجيب آخر نسخة من الكود لو موجود)، ولو فشل (أوفلاين)
// نرجع للنسخة المخزنة. طلبات Supabase نفسها (API) بتتسيب تعدي عادي من غير كاش —
// مينفعش نكاشها لأنها بيانات حية.
self.addEventListener('fetch', function(event){
  var url = event.request.url;
  if(url.indexOf('supabase.co') > -1) return; // اتصالات API الحية — من غير كاش

  event.respondWith(
    fetch(event.request).then(function(response){
      if(response && response.status===200){
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, clone); });
      }
      return response;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        return cached || caches.match('./index.html');
      });
    })
  );
});
