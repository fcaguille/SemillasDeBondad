import type { ReactNode } from "react";
import { Navigate, useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { FullScreenLoader } from "@/components/common/States";
import { useUsuarioActual } from "@/hooks/useSemillas";

/** Routes that render as immersive / modal flows on mobile (no tab bar). */
const IMMERSIVE = ["/crear-maceta"];
const DARK = ["/escanear"];

/**
 * Authenticated app chrome. Mobile: bottom tab bar. Desktop: 240px sidebar +
 * centered max-w-5xl content. Guards: no session → /registro, unpaid → /registro.
 */
export function AppShell() {
  const { data: usuario, isLoading } = useUsuarioActual();
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();

  if (isLoading) return <FullScreenLoader />;
  if (!usuario || usuario.estado !== "activa") {
    return <Navigate to={`/registro?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const immersive = IMMERSIVE.includes(location.pathname);
  const dark = DARK.includes(location.pathname);

  return (
    <div className="min-h-dvh">
      <Sidebar usuario={usuario} />
      <main
        className={immersive ? "md:pl-60" : "pb-[calc(var(--tabbar-h)+24px)] md:pb-10 md:pl-60"}
      >
        {/* Opacity-only: a transform here would break position:fixed children (scanner, sticky CTAs). */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {outlet}
          </motion.div>
        </AnimatePresence>
      </main>
      {!immersive && <BottomTabBar dark={dark} />}
    </div>
  );
}

/** Standard page container + iOS large title header. */
export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`mx-auto w-full max-w-5xl px-5 pt-[calc(16px+var(--safe-top))] md:px-10 md:pt-10 ${className}`}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] md:text-[34px]">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}
