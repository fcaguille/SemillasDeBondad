import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import {
  Check,
  ChevronRight,
  Download,
  Lock,
  LogOut,
  Pencil,
  Scale,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Page, PageHeader } from "@/components/layout/AppShell";
import { Avatar } from "@/components/common/Avatar";
import { ActivarGarantiaButton, EstadoCuentaBadge } from "@/components/auth/Garantia";
import {
  EditarPerfilSheet,
  ExportCartaSheet,
  GarantiaSheet,
  ReglamentoSheet,
} from "@/components/cuenta/CuentaSheets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useActualizarPerfil,
  useCerrarSesion,
  useMiPago,
  useMisPlantas,
  useUsuarioActual,
} from "@/hooks/useSemillas";
import { formatMXN } from "@/lib/utils";
import { CARRERAS, tieneGarantia } from "@/types/domain";
import { supabase } from "@/services/supabaseClient";

function Row({
  icon,
  tile,
  title,
  value,
  valueClass = "text-muted-foreground",
  onClick,
}: {
  icon: ReactNode;
  tile: string;
  title: string;
  value: ReactNode;
  valueClass?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-muted"
    >
      <span
        className="grid size-8 shrink-0 place-items-center rounded-[9px] text-white"
        style={{ background: tile }}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className={`block text-[13px] font-medium tabular-nums ${valueClass}`}>{value}</span>
      </span>
      <ChevronRight size={18} className="shrink-0 text-[#B4BAB2]" aria-hidden />
    </button>
  );
}

type SheetKey = "perfil" | "garantia" | "reglamento" | "exportar" | null;

export function CuentaView() {
  const navigate = useNavigate();
  const { data: usuario } = useUsuarioActual();
  const pago = useMiPago();
  const plantas = useMisPlantas();
  const actualizar = useActualizarPerfil();
  const cerrar = useCerrarSesion();
  const [sheet, setSheet] = useState<SheetKey>(null);
  const [clabe, setClabe] = useState("");
  const [clabeGuardada, setClabeGuardada] = useState(false);
  const [clabeError, setClabeError] = useState<string | null>(null);
  const [guardandoClabe, setGuardandoClabe] = useState(false);
  useEffect(() => { let activo = true; supabase.rpc("mi_clabe").then(({data,error}) => { if (!activo) return; if (error) setClabeError("No pudimos consultar tu CLABE privada."); else setClabe(data ?? ""); }); return () => { activo = false; }; }, [usuario?.id]);
  if (!usuario) return null;
  const close = (o: boolean) => !o && setSheet(null);

  const garantiaValor = pago.isLoading ? (
    <Skeleton className="mt-1 h-3 w-40" />
  ) : pago.data?.estado === "aprobado" ? (
    `Pagado (${formatMXN(pago.data.total_centavos, { decimals: false })} MXN · Folio ${pago.data.folio})`
  ) : pago.data?.estado === "pendiente" ? (
    "Pago en revisión por Mercado Pago"
  ) : (
    "Sin garantía · Modo Gratuito"
  );
  const garantia = tieneGarantia(usuario);

  return (
    <Page>
      <PageHeader
        title="Cuenta"
        action={
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => setSheet("perfil")}
          >
            Editar
          </Button>
        }
      />

      <div className="mt-4 grid gap-6 md:mt-6 md:grid-cols-[320px_minmax(0,1fr)] md:items-start">
        <section
          className="flex flex-col items-center rounded-card text-center md:border md:border-border md:bg-card md:p-6 md:shadow-card"
          aria-label="Perfil"
        >
          <div className="relative">
            <Avatar
              nickname={usuario.nickname}
              src={usuario.avatar_url}
              size={88}
              className="shadow-card ring-4 ring-white"
            />
            <button
              aria-label="Editar perfil"
              onClick={() => setSheet("perfil")}
              className="absolute -bottom-1 -right-1 grid size-8 place-items-center rounded-full border-2 border-white bg-foreground text-white"
            >
              <Pencil size={14} />
            </button>
          </div>
          <button
            onClick={() => setSheet("perfil")}
            className="mt-3 flex items-center gap-[6px] text-[20px] font-extrabold tracking-[-0.02em]"
          >
            {usuario.nickname} <Pencil size={15} className="text-muted-foreground" aria-hidden />
          </button>
          <EstadoCuentaBadge usuario={usuario} className="mt-2" />
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="success">{CARRERAS[usuario.carrera].licenciatura}</Badge>
            <span className="inline-flex items-center gap-1 font-mono text-[12px] font-semibold tabular-nums text-muted-foreground">
              <Lock size={11} aria-hidden /> No. Cuenta: {usuario.numero_cuenta_enmascarado}
            </span>
          </div>
          {usuario.bio && <p className="mt-3 text-[14px] leading-[20px]">{usuario.bio}</p>}
          <dl className="mt-4 grid w-full grid-cols-3 divide-x divide-border rounded-card border border-border bg-card py-3 shadow-card md:shadow-none">
            {[
              [String(usuario.total_plantas).padStart(2, "0"), "Macetas"],
              [usuario.puntos_aportados, "Puntos"],
              [usuario.total_votos_emitidos, "Votos"],
            ].map(([v, l]) => (
              <div key={String(l)} className="flex flex-col-reverse">
                <dt className="text-[12px] font-medium text-muted-foreground">{l}</dt>
                <dd className="text-[20px] font-extrabold tabular-nums">{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div>
          {!garantia && usuario.estado !== "suspendida" && (
            <section
              aria-labelledby="upgrade-title"
              className="mb-6 rounded-card border border-[#BDE5F7] bg-gradient-to-br from-[#F2FAFE] to-card p-5 shadow-card"
            >
              <Badge variant="info">
                <Sparkles size={13} aria-hidden /> Modo Gratuito · Solo Votación
              </Badge>
              <h2
                id="upgrade-title"
                className="mt-3 text-[18px] font-extrabold leading-tight tracking-[-0.02em]"
              >
                Hoy puedes calificar macetas. Con la garantía, también compites.
              </h2>
              <ul className="mt-3 grid gap-[6px] text-[13px] font-medium">
                {[
                  [true, "Escanear QR y calificar macetas (1 a 5 estrellas)"],
                  [false, "Crear macetas con carta coleccionable"],
                  [false, "Sumar puntos al Índice de tu carrera"],
                  [false, "Levantar reportes y competir por el pozo"],
                ].map(([ok, t]) => (
                  <li key={String(t)} className="flex items-center gap-2">
                    {ok ? (
                      <Check size={15} strokeWidth={2.6} className="text-primary" aria-hidden />
                    ) : (
                      <Lock size={14} strokeWidth={2.4} className="text-[#00669A]" aria-hidden />
                    )}
                    <span className={ok ? undefined : "text-muted-foreground"}>{t}</span>
                  </li>
                ))}
              </ul>
              <ActivarGarantiaButton className="mt-4 w-full text-[15px]">
                Activar Garantía ($16 MXN)
              </ActivarGarantiaButton>
            </section>
          )}
          <section className="mb-5 rounded-card border border-border bg-card p-4 shadow-card" aria-labelledby="clabe-title"><h2 id="clabe-title" className="font-bold">CLABE interbancaria privada</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Registra una CLABE de 18 dígitos. Si tu carrera gana, el pozo se dividirá en partes iguales entre participantes elegibles y se transferirá a esta cuenta.</p><label htmlFor="clabe" className="mt-3 block text-sm font-semibold">Tu CLABE (18 dígitos)</label><input id="clabe" inputMode="numeric" autoComplete="off" maxLength={18} value={clabe} onChange={e=>{setClabe(e.target.value.replace(/[^0-9]/g,"").slice(0,18));setClabeGuardada(false);setClabeError(null);}} className="mt-1 h-12 w-full rounded-lg border border-input bg-background px-3 font-mono tracking-widest" placeholder="000000000000000000" /><p className="mt-1 text-xs text-muted-foreground">Solo tú puedes consultar y actualizar este dato.</p>{clabeError && <p role="alert" className="mt-2 text-sm text-crimson">{clabeError}</p>}<Button className="mt-3 w-full" disabled={guardandoClabe || !/^\\d{18}$/.test(clabe)} onClick={async()=>{setGuardandoClabe(true);setClabeError(null);const {error}=await supabase.rpc("guardar_mi_clabe",{p_clabe:clabe});setGuardandoClabe(false);if(error)setClabeError("No pudimos guardar tu CLABE. Verifica tu sesión e inténtalo de nuevo.");else setClabeGuardada(true);}}>{guardandoClabe?"Guardando…":"Guardar CLABE"}</Button>{clabeGuardada && <p role="status" className="mt-2 text-sm font-semibold text-primary">Tu CLABE quedó guardada de forma privada.</p>}</section>
          <p className="mb-2 px-4 text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Estado y datos
          </p>
          <div className="divide-y divide-border overflow-hidden rounded-card border border-border bg-card shadow-card">
            <Row
              tile="#15803D"
              icon={<ShieldCheck size={17} />}
              title="Estado de Garantía"
              value={garantiaValor}
              valueClass={
                pago.data?.estado === "aprobado"
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }
              onClick={() => setSheet("garantia")}
            />
            <Row
              tile="#475569"
              icon={<Scale size={17} />}
              title="Reglamento de Sanciones"
              value={`${usuario.amonestaciones} amonestaciones · ${usuario.amonestaciones === 0 ? "Limpio" : "Con observaciones"}`}
              valueClass={usuario.amonestaciones ? "text-crimson" : undefined}
              onClick={() => setSheet("reglamento")}
            />
            <Row
              tile="linear-gradient(135deg,#F59E0B,#DB2777 55%,#7C3AED)"
              icon={<Download size={17} />}
              title="Exportar mi Carta Coleccionable"
              value="Descargar PNG para Instagram Stories"
              onClick={() => setSheet("exportar")}
            />
          </div>
          <div className="mt-4 overflow-hidden rounded-card border border-border bg-card shadow-card"><button onClick={()=>window.dispatchEvent(new Event("semillas:ver-introduccion"))} className="flex w-full items-center gap-3 px-4 py-[14px] text-[15px] font-semibold transition hover:bg-muted">Volver a ver la presentación del programa</button></div>
          <div className="mt-4 overflow-hidden rounded-card border border-border bg-card shadow-card">
            <button
              disabled={cerrar.isPending}
              onClick={async () => {
                await cerrar.mutateAsync(undefined).catch(() => {});
                navigate("/registro", { replace: true });
              }}
              className="flex w-full items-center gap-3 px-4 py-[14px] text-[15px] font-semibold text-crimson transition hover:bg-crimson-tint"
            >
              <LogOut size={18} aria-hidden /> Cerrar Sesión
            </button>
          </div>
          <p className="mt-4 text-center text-[11px] text-muted-foreground md:text-left">
            Semillas de Bondad v1.0 · PWA de código abierto
          </p>
        </div>
      </div>

      <EditarPerfilSheet
        open={sheet === "perfil"}
        onOpenChange={close}
        usuario={usuario}
        onSave={(p) => actualizar.mutateAsync(p)}
        guardando={actualizar.isPending}
      />
      <GarantiaSheet
        open={sheet === "garantia"}
        onOpenChange={close}
        pago={pago.data}
        accion={
          garantia ? undefined : (
            <ActivarGarantiaButton className="mt-4 w-full text-[15px]">
              Activar Garantía ($16 MXN)
            </ActivarGarantiaButton>
          )
        }
      />
      <ReglamentoSheet
        open={sheet === "reglamento"}
        onOpenChange={close}
        amonestaciones={usuario.amonestaciones}
      />
      <ExportCartaSheet
        open={sheet === "exportar"}
        onOpenChange={close}
        plantas={plantas.data}
        isLoading={plantas.isLoading}
      />
    </Page>
  );
}
