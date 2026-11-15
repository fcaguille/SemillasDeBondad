import { useId, type ReactNode } from "react";
import { Loader2, Lock, ShieldCheck, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, type ButtonProps } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { useCrearPreferenciaPago } from "@/hooks/useSemillas";
import { mensajeDeError } from "@/lib/errors";
import { redirigirACheckout } from "@/lib/mercadoPago";
import { cn } from "@/lib/utils";
import { tieneGarantia, type Usuario } from "@/types/domain";

/**
 * Creates the Mercado Pago Checkout Pro preference and redirects. Errors are
 * surfaced as a toast (and returned) so the flow never fails silently.
 */
export function useActivarGarantia() {
  const preferencia = useCrearPreferenciaPago();
  const activar = async (): Promise<string | null> => {
    try {
      const { init_point } = await preferencia.mutateAsync(undefined);
      redirigirACheckout(init_point);
      return null;
    } catch (e) {
      const msg = mensajeDeError(e);
      toast(msg, "error");
      return msg;
    }
  };
  return { activar, isPending: preferencia.isPending, error: preferencia.error };
}

/** Mercado Pago blue (#009EE3) CTA that starts the escrow checkout. */
export function ActivarGarantiaButton({
  children,
  className,
  size = "lg",
  onFallo,
  ...props
}: Omit<ButtonProps, "onClick" | "variant" | "onError"> & { onFallo?: (msg: string) => void }) {
  const { activar, isPending } = useActivarGarantia();
  return (
    <Button
      {...props}
      variant="mp"
      size={size}
      className={cn("gap-[6px] tracking-[-0.01em]", className)}
      disabled={isPending || props.disabled}
      aria-busy={isPending}
      onClick={async () => {
        const err = await activar();
        if (err) onFallo?.(err);
      }}
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" aria-hidden />
      ) : (
        <Lock size={16} strokeWidth={2.4} aria-hidden />
      )}
      {isPending ? "Abriendo Mercado Pago…" : children}
    </Button>
  );
}

/** Account tier badge shared by Impacto and Cuenta. */
export function EstadoCuentaBadge({
  usuario,
  className,
}: {
  usuario: Pick<Usuario, "estado">;
  className?: string;
}) {
  if (usuario.estado === "suspendida")
    return (
      <Badge variant="destructive" className={className}>
        Cuenta suspendida
      </Badge>
    );
  return tieneGarantia(usuario) ? (
    <Badge variant="success" className={className}>
      <ShieldCheck size={13} aria-hidden /> Cuenta Activa · Participando por el Pozo
    </Badge>
  ) : (
    <Badge variant="info" className={className}>
      <Sparkles size={13} aria-hidden /> Modo Gratuito · Solo Votación
    </Badge>
  );
}

export const COPY_MODO_GRATUITO =
  "Modo Gratuito: Activa tu garantía ($16 MXN) para crear macetas, sumar puntos a tu carrera y competir por el pozo.";

/** Locked replacement for every "create planter" entry point. */
export function ModoGratuitoCard({
  className,
  title = "Crear macetas está bloqueado",
  cta = "Activar Garantía con Mercado Pago",
  extra,
}: {
  className?: string;
  title?: string;
  cta?: string;
  extra?: ReactNode;
}) {
  const titleId = useId();
  return (
    <section
      aria-labelledby={titleId}
      className={cn(
        "relative overflow-hidden rounded-card border border-[#BDE5F7] bg-gradient-to-br from-[#F2FAFE] to-card p-5 shadow-card md:p-6",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-[#E6F5FC] text-[#00669A]">
          <Lock size={20} strokeWidth={2.4} aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#00669A]">
            Modo Gratuito
          </p>
          <h2
            id={titleId}
            className="mt-[2px] text-[18px] font-extrabold leading-tight tracking-[-0.02em]"
          >
            {title}
          </h2>
        </div>
      </div>
      <p className="mt-3 text-[14px] leading-[20px] text-muted-foreground">{COPY_MODO_GRATUITO}</p>
      {extra}
      <ActivarGarantiaButton className="mt-4 w-full text-[15px] md:w-auto md:px-6">
        {cta}
      </ActivarGarantiaButton>
      <p className="mt-2 text-[11px] font-medium text-muted-foreground">
        Mientras tanto, puedes escanear QR y calificar macetas de otros alumnos.
      </p>
    </section>
  );
}
