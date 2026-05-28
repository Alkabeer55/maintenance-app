var CACHE = 'mc-v9';
var ASSETS = ['/','./index.html'];

self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(ASSETS);}));
  self.skipWaiting();
});

self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);}));
  }));
  self.clients.claim();
});

self.addEventListener('fetch',function(e){
  // Network first for Supabase API
  if(e.request.url.includes('supabase.co')){
    e.respondWith(fetch(e.request).catch(function(){return new Response('{}',{headers:{'Content-Type':'application/json'}});}));
    return;
  }
  // Cache first for app files
  e.respondWith(
    caches.match(e.request).then(function(cached){
      return cached || fetch(e.request).then(function(res){
        var clone=res.clone();
        caches.open(CACHE).then(function(c){c.put(e.request,clone);});
        return res;
      }).catch(function(){return cached||new Response('Offline');});
    })
  );
});
