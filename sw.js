/* Service worker: guarda la app para que abra sin internet. */
const CACHE = "filamento-v1";
const ASSETS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-maskable-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    // Con internet baja la versión más nueva; sin internet usa la guardada.
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match("index.html")))
    );
  } else if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    // Las tipografías se guardan la primera vez que se descargan.
    e.respondWith(
      caches.open(CACHE).then((c) =>
        c.match(req).then((hit) =>
          hit ||
          fetch(req)
            .then((res) => { c.put(req, res.clone()); return res; })
            .catch(() => hit)
        )
      )
    );
  }
});
