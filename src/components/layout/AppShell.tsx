import { useState, type ReactNode } from "react";
import { Navigate, useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BottomTabBar } from "./BottomTabBar";
import { ErrorState } from "@/components/common/States";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSesion } from "@/hooks/useSemillas";
import { activarGarantia } from "@/lib/pagos";
import { supabase } from "@/services/supabaseClient";

/** Routes that render as immersive / modal flows on mobile (no tab bar). */
const IMMERSIVE = ["/crear-maceta"];
const DARK = ["/escanear"];

export function AppShell() {
  const sesion = useSesion();
  const usuario = sesion.data?.usuario ?? null;
  const location = useLocation();
  const outlet = useOutlet();
  const reduce = useReducedMotion();
  const [reactivando, setReactivando] = useState(false);
  const [errorReactivacion, setErrorReactivacion] = useState<string | null>(null);

  if (!sesion.isLoading && !sesion.error && !usuario) {
    return <Navigate to={`/registro?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  if (!sesion.isLoading && usuario?.descalificado) {
    const garantiaDevuelta = usuario.motivo_descalificacion === "GARANTIA_DEVUELTA";
    const reactivar = async () => {
      setErrorReactivacion(null);
      setReactivando(true);
      try { await activarGarantia(); }
      catch (e) { setErrorReactivacion(e instanceof Error ? e.message : "No pudimos iniciar el pago."); setReactivando(false); }
    };
    const cerrarSesion = async () => {
      await supabase.auth.signOut();
      window.location.assign("/registro");
    };
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-5 py-10">
        <section className="w-full max-w-lg rounded-2xl border border-border bg-card p-7 text-center shadow-card">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-amber-100 text-amber-800" aria-hidden="true">
            <span className="text-2xl">!</span>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">Semillas de Bondad · FCA-UNAM</p>
          <h1 className="mt-3 text-2xl font-extrabold tracking-tight">Modo de Descalificación</h1>
          {garantiaDevuelta ? (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Tu garantía fue devuelta. Tu cuenta y tus aportaciones se encuentran en modo de descalificación hasta que vuelvas a cubrir la garantía de participación ($16.00 MXN).
            </p>
          ) : (
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Tu cuenta ha sido descalificada permanentemente por incumplimiento de las reglas de participación. El acceso a la aplicación permanece bloqueado.
            </p>
          )}
          {errorReactivacion && <p role="alert" className="mt-4 text-sm font-medium text-destructive">{errorReactivacion}</p>}
          <div className="mt-6 grid gap-3">
            {garantiaDevuelta && (
              <Button onClick={reactivar} disabled={reactivando} className="w-full" size="lg">
                {reactivando ? "Conectando con Mercado Pago…" : "Reactivar Cuenta Pagando Garantía ($16.00 MXN)"}
              </Button>
            )}
            <Button onClick={cerrarSesion} variant="outline" className="w-full">Cerrar sesión</Button>
          </div>
        </section>
      </main>
    );
  }

  const immersive = IMMERSIVE.includes(location.pathname);
  const dark = DARK.includes(location.pathname);
  const content = sesion.isLoading ? (
    <ShellSkeleton />
  ) : sesion.error && !usuario ? (
    <Page><div className="mx-auto mt-10 max-w-md"><ErrorState error={sesion.error} onRetry={sesion.refetch} /></div></Page>
  ) : outlet;

  return (
    <div className="min-h-dvh">
      <Sidebar usuario={usuario} />
      <main className={immersive ? "md:pl-60" : "pb-[calc(var(--tabbar-h)+24px)] md:pb-10 md:pl-60"}>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={usuario ? location.pathname : "boot"}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >{content}</motion.div>
        </AnimatePresence>
      </main>
      {!immersive && <BottomTabBar dark={dark} />}
    </div>
  );
}

function ShellSkeleton() {
  return (
    <Page>
      <div role="status" aria-label="Cargando tu cuenta" className="flex flex-col gap-4">
        <Skeleton className="h-4 w-36" /><Skeleton className="h-8 w-64" />
        <div className="flex gap-2"><Skeleton className="h-7 w-40 rounded-full" /><Skeleton className="h-7 w-28 rounded-full" /></div>
        <div className="mt-2 grid gap-4 md:grid-cols-2"><Skeleton className="h-[148px] rounded-card" /><Skeleton className="h-[148px] rounded-card" /></div>
        <Skeleton className="mt-4 h-5 w-48" />
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3"><Skeleton className="h-[90px] rounded-card" /><Skeleton className="h-[90px] rounded-card" /></div>
      </div>
    </Page>
  );
}

export function Page({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-5xl px-5 pt-[calc(16px+var(--safe-top))] md:px-10 md:pt-10 ${className}`}>{children}</div>;
}

export function PageHeader({ eyebrow, title, action }: { eyebrow?: ReactNode; title: ReactNode; action?: ReactNode }) {
  return (
    <header className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="text-[13px] font-medium text-muted-foreground">{eyebrow}</p>}
        <h1 className="text-[28px] font-extrabold leading-tight tracking-[-0.03em] md:text-[34px]">{title}</h1>
      </div>
      {action}
    </header>
  );
}
