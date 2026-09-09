import { createMemo, Show } from 'solid-js';
import * as echarts from 'echarts';
import EChart from './echart_component';

export interface AcademicTrendPoint {
    semName: string;
    ips: number;
    ipk: number;
    sks: number;
    totalSks: number;
}

export default function AcademicPerformanceChart(props: { data: AcademicTrendPoint[] }) {
    const chartOption = createMemo<echarts.EChartsOption | null>(() => {
        const data = props.data;
        if (!data || data.length === 0) return null;

        const categories = data.map((d) => d.semName);
        const ipkValues = data.map((d) => d.ipk);
        const ipsValues = data.map((d) => d.ips);

        return {
            tooltip: {
                trigger: 'axis',
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
                    const title = params[0].axisValueLabel;
                    let out = `<div style="font-weight:bold;margin-bottom:4px;color:#a5b4fc">${title}</div>`;
                    for (const p of params) {
                        const marker = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:${p.color};margin-right:6px;"></span>`;
                        out += `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;">
                            <span>${marker}${p.seriesName}</span>
                            <span style="font-weight:bold;">${Number(p.value).toFixed(2)}</span>
                        </div>`;
                    }
                    return out;
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
                min: 0,
                max: 4,
                interval: 1,
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
                    name: 'IPK',
                    type: 'line',
                    smooth: 0.3,
                    data: ipkValues,
                    itemStyle: { color: '#6366f1' },
                    lineStyle: { width: 3, color: '#6366f1' },
                    symbol: 'circle',
                    symbolSize: 6,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(99, 102, 241, 0.25)' },
                            { offset: 1, color: 'rgba(99, 102, 241, 0.0)' },
                        ]),
                    },
                },
                {
                    name: 'IPS',
                    type: 'line',
                    smooth: 0.3,
                    data: ipsValues,
                    itemStyle: { color: '#0284c7' },
                    lineStyle: { width: 2.5, color: '#0284c7' },
                    symbol: 'circle',
                    symbolSize: 6,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(2, 132, 199, 0.18)' },
                            { offset: 1, color: 'rgba(2, 132, 199, 0.0)' },
                        ]),
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
                        ariaLabel="Academic Performance Trend - IPS and IPK by Semester"
                        height={220}
                        class="w-full min-w-0"
                    />
                )}
            </Show>
        </div>
    );
}
