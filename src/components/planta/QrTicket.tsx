import { forwardRef, useRef, useState } from "react";
import { Link } from "react-router";
import { QRCodeSVG } from "qrcode.react";
import { Download, Printer, Scissors, SquareArrowOutUpRight } from "lucide-react";
import { BotanicalArt } from "@/components/botanical/BotanicalArt";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { exportNodeToPng } from "@/lib/exportImage";
import { mensajeDeError } from "@/lib/errors";
import { cn, plantaUrl } from "@/lib/utils";
import type { Planta } from "@/types/domain";

type TicketPlanta = Pick<Planta, "id" | "nombre" | "no_diseno">;

/** Printable ticket. `placeholder` renders the pre-creation preview. */
export const QrTicket = forwardRef<
  HTMLDivElement,
  { planta?: TicketPlanta; placeholder?: boolean; className?: string }
>(function QrTicket({ planta, placeholder, className }, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "relative w-full max-w-[360px] rounded-card border border-border bg-white shadow-card",
        className,
      )}
    >
      <div className="flex items-center gap-4 p-4">
        <div
          className={cn(
            "relative shrink-0 rounded-[12px] border border-border bg-white p-[6px]",
            placeholder && "opacity-60",
          )}
        >
          <QRCodeSVG
            value={planta ? plantaUrl(planta.id) : "https://semillas.fca.unam.mx"}
            size={112}
            level="M"
            fgColor="#0F172A"
            marginSize={0}
            className={cn(placeholder && "blur-[3px]")}
          />
          {placeholder && (
            <span className="absolute inset-0 grid place-items-center text-center text-[10px] font-bold leading-tight text-foreground">
              Se genera
              <br />
              al guardar
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
            Semillas de Bondad
          </p>
          <p className="mt-1 line-clamp-2 text-[16px] font-extrabold leading-tight">
            {planta?.nombre || "Tu creación"}
          </p>
          <p className="mt-1 font-mono text-[13px] font-semibold tabular-nums text-primary">
            ID: #{planta?.id ?? "SB-····"}
          </p>
          <div className="mt-3 flex items-center gap-2">
            <div className="size-9 shrink-0 overflow-hidden rounded-[10px] border border-border bg-muted">
              {planta && (
                <BotanicalArt noDiseno={planta.no_diseno} labelled={false} className="size-full" />
              )}
            </div>
            <p className="text-[11px] font-semibold leading-[14px]">
              {planta
                ? `Arquetipo Botánico #${planta.no_diseno} asignado`
                : "Arquetipo botánico al azar"}
            </p>
          </div>
        </div>
      </div>
      <div className="relative flex items-center" aria-hidden>
        <span className="absolute -left-3 size-6 rounded-full border border-border bg-background" />
        <span className="mx-4 flex-1 border-t-2 border-dashed border-border" />
        <span className="absolute -right-3 size-6 rounded-full border border-border bg-background" />
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-[11px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1">
          <Scissors size={12} aria-hidden /> Recorta y pega en tu maceta
        </span>
        <span className="font-mono tabular-nums">FCA-UNAM</span>
      </div>
    </div>
  );
});

/** Modal with the generated ticket + download/print actions. */
export function QrTicketSheet({
  planta,
  open,
  onOpenChange,
}: {
  planta: TicketPlanta | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const download = async () => {
    if (!ref.current || !planta) return;
    setBusy(true);
    try {
      await exportNodeToPng(ref.current, `QR-${planta.id}.png`, { pixelRatio: 4, share: false });
      toast("QR descargado. ¡Listo para imprimir!");
    } catch (e) {
      toast(mensajeDeError(e), "error");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Tu QR coleccionable"
      description="Imprímelo y pégalo en un lugar visible de tu maceta."
    >
      {planta && (
        <div className="flex flex-col items-center gap-4">
          <QrTicket ref={ref} planta={planta} className="print-area" />
          <div className="grid w-full gap-2">
            <Button size="lg" onClick={download} disabled={busy}>
              <Download size={18} strokeWidth={2.4} />{" "}
              {busy ? "Generando…" : "Descargar QR para imprimir"}
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" onClick={() => window.print()}>
                <Printer size={17} /> Imprimir
              </Button>
              <Button variant="outline" asChild>
                <Link to={`/p/${planta.id}`} onClick={() => onOpenChange(false)}>
                  <SquareArrowOutUpRight size={17} /> Ver carta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
