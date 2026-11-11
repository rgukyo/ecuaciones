const CACHE = "ecuaciones-v5";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/app.js",
  "./js/catalog.js",
  "./js/format.js",
  "./js/frac.js",
  "./js/generators.js",
  "./js/grade.js",
  "./js/lessons.js",
  "./js/render.js",
  "./js/state.js",
  "./js/expr.js",
  "./js/modelos.js",
  "./js/visual.js",
  "./js/pasos.js",
  "./js/pizarra.js",
  "./fonts/Kalam-Regular.ttf",
  "./fonts/Kalam-Bold.ttf",
  "./fonts/OFL.txt",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/icon-maskable-512.png",
  "./icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function isAppShell(url) {
  return url.pathname.endsWith("/") || /\.(html|js|css)$/.test(url.pathname);
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh && fresh.ok) cache.put(request, fresh.clone());
    if (fresh) return fresh;
  } catch {
    /* sin red: se usa la copia guardada */
  }
  const cached = await cache.match(request);
  if (cached) return cached;
  if (request.mode === "navigate") {
    const home = await cache.match("./index.html");
    if (home) return home;
  }
  return new Response("Sin conexión", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isAppShell(url)) {
    event.respondWith(networkFirst(request));
    return;
  }
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        })
        .catch(() => caches.match("./index.html"));
    })
  );
});
