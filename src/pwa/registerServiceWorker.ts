/**
 * Registers /sw.js in production only (avoids stale caches during dev and
 * inside preview iframes). Replace with vite-plugin-pwa for precaching.
 */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  if (window.self !== window.top) return; // skip embedded previews
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      .catch(() => {});
  });
}
