import { createMemo } from 'solid-js';
import { defineChart, lineY, areaY } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { tooltip } from '@tanstack/charts/tooltip';
import { Chart } from '@tanstack/charts/solid';

export interface AcademicTrendPoint {
    semName: string;
    ips: number;
    ipk: number;
    sks: number;
    totalSks: number;
}

export default function AcademicPerformanceChart(props: { data: AcademicTrendPoint[] }) {
    const chartDefinition = createMemo(() => {
        const data = props.data;
        if (data.length === 0) return null;

        return defineChart({
            marks: [
                areaY(data, {
                    id: 'ipk-area',
                    x: 'semName',
                    y: 'ipk',
                    fill: '#6366f1',
                    fillOpacity: 0.12,
                }),
                areaY(data, {
                    id: 'ips-area',
                    x: 'semName',
                    y: 'ips',
                    fill: '#0284c7',
                    fillOpacity: 0.08,
                }),
                lineY(data, {
                    id: 'ips-line',
                    x: 'semName',
                    y: 'ips',
                    points: true,
                    stroke: '#0284c7',
                    strokeWidth: 2.5,
                }),
                lineY(data, {
                    id: 'ipk-line',
                    x: 'semName',
                    y: 'ipk',
                    points: true,
                    stroke: '#6366f1',
                    strokeWidth: 2.5,
                }),
            ],
            x: {
                scale: () => scalePoint<string>().padding(0.2),
                axis: { label: 'Semester' },
            },
            y: {
                scale: () => scaleLinear().domain([0, 4]),
                nice: false,
                grid: true,
                axis: { label: 'GPA (0.0 - 4.0)' },
            },
            tooltip,
        });
    });

    return (
        <div class="w-full">
            {chartDefinition() && (
                <Chart
                    definition={chartDefinition()!}
                    ariaLabel="Academic Performance Trend - IPS and IPK by Semester"
                    height={220}
                    class="w-full"
                />
            )}
        </div>
    );
}
