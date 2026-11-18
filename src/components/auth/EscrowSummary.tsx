import { ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMXN } from "@/lib/utils";
import type { CuotaEntrada } from "@/types/domain";

export function EscrowSummary({ cuota }: { cuota: CuotaEntrada | undefined }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-border bg-[#FBFCFA] px-4 py-3">
        <span className="flex items-center gap-2 text-[13px] font-bold">
          <ShieldCheck size={16} className="text-primary" aria-hidden /> Garantía de participación
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Pago único
        </span>
      </div>
      {!cuota ? (
        <div className="flex flex-col gap-2 p-4">
          <Skeleton className="h-4" />
          <Skeleton className="h-4" />
          <Skeleton className="h-5" />
        </div>
      ) : (
        <dl className="flex flex-col gap-2 px-4 py-3 text-[14px] tabular-nums">
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Aportación al Pozo Común</dt>
            <dd className="font-medium">{formatMXN(cuota.aportacion_centavos)} MXN</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-muted-foreground">Comisión pasarela Mercado Pago</dt>
            <dd className="font-medium">{formatMXN(cuota.comision_centavos)} MXN</dd>
          </div>
          <div className="my-1 border-t border-dashed border-border" />
          <div className="flex justify-between gap-3 text-[15px]">
            <dt className="font-bold">Total único de entrada</dt>
            <dd className="font-extrabold">{formatMXN(cuota.total_centavos)} MXN</dd>
          </div>
        </dl>
      )}
      <p className="px-4 pb-4 text-[12px] leading-[18px] text-muted-foreground">De cada pago de $10.00 MXN, $4.95 MXN se integran al pozo común y $5.05 MXN corresponden a la comisión de Mercado Pago: 3.5% + $4.00 MXN fijos, más 16% de IVA sobre la comisión.</p>
    </Card>
  );
}
