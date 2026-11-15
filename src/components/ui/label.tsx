import * as React from "react";
import { cn } from "@/lib/utils";

export function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn("mb-2 block text-[13px] font-semibold text-foreground", className)}
      {...props}
    />
  );
}

export function FieldMessage({ children, error }: { children?: React.ReactNode; error?: boolean }) {
  if (!children) return null;
  return (
    <p
      role={error ? "alert" : undefined}
      className={cn(
        "mt-2 text-[12px] leading-[17px]",
        error ? "font-medium text-destructive" : "text-muted-foreground",
      )}
    >
      {children}
    </p>
  );
}
