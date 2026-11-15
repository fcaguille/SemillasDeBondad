import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, XAxis, YAxis } from "recharts";
import { Info, TrendingDown, TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipCard,
  type ChartConfig,
} from "@/components/ui/chart";
import { formatNumber, formatRelativo } from "@/lib/utils";
import { CARRERAS, type Carrera, type CarreraStats } from "@/types/domain";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"];
const LABEL_FILL = ["#FFFFFF", "#14532D", "#14532D", "#14532D"];

const config: ChartConfig = {
  iec: { label: "pts/alumno", color: "var(--chart-1)" },
};

interface Row extends CarreraStats {
  nombre: string;
}

function CarreraTick({
  x,
  y,
  payload,
  rows,
  miCarrera,
}: {
  x?: number;
  y?: number;
  payload?: { value: string };
  rows: Row[];
  miCarrera?: Carrera;
}) {
  const row = rows.find((r) => r.nombre === payload?.value);
  if (!row || x === undefined || y === undefined) return null;
  const tag = row.posicion === 1 ? "1° Lugar" : row.carrera === miCarrera ? "Tu carrera" : null;
  return (
    <g transform={`translate(0,${y})`}>
      <text x={0} y={tag ? -3 : 4} fontSize={12} fontWeight={600} fill="#111827">
        <tspan fill="#6B7280" fontWeight={700} fontSize={11}>
          {row.posicion}
        </tspan>{" "}
        {row.nombre}
      </text>
      {tag && row.posicion === 1 && (
        <g transform="translate(0,4)">
          <rect width={56} height={16} rx={8} fill="#ECF7EF" stroke="#CDE9D5" />
          <text x={28} y={11.5} textAnchor="middle" fontSize={10} fontWeight={700} fill="#15803D">
            1° Lugar
          </text>
        </g>
      )}
      {tag && row.posicion !== 1 && (
        <text x={0} y={12} fontSize={9.5} fontWeight={700} fill="#15803D" letterSpacing={0.6}>
          TU CARRERA
        </text>
      )}
    </g>
  );
}

export function IecChart({ data, miCarrera }: { data: CarreraStats[]; miCarrera?: Carrera }) {
  const rows: Row[] = useMemo(
    () =>
      [...data]
        .sort((a, b) => a.posicion - b.posicion)
        .map((d) => ({ ...d, nombre: CARRERAS[d.carrera].corto })),
    [data],
  );
  const mine = rows.find((r) => r.carrera === miCarrera);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle>Índice Ecosustentable Proporcional (IEc)</CardTitle>
          <CardDescription className="mt-1">
            Puntaje neto ÷ Matrícula oficial por carrera
          </CardDescription>
        </div>
        <Info size={16} className="mt-[2px] shrink-0 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent className="flex-1 pt-3">
        <ChartContainer config={config} className="h-[232px]">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
            barCategoryGap={10}
            accessibilityLayer
          >
            <CartesianGrid horizontal={false} strokeDasharray="4 4" />
            <XAxis
              type="number"
              domain={[0, 1]}
              ticks={[0, 0.25, 0.5, 0.75, 1]}
              tickFormatter={(v: number) => v.toFixed(2)}
              tickLine={false}
              axisLine={false}
              fontSize={10}
            />
            <YAxis
              type="category"
              dataKey="nombre"
              width={110}
              tickLine={false}
              axisLine={false}
              tick={(props: object) => <CarreraTick {...props} rows={rows} miCarrera={miCarrera} />}
            />
            <ChartTooltip
              cursor={false}
              content={({ active, payload }) => {
                const r = active && (payload?.[0]?.payload as Row | undefined);
                if (!r) return null;
                return (
                  <ChartTooltipCard
                    title={CARRERAS[r.carrera].nombre}
                    rows={[
                      ["IEc", `${r.iec.toFixed(2)} pts/alumno`],
                      ["Puntaje neto", formatNumber(r.puntaje_neto)],
                      ["Matrícula", formatNumber(r.matricula_oficial)],
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="iec" radius={[4, 10, 10, 4]} isAnimationActive={false}>
              {rows.map((r, i) => (
                <Cell key={r.carrera} fill={COLORS[i]} />
              ))}
              <LabelList
                dataKey="iec"
                position="insideRight"
                offset={8}
                content={(p) => {
                  const {
                    x = 0,
                    y = 0,
                    width = 0,
                    height = 0,
                    value,
                    index = 0,
                  } = p as {
                    x?: number;
                    y?: number;
                    width?: number;
                    height?: number;
                    value?: number;
                    index?: number;
                  };
                  return (
                    <text
                      x={Number(x) + Number(width) - 8}
                      y={Number(y) + Number(height) / 2 + 4}
                      textAnchor="end"
                      fontSize={12}
                      fontWeight={700}
                      fill={LABEL_FILL[index]}
                      className="tabular-nums"
                    >
                      {Number(value).toFixed(2)}
                    </text>
                  );
                }}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="justify-between gap-2 text-[12px]">
        <span className="font-medium text-muted-foreground">
          pts/alumno · {rows[0] ? formatRelativo(rows[0].actualizado_en).toLowerCase() : ""}
        </span>
        {mine && (
          <span
            className={`flex items-center gap-1 font-semibold tabular-nums ${mine.tendencia_semanal >= 0 ? "text-primary" : "text-crimson"}`}
          >
            {mine.tendencia_semanal >= 0 ? (
              <TrendingUp size={13} aria-hidden />
            ) : (
              <TrendingDown size={13} aria-hidden />
            )}
            {mine.nombre} {mine.tendencia_semanal >= 0 ? "+" : ""}
            {mine.tendencia_semanal.toFixed(2)} / semana
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
