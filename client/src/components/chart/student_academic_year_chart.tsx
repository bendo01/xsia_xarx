import { createSignal, createMemo, Show, For } from 'solid-js';
import * as echarts from 'echarts';
import EChart from './echart_component';

export interface StudentStatusByYear {
    yearName: string;
    total: number;
    active: number;
    leave: number;
    graduated: number;
    other: number;
}

export default function StudentAcademicYearChart(props: {
    data: StudentStatusByYear[];
    unitName?: string;
}) {
    // Visibility toggles for the chart lines
    const [showTotal, setShowTotal] = createSignal(true);
    const [showActive, setShowActive] = createSignal(true);
    const [showLeave, setShowLeave] = createSignal(true);
    const [showGraduated, setShowGraduated] = createSignal(true);

    // Totals across all cohorts
    const totalStudentsSum = createMemo(() => {
        return (props.data || []).reduce((acc, d) => acc + d.total, 0);
    });

    const totalActiveSum = createMemo(() => {
        return (props.data || []).reduce((acc, d) => acc + d.active, 0);
    });

    const totalLeaveSum = createMemo(() => {
        return (props.data || []).reduce((acc, d) => acc + d.leave, 0);
    });

    const totalGraduatedSum = createMemo(() => {
        return (props.data || []).reduce((acc, d) => acc + d.graduated, 0);
    });

    // ECharts option reactive to toggles and data
    const chartOption = createMemo<echarts.EChartsOption | null>(() => {
        const data = props.data;
        if (!data || data.length === 0) return null;

        const categories = data.map((d) => d.yearName);
        const series: echarts.SeriesOption[] = [];

        if (showTotal()) {
            series.push({
                name: 'Total Mahasiswa',
                type: 'line',
                smooth: 0.35,
                data: data.map((d) => d.total),
                itemStyle: { color: '#6366f1' },
                lineStyle: { width: 3, color: '#6366f1' },
                symbol: 'circle',
                symbolSize: 6,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
                        { offset: 1, color: 'rgba(99, 102, 241, 0.01)' },
                    ]),
                },
            });
        }

        if (showActive()) {
            series.push({
                name: 'Status Aktif',
                type: 'line',
                smooth: 0.35,
                data: data.map((d) => d.active),
                itemStyle: { color: '#10b981' },
                lineStyle: { width: 2.5, color: '#10b981' },
                symbol: 'circle',
                symbolSize: 6,
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(16, 185, 129, 0.20)' },
                        { offset: 1, color: 'rgba(16, 185, 129, 0.01)' },
                    ]),
                },
            });
        }

        if (showLeave()) {
            series.push({
                name: 'Status Cuti',
                type: 'line',
                smooth: 0.35,
                data: data.map((d) => d.leave),
                itemStyle: { color: '#f59e0b' },
                lineStyle: { width: 2, color: '#f59e0b' },
                symbol: 'circle',
                symbolSize: 6,
            });
        }

        if (showGraduated()) {
            series.push({
                name: 'Status Lulus',
                type: 'line',
                smooth: 0.35,
                data: data.map((d) => d.graduated),
                itemStyle: { color: '#0284c7' },
                lineStyle: { width: 2, color: '#0284c7' },
                symbol: 'circle',
                symbolSize: 6,
            });
        }

        if (series.length === 0) return null;

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(23, 23, 23, 0.92)',
                borderColor: 'rgba(64, 64, 64, 0.8)',
                borderWidth: 1,
                padding: [10, 14],
                textStyle: {
                    color: '#ffffff',
                    fontSize: 12,
                    fontFamily: 'monospace',
                },
                axisPointer: {
                    type: 'line',
                    lineStyle: {
                        color: 'rgba(99, 102, 241, 0.4)',
                        type: 'dashed',
                    },
                },
                formatter: (params: any) => {
                    if (!Array.isArray(params) || params.length === 0) return '';
                    const title = params[0].axisValueLabel;
                    let out = `<div style="font-weight:bold;margin-bottom:6px;color:#a5b4fc;font-size:13px;">Tahun Akademik: ${title}</div>`;
                    for (const p of params) {
                        const marker = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};margin-right:8px;"></span>`;
                        out += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;padding:2px 0;">
                            <span style="color:#d1d5db;">${marker}${p.seriesName}</span>
                            <span style="font-weight:bold;color:#ffffff;">${p.value} mhs</span>
                        </div>`;
                    }
                    return out;
                },
            },
            grid: {
                top: 28,
                right: 20,
                bottom: 24,
                left: 36,
                containLabel: true,
            },
            xAxis: {
                type: 'category',
                data: categories,
                boundaryGap: false,
                axisLine: {
                    lineStyle: {
                        color: 'rgba(156, 163, 175, 0.35)',
                    },
                },
                axisTick: { show: false },
                axisLabel: {
                    color: '#9ca3af',
                    fontSize: 11,
                    fontFamily: 'monospace',
                },
            },
            yAxis: {
                type: 'value',
                minInterval: 1,
                axisLabel: {
                    formatter: '{value}',
                    color: '#9ca3af',
                    fontSize: 11,
                    fontFamily: 'monospace',
                },
                splitLine: {
                    lineStyle: {
                        type: 'dashed',
                        color: 'rgba(156, 163, 175, 0.18)',
                    },
                },
            },
            series,
        };
    });

    return (
        <div class="p-6 sm:p-7 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-6">
            {/* Header Title & Series Toggles */}
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-700/60 pb-4">
                <div class="space-y-1">
                    <div class="flex items-center gap-2">
                        <span class="size-2 rounded-full bg-indigo-500"></span>
                        <h3 class="text-sm font-extrabold text-neutral-900 dark:text-white">
                            Tren Jumlah Mahasiswa per Tahun Akademik & Status
                        </h3>
                    </div>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                        Visualisasi garis total mahasiswa terdaftar berdasarkan tahun akademik dan status kelulusan/keaktifan di {props.unitName || 'Program Studi'}.
                    </p>
                </div>

                {/* Legend & Interactive Visibility Toggles */}
                <div class="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowTotal(!showTotal())}
                        class={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            showTotal()
                                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-400 border border-neutral-200 dark:border-neutral-700 opacity-60'
                        }`}
                        title="Toggle Total Mahasiswa"
                    >
                        <span class="size-2 rounded-full bg-indigo-500"></span>
                        <span>Total ({totalStudentsSum()})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowActive(!showActive())}
                        class={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            showActive()
                                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-400 border border-neutral-200 dark:border-neutral-700 opacity-60'
                        }`}
                        title="Toggle Status Aktif"
                    >
                        <span class="size-2 rounded-full bg-emerald-500"></span>
                        <span>Aktif ({totalActiveSum()})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowLeave(!showLeave())}
                        class={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            showLeave()
                                ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-400 border border-neutral-200 dark:border-neutral-700 opacity-60'
                        }`}
                        title="Toggle Status Cuti"
                    >
                        <span class="size-2 rounded-full bg-amber-500"></span>
                        <span>Cuti ({totalLeaveSum()})</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setShowGraduated(!showGraduated())}
                        class={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                            showGraduated()
                                ? 'bg-sky-50 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                                : 'bg-neutral-100 dark:bg-neutral-700/50 text-neutral-400 border border-neutral-200 dark:border-neutral-700 opacity-60'
                        }`}
                        title="Toggle Status Lulus"
                    >
                        <span class="size-2 rounded-full bg-sky-500"></span>
                        <span>Lulus ({totalGraduatedSum()})</span>
                    </button>
                </div>
            </div>

            {/* Chart Container */}
            <Show
                when={props.data && props.data.length > 0}
                fallback={
                    <div class="py-16 text-center text-neutral-400 dark:text-neutral-500 flex flex-col items-center justify-center gap-2 font-mono text-xs">
                        <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                        </svg>
                        <span>Belum ada data tren mahasiswa untuk Unit ID ini.</span>
                    </div>
                }
            >
                <div class="w-full">
                    <Show
                        when={chartOption()}
                        fallback={
                            <div class="py-12 text-center text-neutral-400 dark:text-neutral-500 font-mono text-xs">
                                Pilih minimal satu seri data di atas untuk menampilkan grafik tren.
                            </div>
                        }
                    >
                        {(opt) => (
                            <EChart
                                option={opt()}
                                ariaLabel="Tren Jumlah Mahasiswa per Tahun Akademik"
                                height={280}
                                class="w-full"
                            />
                        )}
                    </Show>
                </div>

                {/* Cohort Breakdown Data Cards */}
                <div class="overflow-x-auto pt-2">
                    <table class="w-full text-xs text-left">
                        <thead class="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                            <tr>
                                <th class="py-2.5 px-3 rounded-s-xl">Tahun Akademik</th>
                                <th class="py-2.5 px-3 text-center">Total Mahasiswa</th>
                                <th class="py-2.5 px-3 text-center">Status Aktif</th>
                                <th class="py-2.5 px-3 text-center">Status Cuti</th>
                                <th class="py-2.5 px-3 text-center">Status Lulus</th>
                                <th class="py-2.5 px-3 text-center rounded-e-xl">Lainnya</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <For each={props.data}>
                                {(row) => (
                                    <tr class="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/30 transition-colors">
                                        <td class="py-2.5 px-3 font-mono font-bold text-neutral-900 dark:text-white">
                                            {row.yearName}
                                        </td>
                                        <td class="py-2.5 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {row.total}
                                        </td>
                                        <td class="py-2.5 px-3 text-center font-mono text-emerald-600 dark:text-emerald-400">
                                            {row.active}
                                        </td>
                                        <td class="py-2.5 px-3 text-center font-mono text-amber-600 dark:text-amber-400">
                                            {row.leave}
                                        </td>
                                        <td class="py-2.5 px-3 text-center font-mono text-sky-600 dark:text-sky-400">
                                            {row.graduated}
                                        </td>
                                        <td class="py-2.5 px-3 text-center font-mono text-neutral-400">
                                            {row.other}
                                        </td>
                                    </tr>
                                )}
                            </For>
                        </tbody>
                    </table>
                </div>
            </Show>
        </div>
    );
}
