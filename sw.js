/* Offline-Speicher für die Bewegungsspiele-App.
   WICHTIG: Bei jedem Update die Versionsnummer unten erhöhen. */
const VERSION = "bewegung-v2.1";
const DATEIEN = ["./", "./index.html", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(DATEIEN)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Seite: erst Internet versuchen (max. 3 Sek.), sonst gespeicherte Version.
// Bilder & Co.: gespeicherte Version, sonst Internet.
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith((async () => {
      const cache = await caches.open(VERSION);
      try {
        const netz = await Promise.race([fetch(req), new Promise((_, r) => setTimeout(() => r("timeout"), 3000))]);
        if (netz && netz.ok) { cache.put("./index.html", netz.clone()); return netz; }
      } catch (err) {}
      return (await cache.match("./index.html")) || (await cache.match("./")) || Response.error();
    })());
    return;
  }
  e.respondWith(caches.match(req).then(t => t || fetch(req)));
});
