import { createSignal, createMemo, Show, For } from 'solid-js';
import { defineChart } from '@tanstack/charts';
import { pie, polar, radialArc } from '@tanstack/charts/polar';
import { tooltip } from '@tanstack/charts/tooltip';
import { Chart } from '@tanstack/charts/solid';

export interface CourseCategoryItem {
    name: string;
    count: number;
    credits: number;
    color?: string;
}

const DEFAULT_COLORS = [
    '#0ea5e9', // Sky Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#64748b', // Slate
];

export default function CourseCategoryPieChart(props: {
    data: CourseCategoryItem[];
    unitName?: string;
}) {
    const [hoveredIndex, setHoveredIndex] = createSignal<number | null>(null);
    const [chartMode, setChartMode] = createSignal<'donut' | 'pie'>('donut');

    const totalCourses = createMemo(() => {
        return (props.data || []).reduce((acc, c) => acc + c.count, 0);
    });

    const totalCredits = createMemo(() => {
        return (props.data || []).reduce((acc, c) => acc + c.credits, 0);
    });

    // Enriched category items with colors and percentages
    const enrichedCategories = createMemo(() => {
        const total = totalCourses();
        return (props.data || []).map((item, idx) => {
            const percentage = total > 0 ? (item.count / total) * 100 : 0;
            const color = item.color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length];
            return {
                ...item,
                percentage,
                color,
            };
        });
    });

    const activeItem = createMemo(() => {
        const idx = hoveredIndex();
        if (idx !== null && enrichedCategories()[idx]) {
            return enrichedCategories()[idx];
        }
        return null;
    });

    // TanStack Chart definition using polar and radialArc marks
    const chartDefinition = createMemo(() => {
        const items = enrichedCategories();
        const total = totalCourses();
        if (items.length === 0 || total === 0) return null;

        const isDonut = chartMode() === 'donut';
        const slices = pie(items, { value: (d) => d.count });

        return defineChart({
            marks: [
                polar({
                    inset: 8,
                    radiusRatio: 0.88,
                    marks: [
                        radialArc(slices, {
                            innerRadius: ({ radius }) => (isDonut ? radius * 0.58 : 0),
                            cornerRadius: 4,
                            padAngle: 0.02,
                            color: 'name',
                            key: 'name',
                        }),
                    ],
                    scales: {
                        angle: null,
                        radius: null,
                    },
                }),
            ],
            scales: {
                x: null,
                y: null,
            },
            color: {
                domain: items.map((d) => d.name),
                range: items.map((d) => d.color),
            },
            tooltip,
        });
    });

    return (
        <div class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-6">
            {/* Header Title & Mode Toggle */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-700/60 pb-4">
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <span class="size-2 rounded-full bg-teal-500"></span>
                        <h3 class="text-sm font-extrabold text-neutral-900 dark:text-white">
                            Distribusi Kategori Mata Kuliah
                        </h3>
                    </div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                        Proporsi mata kuliah berdasarkan kelompok dan variasi jenis mata kuliah di {props.unitName || 'Program Studi'}.
                    </p>
                </div>

                <div class="flex items-center gap-1.5 p-1 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setChartMode('donut')}
                        class={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            chartMode() === 'donut'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        Donut
                    </button>
                    <button
                        type="button"
                        onClick={() => setChartMode('pie')}
                        class={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                            chartMode() === 'pie'
                                ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-2xs'
                                : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                    >
                        Pie
                    </button>
                </div>
            </div>

            {/* Chart Content Area */}
            <Show
                when={enrichedCategories().length > 0 && totalCourses() > 0}
                fallback={
                    <div class="py-16 text-center text-neutral-400 dark:text-neutral-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
                        <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z" />
                        </svg>
                        <span>Belum ada data mata kuliah terdaftar untuk unit ini.</span>
                    </div>
                }
            >
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* TanStack Polar Pie / Donut Chart */}
                    <div class="lg:col-span-5 flex flex-col items-center justify-center relative">
                        <div class="relative size-64 flex items-center justify-center">
                            <Show when={chartDefinition()}>
                                {(def) => (
                                    <Chart
                                        definition={def()}
                                        ariaLabel="Distribusi Kategori Mata Kuliah"
                                        height={256}
                                        class="size-full"
                                    />
                                )}
                            </Show>

                            {/* Center Donut Label */}
                            <Show when={chartMode() === 'donut'}>
                                <div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center p-2">
                                    <span class="text-2xl font-black font-mono text-neutral-900 dark:text-white leading-none">
                                        {activeItem() ? activeItem()!.count : totalCourses()}
                                    </span>
                                    <span class="text-[10px] font-mono font-medium text-neutral-400 dark:text-neutral-400 mt-1 uppercase tracking-wider">
                                        {activeItem() ? `${activeItem()!.percentage.toFixed(1)}%` : 'Mata Kuliah'}
                                    </span>
                                    <Show when={activeItem()}>
                                        <span class="text-[10px] font-bold text-teal-600 dark:text-teal-400 truncate max-w-[100px]">
                                            {activeItem()!.name}
                                        </span>
                                    </Show>
                                </div>
                            </Show>
                        </div>
                    </div>

                    {/* Interactive Legend & Category Breakdown */}
                    <div class="lg:col-span-7 space-y-3">
                        <div class="flex items-center justify-between text-xs text-neutral-400 font-mono pb-1 border-b border-neutral-100 dark:border-neutral-700/60">
                            <span>Kategori Mata Kuliah</span>
                            <span>Jumlah MK & SKS</span>
                        </div>

                        <div class="space-y-2 max-h-64 overflow-y-auto pr-1">
                            <For each={enrichedCategories()}>
                                {(cat, idx) => {
                                    const isHovered = () => hoveredIndex() === idx();
                                    return (
                                        <div
                                            onMouseEnter={() => setHoveredIndex(idx())}
                                            onMouseLeave={() => setHoveredIndex(null)}
                                            class={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
                                                isHovered()
                                                    ? 'bg-neutral-50 dark:bg-neutral-900/80 border-teal-500 shadow-2xs translate-x-1'
                                                    : 'bg-white dark:bg-neutral-800/60 border-neutral-100 dark:border-neutral-700/60 hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40'
                                            }`}
                                        >
                                            <div class="flex items-center justify-between text-xs">
                                                <div class="flex items-center gap-2.5 min-w-0">
                                                    <span
                                                        class="size-3 rounded-md shrink-0 shadow-2xs"
                                                        style={{ 'background-color': cat.color }}
                                                    ></span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                                        {cat.name}
                                                    </span>
                                                </div>

                                                <div class="flex items-center gap-3 shrink-0 font-mono">
                                                    <span class="font-bold text-neutral-900 dark:text-white">
                                                        {cat.count} MK
                                                    </span>
                                                    <span class="text-neutral-400 dark:text-neutral-500">
                                                        ({cat.credits} SKS)
                                                    </span>
                                                    <span
                                                        class="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                                        style={{
                                                            'background-color': `${cat.color}18`,
                                                            color: cat.color,
                                                        }}
                                                    >
                                                        {cat.percentage.toFixed(1)}%
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Mini Proportion Bar */}
                                            <div class="mt-2 w-full h-1.5 rounded-full bg-neutral-100 dark:bg-neutral-700 overflow-hidden">
                                                <div
                                                    class="h-full rounded-full transition-all duration-300"
                                                    style={{
                                                        width: `${cat.percentage}%`,
                                                        'background-color': cat.color,
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                </div>

                {/* Footer Highlights */}
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/60">
                    <div class="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Total Mata Kuliah</span>
                        <span class="text-sm font-black font-mono text-neutral-900 dark:text-white">{totalCourses()} MK</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Total Beban SKS</span>
                        <span class="text-sm font-black font-mono text-teal-600 dark:text-teal-400">{totalCredits()} SKS</span>
                    </div>
                    <div class="p-3 rounded-2xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">Jumlah Kategori</span>
                        <span class="text-sm font-black font-mono text-purple-600 dark:text-purple-400">{enrichedCategories().length} Kategori</span>
                    </div>
                </div>
            </Show>
        </div>
    );
}
