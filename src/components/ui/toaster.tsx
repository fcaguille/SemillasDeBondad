import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type Toast = { id: number; title: string; tone: "success" | "error" };
let toasts: Toast[] = [];
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());

export function toast(title: string, tone: Toast["tone"] = "success") {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, title, tone }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 3200);
}

export function Toaster() {
  const list = useSyncExternalStore(
    (cb) => {
      subs.add(cb);
      return () => subs.delete(cb);
    },
    () => toasts,
  );
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-[calc(12px+var(--safe-top))] z-[60] flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {list.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className={cn(
              "pointer-events-auto flex max-w-sm items-center gap-2 rounded-full border px-4 py-[10px] text-[14px] font-semibold shadow-float backdrop-blur-xl",
              t.tone === "success"
                ? "border-[#CDE9D5] bg-white/95 text-foreground"
                : "border-[#FAD4D4] bg-crimson-tint/95 text-crimson",
            )}
          >
            {t.tone === "success" ? (
              <CircleCheck size={18} className="text-primary" />
            ) : (
              <CircleAlert size={18} />
            )}
            {t.title}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
