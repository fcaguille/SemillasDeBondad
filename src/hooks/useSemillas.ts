/**
 * DATA HOOKS — the only place the UI touches data.
 *
 * Each hook returns the TanStack Query shape. To migrate:
 *  - TanStack Query: replace `useQuery`/`useMutation` imports with
 *    @tanstack/react-query and keep the same keys.
 *  - Convex: replace bodies with `useQuery(api.plantas.get, { id })` etc.
 *    and map `undefined` → isLoading.
 */
import { api } from "@/services/api";
import { photos } from "@/services/photos";
import { clearQueries, invalidateQueries, setQueryData, useMutation, useQuery } from "@/lib/query";
import type {
  CrearPlantaInput,
  LoginInput,
  PerfilUpdate,
  RegistroInput,
  ReporteInput,
  RetornoPagoInput,
  Sesion,
  VotoInput,
} from "@/types/domain";

export const keys = {
  sesion: ["sesion"] as const,
  cuota: ["cuota"] as const,
  miPago: ["pago", "mio"] as const,
  misPlantas: ["plantas", "mias"] as const,
  planta: (id: string) => ["plantas", "detalle", id] as const,
  permisos: (id: string) => ["plantas", "permisos", id] as const,
  calificaciones: ["interacciones", "mias"] as const,
  pozo: ["pozo"] as const,
  ranking: ["ranking"] as const,
  fotos: ["fotos"] as const,
};

/* ---------- Auth ---------- */

export const useSesion = () =>
  useQuery(keys.sesion, () => api.obtenerSesion(), { staleTime: 60_000 });

export function useUsuarioActual() {
  const q = useSesion();
  return { ...q, data: q.data?.usuario ?? null };
}

const onSesion = (s: Sesion) => {
  clearQueries();
  setQueryData(keys.sesion, s);
};

export const useRegistrar = () =>
  useMutation((i: RegistroInput) => api.registrar(i), { onSuccess: onSesion });
export const useIniciarSesion = () =>
  useMutation((i: LoginInput) => api.iniciarSesion(i), { onSuccess: onSesion });
export const useCerrarSesion = () =>
  useMutation(() => api.cerrarSesion(), {
    onSuccess: () => {
      clearQueries();
      setQueryData(keys.sesion, null);
    },
  });
export const useActualizarPerfil = () =>
  useMutation((i: PerfilUpdate) => api.actualizarPerfil(i), {
    onSuccess: (usuario) =>
      setQueryData<Sesion | null>(keys.sesion, (s) => (s ? { ...s, usuario } : null)),
  });

/* ---------- Escrow ---------- */

export const useCuotaEntrada = () =>
  useQuery(keys.cuota, () => api.obtenerCuotaEntrada(), { staleTime: Infinity });
export const useMiPago = (enabled = true) =>
  useQuery(keys.miPago, () => api.obtenerMiPago(), { enabled });
export const useCrearPreferenciaPago = () => useMutation(() => api.crearPreferenciaPago());
export const useConfirmarRetornoPago = () =>
  useMutation((i: RetornoPagoInput) => api.confirmarRetornoPago(i), {
    onSuccess: () => {
      invalidateQueries(keys.sesion);
      invalidateQueries(keys.miPago);
      invalidateQueries(keys.pozo);
    },
  });

/* ---------- Planters ---------- */

export const useMisPlantas = () => useQuery(keys.misPlantas, () => api.listarMisPlantas());
export const usePlanta = (id: string) =>
  useQuery(keys.planta(id), () => api.obtenerPlanta(id), { staleTime: 10_000 });
export const usePermisosPlanta = (id: string, enabled = true) =>
  useQuery(keys.permisos(id), () => api.obtenerPermisosPlanta(id), { enabled, staleTime: 0 });
export const useValidarCompanero = () => useMutation((n: string) => api.validarCompanero(n));
export const useCrearPlanta = () =>
  useMutation((i: CrearPlantaInput) => api.crearPlanta(i), {
    onSuccess: (p) => {
      setQueryData(keys.planta(p.id), p);
      invalidateQueries(keys.misPlantas);
      invalidateQueries(keys.sesion);
    },
  });

/* ---------- Interactions ---------- */

const afterInteraction = (_: unknown, i: { planta_id: string }) => {
  invalidateQueries(keys.planta(i.planta_id));
  invalidateQueries(keys.permisos(i.planta_id));
  invalidateQueries(keys.calificaciones);
  invalidateQueries(keys.ranking);
};
export const useVotar = () =>
  useMutation((i: VotoInput) => api.votar(i), { onSuccess: afterInteraction });
export const useReportar = () =>
  useMutation((i: ReporteInput) => api.reportar(i), { onSuccess: afterInteraction });
export const useMisCalificaciones = () =>
  useQuery(keys.calificaciones, () => api.listarMisCalificaciones());

/* ---------- Leaderboard (live) ---------- */

export const usePozo = () =>
  useQuery(keys.pozo, () => api.obtenerPozo(), { refetchInterval: 15_000, staleTime: 5_000 });
export const useRankingCarreras = () =>
  useQuery(keys.ranking, () => api.obtenerRankingCarreras(), { refetchInterval: 60_000 });

/* ---------- Device photos (IndexedDB) ---------- */

export const useFotosLocales = () => useQuery(keys.fotos, () => photos.list(), { staleTime: 0 });
export const useGuardarFoto = () =>
  useMutation(
    ({ plantaId, file }: { plantaId: string; file: Blob }) => photos.save(plantaId, file),
    {
      onSuccess: () => invalidateQueries(keys.fotos),
    },
  );
export const useEliminarFoto = () =>
  useMutation((id: string) => photos.remove(id), {
    onSuccess: () => invalidateQueries(keys.fotos),
  });
