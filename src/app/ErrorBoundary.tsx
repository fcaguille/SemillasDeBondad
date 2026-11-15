import { Component, type ErrorInfo, type ReactNode } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import { RotateCw, TriangleAlert } from "lucide-react";

function mensaje(error: unknown): string {
  if (isRouteErrorResponse(error)) return `${error.status} ${error.statusText}`.trim();
  if (error instanceof Error) return error.message || error.name;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Error desconocido";
  }
}

/**
 * Self-contained recovery card. Uses only Tailwind + an icon so it still renders
 * when the crash comes from shared UI components or the data layer.
 */
export function RecoveryCard({ error }: { error: unknown }) {
  const irAlInicio = () => {
    window.location.hash = "#/impacto";
    window.location.reload();
  };
  return (
    <div role="alert" className="grid min-h-dvh place-items-center bg-background px-5 py-10">
      <div className="w-full max-w-md rounded-card border border-border bg-card p-6 text-center shadow-card">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-crimson-tint text-crimson">
          <TriangleAlert size={26} aria-hidden />
        </span>
        <h1 className="mt-4 text-[22px] font-extrabold tracking-[-0.02em]">
          Algo salió mal al cargar la app
        </h1>
        <p className="mt-1 text-[14px] leading-[20px] text-muted-foreground">
          No perdiste nada: tus macetas y votos están a salvo. Recarga para intentarlo de nuevo.
        </p>
        <pre className="mt-4 max-h-40 overflow-auto whitespace-pre-wrap break-words rounded-btn bg-muted px-3 py-2 text-left font-mono text-[12px] leading-[18px] text-foreground">
          {mensaje(error)}
        </pre>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn bg-primary text-[15px] font-semibold text-primary-foreground transition hover:bg-brand-deep active:scale-[0.98]"
        >
          <RotateCw size={17} aria-hidden /> Recargar aplicación
        </button>
        <button
          type="button"
          onClick={irAlInicio}
          className="mt-2 h-10 w-full text-[13px] font-semibold text-muted-foreground underline-offset-2 hover:underline"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
}

/** Global boundary around <App />: a render crash shows the recovery card, never a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: unknown }> {
  state = { error: null as unknown };

  static getDerivedStateFromError(error: unknown) {
    return { error: error ?? new Error("Error desconocido") };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("Semillas de Bondad — error no controlado:", error, info.componentStack);
  }

  render() {
    return this.state.error ? <RecoveryCard error={this.state.error} /> : this.props.children;
  }
}

/** React Router `ErrorBoundary` for route-level crashes (loaders, render errors). */
export function RouteErrorFallback() {
  return <RecoveryCard error={useRouteError()} />;
}
