import { For, Show, createEffect, createSignal, onSettled } from 'solid-js';

import { formatNumber } from '../../i18n';
import { buildConfig, DEFAULT_THEME, type ChartSpec, type ChartTheme } from '../../lib/chartjs';
import { Skeleton } from '../ui/skeleton';

type ChartCtor = typeof import('chart.js').Chart;
let loading: Promise<ChartCtor> | null = null;

/** chart.js is loaded in the browser only, once, with just the pieces the dashboards use. */
function loadChart(): Promise<ChartCtor> {
  loading ??= import('chart.js').then((m) => {
    m.Chart.register(
      m.LineController, m.BarController, m.DoughnutController,
      m.LineElement, m.PointElement, m.BarElement, m.ArcElement,
      m.CategoryScale, m.LinearScale, m.Tooltip, m.Legend, m.Filler,
    );
    return m.Chart;
  });
  return loading;
}

/** Read the design tokens off the document so the chart follows light/dark mode. */
function readTheme(): ChartTheme {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    fg: v('--foreground', DEFAULT_THEME.fg),
    muted: v('--muted-foreground-1', DEFAULT_THEME.muted),
    grid: v('--card-line', DEFAULT_THEME.grid),
    card: v('--card', DEFAULT_THEME.card),
  };
}

const BAR_HEIGHTS = [45, 70, 55, 85, 40, 65, 90, 50];

/** A placeholder shaped like the chart being loaded (bars, a ring, or a line), pulsing until it is drawn. */
function ChartSkeleton(props: { kind: ChartSpec['kind']; horizontal?: boolean }) {
  return (
    <div class="absolute inset-0 flex items-center justify-center" aria-hidden="true">
      <Show when={props.kind === 'doughnut'}>
        <Skeleton class="size-40 rounded-full [mask:radial-gradient(circle,transparent_55%,#000_56%)]" />
      </Show>
      <Show when={props.kind === 'bar' && !props.horizontal}>
        <div class="flex h-4/5 w-full items-end gap-2 px-6">
          <For each={BAR_HEIGHTS}>{(h) => <Skeleton class="flex-1" style={{ height: `${h}%` }} />}</For>
        </div>
      </Show>
      <Show when={props.kind === 'bar' && props.horizontal}>
        <div class="flex w-full flex-col gap-3 px-6">
          <For each={BAR_HEIGHTS.slice(0, 5)}>{(h) => <Skeleton class="h-5" style={{ width: `${h}%` }} />}</For>
        </div>
      </Show>
      <Show when={props.kind === 'line'}>
        <div class="flex h-4/5 w-full flex-col justify-end gap-6 px-6">
          <Skeleton class="h-px w-full" />
          <Skeleton class="h-px w-full" />
          <Skeleton class="h-24 w-full [clip-path:polygon(0_80%,20%_40%,40%_60%,60%_20%,80%_45%,100%_10%,100%_100%,0_100%)]" />
        </div>
      </Show>
    </div>
  );
}

/**
 * A Chart.js canvas described by a ChartSpec. The canvas is drawn in the browser only; the server
 * renders an empty frame plus the same numbers as a visually hidden table (also the screen-reader
 * view). The chart is rebuilt when the data changes or the theme toggles.
 */
export default function ChartJs(props: { spec: ChartSpec; ariaLabel: string; height?: number }) {
  let canvas: HTMLCanvasElement | undefined;
  const [themeTick, setThemeTick] = createSignal(0);
  // false until the first draw: the skeleton shows on the server render, while chart.js downloads, and until the canvas is painted.
  const [ready, setReady] = createSignal(false);

  onSettled(() => {
    // Dark mode is a class on <html>; redraw when it flips.
    const mo = new MutationObserver(() => setThemeTick((n) => n + 1));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  });

  createEffect(
    () => ({ spec: props.spec, tick: themeTick() }),
    ({ spec }) => {
      if (!canvas) return;
      let chart: InstanceType<ChartCtor> | undefined;
      let cancelled = false;
      const reduceMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      void loadChart().then((Chart) => {
        // The effect can be disposed (page change, re-render) before chart.js has loaded.
        if (cancelled || !canvas?.isConnected) return;
        try {
          chart = new Chart(canvas, buildConfig(spec, readTheme(), { reduceMotion }) as never);
        } catch {
          /* a canvas that vanished mid-creation: nothing to draw */
        }
        setReady(true);
      }).catch(() => setReady(true)); // chart.js failed to load: drop the skeleton, the hidden table still has the numbers
      return () => {
        cancelled = true;
        chart?.destroy();
      };
    },
  );

  const fmt = (n: number | null) => (n === null ? '-' : (props.spec.format ?? formatNumber)(n));

  return (
    <div class="w-full min-w-0">
      <div class="relative w-full" style={{ height: `${props.height ?? 260}px` }}>
        <Show when={!ready()}>
          <ChartSkeleton kind={props.spec.kind} horizontal={props.spec.horizontal} />
        </Show>
        <canvas ref={canvas} role="img" aria-label={props.ariaLabel} aria-busy={ready() ? 'false' : 'true'} />
      </div>
      <div class="sr-only">
        <table>
          <caption>{props.ariaLabel}</caption>
          <thead>
            <tr>
              <th />
              <For each={props.spec.datasets}>{(d) => <th scope="col">{d.label}</th>}</For>
            </tr>
          </thead>
          <tbody>
            <For each={props.spec.labels}>
              {(label, i) => (
                <tr>
                  <th scope="row">{label}</th>
                  <For each={props.spec.datasets}>{(d) => <td>{fmt(d.data[i()] ?? null)}</td>}</For>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
