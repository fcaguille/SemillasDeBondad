import { Badge } from "@/components/ui/badge";
import type { EstadoPlanta } from "@/types/domain";

const MAP: Record<EstadoPlanta, { label: string; variant: "success" | "warning" | "destructive" }> =
  {
    verificada: { label: "Verificada", variant: "success" },
    en_revision: { label: "En revisión", variant: "warning" },
    penalizada: { label: "Penalizada", variant: "destructive" },
  };

export function EstadoPlantaBadge({
  estado,
  size,
}: {
  estado: EstadoPlanta;
  size?: "sm" | "default";
}) {
  const m = MAP[estado];
  return (
    <Badge variant={m.variant} size={size}>
      <span aria-hidden className="size-[6px] rounded-full bg-current" /> {m.label}
    </Badge>
  );
}
