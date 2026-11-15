import { useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { Check, Clock, Loader2, X } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { FullScreenLoader } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useConfirmarRetornoPago, useSesion } from "@/hooks/useSemillas";
import { mensajeDeError } from "@/lib/errors";
import { leerRetorno } from "@/lib/mercadoPago";
import { formatMXN } from "@/lib/utils";

/** Mercado Pago Checkout Pro `back_urls` target: /pago/retorno?payment_id&status&external_reference */
export function PagoRetornoView() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { data: sesion, isLoading } = useSesion();
  const confirmar = useConfirmarRetornoPago();
  const started = useRef(false);

  useEffect(() => {
    if (!sesion || started.current) return;
    started.current = true;
    confirmar.mutate(leerRetorno(params));
  }, [sesion, params, confirmar]);

  const pago = confirmar.data;
  useEffect(() => {
    if (pago?.estado !== "aprobado") return;
    const t = setTimeout(() => navigate("/impacto", { replace: true }), 2800);
    return () => clearTimeout(t);
  }, [pago, navigate]);

  if (isLoading) return <FullScreenLoader />;
  if (!sesion) return <Navigate to="/registro" replace />;

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6">
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <BrandMark size={44} />
        {confirmar.isPending || (!pago && !confirmar.error) ? (
          <>
            <Loader2 size={36} className="mt-10 animate-spin text-primary" aria-hidden />
            <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.02em]">
              Confirmando tu pago…
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              Estamos validando la operación con Mercado Pago.
            </p>
          </>
        ) : confirmar.error ? (
          <>
            <span className="mt-10 grid size-16 place-items-center rounded-full bg-crimson-tint text-crimson">
              <X size={30} />
            </span>
            <h1 className="mt-4 text-[22px] font-extrabold">No pudimos confirmar el pago</h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {mensajeDeError(confirmar.error)}
            </p>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/registro">Volver a intentar</Link>
            </Button>
          </>
        ) : pago?.estado === "aprobado" ? (
          <>
            <motion.span
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 380, damping: 18 }}
              className="mt-10 grid size-20 place-items-center rounded-full bg-primary text-white shadow-fab"
            >
              <Check size={40} strokeWidth={3} />
            </motion.span>
            <h1 className="mt-5 text-[24px] font-extrabold tracking-[-0.02em]">
              ¡Cuenta activada!
            </h1>
            <p className="mt-1 text-[14px] leading-[20px] text-muted-foreground">
              Tu aportación de {formatMXN(pago.aportacion_centavos)} ya está en el pozo común.
              <br />
              Folio <span className="font-mono font-semibold text-foreground">{pago.folio}</span>
            </p>
            <Button asChild size="lg" className="mt-6 w-full">
              <Link to="/impacto" replace>
                Empezar a sembrar
              </Link>
            </Button>
          </>
        ) : (
          <>
            <span className="mt-10 grid size-16 place-items-center rounded-full bg-[#FEF6E7] text-gold">
              <Clock size={30} />
            </span>
            <h1 className="mt-4 text-[22px] font-extrabold">
              {pago?.estado === "pendiente" ? "Pago en proceso" : "Pago rechazado"}
            </h1>
            <p className="mt-1 text-[14px] text-muted-foreground">
              {pago?.estado === "pendiente"
                ? "Te avisaremos en cuanto Mercado Pago lo acredite (pagos en OXXO pueden tardar hasta 48 h)."
                : "Tu banco no autorizó el cargo. Prueba con otro método de pago."}
            </p>
            <Button asChild size="lg" variant="outline" className="mt-6 w-full">
              <Link to="/registro">Volver</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
