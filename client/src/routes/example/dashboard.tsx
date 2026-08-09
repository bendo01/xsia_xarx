import { createSignal, onMount, onCleanup } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { Chart, registerables } from 'chart.js';
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
export default function Dashboard() {
    let lineChartRef: HTMLCanvasElement | undefined;
    let barChartRef: HTMLCanvasElement | undefined;
    let doughnutChartRef: HTMLCanvasElement | undefined;
    let pieChartRef: HTMLCanvasElement | undefined;
    let radarChartRef: HTMLCanvasElement | undefined;
    let polarChartRef: HTMLCanvasElement | undefined;
    let bubbleChartRef: HTMLCanvasElement | undefined;
    let scatterChartRef: HTMLCanvasElement | undefined;
    let mapRef: HTMLDivElement | undefined;

    let lineChartInstance: Chart | undefined;
    let barChartInstance: Chart | undefined;
    let doughnutChartInstance: Chart | undefined;
    let pieChartInstance: Chart | undefined;
    let radarChartInstance: Chart | undefined;
    let polarChartInstance: Chart | undefined;
    let bubbleChartInstance: Chart | undefined;
    let scatterChartInstance: Chart | undefined;

    onMount(() => {
        Chart.register(...registerables);

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

        // Common Options
        const commonOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#737373' } }
            },
            scales: {
                y: {
                    grid: { color: 'rgba(163, 163, 163, 0.1)' },
                    ticks: { color: '#737373' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#737373' }
                }
            }
        };

        const noScaleOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#737373' } }
            }
        };

        const radialScaleOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { labels: { color: '#737373' } }
            },
            scales: {
                r: {
                    grid: { color: 'rgba(163, 163, 163, 0.2)' },
                    pointLabels: { color: '#737373' },
                    ticks: { backdropColor: 'transparent', color: '#737373' }
                }
            }
        };

        // 1. Line Chart
        if (lineChartRef) {
            lineChartInstance = new Chart(lineChartRef, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
                    datasets: [
                        {
                            label: 'Revenue',
                            data: [65, 59, 80, 81, 56, 55, 40],
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        },
                        {
                            label: 'Expenses',
                            data: [28, 48, 40, 19, 86, 27, 90],
                            borderColor: '#ef4444',
                            backgroundColor: 'rgba(239, 68, 68, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.4
                        }
                    ]
                },
                options: commonOptions
            });
        }

        // 2. Bar Chart
        if (barChartRef) {
            barChartInstance = new Chart(barChartRef, {
                type: 'bar',
                data: {
                    labels: ['Q1', 'Q2', 'Q3', 'Q4'],
                    datasets: [{
                        label: 'Profit',
                        data: [120, 190, 150, 220],
                        backgroundColor: '#10b981', // green-500
                        borderRadius: 4
                    }]
                },
                options: commonOptions
            });
        }

        // 3. Doughnut Chart
        if (doughnutChartRef) {
            doughnutChartInstance = new Chart(doughnutChartRef, {
                type: 'doughnut',
                data: {
                    labels: ['Desktop', 'Mobile', 'Tablet'],
                    datasets: [{
                        data: [55, 30, 15],
                        backgroundColor: ['#3b82f6', '#8b5cf6', '#ec4899'],
                        borderWidth: 0
                    }]
                },
                options: noScaleOptions
            });
        }

        // 4. Pie Chart
        if (pieChartRef) {
            pieChartInstance = new Chart(pieChartRef, {
                type: 'pie',
                data: {
                    labels: ['Organic', 'Direct', 'Referral', 'Social'],
                    datasets: [{
                        data: [40, 25, 20, 15],
                        backgroundColor: ['#f59e0b', '#10b981', '#3b82f6', '#ef4444'],
                        borderWidth: 0
                    }]
                },
                options: noScaleOptions
            });
        }

        // 5. Radar Chart
        if (radarChartRef) {
            radarChartInstance = new Chart(radarChartRef, {
                type: 'radar',
                data: {
                    labels: ['Design', 'Dev', 'Marketing', 'Sales', 'Support'],
                    datasets: [{
                        label: 'Team A',
                        data: [65, 59, 90, 81, 56],
                        backgroundColor: 'rgba(59, 130, 246, 0.2)',
                        borderColor: '#3b82f6',
                        pointBackgroundColor: '#3b82f6'
                    }, {
                        label: 'Team B',
                        data: [28, 48, 40, 19, 96],
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        borderColor: '#ef4444',
                        pointBackgroundColor: '#ef4444'
                    }]
                },
                options: radialScaleOptions
            });
        }

        // 6. Polar Area Chart
        if (polarChartRef) {
            polarChartInstance = new Chart(polarChartRef, {
                type: 'polarArea',
                data: {
                    labels: ['North', 'East', 'South', 'West'],
                    datasets: [{
                        data: [11, 16, 7, 3],
                        backgroundColor: [
                            'rgba(248, 113, 113, 0.8)',
                            'rgba(251, 191, 36, 0.8)',
                            'rgba(52, 211, 153, 0.8)',
                            'rgba(96, 165, 250, 0.8)'
                        ],
                        borderWidth: 0
                    }]
                },
                options: radialScaleOptions
            });
        }

        // 7. Bubble Chart
        if (bubbleChartRef) {
            bubbleChartInstance = new Chart(bubbleChartRef, {
                type: 'bubble',
                data: {
                    datasets: [{
                        label: 'Product Usage',
                        data: [
                            { x: 20, y: 30, r: 15 },
                            { x: 40, y: 10, r: 10 },
                            { x: 15, y: 37, r: 20 },
                            { x: 32, y: 42, r: 12 },
                            { x: 55, y: 25, r: 25 }
                        ],
                        backgroundColor: 'rgba(139, 92, 246, 0.6)', // violet-500
                        borderColor: '#8b5cf6'
                    }]
                },
                options: commonOptions
            });
        }

        // 8. Scatter Chart
        if (scatterChartRef) {
            scatterChartInstance = new Chart(scatterChartRef, {
                type: 'scatter',
                data: {
                    datasets: [{
                        label: 'Cluster A',
                        data: [
                            { x: -10, y: 0 }, { x: 0, y: 10 }, { x: 10, y: 5 }, { x: 0.5, y: 5.5 }
                        ],
                        backgroundColor: '#f43f5e' // rose-500
                    }, {
                        label: 'Cluster B',
                        data: [
                            { x: 5, y: -5 }, { x: 15, y: 0 }, { x: 10, y: -10 }, { x: 12, y: -5 }
                        ],
                        backgroundColor: '#0ea5e9' // sky-500
                    }]
                },
                options: commonOptions
            });
        }
    });

    onCleanup(() => {
        if (lineChartInstance) lineChartInstance.destroy();
        if (barChartInstance) barChartInstance.destroy();
        if (doughnutChartInstance) doughnutChartInstance.destroy();
        if (pieChartInstance) pieChartInstance.destroy();
        if (radarChartInstance) radarChartInstance.destroy();
        if (polarChartInstance) polarChartInstance.destroy();
        if (bubbleChartInstance) bubbleChartInstance.destroy();
        if (scatterChartInstance) scatterChartInstance.destroy();
    });

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
                        <canvas ref={lineChartRef}></canvas>
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
                            <canvas ref={barChartRef}></canvas>
                        </div>
                    </div>

                    {/* Doughnut Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Device Traffic (Doughnut)</h2>
                        <div class="w-full h-[300px]">
                            <canvas ref={doughnutChartRef}></canvas>
                        </div>
                    </div>

                    {/* Pie Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Acquisition Channels (Pie)</h2>
                        <div class="w-full h-[300px]">
                            <canvas ref={pieChartRef}></canvas>
                        </div>
                    </div>

                    {/* Radar Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Team Performance (Radar)</h2>
                        <div class="w-full h-[300px]">
                            <canvas ref={radarChartRef}></canvas>
                        </div>
                    </div>

                    {/* Polar Area Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Regional Sales (Polar Area)</h2>
                        <div class="w-full h-[300px]">
                            <canvas ref={polarChartRef}></canvas>
                        </div>
                    </div>

                    {/* Bubble Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Product Usage (Bubble)</h2>
                        <div class="w-full h-[300px]">
                            <canvas ref={bubbleChartRef}></canvas>
                        </div>
                    </div>

                    {/* Scatter Chart */}
                    <div class="bg-white dark:bg-neutral-800 p-6 border border-neutral-200 dark:border-neutral-700 rounded-none shadow-sm md:col-span-1 lg:col-span-2">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-6">Data Clusters (Scatter)</h2>
                        <div class="w-full h-[300px]">
                            <canvas ref={scatterChartRef}></canvas>
                        </div>
                    </div>

                </div>
            </div>
        </>
    );
}