import { onMount, onCleanup, createEffect } from 'solid-js';
import * as echarts from 'echarts';

export interface EChartProps {
    option: echarts.EChartsOption;
    height?: number | string;
    width?: number | string;
    class?: string;
    ariaLabel?: string;
}

export default function EChart(props: EChartProps) {
    let containerRef: HTMLDivElement | undefined;
    let chartInstance: echarts.ECharts | null = null;

    onMount(() => {
        if (!containerRef) return;

        const initWidth = containerRef.clientWidth || (typeof props.width === 'number' ? props.width : (parseInt(String(props.width), 10) || 600));
        const initHeight = containerRef.clientHeight || (typeof props.height === 'number' ? props.height : (parseInt(String(props.height), 10) || 240));

        // Initialize ECharts with SVG renderer for crisp vector rendering and JSDOM test compatibility
        chartInstance = echarts.init(containerRef, null, {
            renderer: 'svg',
            width: initWidth,
            height: initHeight,
        });

        if (props.option && Object.keys(props.option).length > 0) {
            chartInstance.setOption(props.option, true);
        }

        let resizeObserver: ResizeObserver | null = null;
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver(() => {
                chartInstance?.resize();
            });
            resizeObserver.observe(containerRef);
        }

        const handleWindowResize = () => {
            chartInstance?.resize();
        };
        window.addEventListener('resize', handleWindowResize);

        onCleanup(() => {
            if (resizeObserver) {
                resizeObserver.disconnect();
            }
            window.removeEventListener('resize', handleWindowResize);
            chartInstance?.dispose();
            chartInstance = null;
        });
    });

    createEffect(() => {
        const opt = props.option;
        if (chartInstance && opt && Object.keys(opt).length > 0) {
            chartInstance.setOption(opt, true);
        }
    });

    return (
        <div
            ref={containerRef}
            class={props.class || 'w-full'}
            style={{
                height: typeof props.height === 'number' ? `${props.height}px` : (props.height || '260px'),
                width: typeof props.width === 'number' ? `${props.width}px` : (props.width || '100%'),
                position: 'relative',
            }}
            role="img"
            aria-label={props.ariaLabel || 'EChart visualization'}
        />
    );
}
