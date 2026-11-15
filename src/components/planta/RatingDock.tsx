import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Check, Loader2, Lock, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PermisosPlanta } from "@/types/domain";

type Estrellas = 1 | 2 | 3 | 4 | 5;

export function RatingDock({
  permisos,
  autenticado,
  loginHref,
  onVotar,
  enviando,
}: {
  permisos: PermisosPlanta | undefined;
  autenticado: boolean;
  loginHref: string;
  onVotar: (estrellas: Estrellas) => Promise<unknown>;
  enviando: boolean;
}) {
  const [rating, setRating] = useState<Estrellas | 0>(0);
  const [hover, setHover] = useState(0);
  const voto = permisos?.voto_emitido?.estrellas ?? null;
  const bloqueado = !autenticado || !!permisos?.es_creador || voto !== null;
  const shown = voto ?? (hover || rating);

  return (
    <section
      aria-labelledby="rate-title"
      className="rounded-card border border-border bg-card p-3 shadow-card md:p-5"
    >
      <p id="rate-title" className="text-[15px] font-bold leading-tight">
        {voto ? "Tu calificación" : "Califica esta maceta:"}
      </p>
      <p className="mt-[2px] text-[11px] font-medium text-muted-foreground">
        1 voto por cuenta · Creadores bloqueados
      </p>

      <div
        role="radiogroup"
        aria-label="Calificación de 1 a 5 estrellas"
        className="-mx-1 mt-1 flex justify-between md:justify-start md:gap-1"
        onPointerLeave={() => setHover(0)}
      >
        {([1, 2, 3, 4, 5] as const).map((n) => (
          <motion.button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n || voto === n}
            aria-label={`${n} estrella${n > 1 ? "s" : ""}`}
            disabled={bloqueado || enviando}
            whileTap={{ scale: 0.82 }}
            onPointerEnter={() => setHover(n)}
            onClick={() => setRating(n)}
            className="grid size-11 place-items-center rounded-full disabled:cursor-not-allowed"
          >
            <motion.span
              animate={{ scale: n <= shown ? 1 : 0.92 }}
              transition={{ type: "spring", stiffness: 500, damping: 20 }}
            >
              <Star
                size={32}
                strokeWidth={1.6}
                className={cn(n <= shown ? "fill-gold text-gold" : "text-[#CBD1C9]")}
              />
            </motion.span>
          </motion.button>
        ))}
      </div>

      {!autenticado ? (
        <Button asChild size="lg" className="mt-1 h-12 w-full">
          <Link to={loginHref}>Inicia sesión para calificar</Link>
        </Button>
      ) : permisos?.es_creador ? (
        <p className="mt-1 flex h-12 items-center justify-center gap-2 rounded-btn bg-muted text-[14px] font-semibold text-muted-foreground">
          <Lock size={16} aria-hidden /> Eres creador · no puedes calificarla
        </p>
      ) : voto ? (
        <p className="mt-1 flex h-12 items-center justify-center gap-2 rounded-btn bg-brand-tint text-[14px] font-semibold text-primary">
          <Check size={16} strokeWidth={3} aria-hidden /> Voto registrado · ¡Gracias!
        </p>
      ) : (
        <Button
          size="lg"
          className="mt-1 h-12 w-full"
          disabled={!rating || enviando}
          onClick={() => rating && onVotar(rating)}
        >
          {enviando ? <Loader2 size={18} className="animate-spin" /> : null}
          {enviando ? "Enviando…" : "Enviar Voto"}
        </Button>
      )}
    </section>
  );
}
