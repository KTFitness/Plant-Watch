const CACHE_NAME = "plant-watch-v3";
const APP_SHELL = [
  "./", "./index.html", "./app.bundle.js", "./manifest.json",
  "./vendor/react.production.min.js", "./vendor/react-dom.production.min.js",
  "./vendor/react-is.production.min.js", "./vendor/recharts.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first: always try to fetch the latest version first, and only
// fall back to the cached copy if the network is unavailable (offline use).
// This is the opposite of the previous cache-first approach, which was
// silently serving stale app.bundle.js even after new versions were deployed.
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
