import { createHashRouter, Navigate, Outlet, ScrollRestoration } from "react-router";
import { RouteErrorFallback } from "./ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { useSesion } from "@/hooks/useSemillas";
import { RegistroView } from "@/views/RegistroView";
import { PagoRetornoView } from "@/views/PagoRetornoView";
import { ImpactoView } from "@/views/ImpactoView";
import { CrearMacetaView } from "@/views/CrearMacetaView";
import { RankingView } from "@/views/RankingView";
import { EscanearView } from "@/views/EscanearView";
import { PlantaView } from "@/views/PlantaView";
import { HistorialView } from "@/views/HistorialView";
import { CuentaView } from "@/views/CuentaView";
import { ContactoView } from "@/views/ContactoView";
import { NotFoundView } from "@/views/NotFoundView";

function Root() {
  const [params] = useSearchParams();
  const sesion = useSesion();
  const [mensajePago,setMensajePago] = useState<string|null>(null);
  const pagoExitoso = params.get("pago") === "exitoso";
  useEffect(() => {
    if (!pagoExitoso) return;
    let cancelado = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let intentos = 0;
    const verificar = async () => {
      const actual = await sesion.refetch();
      if (cancelado) return;
      if (actual?.usuario?.estado === "activa") { setMensajePago("¡Pago confirmado! Tu cuenta ya está activa. ¡Gracias por apoyar el reto!"); return; }
      intentos += 1;
      if (intentos < 6) timer = setTimeout(verificar, 2500);
      else setMensajePago("Recibimos tu regreso de Mercado Pago. La confirmación puede tardar unos minutos; actualizaremos tu cuenta en cuanto se registre.");
    };
    void verificar();
    return () => { cancelado = true; if (timer) clearTimeout(timer); };
  }, [pagoExitoso]);
  return (
    <>
      {mensajePago && <div role="status" className="fixed inset-x-4 top-4 z-[110] mx-auto max-w-xl rounded-xl border border-primary/30 bg-background p-4 text-sm font-semibold shadow-xl">{mensajePago}</div>}
      <Outlet />
      <Toaster />
      <ScrollRestoration />
    </>
  );
}

/**
 * Hash routing (#/impacto, #/p/SB-1234): static hosting always serves index.html,
 * so deep links and QR codes never hit a server 404. Legacy path links
 * (/p/SB-1234) are rewritten to the hash form by the boot script in index.html.
 */
export const router = createHashRouter([
  {
    path: "/",
    Component: Root,
    ErrorBoundary: RouteErrorFallback,
    children: [
      { index: true, element: <Navigate to="/impacto" replace /> },
      // Public
      { path: "registro", Component: RegistroView },
      { path: "pago/retorno", Component: PagoRetornoView },
      { path: "p/:idPlanta", Component: PlantaView },
      // Authenticated (free or paid) — shell with sidebar / tab bar
      {
        Component: AppShell,
        children: [
          { path: "impacto", Component: ImpactoView },
          { path: "crear-maceta", Component: CrearMacetaView },
          { path: "ranking", Component: RankingView },
          { path: "escanear", Component: EscanearView },
          { path: "historial", Component: HistorialView },
          { path: "cuenta", Component: CuentaView },
          { path: "contacto", Component: ContactoView },
        ],
      },
      { path: "*", Component: NotFoundView },
    ],
  },
]);
