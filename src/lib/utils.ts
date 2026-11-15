import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const mxn = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  minimumFractionDigits: 2,
});
const mxn0 = new Intl.NumberFormat("es-MX", {
  style: "currency",
  currency: "MXN",
  maximumFractionDigits: 0,
});
const num = new Intl.NumberFormat("es-MX");

/** 1600 → "$16.00" */
export const formatMXN = (centavos: number, { decimals = true } = {}) =>
  (decimals ? mxn : mxn0).format(centavos / 100);
export const formatNumber = (n: number) => num.format(n);

export function formatFecha(
  isoDate: string,
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "short", year: "numeric" },
) {
  return new Intl.DateTimeFormat("es-MX", opts).format(new Date(isoDate)).replace(".", "");
}

export function formatRelativo(isoDate: string) {
  const diff = Date.now() - new Date(isoDate).getTime();
  const min = Math.round(diff / 60_000);
  if (min < 1) return "Justo ahora";
  if (min < 60) return `Hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24)
    return `Hoy, ${formatFecha(isoDate, { hour: "2-digit", minute: "2-digit", hour12: false })}`;
  if (h < 48) return "Ayer";
  return formatFecha(isoDate, { day: "2-digit", month: "short" });
}

/** "14d 06h" countdown */
export function tiempoRestante(isoDate: string) {
  const ms = Math.max(0, new Date(isoDate).getTime() - Date.now());
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return `${d}d ${String(h).padStart(2, "0")}h`;
}

export const formatBytes = (b: number) =>
  b > 1_000_000 ? `${(b / 1_000_000).toFixed(1)} MB` : `${Math.round(b / 1000)} KB`;

/** Accepts "SB-8492", "#SB-8492", "sb8492" or a full https://…/p/SB-8492 URL. */
export function parsePlantaId(raw: string): string | null {
  const fromUrl = raw.match(/\/p\/([A-Za-z]{2}-?\d{3,6})/);
  const s = (fromUrl?.[1] ?? raw).trim().replace(/^#/, "").toUpperCase();
  const m = s.match(/^SB-?(\d{3,6})$/);
  return m ? `SB-${m[1]}` : null;
}

/** Absolute URL of the app shell (index.html directory), without hash or query. */
export function appBaseUrl(): string {
  const { origin, pathname } = window.location;
  return origin + pathname.replace(/[^/]*$/, "");
}

/** Absolute deep link in the app's hash-route format, e.g. https://host/#/p/SB-8492 */
export const appUrl = (ruta: string) => `${appBaseUrl()}#/${ruta.replace(/^\/+/, "")}`;

/** QR / share URL for a planter. parsePlantaId() accepts both this and legacy /p/ links. */
export const plantaUrl = (id: string) => appUrl(`p/${id}`);

/**
 * Return URL for external redirects (Mercado Pago back_urls). Uses a query param
 * instead of a hash because providers append their own query string; the boot
 * script in index.html turns ?ruta=… into the matching hash route.
 */
export function externalReturnUrl(ruta: string, params: Record<string, string> = {}): string {
  const url = new URL(appBaseUrl());
  url.searchParams.set("ruta", ruta.replace(/^\/+/, ""));
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  return url.toString();
}
