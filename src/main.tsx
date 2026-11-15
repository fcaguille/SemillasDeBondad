import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app/App";
import { ErrorBoundary } from "./app/ErrorBoundary";
import { registerServiceWorker } from "./pwa/registerServiceWorker";
import "./index.css";

// The accessibility "skip to content" link points at #root, which a hash router
// would treat as a route. Move focus instead of changing the hash.
document.addEventListener("click", (e) => {
  const link = (e.target as Element | null)?.closest?.('a[href="#root"]');
  if (!link) return;
  e.preventDefault();
  const main = document.querySelector<HTMLElement>("main") ?? document.getElementById("root");
  main?.setAttribute("tabindex", "-1");
  main?.focus();
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);

try {
  registerServiceWorker();
} catch {
  /* never let PWA setup break boot */
}
