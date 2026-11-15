import type {
  CarreraStats,
  CompaneroValidado,
  CrearPlantaInput,
  CuotaEntrada,
  Interaccion,
  InteraccionConPlanta,
  LoginInput,
  PagoEscrow,
  PerfilUpdate,
  PermisosPlanta,
  Planta,
  PozoResumen,
  PreferenciaPago,
  RegistroInput,
  ReporteInput,
  RetornoPagoInput,
  Sesion,
  Usuario,
  VotoInput,
} from "@/types/domain";
import { mockApi } from "@/mocks/mockData";
import { USE_MOCKS } from "./config";
import { supabaseApi } from "./supabaseApi";

/**
 * The single contract between the UI and any backend.
 *
 * Swap point #1 (REST / Workers): implement this interface with fetch() calls
 * and export it as `api` below. Every hook in src/hooks/useSemillas.ts reads
 * from here, so no component changes.
 *
 * Swap point #2 (Convex / TanStack Query): replace the hook bodies in
 * src/hooks/useSemillas.ts and keep their return shapes.
 */
export interface SemillasApi {
  // Auth
  obtenerSesion(): Promise<Sesion | null>;
  registrar(input: RegistroInput): Promise<Sesion>;
  iniciarSesion(input: LoginInput): Promise<Sesion>;
  cerrarSesion(): Promise<void>;
  actualizarPerfil(input: PerfilUpdate): Promise<Usuario>;

  // Escrow (Mercado Pago Checkout Pro)
  obtenerCuotaEntrada(): Promise<CuotaEntrada>;
  crearPreferenciaPago(): Promise<PreferenciaPago>;
  confirmarRetornoPago(input: RetornoPagoInput): Promise<PagoEscrow>;
  obtenerMiPago(): Promise<PagoEscrow | null>;

  // Planters
  listarMisPlantas(): Promise<Planta[]>;
  obtenerPlanta(id: string): Promise<Planta | null>;
  obtenerPermisosPlanta(id: string): Promise<PermisosPlanta>;
  validarCompanero(numeroCuenta: string): Promise<CompaneroValidado>;
  crearPlanta(input: CrearPlantaInput): Promise<Planta>;

  // Interactions
  votar(input: VotoInput): Promise<Interaccion>;
  reportar(input: ReporteInput): Promise<Interaccion>;
  listarMisCalificaciones(): Promise<InteraccionConPlanta[]>;

  // Leaderboard
  obtenerPozo(): Promise<PozoResumen>;
  obtenerRankingCarreras(): Promise<CarreraStats[]>;
}

/** Real Supabase backend by default; set VITE_USE_MOCKS=true for the offline demo. */
export const api: SemillasApi = USE_MOCKS ? mockApi : supabaseApi;
