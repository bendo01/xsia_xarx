// Adapters from the dashboards' data shapes to ChartSpec (see lib/chartjs.ts).
import { periodLabel } from './analytics';
import type { ChartSpec } from './chartjs';
import type { LineData, Slice } from './unit-dashboard';

type Common = Pick<ChartSpec, 'format' | 'yMax' | 'yMin' | 'noLegend' | 'precision'>;

/** Several series over periods: stacked bars (counts that add up) or lines (rates, trends). */
export function seriesSpec(line: LineData, kind: 'bar' | 'line', opts: Common & { stacked?: boolean; fill?: boolean; gapZeros?: boolean } = {}): ChartSpec {
  const { stacked, fill, gapZeros, ...common } = opts;
  // A series that is zero everywhere (a status nobody has) only clutters the legend.
  const used = line.series.filter((s) => s.values.some((v) => v > 0));
  const series = used.length > 0 ? used : line.series.slice(0, 1);
  return {
    kind,
    stacked,
    labels: line.categories.map(periodLabel),
    datasets: series.map((s) => ({
      label: s.name,
      // For rates (GPA) a 0 means "no data this period": leave a gap instead of dropping the line to 0.
      data: gapZeros ? s.values.map((v) => (v > 0 ? v : null)) : s.values,
      fill: fill ?? (kind === 'line' && series.length === 1),
    })),
    noLegend: series.length === 1,
    ...common,
  };
}

/** Name/value rows: a doughnut for a few parts of a whole, horizontal bars for a ranking. */
export function slicesSpec(items: Slice[], kind: 'doughnut' | 'bar', opts: Common & { limit?: number; label?: string } = {}): ChartSpec {
  const rows = items.slice(0, opts.limit ?? (kind === 'bar' ? 12 : 8));
  const { limit: _l, label, ...common } = opts;
  return {
    kind,
    horizontal: kind === 'bar',
    labels: rows.map((r) => r.name),
    datasets: [{ label: label ?? '', data: rows.map((r) => r.value) }],
    noLegend: kind === 'bar',
    ...common,
  };
}
