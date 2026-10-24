// Service Worker لتطبيق ابو حوده — v4
// الهدف: تخزين صفحة التطبيق (index.html) ومكتبة Supabase والخطوط عشان التطبيق يفتح أوفلاين وبنفس الشكل.
// البيانات نفسها في localStorage جوه التطبيق، مش هنا.
// ⚠️ لازم اسم ملف التطبيق يكون index.html بالظبط (الملف ده بيخزّنه ويفتحه بالاسم ده) ويتحط sw.js جنبه في نفس المجلد.
//
// v4 — إصلاحات (الإصلاحات القديمة v3 كلها محفوظة):
//  1) الخطوط (Cairo من Google Fonts) ماكانتش بتتخزن → أوفلاين الخط يتغيّر. دلوقتي بتتخزن في كاش مستقل
//     (stale-while-revalidate: بتفتح فورًا من الكاش وتتحدّث في الخلفية).
//  2) مكتبة Supabase كانت بتتخزن وقت التثبيت بس — لو فشل التحميل وقتها (نت ضعيف) كانت بتفضل مش متخزنة للأبد
//     لأن تحميل الصفحة العادي (no-cors) بيرجّع ردّ معتم (opaque) مش بيتخزن. دلوقتي بنجيبها بطلب CORS صريح
//     (jsdelivr بيدعمه) فنقدر نتأكد إنه 200 ونحدّث الكاش في أي فتحة أونلاين.
//  3) cache:'no-store' كان بيحمّل index.html كامل (~٢٫٢ ميجا) في كل فتحة. بقى 'no-cache' = يتأكد من السيرفر
//     (ETag) ولو مفيش تغيير بياخد 304 صغير. التحديثات لسه بتوصل فورًا.
//  4) نسخة واحدة من index.html في الكاش (كان بيخزّن './' و './index.html' نسختين = ضعف التحميل والمساحة).
//  5) event.waitUntil كان بيتنادى متأخر بعد ما الاستجابة تخلص (لو الكاش كسب السباق) فبيرمي خطأ ونسخة النت
//     الجديدة ماكانتش بتتخزن. بقى بيتنادى فورًا مرة واحدة.
//
// v3 (محفوظ): activate بيمسح بس كاشات الـ shell القديمة (مش تلاوات القرآن mc8-quran-audio)، GET فقط،
//     الصوت/Range/Supabase API/أي موقع تاني من غير تدخّل، النت الأول بمهلة ٤ ثواني ثم الكاش.

var SHELL_PREFIX = 'maintenance-app-shell-';
var CACHE_NAME = SHELL_PREFIX + 'v4';
var FONT_CACHE = 'mc8-fonts-v1';   // اسمه مش بيبدأ بـ SHELL_PREFIX → activate مابيمسحوش
var SDK_URL = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js';
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];
var INDEX_URL = new URL('./index.html', self.location).href;
var NETWORK_TIMEOUT_MS = 4000;

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      // عنصر واحد يفشل مايوقفش الباقي
      return Promise.all([
        cache.add(INDEX_URL).catch(function(){}),
        cache.add(new Request(SDK_URL, {mode:'cors', credentials:'omit'})).catch(function(){})
      ]);
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

function isFontHost(url){ return FONT_HOSTS.indexOf(url.hostname)!==-1; }

function isOurs(url){
  if(url.origin===self.location.origin) return true;   // index.html وملفات التطبيق
  return url.href===SDK_URL;                           // مكتبة Supabase
}

// صفحة التطبيق (الجذر أو index.html) بتتخزن تحت مفتاح واحد ثابت
function isAppPage(req, url){
  if(req.mode!=='navigate' || url.origin!==self.location.origin) return false;
  var p = url.pathname;
  return p.charAt(p.length-1)==='/' || /\/index\.html$/.test(p);
}

self.addEventListener('fetch', function(event){
  var req = event.request;
  if(req.method!=='GET') return;                       // POST وغيره: من غير تدخّل
  if(req.headers.has('range')) return;                 // الصوت/الفيديو (Range): المتصفح يتعامل معاه
  var url;
  try{ url=new URL(req.url); }catch(e){ return; }

  if(url.href===SDK_URL){ event.respondWith(networkFirst(event, req, url)); return; }
  if(isFontHost(url)){ event.respondWith(fontsStaleWhileRevalidate(event, req)); return; }
  if(!isOurs(url)) return;                             // Supabase API / القرآن / أي موقع تاني: من غير كاش

  event.respondWith(networkFirst(event, req, url));
});

// الخطوط: من الكاش فورًا، وتتحدّث في الخلفية. (الردود المعتمة opaque مقبولة هنا — ده نمط Google Fonts المعتاد)
function fontsStaleWhileRevalidate(event, req){
  return caches.open(FONT_CACHE).then(function(cache){
    return cache.match(req).then(function(hit){
      var net = fetch(req).then(function(res){
        if(res && (res.status===200 || res.type==='opaque')){
          var copy = res.clone();
          cache.put(req, copy).catch(function(){});
        }
        return res;
      }).catch(function(){ return null; });
      event.waitUntil(net.then(function(){}, function(){}));
      if(hit) return hit;
      return net.then(function(r){ return r || Response.error(); });
    });
  });
}

function networkFirst(event, req, url){
  var isApp = isAppPage(req, url);
  var cacheKey = isApp ? INDEX_URL : req;               // نسخة واحدة من الصفحة مهما كان شكل العنوان
  var fromCache = function(){
    return caches.match(cacheKey, {ignoreSearch:true}).then(function(c){
      return c || (req.mode==='navigate' ? caches.match(INDEX_URL) : undefined);
    });
  };
  // الـSDK: طلب CORS صريح عشان نقدر نتأكد إنه 200 ونخزّنه (طلب <script> العادي بيرجّع opaque)
  var netReq = (url.href===SDK_URL) ? new Request(SDK_URL, {mode:'cors', credentials:'omit'}) : req;
  // 'no-cache' = يتأكد من السيرفر بالـETag (304 لو مفيش تغيير) بدل ما يحمّل الملف كله كل مرة
  var net = fetch(netReq, {cache:'no-cache'}).then(function(res){
    if(res && res.status===200){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(c){ return c.put(cacheKey, copy); }).catch(function(){});
    }
    return res;
  });
  // بنمدّ عمر الـ SW لحد ما النت يخلص (مرة واحدة وفورًا) عشان النسخة الجديدة تتخزن حتى لو الكاش كسب السباق
  event.waitUntil(net.then(function(){}, function(){}));

  // سباق: النت أو (بعد المهلة) الكاش — أيهما يجهز الأول، والنت الفاشل يرجع للكاش
  return new Promise(function(resolve){
    var done=false;
    var finish=function(r){ if(!done && r){ done=true; resolve(r); return true; } return false; };
    var timer=setTimeout(function(){ fromCache().then(finish); }, NETWORK_TIMEOUT_MS);
    net.then(function(r){ clearTimeout(timer); finish(r); })
       .catch(function(){ clearTimeout(timer); fromCache().then(function(c){ if(!finish(c)){ net.then(finish, function(){ if(!done){done=true;resolve(Response.error());} }); } }); });
  });
}
