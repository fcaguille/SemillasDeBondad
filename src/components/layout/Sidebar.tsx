import { Link, NavLink } from "react-router";
import { motion } from "motion/react";
import { Lock, Plus } from "lucide-react";
import { NAV_ITEMS } from "./nav";
import { BrandMark } from "@/components/brand/BrandMark";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { CARRERAS, tieneGarantia, type Usuario } from "@/types/domain";
import { cn } from "@/lib/utils";

/** Desktop (≥768px) Apple-style sidebar, 240px. */
export function Sidebar({ usuario }: { usuario: Usuario | null }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-white/70 px-4 pb-4 pt-6 backdrop-blur-xl md:flex">
      <Link to="/impacto" className="flex items-center gap-3 px-2">
        <BrandMark size={36} />
        <div className="leading-tight">
          <p className="text-[15px] font-extrabold tracking-[-0.01em]">Semillas de Bondad</p>
          <p className="text-[11px] font-medium text-muted-foreground">FCA · UNAM</p>
        </div>
      </Link>

      {usuario && !tieneGarantia(usuario) ? (
        <Button asChild variant="outline" className="mt-6 w-full text-muted-foreground">
          <Link to="/crear-maceta" title="Activa tu garantía para crear macetas">
            <Lock size={16} strokeWidth={2.4} /> Registrar maceta
          </Link>
        </Button>
      ) : (
        <Button asChild className="mt-6 w-full">
          <Link to="/crear-maceta">
            <Plus size={18} strokeWidth={2.6} /> Registrar maceta
          </Link>
        </Button>
      )}

      <nav aria-label="Navegación principal" className="mt-6">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  cn(
                    "relative flex h-10 items-center gap-3 rounded-[10px] px-3 text-[14px] font-semibold transition-colors",
                    isActive
                      ? "text-brand-deep"
                      : "text-muted-foreground hover:bg-black/[0.03] hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-[10px] bg-brand-tint"
                        transition={{ type: "spring", stiffness: 500, damping: 40 }}
                      />
                    )}
                    <Icon
                      size={19}
                      strokeWidth={isActive ? 2.25 : 1.9}
                      className="relative"
                      aria-hidden
                    />
                    <span className="relative">{label === "Escanear" ? "Escanear QR" : label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {usuario && (
        <Link
          to="/cuenta"
          className="mt-auto flex items-center gap-3 rounded-[14px] border border-border bg-card p-3 transition hover:bg-muted"
        >
          <Avatar nickname={usuario.nickname} src={usuario.avatar_url} size={36} />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-bold">{usuario.nickname}</p>
            <p className="truncate text-[11px] text-muted-foreground">
              {CARRERAS[usuario.carrera].nombre}
            </p>
          </div>
        </Link>
      )}
    </aside>
  );
}
