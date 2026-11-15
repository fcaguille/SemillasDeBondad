/**
 * CollectiblePlantCard — the hero "Pokémon-style" card for /p/{id_planta}.
 *
 * Layer stack (inside a `perspective: 1000px` stage, `preserve-3d`):
 *   01 Base Card Frame ........ metallic silver-emerald 8px border (z 0)
 *   02 Botanical Art Slot ..... 280×210 SVG, pops out with translateZ(24px)
 *   03 Holographic Foil ....... radial + iridescent gradient that follows the pointer
 *   04 Metadata header/footer . title, score, creators, serial (z 10–12)
 *   05 Glare .................. specular highlight on top (z 30)
 *
 * NOTE: no ancestor of the art slot may use `overflow: hidden`, otherwise the
 * browser flattens the 3D context and translateZ stops working.
 */
import { useEffect, useRef, type PointerEvent } from "react";
import {
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type AnimationPlaybackControls,
} from "motion/react";
import { Zap } from "lucide-react";
import { ARQUETIPOS, BotanicalArt } from "@/components/botanical/BotanicalArt";
import { CARRERAS, type Planta } from "@/types/domain";
import { cn } from "@/lib/utils";

export const CARD_W = 330;
export const CARD_H = 460;
const MAX_TILT = 14;

const FRAME_GRADIENT =
  "linear-gradient(135deg,#E5E7EB 0%,#A7F3D0 16%,#94A3B8 32%,#F8FAFC 48%,#6EE7B7 62%,#9CA3AF 80%,#D1FAE5 100%)";
const IRIDESCENT =
  "linear-gradient(115deg,transparent 15%,rgba(255,64,200,0.55) 30%,rgba(0,240,255,0.55) 42%,rgba(140,255,120,0.5) 52%,rgba(255,220,60,0.55) 62%,transparent 78%)";

export type CollectiblePlanta = Pick<
  Planta,
  | "id"
  | "nombre"
  | "no_diseno"
  | "puntaje_neto"
  | "creadores"
  | "material"
  | "sistema_autorriego"
  | "serie"
  | "serie_total"
>;

export interface CollectiblePlantCardProps {
  planta: CollectiblePlanta;
  /** Enable pointer/touch tilt. Disable for exports and background previews. */
  interactive?: boolean;
  /** Gentle idle float when not being touched. */
  idle?: boolean;
  className?: string;
}

export function CollectiblePlantCard({
  planta,
  interactive = true,
  idle = true,
  className,
}: CollectiblePlantCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const live = interactive && !reduce;

  // Normalised pointer position (0–1) drives every layer.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 170, damping: 17, mass: 0.6 };
  const rotateX = useSpring(useTransform(py, [0, 1], [MAX_TILT, -MAX_TILT]), spring);
  const rotateY = useSpring(useTransform(px, [0, 1], [-MAX_TILT, MAX_TILT]), spring);
  const gx = useSpring(useTransform(px, [0, 1], [0, 100]), spring);
  const gy = useSpring(useTransform(py, [0, 1], [0, 100]), spring);
  const bgX = useTransform(gx, [0, 100], [10, 90]);
  const bgY = useTransform(gy, [0, 100], [10, 90]);
  const foilOpacity = useSpring(0.35, { stiffness: 120, damping: 20 });

  const holo = useMotionTemplate`radial-gradient(farthest-corner circle at ${gx}% ${gy}%, rgba(110,255,190,0.55) 0%, rgba(80,200,255,0.45) 22%, rgba(190,120,255,0.38) 42%, rgba(255,120,200,0.3) 60%, transparent 82%), ${IRIDESCENT}`;
  const holoPos = useMotionTemplate`center, ${bgX}% ${bgY}%`;
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.55), rgba(255,255,255,0.12) 28%, transparent 55%)`;
  const shadowX = useTransform(rotateY, (v) => -v * 1.2);
  const shadowY = useTransform(rotateX, (v) => 24 + v * 1.2);
  const shadow = useMotionTemplate`${shadowX}px ${shadowY}px 50px -20px rgba(15,23,42,0.5)`;
  const sheenPos = useMotionTemplate`${bgX}% ${bgY}%`;

  // Idle float — paused while the user is interacting.
  const idleRef = useRef<AnimationPlaybackControls[]>([]);
  const startIdle = () => {
    if (!live || !idle) return;
    idleRef.current = [
      animate(px, [0.5, 0.68, 0.32, 0.5], { duration: 7, repeat: Infinity, ease: "easeInOut" }),
      animate(py, [0.5, 0.36, 0.62, 0.5], { duration: 9, repeat: Infinity, ease: "easeInOut" }),
    ];
  };
  const stopIdle = () => {
    idleRef.current.forEach((c) => c.stop());
    idleRef.current = [];
  };
  useEffect(() => {
    startIdle();
    return stopIdle;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, idle]);

  const track = (e: PointerEvent<HTMLDivElement>) => {
    if (!live || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)));
    py.set(Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
  };
  const onEnter = (e: PointerEvent<HTMLDivElement>) => {
    if (!live) return;
    stopIdle();
    foilOpacity.set(0.8);
    track(e);
  };
  const onLeave = () => {
    if (!live) return;
    px.set(0.5);
    py.set(0.5);
    foilOpacity.set(0.35);
    startIdle();
  };

  const arquetipo = ARQUETIPOS[planta.no_diseno];
  const serie = `${String(planta.serie).padStart(3, "0")}/${planta.serie_total}`;

  return (
    <div
      className={cn("shrink-0 text-foreground [perspective:1000px]", className)}
      style={{ width: CARD_W, height: CARD_H }}
    >
      <motion.div
        ref={ref}
        role="img"
        aria-label={`Carta coleccionable de ${planta.nombre}, ${planta.puntaje_neto} puntos`}
        onPointerEnter={onEnter}
        onPointerMove={track}
        onPointerLeave={onLeave}
        onPointerCancel={onLeave}
        className="relative size-full touch-pan-y select-none rounded-collectible"
        style={{
          rotateX: live ? rotateX : 0,
          rotateY: live ? rotateY : 0,
          transformStyle: "preserve-3d",
          boxShadow: live ? shadow : "0 24px 50px -20px rgba(15,23,42,0.45)",
        }}
      >
        {/* 01 — Base Card Frame */}
        <div
          data-layer="01-base-frame"
          className="absolute inset-0 animate-shimmer rounded-collectible shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]"
          style={{ background: FRAME_GRADIENT, backgroundSize: "200% 200%" }}
        />

        {/* Card body (no overflow-hidden: keeps 3D context) */}
        <div
          className="absolute inset-2 flex flex-col rounded-[17px] border border-brand/20 bg-gradient-to-b from-[#FCFEFB] to-[#E8F4EA] px-[16px] pb-3 pt-3"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* 04a — Metadata header */}
          <header
            data-layer="04-meta-header"
            className="flex items-start justify-between gap-2"
            style={{ transform: "translateZ(12px)" }}
          >
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand">
                Arquetipo Botánico #{planta.no_diseno}
              </p>
              <h2 className="line-clamp-2 text-[18px] font-extrabold leading-tight tracking-[-0.02em] text-foreground">
                {planta.nombre}
              </h2>
            </div>
            <span className="mt-[2px] inline-flex h-7 shrink-0 items-center gap-1 rounded-full bg-obsidian px-[10px] text-[12px] font-extrabold tabular-nums text-[#FCD34D] shadow-[inset_0_0_0_1px_rgba(252,211,77,0.35)]">
              <Zap size={13} fill="currentColor" aria-hidden /> {planta.puntaje_neto} PTS
            </span>
          </header>

          {/* 02 — Botanical Art Slot (pop-out) */}
          <div
            data-layer="02-art-slot"
            className="relative mt-2 h-[210px] w-[280px] shrink-0 rounded-[12px] p-[2px] shadow-[0_14px_24px_-12px_rgba(15,23,42,0.45)]"
            style={{ background: FRAME_GRADIENT, transform: "translateZ(24px)" }}
          >
            <div className="relative size-full overflow-hidden rounded-[10px] bg-white">
              <BotanicalArt noDiseno={planta.no_diseno} className="size-full" />
              {/* 03 — Holographic foil over the artwork */}
              <motion.div
                data-layer="03-holo-foil"
                aria-hidden
                className="pointer-events-none absolute inset-0 mix-blend-color-dodge"
                style={{
                  backgroundImage: holo,
                  backgroundSize: "100% 100%, 260% 260%",
                  backgroundPosition: holoPos,
                  opacity: foilOpacity,
                }}
              />
              <span className="absolute bottom-[6px] left-[6px] rounded-full bg-white/85 px-2 py-[2px] text-[9px] font-semibold text-muted-foreground backdrop-blur">
                #{planta.no_diseno} · {arquetipo.nombre}
              </span>
            </div>
          </div>

          {/* 04b — Metadata strip */}
          <div
            data-layer="04-meta-strip"
            className="mt-3"
            style={{ transform: "translateZ(10px)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              Creadores:
            </p>
            <ul className="mt-[6px] flex flex-wrap gap-[6px]">
              {planta.creadores.map((c) => (
                <li
                  key={c.usuario_id}
                  className="inline-flex h-6 items-center rounded-full border border-border bg-white px-2 text-[11px] font-semibold"
                >
                  {c.nickname} ({CARRERAS[c.carrera].corto})
                </li>
              ))}
            </ul>
          </div>

          {/* 04c — Footer */}
          <footer
            data-layer="04-meta-footer"
            className="mt-auto flex items-end justify-between gap-2 border-t border-brand/15 pt-2"
            style={{ transform: "translateZ(10px)" }}
          >
            <p className="text-[10px] font-semibold leading-[13px] text-muted-foreground">
              Material: {planta.material}
              <br />
              {planta.sistema_autorriego ? "Sistema Autorriego" : "Hecha a mano en FCA"}
            </p>
            <p className="text-right font-mono text-[10px] font-semibold leading-[13px] tabular-nums text-foreground">
              {serie}
              <br />
              <span className="text-muted-foreground">FCA-UNAM</span>
            </p>
          </footer>
        </div>

        {/* 03b — Foil sheen on the frame */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-collectible mix-blend-overlay"
          style={{
            backgroundImage: IRIDESCENT,
            backgroundSize: "260% 260%",
            backgroundPosition: sheenPos,
            opacity: foilOpacity,
          }}
        />
        {/* 05 — Glare */}
        {live && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-collectible mix-blend-soft-light"
            style={{ backgroundImage: glare, transform: "translateZ(30px)" }}
          />
        )}
      </motion.div>
    </div>
  );
}
