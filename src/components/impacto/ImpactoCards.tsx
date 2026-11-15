import { Link } from "react-router";
import { Plus, QrCode, Recycle, TrendingUp } from "lucide-react";
import { BotanicalArt, LeafWatermark } from "@/components/botanical/BotanicalArt";
import { EstadoPlantaBadge } from "@/components/planta/EstadoPlantaBadge";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Planta, Usuario } from "@/types/domain";

export function KpiCard({
  usuario,
}: {
  usuario: Pick<Usuario, "total_plantas" | "puntos_aportados" | "percentil_fca">;
}) {
  return (
    <Card className="grid grid-cols-2 divide-x divide-border">
      <div className="p-4 md:p-6">
        <p className="text-[12px] font-semibold text-muted-foreground">Macetas Creadas</p>
        <p className="mt-1 text-[40px] font-extrabold leading-none tracking-[-0.03em] tabular-nums md:text-[48px]">
          {String(usuario.total_plantas).padStart(2, "0")}
        </p>
        <p className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-primary">
          <Recycle size={13} aria-hidden /> 100% recicladas
        </p>
      </div>
      <div className="p-4 md:p-6">
        <p className="text-[12px] font-semibold text-muted-foreground">Aporte a tu Carrera</p>
        <p className="mt-1 text-[40px] font-extrabold leading-none tracking-[-0.03em] tabular-nums md:text-[48px]">
          {usuario.puntos_aportados >= 0 ? "+" : ""}
          {usuario.puntos_aportados}
          <span className="ml-1 text-[16px] font-bold text-muted-foreground">pts</span>
        </p>
        <Badge variant="success" size="sm" className="mt-2">
          <TrendingUp size={12} aria-hidden /> Top {usuario.percentil_fca}% FCA
        </Badge>
      </div>
    </Card>
  );
}

export function HeroActionCard() {
  return (
    <section className="relative overflow-hidden rounded-card bg-gradient-to-br from-brand to-brand-deep p-5 text-white shadow-[0_18px_36px_-18px_rgba(21,128,61,0.75)] md:p-6">
      <LeafWatermark className="pointer-events-none absolute -right-8 -top-4 size-[190px] text-white/[0.14]" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 size-48 rounded-full bg-leaf/20 blur-2xl" />
      <p className="relative text-[11px] font-bold uppercase tracking-[0.12em] text-[#BBF7D0]">
        Reto activo
      </p>
      <h2 className="relative mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
        ¿Ya armaste tu maceta?
      </h2>
      <p className="relative mt-1 max-w-[260px] text-[14px] leading-[20px] text-white/85">
        Regístrala en equipo o individual y genera su QR coleccionable.
      </p>
      <Link
        to="/crear-maceta"
        className="relative mt-4 inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-bold text-brand-deep shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] transition active:scale-[0.98]"
      >
        <Plus size={18} strokeWidth={2.6} aria-hidden /> Registrar Nueva Maceta
      </Link>
    </section>
  );
}

export function PlantaListItem({
  planta,
  onVerQr,
}: {
  planta: Planta;
  onVerQr: (p: Planta) => void;
}) {
  return (
    <Card className="flex items-center gap-3 p-3 transition hover:shadow-[0_8px_28px_rgba(16,24,20,0.08)]">
      <Link
        to={`/p/${planta.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[12px]"
      >
        <div className="size-16 shrink-0 overflow-hidden rounded-[14px] border border-border">
          <BotanicalArt noDiseno={planta.no_diseno} labelled={false} className="size-full" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Diseño #{String(planta.no_diseno).padStart(2, "0")}
          </p>
          <p className="text-[15px] font-bold leading-tight">{planta.nombre}</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {planta.total_votos > 0 ? (
              <Badge variant="gold" size="sm">
                {planta.promedio_estrellas.toFixed(1)} ★ · {planta.puntaje_neto} pts
              </Badge>
            ) : (
              <Badge size="sm">Sin votos aún</Badge>
            )}
            {planta.estado !== "verificada" && (
              <EstadoPlantaBadge estado={planta.estado} size="sm" />
            )}
          </div>
        </div>
      </Link>
      <button
        onClick={() => onVerQr(planta)}
        className="flex h-10 shrink-0 items-center gap-[6px] rounded-btn border border-border bg-background px-3 text-[13px] font-semibold transition hover:bg-muted"
      >
        <QrCode size={16} aria-hidden /> Ver QR
      </button>
    </Card>
  );
}
