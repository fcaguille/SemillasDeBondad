/**
 * Semillas de Bondad — backend (Supabase Edge Function + Hono).
 *
 * Storage: the Make KV table (kv_store_451763c1). Key layout:
 *   usuario:{uid}                    perfil completo (incluye numero_cuenta, nunca se expone)
 *   cuenta:{numero_cuenta}           → uid
 *   nick:{nickname en minúsculas}    → uid
 *   planta:{SB-XXXX}                 Planta
 *   creador:{uid}:{planta_id}        → planta_id (índice "mis macetas")
 *   interaccion:{pid}:{uid}:{tipo}   Interaccion (garantiza 1 voto / 1 reporte por cuenta)
 *   calificacion:{uid}:{pid}         Interaccion tipo voto (historial del usuario)
 *   pago:{uid}                       último PagoEscrow del usuario
 *   pagomp:{payment_id}              marca de idempotencia de pagos aprobados
 *   pozo                             { total_custodia_centavos, alumnos_activos }
 *   config:reto                      { cierre_en }
 *   contador:serie                   número de serie de la siguiente carta
 *   snapshot:{YYYY-MM-DD}            IEc por carrera (tendencia semanal)
 *   cache:puntos                     puntos de alumnos activos ordenados (percentil)
 *
 * Every user-facing error message is Mexican Spanish.
 */
import { Hono } from "npm:hono";
import type { Context } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const P = "/make-server-451763c1";
const app = new Hono();

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

/* ------------------------------------------------------------------ */
/* Constants (mirror src/types/domain.ts)                              */
/* ------------------------------------------------------------------ */

type Carrera = "contaduria" | "administracion" | "informatica" | "negocios_internacionales";
type Motivo = "sucia" | "seca" | "materiales_nuevos";

const CARRERAS: Carrera[] = ["contaduria", "administracion", "informatica", "negocios_internacionales"];
/** Matrícula oficial por carrera (base pública y auditable). */
const MATRICULA: Record<Carrera, number> = {
  contaduria: 4900,
  administracion: 3500,
  informatica: 1850,
  negocios_internacionales: 1750,
};
const MATRICULA_TOTAL = Object.values(MATRICULA).reduce((a, b) => a + b, 0);
const PENALIZACION: Record<Motivo, number> = { sucia: -10, seca: -15, materiales_nuevos: -25 };
const UMBRAL_REPORTES = 5;
const MAX_INTEGRANTES = 3;
const SERIE_TOTAL = 500;
/** Votes a new planter needs before leaving "en_revision". */
const VOTOS_PARA_VERIFICAR = 3;
const CUOTA = {
  aportacion_centavos: 1000,
  comision_centavos: 600,
  total_centavos: 1600,
  moneda: "MXN" as const,
};
const DAY = 86_400_000;

/** Supabase Auth needs an email; students log in with their 9-digit account number. */
const emailDe = (numeroCuenta: string) => `${numeroCuenta}@alumnos.semillasdebondad.app`;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

class HttpError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

app.onError((err, c) => {
  if (err instanceof HttpError) {
    return c.json({ error: { code: err.code, message: err.message } }, err.status as 400);
  }
  console.log(`Error no controlado en ${c.req.method} ${c.req.path}:`, err);
  return c.json(
    { error: { code: "interno", message: "Algo salió mal en el servidor. Inténtalo de nuevo." } },
    500,
  );
});

const admin = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const now = () => new Date().toISOString();
const mask = (n: string) => `${n.slice(0, 3)}****${n.slice(-2)}`;
const rid = (p: string) => `${p}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
const normNick = (n: string) => (n.trim().startsWith("@") ? n.trim() : `@${n.trim()}`);
const NICK_RE = /^@[\w.]{3,20}$/;
const sinReportes = (): Record<Motivo, number> => ({ sucia: 0, seca: 0, materiales_nuevos: 0 });

async function body<T>(c: Context): Promise<T> {
  try {
    return (await c.req.json()) as T;
  } catch {
    throw new HttpError("cuerpo_invalido", "La solicitud no tiene un formato válido.");
  }
}

// deno-lint-ignore no-explicit-any
type UsuarioDb = Record<string, any> & {
  id: string;
  numero_cuenta: string;
  nickname: string;
  carrera: Carrera;
  estado: "pendiente_pago" | "activa" | "suspendida";
  puntos_aportados: number;
  total_plantas: number;
  total_votos_emitidos: number;
};
// deno-lint-ignore no-explicit-any
type Planta = Record<string, any> & {
  id: string;
  nombre: string;
  no_diseno: number;
  creadores: { usuario_id: string; nickname: string; carrera: Carrera }[];
  puntaje_neto: number;
  promedio_estrellas: number;
  total_votos: number;
  reportes_pendientes: Record<Motivo, number>;
  penalizaciones: { motivo: Motivo; puntos: number; aplicada_en: string }[];
  estado: "verificada" | "en_revision" | "penalizada";
  creada_en: string;
};

async function usuarioOpcional(c: Context): Promise<UsuarioDb | null> {
  const token = c.req.header("Authorization")?.split(" ")[1];
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) return null;
  return ((await kv.get(`usuario:${data.user.id}`)) as UsuarioDb | undefined) ?? null;
}
async function requireUser(c: Context) {
  const u = await usuarioOpcional(c);
  if (!u) throw new HttpError("no_autenticado", "Tu sesión expiró. Inicia sesión de nuevo.", 401);
  return u;
}
/** Free tier ("Modo Gratuito"): any signed-in, non-suspended account may vote. */
async function requireVotante(c: Context) {
  const u = await requireUser(c);
  if (u.estado === "suspendida")
    throw new HttpError("suspendida", "Tu cuenta está suspendida. Contacta al comité del reto.", 403);
  return u;
}
/** Paid escrow required: create planters, validate teammates, file reports. */
async function requireActive(c: Context) {
  const u = await requireUser(c);
  if (u.estado === "suspendida")
    throw new HttpError("suspendida", "Tu cuenta está suspendida. Contacta al comité del reto.", 403);
  if (u.estado !== "activa")
    throw new HttpError(
      "pago_pendiente",
      "Modo Gratuito: activa tu garantía ($16 MXN) para crear macetas y levantar reportes.",
      402,
    );
  return u;
}

async function percentilDe(puntos: number): Promise<number> {
  // deno-lint-ignore no-explicit-any
  let cache = (await kv.get("cache:puntos")) as { at: number; puntos: number[] } | undefined;
  if (!cache || Date.now() - cache.at > 10 * 60_000) {
    const usuarios = (await kv.getByPrefix("usuario:")) as UsuarioDb[];
    cache = {
      at: Date.now(),
      puntos: usuarios
        .filter((u) => u.estado === "activa")
        .map((u) => u.puntos_aportados ?? 0)
        .sort((a, b) => b - a),
    };
    await kv.set("cache:puntos", cache);
  }
  if (!cache.puntos.length) return 100;
  const mejores = cache.puntos.filter((p) => p > puntos).length;
  return Math.max(1, Math.min(100, Math.ceil(((mejores + 1) / cache.puntos.length) * 100)));
}

async function publico(u: UsuarioDb) {
  const { numero_cuenta: _omit, ...rest } = u;
  return { ...rest, percentil_fca: await percentilDe(u.puntos_aportados ?? 0) };
}

async function recalcularUsuario(uid: string) {
  const u = (await kv.get(`usuario:${uid}`)) as UsuarioDb | undefined;
  if (!u) return;
  const ids = (await kv.getByPrefix(`creador:${uid}:`)) as string[];
  const plantas = ids.length ? ((await kv.mget(ids.map((id) => `planta:${id}`))) as Planta[]) : [];
  u.total_plantas = plantas.length;
  u.puntos_aportados = Math.round(
    plantas.reduce((s, p) => s + p.puntaje_neto / Math.max(1, p.creadores.length), 0),
  );
  await kv.set(`usuario:${uid}`, u);
}
const recalcularCreadores = (p: Planta) =>
  Promise.all(p.creadores.map((c) => recalcularUsuario(c.usuario_id)));

const idPlanta = (raw: string) => decodeURIComponent(raw).trim().toUpperCase().replace(/^#/, "");

async function getPlanta(id: string) {
  const p = (await kv.get(`planta:${idPlanta(id)}`)) as Planta | undefined;
  if (!p) throw new HttpError("no_encontrada", "Esta maceta no existe.", 404);
  return p;
}

/* ------------------------------------------------------------------ */
/* Health                                                              */
/* ------------------------------------------------------------------ */

app.get(`${P}/health`, (c) => c.json({ status: "ok" }));

/* ------------------------------------------------------------------ */
/* Auth & perfil                                                       */
/* ------------------------------------------------------------------ */

app.post(`${P}/auth/registro`, async (c) => {
  const i = await body<{
    numero_cuenta?: string;
    carrera?: Carrera;
    nickname?: string;
    password?: string;
    acepta_terminos?: boolean;
  }>(c);
  const numero = String(i.numero_cuenta ?? "").trim();
  if (!/^\d{9}$/.test(numero))
    throw new HttpError("cuenta_invalida", "El número de cuenta debe tener 9 dígitos.");
  if (!i.carrera || !CARRERAS.includes(i.carrera))
    throw new HttpError("carrera_invalida", "Elige tu carrera.");
  if (!i.password || i.password.length < 8)
    throw new HttpError("password_corta", "La contraseña debe tener al menos 8 caracteres.");
  if (i.acepta_terminos !== true)
    throw new HttpError("terminos", "Debes aceptar el reglamento y el aviso de privacidad.");
  const nick = normNick(i.nickname ?? "");
  if (!NICK_RE.test(nick))
    throw new HttpError("nickname_invalido", "Usa de 3 a 20 letras, números, punto o guion bajo.");

  if (await kv.get(`cuenta:${numero}`))
    throw new HttpError(
      "cuenta_duplicada",
      "Ese número de cuenta ya está registrado. Inicia sesión.",
      409,
    );
  if (await kv.get(`nick:${nick.toLowerCase()}`))
    throw new HttpError("nickname_ocupado", "Ese nickname ya está ocupado. Prueba otro.", 409);

  const { data, error } = await admin().auth.admin.createUser({
    email: emailDe(numero),
    password: i.password,
    user_metadata: { nickname: nick, carrera: i.carrera },
    // No real inbox behind the synthetic email, so confirm immediately.
    email_confirm: true,
  });
  if (error || !data?.user) {
    console.log("Error creando usuario de Auth:", error);
    if (error?.message?.toLowerCase().includes("already"))
      throw new HttpError(
        "cuenta_duplicada",
        "Ese número de cuenta ya está registrado. Inicia sesión.",
        409,
      );
    throw new HttpError("registro", "No pudimos crear tu cuenta. Inténtalo de nuevo.", 500);
  }

  const uid = data.user.id;
  const usuario: UsuarioDb = {
    id: uid,
    numero_cuenta: numero,
    numero_cuenta_enmascarado: mask(numero),
    nickname: nick,
    carrera: i.carrera,
    bio: null,
    avatar_url: null,
    estado: "pendiente_pago",
    amonestaciones: 0,
    puntos_aportados: 0,
    percentil_fca: 100,
    total_plantas: 0,
    total_votos_emitidos: 0,
    creado_en: now(),
  };
  try {
    await kv.mset(
      [`usuario:${uid}`, `cuenta:${numero}`, `nick:${nick.toLowerCase()}`],
      [usuario, uid, uid],
    );
  } catch (e) {
    await admin().auth.admin.deleteUser(uid).catch(() => {});
    throw e;
  }
  return c.json({ ok: true }, 201);
});

app.get(`${P}/me`, async (c) => c.json(await publico(await requireUser(c))));

app.patch(`${P}/me`, async (c) => {
  const u = await requireUser(c);
  const i = await body<{ nickname?: string; bio?: string | null }>(c);
  if (i.nickname !== undefined) {
    const nick = normNick(i.nickname);
    if (!NICK_RE.test(nick))
      throw new HttpError("nickname_invalido", "Usa de 3 a 20 letras, números, punto o guion bajo.");
    if (nick.toLowerCase() !== u.nickname.toLowerCase()) {
      const ocupado = await kv.get(`nick:${nick.toLowerCase()}`);
      if (ocupado && ocupado !== u.id)
        throw new HttpError("nickname_ocupado", "Ese nickname ya está ocupado. Prueba otro.", 409);
      await kv.del(`nick:${u.nickname.toLowerCase()}`);
      await kv.set(`nick:${nick.toLowerCase()}`, u.id);
    }
    u.nickname = nick;
  }
  if (i.bio !== undefined) u.bio = i.bio?.trim().slice(0, 80) || null;
  await kv.set(`usuario:${u.id}`, u);
  return c.json(await publico(u));
});

/* ------------------------------------------------------------------ */
/* Escrow — Mercado Pago Checkout Pro                                  */
/* ------------------------------------------------------------------ */

const mpToken = () => {
  const t = Deno.env.get("MP_ACCESS_TOKEN");
  if (!t)
    throw new HttpError(
      "pagos_no_configurados",
      "Los pagos aún no están configurados. Inténtalo más tarde.",
      503,
    );
  return t;
};

// deno-lint-ignore no-explicit-any
async function mp(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${mpToken()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.log(`Mercado Pago ${init.method ?? "GET"} ${path} respondió ${res.status}:`, json);
    if (res.status === 404) throw new HttpError("pago_no_encontrado", "No encontramos ese pago en Mercado Pago.", 404);
    throw new HttpError("mercado_pago", "Mercado Pago no respondió. Inténtalo de nuevo.", 502);
  }
  return json;
}

const estadoMP = (s: string | null | undefined) =>
  s === "approved"
    ? "aprobado"
    : s === "refunded" || s === "charged_back"
      ? "reembolsado"
      : s === "pending" || s === "in_process" || s === "authorized" || s === "in_mediation"
        ? "pendiente"
        : "rechazado";

/** Applies a Mercado Pago payment idempotently. Source of truth is always GET /v1/payments/:id. */
// deno-lint-ignore no-explicit-any
async function procesarPago(payment: any) {
  const uid = payment?.external_reference as string | undefined;
  if (!uid) return null;
  const u = (await kv.get(`usuario:${uid}`)) as UsuarioDb | undefined;
  if (!u) return null;

  let estado = estadoMP(payment.status);
  const pagado = Math.round(Number(payment.transaction_amount ?? 0) * 100);
  if (estado === "aprobado" && (pagado < CUOTA.total_centavos || payment.currency_id !== "MXN")) {
    console.log(`Pago ${payment.id} aprobado con monto inesperado (${pagado} ${payment.currency_id})`);
    estado = "rechazado";
  }
  const pago = {
    id: `pay_${payment.id}`,
    usuario_id: uid,
    folio: `MP-${payment.id}`,
    ...CUOTA,
    estado,
    pagado_en: estado === "aprobado" ? (payment.date_approved ?? now()) : null,
  };

  const previo = await kv.get(`pago:${uid}`);
  // A later failed attempt must never hide an approved payment.
  if (previo?.estado === "aprobado" && previo.id !== pago.id && estado !== "aprobado") return previo;
  await kv.set(`pago:${uid}`, pago);

  if (estado === "aprobado" && !(await kv.get(`pagomp:${payment.id}`))) {
    await kv.set(`pagomp:${payment.id}`, { usuario_id: uid, aplicado_en: now() });
    if (u.estado === "pendiente_pago") {
      u.estado = "activa";
      await kv.set(`usuario:${uid}`, u);
      const pozo = (await kv.get("pozo")) ?? { total_custodia_centavos: 0, alumnos_activos: 0 };
      pozo.total_custodia_centavos += CUOTA.aportacion_centavos;
      pozo.alumnos_activos += 1;
      await kv.set("pozo", pozo);
    }
  }
  return pago;
}

app.get(`${P}/cuota`, (c) => c.json(CUOTA));

app.post(`${P}/pago/preferencia`, async (c) => {
  const u = await requireUser(c);
  if (u.estado === "activa")
    throw new HttpError("ya_activa", "Tu cuenta ya está activa. ¡No necesitas pagar de nuevo!", 409);
  const { return_url } = await body<{ return_url?: string }>(c);
  let retorno: URL;
  try {
    retorno = new URL(String(return_url));
    if (!/^https?:$/.test(retorno.protocol)) throw new Error();
  } catch {
    throw new HttpError("retorno_invalido", "No pudimos preparar el regreso a la app.");
  }
  const token = mpToken();
  const back = retorno.toString();
  const pref = await mp("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify({
      items: [
        {
          id: "garantia-semillas",
          title: "Garantía Semillas de Bondad",
          description: "Aportación de $10 al pozo común + $6 de comisión",
          quantity: 1,
          unit_price: CUOTA.total_centavos / 100,
          currency_id: "MXN",
        },
      ],
      external_reference: u.id,
      metadata: { usuario_id: u.id },
      back_urls: { success: back, pending: back, failure: back },
      // Mercado Pago only accepts auto_return with an https success URL.
      ...(retorno.protocol === "https:" ? { auto_return: "approved" } : {}),
      notification_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1${P}/pago/webhook`,
      statement_descriptor: "SEMILLAS FCA",
    }),
  });
  return c.json({
    preferencia_id: pref.id,
    init_point: token.startsWith("TEST-") ? (pref.sandbox_init_point ?? pref.init_point) : pref.init_point,
  });
});

app.post(`${P}/pago/confirmar`, async (c) => {
  const u = await requireUser(c);
  const i = await body<{ payment_id?: string | null; status?: string | null }>(c);
  const paymentId = i.payment_id && i.payment_id !== "null" ? String(i.payment_id) : null;
  if (!paymentId) {
    const previo = await kv.get(`pago:${u.id}`);
    if (previo) return c.json(previo);
    throw new HttpError(
      "pago_cancelado",
      "No se completó el pago en Mercado Pago. Puedes intentarlo de nuevo.",
    );
  }
  if (!/^\d+$/.test(paymentId)) throw new HttpError("pago_invalido", "El folio de pago no es válido.");
  const payment = await mp(`/v1/payments/${paymentId}`);
  if (payment.external_reference !== u.id)
    throw new HttpError("referencia", "El pago no corresponde a esta cuenta.", 403);
  return c.json(await procesarPago(payment));
});

app.get(`${P}/pago/mio`, async (c) => {
  const u = await requireUser(c);
  let pago = await kv.get(`pago:${u.id}`);
  // Recovery path when the webhook was missed: ask Mercado Pago directly.
  if (u.estado === "pendiente_pago" && Deno.env.get("MP_ACCESS_TOKEN") && pago?.estado !== "aprobado") {
    try {
      const r = await mp(
        `/v1/payments/search?external_reference=${encodeURIComponent(u.id)}&sort=date_created&criteria=desc&limit=10`,
      );
      // deno-lint-ignore no-explicit-any
      const results = (r?.results ?? []) as any[];
      const elegido = results.find((p) => p.status === "approved") ?? results[0];
      if (elegido) pago = await procesarPago(elegido);
    } catch (e) {
      console.log("No se pudo consultar pagos en Mercado Pago:", e);
    }
  }
  return c.json(pago ?? null);
});

/** Mercado Pago notifications (Webhooks / IPN). Always re-fetch the payment; never trust the body. */
app.post(`${P}/pago/webhook`, async (c) => {
  const q = c.req.query();
  // deno-lint-ignore no-explicit-any
  const b = (await c.req.json().catch(() => ({}))) as any;
  const tipo = q.type ?? q.topic ?? b?.type ?? b?.topic;
  const id = q["data.id"] ?? q.id ?? b?.data?.id;
  if (tipo === "payment" && id && /^\d+$/.test(String(id))) {
    try {
      await procesarPago(await mp(`/v1/payments/${id}`));
    } catch (e) {
      console.log(`Webhook: error procesando pago ${id}:`, e);
      return c.json({ ok: false }, 500);
    }
  }
  return c.json({ ok: true });
});

/* ------------------------------------------------------------------ */
/* Macetas                                                             */
/* ------------------------------------------------------------------ */

app.get(`${P}/plantas/mias`, async (c) => {
  const u = await requireUser(c);
  const ids = (await kv.getByPrefix(`creador:${u.id}:`)) as string[];
  if (!ids.length) return c.json([]);
  const plantas = (await kv.mget(ids.map((id) => `planta:${id}`))) as Planta[];
  return c.json(plantas.filter(Boolean).sort((a, b) => b.creada_en.localeCompare(a.creada_en)));
});

app.get(`${P}/plantas/:id`, async (c) => c.json(await getPlanta(c.req.param("id"))));

app.get(`${P}/plantas/:id/permisos`, async (c) => {
  const id = idPlanta(c.req.param("id"));
  const [u, p] = await Promise.all([usuarioOpcional(c), kv.get(`planta:${id}`) as Promise<Planta | undefined>]);
  if (!u || !p) return c.json({ es_creador: false, voto_emitido: null, reporte_emitido: null });
  const [voto, reporte] = await Promise.all([
    kv.get(`interaccion:${id}:${u.id}:voto`),
    kv.get(`interaccion:${id}:${u.id}:reporte`),
  ]);
  return c.json({
    es_creador: p.creadores.some((x) => x.usuario_id === u.id),
    voto_emitido: voto ?? null,
    reporte_emitido: reporte ?? null,
  });
});

async function validarCompanero(u: UsuarioDb, numero: string) {
  if (!/^\d{9}$/.test(numero))
    throw new HttpError("cuenta_invalida", "El número de cuenta debe tener 9 dígitos.");
  if (numero === u.numero_cuenta) throw new HttpError("eres_tu", "Ya estás incluido como creador.");
  const uid = (await kv.get(`cuenta:${numero}`)) as string | undefined;
  const otro = uid ? ((await kv.get(`usuario:${uid}`)) as UsuarioDb | undefined) : undefined;
  if (!otro)
    throw new HttpError(
      "no_encontrado",
      "No encontramos ese número de cuenta en el reto. Pídele que se registre primero.",
      404,
    );
  if (otro.estado !== "activa")
    throw new HttpError("no_activa", "Tu compañero aún no activa su cuenta.", 409);
  return otro;
}

app.post(`${P}/companeros/validar`, async (c) => {
  const u = await requireActive(c);
  const { numero_cuenta } = await body<{ numero_cuenta?: string }>(c);
  const otro = await validarCompanero(u, String(numero_cuenta ?? "").trim());
  return c.json({ numero_cuenta: otro.numero_cuenta, nickname: otro.nickname, carrera: otro.carrera });
});

app.post(`${P}/plantas`, async (c) => {
  const u = await requireActive(c);
  const i = await body<{ nombre?: string; companeros?: string[] }>(c);
  const nombre = String(i.nombre ?? "").trim().slice(0, 40);
  if (nombre.length < 3) throw new HttpError("nombre", "Ponle un nombre de al menos 3 letras.");
  const numeros = [...new Set((i.companeros ?? []).map((n) => String(n).trim()))];
  if (numeros.length > MAX_INTEGRANTES - 1)
    throw new HttpError("equipo", "El equipo es de máximo 3 integrantes.");
  const companeros = [];
  for (const n of numeros) companeros.push(await validarCompanero(u, n));

  let id = "";
  for (let intento = 0; intento < 20; intento++) {
    const candidato = `SB-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!(await kv.get(`planta:${candidato}`))) {
      id = candidato;
      break;
    }
  }
  if (!id) throw new HttpError("sin_folios", "No pudimos asignar un folio. Inténtalo de nuevo.", 503);

  const serie = ((await kv.get("contador:serie")) as number | undefined) ?? 1;
  await kv.set("contador:serie", serie + 1);

  const creadores = [u, ...companeros].map((x) => ({
    usuario_id: x.id,
    nickname: x.nickname,
    carrera: x.carrera,
  }));
  const planta: Planta = {
    id,
    nombre,
    no_diseno: 1 + Math.floor(Math.random() * 5),
    creadores,
    material: "100% Reciclado",
    sistema_autorriego: false,
    serie,
    serie_total: SERIE_TOTAL,
    puntaje_neto: 0,
    promedio_estrellas: 0,
    total_votos: 0,
    reportes_pendientes: sinReportes(),
    penalizaciones: [],
    estado: "en_revision",
    creada_en: now(),
  };
  await kv.mset(
    [`planta:${id}`, ...creadores.map((x) => `creador:${x.usuario_id}:${id}`)],
    [planta, ...creadores.map(() => id)],
  );
  await recalcularCreadores(planta);
  return c.json(planta, 201);
});

/* ------------------------------------------------------------------ */
/* Interacciones                                                       */
/* ------------------------------------------------------------------ */

app.post(`${P}/plantas/:id/votos`, async (c) => {
  const u = await requireVotante(c);
  const p = await getPlanta(c.req.param("id"));
  const { estrellas } = await body<{ estrellas?: number }>(c);
  if (!Number.isInteger(estrellas) || estrellas! < 1 || estrellas! > 5)
    throw new HttpError("estrellas", "Elige de 1 a 5 estrellas.");
  if (p.creadores.some((x) => x.usuario_id === u.id))
    throw new HttpError("creador", "No puedes calificar tu propia maceta.", 403);
  const key = `interaccion:${p.id}:${u.id}:voto`;
  if (await kv.get(key))
    throw new HttpError("ya_voto", "Ya calificaste esta maceta. Solo se permite 1 voto por cuenta.", 409);

  const it = {
    id: rid("i"),
    planta_id: p.id,
    usuario_id: u.id,
    tipo: "voto",
    estrellas,
    motivo: null,
    creada_en: now(),
  };
  p.promedio_estrellas =
    Math.round(((p.promedio_estrellas * p.total_votos + estrellas!) / (p.total_votos + 1)) * 10) / 10;
  p.total_votos += 1;
  p.puntaje_neto += estrellas!;
  if (p.estado === "en_revision" && p.total_votos >= VOTOS_PARA_VERIFICAR) p.estado = "verificada";
  u.total_votos_emitidos = (u.total_votos_emitidos ?? 0) + 1;

  await kv.mset(
    [key, `calificacion:${u.id}:${p.id}`, `planta:${p.id}`, `usuario:${u.id}`],
    [it, it, p, u],
  );
  await recalcularCreadores(p);
  return c.json(it, 201);
});

app.post(`${P}/plantas/:id/reportes`, async (c) => {
  const u = await requireActive(c);
  const p = await getPlanta(c.req.param("id"));
  const { motivo } = await body<{ motivo?: Motivo }>(c);
  if (!motivo || !(motivo in PENALIZACION))
    throw new HttpError("motivo", "Elige el motivo del reporte.");
  if (p.creadores.some((x) => x.usuario_id === u.id))
    throw new HttpError("creador", "No puedes reportar tu propia maceta.", 403);
  const key = `interaccion:${p.id}:${u.id}:reporte`;
  if (await kv.get(key))
    throw new HttpError("ya_reporto", "Ya enviaste un reporte para esta maceta.", 409);

  const it = {
    id: rid("i"),
    planta_id: p.id,
    usuario_id: u.id,
    tipo: "reporte",
    estrellas: null,
    motivo,
    creada_en: now(),
  };
  p.reportes_pendientes[motivo] = (p.reportes_pendientes[motivo] ?? 0) + 1;
  let penalizada = false;
  if (p.reportes_pendientes[motivo] >= UMBRAL_REPORTES) {
    const puntos = PENALIZACION[motivo];
    p.penalizaciones.push({ motivo, puntos, aplicada_en: now() });
    p.puntaje_neto += puntos;
    p.reportes_pendientes[motivo] = 0;
    p.estado = "penalizada";
    penalizada = true;
  }
  await kv.mset([key, `planta:${p.id}`], [it, p]);
  if (penalizada) await recalcularCreadores(p);
  return c.json(it, 201);
});

app.get(`${P}/calificaciones/mias`, async (c) => {
  const u = await requireUser(c);
  // deno-lint-ignore no-explicit-any
  const votos = (await kv.getByPrefix(`calificacion:${u.id}:`)) as any[];
  if (!votos.length) return c.json([]);
  const plantas = (await kv.mget(votos.map((v) => `planta:${v.planta_id}`))) as Planta[];
  const porId = new Map(plantas.filter(Boolean).map((p) => [p.id, p]));
  return c.json(
    votos
      .filter((v) => porId.has(v.planta_id))
      .sort((a, b) => b.creada_en.localeCompare(a.creada_en))
      .map((v) => {
        const p = porId.get(v.planta_id)!;
        return { ...v, planta: { id: p.id, nombre: p.nombre, no_diseno: p.no_diseno } };
      }),
  );
});

/* ------------------------------------------------------------------ */
/* Pozo y ranking                                                      */
/* ------------------------------------------------------------------ */

app.get(`${P}/pozo`, async (c) => {
  const pozo = (await kv.get("pozo")) ?? { total_custodia_centavos: 0, alumnos_activos: 0 };
  let config = await kv.get("config:reto");
  if (!config?.cierre_en) {
    // Default closing date; edit the `config:reto` KV row to set the official one.
    config = { cierre_en: new Date(Date.now() + 30 * DAY).toISOString() };
    await kv.set("config:reto", config);
  }
  return c.json({
    total_custodia_centavos: pozo.total_custodia_centavos,
    alumnos_activos: pozo.alumnos_activos,
    matricula_total: MATRICULA_TOTAL,
    cierre_en: config.cierre_en,
    actualizado_en: now(),
  });
});

const dia = (ms: number) => new Date(ms).toISOString().slice(0, 10);

app.get(`${P}/ranking`, async (c) => {
  const plantas = (await kv.getByPrefix("planta:")) as Planta[];
  const puntos: Record<Carrera, number> = {
    contaduria: 0,
    administracion: 0,
    informatica: 0,
    negocios_internacionales: 0,
  };
  // Each planter's points are split evenly among its creators' careers.
  for (const p of plantas)
    for (const cr of p.creadores)
      if (cr.carrera in puntos) puntos[cr.carrera] += p.puntaje_neto / Math.max(1, p.creadores.length);

  const iec = (k: Carrera) => Math.round((puntos[k] / MATRICULA[k]) * 10_000) / 10_000;
  const hoy = dia(Date.now());
  const actuales = Object.fromEntries(CARRERAS.map((k) => [k, iec(k)])) as Record<Carrera, number>;
  await kv.set(`snapshot:${hoy}`, actuales);
  const hace7 = (await kv.get(`snapshot:${dia(Date.now() - 7 * DAY)}`)) as
    | Record<Carrera, number>
    | undefined;

  const rows = CARRERAS.map((carrera) => ({
    carrera,
    puntaje_neto: Math.round(puntos[carrera]),
    matricula_oficial: MATRICULA[carrera],
    iec: actuales[carrera],
    posicion: 1,
    tendencia_semanal: hace7 ? Math.round((actuales[carrera] - (hace7[carrera] ?? 0)) * 10_000) / 10_000 : 0,
    actualizado_en: now(),
  }));
  rows.sort((a, b) => b.iec - a.iec || b.puntaje_neto - a.puntaje_neto).forEach((r, i) => (r.posicion = i + 1));
  return c.json(rows);
});

Deno.serve(app.fetch);
