import { createHashRouter, Navigate, Outlet, ScrollRestoration } from "react-router";
import { RouteErrorFallback } from "./ErrorBoundary";
import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/toaster";
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
  return (
    <>
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
