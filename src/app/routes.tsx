import { createBrowserRouter, Navigate, Outlet, ScrollRestoration } from "react-router";
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

const base = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      Component: Root,
      children: [
        { index: true, element: <Navigate to="/impacto" replace /> },
        // Public
        { path: "registro", Component: RegistroView },
        { path: "pago/retorno", Component: PagoRetornoView },
        { path: "p/:idPlanta", Component: PlantaView },
        // Authenticated (active escrow) — shell with sidebar / tab bar
        {
          Component: AppShell,
          children: [
            { path: "impacto", Component: ImpactoView },
            { path: "crear-maceta", Component: CrearMacetaView },
            { path: "ranking", Component: RankingView },
            { path: "escanear", Component: EscanearView },
            { path: "historial", Component: HistorialView },
            { path: "cuenta", Component: CuentaView },
          ],
        },
        { path: "*", Component: NotFoundView },
      ],
    },
  ],
  { basename: base },
);
