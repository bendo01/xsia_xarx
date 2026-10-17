import { createMemo, Show } from 'solid-js';
import * as echarts from 'echarts';
import EChart from './echart_component';

export interface SemesterGradePoint {
    grade: string;
    courseCount: number;
    credits: number;
}

// Same color families as the grade badges in the course tables
const gradeColor = (grade: string) => {
    const g = grade.trim().toUpperCase();
    if (g.startsWith('A')) return '#2563eb';
    if (g.startsWith('B')) return '#059669';
    if (g.startsWith('C')) return '#d97706';
    if (g.startsWith('D')) return '#ea580c';
    if (g.startsWith('E')) return '#dc2626';
    return '#a3a3a3';
};

export default function SemesterGradeChart(props: { data: SemesterGradePoint[] }) {
    const chartOption = createMemo<echarts.EChartsOption | null>(() => {
        const data = props.data;
        if (!data || data.length === 0) return null;

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                backgroundColor: 'rgba(23, 23, 23, 0.92)',
                borderColor: 'rgba(64, 64, 64, 0.8)',
                borderWidth: 1,
                padding: [8, 12],
                textStyle: {
                    color: '#ffffff',
                    fontSize: 12,
                    fontFamily: 'monospace',
                },
                formatter: (params: any) => {
                    if (!Array.isArray(params) || params.length === 0) return '';
                    const point = data[params[0].dataIndex];
                    return `<div style="font-weight:bold;margin-bottom:4px;color:${gradeColor(point.grade)}">Nilai ${point.grade}</div>
                        <div style="display:flex;justify-content:space-between;gap:16px;"><span>Mata Kuliah</span><span style="font-weight:bold;">${point.courseCount}</span></div>
                        <div style="display:flex;justify-content:space-between;gap:16px;"><span>SKS</span><span style="font-weight:bold;">${point.credits}</span></div>`;
                },
            },
            grid: {
                top: 24,
                right: 20,
                bottom: 24,
                left: 36,
                containLabel: true,
            },
            xAxis: {
                type: 'category',
                data: data.map((d) => d.grade),
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
                    fontWeight: 'bold',
                },
            },
            yAxis: {
                type: 'value',
                min: 0,
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
                        color: 'rgba(156, 163, 175, 0.2)',
                    },
                },
            },
            series: [
                {
                    name: 'Mata Kuliah',
                    type: 'bar',
                    barMaxWidth: 36,
                    data: data.map((d) => ({
                        value: d.courseCount,
                        itemStyle: { color: gradeColor(d.grade), borderRadius: [2, 2, 0, 0] },
                    })),
                    label: {
                        show: true,
                        position: 'top',
                        color: '#9ca3af',
                        fontSize: 11,
                        fontFamily: 'monospace',
                        formatter: (p: any) => `${data[p.dataIndex].credits} SKS`,
                    },
                },
            ],
        };
    });

    return (
        <div class="w-full min-w-0">
            <Show when={chartOption()}>
                {(option) => (
                    <EChart
                        option={option()}
                        ariaLabel="Semester Grade Distribution - Courses and SKS per Grade"
                        height={220}
                        class="w-full min-w-0"
                    />
                )}
            </Show>
        </div>
    );
}
