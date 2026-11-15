import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, ScanQrCode, Sprout } from "lucide-react";
import { Page } from "@/components/layout/AppShell";
import { Avatar } from "@/components/common/Avatar";
import { EstadoCuentaBadge, ModoGratuitoCard } from "@/components/auth/Garantia";
import { EmptyState, ErrorState } from "@/components/common/States";
import { HeroActionCard, KpiCard, PlantaListItem } from "@/components/impacto/ImpactoCards";
import { QrTicketSheet } from "@/components/planta/QrTicket";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMisPlantas, useUsuarioActual } from "@/hooks/useSemillas";
import { formatFecha } from "@/lib/utils";
import { CARRERAS, tieneGarantia, type Planta } from "@/types/domain";

export function ImpactoView() {
  const { data: usuario } = useUsuarioActual();
  const plantas = useMisPlantas();
  const [qr, setQr] = useState<Planta | null>(null);
  if (!usuario) return null;
  const garantia = tieneGarantia(usuario);

  const hoy = formatFecha(new Date().toISOString(), {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <Page>
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-muted-foreground first-letter:uppercase">
            {hoy}
          </p>
          <h1 className="mt-[2px] text-[22px] font-extrabold leading-tight tracking-[-0.02em] md:text-[32px]">
            Hola, {usuario.nickname}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <EstadoCuentaBadge usuario={usuario} />
            <Badge>{CARRERAS[usuario.carrera].nombre}</Badge>
          </div>
        </div>
        <Link
          to="/cuenta"
          aria-label="Mi cuenta"
          className="rounded-full ring-2 ring-white md:hidden"
        >
          <Avatar nickname={usuario.nickname} src={usuario.avatar_url} size={44} />
        </Link>
      </header>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <KpiCard usuario={usuario} />
        {garantia ? <HeroActionCard /> : <ModoGratuitoCard />}
      </div>

      <section className="mt-8" aria-labelledby="activas">
        <div className="flex items-center justify-between">
          <h2 id="activas" className="text-[17px] font-bold tracking-[-0.01em] md:text-[20px]">
            Tus Macetas Activas
          </h2>
          {!!plantas.data?.length && (
            <span className="flex items-center text-[13px] font-semibold text-muted-foreground tabular-nums">
              {plantas.data.length} en total <ChevronRight size={16} aria-hidden />
            </span>
          )}
        </div>
        <div className="mt-3">
          {plantas.isLoading ? (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1].map((i) => (
                <Skeleton key={i} className="h-[90px] rounded-card" />
              ))}
            </div>
          ) : plantas.error ? (
            <ErrorState error={plantas.error} onRetry={plantas.refetch} />
          ) : !plantas.data?.length ? (
            garantia ? (
              <EmptyState
                icon={<Sprout />}
                title="Aún no registras macetas"
                description="Arma tu maceta con material reciclado, tómale foto y genera su QR coleccionable."
                action={
                  <Button asChild>
                    <Link to="/crear-maceta">Registrar mi primera maceta</Link>
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={<ScanQrCode />}
                title="Empieza calificando macetas"
                description="En Modo Gratuito puedes escanear el QR de cualquier maceta del campus y darle de 1 a 5 estrellas."
                action={
                  <Button asChild variant="outline">
                    <Link to="/escanear">Escanear un QR</Link>
                  </Button>
                }
              />
            )
          ) : (
            <ul className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {plantas.data.map((p, i) => (
                <motion.li
                  key={p.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <PlantaListItem planta={p} onVerQr={setQr} />
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
      <QrTicketSheet planta={qr} open={!!qr} onOpenChange={(o) => !o && setQr(null)} />
    </Page>
  );
}
