import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border font-semibold tabular-nums [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        success: "border-[#CDE9D5] bg-brand-tint text-brand",
        neutral: "border-border bg-card text-foreground",
        destructive: "border-[#FAD4D4] bg-crimson-tint text-crimson",
        gold: "border-[#F7DDB0] bg-[#FEF6E7] text-[#B45309]",
        dark: "border-obsidian bg-obsidian text-white",
        info: "border-[#BDE5F7] bg-[#E6F5FC] text-[#00669A]",
        warning: "border-[#F7DDB0] bg-[#FFFBEB] text-[#92400E]",
        glass: "border-white/15 bg-white/10 text-white backdrop-blur",
      },
      size: {
        sm: "h-6 px-2 text-[11px]",
        default: "h-7 px-[10px] text-[12px]",
      },
    },
    defaultVariants: { variant: "neutral", size: "default" },
  },
);

export function Badge({
  className,
  variant,
  size,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  );
}
