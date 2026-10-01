import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex, getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';
import EChart from '~/components/chart/echart_component';

interface ProdiUnit {
    id: string;
    name: string;
    code?: string;
    is_active: boolean;
    unit_type?: { name: string };
    parent?: { name: string };
    institution_id?: string;
    education?: { name: string };
}

interface ProdiDashboard {
    unitId: string;
    unitName: string;
    unitCode?: string;
    education?: string;
    parent?: string;
    is_active: boolean;
    total_curriculum?: number;
    matakuliah?: { total_matakuliah: number; total_credit: number };
    student_academic_year_chart?: any;
    course_category_distribution?: any;
    average_gpa_trend?: any;
    lecturer_academic_group_distribution?: any;
    lecturer_academic_rank_distribution?: any;
    totalStudents?: number;
    latestGpa?: number;
}

function extractTotalStudents(dash: any): number {
    try {
        const chart = dash?.student_academic_year_chart;
        if (!chart) return 0;
        const series = chart?.series;
        if (!Array.isArray(series)) return 0;
        let total = 0;
        for (const s of series) {
            if (Array.isArray(s.data)) {
                for (const v of s.data) {
                    const n = typeof v === 'number' ? v : (v?.value ?? 0);
                    total += n;
                }
            }
        }
        return total;
    } catch { return 0; }
}

function extractLatestGpa(dash: any): number {
    try {
        const chart = dash?.average_gpa_trend;
        if (!chart) return 0;
        const series = chart?.series;
        if (!Array.isArray(series) || series.length === 0) return 0;
        const data = series[0]?.data;
        if (!Array.isArray(data) || data.length === 0) return 0;
        const last = data[data.length - 1];
        return typeof last === 'number' ? last : (last?.value ?? 0);
    } catch { return 0; }
}

export default function RectoratInstitutionDashboard() {
    const params = useParams();
    const institutionId = () => params.id;

    const [prodiUnits, setProdiUnits] = createSignal<ProdiUnit[]>([]);
    const [dashboards, setDashboards] = createSignal<ProdiDashboard[]>([]);
    const [isLoadingUnits, setIsLoadingUnits] = createSignal(true);
    const [loadedCount, setLoadedCount] = createSignal(0);
    const [totalToLoad, setTotalToLoad] = createSignal(0);
    const [selectedProdiId, setSelectedProdiId] = createSignal<string | null>(null);
    const [institutionName, setInstitutionName] = createSignal('');
    const [searchQuery, setSearchQuery] = createSignal('');

    const fetchProdiUnits = async () => {
        const instId = institutionId();
        if (!instId || instId === '[id]') return;
        setIsLoadingUnits(true);
        setDashboards([]);
        setLoadedCount(0);
        try {
            const res = await masterApiIndex<ProdiUnit>('institution/master/units', {
                page: 1, per_page: 200,
                institution_id: instId,
                with_relations: true,
            });
            const all: ProdiUnit[] = res.data ?? [];
            const prodi = all.filter((u) => {
                const t = (u.unit_type?.name ?? '').toLowerCase();
                return t.includes('program studi') || t.includes('prodi') || t.includes('jurusan') || t.includes('department');
            });
            setProdiUnits(prodi);
            setTotalToLoad(prodi.length);
            if (all.length > 0) {
                setInstitutionName((all[0] as any)?.institution?.name || '');
            }

            const loadDash = async (unit: ProdiUnit): Promise<ProdiDashboard> => {
                try {
                    const url = `${getBaseApiUrl()}/institution/master/units/${encodeURIComponent(unit.id)}/dashboard`;
                    const resp = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
                    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
                    const json = await resp.json();
                    const d = json.data ?? json;
                    return {
                        unitId: unit.id, unitName: unit.name || '-', unitCode: unit.code,
                        education: unit.education?.name, parent: unit.parent?.name,
                        is_active: unit.is_active,
                        total_curriculum: d.total_curriculum, matakuliah: d.matakuliah,
                        student_academic_year_chart: d.student_academic_year_chart,
                        course_category_distribution: d.course_category_distribution,
                        average_gpa_trend: d.average_gpa_trend,
                        lecturer_academic_group_distribution: d.lecturer_academic_group_distribution,
                        lecturer_academic_rank_distribution: d.lecturer_academic_rank_distribution,
                        totalStudents: extractTotalStudents(d), latestGpa: extractLatestGpa(d),
                    };
                } catch {
                    return { unitId: unit.id, unitName: unit.name || '-', unitCode: unit.code, is_active: unit.is_active, totalStudents: 0, latestGpa: 0 };
                } finally {
                    setLoadedCount((c) => c + 1);
                }
            };

            const results: ProdiDashboard[] = [];
            const batchSize = 4;
            for (let i = 0; i < prodi.length; i += batchSize) {
                const batch = prodi.slice(i, i + batchSize);
                const batchResults = await Promise.all(batch.map(loadDash));
                results.push(...batchResults);
                setDashboards([...results]);
            }
            setDashboards(results);
            if (results.length > 0 && !selectedProdiId()) setSelectedProdiId(results[0].unitId);
        } catch (error) {
            console.error('Error loading prodi units:', error);
            toast.danger('Gagal memuat data program studi.');
        } finally {
            setIsLoadingUnits(false);
        }
    };

    onMount(() => { fetchProdiUnits(); });

    const filteredDashboards = createMemo(() => {
        const q = searchQuery().toLowerCase();
        return dashboards().filter((d) => !q || d.unitName.toLowerCase().includes(q) || (d.unitCode ?? '').toLowerCase().includes(q));
    });

    const selectedDash = createMemo(() => dashboards().find((d) => d.unitId === selectedProdiId()) ?? null);

    const isDark = () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark');

    const studentsBarOption = createMemo((): any => {
        const data = filteredDashboards();
        if (data.length === 0) return {};
        const sorted = [...data].sort((a, b) => (b.totalStudents ?? 0) - (a.totalStudents ?? 0));
        const dark = isDark();
        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: 16, right: 16, top: 10, bottom: 60, containLabel: true },
            xAxis: { type: 'category', data: sorted.map((d) => d.unitCode || d.unitName), axisLabel: { rotate: 30, fontSize: 11, color: dark ? '#a3a3a3' : '#525252' }, axisLine: { lineStyle: { color: dark ? '#404040' : '#e5e5e5' } } },
            yAxis: { type: 'value', name: 'Mahasiswa', nameTextStyle: { fontSize: 11, color: dark ? '#a3a3a3' : '#737373' }, axisLabel: { color: dark ? '#a3a3a3' : '#525252' }, splitLine: { lineStyle: { color: dark ? '#262626' : '#f5f5f5' } } },
            series: [{ type: 'bar', barMaxWidth: 50, label: { show: true, position: 'top', fontSize: 11, fontWeight: 'bold', color: dark ? '#e5e5e5' : '#171717' }, data: sorted.map((d) => ({ value: d.totalStudents ?? 0, itemStyle: { borderRadius: [6, 6, 0, 0], color: d.is_active ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#1d4ed8' }] } : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a3a3a3' }, { offset: 1, color: '#737373' }] } } })) }],
        };
    });

    const coursesBarOption = createMemo((): any => {
        const data = filteredDashboards();
        if (data.length === 0) return {};
        const sorted = [...data].sort((a, b) => (b.matakuliah?.total_matakuliah ?? 0) - (a.matakuliah?.total_matakuliah ?? 0));
        const dark = isDark();
        const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', '#7c3aed', '#6d28d9'];
        return {
            tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
            grid: { left: 16, right: 16, top: 10, bottom: 60, containLabel: true },
            xAxis: { type: 'category', data: sorted.map((d) => d.unitCode || d.unitName), axisLabel: { rotate: 30, fontSize: 11, color: dark ? '#a3a3a3' : '#525252' }, axisLine: { lineStyle: { color: dark ? '#404040' : '#e5e5e5' } } },
            yAxis: { type: 'value', name: 'Matakuliah', nameTextStyle: { fontSize: 11, color: dark ? '#a3a3a3' : '#737373' }, axisLabel: { color: dark ? '#a3a3a3' : '#525252' }, splitLine: { lineStyle: { color: dark ? '#262626' : '#f5f5f5' } } },
            series: [{ type: 'bar', barMaxWidth: 50, label: { show: true, position: 'top', fontSize: 11, fontWeight: 'bold', color: dark ? '#e5e5e5' : '#171717' }, data: sorted.map((d, i) => ({ value: d.matakuliah?.total_matakuliah ?? 0, itemStyle: { borderRadius: [6, 6, 0, 0], color: colors[i % colors.length] } })) }],
        };
    });

    const studentsPieOption = createMemo((): any => {
        const data = filteredDashboards().filter((d) => (d.totalStudents ?? 0) > 0);
        if (data.length === 0) return {};
        const dark = isDark();
        const palette = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1'];
        return {
            tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center', textStyle: { fontSize: 11, color: dark ? '#a3a3a3' : '#525252' }, itemWidth: 12, itemHeight: 12 },
            series: [{ type: 'pie', radius: ['40%', '70%'], center: ['38%', '50%'], avoidLabelOverlap: true, itemStyle: { borderRadius: 6, borderColor: dark ? '#171717' : '#ffffff', borderWidth: 2 }, label: { show: false }, emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } }, data: data.map((d, i) => ({ name: d.unitCode || d.unitName, value: d.totalStudents, itemStyle: { color: palette[i % palette.length] } })) }],
        };
    });

    const gpaBarOption = createMemo((): any => {
        const data = filteredDashboards().filter((d) => (d.latestGpa ?? 0) > 0);
        if (data.length === 0) return {};
        const sorted = [...data].sort((a, b) => (b.latestGpa ?? 0) - (a.latestGpa ?? 0));
        const dark = isDark();
        return {
            tooltip: { trigger: 'axis', formatter: (p: any) => `${p[0].name}<br/>IPK: <b>${(+p[0].value).toFixed(2)}</b>` },
            grid: { left: 16, right: 16, top: 10, bottom: 60, containLabel: true },
            xAxis: { type: 'category', data: sorted.map((d) => d.unitCode || d.unitName), axisLabel: { rotate: 30, fontSize: 11, color: dark ? '#a3a3a3' : '#525252' }, axisLine: { lineStyle: { color: dark ? '#404040' : '#e5e5e5' } } },
            yAxis: { type: 'value', min: 0, max: 4, name: 'IPK', nameTextStyle: { fontSize: 11, color: dark ? '#a3a3a3' : '#737373' }, axisLabel: { color: dark ? '#a3a3a3' : '#525252' }, splitLine: { lineStyle: { color: dark ? '#262626' : '#f5f5f5' } } },
            series: [{ type: 'bar', barMaxWidth: 50, label: { show: true, position: 'top', fontSize: 11, fontWeight: 'bold', formatter: (p: any) => (+p.value).toFixed(2), color: dark ? '#e5e5e5' : '#171717' }, markLine: { data: [{ yAxis: 3.0, name: 'Min Baik', lineStyle: { color: '#f59e0b', type: 'dashed' }, label: { show: true, formatter: 'Min 3.0' } }] }, data: sorted.map((d) => ({ value: +(d.latestGpa ?? 0).toFixed(2), itemStyle: { borderRadius: [6, 6, 0, 0], color: (d.latestGpa ?? 0) >= 3.5 ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#10b981' }, { offset: 1, color: '#059669' }] } : (d.latestGpa ?? 0) >= 3.0 ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#f59e0b' }, { offset: 1, color: '#d97706' }] } : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#ef4444' }, { offset: 1, color: '#dc2626' }] } } })) }],
        };
    });

    const stats = createMemo(() => {
        const d = dashboards();
        const totalStudents = d.reduce((s, x) => s + (x.totalStudents ?? 0), 0);
        const totalCourses = d.reduce((s, x) => s + (x.matakuliah?.total_matakuliah ?? 0), 0);
        const totalCredits = d.reduce((s, x) => s + (x.matakuliah?.total_credit ?? 0), 0);
        const gpas = d.filter((x) => (x.latestGpa ?? 0) > 0).map((x) => x.latestGpa ?? 0);
        const avgGpa = gpas.length > 0 ? gpas.reduce((s, g) => s + g, 0) / gpas.length : 0;
        const activeCount = d.filter((x) => x.is_active).length;
        return { totalStudents, totalCourses, totalCredits, avgGpa, activeCount, total: d.length };
    });

    const kpiCards = [
        { label: 'Total Prodi', icon: '🏛️', val: () => String(stats().total), sub: () => `${stats().activeCount} aktif` },
        { label: 'Total Mahasiswa', icon: '🎓', val: () => stats().totalStudents.toLocaleString('id-ID'), sub: () => 'semua prodi' },
        { label: 'Total Matakuliah', icon: '📚', val: () => String(stats().totalCourses), sub: () => 'seluruh kurikulum' },
        { label: 'Total SKS', icon: '🧮', val: () => String(stats().totalCredits), sub: () => 'seluruh prodi' },
        { label: 'Rata-rata IPK', icon: '📊', val: () => stats().avgGpa > 0 ? stats().avgGpa.toFixed(2) : '—', sub: () => 'terkini' },
        { label: 'Prodi Aktif', icon: '✅', val: () => String(stats().activeCount), sub: () => `dari ${stats().total} prodi` },
    ];

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
            <TopBar />
            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Hero Header */}
                <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 p-8 shadow-xl text-white">
                    <div class="absolute inset-0 overflow-hidden pointer-events-none">
                        <div class="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl" />
                        <div class="absolute bottom-0 left-20 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
                    </div>
                    <div class="relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
                                <span class="relative flex size-2">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                    <span class="relative inline-flex rounded-full size-2 bg-blue-400" />
                                </span>
                                Executive Dashboard · Rektorat
                            </div>
                            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">Dashboard Institusi</h1>
                            <Show when={institutionName()}>
                                <p class="mt-1 text-blue-200 font-semibold text-lg">{institutionName()}</p>
                            </Show>
                            <p class="mt-2 text-sm text-blue-300/80 max-w-xl">
                                Ringkasan seluruh Program Studi — statistik mahasiswa, kurikulum, IPK, dan distribusi matakuliah.
                            </p>
                        </div>
                        <div class="text-right shrink-0">
                            <div class="text-4xl font-black tabular-nums">{prodiUnits().length}</div>
                            <div class="text-xs text-blue-300 font-medium uppercase tracking-wide">Program Studi</div>
                        </div>
                    </div>
                </div>

                {/* Loading Progress */}
                <Show when={isLoadingUnits() || (totalToLoad() > 0 && loadedCount() < totalToLoad())}>
                    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6">
                        <div class="flex items-center justify-between mb-3">
                            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                                {isLoadingUnits() ? 'Memuat daftar program studi…' : `Memuat data: ${loadedCount()} / ${totalToLoad()} prodi`}
                            </span>
                            <span class="text-xs text-neutral-500 font-mono">
                                {totalToLoad() > 0 ? `${Math.round((loadedCount() / totalToLoad()) * 100)}%` : '…'}
                            </span>
                        </div>
                        <div class="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <div class="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-300"
                                style={{ width: totalToLoad() > 0 ? `${(loadedCount() / totalToLoad()) * 100}%` : '0%' }} />
                        </div>
                        <div class="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 animate-pulse">
                            <For each={Array.from({ length: 4 })}>
                                {() => <div class="h-20 rounded-xl bg-neutral-100 dark:bg-neutral-800" />}
                            </For>
                        </div>
                    </div>
                </Show>

                {/* Main Content */}
                <Show when={dashboards().length > 0}>

                    {/* KPI Cards */}
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <For each={kpiCards}>
                            {(kpi) => (
                                <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-4 hover:shadow-md transition-shadow">
                                    <div class="text-2xl mb-1">{kpi.icon}</div>
                                    <div class="text-2xl font-black text-neutral-900 dark:text-white tabular-nums">{kpi.val()}</div>
                                    <div class="text-xs font-bold text-neutral-700 dark:text-neutral-300 mt-0.5">{kpi.label}</div>
                                    <div class="text-xs text-neutral-400 dark:text-neutral-500">{kpi.sub()}</div>
                                </div>
                            )}
                        </For>
                    </div>

                    {/* Aggregate Charts */}
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full bg-blue-500" />Jumlah Mahasiswa per Prodi
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Akumulasi seluruh tahun akademik</p>
                            <div class="h-72"><EChart option={studentsBarOption()} height="100%" width="100%" /></div>
                        </div>

                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full bg-indigo-500" />Distribusi Mahasiswa
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Proporsi mahasiswa antar program studi</p>
                            <div class="h-72"><EChart option={studentsPieOption()} height="100%" width="100%" /></div>
                        </div>

                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                <span class="w-3 h-3 rounded-full bg-violet-500" />Jumlah Matakuliah per Prodi
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Total matakuliah aktif dalam kurikulum</p>
                            <div class="h-72"><EChart option={coursesBarOption()} height="100%" width="100%" /></div>
                        </div>

                        <Show when={dashboards().some((d) => (d.latestGpa ?? 0) > 0)}>
                            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                    <span class="w-3 h-3 rounded-full bg-emerald-500" />Rata-rata IPK per Prodi
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">IPK terakhir tercatat per program studi</p>
                                <div class="h-72"><EChart option={gpaBarOption()} height="100%" width="100%" /></div>
                            </div>
                        </Show>
                    </div>

                    {/* Prodi Summary Table */}
                    <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">Ringkasan Semua Program Studi</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Klik baris untuk melihat detail dashboard per prodi</p>
                            </div>
                            <div class="relative w-full sm:w-64">
                                <svg class="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400 pointer-events-none" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                                <input type="text" placeholder="Cari prodi…"
                                    class="w-full pl-10 pr-4 py-2 text-sm bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                    onInput={(e) => setSearchQuery((e.target as HTMLInputElement).value)} />
                            </div>
                        </div>
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-100 dark:border-neutral-800">
                                    <tr>
                                        <th class="px-6 py-3">Kode</th>
                                        <th class="px-6 py-3">Program Studi</th>
                                        <th class="px-6 py-3">Jenjang</th>
                                        <th class="px-6 py-3 text-right">Mahasiswa</th>
                                        <th class="px-6 py-3 text-right">MK</th>
                                        <th class="px-6 py-3 text-right">SKS</th>
                                        <th class="px-6 py-3 text-right">IPK</th>
                                        <th class="px-6 py-3 text-center">Status</th>
                                        <th class="px-6 py-3 text-right">Detail</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <For each={filteredDashboards()}>
                                        {(d) => (
                                            <tr class={`group cursor-pointer transition-colors ${selectedProdiId() === d.unitId ? 'bg-blue-50 dark:bg-blue-950/30' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/40'}`}
                                                onClick={() => setSelectedProdiId(d.unitId)}>
                                                <td class="px-6 py-4 font-mono text-xs font-semibold text-neutral-500 dark:text-neutral-400 whitespace-nowrap">{d.unitCode || '—'}</td>
                                                <td class="px-6 py-4 font-semibold text-neutral-900 dark:text-white max-w-xs">
                                                    <div class="line-clamp-1">{d.unitName}</div>
                                                    <Show when={d.parent}>
                                                        <div class="text-xs text-neutral-400 dark:text-neutral-500 font-normal mt-0.5">{d.parent}</div>
                                                    </Show>
                                                </td>
                                                <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300 whitespace-nowrap">{d.education || '—'}</td>
                                                <td class="px-6 py-4 text-right font-bold text-neutral-900 dark:text-white tabular-nums">{(d.totalStudents ?? 0).toLocaleString('id-ID')}</td>
                                                <td class="px-6 py-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">{d.matakuliah?.total_matakuliah ?? '—'}</td>
                                                <td class="px-6 py-4 text-right tabular-nums text-neutral-700 dark:text-neutral-300">{d.matakuliah?.total_credit ?? '—'}</td>
                                                <td class="px-6 py-4 text-right">
                                                    <Show when={(d.latestGpa ?? 0) > 0} fallback={<span class="text-neutral-400">—</span>}>
                                                        <span class={`font-bold tabular-nums ${(d.latestGpa ?? 0) >= 3.5 ? 'text-emerald-600 dark:text-emerald-400' : (d.latestGpa ?? 0) >= 3.0 ? 'text-amber-600 dark:text-amber-400' : 'text-red-500'}`}>
                                                            {(d.latestGpa ?? 0).toFixed(2)}
                                                        </span>
                                                    </Show>
                                                </td>
                                                <td class="px-6 py-4 text-center">
                                                    {d.is_active
                                                        ? <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                            <span class="size-1.5 rounded-full bg-emerald-500" />Aktif
                                                        </span>
                                                        : <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-full dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700">Non-Aktif</span>
                                                    }
                                                </td>
                                                <td class="px-6 py-4 text-right">
                                                    <button type="button"
                                                        class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-md transition-all dark:text-blue-400 dark:border-blue-800/60 dark:hover:bg-blue-600 dark:hover:text-white cursor-pointer"
                                                        onClick={(e) => { e.stopPropagation(); setSelectedProdiId(d.unitId); const el = document.getElementById('prodi-detail'); if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' }); }}>
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                        Detail
                                                    </button>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                    <Show when={filteredDashboards().length === 0}>
                                        <tr><td colspan="9" class="px-6 py-12 text-center text-neutral-400 dark:text-neutral-500 text-sm">Tidak ada program studi ditemukan.</td></tr>
                                    </Show>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Selected Prodi Detail */}
                    <Show when={selectedDash()}>
                        {(dash) => (
                            <div id="prodi-detail" class="space-y-6">
                                <div class="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl p-7 shadow-lg text-white relative overflow-hidden">
                                    <div class="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                                    <div class="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                        <div>
                                            <div class="text-xs font-bold uppercase tracking-widest text-indigo-200 mb-2">Detail Program Studi</div>
                                            <h2 class="text-2xl sm:text-3xl font-extrabold leading-tight">{dash().unitName}</h2>
                                            <div class="flex flex-wrap items-center gap-2 mt-2">
                                                <Show when={dash().unitCode}>
                                                    <span class="px-2.5 py-0.5 text-xs font-bold bg-indigo-500/30 border border-indigo-400/30 rounded-full">{dash().unitCode}</span>
                                                </Show>
                                                <Show when={dash().education}>
                                                    <span class="px-2.5 py-0.5 text-xs font-bold bg-violet-500/30 border border-violet-400/30 rounded-full">{dash().education}</span>
                                                </Show>
                                                <Show when={dash().is_active}>
                                                    <span class="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/30 border border-emerald-400/30 text-emerald-100 rounded-full flex items-center gap-1">
                                                        <span class="size-1.5 rounded-full bg-emerald-400" />Aktif
                                                    </span>
                                                </Show>
                                            </div>
                                            <Show when={dash().parent}>
                                                <p class="mt-2 text-sm text-indigo-200">Induk: {dash().parent}</p>
                                            </Show>
                                        </div>
                                        <div class="grid grid-cols-3 gap-3 shrink-0">
                                            {[
                                                { label: 'Mahasiswa', value: (dash().totalStudents ?? 0).toLocaleString('id-ID') },
                                                { label: 'Matakuliah', value: String(dash().matakuliah?.total_matakuliah ?? '—') },
                                                { label: 'SKS', value: String(dash().matakuliah?.total_credit ?? '—') },
                                            ].map((s) => (
                                                <div class="text-center p-3 bg-white/10 rounded-xl border border-white/10">
                                                    <div class="text-xl font-black tabular-nums">{s.value}</div>
                                                    <div class="text-xs text-indigo-200 font-medium">{s.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Show when={dash().student_academic_year_chart}>
                                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                                            <h4 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                                <span class="w-2.5 h-2.5 rounded-full bg-blue-500" />Tren Mahasiswa per Tahun Akademik
                                            </h4>
                                            <p class="text-xs text-neutral-400 mb-4">Jumlah mahasiswa aktif per semester</p>
                                            <div class="h-72"><EChart option={dash().student_academic_year_chart} height="100%" width="100%" /></div>
                                        </div>
                                    </Show>
                                    <Show when={dash().course_category_distribution}>
                                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                                            <h4 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                                <span class="w-2.5 h-2.5 rounded-full bg-violet-500" />Distribusi Kategori Matakuliah
                                            </h4>
                                            <p class="text-xs text-neutral-400 mb-4">Proporsi kelompok matakuliah dalam kurikulum</p>
                                            <div class="h-72"><EChart option={dash().course_category_distribution} height="100%" width="100%" /></div>
                                        </div>
                                    </Show>
                                    <Show when={dash().average_gpa_trend}>
                                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                                            <h4 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500" />Tren Rata-rata IPK
                                            </h4>
                                            <p class="text-xs text-neutral-400 mb-4">Perkembangan IPK rata-rata per periode</p>
                                            <div class="h-72"><EChart option={dash().average_gpa_trend} height="100%" width="100%" /></div>
                                        </div>
                                    </Show>
                                    <Show when={dash().lecturer_academic_group_distribution}>
                                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow">
                                            <h4 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                                <span class="w-2.5 h-2.5 rounded-full bg-amber-500" />Kelompok Keahlian Dosen
                                            </h4>
                                            <p class="text-xs text-neutral-400 mb-4">Dosen homebase berdasarkan kelompok akademik</p>
                                            <div class="h-72"><EChart option={dash().lecturer_academic_group_distribution} height="100%" width="100%" /></div>
                                        </div>
                                    </Show>
                                    <Show when={dash().lecturer_academic_rank_distribution}>
                                        <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-6 hover:shadow-md transition-shadow lg:col-span-2">
                                            <h4 class="text-sm font-bold text-neutral-900 dark:text-white mb-1 flex items-center gap-2">
                                                <span class="w-2.5 h-2.5 rounded-full bg-rose-500" />Jabatan Akademik Dosen
                                            </h4>
                                            <p class="text-xs text-neutral-400 mb-4">Jabatan fungsional dosen di homebase prodi ini</p>
                                            <div class="h-72"><EChart option={dash().lecturer_academic_rank_distribution} height="100%" width="100%" /></div>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        )}
                    </Show>
                </Show>

                {/* Empty State */}
                <Show when={!isLoadingUnits() && dashboards().length === 0}>
                    <div class="flex flex-col items-center justify-center py-20 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-center">
                        <div class="p-5 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" />
                            </svg>
                        </div>
                        <h3 class="text-lg font-bold text-neutral-900 dark:text-white">Tidak ada Program Studi ditemukan</h3>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm">
                            Tidak ada unit bertipe Program Studi terdaftar pada institusi ini.
                        </p>
                    </div>
                </Show>

            </div>
        </div>
    );
}
