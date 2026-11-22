// Pure Chart.js configuration for the analytics dashboards (no DOM, no chart.js import: unit-tested).
// A dashboard describes WHAT to draw as a ChartSpec; buildConfig turns it into a Chart.js config
// themed with the app's design tokens, so light/dark and the palette stay in one place.

export const PALETTE = ['#6366f1', '#0ea5e9', '#0d9488', '#f59e0b', '#ef4444', '#8b5cf6', '#84cc16', '#ec4899'];

export interface ChartTheme {
  /** Text colour. */
  fg: string;
  /** Secondary text (axis ticks). */
  muted: string;
  /** Grid lines. */
  grid: string;
  /** Card background (slice borders, tooltip). */
  card: string;
}

export interface SpecDataset {
  label: string;
  data: (number | null)[];
  color?: string;
  /** Mixed charts: draw this dataset as a line over bars. */
  type?: 'line' | 'bar';
  /** `y1` puts it on a secondary axis on the right (e.g. GPA over student counts). */
  axis?: 'y' | 'y1';
  /** Line charts: fill under the line. */
  fill?: boolean;
}

export interface ChartSpec {
  kind: 'line' | 'bar' | 'doughnut';
  labels: string[];
  datasets: SpecDataset[];
  /** Stack bars / areas of the datasets on top of each other. */
  stacked?: boolean;
  /** Bars growing from the left (long labels). */
  horizontal?: boolean;
  /** Value formatter for ticks and tooltips. */
  format?: (n: number) => string;
  /** Formatter for the secondary axis. */
  format1?: (n: number) => string;
  /** Fixed axis maximum (e.g. 4 for GPA). */
  yMax?: number;
  /** Minimum of the axis; omit for 0. */
  yMin?: number;
  /** Decimal places of the primary axis ticks (default 0: counts must not show 0,5 steps). */
  precision?: number;
  /** Same for the secondary axis (default: let Chart.js choose). */
  precision1?: number;
  /** Bounds of the secondary axis (e.g. 0..4 for GPA). */
  y1Min?: number;
  y1Max?: number;
  /** Hide the legend (single dataset). */
  noLegend?: boolean;
}

export const colorOf = (i: number, explicit?: string) => explicit ?? PALETTE[i % PALETTE.length];

/** "#rrggbb" + alpha -> rgba(); anything that is not a 6-digit hex is returned as is. */
export function withAlpha(color: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(color);
  if (!m) return color;
  const n = Number.parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Fallback theme used on the server and when a token cannot be read. */
export const DEFAULT_THEME: ChartTheme = { fg: '#1f2937', muted: '#6b7280', grid: 'rgba(107,114,128,0.2)', card: '#ffffff' };

const id = (n: number) => String(n);

export function buildConfig(spec: ChartSpec, theme: ChartTheme = DEFAULT_THEME, opts: { reduceMotion?: boolean } = {}) {
  const fmt = spec.format ?? id;
  const common = {
    responsive: true,
    maintainAspectRatio: false,
    animation: opts.reduceMotion ? (false as const) : { duration: 400 },
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: !spec.noLegend && (spec.datasets.length > 1 || spec.kind === 'doughnut'),
        position: 'bottom' as const,
        labels: { color: theme.fg, usePointStyle: true, boxWidth: 8, font: { size: 11 } },
      },
      tooltip: {
        callbacks: {
          label: (c: { dataset: { label?: string; yAxisID?: string }; parsed: number | { x: number; y: number }; label: string }) => {
            const v = typeof c.parsed === 'number' ? c.parsed : spec.horizontal ? c.parsed.x : c.parsed.y;
            const f = c.dataset.yAxisID === 'y1' && spec.format1 ? spec.format1 : fmt;
            return `${c.dataset.label ?? c.label}: ${f(v)}`;
          },
        },
      },
    },
  };

  if (spec.kind === 'doughnut') {
    const colors = spec.labels.map((_, i) => colorOf(i));
    return {
      type: 'doughnut' as const,
      data: {
        labels: spec.labels,
        datasets: [{ data: spec.datasets[0]?.data ?? [], backgroundColor: colors, borderColor: theme.card, borderWidth: 2 }],
      },
      options: {
        ...common,
        interaction: { mode: 'nearest' as const, intersect: true },
        cutout: '62%',
        plugins: { ...common.plugins, legend: { ...common.plugins.legend, display: true, position: 'right' as const } },
      },
    };
  }

  const horizontal = spec.kind === 'bar' && spec.horizontal;
  const valueAxis = {
    beginAtZero: spec.yMin === undefined,
    min: spec.yMin,
    max: spec.yMax,
    stacked: !!spec.stacked,
    border: { display: false },
    grid: { color: theme.grid },
    ticks: { color: theme.muted, font: { size: 11 }, precision: spec.precision ?? 0, callback: (v: string | number) => fmt(Number(v)) },
  };
  const labelAxis = {
    stacked: !!spec.stacked,
    border: { display: false },
    grid: { display: false },
    ticks: { color: theme.muted, font: { size: 11 }, maxRotation: 0, autoSkipPadding: 12 },
  };
  const hasSecondary = spec.datasets.some((d) => d.axis === 'y1');

  const datasets = spec.datasets.map((d, i) => {
    const color = colorOf(i, d.color);
    const type = d.type ?? spec.kind;
    const base = { label: d.label, data: d.data, ...(d.type ? { type } : {}), yAxisID: d.axis ?? 'y', order: type === 'line' ? 0 : 1 };
    return type === 'line'
      ? {
          ...base,
          borderColor: color,
          backgroundColor: withAlpha(color, spec.stacked ? 0.55 : 0.15),
          pointBackgroundColor: color,
          pointRadius: spec.labels.length > 24 ? 0 : 3,
          pointHoverRadius: 5,
          borderWidth: 2,
          tension: 0.3,
          fill: d.fill ?? false,
          spanGaps: true,
        }
      : { ...base, backgroundColor: withAlpha(color, 0.85), borderRadius: 2, maxBarThickness: horizontal ? 22 : 40 };
  });

  return {
    type: spec.kind,
    data: { labels: spec.labels, datasets },
    options: {
      ...common,
      ...(horizontal ? { indexAxis: 'y' as const } : {}),
      scales: {
        [horizontal ? 'x' : 'y']: valueAxis,
        [horizontal ? 'y' : 'x']: labelAxis,
        ...(hasSecondary
          ? {
              y1: {
                position: 'right' as const,
                beginAtZero: spec.y1Min === undefined,
                min: spec.y1Min,
                max: spec.y1Max,
                grid: { drawOnChartArea: false },
                border: { display: false },
                ticks: { color: theme.muted, font: { size: 11 }, ...(spec.precision1 !== undefined ? { precision: spec.precision1 } : {}), callback: (v: string | number) => (spec.format1 ?? id)(Number(v)) },
              },
            }
          : {}),
      },
    },
  };
}
