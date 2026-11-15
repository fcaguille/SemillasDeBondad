import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft, Lock, Share, Sprout, TriangleAlert } from "lucide-react";
import { CollectiblePlantCard, CARD_H } from "@/components/CollectiblePlantCard";
import { EmptyState, ErrorState } from "@/components/common/States";
import { EstadoPlantaBadge } from "@/components/planta/EstadoPlantaBadge";
import { RatingDock } from "@/components/planta/RatingDock";
import { ReportSheet } from "@/components/planta/ReportSheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import {
  usePermisosPlanta,
  usePlanta,
  useReportar,
  useUsuarioActual,
  useVotar,
} from "@/hooks/useSemillas";
import { mensajeDeError } from "@/lib/errors";
import { formatFecha, plantaUrl } from "@/lib/utils";
import { puedeVotar, tieneGarantia, type MotivoReporte } from "@/types/domain";

const REPORTE_BLOQUEADO = "Solo cuentas con garantía activa pueden levantar reportes.";

/** Public QR destination: #/p/{id_planta}. Signed-out: read-only. Free tier: vote. Paid: vote + report. */
export function PlantaView() {
  const { idPlanta = "" } = useParams();
  const id = idPlanta.toUpperCase();
  const navigate = useNavigate();
  const { data: usuario } = useUsuarioActual();
  // Free ("Modo Gratuito") and paid accounts can vote; only paid accounts can report.
  const autenticado = puedeVotar(usuario);
  const garantia = tieneGarantia(usuario);
  const planta = usePlanta(id);
  const permisos = usePermisosPlanta(id, autenticado);
  const votar = useVotar();
  const reportar = useReportar();
  const [reportOpen, setReportOpen] = useState(false);

  const back = () =>
    window.history.state?.idx > 0 ? navigate(-1) : navigate(autenticado ? "/impacto" : "/registro");

  const onVotar = async (estrellas: 1 | 2 | 3 | 4 | 5) => {
    try {
      await votar.mutateAsync({ planta_id: id, estrellas });
      toast("¡Voto enviado! Gracias por evaluar");
    } catch (e) {
      toast(mensajeDeError(e), "error");
    }
  };
  const onReportar = async (motivo: MotivoReporte) => {
    try {
      await reportar.mutateAsync({ planta_id: id, motivo });
      setReportOpen(false);
      toast("Reporte enviado. Gracias por cuidar el reto");
    } catch (e) {
      toast(mensajeDeError(e), "error");
    }
  };
  const compartir = async () => {
    const url = plantaUrl(id);
    try {
      if (navigator.share) await navigator.share({ title: planta.data?.nombre, url });
      else {
        await navigator.clipboard.writeText(url);
        toast("Enlace copiado");
      }
    } catch {
      /* cancelled */
    }
  };

  const p = planta.data;
  const reporteDisponible =
    autenticado && !!permisos.data && !permisos.data.es_creador && !permisos.data.reporte_emitido;
  const puedeReportar = reporteDisponible && garantia;
  const reporteBloqueado = reporteDisponible && !garantia;

  return (
    <div className="min-h-dvh bg-[radial-gradient(120%_60%_at_50%_25%,#EAF6EC_0%,var(--background)_60%)] pb-[calc(24px+var(--safe-bottom))]">
      <nav className="mx-auto flex h-[60px] max-w-5xl items-center justify-between gap-2 px-5 pt-[var(--safe-top)] md:h-20 md:px-10">
        <Button
          variant="outline"
          size="icon"
          aria-label="Regresar"
          onClick={back}
          className="rounded-full"
        >
          <ArrowLeft size={20} />
        </Button>
        <span className="rounded-full border border-border bg-card px-3 py-[6px] font-mono text-[13px] font-semibold tabular-nums">
          #{id}
        </span>
        {p ? <EstadoPlantaBadge estado={p.estado} /> : <span className="w-[100px]" />}
      </nav>

      <main className="mx-auto max-w-5xl px-5 md:px-10">
        {planta.isLoading ? (
          <div className="flex flex-col items-center gap-4 pt-3">
            <Skeleton className="h-[460px] w-[330px] rounded-collectible" />
            <Skeleton className="h-[150px] w-full max-w-[345px] rounded-card" />
          </div>
        ) : planta.error ? (
          <ErrorState error={planta.error} onRetry={planta.refetch} />
        ) : !p ? (
          <div className="pt-10">
            <EmptyState
              icon={<Sprout />}
              title={`No encontramos la maceta #${id}`}
              description="Revisa que el QR esté completo o escanéalo de nuevo."
              action={
                <Button asChild>
                  <Link to="/escanear">Escanear otra</Link>
                </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 pt-3 md:grid md:grid-cols-[330px_minmax(0,1fr)] md:items-start md:gap-12 md:pt-6">
            <div style={{ minHeight: CARD_H }}>
              <CollectiblePlantCard planta={p} />
            </div>

            <div className="flex w-full max-w-[345px] flex-col gap-2 md:max-w-none md:gap-4">
              <div className="hidden md:block">
                <p className="text-[13px] font-medium text-muted-foreground">
                  Registrada el{" "}
                  {formatFecha(p.creada_en, { day: "numeric", month: "long", year: "numeric" })}
                </p>
                <h1 className="text-[34px] font-extrabold leading-tight tracking-[-0.03em]">
                  {p.nombre}
                </h1>
              </div>
              <Card className="hidden grid-cols-3 divide-x divide-border md:grid">
                {[
                  [p.total_votos ? `${p.promedio_estrellas.toFixed(1)} ★` : "—", "Promedio"],
                  [p.total_votos, "Votos"],
                  [p.puntaje_neto, "Puntaje neto"],
                ].map(([v, l]) => (
                  <div key={String(l)} className="p-4">
                    <p className="text-[24px] font-extrabold tabular-nums">{v}</p>
                    <p className="text-[12px] font-medium text-muted-foreground">{l}</p>
                  </div>
                ))}
              </Card>

              <RatingDock
                permisos={permisos.data}
                autenticado={autenticado}
                loginHref={`/registro?next=${encodeURIComponent(`/p/${id}`)}`}
                onVotar={onVotar}
                enviando={votar.isPending}
              />

              <div className="flex items-center justify-between">
                {puedeReportar ? (
                  <Button
                    variant="destructive-ghost"
                    className="px-2"
                    onClick={() => setReportOpen(true)}
                  >
                    <TriangleAlert size={16} /> Reportar anomalía física
                  </Button>
                ) : reporteBloqueado ? (
                  <div className="flex min-w-0 flex-col items-start" title={REPORTE_BLOQUEADO}>
                    <Button
                      variant="destructive-ghost"
                      className="px-2"
                      disabled
                      aria-describedby="reporte-bloqueado"
                    >
                      <TriangleAlert size={16} /> Reportar anomalía física
                      <Lock size={13} strokeWidth={2.4} aria-hidden />
                    </Button>
                    <p
                      id="reporte-bloqueado"
                      className="px-2 text-[11px] font-medium leading-[15px] text-muted-foreground"
                    >
                      {REPORTE_BLOQUEADO}
                    </p>
                  </div>
                ) : (
                  <span className="px-2 text-[12px] font-medium text-muted-foreground">
                    {permisos.data?.reporte_emitido
                      ? "Ya reportaste esta maceta"
                      : permisos.data?.es_creador
                        ? "Tu maceta · reportes de otros alumnos"
                        : ""}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Compartir"
                  onClick={compartir}
                  className="rounded-full text-muted-foreground"
                >
                  <Share size={18} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>

      {p && (
        <ReportSheet
          planta={p}
          open={reportOpen}
          onOpenChange={setReportOpen}
          onConfirm={onReportar}
          enviando={reportar.isPending}
        />
      )}
    </div>
  );
}
