import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-btn font-semibold transition-[background,color,box-shadow,transform] active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgba(21,128,61,0.6)] hover:bg-brand-deep",
        secondary: "bg-secondary text-secondary-foreground hover:bg-[#E2E5E0]",
        outline: "border border-border bg-card text-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-black/[0.04]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-[0_8px_20px_-8px_rgba(220,38,38,0.6)] hover:bg-[#B91C1C]",
        "destructive-ghost": "text-crimson hover:bg-crimson-tint",
        mp: "bg-mp text-white shadow-[0_8px_20px_-8px_rgba(0,158,227,0.7)] hover:bg-[#008BCB]",
        white:
          "bg-white text-brand-deep shadow-[0_6px_16px_-6px_rgba(0,0,0,0.35)] hover:bg-[#F3FBF5]",
        glass: "bg-white/15 text-white backdrop-blur-md hover:bg-white/25",
        link: "h-auto px-0 text-primary underline-offset-4 hover:underline active:scale-100",
      },
      size: {
        sm: "h-9 px-3 text-[13px]",
        default: "h-11 px-4 text-[15px]",
        lg: "h-auto min-h-14 whitespace-normal px-5 py-2 text-center text-[16px] leading-tight",
        icon: "size-11",
        "icon-sm": "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ComponentProps<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
