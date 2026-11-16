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
  /** Busca por número de cuenta (9 dígitos) o nickname público. */
  validar: (numeroCuenta: string) => Promise<CompaneroValidado>;
  validando: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const full = companeros.length + 1 >= MAX_INTEGRANTES;

  const add = async () => {
    setError(null);
    if (!draft.trim()) return setError("Escribe un número de cuenta o nickname.");
    try {
      const c = await validar(draft);
      if (companeros.some((x) => (x.user_id ?? x.numero_cuenta) === (c.user_id ?? c.numero_cuenta))) return setError("Ese compañero ya está en tu equipo.");
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
              key={c.user_id ?? c.numero_cuenta}
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
                  onChange(companeros.filter((x) => (x.user_id ?? x.numero_cuenta) !== (c.user_id ?? c.numero_cuenta)))
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
          onChange={(e) => setDraft(e.target.value.slice(0, 40))}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          aria-label="Buscar compañero por número de cuenta o nickname"
          placeholder={full ? "Equipo completo" : "Número de cuenta o @nickname"}
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
        Solo aparecen cuentas activas existentes. No se crean cuentas nuevas desde aquí.
      </p>
    </div>
  );
}
