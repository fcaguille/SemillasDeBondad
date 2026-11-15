import * as React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "motion/react";
import { X } from "lucide-react";
import { useIsDesktop } from "@/hooks/useMediaQuery";
import { cn } from "@/lib/utils";

/**
 * Responsive sheet: iOS-style draggable bottom sheet on mobile,
 * centered dialog on desktop (≥768px). Built on Radix Dialog for focus
 * trapping / a11y and Motion for physics.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
  hideTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  hideTitle?: boolean;
}) {
  const desktop = useIsDesktop();
  const reduce = useReducedMotion();
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 120 || info.velocity.y > 600) onOpenChange(false);
  };
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-50 bg-obsidian/45 backdrop-blur-[2px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              {desktop ? (
                <motion.div
                  className={cn(
                    "fixed left-1/2 top-1/2 z-50 max-h-[88vh] w-[min(92vw,480px)] overflow-y-auto rounded-[24px] bg-card p-6 shadow-float",
                    className,
                  )}
                  initial={{ opacity: 0, scale: reduce ? 1 : 0.96, x: "-50%", y: "-48%" }}
                  animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
                  exit={{ opacity: 0, scale: reduce ? 1 : 0.96, x: "-50%", y: "-48%" }}
                  transition={{ type: "spring", stiffness: 420, damping: 34 }}
                >
                  <Header title={title} description={description} hideTitle={hideTitle} />
                  {children}
                </motion.div>
              ) : (
                <motion.div
                  className={cn(
                    "fixed inset-x-0 bottom-0 z-50 max-h-[92dvh] overflow-y-auto rounded-t-[28px] bg-card px-6 pt-2 shadow-[0_-20px_40px_-10px_rgba(15,23,42,0.3)]",
                    "pb-[calc(24px+var(--safe-bottom))]",
                    className,
                  )}
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", stiffness: 380, damping: 38 }}
                  drag={reduce ? false : "y"}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.6 }}
                  onDragEnd={onDragEnd}
                >
                  <div className="flex justify-center pb-2">
                    <span className="h-[5px] w-9 rounded-full bg-[#D5DAD3]" />
                  </div>
                  <Header title={title} description={description} hideTitle={hideTitle} />
                  {children}
                </motion.div>
              )}
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}

function Header({
  title,
  description,
  hideTitle,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  hideTitle?: boolean;
}) {
  return (
    <div className={cn("relative mb-4 pr-10", hideTitle && "sr-only")}>
      <Dialog.Title className="text-[20px] font-extrabold leading-tight tracking-[-0.02em]">
        {title}
      </Dialog.Title>
      {description ? (
        <Dialog.Description className="mt-1 text-[13px] leading-[18px] text-muted-foreground">
          {description}
        </Dialog.Description>
      ) : (
        <Dialog.Description className="sr-only">
          {typeof title === "string" ? title : "Diálogo"}
        </Dialog.Description>
      )}
      <Dialog.Close
        aria-label="Cerrar"
        className="absolute -top-1 right-0 grid size-9 place-items-center rounded-full bg-secondary text-foreground transition hover:bg-[#E2E5E0]"
      >
        <X size={18} strokeWidth={2.4} />
      </Dialog.Close>
    </div>
  );
}
