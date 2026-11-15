import { useEffect, useRef, useState } from "react";
import { Camera, Lock, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Local evidence photo. Uses the native camera on mobile via
 * `capture="environment"`; on desktop it opens a file picker.
 * The Blob is handed to the parent and stored in IndexedDB on submit.
 */
export function PhotoCaptureSlot({
  file,
  onChange,
  invalid,
}: {
  file: File | null;
  onChange: (f: File | null) => void;
  invalid?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-label="Tomar foto de evidencia"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null);
          e.target.value = "";
        }}
      />
      {preview ? (
        <div className="relative h-[200px] overflow-hidden rounded-card border border-border bg-muted">
          <img
            src={preview}
            alt="Vista previa de la foto de evidencia"
            className="size-full object-cover"
          />
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-[10px] py-1 text-[11px] font-semibold text-primary backdrop-blur">
            <Lock size={11} aria-hidden /> Solo en tu celular
          </span>
          <div className="absolute bottom-3 right-3 flex gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="flex h-9 items-center gap-1 rounded-full bg-white/90 px-3 text-[13px] font-semibold backdrop-blur"
            >
              <RefreshCw size={14} aria-hidden /> Cambiar
            </button>
            <button
              type="button"
              aria-label="Quitar foto"
              onClick={() => onChange(null)}
              className="grid size-9 place-items-center rounded-full bg-white/90 text-crimson backdrop-blur"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          className={cn(
            "flex h-[160px] w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed bg-card px-4 transition hover:border-primary",
            invalid ? "border-destructive" : "border-[#C5CEC2]",
          )}
        >
          <span className="grid size-12 place-items-center rounded-full bg-brand-tint text-primary">
            <Camera size={24} aria-hidden />
          </span>
          <span className="text-[15px] font-bold">Tomar foto de evidencia</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-tint px-[10px] py-1 text-center text-[11px] font-semibold text-primary">
            <Lock size={11} aria-hidden /> Se guarda solo en tu celular (no consume datos)
          </span>
        </button>
      )}
    </div>
  );
}
