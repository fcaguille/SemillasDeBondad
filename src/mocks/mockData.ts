/**
 * MOCK LAYER — sample data + simulated backend handlers.
 *
 * Everything here is replaceable. The UI never imports this file directly:
 * it is wired only through `src/services/api.ts` (and the demo photo seeds in
 * `src/services/photos.ts`). Delete this file once real adapters exist.
 *
 * State persists in localStorage so the Mercado Pago redirect round-trip
 * (full page navigation) behaves like production.
 */
import type { SemillasApi } from "@/services/api";
import { ApiError } from "@/lib/errors";
import { externalReturnUrl } from "@/lib/utils";
import {
  CARRERAS,
  MAX_INTEGRANTES,
  MOTIVOS_REPORTE,
  UMBRAL_REPORTES,
  type Carrera,
  type CarreraStats,
  type FotoLocal,
  type Interaccion,
  type MotivoReporte,
  type NoDiseno,
  type PagoEscrow,
  type Planta,
  type PozoResumen,
  type Usuario,
} from "@/types/domain";

/* ------------------------------------------------------------------ */
/* Seed data                                                           */
/* ------------------------------------------------------------------ */

const DAY = 86_400_000;
const iso = (msAgo: number) => new Date(Date.now() - msAgo).toISOString();
const sinReportes = (): Record<MotivoReporte, number> => ({
  sucia: 0,
  seca: 0,
  materiales_nuevos: 0,
});

export const DEMO_NUMERO_CUENTA = "319048291";

function seedUsuarios(): Record<string, Usuario & { numero_cuenta: string }> {
  const base = {
    bio: null,
    avatar_url: null,
    estado: "activa" as const,
    amonestaciones: 0,
    puntos_aportados: 0,
    percentil_fca: 50,
    total_plantas: 0,
    total_votos_emitidos: 0,
    creado_en: iso(40 * DAY),
  };
  return {
    u_eco: {
      ...base,
      id: "u_eco",
      numero_cuenta: DEMO_NUMERO_CUENTA,
      numero_cuenta_enmascarado: "319****91",
      nickname: "@EcoContador_26",
      carrera: "contaduria",
      bio: "Construyendo áreas verdes en el edificio J 🌱",
      puntos_aportados: 148,
      percentil_fca: 12,
      total_plantas: 4,
      total_votos_emitidos: 12,
    },
    u_solar: {
      ...base,
      id: "u_solar",
      numero_cuenta: "320115874",
      numero_cuenta_enmascarado: "320****74",
      nickname: "@AdminSolar",
      carrera: "administracion",
    },
    u_bit: {
      ...base,
      id: "u_bit",
      numero_cuenta: "318772045",
      numero_cuenta_enmascarado: "318****45",
      nickname: "@BitVerde",
      carrera: "informatica",
    },
    u_roots: {
      ...base,
      id: "u_roots",
      numero_cuenta: "321440912",
      numero_cuenta_enmascarado: "321****12",
      nickname: "@GlobalRoots",
      carrera: "negocios_internacionales",
    },
  };
}

const ref = (u: Usuario) => ({ usuario_id: u.id, nickname: u.nickname, carrera: u.carrera });

function seedPlantas(us: ReturnType<typeof seedUsuarios>): Record<string, Planta> {
  const p = (
    id: string,
    nombre: string,
    no_diseno: NoDiseno,
    creadores: Usuario[],
    puntaje_neto: number,
    promedio_estrellas: number,
    total_votos: number,
    serie: number,
    daysAgo: number,
    extra: Partial<Planta> = {},
  ): Planta => ({
    id,
    nombre,
    no_diseno,
    creadores: creadores.map(ref),
    material: "100% Reciclado",
    sistema_autorriego: no_diseno === 3,
    serie,
    serie_total: 500,
    puntaje_neto,
    promedio_estrellas,
    total_votos,
    reportes_pendientes: sinReportes(),
    penalizaciones: [],
    estado: "verificada",
    creada_en: iso(daysAgo * DAY),
    ...extra,
  });
  const { u_eco, u_solar, u_bit, u_roots } = us;
  const list = [
    p("SB-8492", "La Capibara Verde", 3, [u_eco, u_solar], 48, 4.9, 31, 42, 2, {
      reportes_pendientes: { sucia: 2, seca: 0, materiales_nuevos: 0 },
    }),
    p("SB-7310", "Suculenta Godín", 2, [u_eco], 42, 4.9, 27, 31, 8),
    p("SB-7788", "Cempasúchil Contable", 4, [u_eco], 36, 4.7, 22, 36, 13),
    p("SB-6954", "Nopal de Balance", 1, [u_eco], 22, 4.4, 15, 19, 26),
    p("SB-9104", "Helecho Binario", 5, [u_bit], 39, 4.6, 24, 58, 1),
    p("SB-9021", "Nopalito Godín", 1, [u_bit], 33, 4.5, 20, 55, 3),
    p("SB-8833", "Helecho Fiscal", 5, [u_roots], 29, 4.2, 18, 49, 6),
    p("SB-8410", "Rosa del Edificio J", 2, [u_solar], 44, 4.8, 26, 44, 9),
    p("SB-8077", "Flor de Balance", 4, [u_bit, u_roots], 17, 3.9, 14, 40, 12),
  ];
  return Object.fromEntries(list.map((x) => [x.id, x]));
}

function seedInteracciones(): Interaccion[] {
  const v = (
    id: string,
    planta_id: string,
    estrellas: 1 | 2 | 3 | 4 | 5,
    msAgo: number,
  ): Interaccion => ({
    id,
    planta_id,
    usuario_id: "u_eco",
    tipo: "voto",
    estrellas,
    motivo: null,
    creada_en: iso(msAgo),
  });
  return [
    v("i_1", "SB-9021", 5, 2 * 3_600_000),
    v("i_2", "SB-8833", 4, DAY + 3_600_000),
    v("i_3", "SB-8410", 5, 3 * DAY),
    v("i_4", "SB-8077", 3, 6 * DAY),
  ];
}

/** Official enrolment per career (matrícula base, auditable on GitHub). */
const MATRICULA: Record<Carrera, number> = {
  informatica: 1850,
  contaduria: 4900,
  negocios_internacionales: 1750,
  administracion: 3500,
};
const PUNTAJE_BASE: Record<Carrera, number> = {
  informatica: 1554,
  contaduria: 3871,
  negocios_internacionales: 1243,
  administracion: 2380,
};
const TENDENCIA: Record<Carrera, number> = {
  informatica: 0.01,
  contaduria: 0.03,
  negocios_internacionales: -0.01,
  administracion: 0.02,
};

export const CUOTA_ENTRADA = {
  aportacion_centavos: 1000,
  comision_centavos: 600,
  total_centavos: 1600,
  moneda: "MXN" as const,
};

/** Remote sample photos used to pre-populate the local history grid in demo mode. */
const u = (id: string) =>
  `https://images.unsplash.com/${id}?crop=entropy&cs=tinysrgb&fit=crop&fm=jpg&q=80&w=600&h=750`;
export const FOTOS_DEMO: FotoLocal[] = [
  {
    id: "demo_1",
    planta_id: "SB-8492",
    creada_en: iso(2 * DAY),
    tamano_bytes: 812_000,
    url: u("photo-1598940823160-988e05a14ad7"),
  },
  {
    id: "demo_2",
    planta_id: "SB-7310",
    creada_en: iso(8 * DAY),
    tamano_bytes: 690_000,
    url: u("photo-1586739413875-34cb56c2efcc"),
  },
  {
    id: "demo_3",
    planta_id: "SB-7788",
    creada_en: iso(13 * DAY),
    tamano_bytes: 734_000,
    url: u("photo-1614495504644-595e8ae9418c"),
  },
  {
    id: "demo_4",
    planta_id: "SB-6954",
    creada_en: iso(26 * DAY),
    tamano_bytes: 655_000,
    url: u("photo-1625225230517-7426c1be750c"),
  },
  {
    id: "demo_5",
    planta_id: "SB-6954",
    creada_en: iso(27 * DAY),
    tamano_bytes: 702_000,
    url: u("photo-1791480727359-f6cd9f850182"),
  },
  {
    id: "demo_6",
    planta_id: "SB-7310",
    creada_en: iso(30 * DAY),
    tamano_bytes: 640_000,
    url: u("photo-1771237803700-3f6d83260d7b"),
  },
];

/* ------------------------------------------------------------------ */
/* In-memory DB persisted to localStorage                              */
/* ------------------------------------------------------------------ */

interface MockDb {
  version: number;
  usuarios: ReturnType<typeof seedUsuarios>;
  plantas: Record<string, Planta>;
  interacciones: Interaccion[];
  pagos: Record<string, PagoEscrow>;
  pozo: PozoResumen;
  sesionUsuarioId: string | null;
}

const KEY = "sdb.mock.db";
const VERSION = 4;

function seed(): MockDb {
  const usuarios = seedUsuarios();
  return {
    version: VERSION,
    usuarios,
    plantas: seedPlantas(usuarios),
    interacciones: seedInteracciones(),
    pagos: {
      u_eco: {
        id: "pay_9921",
        usuario_id: "u_eco",
        folio: "MP-9921",
        ...CUOTA_ENTRADA,
        estado: "aprobado",
        pagado_en: iso(40 * DAY),
      },
    },
    pozo: {
      total_custodia_centavos: 4832 * 1000,
      alumnos_activos: 4832,
      matricula_total: 12000,
      cierre_en: new Date(Date.now() + 14 * DAY + 6 * 3_600_000).toISOString(),
      actualizado_en: new Date().toISOString(),
    },
    sesionUsuarioId: null,
  };
}

function load(): MockDb {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MockDb;
      if (parsed.version === VERSION) return parsed;
    }
  } catch {
    /* ignore corrupted storage */
  }
  return seed();
}

let db = load();

/** Dev helper: append ?mockLogin=u_eco to any URL to start signed-in as the demo user. */
if (typeof window !== "undefined") {
  const as = new URLSearchParams(window.location.search).get("mockLogin");
  if (as && db.usuarios[as]) db.sesionUsuarioId = as;
}

const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    /* storage full / private mode */
  }
};

export function resetMockDb() {
  db = seed();
  save();
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const latency = (ms = 450) => new Promise((r) => setTimeout(r, ms + Math.random() * 250));
const clone = <T>(x: T): T => structuredClone(x);
const publicUser = (x: Usuario & { numero_cuenta: string }): Usuario => {
  const { numero_cuenta: _omit, ...rest } = x;
  return clone(rest);
};
const mask = (n: string) => `${n.slice(0, 3)}****${n.slice(-2)}`;
const rid = (p: string) => `${p}_${Math.random().toString(36).slice(2, 9)}`;

function requireUser() {
  const id = db.sesionUsuarioId;
  const usr = id ? db.usuarios[id] : null;
  if (!usr) throw new ApiError("no_autenticado", "Tu sesión expiró. Inicia sesión de nuevo.", 401);
  return usr;
}
function requireActive() {
  const usr = requireUser();
  if (usr.estado !== "activa")
    throw new ApiError(
      "pago_pendiente",
      "Modo Gratuito: activa tu garantía ($16 MXN) para crear macetas y levantar reportes.",
      402,
    );
  return usr;
}
function recalcUser(usrId: string) {
  const usr = db.usuarios[usrId];
  const mias = Object.values(db.plantas).filter((p) =>
    p.creadores.some((c) => c.usuario_id === usrId),
  );
  usr.total_plantas = mias.length;
  usr.puntos_aportados = Math.round(
    mias.reduce((s, p) => s + p.puntaje_neto / p.creadores.length, 0),
  );
}

/* ------------------------------------------------------------------ */
/* Simulated API                                                       */
/* ------------------------------------------------------------------ */

export const mockApi: SemillasApi = {
  async obtenerSesion() {
    await latency(200);
    const id = db.sesionUsuarioId;
    return id && db.usuarios[id]
      ? { token: `mock.${id}`, usuario: publicUser(db.usuarios[id]) }
      : null;
  },

  async registrar(input) {
    await latency();
    if (!/^\d{9}$/.test(input.numero_cuenta))
      throw new ApiError("cuenta_invalida", "El número de cuenta debe tener 9 dígitos.");
    if (Object.values(db.usuarios).some((x) => x.numero_cuenta === input.numero_cuenta))
      throw new ApiError(
        "cuenta_duplicada",
        "Ese número de cuenta ya está registrado. Inicia sesión.",
      );
    const nick = input.nickname.startsWith("@") ? input.nickname : `@${input.nickname}`;
    if (Object.values(db.usuarios).some((x) => x.nickname.toLowerCase() === nick.toLowerCase()))
      throw new ApiError("nickname_ocupado", "Ese nickname ya está ocupado. Prueba otro.");
    const id = rid("u");
    db.usuarios[id] = {
      id,
      numero_cuenta: input.numero_cuenta,
      numero_cuenta_enmascarado: mask(input.numero_cuenta),
      nickname: nick,
      carrera: input.carrera,
      bio: null,
      avatar_url: null,
      estado: "pendiente_pago",
      amonestaciones: 0,
      puntos_aportados: 0,
      percentil_fca: 100,
      total_plantas: 0,
      total_votos_emitidos: 0,
      creado_en: new Date().toISOString(),
    };
    db.sesionUsuarioId = id;
    save();
    return { token: `mock.${id}`, usuario: publicUser(db.usuarios[id]) };
  },

  async iniciarSesion(input) {
    await latency();
    const usr = Object.values(db.usuarios).find((x) => x.numero_cuenta === input.numero_cuenta);
    if (!usr || input.password.length < 6)
      throw new ApiError("credenciales", "Número de cuenta o contraseña incorrectos.", 401);
    db.sesionUsuarioId = usr.id;
    save();
    return { token: `mock.${usr.id}`, usuario: publicUser(usr) };
  },

  async cerrarSesion() {
    await latency(200);
    db.sesionUsuarioId = null;
    save();
  },

  async actualizarPerfil(input) {
    await latency();
    const usr = requireUser();
    if (input.nickname !== undefined) {
      const nick = input.nickname.startsWith("@") ? input.nickname : `@${input.nickname}`;
      if (!/^@[\w.]{3,20}$/.test(nick))
        throw new ApiError(
          "nickname_invalido",
          "Usa de 3 a 20 letras, números, punto o guion bajo.",
        );
      usr.nickname = nick;
    }
    if (input.bio !== undefined) usr.bio = input.bio?.slice(0, 80) || null;
    save();
    return publicUser(usr);
  },

  async obtenerCuotaEntrada() {
    await latency(150);
    return { ...CUOTA_ENTRADA };
  },

  async crearPreferenciaPago() {
    await latency(700);
    const usr = requireUser();
    const preferencia_id = rid("pref");
    const folio = `MP-${Math.floor(1000 + Math.random() * 9000)}`;
    // Real backend: POST https://api.mercadopago.com/checkout/preferences and return init_point.
    const init_point = externalReturnUrl("pago/retorno", {
      status: "approved",
      payment_id: folio,
      external_reference: usr.id,
      preference_id: preferencia_id,
    });
    return { preferencia_id, init_point };
  },

  async confirmarRetornoPago(input) {
    await latency(900);
    const usr = requireUser();
    if (input.external_reference && input.external_reference !== usr.id)
      throw new ApiError("referencia", "El pago no corresponde a esta cuenta.");
    const aprobado = input.status === "approved";
    const pago: PagoEscrow = {
      id: rid("pay"),
      usuario_id: usr.id,
      folio: input.payment_id ?? rid("MP"),
      ...CUOTA_ENTRADA,
      estado: aprobado ? "aprobado" : input.status === "pending" ? "pendiente" : "rechazado",
      pagado_en: aprobado ? new Date().toISOString() : null,
    };
    db.pagos[usr.id] = pago;
    if (aprobado && usr.estado === "pendiente_pago") {
      usr.estado = "activa";
      db.pozo.alumnos_activos += 1;
      db.pozo.total_custodia_centavos += CUOTA_ENTRADA.aportacion_centavos;
    }
    save();
    return clone(pago);
  },

  async obtenerMiPago() {
    await latency(200);
    const usr = requireUser();
    return db.pagos[usr.id] ? clone(db.pagos[usr.id]) : null;
  },

  async listarMisPlantas() {
    await latency();
    const usr = requireUser();
    return clone(
      Object.values(db.plantas)
        .filter((p) => p.creadores.some((c) => c.usuario_id === usr.id))
        .sort((a, b) => b.creada_en.localeCompare(a.creada_en)),
    );
  },

  async obtenerPlanta(id) {
    await latency(350);
    const p = db.plantas[id.toUpperCase().replace(/^#/, "")];
    return p ? clone(p) : null;
  },

  async obtenerPermisosPlanta(id) {
    await latency(200);
    const uid = db.sesionUsuarioId;
    const p = db.plantas[id];
    if (!uid || !p) return { es_creador: false, voto_emitido: null, reporte_emitido: null };
    const mine = db.interacciones.filter((i) => i.planta_id === id && i.usuario_id === uid);
    return {
      es_creador: p.creadores.some((c) => c.usuario_id === uid),
      voto_emitido: clone(mine.find((i) => i.tipo === "voto") ?? null),
      reporte_emitido: clone(mine.find((i) => i.tipo === "reporte") ?? null),
    };
  },

  async validarCompanero(numeroCuenta) {
    await latency(400);
    const usr = requireActive();
    if (!/^\d{9}$/.test(numeroCuenta))
      throw new ApiError("cuenta_invalida", "El número de cuenta debe tener 9 dígitos.");
    if (numeroCuenta === usr.numero_cuenta)
      throw new ApiError("eres_tu", "Ya estás incluido como creador.");
    const found = Object.values(db.usuarios).find((x) => x.numero_cuenta === numeroCuenta);
    if (found) {
      if (found.estado !== "activa")
        throw new ApiError("no_activa", "Tu compañero aún no activa su cuenta.");
      return { numero_cuenta: numeroCuenta, nickname: found.nickname, carrera: found.carrera };
    }
    if (numeroCuenta.startsWith("0"))
      throw new ApiError("no_encontrado", "No encontramos ese número de cuenta en el reto.");
    const carreras = Object.keys(CARRERAS) as Carrera[];
    return {
      numero_cuenta: numeroCuenta,
      nickname: `@Alumno_${numeroCuenta.slice(-4)}`,
      carrera: carreras[Number(numeroCuenta.at(-1)) % carreras.length],
    };
  },

  async crearPlanta(input) {
    await latency(900);
    const usr = requireActive();
    const nombre = input.nombre.trim();
    if (nombre.length < 3) throw new ApiError("nombre", "Ponle un nombre de al menos 3 letras.");
    if (input.companeros.length > MAX_INTEGRANTES - 1)
      throw new ApiError("equipo", "El equipo es de máximo 3 integrantes.");
    const companeros = await Promise.all(input.companeros.map((n) => mockApi.validarCompanero(n)));
    let id = "";
    do id = `SB-${Math.floor(1000 + Math.random() * 9000)}`;
    while (db.plantas[id]);
    const planta: Planta = {
      id,
      nombre,
      no_diseno: (1 + Math.floor(Math.random() * 5)) as NoDiseno,
      creadores: [
        ref(usr),
        ...companeros.map((c) => {
          const known = Object.values(db.usuarios).find((x) => x.numero_cuenta === c.numero_cuenta);
          return {
            usuario_id: known?.id ?? `ext_${c.numero_cuenta}`,
            nickname: c.nickname,
            carrera: c.carrera,
          };
        }),
      ],
      material: "100% Reciclado",
      sistema_autorriego: false,
      serie: Object.keys(db.plantas).length + 34,
      serie_total: 500,
      puntaje_neto: 0,
      promedio_estrellas: 0,
      total_votos: 0,
      reportes_pendientes: sinReportes(),
      penalizaciones: [],
      estado: "en_revision",
      creada_en: new Date().toISOString(),
    };
    db.plantas[id] = planta;
    recalcUser(usr.id);
    save();
    return clone(planta);
  },

  async votar({ planta_id, estrellas }) {
    await latency();
    // Free tier ("Modo Gratuito"): any signed-in, non-suspended account may vote.
    const usr = requireUser();
    if (usr.estado === "suspendida")
      throw new ApiError("suspendida", "Tu cuenta está suspendida.", 403);
    const p = db.plantas[planta_id];
    if (!p) throw new ApiError("no_encontrada", "Esta maceta no existe.", 404);
    if (p.creadores.some((c) => c.usuario_id === usr.id))
      throw new ApiError("creador", "No puedes calificar tu propia maceta.", 403);
    if (
      db.interacciones.some(
        (i) => i.planta_id === planta_id && i.usuario_id === usr.id && i.tipo === "voto",
      )
    )
      throw new ApiError(
        "ya_voto",
        "Ya calificaste esta maceta. Solo se permite 1 voto por cuenta.",
        409,
      );
    const it: Interaccion = {
      id: rid("i"),
      planta_id,
      usuario_id: usr.id,
      tipo: "voto",
      estrellas,
      motivo: null,
      creada_en: new Date().toISOString(),
    };
    db.interacciones.push(it);
    p.promedio_estrellas =
      Math.round(((p.promedio_estrellas * p.total_votos + estrellas) / (p.total_votos + 1)) * 10) /
      10;
    p.total_votos += 1;
    p.puntaje_neto += estrellas; // Scoring is server-authoritative in production.
    usr.total_votos_emitidos += 1;
    p.creadores.forEach((c) => db.usuarios[c.usuario_id] && recalcUser(c.usuario_id));
    save();
    return clone(it);
  },

  async reportar({ planta_id, motivo }) {
    await latency();
    const usr = requireActive();
    const p = db.plantas[planta_id];
    if (!p) throw new ApiError("no_encontrada", "Esta maceta no existe.", 404);
    if (p.creadores.some((c) => c.usuario_id === usr.id))
      throw new ApiError("creador", "No puedes reportar tu propia maceta.", 403);
    if (
      db.interacciones.some(
        (i) => i.planta_id === planta_id && i.usuario_id === usr.id && i.tipo === "reporte",
      )
    )
      throw new ApiError("ya_reporto", "Ya enviaste un reporte para esta maceta.", 409);
    const it: Interaccion = {
      id: rid("i"),
      planta_id,
      usuario_id: usr.id,
      tipo: "reporte",
      estrellas: null,
      motivo,
      creada_en: new Date().toISOString(),
    };
    db.interacciones.push(it);
    p.reportes_pendientes[motivo] += 1;
    if (p.reportes_pendientes[motivo] >= UMBRAL_REPORTES) {
      const puntos = MOTIVOS_REPORTE[motivo].penalizacion;
      p.penalizaciones.push({ motivo, puntos, aplicada_en: new Date().toISOString() });
      p.puntaje_neto += puntos;
      p.reportes_pendientes[motivo] = 0;
      p.estado = "penalizada";
    }
    save();
    return clone(it);
  },

  async listarMisCalificaciones() {
    await latency();
    const usr = requireUser();
    return db.interacciones
      .filter((i) => i.usuario_id === usr.id && i.tipo === "voto")
      .sort((a, b) => b.creada_en.localeCompare(a.creada_en))
      .map((i) => {
        const p = db.plantas[i.planta_id];
        return { ...clone(i), planta: { id: p.id, nombre: p.nombre, no_diseno: p.no_diseno } };
      });
  },

  async obtenerPozo() {
    await latency(250);
    // Simulate live sign-ups.
    const nuevos = Math.random() < 0.35 ? 1 : 0;
    db.pozo.alumnos_activos += nuevos;
    db.pozo.total_custodia_centavos += nuevos * CUOTA_ENTRADA.aportacion_centavos;
    db.pozo.actualizado_en = new Date().toISOString();
    save();
    return clone(db.pozo);
  },

  async obtenerRankingCarreras() {
    await latency(400);
    const extra: Record<Carrera, number> = {
      contaduria: 0,
      administracion: 0,
      informatica: 0,
      negocios_internacionales: 0,
    };
    // Live planter points flow into each career, split evenly among creators.
    for (const p of Object.values(db.plantas))
      for (const c of p.creadores) extra[c.carrera] += p.puntaje_neto / p.creadores.length / 40;
    const rows = (Object.keys(MATRICULA) as Carrera[]).map((carrera) => {
      const puntaje_neto = Math.round(PUNTAJE_BASE[carrera] + extra[carrera] - 5);
      return {
        carrera,
        puntaje_neto,
        matricula_oficial: MATRICULA[carrera],
        iec: Math.round((puntaje_neto / MATRICULA[carrera]) * 100) / 100,
        posicion: 1,
        tendencia_semanal: TENDENCIA[carrera],
        actualizado_en: new Date().toISOString(),
      } as CarreraStats;
    });
    rows
      .sort((a, b) => b.iec - a.iec)
      .forEach((r, i) => (r.posicion = (i + 1) as CarreraStats["posicion"]));
    return rows;
  },
};
