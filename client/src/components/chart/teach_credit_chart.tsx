import { createMemo, Show } from 'solid-js';
import * as echarts from 'echarts';
import EChart from './echart_component';

export interface YearlyCreditTrend {
    yearId: string;
    yearName: string;
    yearCode: number | string | null;
    totalCredit: number;
    classCount: number;
    totalPlannedSessions: number;
    totalRealizedSessions: number;
    courses: { name: string; code?: string; credit: number; className?: string }[];
}

export default function TeachCreditChart(props: { data: YearlyCreditTrend[] }) {
    const chartOption = createMemo<echarts.EChartsOption | null>(() => {
        const data = props.data;
        if (!data || data.length === 0) return null;

        const categories = data.map((d) => d.yearName);
        const creditValues = data.map((d) => d.totalCredit);

        return {
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(23, 23, 23, 0.94)',
                borderColor: 'rgba(99, 102, 241, 0.5)',
                borderWidth: 1,
                padding: [12, 16],
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
                    const idx = params[0].dataIndex;
                    const item = data[idx];
                    if (!item) return '';

                    let out = `<div style="font-weight:bold;margin-bottom:8px;color:#a5b4fc;font-size:13px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:4px;">
                        Tahun Akademik: ${item.yearName}
                    </div>`;

                    out += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:4px;">
                        <span style="color:#d1d5db;">
                            <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background-color:#6366f1;margin-right:6px;"></span>
                            Total Beban Mengajar:
                        </span>
                        <span style="font-weight:bold;color:#ffffff;font-size:13px;">${item.totalCredit} SKS</span>
                    </div>`;

                    out += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:4px;">
                        <span style="color:#9ca3af;">Jumlah Kelas Diampu:</span>
                        <span style="font-weight:bold;color:#38bdf8;">${item.classCount} Kelas</span>
                    </div>`;

                    if (item.totalPlannedSessions > 0 || item.totalRealizedSessions > 0) {
                        out += `<div style="display:flex;align-items:center;justify-content:space-between;gap:20px;margin-bottom:6px;">
                            <span style="color:#9ca3af;">Realisasi Perkuliahan:</span>
                            <span style="font-weight:bold;color:#34d399;">${item.totalRealizedSessions} / ${item.totalPlannedSessions} Sesi</span>
                        </div>`;
                    }

                    if (item.courses && item.courses.length > 0) {
                        out += `<div style="margin-top:8px;padding-top:6px;border-top:1px dashed rgba(255,255,255,0.15);font-size:11px;color:#9ca3af;">
                            <div style="font-weight:600;margin-bottom:4px;color:#cbd5e1;">Mata Kuliah Diampu:</div>`;
                        const displayCourses = item.courses.slice(0, 3);
                        for (const c of displayCourses) {
                            const cName = c.name.length > 25 ? c.name.substring(0, 25) + '...' : c.name;
                            const cls = c.className ? ` (${c.className})` : '';
                            out += `<div style="display:flex;justify-content:space-between;gap:12px;color:#e2e8f0;padding:1px 0;">
                                <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">• ${cName}${cls}</span>
                                <span style="font-weight:bold;color:#a5b4fc;">${c.credit} SKS</span>
                            </div>`;
                        }
                        if (item.courses.length > 3) {
                            out += `<div style="color:#64748b;font-style:italic;margin-top:2px;">+ ${item.courses.length - 3} mata kuliah lainnya</div>`;
                        }
                        out += `</div>`;
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
                minInterval: 1,
                axisLabel: {
                    formatter: '{value} SKS',
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
            series: [
                {
                    name: 'Total SKS Mengajar',
                    type: 'line',
                    smooth: 0.35,
                    data: creditValues,
                    itemStyle: { color: '#6366f1' },
                    lineStyle: { width: 3, color: '#6366f1' },
                    symbol: 'circle',
                    symbolSize: 6,
                    areaStyle: {
                        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                            { offset: 0, color: 'rgba(99, 102, 241, 0.28)' },
                            { offset: 1, color: 'rgba(99, 102, 241, 0.01)' },
                        ]),
                    },
                },
            ],
        };
    });

    return (
        <div class="w-full">
            <Show when={chartOption()}>
                {(option) => (
                    <EChart
                        option={option()}
                        ariaLabel="Total Teaching Credits per Academic Year"
                        height={260}
                        class="w-full"
                    />
                )}
            </Show>
        </div>
    );
}
