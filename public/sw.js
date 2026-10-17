// Service Worker Kill Switch & Self-Unregister
// This forces any existing service worker to unregister and clear all stale caches,
// allowing the browser to load all pages and scripts directly from the network.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.map((k) => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.claim())
  );
});

// Pass-through: Do not intercept fetch events so the browser uses native network
self.addEventListener("fetch", () => {
  return;
});
