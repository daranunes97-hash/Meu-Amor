// Meu Amor — funciona sem internet. Troque o nome do cache a cada versão.
const CACHE = 'meu-amor-v1.0';
const ARQS = ['./', 'index.html', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARQS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k.startsWith('meu-amor-') && k !== CACHE && k !== 'meu-amor-lib').map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // biblioteca da IA do celular: guarda uma cópia para funcionar sem internet
  if (u.hostname === 'esm.run' || u.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(caches.open('meu-amor-lib').then(async ca => {
      const salvo = await ca.match(e.request);
      const rede = fetch(e.request).then(r => { if (r.ok) ca.put(e.request, r.clone()); return r; });
      return salvo || rede;
    }));
    return;
  }
  if (u.origin !== location.origin) return; // Gemini e os arquivos da IA passam direto
  // página: tenta a internet primeiro (para pegar atualizações), senão usa a cópia
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const c = r.clone(); caches.open(CACHE).then(ca => ca.put(e.request, c)); }
      return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});
