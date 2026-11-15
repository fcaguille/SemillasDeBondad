import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Info, Loader2, Plus, X } from "lucide-react";
import { Avatar } from "@/components/common/Avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FieldMessage, Label } from "@/components/ui/label";
import { mensajeDeError } from "@/lib/errors";
import { CARRERAS, MAX_INTEGRANTES, type CompaneroValidado, type Usuario } from "@/types/domain";
import { cn } from "@/lib/utils";

export function TeamBuilder({
  creador,
  companeros,
  onChange,
  validar,
  validando,
}: {
  creador: Pick<Usuario, "nickname" | "carrera">;
  companeros: CompaneroValidado[];
  onChange: (c: CompaneroValidado[]) => void;
  /** Validates a 9-digit account against the backend. */
  validar: (numeroCuenta: string) => Promise<CompaneroValidado>;
  validando: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const full = companeros.length + 1 >= MAX_INTEGRANTES;

  const add = async () => {
    setError(null);
    if (!/^\d{9}$/.test(draft)) return setError("Escribe los 9 dígitos del número de cuenta.");
    if (companeros.some((c) => c.numero_cuenta === draft))
      return setError("Ese compañero ya está en tu equipo.");
    try {
      const c = await validar(draft);
      onChange([...companeros, c]);
      setDraft("");
    } catch (e) {
      setError(mensajeDeError(e));
    }
  };

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label>Integrantes (Máx. {MAX_INTEGRANTES})</Label>
        <span className="text-[12px] font-semibold tabular-nums text-muted-foreground">
          {companeros.length + 1}/{MAX_INTEGRANTES}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        <li className="inline-flex h-9 items-center gap-2 rounded-full border border-[#CDE9D5] bg-brand-tint pl-1 pr-3 text-[13px] font-semibold text-brand-deep">
          <Avatar nickname={creador.nickname} size={28} />
          {creador.nickname} · Tú
        </li>
        <AnimatePresence initial={false}>
          {companeros.map((c) => (
            <motion.li
              key={c.numero_cuenta}
              layout
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.85 }}
              className="inline-flex h-9 items-center gap-2 rounded-full border border-border bg-card pl-1 pr-2 text-[13px] font-semibold"
            >
              <Avatar nickname={c.nickname} size={28} className="from-[#14B8A6] to-[#0F766E]" />
              {c.nickname} · {CARRERAS[c.carrera].corto}
              <button
                type="button"
                aria-label={`Quitar a ${c.nickname}`}
                onClick={() =>
                  onChange(companeros.filter((x) => x.numero_cuenta !== c.numero_cuenta))
                }
                className="grid size-6 place-items-center rounded-full text-muted-foreground hover:bg-muted"
              >
                <X size={14} />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
      <div className={cn("mt-3 flex gap-2", full && "opacity-50")}>
        <Input
          className="flex-1"
          value={draft}
          disabled={full}
          invalid={!!error}
          onChange={(e) => setDraft(e.target.value.replace(/\D/g, "").slice(0, 9))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          inputMode="numeric"
          aria-label="Agregar No. de Cuenta de compañero"
          placeholder={full ? "Equipo completo" : "Agregar No. de Cuenta de compañero"}
        />
        <Button
          type="button"
          variant="outline"
          className="h-[52px]"
          onClick={add}
          disabled={full || validando}
        >
          {validando ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} strokeWidth={2.6} />
          )}{" "}
          Añadir
        </Button>
      </div>
      <FieldMessage error>{error}</FieldMessage>
      <p className="mt-2 flex gap-[6px] text-[12px] leading-[17px] text-muted-foreground">
        <Info size={14} className="mt-[1px] shrink-0" aria-hidden />
        Puntos y sanciones se dividen equitativamente entre sus carreras
      </p>
    </div>
  );
}
