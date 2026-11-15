/* Semillas de Bondad — minimal production service worker.
 * - Navigations: network-first, offline fallback to cached app shell.
 * - Hashed static assets (/assets/*), icons, fonts: cache-first.
 * - API / Convex / Mercado Pago requests are never cached.
 * Bump VERSION on deploy (or migrate to vite-plugin-pwa for precaching).
 */
const VERSION = "sdb-v1";
const SHELL = `${VERSION}-shell`;
const ASSETS = `${VERSION}-assets`;
const scope = self.registration.scope;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((c) => c.addAll([scope, `${scope}manifest.webmanifest`, `${scope}icons/icon-192.png`])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

const NEVER_CACHE = [/\/api\//, /convex\.cloud/, /mercadopago/, /mercadolibre/];

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (NEVER_CACHE.some((r) => r.test(url.href))) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put(scope, copy));
          return res;
        })
        .catch(() => caches.match(scope)),
    );
    return;
  }

  const cacheable =
    (url.origin === self.location.origin && /\/(assets|icons)\//.test(url.pathname)) ||
    url.hostname === "fonts.gstatic.com" ||
    url.hostname === "fonts.googleapis.com";
  if (cacheable) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
  }
});
