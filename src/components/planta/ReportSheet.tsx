import { useState } from "react";
import { Info, Loader2 } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MOTIVOS_REPORTE, UMBRAL_REPORTES, type MotivoReporte, type Planta } from "@/types/domain";

const MOTIVOS = Object.keys(MOTIVOS_REPORTE) as MotivoReporte[];

export function ReportSheet({
  planta,
  open,
  onOpenChange,
  onConfirm,
  enviando,
}: {
  planta: Pick<Planta, "id" | "reportes_pendientes">;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (motivo: MotivoReporte) => Promise<unknown>;
  enviando: boolean;
}) {
  const [sel, setSel] = useState<MotivoReporte | null>(null);
  const count = sel
    ? planta.reportes_pendientes[sel]
    : Math.max(...MOTIVOS.map((m) => planta.reportes_pendientes[m]));

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        <>
          Reportar Maceta <span className="font-mono tabular-nums">#{planta.id}</span>
        </>
      }
      description={
        <span className="flex gap-[6px]">
          <Info size={14} className="mt-[2px] shrink-0" aria-hidden /> Se requieren{" "}
          {UMBRAL_REPORTES} reportes únicos para aplicar penalización
        </span>
      }
    >
      <div
        className="flex items-center gap-3"
        aria-label={`${count} de ${UMBRAL_REPORTES} reportes`}
      >
        <div className="flex flex-1 gap-1" aria-hidden>
          {Array.from({ length: UMBRAL_REPORTES }, (_, i) => (
            <span
              key={i}
              className={cn(
                "h-[6px] flex-1 rounded-full transition-colors",
                i < count ? "bg-crimson" : "bg-muted",
              )}
            />
          ))}
        </div>
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
          {count} de {UMBRAL_REPORTES}
        </span>
      </div>

      <div role="radiogroup" aria-label="Motivo del reporte" className="mt-4 flex flex-col gap-2">
        {MOTIVOS.map((m) => {
          const on = sel === m;
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setSel(m)}
              className={cn(
                "flex min-h-[60px] items-center gap-3 rounded-btn border px-4 text-left transition",
                on ? "border-crimson bg-crimson-tint" : "border-border bg-card hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "grid size-[22px] shrink-0 place-items-center rounded-full border-2",
                  on ? "border-crimson" : "border-[#C6CCC4]",
                )}
              >
                {on && <span className="size-[10px] rounded-full bg-crimson" />}
              </span>
              <span className="flex-1 text-[15px] font-semibold leading-[20px]">
                {MOTIVOS_REPORTE[m].etiqueta}
              </span>
              <Badge variant="destructive" size="sm">
                {MOTIVOS_REPORTE[m].penalizacion} pts
              </Badge>
            </button>
          );
        })}
      </div>
      <Button
        variant="destructive"
        size="lg"
        className="mt-5 w-full"
        disabled={!sel || enviando}
        onClick={() => sel && onConfirm(sel).then(() => setSel(null))}
      >
        {enviando && <Loader2 size={18} className="animate-spin" />}
        Confirmar Reporte
      </Button>
      <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
        Tu reporte es anónimo · 1 reporte por cuenta
      </p>
    </Sheet>
  );
}
