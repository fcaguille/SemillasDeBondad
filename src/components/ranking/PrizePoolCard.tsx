import { useEffect, useState } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { Clock3, ShieldCheck, Users } from "lucide-react";
import { formatMXN, formatNumber, tiempoRestante } from "@/lib/utils";
import type { PozoResumen } from "@/types/domain";

function AnimatedMXN({ centavos }: { centavos: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(centavos);
  const text = useTransform(mv, (v) => formatMXN(Math.round(v)));
  useEffect(() => {
    if (reduce) return mv.set(centavos);
    const c = animate(mv, centavos, { duration: 1.2, ease: [0.16, 1, 0.3, 1] });
    return () => c.stop();
  }, [centavos, mv, reduce]);
  return <motion.span>{text}</motion.span>;
}

export function PrizePoolCard({ pozo }: { pozo: PozoResumen }) {
  const [restante, setRestante] = useState(() => tiempoRestante(pozo.cierre_en));
  useEffect(() => {
    setRestante(tiempoRestante(pozo.cierre_en));
    const t = setInterval(() => setRestante(tiempoRestante(pozo.cierre_en)), 60_000);
    return () => clearInterval(t);
  }, [pozo.cierre_en]);

  return (
    <section
      aria-label="Pozo acumulado"
      className="relative flex h-full flex-col overflow-hidden rounded-card bg-obsidian p-5 text-white shadow-[0_24px_40px_-20px_rgba(15,23,42,0.7)] md:p-6"
    >
      <div className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full bg-gold/35 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#FCD34D]/60 to-transparent" />
      <div className="relative flex items-start justify-between gap-3">
        <p className="text-[11px] font-bold leading-[15px] tracking-[0.1em] text-[#FCD9A0]">
          POZO ACUMULADO EN CUSTODIA (EN VIVO)
        </p>
        <span className="flex h-6 shrink-0 items-center gap-[6px] rounded-full bg-white/10 px-2 text-[11px] font-bold tracking-wider">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-leaf" />
          </span>
          LIVE
        </span>
      </div>
      <p
        className="relative mt-3 flex flex-wrap items-baseline gap-x-2 tabular-nums"
        aria-live="polite"
      >
        <span className="text-[38px] font-extrabold leading-none tracking-[-0.03em] md:text-[44px]">
          <AnimatedMXN centavos={pozo.total_custodia_centavos} />
        </span>
        <span className="text-[15px] font-bold text-white/60">MXN</span>
      </p>
      <div className="relative mt-5">
        <div className="flex justify-between text-[11px] font-semibold text-white/60 tabular-nums">
          <span>Participación FCA</span>
          <span>
            {Math.round((pozo.alumnos_activos / pozo.matricula_total) * 100)}% de{" "}
            {formatNumber(pozo.matricula_total)}
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#F59E0B] to-[#FCD34D]"
            initial={{ width: 0 }}
            animate={{
              width: `${Math.min(100, (pozo.alumnos_activos / pozo.matricula_total) * 100)}%`,
            }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
      </div>
      <div className="relative mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-[12px] font-medium tabular-nums text-white/75 max-md:mt-5 md:mt-6">
        <span className="flex items-center gap-[6px]">
          <Users size={14} className="text-[#FCD9A0]" aria-hidden />{" "}
          {formatNumber(pozo.alumnos_activos)} alumnos activos
        </span>
        <span className="flex items-center gap-[6px]">
          <Clock3 size={14} className="text-[#FCD9A0]" aria-hidden /> Cierre en {restante}
        </span>
        <span className="flex items-center gap-[6px] md:w-full">
          <ShieldCheck size={14} className="text-[#FCD9A0]" aria-hidden /> Custodia vía Mercado Pago
        </span>
      </div>
    </section>
  );
}
