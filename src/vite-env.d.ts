/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** "false" to use real adapters instead of src/mocks */
  readonly VITE_USE_MOCKS?: string;
  /** Public repo with rules, enrolment base and escrow contract */
  readonly VITE_GITHUB_REPO_URL?: string;
  /** Base URL of the Cloudflare Worker API (used by your real adapter) */
  readonly VITE_API_BASE_URL?: string;
  /** Convex deployment URL (if using Convex) */
  readonly VITE_CONVEX_URL?: string;
  /** Mercado Pago public key (only needed for Bricks; Checkout Pro uses server init_point) */
  readonly VITE_MP_PUBLIC_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
