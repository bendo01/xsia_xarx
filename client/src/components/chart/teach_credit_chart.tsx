import { createMemo } from 'solid-js';
import { defineChart, lineY, areaY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip } from '@tanstack/charts/tooltip';
import { Chart } from '@tanstack/charts/solid';

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
    const chartDefinition = createMemo(() => {
        const data = props.data;
        if (data.length === 0) return null;

        return defineChart({
            marks: [
                areaY(data, {
                    id: 'teach-credits-area',
                    x: 'yearName',
                    y: 'totalCredit',
                    fill: '#6366f1',
                    fillOpacity: 0.15,
                }),
                lineY(data, {
                    id: 'teach-credits-line',
                    x: 'yearName',
                    y: 'totalCredit',
                    points: true,
                    stroke: '#6366f1',
                    strokeWidth: 3,
                }),
            ],
            x: {
                scale: () => scalePoint<string>().padding(0.25),
                axis: { label: 'Tahun Akademik' },
            },
            y: {
                scale: scaleLinear,
                nice: true,
                grid: true,
                axis: { label: 'Total SKS' },
            },
            tooltip,
        });
    });

    return (
        <div class="w-full">
            {chartDefinition() && (
                <Chart
                    definition={chartDefinition()!}
                    ariaLabel="Total Teaching Credits per Academic Year"
                    height={260}
                    class="w-full"
                />
            )}
        </div>
    );
}
