import { createMemo, Show } from 'solid-js';
import * as echarts from 'echarts';
import EChart from './echart_component';

export interface ReferenceDistributionItem {
    name: string;
    count: number;
}

export const REFERENCE_CHART_COLORS = [
    '#0ea5e9', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#64748b', // Slate
];

const TOOLTIP_STYLE = {
    backgroundColor: 'rgba(23, 23, 23, 0.92)',
    borderColor: 'rgba(64, 64, 64, 0.8)',
    borderWidth: 1,
    padding: [8, 12] as [number, number],
    textStyle: { color: '#ffffff', fontSize: 12, fontFamily: 'monospace' },
};

const AXIS_LABEL_COLOR = '#a3a3a3';
const SPLIT_LINE_COLOR = 'rgba(163, 163, 163, 0.2)';

// Categories past this count are drawn as a horizontal bar chart instead of a donut
const MAX_DONUT_SLICES = 6;
const MAX_BAR_ROWS = 12;

export default function ReferenceDistributionChart(props: {
    title: string;
    description?: string;
    items: ReferenceDistributionItem[];
    unit?: string;
    /** Force a layout; by default small sets use a donut and larger sets a bar chart. */
    variant?: 'donut' | 'bar' | 'column';
    height?: number;
}) {
    const allItems = createMemo(() => (props.items || []).filter((i) => i.count > 0));
    const total = createMemo(() => allItems().reduce((acc, i) => acc + i.count, 0));
    const unit = () => props.unit ?? 'orang';

    const variant = createMemo(() => props.variant ?? (allItems().length <= MAX_DONUT_SLICES ? 'donut' : 'bar'));

    // Long-tail references (occupations, professions) are folded into "Lainnya" to keep bars readable
    const items = createMemo(() => {
        const data = allItems();
        if (variant() !== 'bar' || data.length <= MAX_BAR_ROWS) return data;
        const sorted = [...data].sort((a, b) => b.count - a.count);
        const head = sorted.slice(0, MAX_BAR_ROWS - 1);
        const rest = sorted.slice(MAX_BAR_ROWS - 1).reduce((acc, i) => acc + i.count, 0);
        return [...head, { name: 'Lainnya', count: rest }];
    });

    const chartOption = createMemo<echarts.EChartsOption | null>(() => {
        const data = items();
        if (data.length === 0) return null;
        const sum = total();
        const percent = (n: number) => (sum > 0 ? ((n / sum) * 100).toFixed(1) : '0.0');

        if (variant() === 'donut') {
            return {
                backgroundColor: 'transparent',
                tooltip: {
                    trigger: 'item',
                    ...TOOLTIP_STYLE,
                    formatter: (p: any) => `<b>${p.name}</b><br/>${p.value.toLocaleString()} ${unit()} (${p.percent.toFixed(1)}%)`,
                },
                legend: {
                    type: 'scroll',
                    orient: 'vertical',
                    right: 0,
                    top: 'middle',
                    itemWidth: 10,
                    itemHeight: 10,
                    textStyle: { color: AXIS_LABEL_COLOR, fontSize: 11 },
                    formatter: (name: string) => {
                        const item = data.find((d) => d.name === name);
                        return item ? `${name}  ${percent(item.count)}%` : name;
                    },
                },
                series: [
                    {
                        type: 'pie',
                        radius: ['50%', '78%'],
                        center: ['32%', '50%'],
                        padAngle: 2,
                        itemStyle: { borderRadius: 4 },
                        label: { show: false },
                        emphasis: { scale: true, scaleSize: 4 },
                        data: data.map((d, idx) => ({
                            name: d.name,
                            value: d.count,
                            itemStyle: { color: REFERENCE_CHART_COLORS[idx % REFERENCE_CHART_COLORS.length] },
                        })),
                    },
                ],
            };
        }

        const isColumn = variant() === 'column';
        const categoryAxis = {
            type: 'category' as const,
            data: isColumn ? data.map((d) => d.name) : data.map((d) => d.name).reverse(),
            axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11, width: 110, overflow: 'truncate' as const },
            axisLine: { lineStyle: { color: SPLIT_LINE_COLOR } },
            axisTick: { show: false },
        };
        const valueAxis = {
            type: 'value' as const,
            axisLabel: { color: AXIS_LABEL_COLOR, fontSize: 11 },
            splitLine: { lineStyle: { color: SPLIT_LINE_COLOR } },
        };
        const values = isColumn ? data.map((d) => d.count) : data.map((d) => d.count).reverse();

        return {
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                ...TOOLTIP_STYLE,
                formatter: (params: any) => {
                    const p = Array.isArray(params) ? params[0] : params;
                    return `<b>${p.name}</b><br/>${p.value.toLocaleString()} ${unit()} (${percent(p.value)}%)`;
                },
            },
            grid: { left: 8, right: 40, top: 8, bottom: 8, containLabel: true },
            xAxis: isColumn ? categoryAxis : valueAxis,
            yAxis: isColumn ? valueAxis : categoryAxis,
            series: [
                {
                    type: 'bar',
                    data: values,
                    barMaxWidth: 22,
                    itemStyle: {
                        color: REFERENCE_CHART_COLORS[0],
                        borderRadius: isColumn ? [4, 4, 0, 0] : [0, 4, 4, 0],
                    },
                    label: {
                        show: true,
                        position: isColumn ? 'top' : 'right',
                        color: AXIS_LABEL_COLOR,
                        fontSize: 10,
                        fontFamily: 'monospace',
                    },
                },
            ],
        };
    });

    const chartHeight = () => {
        if (props.height) return props.height;
        if (variant() === 'bar') return Math.max(220, items().length * 26 + 24);
        return 220;
    };

    return (
        <div class="flex flex-col p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
            <div class="flex items-start justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
                <div class="min-w-0">
                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">{props.title}</h3>
                    <Show when={props.description}>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{props.description}</p>
                    </Show>
                </div>
                <span class="shrink-0 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                    {allItems().length} kategori
                </span>
            </div>
            <Show
                when={chartOption()}
                fallback={
                    <div class="py-16 text-center text-xs font-mono text-neutral-400 dark:text-neutral-500">
                        Belum ada data.
                    </div>
                }
            >
                {(opt) => (
                    <div class="pt-3">
                        <EChart option={opt()} height={chartHeight()} ariaLabel={props.title} />
                    </div>
                )}
            </Show>
        </div>
    );
}
