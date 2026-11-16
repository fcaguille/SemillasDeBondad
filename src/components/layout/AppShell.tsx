import { useEffect, useState, type ReactNode } from "react";
import { Navigate, useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { useSesion } from "@/hooks/useSemillas";
import { Button } from "@/components/ui/button";
import { LINKS } from "@/services/config";

/** Routes that render as immersive / modal flows on mobile (no tab bar). */
const IMMERSIVE = ["/crear-maceta"];
const DARK = ["/escanear"];

/**
 * Authenticated app chrome. Mobile: bottom tab bar. Desktop: 240px sidebar +
 * centered max-w-5xl content. The chrome renders immediately; content shows a
 * skeleton while the session resolves. Guard: no session → /registro.
 * Free accounts ("Modo Gratuito") are allowed in; paid-only actions lock themselves.
 */
export function AppShell() {
  const sesion = useSesion();
  const usuario = sesion.data?.usuario ?? null;
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();
  const [introOpen, setIntroOpen] = useState(false);
  useEffect(() => {
    if (!usuario || typeof window === "undefined") return;
    const key = "semillas_intro_hardware_v1";
    if (!window.localStorage.getItem(key)) { setIntroOpen(true); window.localStorage.setItem(key, "1"); }
  }, [usuario?.id]);
  useEffect(() => {
    const reopen = () => setIntroOpen(true);
    window.addEventListener("semillas:ver-introduccion", reopen);
    return () => window.removeEventListener("semillas:ver-introduccion", reopen);
  }, []);

  if (!sesion.isLoading && !sesion.error && !usuario) {
    return <Navigate to={`/registro?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  const immersive = IMMERSIVE.includes(location.pathname);
  const dark = DARK.includes(location.pathname);

  const content = sesion.isLoading ? (
    <ShellSkeleton />
  ) : sesion.error && !usuario ? (
    <Page>
      <div className="mx-auto mt-10 max-w-md">
        <ErrorState error={sesion.error} onRetry={sesion.refetch} />
      </div>
    </Page>
  ) : (
    outlet
  );

  return (
    <div className="min-h-dvh">
      <Sidebar usuario={usuario} />
      <main
        className={immersive ? "md:pl-60" : "pb-[calc(var(--tabbar-h)+24px)] md:pb-10 md:pl-60"}
      >
        {/* Opacity-only: a transform here would break position:fixed children (scanner, sticky CTAs). */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={usuario ? location.pathname : "boot"}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </main>
      {!immersive && <BottomTabBar dark={dark} />}
      {introOpen && usuario && <div role="dialog" aria-modal="true" aria-labelledby="intro-title" className="fixed inset-0 z-[100] grid place-items-center bg-black/55 p-4"><section className="max-h-[90dvh] w-full max-w-xl overflow-y-auto rounded-2xl bg-background p-6 shadow-2xl"><p className="text-xs font-bold uppercase tracking-widest text-primary">FCA · UNAM</p><h2 id="intro-title" className="mt-2 text-2xl font-extrabold">Bienvenido a Semillas de Bondad</h2><p className="mt-3 text-sm leading-6">Un reto ecológico, social y financiero para impulsar a tu carrera: reutiliza materiales, crea comunidad y ayuda a construir un entorno más sustentable.</p><h3 className="mt-4 font-bold">Antes de participar</h3><p className="mt-1 text-sm leading-6">Puedes explorar y votar en Modo Gratuito. La garantía activa habilitará la creación de macetas y la participación en el premio cuando se active la pasarela. Se aplican reglas contra trampas y manipulaciones. Las fotografías de evidencia se guardan únicamente en tu dispositivo, no se suben al servidor.</p><a className="mt-2 inline-block text-sm font-semibold text-primary underline" href={LINKS.contrato} target="_blank" rel="noopener noreferrer">Consulta los Términos y Condiciones</a><p className="mt-4 rounded-xl bg-secondary p-3 text-sm font-semibold leading-6">Tienes hasta el 30 de noviembre de 2027 para hacer crecer a tu carrera; el 11 de diciembre de 2027 se publican los resultados y se abre la convocatoria para recibir el premio.</p><Button className="mt-5 w-full" onClick={() => setIntroOpen(false)}>Comenzar</Button></section></div>}
    </div>
  );
}

/** Non-blocking placeholder shown inside the chrome while the session loads. */
function ShellSkeleton() {
  return (
    <Page>
      <div role="status" aria-label="Cargando tu cuenta" className="flex flex-col gap-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-7 w-40 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="mt-2 grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[148px] rounded-card" />
          <Skeleton className="h-[148px] rounded-card" />
        </div>
        <Skeleton className="mt-4 h-5 w-48" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-[90px] rounded-card" />
          <Skeleton className="h-[90px] rounded-card" />
        </div>
      </div>
    </Page>
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
