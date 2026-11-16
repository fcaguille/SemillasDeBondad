import type { SemillasApi } from "@/services/api";
import { ApiError } from "@/lib/errors";
import type {
  CarreraStats, CompaneroValidado, CuotaEntrada, Interaccion, InteraccionConPlanta,
  PagoEscrow, PerfilUpdate, PermisosPlanta, Planta, PozoResumen, PreferenciaPago,
  ReporteInput, RetornoPagoInput, Sesion, Usuario, VotoInput, Carrera, NoDiseno,
} from "@/types/domain";
import { CARRERAS } from "@/types/domain";
import { supabase, emailDeCuenta } from "./supabaseClient";

type Row = Record<string, any>;
const fail = (message: string, status = 400): never => { throw new ApiError("supabase", message, status); };
function check<T>(data: T | null, error: { message: string; code?: string } | null): T {
  if (error) fail(error.message, error.code === "PGRST116" ? 404 : 400);
  return data as T;
}
const slugCarrera = (slug: string): Carrera =>
  (Object.keys(CARRERAS) as Carrera[]).includes(slug as Carrera) ? slug as Carrera : "contaduria";
const idCarrera = (c: Carrera) => ({ contaduria: 1, administracion: 2, informatica: 3, negocios_internacionales: 4 })[c];
const estadoCuenta = (s: string, descalificado: boolean): Usuario["estado"] =>
  descalificado ? "suspendida" : s === "ACTIVO" ? "activa" : "pendiente_pago";

function mapPlanta(row: Row): Planta {
  const creators = Array.isArray(row.creadores) ? row.creadores : [];
  return {
    id: row.id_planta,
    nombre: row.nombre_creacion,
    no_diseno: Math.min(5, Math.max(1, Number(row.no_diseno || 1))) as NoDiseno,
    creadores: creators.map((c: Row) => ({ usuario_id: c.usuario_id, nickname: c.nickname, carrera: slugCarrera(c.carrera) })),
    material: "Material reciclado",
    sistema_autorriego: false,
    serie: Number(row.serie || 0),
    serie_total: 500,
    puntaje_neto: Number(row.puntaje_neto || 0),
    promedio_estrellas: Number(row.promedio_estrellas || 0),
    total_votos: Number(row.total_votos || 0),
    reportes_pendientes: { sucia: 0, seca: 0, materiales_nuevos: 0 },
    penalizaciones: [],
    estado: row.estatus === "SANCIONADA" ? "penalizada" : row.estatus === "ANULADA" ? "en_revision" : "verificada",
    creada_en: row.creado_en,
  };
}
async function usuarioActual(): Promise<Usuario> {
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) fail("Tu sesión expiró. Inicia sesión de nuevo.", 401);
  const uid = auth.user.id;
  const profileResult = await supabase.from("perfiles_publicos").select("user_id,nickname,id_carrera,avatar_url,bio,estatus_pago,descalificado").eq("user_id", uid).single();
  const profile = check(profileResult.data, profileResult.error);
  const [plantas, votos] = await Promise.all([
    supabase.from("planta_creadores").select("id_planta", { count: "exact", head: true }).eq("user_id", uid),
    supabase.from("interacciones").select("id_interaccion", { count: "exact", head: true }).eq("evaluador_id", uid).eq("tipo", "CALIFICACION"),
  ]);
  const carrera = await supabase.from("carreras").select("slug").eq("id_carrera", profile.id_carrera).single();
  const metadata = auth.user.user_metadata ?? {};
  return {
    id: uid,
    numero_cuenta_enmascarado: String(metadata.no_cuenta ?? "").replace(/^(\d{3})\d+(\d{2})$/, "$1****$2") || "*********",
    nickname: profile.nickname,
    carrera: slugCarrera(carrera.data?.slug ?? "contaduria"),
    bio: profile.bio ?? null,
    avatar_url: profile.avatar_url ?? null,
    estado: estadoCuenta(profile.estatus_pago, profile.descalificado),
    amonestaciones: 0,
    puntos_aportados: 0,
    percentil_fca: 0,
    total_plantas: plantas.count ?? 0,
    total_votos_emitidos: votos.count ?? 0,
    creado_en: auth.user.created_at,
  };
}
async function sesionActual(): Promise<Sesion> {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session) fail("Tu sesión expiró. Inicia sesión de nuevo.", 401);
  return { token: session.access_token, usuario: await usuarioActual() };
}
async function plantaPorId(id: string): Promise<Planta | null> {
  const { data, error } = await supabase.from("plantas_publicas").select("*").eq("id_planta", id).maybeSingle();
  if (error) fail(error.message);
  return data ? mapPlanta(data) : null;
}
async function interaccionPropia(id: string, tipo: string): Promise<Interaccion | null> {
  const { data, error } = await supabase.from("interacciones").select("*").eq("id_planta", id).eq("tipo", tipo).maybeSingle();
  if (error && error.code !== "PGRST116") fail(error.message);
  return data ? {
    id: data.id_interaccion, planta_id: data.id_planta, usuario_id: data.evaluador_id,
    tipo: tipo === "CALIFICACION" ? "voto" : "reporte",
    estrellas: tipo === "CALIFICACION" ? data.valor_numerico : null,
    motivo: data.motivo_reporte, creada_en: data.creado_en,
  } : null;
}
const pagoNoDisponible = (): never => fail("La pasarela de pagos está en etapa final de activación. Por ahora puedes participar en Modo Gratuito.", 503);

export const supabaseApi: SemillasApi = {
  async obtenerSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    try { return await sesionActual(); }
    catch (e) { if (e instanceof ApiError && e.status === 401) { await supabase.auth.signOut({ scope: "local" }); return null; } throw e; }
  },
  async registrar(input) {
    if (!/^\d{9}$/.test(input.numero_cuenta)) fail("El número de cuenta debe tener 9 dígitos.");
    const carreraId = idCarrera(input.carrera);
    const { error } = await supabase.auth.signUp({
      email: emailDeCuenta(input.numero_cuenta),
      password: input.password,
      options: { data: { no_cuenta: input.numero_cuenta, nickname: input.nickname, id_carrera: carreraId, acepta_terminos: true } },
    });
    if (error) fail(error.message);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email: emailDeCuenta(input.numero_cuenta), password: input.password });
    if (loginError) fail("Tu cuenta se creó. Inicia sesión para continuar.", 401);
    return sesionActual();
  },
  async iniciarSesion(input) {
    if (!/^\d{9}$/.test(input.numero_cuenta)) fail("Número de cuenta o contraseña incorrectos.", 401);
    const { error } = await supabase.auth.signInWithPassword({ email: emailDeCuenta(input.numero_cuenta), password: input.password });
    if (error) fail("Número de cuenta o contraseña incorrectos.", 401);
    return sesionActual();
  },
  async cerrarSesion() { const { error } = await supabase.auth.signOut(); if (error) fail(error.message); },
  async actualizarPerfil(input: PerfilUpdate) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) fail("Inicia sesión para actualizar tu perfil.", 401);
    const { error } = await supabase.from("perfiles").update({ ...(input.nickname ? { nickname: input.nickname } : {}), ...(input.bio !== undefined ? { bio: input.bio } : {}) }).eq("user_id", user.id);
    if (error) fail(error.message);
    return usuarioActual();
  },
  async obtenerCuotaEntrada(): Promise<CuotaEntrada> { return { aportacion_centavos: 1000, comision_centavos: 600, total_centavos: 1600, moneda: "MXN" }; },
  async crearPreferenciaPago(): Promise<PreferenciaPago> { return pagoNoDisponible(); },
  async confirmarRetornoPago(_input: RetornoPagoInput): Promise<PagoEscrow> { return pagoNoDisponible(); },
  async obtenerMiPago(): Promise<PagoEscrow | null> { return null; },
  async listarMisPlantas() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) fail("Inicia sesión para consultar tus macetas.", 401);
    const { data: links, error } = await supabase.from("planta_creadores").select("id_planta").eq("user_id", user.id);
    if (error) fail(error.message);
    const ids = (links ?? []).map(x => x.id_planta);
    if (!ids.length) return [];
    const { data, error: e } = await supabase.from("plantas_publicas").select("*").in("id_planta", ids);
    if (e) fail(e.message);
    return (data ?? []).map(mapPlanta);
  },
  obtenerPlanta: plantaPorId,
  async obtenerPermisosPlanta(id: string): Promise<PermisosPlanta> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) fail("Inicia sesión para continuar.", 401);
    const { data: creators, error } = await supabase.from("planta_creadores").select("user_id").eq("id_planta", id).eq("user_id", user.id);
    if (error) fail(error.message);
    return { es_creador: !!creators?.length, voto_emitido: await interaccionPropia(id, "CALIFICACION"), reporte_emitido: await interaccionPropia(id, "REPORTE") };
  },
  async validarCompanero(termino: string): Promise<CompaneroValidado> {
    const { data, error } = await supabase.rpc("buscar_companeros", { p_termino: termino.trim() });
    if (error) fail(error.message);
    const found = (data ?? [])[0];
    if (!found) fail("No encontramos una cuenta activa con ese número o nickname.");
    const { data: carrera, error: carreraError } = await supabase.from("carreras").select("slug").eq("id_carrera", found.id_carrera).single();
    if (carreraError) fail(carreraError.message);
    return { user_id: found.user_id, numero_cuenta: "", nickname: found.nickname, carrera: slugCarrera(carrera.slug) } as CompaneroValidado;
  },
  async crearPlanta(input) {
    const { data, error } = await supabase.rpc("registrar_planta", { p_nombre_creacion: input.nombre, p_cuentas_equipo: input.companeros });
    if (error) fail(error.message);
    const raw = data as Row;
    const planta = await plantaPorId(raw.id_planta);
    if (!planta) fail("La maceta se registró, pero no pudimos cargar su carta.", 500);
    return planta;
  },
  async votar(input: VotoInput): Promise<Interaccion> {
    const { error } = await supabase.rpc("emitir_interaccion", { p_id_planta: input.planta_id, p_tipo: "CALIFICACION", p_valor: input.estrellas, p_motivo: null });
    if (error) fail(error.message);
    const value = await interaccionPropia(input.planta_id, "CALIFICACION");
    if (!value) fail("Tu voto se guardó, pero no pudimos confirmarlo.", 500);
    return value;
  },
  async reportar(input: ReporteInput): Promise<Interaccion> {
    const { error } = await supabase.rpc("emitir_interaccion", { p_id_planta: input.planta_id, p_tipo: "REPORTE", p_valor: null, p_motivo: input.motivo });
    if (error) fail(error.message);
    const value = await interaccionPropia(input.planta_id, "REPORTE");
    if (!value) fail("Tu reporte se guardó, pero no pudimos confirmarlo.", 500);
    return value;
  },
  async listarMisCalificaciones(): Promise<InteraccionConPlanta[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const { data, error } = await supabase.from("interacciones").select("*").eq("evaluador_id", user.id).order("creado_en", { ascending: false });
    if (error) fail(error.message);
    return Promise.all((data ?? []).map(async (r: Row) => {
      const planta = await plantaPorId(r.id_planta);
      if (!planta) fail("No pudimos cargar una maceta de tu historial.", 404);
      return {
        id: r.id_interaccion, planta_id: r.id_planta, usuario_id: r.evaluador_id,
        tipo: r.tipo === "CALIFICACION" ? "voto" as const : "reporte" as const,
        estrellas: r.tipo === "CALIFICACION" ? r.valor_numerico : null,
        motivo: r.motivo_reporte, creada_en: r.creado_en,
        planta: { id: planta.id, nombre: planta.nombre, no_diseno: planta.no_diseno },
      };
    }));
  },
  async obtenerPozo(): Promise<PozoResumen> {
    const { data, error } = await supabase.rpc("resumen_pozo");
    if (error) fail(error.message);
    return { total_custodia_centavos: Math.round(Number(data?.monto_neto_acumulado ?? 0) * 100), alumnos_activos: Number(data?.total_alumnos_activos ?? 0), matricula_total: 12000, cierre_en: "2027-11-30T23:59:59-06:00", actualizado_en: new Date().toISOString() };
  },
  async obtenerRankingCarreras(): Promise<CarreraStats[]> {
    const { data, error } = await supabase.from("ranking_carreras").select("*").order("posicion", { ascending: true });
    if (error) fail(error.message);
    return (data ?? []).map((r: Row) => ({
      carrera: slugCarrera(r.slug), puntaje_neto: Number(r.puntaje_total ?? 0),
      matricula_oficial: Number(r.matricula_oficial ?? 0), iec: Number(r.indice_ecosustentable ?? 0),
      posicion: Math.min(4, Math.max(1, Number(r.posicion || 4))) as CarreraStats["posicion"],
      tendencia_semanal: Number(r.tendencia_semanal ?? 0), actualizado_en: r.actualizado_en,
    }));
  },
};
