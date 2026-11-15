/**
 * Inline SVG artwork for the 5 recycled-planter archetypes (`no_diseno` 1–5).
 * Every illustration shares a 280×210 viewBox and a sunlit backdrop so it
 * drops into the collectible card's art slot (layer 02).
 */
import { useId, type ComponentType } from "react";
import type { NoDiseno } from "@/types/domain";

export const ARQUETIPOS: Record<
  NoDiseno,
  { nombre: string; material: string; paleta: readonly string[] }
> = {
  1: {
    nombre: "Nopalito en Lata",
    material: "Lata de aluminio",
    paleta: ["#4D9E5B", "#EC4899", "#CBD5E1"],
  },
  2: {
    nombre: "Suculenta Roseta",
    material: "Base de garrafón",
    paleta: ["#86EFAC", "#F9A8D4", "#F8FAFC"],
  },
  3: {
    nombre: "PET Autorriego",
    material: "Botella PET + tapas",
    paleta: ["#22C55E", "#38BDF8", "#FACC15"],
  },
  4: {
    nombre: "Cempasúchil Reciclado",
    material: "Lata pintada",
    paleta: ["#F97316", "#0D9488", "#FDE68A"],
  },
  5: {
    nombre: "Helecho Tetrapak",
    material: "Envase Tetra Pak",
    paleta: ["#16A34A", "#F1F5F9", "#60A5FA"],
  },
};

const useSafeId = () => useId().replace(/[^a-zA-Z0-9_-]/g, "");

function Backdrop({
  id,
  tone = "sun",
}: {
  id: string;
  tone?: "sun" | "mint" | "peach" | "sky" | "cream";
}) {
  const tones = {
    sun: ["#FFF7E0", "#E3F4E6"],
    mint: ["#EAF8EF", "#D7EFE0"],
    peach: ["#FFF1E4", "#FBE3D2"],
    sky: ["#EAF6FD", "#E2F3E8"],
    cream: ["#F7F4EA", "#E6F0E2"],
  }[tone];
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={tones[0]} />
          <stop offset="1" stopColor={tones[1]} />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FFE9A8" stopOpacity="0.95" />
          <stop offset="1" stopColor="#FFE9A8" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="280" height="210" fill={`url(#${id}-bg)`} />
      <circle cx="232" cy="38" r="70" fill={`url(#${id}-sun)`} />
      <circle cx="232" cy="38" r="16" fill="#FFF3C4" opacity="0.9" />
      {/* soft background foliage */}
      <g fill="#15803D" opacity="0.09">
        <path d="M-10 120c30-40 60-50 80-48-10 28-40 52-80 48Z" />
        <path d="M-6 80c24-30 50-36 64-32-10 22-34 38-64 32Z" />
        <path d="M290 150c-30-34-60-40-80-36 12 26 44 44 80 36Z" />
      </g>
      {/* window light rays */}
      <g fill="#FFFFFF" opacity="0.35">
        <path d="M150 0h26l-60 210H90Z" />
        <path d="M196 0h12l-52 210h-12Z" />
      </g>
      <rect y="178" width="280" height="32" fill="#E9DEC6" opacity="0.7" />
      <rect y="178" width="280" height="1.5" fill="#D4C5A5" opacity="0.8" />
    </g>
  );
}

function Nopal({ id }: { id: string }) {
  const pad = (cx: number, cy: number, rx: number, ry: number, rot: number) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <ellipse
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={`url(#${id}-pad)`}
        stroke="#2F6B3A"
        strokeWidth="1.5"
      />
      <ellipse
        cx={cx - rx * 0.3}
        cy={cy - ry * 0.3}
        rx={rx * 0.35}
        ry={ry * 0.5}
        fill="#fff"
        opacity="0.12"
      />
      {[-0.5, 0, 0.5].flatMap((dx) =>
        [-0.5, 0, 0.5].map((dy) => (
          <g key={`${dx}${dy}`}>
            <circle cx={cx + dx * rx} cy={cy + dy * ry} r="1.4" fill="#FEF3C7" />
            <path
              d={`M${cx + dx * rx} ${cy + dy * ry} l3 -3`}
              stroke="#FEF3C7"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
          </g>
        )),
      )}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-pad`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6BBF73" />
          <stop offset="1" stopColor="#3C8A4A" />
        </linearGradient>
        <linearGradient id={`${id}-can`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#94A3B8" />
          <stop offset="0.35" stopColor="#F1F5F9" />
          <stop offset="0.6" stopColor="#CBD5E1" />
          <stop offset="1" stopColor="#7C8BA1" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="188" rx="58" ry="7" fill="#000" opacity="0.12" />
      {pad(140, 92, 22, 32, 0)}
      {pad(112, 62, 16, 24, -28)}
      {pad(170, 58, 17, 25, 24)}
      {pad(140, 38, 13, 19, 4)}
      <ellipse cx="104" cy="38" rx="6" ry="8" fill="#EC4899" transform="rotate(-25 104 38)" />
      <ellipse cx="178" cy="32" rx="6" ry="8" fill="#DB2777" transform="rotate(20 178 32)" />
      <ellipse cx="140" cy="16" rx="5.5" ry="7" fill="#F472B6" />
      {/* tin can */}
      <path d="M98 120h84v60a6 6 0 0 1-6 6h-72a6 6 0 0 1-6-6Z" fill={`url(#${id}-can)`} />
      <ellipse cx="140" cy="120" rx="42" ry="6" fill="#5B4636" />
      <path d="M98 120a42 6 0 0 0 84 0" fill="none" stroke="#E2E8F0" strokeWidth="2" />
      <rect x="98" y="138" width="84" height="26" fill="#F59E0B" opacity="0.9" />
      <rect x="98" y="138" width="84" height="3" fill="#B45309" opacity="0.5" />
      <text
        x="140"
        y="156"
        textAnchor="middle"
        fontSize="10"
        fontWeight="800"
        fill="#7C2D12"
        fontFamily="Inter"
      >
        RE·USO
      </text>
      {[126, 132, 172, 178].map((y) => (
        <rect key={y} x="98" y={y} width="84" height="1" fill="#64748B" opacity="0.35" />
      ))}
    </g>
  );
}

function Rosette({ id }: { id: string }) {
  const ring = (count: number, len: number, w: number, offset: number, fill: string, cy = 104) =>
    Array.from({ length: count }, (_, i) => {
      const a = (360 / count) * i + offset;
      return (
        <g key={`${len}-${i}`} transform={`rotate(${a} 140 ${cy})`}>
          <path
            d={`M140 ${cy} C ${140 - w} ${cy - len * 0.4}, ${140 - w * 0.7} ${cy - len * 0.9}, 140 ${cy - len} C ${140 + w * 0.7} ${cy - len * 0.9}, ${140 + w} ${cy - len * 0.4}, 140 ${cy} Z`}
            fill={fill}
            stroke="#3E8E5A"
            strokeWidth="0.8"
          />
          <circle cx="140" cy={cy - len + 3} r="2.2" fill="#F472B6" opacity="0.85" />
        </g>
      );
    });
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-pot`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#DCEFF7" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#C7E3EF" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="188" rx="64" ry="7" fill="#000" opacity="0.12" />
      {/* garrafón base pot with petaloid feet */}
      <path
        d="M86 112h108l-6 58c-1 8-6 14-14 14h-6l-4 4h-12l-4-4h-16l-4 4h-12l-4-4h-6c-8 0-13-6-14-14Z"
        fill={`url(#${id}-pot)`}
        stroke="#9CC9DC"
        strokeWidth="1.5"
      />
      <path
        d="M98 122c2 18 3 36 6 54"
        stroke="#fff"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {[
        [120, 140],
        [150, 132],
        [168, 156],
        [132, 164],
        [178, 128],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="4" fill="#F9A8D4" />
      ))}
      {[
        [110, 158],
        [160, 146],
        [142, 150],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="3" fill="#86EFAC" />
      ))}
      <ellipse cx="140" cy="112" rx="54" ry="6" fill="#6B4F3A" />
      {ring(12, 54, 16, 0, "#A7E3B8")}
      {ring(10, 40, 13, 18, "#8BD9A3")}
      {ring(8, 26, 10, 8, "#6FCB8B")}
      {ring(6, 14, 7, 30, "#58BC77")}
    </g>
  );
}

/** Archetype #3 — hero: self-watering PET bottle with bottle-cap collar and capybara label */
function PetBottle({ id }: { id: string }) {
  const caps = ["#EF4444", "#FACC15", "#3B82F6", "#22C55E", "#F97316", "#A855F7", "#EF4444"];
  const leaf = (x: number, y: number, r: number, rot: number) => (
    <g transform={`rotate(${rot} ${x} ${y})`}>
      <ellipse
        cx={x}
        cy={y}
        rx={r}
        ry={r * 0.86}
        fill={`url(#${id}-leaf)`}
        stroke="#166534"
        strokeWidth="1"
      />
      <path
        d={`M${x} ${y + r * 0.8} L${x} ${y - r * 0.5}`}
        stroke="#BBF7D0"
        strokeWidth="1"
        opacity="0.8"
      />
      <circle cx={x} cy={y + r * 0.1} r="1.6" fill="#BBF7D0" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-leaf`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4ADE80" />
          <stop offset="1" stopColor="#15803D" />
        </linearGradient>
        <linearGradient id={`${id}-pet`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#BAE6FD" stopOpacity="0.75" />
          <stop offset="0.3" stopColor="#F0F9FF" stopOpacity="0.45" />
          <stop offset="0.7" stopColor="#E0F2FE" stopOpacity="0.35" />
          <stop offset="1" stopColor="#7DD3FC" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`${id}-water`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7DD3FC" stopOpacity="0.75" />
          <stop offset="1" stopColor="#38BDF8" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="189" rx="66" ry="7" fill="#000" opacity="0.13" />

      {/* foliage behind */}
      <path
        d="M140 112C134 86 118 66 100 54"
        stroke="#15803D"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 112C146 82 162 58 182 46"
        stroke="#15803D"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 112C140 84 142 56 140 34"
        stroke="#15803D"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 112C124 100 104 94 86 92"
        stroke="#15803D"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M140 112C158 98 178 90 196 90"
        stroke="#15803D"
        strokeWidth="2.2"
        fill="none"
        strokeLinecap="round"
      />
      {/* tall blade leaves */}
      <path
        d="M128 112c-10-30-6-58 2-76 6 22 6 50-2 76Z"
        fill="#16A34A"
        stroke="#14532D"
        strokeWidth="1"
      />
      <path
        d="M152 112c12-26 14-50 8-70-10 20-14 44-8 70Z"
        fill="#22C55E"
        stroke="#14532D"
        strokeWidth="1"
      />
      <path d="M131 92c1-14 0-28-1-42" stroke="#BBF7D0" strokeWidth="1" opacity="0.7" />
      {leaf(100, 52, 15, -20)}
      {leaf(182, 44, 16, 15)}
      {leaf(140, 30, 13, 0)}
      {leaf(84, 90, 13, -40)}
      {leaf(198, 88, 13, 35)}
      {leaf(116, 74, 10, -10)}
      {leaf(166, 70, 11, 20)}

      {/* PET bottle body */}
      <path
        d="M90 110h100v62c0 8-5 13-12 13h-8l-5 3h-12l-4-3h-18l-4 3h-12l-5-3h-8c-7 0-12-5-12-13Z"
        fill={`url(#${id}-pet)`}
        stroke="#7DC4E4"
        strokeWidth="1.6"
      />
      {/* reservoir water */}
      <path d="M92 160h96v12c0 7-4 11-10 11H102c-6 0-10-4-10-11Z" fill={`url(#${id}-water)`} />
      <path d="M96 162q11 -3 22 0t22 0t22 0t22 0" stroke="#E0F2FE" strokeWidth="1.4" fill="none" />
      {/* inverted neck with soil */}
      <path d="M94 112h92l-26 34v14h-20v-14Z" fill="#6B4F3A" />
      <path
        d="M94 112h92l-26 34v14h-20v-14Z"
        fill="none"
        stroke="#9AD3EA"
        strokeWidth="1.2"
        opacity="0.9"
      />
      {[
        [110, 118],
        [130, 124],
        [158, 120],
        [172, 116],
        [146, 132],
        [122, 116],
      ].map(([x, y]) => (
        <circle key={`${x}${y}`} cx={x} cy={y} r="1.6" fill="#8B6B52" />
      ))}
      <rect
        x="140"
        y="158"
        width="20"
        height="4"
        rx="1.5"
        fill="#F8FAFC"
        stroke="#94A3B8"
        strokeWidth="0.8"
      />
      {/* cotton wick */}
      <path
        d="M150 140c-3 8 4 14 0 22s3 10 0 18"
        stroke="#FDE7C2"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
      />
      {/* capybara label */}
      <rect
        x="102"
        y="128"
        width="30"
        height="26"
        rx="6"
        fill="#FEF3C7"
        stroke="#F2D58A"
        strokeWidth="1"
      />
      <g transform="translate(117 142)">
        <circle cx="-7" cy="-7" r="2.6" fill="#8A5A34" />
        <circle cx="7" cy="-7" r="2.6" fill="#8A5A34" />
        <rect x="-10" y="-8" width="20" height="15" rx="7" fill="#B7794B" />
        <circle cx="-4" cy="-2.5" r="1.4" fill="#1F2937" />
        <circle cx="4" cy="-2.5" r="1.4" fill="#1F2937" />
        <rect x="-5.5" y="1" width="11" height="5.5" rx="2.8" fill="#8A5A34" />
        <circle cx="-2" cy="3.5" r="0.8" fill="#1F2937" />
        <circle cx="2" cy="3.5" r="0.8" fill="#1F2937" />
        <path
          d="M-6 -12q2-3 4-1"
          stroke="#22C55E"
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
        />
      </g>
      {/* highlight streaks */}
      <path
        d="M97 118c-1 18 0 40 3 58"
        stroke="#fff"
        strokeWidth="4"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M182 120c1 14 0 30-2 44"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* bottle-cap collar */}
      {caps.map((c, i) => {
        const x = 96 + i * 14.6;
        return (
          <g key={i}>
            <circle cx={x} cy="110" r="7.4" fill={c} stroke="#00000022" strokeWidth="1" />
            <circle cx={x} cy="110" r="4.6" fill="none" stroke="#ffffff66" strokeWidth="1.2" />
            <circle cx={x - 2} cy="107.6" r="1.4" fill="#fff" opacity="0.7" />
          </g>
        );
      })}
    </g>
  );
}

function Marigold({ id }: { id: string }) {
  const flower = (cx: number, cy: number, r: number) => (
    <g>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 14;
        return (
          <circle
            key={`o${i}`}
            cx={cx + Math.cos(a) * r * 0.72}
            cy={cy + Math.sin(a) * r * 0.72}
            r={r * 0.36}
            fill="#FB923C"
          />
        );
      })}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (Math.PI * 2 * i) / 10 + 0.3;
        return (
          <circle
            key={`m${i}`}
            cx={cx + Math.cos(a) * r * 0.44}
            cy={cy + Math.sin(a) * r * 0.44}
            r={r * 0.3}
            fill="#F97316"
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.32} fill="#EA580C" />
      <circle cx={cx - r * 0.1} cy={cy - r * 0.12} r={r * 0.12} fill="#FDBA74" />
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-can4`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0F766E" />
          <stop offset="0.4" stopColor="#14B8A6" />
          <stop offset="1" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="188" rx="58" ry="7" fill="#000" opacity="0.12" />
      {[
        "M140 120C136 96 116 78 104 64",
        "M140 120C144 92 164 70 178 58",
        "M140 120C140 90 138 60 140 40",
        "M140 120C128 104 112 98 96 96",
        "M140 120C154 106 172 100 188 100",
      ].map((d) => (
        <path key={d} d={d} stroke="#3F7D3A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
      ))}
      {[
        [118, 92, -40],
        [162, 86, 40],
        [128, 70, -20],
        [152, 64, 25],
        [110, 106, -70],
        [172, 108, 70],
      ].map(([x, y, r]) => (
        <path
          key={`${x}${y}`}
          transform={`rotate(${r} ${x} ${y})`}
          d={`M${x} ${y + 12}c-6-6-6-18 0-24 6 6 6 18 0 24Z`}
          fill="#4D9E4A"
          stroke="#2F6B2C"
          strokeWidth="0.8"
        />
      ))}
      {flower(104, 62, 15)}
      {flower(178, 56, 16)}
      {flower(140, 38, 17)}
      {flower(94, 96, 11)}
      {flower(190, 98, 12)}
      {/* painted can */}
      <path d="M96 122h88v58a6 6 0 0 1-6 6H102a6 6 0 0 1-6-6Z" fill={`url(#${id}-can4)`} />
      <ellipse cx="140" cy="122" rx="44" ry="6" fill="#5B4636" />
      <path d="M96 122a44 6 0 0 0 88 0" fill="none" stroke="#99F6E4" strokeWidth="2" />
      {/* papel picado band */}
      <rect x="96" y="132" width="88" height="5" fill="#FDE68A" />
      {Array.from({ length: 11 }, (_, i) => (
        <path key={i} d={`M${96 + i * 8} 137l4 7l4 -7Z`} fill="#FDE68A" />
      ))}
      {[
        [114, 160],
        [140, 166],
        [166, 160],
      ].map(([x, y]) => (
        <g key={x}>
          <circle cx={x} cy={y} r="6" fill="#FB923C" />
          <circle cx={x} cy={y} r="2.4" fill="#FDE68A" />
        </g>
      ))}
    </g>
  );
}

function Fern({ id }: { id: string }) {
  const frond = (angle: number, len: number, key: number) => (
    <g key={key} transform={`rotate(${angle} 140 112)`}>
      <path
        d={`M140 112 Q ${142} ${112 - len / 2} 140 ${112 - len}`}
        stroke="#166534"
        strokeWidth="1.6"
        fill="none"
      />
      {Array.from({ length: 9 }, (_, i) => {
        const t = (i + 1) / 10;
        const y = 112 - len * t;
        const s = (1 - t) * 13 + 3;
        return (
          <g key={i}>
            <ellipse
              cx={140 - s * 0.7}
              cy={y}
              rx={s * 0.75}
              ry={s * 0.28}
              fill="#22C55E"
              transform={`rotate(-28 ${140 - s * 0.7} ${y})`}
            />
            <ellipse
              cx={140 + s * 0.7}
              cy={y}
              rx={s * 0.75}
              ry={s * 0.28}
              fill="#16A34A"
              transform={`rotate(28 ${140 + s * 0.7} ${y})`}
            />
          </g>
        );
      })}
    </g>
  );
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-tp`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#E2E8F0" />
          <stop offset="0.5" stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#CBD5E1" />
        </linearGradient>
      </defs>
      <ellipse cx="140" cy="188" rx="54" ry="7" fill="#000" opacity="0.12" />
      {[-62, -36, -12, 12, 36, 62].map((a, i) => frond(a, i % 2 ? 92 : 78, i))}
      {frond(0, 100, 99)}
      {/* tetra pak carton */}
      <path
        d="M100 116h80v66a4 4 0 0 1-4 4h-72a4 4 0 0 1-4-4Z"
        fill={`url(#${id}-tp)`}
        stroke="#94A3B8"
        strokeWidth="1.2"
      />
      <path d="M100 116l8-8h64l8 8" fill="#F1F5F9" stroke="#94A3B8" strokeWidth="1.2" />
      <ellipse cx="140" cy="113" rx="34" ry="3.5" fill="#5B4636" />
      <rect x="100" y="132" width="80" height="34" fill="#60A5FA" opacity="0.9" />
      <path d="M100 150q20 -10 40 0t40 0v16h-80Z" fill="#3B82F6" />
      <circle cx="122" cy="142" r="5" fill="#FDE68A" />
      <text
        x="160"
        y="146"
        textAnchor="middle"
        fontSize="8"
        fontWeight="800"
        fill="#fff"
        fontFamily="Inter"
      >
        LECHE
      </text>
      <path d="M108 124h64" stroke="#94A3B8" strokeWidth="0.8" strokeDasharray="2 2" />
    </g>
  );
}

const TONES = { 1: "cream", 2: "mint", 3: "sun", 4: "peach", 5: "sky" } as const;
const PLANTS: Record<NoDiseno, ComponentType<{ id: string }>> = {
  1: Nopal,
  2: Rosette,
  3: PetBottle,
  4: Marigold,
  5: Fern,
};

interface ArtProps {
  className?: string;
  /** Set false when the art is decorative (e.g. thumbnails next to a visible name). */
  labelled?: boolean;
}

function makeDiseno(n: NoDiseno) {
  function Diseno({ className, labelled = true }: ArtProps) {
    const id = useSafeId();
    const Plant = PLANTS[n];
    return (
      <svg
        viewBox="0 0 280 210"
        className={className}
        preserveAspectRatio="xMidYMid slice"
        role={labelled ? "img" : undefined}
        aria-hidden={labelled ? undefined : true}
        aria-label={labelled ? `Ilustración botánica #${n}: ${ARQUETIPOS[n].nombre}` : undefined}
      >
        <Backdrop id={id} tone={TONES[n]} />
        <Plant id={id} />
      </svg>
    );
  }
  Diseno.displayName = `Diseno${n}`;
  return Diseno;
}

export const DisenoNopal = makeDiseno(1);
export const DisenoSuculenta = makeDiseno(2);
export const DisenoPetAutorriego = makeDiseno(3);
export const DisenoCempasuchil = makeDiseno(4);
export const DisenoHelecho = makeDiseno(5);

const DISENOS: Record<NoDiseno, ComponentType<ArtProps>> = {
  1: DisenoNopal,
  2: DisenoSuculenta,
  3: DisenoPetAutorriego,
  4: DisenoCempasuchil,
  5: DisenoHelecho,
};

export function BotanicalArt({ noDiseno, ...props }: ArtProps & { noDiseno: NoDiseno }) {
  const Art = DISENOS[noDiseno] ?? DisenoPetAutorriego;
  return <Art {...props} />;
}

/* Botanical line-art watermark used on the emerald hero card */
export function LeafWatermark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 200"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden
    >
      <path d="M100 196V70" />
      <path d="M100 150c-30-6-52-28-56-62 32 2 54 24 56 62Z" />
      <path d="M100 120c30-6 52-28 56-62-32 2-54 24-56 62Z" />
      <path d="M100 88c-18-8-30-26-30-50 22 4 32 24 30 50Z" />
      <path d="M100 70c10-16 26-26 46-26-4 20-22 30-46 26Z" />
      <path d="M44 88c18 18 36 40 56 62M156 58c-18 18-36 40-56 62M70 38c8 14 20 32 30 50" />
    </svg>
  );
}
