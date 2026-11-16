import { NavLink } from "react-router";
import { motion } from "motion/react";
import { NAV_ITEMS } from "./nav";
import { cn } from "@/lib/utils";

/** Mobile (<768px) frosted bottom navigation, respects env(safe-area-inset-bottom). */
export function BottomTabBar({ dark = false }: { dark?: boolean }) {
  return (
    <nav
      aria-label="Navegación principal"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t pb-safe backdrop-blur-xl md:hidden",
        dark
          ? "border-white/10 bg-[rgba(10,14,12,0.82)]"
          : "border-border bg-[rgba(255,255,255,0.92)]",
      )}
    >
      <ul className="mx-auto grid h-[58px] max-w-md grid-cols-6 px-2 pt-[6px]">
        {NAV_ITEMS.map(({ to, label, icon: Icon, primary }) => (
          <li key={to} className="relative flex justify-center">
            <NavLink
              to={to}
              className="group flex w-full flex-col items-center gap-[3px] outline-none"
              aria-label={label}
            >
              {({ isActive }) => {
                const tone = isActive
                  ? dark
                    ? "text-leaf"
                    : "text-primary"
                  : dark
                    ? "text-white/70"
                    : "text-muted-foreground";
                if (primary) {
                  return (
                    <>
                      <motion.span
                        whileTap={{ scale: 0.92 }}
                        className={cn(
                          "absolute -top-[28px] grid size-14 place-items-center rounded-full bg-primary text-white shadow-fab ring-4 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-ring",
                          dark ? "ring-[#0A0E0C]" : "ring-background",
                        )}
                      >
                        <Icon size={26} strokeWidth={2} aria-hidden />
                      </motion.span>
                      <span className={cn("mt-[30px] text-[10px] font-semibold", tone)}>
                        {label}
                      </span>
                    </>
                  );
                }
                return (
                  <>
                    <Icon
                      size={24}
                      strokeWidth={isActive ? 2.25 : 1.75}
                      className={tone}
                      aria-hidden
                    />
                    <span
                      className={cn(
                        "text-[10px]",
                        isActive ? "font-semibold" : "font-medium",
                        tone,
                      )}
                    >
                      {label}
                    </span>
                  </>
                );
              }}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
