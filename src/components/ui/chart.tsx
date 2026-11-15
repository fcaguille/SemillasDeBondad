/**
 * shadcn/ui-style chart primitives over Recharts.
 * `config` maps series keys → label + color and exposes them as CSS vars
 * (`var(--color-<key>)`) inside the container.
 */
import * as React from "react";
import { ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label: string; color?: string }>;

const ChartContext = React.createContext<ChartConfig>({});
export const useChartConfig = () => React.useContext(ChartContext);

export function ChartContainer({
  config,
  className,
  children,
}: {
  config: ChartConfig;
  className?: string;
  children: React.ReactElement;
}) {
  const style = Object.fromEntries(
    Object.entries(config)
      .filter(([, v]) => v.color)
      .map(([k, v]) => [`--color-${k}`, v.color]),
  ) as React.CSSProperties;
  return (
    <ChartContext.Provider value={config}>
      <div
        data-slot="chart"
        style={style}
        className={cn(
          "w-full min-w-0 overflow-hidden text-[12px] [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-[#E1E5DF] [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-surface]:outline-none",
          className,
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
}

export const ChartTooltip = Tooltip;

export function ChartTooltipCard({
  title,
  rows,
}: {
  title: React.ReactNode;
  rows: Array<[React.ReactNode, React.ReactNode]>;
}) {
  return (
    <div className="min-w-40 rounded-[12px] border border-border bg-card px-3 py-2 text-[12px] shadow-float">
      <p className="mb-1 font-bold text-foreground">{title}</p>
      {rows.map(([k, v], i) => (
        <div key={i} className="flex justify-between gap-4 tabular-nums">
          <span className="text-muted-foreground">{k}</span>
          <span className="font-semibold text-foreground">{v}</span>
        </div>
      ))}
    </div>
  );
}
