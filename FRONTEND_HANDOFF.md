# Semillas de Bondad — Frontend Handoff

Production UI layer for the **Semillas de Bondad** PWA (FCA-UNAM, ~12,000 students).
Stack: **Vite · React 19 · TypeScript (strict) · Tailwind CSS v4 · shadcn/ui-style primitives · Motion · React Router (data mode) · Recharts**.

All visible copy is Mexican Spanish. All data flows through **one contract** (`SemillasApi`) and **one hook layer** (`src/hooks/useSemillas.ts`), so you can replace the mocks with Cloudflare Workers/D1, Convex, or TanStack Query without touching components.

---

## 0. Quick start

```bash
pnpm install
pnpm dev            # mocks on by default
pnpm build
```

| Env var                | Purpose                                                                   | Default                                          |
| ---------------------- | ------------------------------------------------------------------------- | ------------------------------------------------ |
| `VITE_USE_MOCKS`       | `"false"` disables demo seeds/hints (set it once real adapters are wired) | mocks on                                         |
| `VITE_API_BASE_URL`    | Base URL of your Cloudflare Worker (consumed by your REST adapter)        | —                                                |
| `VITE_CONVEX_URL`      | Convex deployment URL (if you use Convex)                                 | —                                                |
| `VITE_GITHUB_REPO_URL` | Public repo with rules, enrolment base, and escrow contract               | `https://github.com/semillas-de-bondad/reto-fca` |
| `VITE_MP_PUBLIC_KEY`   | Only needed if you later switch to Mercado Pago Bricks                    | —                                                |

**Demo shortcuts (mocks only):** log in with `319048291` and any password of 6+ characters, or append `?mockLogin=u_eco` to any URL. `SB-9104` can be voted on; `SB-8492` belongs to the demo user (voting is blocked). Mock state lives in `localStorage["sdb.mock.db"]`. Delete that key to reset.

---

## A. Folder / component tree

```
src/
├─ main.tsx                       React root + service worker registration
├─ index.css                      Tailwind v4 + shadcn CSS variables + brand tokens + print CSS
├─ app/
│  ├─ App.tsx                     <MotionConfig reducedMotion="user"><RouterProvider/>
│  └─ routes.tsx                  createBrowserRouter (basename = import.meta.env.BASE_URL)
├─ types/
│  └─ domain.ts                   ★ Backend contracts (Usuario, Planta, Interaccion, CarreraStats, PagoEscrow…)
├─ services/
│  ├─ api.ts                      ★ SemillasApi interface + `export const api = mockApi`  ← SWAP POINT #1
│  ├─ photos.ts                   PhotoRepository (IndexedDB) + demo seeds in mock mode
│  └─ config.ts                   USE_MOCKS, LINKS (GitHub), DEMO_LOGIN hint
├─ mocks/
│  └─ mockData.ts                 ★ All sample data + simulated handlers (delete when wired)
├─ hooks/
│  ├─ useSemillas.ts              ★ Data hooks (TanStack-shaped)  ← SWAP POINT #2
│  ├─ useCamera.ts                getUserMedia rear camera + torch
│  └─ useMediaQuery.ts            useIsDesktop() (≥768px)
├─ lib/
│  ├─ query.ts                    Tiny query/mutation cache (TanStack-compatible surface)
│  ├─ photoStore.ts               ★ IndexedDB blob store + JPEG compression
│  ├─ qrScanner.ts                ★ QrScanner interface + BarcodeDetector impl
│  ├─ mercadoPago.ts              ★ Checkout Pro redirect + return-param parser
│  ├─ exportImage.ts              DOM → PNG (html-to-image) + Web Share fallback
│  ├─ errors.ts                   ApiError + mensajeDeError()
│  └─ utils.ts                    cn(), formatMXN(centavos), dates, parsePlantaId(), plantaUrl()
├─ components/
│  ├─ CollectiblePlantCard.tsx    ★ 3D holographic collectible card
│  ├─ botanical/BotanicalArt.tsx  ★ 5 inline SVG archetypes (no_diseno 1–5) + LeafWatermark
│  ├─ brand/BrandMark.tsx         Logo + GitHub mark
│  ├─ layout/
│  │  ├─ AppShell.tsx             Auth guard, sidebar/tab bar switch, page transitions, <Page>, <PageHeader>
│  │  ├─ BottomTabBar.tsx         Mobile frosted bar (safe-area aware, elevated "Escanear" FAB)
│  │  ├─ Sidebar.tsx              Desktop Apple-style 240px sidebar
│  │  └─ nav.ts                   Single nav config shared by both
│  ├─ ui/                         shadcn-style: button, card, badge, input, label, checkbox,
│  │                              segmented-control, sheet (bottom sheet ↔ dialog), chart, skeleton, toaster
│  ├─ auth/EscrowSummary.tsx      $10 + $6 = $16 MXN breakdown
│  ├─ impacto/ImpactoCards.tsx    KpiCard, HeroActionCard, PlantaListItem
│  ├─ crear/PhotoCaptureSlot.tsx  Native camera capture + preview
│  ├─ crear/TeamBuilder.tsx       Up to 3 members, async account validation
│  ├─ planta/QrTicket.tsx         Printable ticket + QrTicketSheet (download PNG / print)
│  ├─ planta/RatingDock.tsx       5×44px star targets, creator/duplicate states
│  ├─ planta/ReportSheet.tsx      3 reasons, live n/5 threshold
│  ├─ planta/EstadoPlantaBadge.tsx
│  ├─ ranking/PrizePoolCard.tsx   Live escrow pool (animated MXN, participation bar)
│  ├─ ranking/IecChart.tsx        Recharts horizontal bars (shadcn chart style)
│  ├─ ranking/TransparencyCard.tsx
│  ├─ cuenta/CuentaSheets.tsx     Export / Edit profile / Escrow receipt / Rules sheets
│  ├─ cuenta/StoryExport.tsx      1080×1920 Instagram Story composition
│  └─ common/                     Avatar, FullScreenLoader, ErrorState, EmptyState
├─ content/showcase.ts            Static marketing card for the auth screen (not API data)
├─ views/                         One file per route (see table)
└─ pwa/registerServiceWorker.ts   Production-only SW registration
public/
├─ manifest.webmanifest  sw.js  favicon.png
├─ icons/       icon-192/512, maskable-192/512, apple-touch-icon (180), icon.svg, maskable.svg
└─ screenshots/ mobile-impacto, mobile-carta (780×1688), desktop-ranking (1440×900)
```

### Routes

| Path            | View              | Access     | Notes                                                         |
| --------------- | ----------------- | ---------- | ------------------------------------------------------------- |
| `/registro`     | `RegistroView`    | public     | Sign-up / sign-in + $16 MXN escrow gate. `?next=` is honoured |
| `/pago/retorno` | `PagoRetornoView` | session    | Mercado Pago `back_urls` target                               |
| `/p/:idPlanta`  | `PlantaView`      | **public** | QR destination. Read-only when signed out                     |
| `/impacto`      | `ImpactoView`     | active     | KPIs, hero CTA, your planters, QR ticket modal                |
| `/crear-maceta` | `CrearMacetaView` | active     | Page sheet on mobile (no tab bar), panel on desktop           |
| `/ranking`      | `RankingView`     | active     | Live pool (15 s polling) + IEc chart (60 s)                   |
| `/escanear`     | `EscanearView`    | active     | Full-bleed camera, dark tab bar                               |
| `/historial`    | `HistorialView`   | active     | IndexedDB photos + my ratings                                 |
| `/cuenta`       | `CuentaView`      | active     | Profile, escrow, rules, PNG export, sign out                  |

"active" = a session exists **and** `usuario.estado === 'activa'`. Otherwise `AppShell` redirects to `/registro?next=…`.

### Responsive behaviour

- **< 768px:** fixed frosted bottom tab bar, `height: 58px + env(safe-area-inset-bottom)`, with an elevated 56×56 emerald scan button. `viewport-fit=cover` is set in `index.html`. Sheets are draggable bottom sheets.
- **≥ 768px:** a fixed 240px sidebar with an animated active pill and a "Registrar maceta" CTA. Content sits in a centred `max-w-5xl` container with multi-column grids (Impacto 2-up + 3-col planter grid, Ranking 2/5 + 3/5, Historial 3–4 cols, Cuenta 320px + fluid, Planta card + details). Sheets become centred dialogs.

---

## B. Backend contracts (`src/types/domain.ts`)

**Conventions:** snake_case fields (mirrors D1 columns); money as **integer centavos**; dates as **ISO-8601 UTC strings**; user-facing error messages in Spanish.

```ts
type Carrera = "contaduria" | "administracion" | "informatica" | "negocios_internacionales";
type NoDiseno = 1 | 2 | 3 | 4 | 5;
type MotivoReporte = "sucia" | "seca" | "materiales_nuevos"; // −10 / −15 / −25 pts
const UMBRAL_REPORTES = 5; // unique reports per reason before a penalty applies
const MAX_INTEGRANTES = 3; // creator included

interface Usuario {
  id: string;
  numero_cuenta_enmascarado: string; // "319****91" — NEVER send the clear account number
  nickname: string; // "@EcoContador_26"
  carrera: Carrera;
  bio: string | null;
  avatar_url: string | null;
  estado: "pendiente_pago" | "activa" | "suspendida";
  amonestaciones: number;
  puntos_aportados: number; // net points contributed to the career
  percentil_fca: number; // 12 → "Top 12% FCA"
  total_plantas: number;
  total_votos_emitidos: number;
  creado_en: string;
}

interface Planta {
  id: string; // "SB-8492" (also the QR slug /p/SB-8492)
  nombre: string;
  no_diseno: NoDiseno; // assigned at random server-side
  creadores: { usuario_id: string; nickname: string; carrera: Carrera }[];
  material: string; // "100% Reciclado"
  sistema_autorriego: boolean;
  serie: number;
  serie_total: number; // 42 / 500
  puntaje_neto: number;
  promedio_estrellas: number; // 0–5, 1 decimal
  total_votos: number;
  reportes_pendientes: Record<MotivoReporte, number>;
  penalizaciones: { motivo: MotivoReporte; puntos: number; aplicada_en: string }[];
  estado: "verificada" | "en_revision" | "penalizada";
  creada_en: string;
}

interface Interaccion {
  id: string;
  planta_id: string;
  usuario_id: string;
  tipo: "voto" | "reporte";
  estrellas: 1 | 2 | 3 | 4 | 5 | null; // voto only
  motivo: MotivoReporte | null; // reporte only
  creada_en: string;
}
interface InteraccionConPlanta extends Interaccion {
  planta: Pick<Planta, "id" | "nombre" | "no_diseno">;
}

interface CarreraStats {
  carrera: Carrera;
  puntaje_neto: number;
  matricula_oficial: number;
  iec: number; // puntaje_neto / matricula_oficial (2 decimals)
  posicion: 1 | 2 | 3 | 4;
  tendencia_semanal: number; // IEc delta vs 7 days ago
  actualizado_en: string;
}

interface PagoEscrow {
  id: string;
  usuario_id: string;
  folio: string; // Mercado Pago payment_id, e.g. "MP-9921"
  aportacion_centavos: number; // 1000
  comision_centavos: number; // 600
  total_centavos: number; // 1600
  moneda: "MXN";
  estado: "pendiente" | "aprobado" | "rechazado" | "reembolsado";
  pagado_en: string | null;
}

interface PozoResumen {
  total_custodia_centavos: number;
  alumnos_activos: number;
  matricula_total: number; // participation goal (~12,000)
  cierre_en: string;
  actualizado_en: string;
}

interface PermisosPlanta {
  // what the viewer may do on /p/:id
  es_creador: boolean;
  voto_emitido: Interaccion | null;
  reporte_emitido: Interaccion | null;
}
```

**Inputs:** `RegistroInput { numero_cuenta, carrera, nickname, password, acepta_terminos: true }`, `LoginInput`, `CrearPlantaInput { nombre, companeros: string[] /* 9-digit, creator excluded */ }`, `VotoInput { planta_id, estrellas }`, `ReporteInput { planta_id, motivo }`, `PerfilUpdate { nickname?, bio? }`, `RetornoPagoInput { payment_id, status, external_reference, preference_id }`.
**Outputs:** `Sesion { token, usuario }`, `CuotaEntrada { aportacion_centavos, comision_centavos, total_centavos, moneda }`, `PreferenciaPago { preferencia_id, init_point }`, `CompaneroValidado { numero_cuenta, nickname, carrera }`.

### `SemillasApi` (`src/services/api.ts`): suggested REST mapping for Workers

| Method                      | Suggested endpoint                   | Server rules                                                     |
| --------------------------- | ------------------------------------ | ---------------------------------------------------------------- |
| `obtenerSesion()`           | `GET /api/sesion` → `Sesion \| null` | Cookie/JWT                                                       |
| `registrar(i)`              | `POST /api/auth/registro`            | 9 digits, unique account and nickname; `estado = pendiente_pago` |
| `iniciarSesion(i)`          | `POST /api/auth/login`               | —                                                                |
| `cerrarSesion()`            | `POST /api/auth/logout`              | —                                                                |
| `actualizarPerfil(i)`       | `PATCH /api/me`                      | nickname `^@[\w.]{3,20}$`, bio ≤ 80                              |
| `obtenerCuotaEntrada()`     | `GET /api/escrow/cuota`              | Single source of the $16 breakdown                               |
| `crearPreferenciaPago()`    | `POST /api/escrow/preferencia`       | See §C.3                                                         |
| `confirmarRetornoPago(i)`   | `POST /api/escrow/confirmar`         | Verify with the MP API; idempotent                               |
| `obtenerMiPago()`           | `GET /api/escrow/mio`                | —                                                                |
| `listarMisPlantas()`        | `GET /api/plantas?mias=1`            | —                                                                |
| `obtenerPlanta(id)`         | `GET /api/plantas/:id` (public)      | `null` → 404 view                                                |
| `obtenerPermisosPlanta(id)` | `GET /api/plantas/:id/permisos`      | —                                                                |
| `validarCompanero(n)`       | `GET /api/usuarios/validar?cuenta=`  | Must be active and not self                                      |
| `crearPlanta(i)`            | `POST /api/plantas`                  | ≤ 3 members, random `no_diseno`, `id` = `SB-####`                |
| `votar(i)`                  | `POST /api/plantas/:id/votos`        | 403 if creator, 409 if already voted                             |
| `reportar(i)`               | `POST /api/plantas/:id/reportes`     | 403 creator, 409 duplicate; apply penalty at 5 per reason        |
| `listarMisCalificaciones()` | `GET /api/me/votos`                  | —                                                                |
| `obtenerPozo()`             | `GET /api/pozo`                      | Polled every 15 s (or push via Convex)                           |
| `obtenerRankingCarreras()`  | `GET /api/ranking`                   | Polled every 60 s                                                |

**Errors:** throw `new ApiError(code, mensajeEnEspañol, httpStatus)` from `src/lib/errors.ts`. The UI shows `error.message` verbatim (toasts, field errors). Codes the UI already expects: `no_autenticado`, `pago_pendiente`, `credenciales`, `cuenta_duplicada`, `nickname_ocupado`, `creador`, `ya_voto`, `ya_reporto`, `no_encontrada`, `eres_tu`, `no_activa`.

### Swap recipes

**REST / Workers + D1:** create `src/services/restApi.ts` implementing `SemillasApi` with `fetch(import.meta.env.VITE_API_BASE_URL + …, { credentials: 'include' })`, map non-2xx responses to `ApiError`, then in `services/api.ts` set `export const api: SemillasApi = restApi`. Set `VITE_USE_MOCKS=false`.

**TanStack Query:** in `hooks/useSemillas.ts`, replace the imports from `@/lib/query` with `@tanstack/react-query` (keep the `keys` object), wrap `<App/>` in a `QueryClientProvider`, and replace `invalidateQueries(key)` / `setQueryData(key, …)` with `queryClient.*`. Hook return shapes already match.

**Convex:** rewrite the hook bodies, e.g.:

```ts
export const usePlanta = (id: string) => {
  const data = useQuery(api.plantas.get, { id }); // convex/react
  return { data, isLoading: data === undefined, error: undefined, refetch: () => {} };
};
export const useVotar = () => {
  const m = useMutation(api.interacciones.votar);
  const [isPending, setP] = useState(false);
  return {
    isPending,
    mutateAsync: async (i: VotoInput) => {
      setP(true);
      try {
        return await m(i);
      } finally {
        setP(false);
      }
    },
  };
};
```

Convex queries are reactive, so drop `refetchInterval` for the pool and ranking.

---

## C. Integration mount points

### C.1 QR camera library: `src/lib/qrScanner.ts` + `src/views/EscanearView.tsx`

- The camera stream is already live (`useCamera()` with `getUserMedia({ facingMode: 'environment' })`, torch via `applyConstraints({ advanced: [{ torch }] })` where supported).
- Decoding goes through the `QrScanner` interface: `start(video, onResult)` and `stop()`. The default uses the native **BarcodeDetector** (Chrome/Edge on Android). **iOS Safari needs a library.** Replace `createQrScanner()`:

```ts
import QrScannerLib from "qr-scanner"; // pnpm add qr-scanner
export function createQrScanner(): QrScanner {
  let inst: QrScannerLib | null = null;
  return {
    async start(video, onResult) {
      inst = new QrScannerLib(video, (r) => onResult(r.data), {
        returnDetailedScanResult: true,
        preferredCamera: "environment",
      });
      await inst.start();
    },
    stop: () => inst?.destroy(),
  };
}
```

If the library manages its own stream, remove the `useCamera().start()` call. The view already handles `onResult → parsePlantaId() → navigate('/p/SB-####')`, invalid codes, haptics, permission-denied and no-camera states, and manual ID entry.

### C.2 IndexedDB photo storage: `src/lib/photoStore.ts` + `src/services/photos.ts`

- Already implemented with the native IndexedDB API: DB `semillas-de-bondad`, store `fotos` (keyPath `id`, indexes `planta_id` and `creada_en`). Images are downscaled to 1600px JPEG q=0.82 before saving.
- Capture: `PhotoCaptureSlot` (`<input type="file" accept="image/*" capture="environment">`). The blob is saved after `crearPlanta` succeeds (`useGuardarFoto({ plantaId, file })`).
- Photos are **never uploaded**, by design. To add `idb-keyval` or Dexie, implement `PhotoRepository` (`list/save/remove`) in `services/photos.ts`.
- Consider calling `navigator.storage.persist()` after the first save so Safari doesn't evict data after 7 days of inactivity.

### C.3 Mercado Pago Checkout Pro: `src/lib/mercadoPago.ts`

1. **Front:** `RegistroView` → `useCrearPreferenciaPago()` → `redirigirACheckout(init_point)` (`window.location.assign`).
2. **Worker** (`POST /api/escrow/preferencia`, keep your access token server-side):

```ts
await fetch("https://api.mercadopago.com/checkout/preferences", {
  method: "POST",
  headers: { Authorization: `Bearer ${env.MP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    items: [
      {
        title: "Garantía Reto Semillas de Bondad",
        quantity: 1,
        currency_id: "MXN",
        unit_price: 16,
      },
    ],
    external_reference: usuario.id,
    back_urls: {
      success: `${ORIGIN}/pago/retorno`,
      pending: `${ORIGIN}/pago/retorno`,
      failure: `${ORIGIN}/pago/retorno`,
    },
    auto_return: "approved",
    notification_url: `${API}/api/escrow/webhook`,
    statement_descriptor: "SEMILLAS FCA",
  }),
}); // → return { preferencia_id: res.id, init_point: res.init_point }
```

3. **Return:** MP redirects to `/pago/retorno?payment_id&status&external_reference&preference_id`. `leerRetorno()` parses them, also accepting `collection_id` / `collection_status`. `PagoRetornoView` calls `confirmarRetornoPago` and renders the approved, pending (OXXO up to 48 h), rejected, or error state.
4. **Source of truth:** the **webhook** plus `GET /v1/payments/:id` on the Worker. Only activate (`estado = 'activa'`) and add $10 to `pozo` when `status === 'approved'` and `external_reference` matches. Make it idempotent on `payment_id`.
5. The UI never trusts the `status` query param on its own.

### C.4 Other mounts

- **PNG export:** `exportNodeToPng(node, filename)` in `lib/exportImage.ts` uses Web Share with files on mobile and falls back to a download. `StoryExport` renders a 1080×1920 composition off-screen. Remote images inside exported nodes need CORS headers.
- **QR payload:** `plantaUrl(id)` → `${origin}${BASE_URL}p/${id}` (`qrcode.react`, error level M). Printing uses the `.print-area` class and `@media print` rules in `index.css`.
- **Live updates:** `usePozo` polls every 15 s; `useRankingCarreras` every 60 s. Swap for Convex subscriptions or Server-Sent Events from a Worker.

---

## D. 3D collectible card (`src/components/CollectiblePlantCard.tsx`)

```tsx
<CollectiblePlantCard planta={planta} interactive idle />
```

| Layer         | Implementation                                                                                                                 |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Stage         | `perspective: 1000px`, inner `transform-style: preserve-3d`                                                                    |
| Tilt          | Pointer/touch → `useMotionValue` (0–1) → `useSpring(stiffness 170, damping 17)` → `rotateX/rotateY ±14°`; dynamic drop shadow  |
| 01 Base frame | Metallic silver-emerald 8px gradient border, slow shimmer animation                                                            |
| 02 Art slot   | 280×210 `BotanicalArt`, **`translateZ(24px)`** pop-out                                                                         |
| 03 Holo foil  | `radial-gradient(at var(x) var(y))` + iridescent linear layer, `mix-blend-mode: color-dodge`, opacity springs up while touched |
| 04 Metadata   | Header (`translateZ 12px`), creators and footer (`translateZ 10px`)                                                            |
| 05 Glare      | Specular radial highlight (`translateZ 30px`)                                                                                  |

- An idle float animation runs while the card isn't being touched. `touch-action: pan-y` keeps vertical page scroll working on phones.
- Respects `prefers-reduced-motion`; when reduced, the card is static.
- **Never add `overflow: hidden`** to an ancestor of the art slot. It flattens the 3D context.
- Optional: feed `DeviceOrientationEvent` beta/gamma into `px/py` for gyroscope tilt (iOS requires `DeviceOrientationEvent.requestPermission()` from a user gesture).

**Botanical archetypes** (`components/botanical/BotanicalArt.tsx`): `DisenoNopal` (1), `DisenoSuculenta` (2), `DisenoPetAutorriego` (3, the self-watering PET bottle with bottle-cap collar), `DisenoCempasuchil` (4), `DisenoHelecho` (5). Use `<BotanicalArt noDiseno={n} labelled={false} />` for decorative thumbnails. `ARQUETIPOS[n]` holds the name, material and palette.

---

## E. PWA manifest and icons

| Asset                                        | Size / purpose                                                     | Platform                                          |
| -------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------- |
| `icons/icon-192.png`, `icon-512.png`         | `any`                                                              | Android / Chrome install, splash                  |
| `icons/maskable-192.png`, `maskable-512.png` | `maskable` (glyph inside the 80% safe zone, full-bleed background) | Android adaptive icons                            |
| `icons/apple-touch-icon.png`                 | 180×180, opaque                                                    | iOS home screen (`<link rel="apple-touch-icon">`) |
| `icons/icon.svg`                             | `any`, scalable                                                    | Desktop Chrome/Edge                               |
| `favicon.png`                                | 64×64                                                              | Browser tab                                       |
| `screenshots/mobile-*.png`                   | 780×1688, `form_factor: narrow`                                    | Richer Android install sheet                      |
| `screenshots/desktop-ranking.png`            | 1440×900, `form_factor: wide`                                      | Desktop install dialog                            |

**`manifest.webmanifest` highlights:**

- `display: standalone`, with `display_override: ["window-controls-overlay", "standalone", "minimal-ui"]` for desktop.
- `start_url: ./impacto?source=pwa` and `scope: ./`, both relative so they work under any `BASE_URL`.
- `lang: es-MX`, `theme_color` and `background_color` = `#F8F9F7`, `orientation: any` (desktop friendly).
- Shortcuts: Escanear QR, Registrar maceta, Ranking en vivo.

**`index.html`:** `viewport-fit=cover` (required for `env(safe-area-inset-*)`), `theme-color`, and `apple-mobile-web-app-*` meta tags.

**Installability checklist:**

1. Serve over HTTPS. Workers / Pages already do.
2. SPA fallback: every unknown path must serve `index.html` (e.g. Cloudflare Pages `_redirects`: `/*  /index.html  200`). The `/p/:id` QR deep links depend on this.
3. Service worker: `public/sw.js` is registered **in production only** and never inside iframes. It does network-first for navigations (offline shell), cache-first for `/assets` and `/icons` and Google Fonts, and never caches `/api`, Convex or Mercado Pago. Bump `VERSION` on each deploy, or migrate to `vite-plugin-pwa` (`injectManifest` with this file as the template) for precaching and update prompts.
4. iOS has no install prompt. Consider an "Añadir a pantalla de inicio" hint for Safari users.
5. If you regenerate icons, keep the maskable glyph within the central 80% circle (check with maskable.app).

---

## F. Accessibility and quality notes

- Touch targets are ≥ 44×44 (stars, tab bar, icon buttons). Inputs are 52px tall and use 16px text, which prevents iOS zoom.
- Radix Dialog provides focus trapping, Esc to close and labelled titles. Segmented controls use `role="tablist"`. Ratings and report reasons use `role="radiogroup"`.
- `tabular-nums` is applied to all MXN amounts, IDs, scores and IEc values. Money is formatted with `Intl.NumberFormat('es-MX', { currency: 'MXN' })`.
- **Contrast:** white on Mercado Pago blue `#009EE3` is about 3.0:1, below WCAG AA for normal-size text. The label is semibold 15–16px. If AA is mandatory, use `#0077B5` for the button fill.
- Reduced motion: `MotionConfig reducedMotion="user"` plus a global CSS guard.
- **IEc chart:** the bar entrance animation is disabled (`isAnimationActive={false}`) so bars render reliably in every environment. Re-enable it if you prefer the effect.
