import { useEffect, useRef, useState, type ReactNode } from "react";
import { Check, Download, Loader2 } from "lucide-react";
import { BotanicalArt } from "@/components/botanical/BotanicalArt";
import { StoryExport } from "@/components/cuenta/StoryExport";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { exportNodeToPng } from "@/lib/exportImage";
import { mensajeDeError } from "@/lib/errors";
import { cn, formatFecha, formatMXN } from "@/lib/utils";
import {
  MOTIVOS_REPORTE,
  UMBRAL_REPORTES,
  type PagoEscrow,
  type PerfilUpdate,
  type Planta,
  type Usuario,
} from "@/types/domain";

type SheetProps = { open: boolean; onOpenChange: (o: boolean) => void };

export function ExportCartaSheet({
  open,
  onOpenChange,
  plantas,
  isLoading,
}: SheetProps & { plantas: Planta[] | undefined; isLoading: boolean }) {
  const [selId, setSelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const storyRef = useRef<HTMLDivElement>(null);
  const sel = plantas?.find((p) => p.id === selId) ?? plantas?.[0];

  const exportar = async () => {
    if (!storyRef.current || !sel) return;
    setBusy(true);
    try {
      await exportNodeToPng(storyRef.current, `carta-${sel.id}.png`, { pixelRatio: 1 });
      toast("Carta lista para tus Stories");
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
      title="Exportar mi Carta Coleccionable"
      description="PNG de 1080×1920 listo para Instagram Stories."
    >
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : !plantas?.length ? (
        <p className="rounded-btn bg-muted p-4 text-[14px] text-muted-foreground">
          Registra tu primera maceta para generar su carta.
        </p>
      ) : (
        <>
          <div role="radiogroup" aria-label="Elige una maceta" className="flex flex-col gap-2">
            {plantas.map((p) => {
              const on = p.id === sel?.id;
              return (
                <button
                  key={p.id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSelId(p.id)}
                  className={cn(
                    "flex items-center gap-3 rounded-btn border p-2 pr-4 text-left transition",
                    on ? "border-primary bg-brand-tint" : "border-border hover:bg-muted",
                  )}
                >
                  <span className="size-12 shrink-0 overflow-hidden rounded-[10px] border border-border">
                    <BotanicalArt noDiseno={p.no_diseno} labelled={false} className="size-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-bold">{p.nombre}</span>
                    <span className="font-mono text-[11px] text-muted-foreground">
                      #{p.id} · {p.puntaje_neto} pts
                    </span>
                  </span>
                  {on && <Check size={18} className="text-primary" aria-hidden />}
                </button>
              );
            })}
          </div>
          <Button size="lg" className="mt-4 w-full" onClick={exportar} disabled={busy || !sel}>
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {busy ? "Generando PNG…" : "Descargar PNG para Instagram Stories"}
          </Button>
          {/* Off-screen render target */}
          <div aria-hidden className="pointer-events-none fixed -left-[20000px] top-0">
            {sel && <StoryExport ref={storyRef} planta={sel} />}
          </div>
        </>
      )}
    </Sheet>
  );
}

export function EditarPerfilSheet({
  open,
  onOpenChange,
  usuario,
  onSave,
  guardando,
}: SheetProps & {
  usuario: Usuario;
  onSave: (p: PerfilUpdate) => Promise<unknown>;
  guardando: boolean;
}) {
  const [nickname, setNickname] = useState(usuario.nickname);
  const [bio, setBio] = useState(usuario.bio ?? "");
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setNickname(usuario.nickname);
      setBio(usuario.bio ?? "");
      setError(null);
    }
  }, [open, usuario]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await onSave({ nickname, bio: bio.trim() || null });
      toast("Perfil actualizado");
      onOpenChange(false);
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Editar perfil"
      description="Tu nickname y bio son públicos en tus cartas."
    >
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <Label htmlFor="edit-nick">Nickname Público</Label>
          <Input
            id="edit-nick"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={21}
            invalid={!!error}
          />
        </div>
        <div>
          <Label htmlFor="edit-bio">Bio</Label>
          <Textarea
            id="edit-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 80))}
            placeholder="Cuéntale al reto qué estás sembrando"
          />
          <FieldMessage>{bio.length}/80</FieldMessage>
        </div>
        <FieldMessage error>{error}</FieldMessage>
        <Button type="submit" size="lg" disabled={guardando}>
          {guardando && <Loader2 size={18} className="animate-spin" />} Guardar cambios
        </Button>
      </form>
    </Sheet>
  );
}

export function GarantiaSheet({
  open,
  onOpenChange,
  pago,
  accion,
}: SheetProps & { pago: PagoEscrow | null | undefined; accion?: ReactNode }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Estado de Garantía"
      description="Tu aportación se mantiene en custodia hasta el cierre del reto."
    >
      {!pago ? (
        <p className="rounded-btn bg-muted p-4 text-[14px] text-muted-foreground">
          Tu cuenta está en Modo Gratuito: aún no hay un pago de garantía asociado.
        </p>
      ) : (
        <dl className="divide-y divide-border rounded-card border border-border text-[14px] tabular-nums">
          {[
            [
              "Estado",
              <Badge key="e" variant={pago.estado === "aprobado" ? "success" : "warning"}>
                {pago.estado === "aprobado" ? "Pagado" : pago.estado}
              </Badge>,
            ],
            [
              "Folio Mercado Pago",
              <span key="f" className="font-mono">
                {pago.folio}
              </span>,
            ],
            ["Aportación al Pozo Común", formatMXN(pago.aportacion_centavos)],
            ["Total pagado", <b key="t">{formatMXN(pago.total_centavos)} MXN</b>],
            ["Fecha", pago.pagado_en ? formatFecha(pago.pagado_en) : "—"],
          ].map(([k, v]) => (
            <div key={String(k)} className="flex items-center justify-between gap-4 px-4 py-3">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      {accion}
    </Sheet>
  );
}

export function ReglamentoSheet({
  open,
  onOpenChange,
  amonestaciones,
}: SheetProps & { amonestaciones: number }) {
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Reglamento de Sanciones"
      description={`Una penalización se aplica al reunir ${UMBRAL_REPORTES} reportes únicos por el mismo motivo.`}
    >
      <div
        className={cn(
          "mb-4 rounded-btn px-4 py-3 text-[14px] font-semibold",
          amonestaciones === 0 ? "bg-brand-tint text-primary" : "bg-crimson-tint text-crimson",
        )}
      >
        {amonestaciones} amonestaciones · {amonestaciones === 0 ? "Limpio" : "Revisa tus macetas"}
      </div>
      <ul className="flex flex-col gap-2">
        {Object.values(MOTIVOS_REPORTE).map((m) => (
          <li
            key={m.etiqueta}
            className="flex items-center justify-between gap-3 rounded-btn border border-border px-4 py-3"
          >
            <span className="text-[14px] font-medium">{m.etiqueta}</span>
            <Badge variant="destructive" size="sm">
              {m.penalizacion} pts
            </Badge>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[12px] leading-[17px] text-muted-foreground">
        Las penalizaciones se dividen entre las carreras de los creadores. Los creadores no pueden
        votar ni reportar su propia maceta.
      </p>
    </Sheet>
  );
}
