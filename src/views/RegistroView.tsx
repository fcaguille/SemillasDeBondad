import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router";
import { ArrowUpRight, ChevronDown, Eye, EyeOff, Hash, Loader2, Lock } from "lucide-react";
import { BrandMark, GithubMark } from "@/components/brand/BrandMark";
import { CollectiblePlantCard } from "@/components/CollectiblePlantCard";
import { EscrowSummary } from "@/components/auth/EscrowSummary";
import { FullScreenLoader } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { PLANTA_EJEMPLO } from "@/content/showcase";
import {
  useCerrarSesion,
  useCrearPreferenciaPago,
  useCuotaEntrada,
  useIniciarSesion,
  useRegistrar,
  useSesion,
} from "@/hooks/useSemillas";
import { mensajeDeError } from "@/lib/errors";
import { redirigirACheckout } from "@/lib/mercadoPago";
import { formatMXN } from "@/lib/utils";
import { DEMO_LOGIN, LINKS } from "@/services/config";
import { CARRERAS, type Carrera } from "@/types/domain";

type Modo = "crear" | "entrar";
type Errores = Partial<Record<"numero" | "nickname" | "password" | "acepta", string>>;

function validar(
  modo: Modo,
  f: { numero: string; nickname: string; password: string; acepta: boolean },
): Errores {
  const e: Errores = {};
  if (!/^\d{9}$/.test(f.numero)) e.numero = "Tu número de cuenta UNAM tiene 9 dígitos.";
  if (modo === "crear") {
    if (!/^@?[\w.]{3,20}$/.test(f.nickname))
      e.nickname = "Usa de 3 a 20 letras, números, punto o guion bajo.";
    if (f.password.length < 8) e.password = "Mínimo 8 caracteres.";
    if (!f.acepta) e.acepta = "Debes aceptar los términos para participar.";
  } else if (f.password.length < 6) e.password = "Escribe tu contraseña.";
  return e;
}

export function RegistroView() {
  const { data: sesion, isLoading } = useSesion();
  const [params] = useSearchParams();
  const next = params.get("next") || "/impacto";
  const navigate = useNavigate();

  const [modo, setModo] = useState<Modo>("crear");
  const [numero, setNumero] = useState("");
  const [carrera, setCarrera] = useState<Carrera>("contaduria");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [verPass, setVerPass] = useState(false);
  const [acepta, setAcepta] = useState(false);
  const [errores, setErrores] = useState<Errores>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

  const cuota = useCuotaEntrada();
  const registrar = useRegistrar();
  const login = useIniciarSesion();
  const preferencia = useCrearPreferenciaPago();
  const cerrar = useCerrarSesion();

  if (isLoading) return <FullScreenLoader />;
  const usuario = sesion?.usuario;
  if (usuario?.estado === "activa") return <Navigate to={next} replace />;
  const pendiente = usuario?.estado === "pendiente_pago";
  const ocupado = registrar.isPending || login.isPending || preferencia.isPending;

  const pagar = async () => {
    const { init_point } = await preferencia.mutateAsync(undefined);
    redirigirACheckout(init_point);
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    setErrorGeneral(null);
    const e = validar(modo, { numero, nickname, password, acepta });
    setErrores(e);
    if (Object.keys(e).length) return;
    try {
      if (modo === "crear") {
        await registrar.mutateAsync({
          numero_cuenta: numero,
          carrera,
          nickname,
          password,
          acepta_terminos: true,
        });
        await pagar();
      } else {
        const s = await login.mutateAsync({ numero_cuenta: numero, password });
        if (s.usuario.estado === "activa") navigate(next, { replace: true });
      }
    } catch (err) {
      setErrorGeneral(mensajeDeError(err));
    }
  };

  const total = cuota.data ? formatMXN(cuota.data.total_centavos) : "$16.00";

  return (
    <div className="min-h-dvh md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,560px)] lg:grid-cols-2">
      {/* Desktop showcase panel */}
      <aside className="relative hidden overflow-hidden bg-gradient-to-br from-[#1A9248] via-brand-deep to-[#0B2E1A] p-10 text-white md:sticky md:top-0 md:flex md:h-dvh md:flex-col">
        <div className="flex items-center gap-3">
          <BrandMark size={44} />
          <p className="text-[18px] font-extrabold">Semillas de Bondad</p>
        </div>
        <div className="flex min-h-0 flex-1 items-center justify-center py-4 [@media(max-height:820px)]:scale-[0.82]">
          <CollectiblePlantCard planta={PLANTA_EJEMPLO} />
        </div>
        <h2 className="max-w-md text-[28px] font-extrabold leading-[1.1] tracking-[-0.03em]">
          Siembra con material reciclado y haz ganar a tu carrera.
        </h2>
        <p className="mt-3 max-w-md text-[15px] leading-[22px] text-white/75">
          Cada maceta recibe una carta coleccionable con QR. La comunidad califica, y el pozo en
          custodia se reparte con una fórmula pública y auditable.
        </p>
      </aside>

      <div className="mx-auto flex min-h-dvh w-full max-w-[480px] flex-col px-6 pb-[calc(140px+var(--safe-bottom))] pt-[calc(20px+var(--safe-top))] md:justify-center md:pb-12">
        <header className="flex items-center gap-3">
          <BrandMark size={52} />
          <div>
            <h1 className="text-[22px] font-extrabold leading-tight tracking-[-0.02em]">
              Semillas de Bondad
            </h1>
            <p className="text-[13px] font-medium text-muted-foreground">
              FCA · UNAM — Reto Ecosustentable
            </p>
          </div>
        </header>

        {pendiente ? (
          <section className="mt-8 flex flex-col gap-4">
            <div>
              <p className="text-[13px] font-semibold text-primary">Falta un paso</p>
              <h2 className="text-[24px] font-extrabold leading-tight tracking-[-0.02em]">
                Activa tu cuenta, {usuario.nickname}
              </h2>
              <p className="mt-1 text-[14px] leading-[20px] text-muted-foreground">
                Tu aportación entra al pozo común en custodia. Al cierre se reparte según el Índice
                Ecosustentable de cada carrera.
              </p>
            </div>
            <EscrowSummary cuota={cuota.data} />
            {errorGeneral && <FieldMessage error>{errorGeneral}</FieldMessage>}
            <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background from-70% to-background/0 px-6 pb-[calc(20px+var(--safe-bottom))] pt-6 md:static md:bg-none md:p-0">
              <div className="mx-auto max-w-[432px]">
                <Button
                  variant="mp"
                  size="lg"
                  className="h-auto min-h-14 w-full gap-[6px] whitespace-normal px-3 py-2 text-center text-[15px] leading-tight tracking-[-0.01em]"
                  disabled={preferencia.isPending}
                  onClick={() => pagar().catch((e) => setErrorGeneral(mensajeDeError(e)))}
                >
                  {preferencia.isPending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Lock size={16} strokeWidth={2.4} />
                  )}
                  Pagar {total} con Mercado Pago y Activar
                </Button>
                <button
                  className="mt-2 w-full text-center text-[13px] font-semibold text-muted-foreground underline-offset-2 hover:underline"
                  onClick={() => cerrar.mutate(undefined)}
                >
                  Usar otra cuenta
                </button>
              </div>
            </div>
          </section>
        ) : (
          <>
            <SegmentedControl
              className="mt-6"
              aria-label="Tipo de acceso"
              value={modo}
              onChange={(m) => {
                setModo(m);
                setErrores({});
                setErrorGeneral(null);
              }}
              options={[
                { value: "crear", label: "Crear Cuenta" },
                { value: "entrar", label: "Iniciar Sesión" },
              ]}
            />

            <form
              id="auth-form"
              noValidate
              className="mt-6 flex flex-col gap-4"
              onSubmit={onSubmit}
            >
              <div>
                <Label htmlFor="numero">Número de Cuenta UNAM</Label>
                <Input
                  id="numero"
                  leading={<Hash />}
                  inputMode="numeric"
                  autoComplete="username"
                  value={numero}
                  invalid={!!errores.numero}
                  onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="9 dígitos (ej. 319048291)"
                  className="tabular-nums"
                />
                {errores.numero ? (
                  <FieldMessage error>{errores.numero}</FieldMessage>
                ) : (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-[3px] text-[11px] font-semibold text-muted-foreground">
                    <Lock size={11} aria-hidden /> Privado · Uso exclusivo de validación
                  </span>
                )}
              </div>

              {modo === "crear" && (
                <>
                  <div>
                    <Label htmlFor="carrera">Licenciatura</Label>
                    <div className="relative">
                      <select
                        id="carrera"
                        value={carrera}
                        onChange={(e) => setCarrera(e.target.value as Carrera)}
                        className="h-[52px] w-full appearance-none rounded-btn border border-input bg-card px-4 text-[16px] outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                      >
                        {(Object.keys(CARRERAS) as Carrera[]).map((c) => (
                          <option key={c} value={c}>
                            {CARRERAS[c].nombre}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={18}
                        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="nick">Nickname Público</Label>
                    <Input
                      id="nick"
                      value={nickname}
                      invalid={!!errores.nickname}
                      onChange={(e) => setNickname(e.target.value.replace(/\s/g, ""))}
                      placeholder="Ej. @EcoContador_26"
                      autoComplete="nickname"
                      maxLength={21}
                    />
                    <FieldMessage error>{errores.nickname}</FieldMessage>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="pass">Contraseña</Label>
                <Input
                  id="pass"
                  type={verPass ? "text" : "password"}
                  value={password}
                  invalid={!!errores.password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={modo === "crear" ? "new-password" : "current-password"}
                  trailing={
                    <button
                      type="button"
                      aria-label={verPass ? "Ocultar contraseña" : "Mostrar contraseña"}
                      onClick={() => setVerPass((v) => !v)}
                      className="-mr-2 grid size-11 place-items-center text-muted-foreground"
                    >
                      {verPass ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  }
                />
                <FieldMessage error>{errores.password}</FieldMessage>
                {modo === "entrar" && DEMO_LOGIN && !errores.password && (
                  <FieldMessage>{DEMO_LOGIN.hint}</FieldMessage>
                )}
              </div>

              {modo === "crear" && (
                <>
                  <div className="flex gap-3 pt-1">
                    <Checkbox
                      checked={acepta}
                      onCheckedChange={setAcepta}
                      aria-labelledby="terminos"
                      className="mt-[1px]"
                    />
                    <div className="text-[14px] leading-[20px]">
                      <span id="terminos">
                        Acepto los Términos, la fórmula proporcional y el compromiso de garantía
                      </span>
                      <a
                        href={LINKS.contrato}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 flex w-fit items-center gap-[6px] rounded-full border border-border bg-card px-[10px] py-1 text-[12px] font-semibold underline decoration-foreground/30 underline-offset-2"
                      >
                        <GithubMark size={13} /> Ver contrato público en GitHub{" "}
                        <ArrowUpRight size={13} aria-hidden />
                      </a>
                      <FieldMessage error>{errores.acepta}</FieldMessage>
                    </div>
                  </div>
                  <EscrowSummary cuota={cuota.data} />
                </>
              )}
              {errorGeneral && (
                <p
                  role="alert"
                  className="rounded-btn bg-crimson-tint px-4 py-3 text-[14px] font-medium text-crimson"
                >
                  {errorGeneral}
                </p>
              )}
            </form>

            {/* Sticky thumb-zone CTA on mobile, inline on desktop */}
            <div className="fixed inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background from-70% to-background/0 px-6 pb-[calc(20px+var(--safe-bottom))] pt-6 md:static md:mt-6 md:bg-none md:p-0">
              <div className="mx-auto max-w-[432px]">
                {modo === "crear" ? (
                  <>
                    <Button
                      type="submit"
                      form="auth-form"
                      variant="mp"
                      size="lg"
                      className="h-auto min-h-14 w-full gap-[6px] whitespace-normal px-3 py-2 text-center text-[15px] leading-tight tracking-[-0.01em]"
                      disabled={ocupado}
                    >
                      {ocupado ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Lock size={16} strokeWidth={2.4} />
                      )}
                      Pagar {total} con Mercado Pago y Activar
                    </Button>
                    <p className="mt-2 text-center text-[11px] font-medium text-muted-foreground">
                      Pago cifrado y procesado por Mercado Pago
                    </p>
                  </>
                ) : (
                  <Button
                    type="submit"
                    form="auth-form"
                    size="lg"
                    className="w-full"
                    disabled={ocupado}
                  >
                    {ocupado && <Loader2 size={18} className="animate-spin" />} Iniciar Sesión
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
