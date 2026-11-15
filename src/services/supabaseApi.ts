/**
 * Real adapter: Supabase Auth + Edge Function (supabase/functions/server).
 * Implements the same SemillasApi contract as the mocks.
 */
import type { SemillasApi } from "@/services/api";
import { ApiError } from "@/lib/errors";
import type {
  CarreraStats,
  CompaneroValidado,
  CuotaEntrada,
  Interaccion,
  InteraccionConPlanta,
  PagoEscrow,
  PermisosPlanta,
  Planta,
  PozoResumen,
  PreferenciaPago,
  Sesion,
  Usuario,
} from "@/types/domain";
import { API_BASE, SUPABASE_ANON_KEY, emailDeCuenta, supabase } from "./supabaseClient";

async function token(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const jwt = (await token()) ?? SUPABASE_ANON_KEY;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${jwt}`,
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      "sin_conexion",
      "No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.",
      0,
    );
  }
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      json?.error?.code ?? `http_${res.status}`,
      json?.error?.message ?? "Algo salió mal. Inténtalo de nuevo.",
      res.status,
    );
  }
  return json as T;
}

const enc = encodeURIComponent;

async function sesionActual(): Promise<Sesion> {
  const jwt = await token();
  if (!jwt) throw new ApiError("no_autenticado", "Tu sesión expiró. Inicia sesión de nuevo.", 401);
  const usuario = await call<Usuario>("GET", "/me");
  return { token: jwt, usuario };
}

async function entrar(numeroCuenta: string, password: string): Promise<Sesion> {
  const { error } = await supabase.auth.signInWithPassword({
    email: emailDeCuenta(numeroCuenta),
    password,
  });
  if (error) {
    if (error.status === 400 || /invalid/i.test(error.message))
      throw new ApiError("credenciales", "Número de cuenta o contraseña incorrectos.", 401);
    throw new ApiError("auth", "No pudimos iniciar sesión. Inténtalo de nuevo.", error.status ?? 500);
  }
  return sesionActual();
}

export const supabaseApi: SemillasApi = {
  async obtenerSesion() {
    if (!(await token())) return null;
    try {
      return await sesionActual();
    } catch (e) {
      // Stale token or missing profile: drop the local session instead of looping.
      if (e instanceof ApiError && (e.status === 401 || e.status === 404)) {
        await supabase.auth.signOut({ scope: "local" });
        return null;
      }
      throw e;
    }
  },

  async registrar(input) {
    if (!/^\d{9}$/.test(input.numero_cuenta))
      throw new ApiError("cuenta_invalida", "El número de cuenta debe tener 9 dígitos.");
    await call("POST", "/auth/registro", input);
    return entrar(input.numero_cuenta, input.password);
  },

  async iniciarSesion(input) {
    if (!/^\d{9}$/.test(input.numero_cuenta))
      throw new ApiError("credenciales", "Número de cuenta o contraseña incorrectos.", 401);
    return entrar(input.numero_cuenta, input.password);
  },

  async cerrarSesion() {
    await supabase.auth.signOut();
  },

  actualizarPerfil: (input) => call<Usuario>("PATCH", "/me", input),

  obtenerCuotaEntrada: () => call<CuotaEntrada>("GET", "/cuota"),
  crearPreferenciaPago: () =>
    call<PreferenciaPago>("POST", "/pago/preferencia", {
      return_url: new URL(`${import.meta.env.BASE_URL}pago/retorno`, window.location.origin).toString(),
    }),
  confirmarRetornoPago: (input) => call<PagoEscrow>("POST", "/pago/confirmar", input),
  obtenerMiPago: () => call<PagoEscrow | null>("GET", "/pago/mio"),

  listarMisPlantas: () => call<Planta[]>("GET", "/plantas/mias"),
  async obtenerPlanta(id) {
    try {
      return await call<Planta>("GET", `/plantas/${enc(id)}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return null;
      throw e;
    }
  },
  obtenerPermisosPlanta: (id) => call<PermisosPlanta>("GET", `/plantas/${enc(id)}/permisos`),
  validarCompanero: (numero_cuenta) =>
    call<CompaneroValidado>("POST", "/companeros/validar", { numero_cuenta }),
  crearPlanta: (input) => call<Planta>("POST", "/plantas", input),

  votar: ({ planta_id, estrellas }) =>
    call<Interaccion>("POST", `/plantas/${enc(planta_id)}/votos`, { estrellas }),
  reportar: ({ planta_id, motivo }) =>
    call<Interaccion>("POST", `/plantas/${enc(planta_id)}/reportes`, { motivo }),
  listarMisCalificaciones: () => call<InteraccionConPlanta[]>("GET", "/calificaciones/mias"),

  obtenerPozo: () => call<PozoResumen>("GET", "/pozo"),
  obtenerRankingCarreras: () => call<CarreraStats[]>("GET", "/ranking"),
};
