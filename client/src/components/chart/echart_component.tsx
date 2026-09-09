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
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let rafId: number | null = null;
    let mountTimer: ReturnType<typeof setTimeout> | null = null;

    const scheduleResize = () => {
        if (rafId !== null) {
            cancelAnimationFrame(rafId);
        }
        rafId = requestAnimationFrame(() => {
            rafId = null;
            if (!chartInstance || !containerRef) return;
            // Avoid resizing to 0x0 if container is hidden (e.g. inactive tab or display:none)
            if (containerRef.clientWidth === 0 && containerRef.clientHeight === 0) return;
            try {
                chartInstance.resize({
                    width: 'auto',
                    height: 'auto',
                    silent: true,
                });
            } catch (err) {
                console.warn('ECharts dynamic resize error:', err);
            }
        });
    };

    onMount(() => {
        if (!containerRef) return;

        const hasClientWidth = containerRef.clientWidth > 0;
        const hasClientHeight = containerRef.clientHeight > 0;

        const initOpts: echarts.InitOptions = {
            renderer: 'svg',
        };

        // If explicit numeric width/height was passed via props, respect it
        if (typeof props.width === 'number') {
            initOpts.width = props.width;
        } else if (!hasClientWidth) {
            // Fallback for headless/JSDOM environments or initially unmounted layouts
            initOpts.width = parseInt(String(props.width), 10) || 600;
        }

        if (typeof props.height === 'number') {
            initOpts.height = props.height;
        } else if (!hasClientHeight) {
            initOpts.height = parseInt(String(props.height), 10) || 240;
        }

        // Initialize ECharts with SVG renderer for crisp vector rendering and JSDOM test compatibility
        chartInstance = echarts.init(containerRef, null, initOpts);

        if (props.option && Object.keys(props.option).length > 0) {
            chartInstance.setOption(props.option, true);
        }

        // 1. Observe container box resizing (grid column changes, flex reflow, window resizing)
        if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver((entries) => {
                for (const entry of entries) {
                    if (entry.contentRect && (entry.contentRect.width > 0 || entry.contentRect.height > 0)) {
                        scheduleResize();
                    }
                }
            });
            resizeObserver.observe(containerRef);
        }

        // 2. Observe visibility changes (e.g. switching between tabs, accordions)
        if (typeof IntersectionObserver !== 'undefined') {
            intersectionObserver = new IntersectionObserver((entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        scheduleResize();
                    }
                }
            });
            intersectionObserver.observe(containerRef);
        }

        // 3. Listen to window resize and screen orientation changes
        const handleWindowResize = () => {
            scheduleResize();
        };
        window.addEventListener('resize', handleWindowResize, { passive: true });
        window.addEventListener('orientationchange', handleWindowResize, { passive: true });

        // 4. Trigger a post-mount resize after layout styles and web fonts settle
        mountTimer = setTimeout(() => {
            scheduleResize();
        }, 60);

        onCleanup(() => {
            if (mountTimer !== null) {
                clearTimeout(mountTimer);
                mountTimer = null;
            }
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
                rafId = null;
            }
            if (resizeObserver) {
                resizeObserver.disconnect();
                resizeObserver = null;
            }
            if (intersectionObserver) {
                intersectionObserver.disconnect();
                intersectionObserver = null;
            }
            window.removeEventListener('resize', handleWindowResize);
            window.removeEventListener('orientationchange', handleWindowResize);
            chartInstance?.dispose();
            chartInstance = null;
        });
    });

    createEffect(() => {
        const opt = props.option;
        if (chartInstance && opt && Object.keys(opt).length > 0) {
            chartInstance.setOption(opt, true);
            scheduleResize();
        }
    });

    return (
        <div
            ref={containerRef}
            class={`w-full min-w-0 ${props.class || ''}`}
            style={{
                height: typeof props.height === 'number' ? `${props.height}px` : (props.height || '260px'),
                width: typeof props.width === 'number' ? `${props.width}px` : (props.width || '100%'),
                'min-width': '0',
                position: 'relative',
            }}
            role="img"
            aria-label={props.ariaLabel || 'EChart visualization'}
        />
    );
}
