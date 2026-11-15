import { useState, type FormEvent, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Download, Loader2, X } from "lucide-react";
import { PhotoCaptureSlot } from "@/components/crear/PhotoCaptureSlot";
import { TeamBuilder } from "@/components/crear/TeamBuilder";
import { QrTicket, QrTicketSheet } from "@/components/planta/QrTicket";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toaster";
import {
  useCrearPlanta,
  useGuardarFoto,
  useUsuarioActual,
  useValidarCompanero,
} from "@/hooks/useSemillas";
import { mensajeDeError } from "@/lib/errors";
import { cn } from "@/lib/utils";
import type { CompaneroValidado, Planta } from "@/types/domain";

function Step({
  n,
  title,
  done,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={`step-${n}`}>
      <div className="mb-3 flex items-center gap-2">
        <span
          className={cn(
            "grid size-[22px] place-items-center rounded-full text-[11px] font-bold tabular-nums transition-colors",
            done ? "bg-primary text-white" : "bg-secondary text-foreground",
          )}
        >
          {n}
        </span>
        <h2 id={`step-${n}`} className="text-[13px] font-bold uppercase tracking-[0.08em]">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export function CrearMacetaView() {
  const navigate = useNavigate();
  const { data: usuario } = useUsuarioActual();
  const [foto, setFoto] = useState<File | null>(null);
  const [nombre, setNombre] = useState("");
  const [companeros, setCompaneros] = useState<CompaneroValidado[]>([]);
  const [intentado, setIntentado] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creada, setCreada] = useState<Planta | null>(null);

  const validar = useValidarCompanero();
  const crear = useCrearPlanta();
  const guardarFoto = useGuardarFoto();
  if (!usuario) return null;

  const nombreOk = nombre.trim().length >= 3;
  const pasos = [!!foto, nombreOk, !!creada];
  const cerrar = () => (window.history.length > 1 ? navigate(-1) : navigate("/impacto"));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setIntentado(true);
    setError(null);
    if (!foto || !nombreOk) return;
    try {
      const planta = await crear.mutateAsync({
        nombre: nombre.trim(),
        companeros: companeros.map((c) => c.numero_cuenta),
      });
      await guardarFoto
        .mutateAsync({ plantaId: planta.id, file: foto })
        .catch(() => toast("No se pudo guardar la foto en este dispositivo", "error"));
      setCreada(planta);
      toast("¡Maceta registrada!");
    } catch (err) {
      setError(mensajeDeError(err));
    }
  };

  const enviando = crear.isPending || guardarFoto.isPending;

  return (
    <div className="min-h-dvh bg-[#0B100D] pt-[calc(10px+var(--safe-top))] md:bg-transparent md:px-10 md:py-10">
      {/* iOS page-sheet on mobile, centered panel on desktop */}
      <div className="relative mx-auto min-h-[calc(100dvh-10px-var(--safe-top))] max-w-2xl rounded-t-[28px] bg-background md:min-h-0 md:rounded-[28px] md:border md:border-border md:bg-card md:shadow-card">
        <div className="flex justify-center pt-2 md:hidden" aria-hidden>
          <span className="h-[5px] w-9 rounded-full bg-[#CDD2CB]" />
        </div>
        <header className="sticky top-0 z-10 flex items-center justify-between rounded-t-[28px] bg-inherit px-6 pb-3 pt-2 md:pt-6">
          <div>
            <h1 className="text-[20px] font-extrabold tracking-[-0.02em] md:text-[24px]">
              Nueva Creación
            </h1>
            <div
              className="mt-2 flex gap-1"
              aria-label={`Paso ${pasos.filter(Boolean).length} de 3`}
            >
              {pasos.map((ok, i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1 w-8 rounded-full transition-colors",
                    ok ? "bg-primary" : "bg-[#DADFD8]",
                  )}
                />
              ))}
            </div>
          </div>
          <button
            onClick={cerrar}
            aria-label="Cerrar"
            className="grid size-11 place-items-center rounded-full bg-secondary"
          >
            <X size={20} strokeWidth={2.4} />
          </button>
        </header>

        <form
          id="crear-form"
          noValidate
          onSubmit={submit}
          className="flex flex-col gap-6 px-6 pb-[calc(120px+var(--safe-bottom))] md:pb-6"
        >
          <Step n={1} title="Evidencia" done={!!foto}>
            <PhotoCaptureSlot file={foto} onChange={setFoto} invalid={intentado && !foto} />
            <FieldMessage error>
              {intentado && !foto ? "Toma una foto de tu maceta para continuar." : null}
            </FieldMessage>
          </Step>

          <Step n={2} title="Detalles" done={nombreOk}>
            <div className="flex flex-col gap-4">
              <div>
                <Label htmlFor="nombre">Nombre de tu creación</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  maxLength={40}
                  invalid={intentado && !nombreOk}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder='Ej. "La Capibara Verde"'
                />
                <FieldMessage error>
                  {intentado && !nombreOk ? "Ponle un nombre de al menos 3 letras." : null}
                </FieldMessage>
              </div>
              <TeamBuilder
                creador={usuario}
                companeros={companeros}
                onChange={setCompaneros}
                validar={(n) => validar.mutateAsync(n)}
                validando={validar.isPending}
              />
            </div>
          </Step>

          <Step n={3} title="Tu QR coleccionable" done={!!creada}>
            <QrTicket
              planta={creada ?? undefined}
              placeholder={!creada}
              className="mx-auto md:mx-0"
            />
          </Step>

          {error && (
            <p
              role="alert"
              className="rounded-btn bg-crimson-tint px-4 py-3 text-[14px] font-medium text-crimson"
            >
              {error}
            </p>
          )}

          <div className="fixed inset-x-0 bottom-0 z-20 bg-gradient-to-t from-background from-70% to-background/0 px-6 pb-[calc(20px+var(--safe-bottom))] pt-6 md:static md:bg-none md:p-0">
            {creada ? (
              <Button
                type="button"
                size="lg"
                className="w-full"
                onClick={() => setCreada({ ...creada })}
              >
                <Download size={18} strokeWidth={2.4} /> Descargar QR para Imprimir
              </Button>
            ) : (
              <Button type="submit" size="lg" className="w-full" disabled={enviando}>
                {enviando ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Download size={18} strokeWidth={2.4} />
                )}
                {enviando ? "Registrando…" : "Guardar y Descargar QR para Imprimir"}
              </Button>
            )}
          </div>
        </form>
      </div>

      <QrTicketSheetController planta={creada} onDone={() => navigate("/impacto")} />
    </div>
  );
}

/** Opens the ticket modal whenever a planter is (re)set after creation. */
function QrTicketSheetController({
  planta,
  onDone,
}: {
  planta: Planta | null;
  onDone: () => void;
}) {
  const [openFor, setOpenFor] = useState<Planta | null>(null);
  const [last, setLast] = useState<Planta | null>(null);
  if (planta !== last) {
    setLast(planta);
    if (planta) setOpenFor(planta);
  }
  return (
    <QrTicketSheet
      planta={openFor}
      open={!!openFor}
      onOpenChange={(o) => {
        if (!o) {
          setOpenFor(null);
          onDone();
        }
      }}
    />
  );
}
