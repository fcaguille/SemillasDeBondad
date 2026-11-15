import { useId } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (v: T) => void;
  className?: string;
  "aria-label"?: string;
}) {
  const id = useId();
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      className={cn(
        "grid h-11 auto-cols-fr grid-flow-col rounded-[12px] bg-secondary p-[3px]",
        className,
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={on}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative rounded-[10px] text-[14px] font-semibold transition-colors",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {on && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-[10px] bg-card shadow-[0_1px_3px_rgba(16,24,20,0.12)]"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative">{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
