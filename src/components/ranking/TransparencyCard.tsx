import { ArrowUpRight } from "lucide-react";
import { GithubMark } from "@/components/brand/BrandMark";
import { Card } from "@/components/ui/card";
import { LINKS } from "@/services/config";

export function TransparencyCard() {
  return (
    <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center md:p-5">
      <code className="w-fit shrink-0 rounded-[10px] bg-obsidian px-3 py-2 font-mono text-[13px] font-semibold text-[#BBF7D0]">
        IEc = Σ Pi / Mc
      </code>
      <p className="flex-1 text-[12px] leading-[17px] text-muted-foreground">
        <b className="font-semibold text-foreground">Pi</b>: puntos netos de cada maceta (votos −
        penalizaciones) · <b className="font-semibold text-foreground">Mc</b>: matrícula oficial de
        la carrera.
      </p>
      <a
        href={LINKS.reglas}
        target="_blank"
        rel="noreferrer"
        className="flex w-fit items-center gap-[6px] text-[12px] font-semibold text-foreground underline decoration-foreground/25 underline-offset-2 hover:decoration-foreground"
      >
        <GithubMark size={13} /> Auditar reglas y matrícula base en GitHub{" "}
        <ArrowUpRight size={14} aria-hidden />
      </a>
    </Card>
  );
}
