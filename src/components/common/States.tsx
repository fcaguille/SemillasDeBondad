import type { ReactNode } from "react";
import { motion } from "motion/react";
import { CircleAlert } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Button } from "@/components/ui/button";
import { mensajeDeError } from "@/lib/errors";

export function FullScreenLoader({ label = "Cargando…" }: { label?: string }) {
  return (
    <div role="status" className="grid min-h-dvh place-items-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        >
          <BrandMark size={56} />
        </motion.div>
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-card border border-[#FAD4D4] bg-crimson-tint px-6 py-8 text-center"
    >
      <CircleAlert className="text-crimson" />
      <p className="text-[14px] font-semibold text-crimson">{mensajeDeError(error)}</p>
      {onRetry && (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-card border-2 border-dashed border-[#D3DAD0] px-6 py-10 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-brand-tint text-primary">
        {icon}
      </span>
      <p className="mt-1 text-[16px] font-bold">{title}</p>
      {description && (
        <p className="max-w-xs text-[13px] leading-[19px] text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
