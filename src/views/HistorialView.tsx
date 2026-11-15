import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Camera, HardDrive, Smartphone, Star, Trash2 } from "lucide-react";
import { Page, PageHeader } from "@/components/layout/AppShell";
import { BotanicalArt } from "@/components/botanical/BotanicalArt";
import { EmptyState, ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Sheet } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { useEliminarFoto, useFotosLocales, useMisCalificaciones } from "@/hooks/useSemillas";
import { formatBytes, formatFecha, formatRelativo } from "@/lib/utils";
import type { FotoLocal } from "@/types/domain";

type Tab = "fotos" | "votos";

export function HistorialView() {
  const [tab, setTab] = useState<Tab>("fotos");
  return (
    <Page>
      <PageHeader eyebrow="Tu actividad" title="Historial" />
      <SegmentedControl
        className="mt-4 md:max-w-md"
        aria-label="Tipo de historial"
        value={tab}
        onChange={setTab}
        options={[
          { value: "fotos", label: "Mis Fotos (Local)" },
          { value: "votos", label: "Mis Calificaciones" },
        ]}
      />
      <div className="mt-4">{tab === "fotos" ? <FotosGrid /> : <Calificaciones />}</div>
    </Page>
  );
}

function FotosGrid() {
  const fotos = useFotosLocales();
  const eliminar = useEliminarFoto();
  const [sel, setSel] = useState<FotoLocal | null>(null);

  if (fotos.isLoading)
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="aspect-[4/5] rounded-[16px]" />
        ))}
      </div>
    );
  if (fotos.error) return <ErrorState error={fotos.error} onRetry={fotos.refetch} />;
  const list = fotos.data ?? [];
  if (!list.length)
    return (
      <EmptyState
        icon={<Camera />}
        title="Sin fotos guardadas"
        description="Las fotos de evidencia que tomes al registrar una maceta se guardan solo en este dispositivo."
      />
    );

  const total = list.reduce((s, f) => s + f.tamano_bytes, 0);
  return (
    <>
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-btn border border-border bg-card px-3 py-[10px] text-[12px]">
        <HardDrive size={15} className="text-primary" aria-hidden />
        <span className="font-semibold tabular-nums">
          {list.length} fotos · {formatBytes(total)}
        </span>
        <span className="text-muted-foreground">guardadas en IndexedDB · no consumen datos</span>
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        {list.map((f, i) => (
          <motion.li
            key={f.id}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: Math.min(i, 8) * 0.03 }}
          >
            <button
              onClick={() => setSel(f)}
              className="group relative block aspect-[4/5] w-full overflow-hidden rounded-[16px] border border-border bg-[#E9ECE7] text-left"
            >
              <img
                src={f.url}
                alt={`Foto de evidencia de la maceta ${f.planta_id}`}
                loading="lazy"
                className="size-full object-cover text-[0px] transition duration-300 group-hover:scale-[1.03]"
              />
              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/85 px-2 py-[3px] text-[10px] font-semibold text-foreground backdrop-blur-md">
                <Smartphone size={10} aria-hidden /> Almacenado en dispositivo
              </span>
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-3 pb-2 pt-8 text-white">
                <span className="block font-mono text-[12px] font-semibold tabular-nums">
                  #{f.planta_id}
                </span>
                <span className="block text-[11px] tabular-nums text-white/80">
                  {formatFecha(f.creada_en)}
                </span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
      <Sheet
        open={!!sel}
        onOpenChange={(o) => !o && setSel(null)}
        title={sel ? `Maceta #${sel.planta_id}` : ""}
        description={
          sel
            ? `Tomada el ${formatFecha(sel.creada_en)} · ${formatBytes(sel.tamano_bytes)}`
            : undefined
        }
      >
        {sel && (
          <div className="flex flex-col gap-3">
            <img
              src={sel.url}
              alt={`Foto de evidencia de la maceta ${sel.planta_id}`}
              className="max-h-[50dvh] w-full rounded-card object-cover"
            />
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" asChild>
                <Link to={`/p/${sel.planta_id}`}>Ver carta</Link>
              </Button>
              <Button
                variant="destructive-ghost"
                className="border border-[#FAD4D4]"
                disabled={eliminar.isPending}
                onClick={async () => {
                  await eliminar.mutateAsync(sel.id).catch(() => {});
                  setSel(null);
                  toast("Foto eliminada del dispositivo");
                }}
              >
                <Trash2 size={16} /> Eliminar
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </>
  );
}

function Calificaciones() {
  const votos = useMisCalificaciones();
  if (votos.isLoading) return <Skeleton className="h-64 rounded-card" />;
  if (votos.error) return <ErrorState error={votos.error} onRetry={votos.refetch} />;
  if (!votos.data?.length)
    return (
      <EmptyState
        icon={<Star />}
        title="Aún no calificas macetas"
        description="Escanea el QR de una maceta para darle tus estrellas."
      />
    );
  return (
    <Card className="divide-y divide-border md:max-w-2xl">
      {votos.data.map((v) => (
        <Link
          key={v.id}
          to={`/p/${v.planta.id}`}
          className="flex items-center gap-3 p-3 transition first:rounded-t-card last:rounded-b-card hover:bg-muted"
        >
          <span className="size-12 shrink-0 overflow-hidden rounded-[12px] border border-border">
            <BotanicalArt noDiseno={v.planta.no_diseno} labelled={false} className="size-full" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[15px] font-bold">{v.planta.nombre}</span>
            <span className="block font-mono text-[11px] tabular-nums text-muted-foreground">
              #{v.planta.id} · {formatRelativo(v.creada_en)}
            </span>
          </span>
          <span className="flex gap-[2px]" aria-label={`${v.estrellas} de 5 estrellas`}>
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                size={14}
                className={i < (v.estrellas ?? 0) ? "fill-gold text-gold" : "text-[#D5DAD3]"}
                aria-hidden
              />
            ))}
          </span>
        </Link>
      ))}
    </Card>
  );
}
