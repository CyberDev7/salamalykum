// Minimal service worker — required for a site to qualify as a real
// installable PWA. Caches the app shell so it opens even with a flaky
// connection; doesn't try to cache dynamic Firebase data.
const CACHE_NAME = "salam-alykum-v1";
const APP_SHELL = [
  "./central-asia-bot.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
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

self.addEventListener("fetch", (event) => {
  // Network-first for everything, falling back to cache when offline —
  // keeps Firebase/live data fresh while still working offline for the
  // core app shell.
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
