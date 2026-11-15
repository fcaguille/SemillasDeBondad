import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Camera, CameraOff, Keyboard, X, Zap, ZapOff } from "lucide-react";
import { Sheet } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { useCamera } from "@/hooks/useCamera";
import { createQrScanner } from "@/lib/qrScanner";
import { cn, parsePlantaId } from "@/lib/utils";
import { DEMO_LOGIN } from "@/services/config";

export function EscanearView() {
  const navigate = useNavigate();
  const { videoRef, status, start, stop, torch, torchSupported, setTorch } = useCamera();
  const [manual, setManual] = useState(false);
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState<string | null>(null);

  const abrir = (raw: string) => {
    const id = parsePlantaId(raw);
    if (!id) return false;
    navigator.vibrate?.(30);
    stop();
    navigate(`/p/${id}`);
    return true;
  };

  useEffect(() => {
    start();
  }, [start]);

  // Mount point for the QR decoder (BarcodeDetector by default; swap in lib/qrScanner.ts).
  useEffect(() => {
    if (status !== "active" || !videoRef.current) return;
    const scanner = createQrScanner();
    if (!scanner) return;
    scanner.start(videoRef.current, (text) => {
      if (!abrir(text)) setError("Ese QR no pertenece a una maceta del reto.");
    });
    return () => scanner.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const submitManual = (e: FormEvent) => {
    e.preventDefault();
    if (!abrir(codigo)) setError("Escribe un ID válido, por ejemplo SB-8492.");
  };

  const sinCamara = status === "denied" || status === "unavailable";

  return (
    <div className="fixed inset-0 z-30 overflow-hidden bg-[#050807] text-white md:relative md:inset-auto md:z-auto md:mx-auto md:mt-10 md:h-[min(760px,calc(100dvh-80px))] md:max-w-3xl md:rounded-[28px]">
      <video
        ref={videoRef}
        playsInline
        muted
        className={cn(
          "absolute inset-0 size-full object-cover transition-opacity duration-500",
          status === "active" ? "opacity-100" : "opacity-0",
        )}
      />
      {status !== "active" && (
        <div
          className="absolute inset-0 bg-[radial-gradient(80%_60%_at_50%_40%,#123321_0%,#050807_70%)]"
          aria-hidden
        >
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
              backgroundSize: "18px 18px",
            }}
          />
        </div>
      )}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/70"
        aria-hidden
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-[calc(14px+var(--safe-top))] md:pt-5">
        <Button
          variant="glass"
          size="icon"
          aria-label="Cerrar escáner"
          onClick={() => navigate("/impacto")}
        >
          <X size={20} />
        </Button>
        <h1 className="flex-1 text-center text-[17px] font-bold">Escanea el QR de una maceta</h1>
        <Button
          variant="glass"
          size="icon"
          aria-label={torch ? "Apagar linterna" : "Encender linterna"}
          aria-pressed={torch}
          disabled={!torchSupported}
          title={torchSupported ? undefined : "Tu dispositivo no permite controlar la linterna"}
          onClick={() => setTorch(!torch)}
          className={cn(torch && "bg-white text-obsidian hover:bg-white")}
        >
          {torch ? <Zap size={20} fill="currentColor" /> : <ZapOff size={20} />}
        </Button>
      </div>

      {/* Reticle */}
      <div className="absolute left-1/2 top-[44%] size-[260px] -translate-x-1/2 -translate-y-1/2">
        <div className="absolute inset-0 rounded-[32px] shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        {(
          [
            "left-0 top-0 rounded-tl-[32px] border-l-4 border-t-4",
            "right-0 top-0 rounded-tr-[32px] border-r-4 border-t-4",
            "bottom-0 left-0 rounded-bl-[32px] border-b-4 border-l-4",
            "bottom-0 right-0 rounded-br-[32px] border-b-4 border-r-4",
          ] as const
        ).map((c) => (
          <motion.span
            key={c}
            className={cn(
              "absolute size-12 border-leaf drop-shadow-[0_0_10px_rgba(34,197,94,0.9)]",
              c,
            )}
            animate={{ opacity: [0.75, 1, 0.75] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        ))}
        {!sinCamara && (
          <div className="absolute inset-x-5 animate-laser" aria-hidden>
            <div className="h-[2px] rounded-full bg-leaf shadow-[0_0_16px_4px_rgba(34,197,94,0.65)]" />
            <div className="h-10 bg-gradient-to-b from-leaf/25 to-transparent" />
          </div>
        )}
        {sinCamara && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="flex flex-col items-center gap-3">
              <CameraOff size={32} className="text-white/70" aria-hidden />
              <p className="text-[14px] font-semibold leading-[20px]">
                {status === "denied"
                  ? "Permite el acceso a la cámara para escanear."
                  : "No encontramos una cámara disponible."}
              </p>
              <Button size="sm" variant="glass" onClick={start}>
                <Camera size={16} /> Reintentar
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Helper */}
      <div className="absolute inset-x-6 bottom-[calc(var(--tabbar-h)+28px)] flex flex-col items-center gap-3 md:bottom-8">
        {error && (
          <p className="rounded-full bg-crimson px-4 py-2 text-[13px] font-semibold">{error}</p>
        )}
        <p className="max-w-sm rounded-full bg-black/55 px-5 py-3 text-center text-[14px] font-medium leading-[20px] backdrop-blur-md">
          Apunta a la etiqueta impresa en la maceta para ver su carta y calificar
        </p>
        <Button
          variant="ghost"
          className="text-white/85 hover:bg-white/10"
          onClick={() => setManual(true)}
        >
          <Keyboard size={16} /> Ingresar ID manualmente
        </Button>
      </div>

      <Sheet
        open={manual}
        onOpenChange={setManual}
        title="Ingresar ID de la maceta"
        description="Lo encuentras debajo del QR impreso."
      >
        <form onSubmit={submitManual} className="flex flex-col gap-3 text-foreground">
          <div>
            <Label htmlFor="codigo">ID de la maceta</Label>
            <Input
              id="codigo"
              autoFocus
              value={codigo}
              invalid={!!error}
              onChange={(e) => {
                setCodigo(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="SB-8492"
              className="font-mono"
              autoCapitalize="characters"
            />
            <FieldMessage error>{error}</FieldMessage>
            {DEMO_LOGIN && !error && (
              <FieldMessage>
                Modo demo: prueba con SB-9104 para votar o SB-8492 para ver tu carta.
              </FieldMessage>
            )}
          </div>
          <Button type="submit" size="lg">
            Ver carta
          </Button>
        </form>
      </Sheet>
    </div>
  );
}
