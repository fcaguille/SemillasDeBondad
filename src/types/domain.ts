/**
 * Semillas de Bondad — domain contracts.
 *
 * These interfaces describe the JSON the backend (Cloudflare Workers/D1, Convex)
 * must return. Field names are snake_case to mirror D1 columns. Money is always
 * an integer amount of centavos (MXN × 100) to avoid floating point errors.
 * Dates are ISO-8601 strings in UTC.
 */

/* ------------------------------------------------------------------ */
/* Catalogs                                                            */
/* ------------------------------------------------------------------ */

export type Carrera = "contaduria" | "administracion" | "informatica" | "negocios_internacionales";

export const CARRERAS: Record<Carrera, { nombre: string; corto: string; licenciatura: string }> = {
  contaduria: { nombre: "Contaduría", corto: "Contaduría", licenciatura: "Lic. en Contaduría" },
  administracion: {
    nombre: "Administración",
    corto: "Administración",
    licenciatura: "Lic. en Administración",
  },
  informatica: { nombre: "Informática", corto: "Informática", licenciatura: "Lic. en Informática" },
  negocios_internacionales: {
    nombre: "Negocios Internacionales",
    corto: "Negocios Int.",
    licenciatura: "Lic. en Negocios Internacionales",
  },
};

/** Botanical archetype assigned at random when a planter is registered. */
export type NoDiseno = 1 | 2 | 3 | 4 | 5;

export type MotivoReporte = "sucia" | "seca" | "materiales_nuevos";

export const MOTIVOS_REPORTE: Record<MotivoReporte, { etiqueta: string; penalizacion: number }> = {
  sucia: { etiqueta: "Maceta sucia o con basura externa", penalizacion: -10 },
  seca: { etiqueta: "Planta seca o en abandono total", penalizacion: -15 },
  materiales_nuevos: { etiqueta: "Usa materiales nuevos / no reciclables", penalizacion: -25 },
};

/** Unique reports required before a penalty is applied. */
export const UMBRAL_REPORTES = 5;
/** Max members per planter team (creator included). */
export const MAX_INTEGRANTES = 3;

/* ------------------------------------------------------------------ */
/* Entities                                                            */
/* ------------------------------------------------------------------ */

/**
 * - pendiente_pago: "Modo Gratuito" — can browse and rate (vote) planters.
 * - activa: escrow paid — can also create planters, file reports and compete for the pool.
 */
export type EstadoCuenta = "pendiente_pago" | "activa" | "suspendida";

/** True when the $16 MXN activation payment is approved (full access). */
export const tieneGarantia = (u: Pick<Usuario, "estado"> | null | undefined) =>
  u?.estado === "activa";
/** True for any signed-in account allowed to rate planters (free or paid). */
export const puedeVotar = (u: Pick<Usuario, "estado"> | null | undefined) =>
  !!u && u.estado !== "suspendida";

export interface Usuario {
  id: string;
  /** Never sent in clear text to other users. The owner receives only the masked value. */
  numero_cuenta_enmascarado: string; // "319****91"
  nickname: string; // "@EcoContador_26"
  carrera: Carrera;
  bio: string | null;
  avatar_url: string | null;
  estado: EstadoCuenta;
  descalificado?: boolean;
  motivo_descalificacion?: string | null;
  amonestaciones: number;
  /** Net points this user has contributed to their career. */
  puntos_aportados: number;
  /** 0–100. "Top 12% FCA" => 12 */
  percentil_fca: number;
  total_plantas: number;
  total_votos_emitidos: number;
  creado_en: string;
}

export interface CreadorRef {
  usuario_id: string;
  nickname: string;
  carrera: Carrera;
}

export type EstadoPlanta = "verificada" | "en_revision" | "penalizada";

export interface Penalizacion {
  motivo: MotivoReporte;
  puntos: number; // negative
  aplicada_en: string;
}

export interface Planta {
  id: string; // "SB-8492" — also the QR slug: /p/SB-8492
  nombre: string;
  no_diseno: NoDiseno;
  creadores: CreadorRef[];
  material: string; // "100% Reciclado"
  sistema_autorriego: boolean;
  /** Serial within the edition, e.g. 42 of 500 */
  serie: number;
  serie_total: number;
  puntaje_neto: number;
  promedio_estrellas: number; // 0–5, one decimal
  total_votos: number;
  /** Unique pending reports grouped by reason (resets when a penalty is applied). */
  reportes_pendientes: Record<MotivoReporte, number>;
  penalizaciones: Penalizacion[];
  estado: EstadoPlanta;
  creada_en: string;
}

export type TipoInteraccion = "voto" | "reporte";

export interface Interaccion {
  id: string;
  planta_id: string;
  usuario_id: string;
  tipo: TipoInteraccion;
  estrellas: 1 | 2 | 3 | 4 | 5 | null; // only for "voto"
  motivo: MotivoReporte | null; // only for "reporte"
  creada_en: string;
}

/** Interaction joined with the minimum planter data needed for history lists. */
export interface InteraccionConPlanta extends Interaccion {
  planta: Pick<Planta, "id" | "nombre" | "no_diseno">;
}

export interface CarreraStats {
  carrera: Carrera;
  puntaje_neto: number;
  matricula_oficial: number;
  /** Índice Ecosustentable Proporcional = puntaje_neto / matricula_oficial */
  iec: number;
  posicion: 1 | 2 | 3 | 4;
  /** Delta of IEc vs. 7 days ago */
  tendencia_semanal: number;
  actualizado_en: string;
}

export type EstadoPago = "pendiente" | "aprobado" | "rechazado" | "reembolsado";

export interface PagoEscrow {
  id: string;
  usuario_id: string;
  folio: string; // "MP-9921" (Mercado Pago payment_id or internal folio)
  aportacion_centavos: number; // 1000
  total_centavos: number; // 1600
  moneda: "MXN";
  estado: EstadoPago;
  pagado_en: string | null;
}

export interface PozoResumen {
  total_custodia_centavos: number;
  alumnos_activos: number;
  /** Total FCA enrolment used as participation goal (≈12,000) */
  matricula_total: number;
  cierre_en: string;
  actualizado_en: string;
}

/** Evidence photo — lives ONLY on the device (IndexedDB). Never uploaded. */
export interface FotoLocal {
  id: string;
  planta_id: string;
  creada_en: string;
  tamano_bytes: number;
  /** Object URL (IndexedDB blob) or remote URL for demo seeds. */
  url: string;
  blob?: Blob;
}

/* ------------------------------------------------------------------ */
/* Inputs / outputs                                                    */
/* ------------------------------------------------------------------ */

export interface CuotaEntrada {
  aportacion_centavos: number;
  total_centavos: number;
  moneda: "MXN";
}

export interface RegistroInput {
  numero_cuenta: string; // 9 digits
  carrera: Carrera;
  nickname: string;
  password: string;
  acepta_terminos: true;
}

export interface LoginInput {
  numero_cuenta: string;
  password: string;
}

export interface Sesion {
  token: string;
  usuario: Usuario;
}

/** Mercado Pago Checkout Pro preference created server-side. */
export interface PreferenciaPago {
  preferencia_id: string;
  /** Redirect the browser here (Checkout Pro). */
  init_point: string;
}

export interface RetornoPagoInput {
  /** Query params Mercado Pago appends to back_urls */
  payment_id: string | null;
  status: string | null; // approved | pending | rejected
  external_reference: string | null;
  preference_id: string | null;
}

export interface CrearPlantaInput {
  nombre: string;
  /** 9-digit account numbers of teammates (creator excluded). */
  companeros: string[];
}

export interface CompaneroValidado {
  user_id?: string;
  /** Se conserva vacío: la búsqueda pública nunca devuelve matrículas. */
  numero_cuenta: string;
  nickname: string;
  carrera: Carrera;
}

export interface VotoInput {
  planta_id: string;
  estrellas: 1 | 2 | 3 | 4 | 5;
}

export interface ReporteInput {
  planta_id: string;
  motivo: MotivoReporte;
}

/** What the current viewer is allowed to do on a planter page. */
export interface PermisosPlanta {
  es_creador: boolean;
  voto_emitido: Interaccion | null;
  reporte_emitido: Interaccion | null;
}

export interface PerfilUpdate {
  nickname?: string;
  bio?: string | null;
}
