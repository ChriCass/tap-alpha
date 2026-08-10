import type { ReactNode } from "react";
import { Icon, PCard, Popover, PopoverItem } from "../polaris";
import { formatCurrency, formatNumber } from "../../utils/format";
import type { ProductStats } from "../../types";

const RANGES = [
  { value: 7, label: "7 días" },
  { value: 30, label: "30 días" },
  { value: 90, label: "90 días" },
  { value: 365, label: "12 meses" },
];

const BUCKETS: { key: keyof ProductStats["days_of_inventory"]; label: string; color: string }[] = [
  { key: "0-30", label: "Menos de 30 días", color: "bg-[#c62b1f]" },
  { key: "30-60", label: "30 a 60 días", color: "bg-[#e0a33b]" },
  { key: "60-90", label: "60 a 90 días", color: "bg-[#4a90d9]" },
  { key: "90+", label: "Más de 90 días", color: "bg-[#2f6f5e]" },
];

interface ProductInsightsProps {
  stats: ProductStats | null;
  days: number;
  onDaysChange: (days: number) => void;
  loading?: boolean;
}

export function ProductInsights({ stats, days, onDaysChange, loading }: ProductInsightsProps) {
  const rangeLabel = RANGES.find((range) => range.value === days)?.label ?? `${days} días`;

  return (
    <PCard padding="none">
      <div className="grid grid-cols-1 divide-y divide-line md:grid-cols-[auto_1fr_1fr_1fr] md:divide-x md:divide-y-0">
        <div className="flex items-center px-4 py-3">
          <Popover
            width="min-w-[150px]"
            activator={({ onClick }) => (
              <button
                type="button"
                onClick={onClick}
                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
              >
                <Icon name="calendar" className="size-4" />
                {rangeLabel}
              </button>
            )}
          >
            {(close) => (
              <>
                {RANGES.map((range) => (
                  <PopoverItem
                    key={range.value}
                    selected={range.value === days}
                    onClick={() => {
                      onDaysChange(range.value);
                      close();
                    }}
                  >
                    {range.label}
                  </PopoverItem>
                ))}
              </>
            )}
          </Popover>
        </div>

        <Metric
          label="Tasa de venta promedio"
          loading={loading}
          value={stats ? `${stats.sell_through_rate}%` : "—"}
          caption={
            stats
              ? `${formatNumber(stats.units_sold)} vendidas · ${formatNumber(stats.units_on_hand)} en stock`
              : undefined
          }
        />

        <Metric label="Productos por días de inventario restante" loading={loading}>
          <DaysOfInventory stats={stats} />
        </Metric>

        <Metric label="Análisis ABC de productos" loading={loading}>
          <AbcAnalysis stats={stats} />
        </Metric>
      </div>
    </PCard>
  );
}

interface MetricProps {
  label: string;
  value?: string;
  caption?: string;
  loading?: boolean;
  children?: ReactNode;
}

function Metric({ label, value, caption, loading, children }: MetricProps) {
  return (
    <div className="flex min-w-0 flex-col gap-1 px-4 py-3">
      <p className="truncate text-[13px] text-ink-sub">{label}</p>
      {loading ? (
        <div className="h-5 w-24 animate-pulse rounded bg-line" />
      ) : (
        <>
          {value && <p className="text-[15px] font-medium text-ink">{value}</p>}
          {children}
          {caption && <p className="text-xs text-ink-muted">{caption}</p>}
        </>
      )}
    </div>
  );
}

function DaysOfInventory({ stats }: { stats: ProductStats | null }) {
  if (!stats) return <p className="text-[13px] text-ink-sub">Sin datos</p>;

  const total = BUCKETS.reduce((sum, bucket) => sum + stats.days_of_inventory[bucket.key], 0);

  if (total === 0) {
    return (
      <p className="text-[13px] text-ink-sub">
        Sin datos
        {stats.days_of_inventory.unknown > 0 && (
          <span className="text-ink-muted"> · {stats.days_of_inventory.unknown} sin ventas</span>
        )}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex h-2 overflow-hidden rounded-full bg-line">
        {BUCKETS.map((bucket) => {
          const count = stats.days_of_inventory[bucket.key];
          if (count === 0) return null;

          return (
            <div
              key={bucket.key}
              className={bucket.color}
              style={{ width: `${(count / total) * 100}%` }}
              title={`${bucket.label}: ${count} productos`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-ink-sub">
        {BUCKETS.filter((bucket) => stats.days_of_inventory[bucket.key] > 0).map((bucket) => (
          <span key={bucket.key} className="inline-flex items-center gap-1">
            <span className={`size-2 rounded-full ${bucket.color}`} />
            {bucket.label.replace("Menos de ", "<").replace("Más de ", ">")}:{" "}
            {stats.days_of_inventory[bucket.key]}
          </span>
        ))}
      </div>
    </div>
  );
}

function AbcAnalysis({ stats }: { stats: ProductStats | null }) {
  if (!stats) return <p className="text-[13px] text-ink-sub">Sin datos</p>;

  const { grades, total_revenue: totalRevenue } = stats.abc;
  const dominant = (Object.keys(grades) as ("A" | "B" | "C")[]).reduce((best, grade) =>
    grades[grade].revenue > grades[best].revenue ? grade : best,
  );

  return (
    <div className="flex flex-col gap-1">
      <p className="w-fit border-b-2 border-link text-[15px] font-medium text-ink">
        {formatCurrency(totalRevenue)} {dominant}
      </p>
      <p className="text-xs text-ink-muted">
        A: {grades.A.count} · B: {grades.B.count} · C: {grades.C.count}
      </p>
    </div>
  );
}
