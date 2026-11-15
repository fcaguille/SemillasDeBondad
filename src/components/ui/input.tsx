import * as React from "react";
import { cn } from "@/lib/utils";

/** 52px high-affordance input. Use `leading`/`trailing` for icons or buttons. */
export function Input({
  className,
  leading,
  trailing,
  invalid,
  ...props
}: React.ComponentProps<"input"> & {
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
  invalid?: boolean;
}) {
  return (
    <div
      data-slot="input"
      className={cn(
        "flex h-[52px] w-full items-center gap-2 rounded-btn border bg-card px-4 transition focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10",
        invalid ? "border-destructive ring-4 ring-destructive/10" : "border-input",
        className,
      )}
    >
      {leading && <span className="text-muted-foreground [&_svg]:size-[18px]">{leading}</span>}
      <input
        aria-invalid={invalid || undefined}
        className="min-w-0 flex-1 bg-transparent text-[16px] text-foreground outline-none placeholder:text-[#9AA19B] focus-visible:outline-none"
        {...props}
      />
      {trailing}
    </div>
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full resize-none rounded-btn border border-input bg-card px-4 py-3 text-[16px] outline-none transition placeholder:text-[#9AA19B] focus:border-primary focus:ring-4 focus:ring-primary/10 focus-visible:outline-none",
        className,
      )}
      {...props}
    />
  );
}
