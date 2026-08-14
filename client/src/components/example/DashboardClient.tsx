import { createSignal, createMemo, onMount, onCleanup } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { Chart } from '@tanstack/charts/solid';
import { defineChart, lineY, barY, dot } from '@tanstack/charts';
import { scaleLinear } from '@tanstack/charts/scales/linear';
import { scalePoint } from '@tanstack/charts/scales/point';
import { scaleBand } from '@tanstack/charts/scales/band';
import { tooltip } from '@tanstack/charts/tooltip';
import { pie, polar, radialArc, angleGrid, radialGrid, radialLine, radialBarAngle, radialDot } from '@tanstack/charts/polar';

import 'ol/ol.css';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSMSource from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Style from 'ol/style/Style';
import CircleStyle from 'ol/style/Circle';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';

// Data definitions
const lineChartData = [
    { month: 'Jan', Revenue: 65, Expenses: 28 },
    { month: 'Feb', Revenue: 59, Expenses: 48 },
    { month: 'Mar', Revenue: 80, Expenses: 40 },
    { month: 'Apr', Revenue: 81, Expenses: 19 },
    { month: 'May', Revenue: 56, Expenses: 86 },
    { month: 'Jun', Revenue: 55, Expenses: 27 },
    { month: 'Jul', Revenue: 40, Expenses: 90 },
];

const barChartData = [
    { quarter: 'Q1', Profit: 120 },
    { quarter: 'Q2', Profit: 190 },
    { quarter: 'Q3', Profit: 150 },
    { quarter: 'Q4', Profit: 220 },
];

const doughnutPieData = [
    { device: 'Desktop', percentage: 55, color: '#3b82f6' },
    { device: 'Mobile', percentage: 30, color: '#8b5cf6' },
    { device: 'Tablet', percentage: 15, color: '#ec4899' },
];
const pieData = [
    { channel: 'Organic', percentage: 40, color: '#f59e0b' },
    { channel: 'Direct', percentage: 25, color: '#10b981' },
    { channel: 'Referral', percentage: 20, color: '#3b82f6' },
    { channel: 'Social', percentage: 15, color: '#ef4444' },
];

const radarData = [
    { metric: 'Design', teamA: 65, teamB: 28 },
    { metric: 'Dev', teamA: 59, teamB: 48 },
    { metric: 'Marketing', teamA: 90, teamB: 40 },
    { metric: 'Sales', teamA: 81, teamB: 19 },
    { metric: 'Support', teamA: 56, teamB: 96 },
];

const polarAreaData = [
    { region: 'North', value: 11, color: 'rgba(248, 113, 113, 0.8)' },
    { region: 'East', value: 16, color: 'rgba(251, 191, 36, 0.8)' },
    { region: 'South', value: 7, color: 'rgba(52, 211, 153, 0.8)' },
    { region: 'West', value: 3, color: 'rgba(96, 165, 250, 0.8)' },
];

const bubbleData = [
    { x: 20, y: 30, r: 15 },
    { x: 40, y: 10, r: 10 },
    { x: 15, y: 37, r: 20 },
    { x: 32, y: 42, r: 12 },
    { x: 55, y: 25, r: 25 }
];

const scatterDataA = [
    { x: -10, y: 0, cluster: 'A' }, { x: 0, y: 10, cluster: 'A' }, { x: 10, y: 5, cluster: 'A' }, { x: 0.5, y: 5.5, cluster: 'A' }
];
const scatterDataB = [
    { x: 5, y: -5, cluster: 'B' }, { x: 15, y: 0, cluster: 'B' }, { x: 10, y: -10, cluster: 'B' }, { x: 12, y: -5, cluster: 'B' }
];
const scatterData = [...scatterDataA, ...scatterDataB];

export default function Dashboard() {
    let mapRef: HTMLDivElement | undefined;

    onMount(() => {
        if (mapRef) {
            const vectorSource = new VectorSource();
            const locations = [
                [-122.4194, 37.7749], // SF
                [-74.0060, 40.7128],  // NY
                [-0.1276, 51.5072],   // London
                [139.6917, 35.6895],  // Tokyo
                [151.2093, -33.8688]  // Sydney
            ];

            locations.forEach(coord => {
                vectorSource.addFeature(new Feature(new Point(fromLonLat(coord))));
            });

            const vectorLayer = new VectorLayer({
                source: vectorSource,
                style: new Style({
                    image: new CircleStyle({
                        radius: 8,
                        fill: new Fill({ color: '#f43f5e' }),
                        stroke: new Stroke({ color: '#ffffff', width: 2 })
                    })
                })
            });

            const map = new Map({
                target: mapRef,
                layers: [
                    new TileLayer({
                        source: new OSMSource()
                    }),
                    vectorLayer
                ],
                view: new View({
                    center: fromLonLat([0, 20]),
                    zoom: 2
                })
            });
        }
    });

    const lineChartDef = createMemo(() => defineChart({
        marks: [
            lineY(lineChartData, {
                id: 'Revenue',
                x: 'month',
                y: 'Revenue',
                points: true,
                stroke: '#3b82f6',
            }),
            lineY(lineChartData, {
                id: 'Expenses',
                x: 'month',
                y: 'Expenses',
                points: true,
                stroke: '#ef4444',
            })
        ],
        x: {
            scale: () => scalePoint<string>().padding(0.2),
        },
        y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
        },
        tooltip,
    }));

    const barChartDef = createMemo(() => defineChart({
        marks: [
            barY(barChartData, {
                x: 'quarter',
                y: 'Profit',
                fill: '#10b981'
            })
        ],
        x: {
            scale: () => scaleBand<string>().padding(0.16),
        },
        y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
        },
        tooltip,
    }));

    const doughnutSlices = pie(doughnutPieData, { value: 'percentage' });
    const doughnutChartDef = createMemo(() => defineChart({
        marks: [
            polar({
                radiusRatio: 0.82,
                marks: [
                    radialArc(doughnutSlices, {
                        innerRadius: ({ radius }) => radius * 0.58,
                        cornerRadius: 0,
                        color: 'device',
                        key: 'device',
                    })
                ]
            })
        ],
        color: {
            domain: doughnutPieData.map(d => d.device),
            range: doughnutPieData.map(d => d.color),
        },
        tooltip,
    }));

    const pieSlices = pie(pieData, { value: 'percentage' });
    const pieChartDef = createMemo(() => defineChart({
        marks: [
            polar({
                radiusRatio: 0.82,
                marks: [
                    radialArc(pieSlices, {
                        innerRadius: () => 0, // pie chart
                        cornerRadius: 0,
                        color: 'channel',
                        key: 'channel',
                    })
                ]
            })
        ],
        color: {
            domain: pieData.map(d => d.channel),
            range: pieData.map(d => d.color),
        },
        tooltip,
    }));

    const radarChartDef = createMemo(() => defineChart({
        marks: [
            polar({
                radiusRatio: 0.72,
                angle: { scale: scalePoint<string>().domain(radarData.map(d => d.metric)), wrap: true },
                radius: { scale: scaleLinear().domain([0, 100]) },
                guides: [
                    radialGrid({ values: [20, 40, 60, 80, 100], shape: 'polygon' }),
                    angleGrid({ labels: true }),
                ],
                marks: [
                    radialLine(radarData, {
                        angle: 'metric',
                        radius: 'teamA',
                        stroke: '#3b82f6',
                        strokeWidth: 2,
                    }),
                    radialLine(radarData, {
                        angle: 'metric',
                        radius: 'teamB',
                        stroke: '#ef4444',
                        strokeWidth: 2,
                    })
                ]
            })
        ],
        tooltip,
    }));

    const polarAreaChartDef = createMemo(() => defineChart({
        marks: [
            polar({
                radiusRatio: 0.8,
                angle: { scale: () => scaleBand<string>().padding(0) },
                radius: { scale: scaleLinear().domain([0, 20]) },
                guides: [
                    radialGrid({ values: [5, 10, 15, 20], shape: 'circle' }),
                    angleGrid({ labels: true }),
                ],
                marks: [
                    radialBarAngle(polarAreaData, {
                        angle: 'region',
                        radius: 'value',
                        color: 'region',
                        key: 'region',
                    })
                ]
            })
        ],
        color: {
            domain: polarAreaData.map(d => d.region),
            range: polarAreaData.map(d => d.color),
        },
        tooltip,
    }));

    const bubbleChartDef = createMemo(() => defineChart({
        marks: [
            dot(bubbleData, {
                x: 'x',
                y: 'y',
                r: 'r', // Use data's radius
                fill: 'rgba(139, 92, 246, 0.6)',
                stroke: '#8b5cf6',
            })
        ],
        x: {
            scale: scaleLinear,
            nice: true,
            grid: true,
        },
        y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
        },
        tooltip,
    }));

    const scatterChartDef = createMemo(() => defineChart({
        marks: [
            dot(scatterData, {
                x: 'x',
                y: 'y',
                fill: 'cluster',
                r: 4
            })
        ],
        x: {
            scale: scaleLinear,
            nice: true,
            grid: true,
        },
        y: {
            scale: scaleLinear,
            nice: true,
            grid: true,
        },
        color: {
            domain: ['A', 'B'],
            range: ['#f43f5e', '#0ea5e9']
        },
        tooltip,
    }));

    return (
        <>
            <TopBar />
            <div class="mx-auto px-4 py-8">
                <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 class="text-2xl font-bold text-neutral-900 dark:text-white">Dashboard Overview</h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Here's what's happening with your projects today.</p>
                    </div>
                    <div>
                        <button class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 text-sm font-medium transition-colors shadow-sm rounded-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900">
                            Download Report
                        </button>
                    </div>
                </div>

                {/* Stats Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { title: 'Total Revenue', value: '$45,231.89', change: '+20.1%', positive: true },
                        { title: 'Subscriptions', value: '+2,350', change: '+180.1%', positive: true },
                        { title: 'Sales', value: '+12,234', change: '+19%', positive: true },
                        { title: 'Active Now', value: '+573', change: '-201', positive: false }
                    ].map(stat => (
                        <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm flex flex-col">
                            <span class="text-sm font-medium text-neutral-500 dark:text-neutral-400">{stat.title}</span>
                            <div class="mt-2 flex items-baseline gap-2">
                                <span class="text-2xl font-bold text-neutral-900 dark:text-white">{stat.value}</span>
                                <span class={`text-xs font-medium ${stat.positive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {stat.change}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Main Large Chart */}
                <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm mb-8">
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Revenue vs Expenses (Line)</h2>
                    <div class="w-full h-[400px]">
                        <Chart definition={lineChartDef()} ariaLabel="Revenue vs Expenses Line Chart" />
                    </div>
                </div>

                {/* Map Section */}
                <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm mb-8">
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Global User Distribution (Map)</h2>
                    <div class="w-full h-[800px] border border-neutral-200 dark:border-neutral-700 rounded-none overflow-hidden">
                        <div ref={mapRef} style="height: 100%; width: 100%;"></div>
                    </div>
                </div>

                {/* All other charts in a grid */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">

                    {/* Bar Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Quarterly Profit (Bar)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={barChartDef()} ariaLabel="Quarterly Profit Bar Chart" />
                        </div>
                    </div>

                    {/* Doughnut Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Device Traffic (Doughnut)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={doughnutChartDef()} ariaLabel="Device Traffic Doughnut Chart" />
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Acquisition Channels (Pie)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={pieChartDef()} ariaLabel="Acquisition Channels Pie Chart" />
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Team Performance (Radar)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={radarChartDef()} ariaLabel="Team Performance Radar Chart" />
                        </div>
                    </div>

                    {/* Polar Area Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Regional Sales (Polar Area)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={polarAreaChartDef()} ariaLabel="Regional Sales Polar Area Chart" />
                        </div>
                    </div>

                    {/* Bubble Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Product Usage (Bubble)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={bubbleChartDef()} ariaLabel="Product Usage Bubble Chart" />
                        </div>
                    </div>

                    {/* Scatter Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm md:col-span-1 lg:col-span-2">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Data Clusters (Scatter)</h2>
                        <div class="w-full h-[300px]">
                            <Chart definition={scatterChartDef()} ariaLabel="Data Clusters Scatter Chart" />
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}
