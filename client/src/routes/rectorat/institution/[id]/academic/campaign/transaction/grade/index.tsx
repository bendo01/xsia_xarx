import { createSignal, createEffect, For, Show, createMemo, onMount } from 'solid-js';
import { useParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import CampaignTransactionNavBar from '~/components/navigation/CampaignTransactionNavBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import {
    listGrades,
    type GradeItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';
import { InstitutionReferenceControllerUnitTypeIndex } from '~/controllers/institution/reference/InstitutionReferenceUnitTypeController';

interface UnitOption {
    id: string;
    name: string;
}

export default function RectoratInstitutionGradeIndex() {
    const params = useParams();
    const location = useLocation();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');

    const isValidId = (id?: string | null): id is string => {
        if (!id) return false;
        const trimmed = id.trim();
        return (
            trimmed !== '' &&
            trimmed !== '[id]' &&
            trimmed !== ':id' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    const resolveInstIdFromPath = () => {
        if (isValidId(params.id)) return params.id.trim();
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const instIdx = parts.indexOf('institution');
        if (instIdx !== -1 && parts[instIdx + 1] && isValidId(parts[instIdx + 1])) {
            return parts[instIdx + 1].trim();
        }
        return '';
    };

    const institutionId = () => resolvedInstitutionId() || resolveInstIdFromPath();

    // Data State
    const [grades, setGrades] = createSignal<GradeItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters State
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedUnitId, setSelectedUnitId] = createSignal('');

    // Unit Options from units::option_select
    const [units, setUnits] = createSignal<UnitOption[]>([]);

    // Quick Detail Modal State
    const [selectedItemForModal, setSelectedItemForModal] = createSignal<GradeItem | null>(null);

    // Resolve unit_type_id for Program Studi Perguruan Tinggi (code = 5, alphabet_code = 'PRODI', name = 'Program Studi Perguruan Tinggi')
    const resolveProdiUnitTypeId = async (): Promise<string | undefined> => {
        try {
            const res = await InstitutionReferenceControllerUnitTypeIndex({ page: 1, per_page: 50 });
            const list = res.data || [];
            const prodi = list.find(
                (item: any) =>
                    item.code === 5 ||
                    item.alphabet_code === 'PRODI' ||
                    item.name === 'Program Studi Perguruan Tinggi'
            );
            if (prodi?.id) return prodi.id;
        } catch (e) {
            console.warn('Failed to load unit types for PRODI filter:', e);
        }
        return '019759fd-36e8-4f43-80ed-4f687a48145d';
    };

    // Load filter options (Units via units::option_select based on institution_id)
    const loadUnitOptions = async (instId: string) => {
        try {
            const prodiUnitTypeId = await resolveProdiUnitTypeId();
            const unitsData = await getUnitOptions({ institution_id: instId, unit_type_id: prodiUnitTypeId });
            if (Array.isArray(unitsData)) {
                setUnits(unitsData);
            }
        } catch (e) {
            console.warn('Failed to load unit options:', e);
        }
    };

    // Resolve institution on load and load options
    createEffect(async () => {
        let instId = resolvedInstitutionId();
        if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
            const preferred = resolveInstIdFromPath();
            instId = await resolveInstitutionFromStaffRole(preferred);
            if (instId) {
                setResolvedInstitutionId(instId);
            }
        }
        if (instId && isValidId(instId)) {
            loadUnitOptions(instId);
        }
    });

    onMount(() => {
        const instId = institutionId();
        if (instId && isValidId(instId)) {
            loadUnitOptions(instId);
        }
    });

    // Fetch grades list
    const fetchGrades = async () => {
        const instId = institutionId();
        if (!instId || !isValidId(instId)) {
            setGrades([]);
            setTotalData(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await listGrades({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                unit_id: selectedUnitId() || undefined,
                institution_id: instId,
            });

            setGrades(res.data || []);
            setTotalData(res.total || 0);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || 0) / itemsPerPage())));
        } catch (e) {
            console.error('Error fetching grades:', e);
            toast.danger('Gagal memuat daftar skala nilai.');
            setGrades([]);
            setTotalData(0);
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        institutionId();
        currentPage();
        itemsPerPage();
        searchQuery();
        selectedUnitId();
        fetchGrades();
    });

    // Debounced search
    let searchTimeout: any;
    const handleSearchInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchQuery(val.trim());
            setCurrentPage(1);
        }, 350);
    };

    // Calculate Summary Stats from current batch
    const summaryStats = createMemo(() => {
        const list = grades();
        let maxGrade = 0;
        let minGrade = 4.0;
        const uniqueUnits = new Set<string>();

        if (list.length === 0) {
            return {
                maxGrade: 4.0,
                minGrade: 0.0,
                activeUnitsCount: 0,
            };
        }

        for (const g of list) {
            if (g.grade > maxGrade) maxGrade = g.grade;
            if (g.grade < minGrade) minGrade = g.grade;
            if (g.unit_id) {
                uniqueUnits.add(g.unit_id);
            }
        }

        return {
            maxGrade,
            minGrade,
            activeUnitsCount: uniqueUnits.size,
        };
    });

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const getGradeColorClass = (alphabet?: string | null) => {
        const code = (alphabet || '').toUpperCase().trim();
        if (code.startsWith('A')) {
            return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
        }
        if (code.startsWith('B')) {
            return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80';
        }
        if (code.startsWith('C')) {
            return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
        }
        if (code.startsWith('D')) {
            return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/80';
        }
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80';
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header & Breadcrumb */}
                <div class="space-y-4">
                    <nav class="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 overflow-x-auto scrollbar-none whitespace-nowrap pb-1">
                        <A href="/rectorat" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Rektorat
                        </A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Institusi
                        </A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Akademik
                        </A>
                        <span>/</span>
                        <span class="text-neutral-700 dark:text-neutral-300 font-semibold">
                            Skala Nilai
                        </span>
                    </nav>

                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden backdrop-blur-xs">
                        <div class="absolute -right-16 -top-16 w-64 h-64 bg-linear-to-br from-amber-500/10 via-emerald-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10">
                            <div class="space-y-2">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
                                    <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Academic / Campaign / Transaction</span>
                                </div>
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                    Unit Skala Nilai
                                </h1>
                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                    Konfigurasi standar bobot indeks prestasi, rentang skor minimum-maksimum, dan lambang nilai huruf per Program Studi pada institusi ini.
                                </p>
                            </div>

                            <div class="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => fetchGrades()}
                                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-sm font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                                    title="Segarkan Data"
                                >
                                    <svg
                                        class={`size-4 text-neutral-600 dark:text-neutral-300 ${isLoading() ? 'animate-spin' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    <span>Segarkan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub-Navigation Bar */}
                <CampaignTransactionNavBar
                    institutionId={institutionId}
                    activeTab="grade"
                />

                {/* KPI Metrics Cards */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Card 1: Total Skala Nilai */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total Skala Nilai</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {totalData()}
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Aturan Penilaian</span>
                        </div>
                    </div>

                    {/* Card 2: Bobot Tertinggi */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Bobot Maksimal</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {summaryStats().maxGrade.toFixed(2)}
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Indeks Prestasi (A)</span>
                        </div>
                    </div>

                    {/* Card 3: Bobot Terendah */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-rose-400 dark:hover:border-rose-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Bobot Minimum</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {summaryStats().minGrade.toFixed(2)}
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Batas Bawah (E)</span>
                        </div>
                    </div>

                    {/* Card 4: Unit / Program Studi */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-purple-400 dark:hover:border-purple-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Unit / Prodi Terdata</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {selectedUnitId() ? 1 : units().length}
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Program Studi Terdata</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Search Input */}
                        <div class="relative">
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Cari Predikat / Nilai Huruf
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    placeholder="Ketik nilai huruf atau nama predikat..."
                                    onInput={handleSearchInput}
                                    value={searchQuery()}
                                    class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
                                />
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Unit / Program Studi Select Filter */}
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Filter Program Studi / Unit
                                </label>
                                <Show when={units().length > 0}>
                                    <span class="text-2xs font-mono text-neutral-400 dark:text-neutral-500">
                                        ({units().length} unit)
                                    </span>
                                </Show>
                            </div>
                            <div class="relative">
                                <select
                                    value={selectedUnitId()}
                                    onChange={(e) => {
                                        setSelectedUnitId(e.currentTarget.value);
                                        setCurrentPage(1);
                                    }}
                                    class={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all cursor-pointer ${selectedUnitId()
                                            ? 'border-emerald-500 dark:border-emerald-400 pr-8 ring-1 ring-emerald-500/20'
                                            : 'border-neutral-300 dark:border-neutral-700'
                                        }`}
                                >
                                    <option value="">Semua Program Studi / Unit</option>
                                    <For each={units()}>
                                        {(u) => <option value={u.id}>{u.name}</option>}
                                    </For>
                                </select>
                                <Show when={selectedUnitId()}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedUnitId('');
                                            setCurrentPage(1);
                                        }}
                                        class="absolute right-8 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 text-xs px-1 cursor-pointer"
                                        title="Hapus filter Program Studi"
                                    >
                                        ✕
                                    </button>
                                </Show>
                            </div>
                        </div>

                        {/* Quick Count Badge */}
                        <div class="flex items-end">
                            <div class="w-full p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 flex items-center justify-between">
                                <span class="text-xs text-neutral-500 dark:text-neutral-400">Total Ditampilkan:</span>
                                <span class="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                    {grades().length} dari {totalData()} record
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    <Show when={searchQuery() || selectedUnitId()}>
                        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                            <span class="text-neutral-500 dark:text-neutral-400 font-medium">Filter Aktif:</span>
                            <Show when={searchQuery()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    Pencarian: "{searchQuery()}"
                                    <button onClick={() => setSearchQuery('')} class="hover:text-emerald-900 dark:hover:text-white ml-0.5 cursor-pointer">×</button>
                                </span>
                            </Show>
                            <Show when={selectedUnitId()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Unit: {units().find((u) => u.id === selectedUnitId())?.name || selectedUnitId()}
                                    <button onClick={() => setSelectedUnitId('')} class="hover:text-purple-900 dark:hover:text-white ml-0.5 cursor-pointer">×</button>
                                </span>
                            </Show>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedUnitId('');
                                    setCurrentPage(1);
                                }}
                                class="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 font-medium ml-2 underline cursor-pointer"
                            >
                                Reset Filter
                            </button>
                        </div>
                    </Show>
                </div>

                {/* Data Table Container */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden">
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                <tr>
                                    <th class="px-6 py-4">Nilai Huruf & Predikat</th>
                                    <th class="px-6 py-4 text-center">Bobot Indeks</th>
                                    <th class="px-6 py-4">Rentang Skor</th>
                                    <th class="px-6 py-4">Program Studi</th>
                                    <th class="px-6 py-4">Masa Berlaku</th>
                                    <th class="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <tr>
                                            <td colspan="6" class="px-6 py-16 text-center">
                                                <div class="flex flex-col items-center justify-center gap-3">
                                                    <div class="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                                    <span class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                                        Memuat data skala nilai...
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                >
                                    <Show
                                        when={grades().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="6" class="px-6 py-16 text-center">
                                                    <div class="max-w-sm mx-auto flex flex-col items-center">
                                                        <div class="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
                                                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                            </svg>
                                                        </div>
                                                        <h3 class="text-base font-bold text-neutral-900 dark:text-white mb-1">
                                                            Tidak ada skala nilai ditemukan
                                                        </h3>
                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                                                            Tidak ada rekaman skala nilai untuk Program Studi / Institusi ini dengan filter yang dipilih.
                                                        </p>
                                                        <Show when={searchQuery() || selectedUnitId()}>
                                                            <button
                                                                onClick={() => {
                                                                    setSearchQuery('');
                                                                    setSelectedUnitId('');
                                                                }}
                                                                class="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                                                            >
                                                                Hapus Filter
                                                            </button>
                                                        </Show>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={grades()}>
                                            {(item) => {
                                                const unitName = units().find((u) => u.id === item.unit_id)?.name || item.unit_name || 'Program Studi Terdaftar';

                                                return (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                        {/* Alphabet Grade & Predicate */}
                                                        <td class="px-6 py-4">
                                                            <div class="flex items-center gap-3">
                                                                <div class={`size-11 rounded-xl border flex items-center justify-center font-mono font-extrabold text-base shrink-0 shadow-2xs ${getGradeColorClass(item.alphabet_code)}`}>
                                                                    {item.alphabet_code || 'N/A'}
                                                                </div>
                                                                <div class="space-y-0.5">
                                                                    <A
                                                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade/${item.id}`}
                                                                        class="font-semibold text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors block text-sm"
                                                                    >
                                                                        {item.name}
                                                                    </A>
                                                                    <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                                        <Show when={item.code !== undefined && item.code !== null}>
                                                                            <span>Kode: #{item.code}</span>
                                                                        </Show>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Weight Grade */}
                                                        <td class="px-6 py-4 text-center">
                                                            <span class="inline-flex items-center px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-extrabold text-sm border border-neutral-200 dark:border-neutral-700">
                                                                {item.grade.toFixed(2)}
                                                            </span>
                                                        </td>

                                                        {/* Score Range */}
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-1">
                                                                <div class="flex items-center gap-1.5 font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200">
                                                                    <span>{item.minimum.toFixed(2)}</span>
                                                                    <span class="text-neutral-400">s/d</span>
                                                                    <span>{item.maximum.toFixed(2)}</span>
                                                                </div>
                                                                <div class="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        class="h-full bg-emerald-500 rounded-full"
                                                                        style={{
                                                                            width: `${Math.min(100, Math.max(10, item.maximum))}%`,
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Unit / Program Studi */}
                                                        <td class="px-6 py-4">
                                                            <div class="flex items-center gap-2">
                                                                <div class="size-7 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 flex items-center justify-center shrink-0">
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                                                    </svg>
                                                                </div>
                                                                <span class="font-medium text-neutral-800 dark:text-neutral-200">
                                                                    {unitName}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Effective Dates */}
                                                        <td class="px-6 py-4">
                                                            <div class="text-xs space-y-0.5 font-mono">
                                                                <Show
                                                                    when={item.start_date || item.end_date}
                                                                    fallback={<span class="text-neutral-400">Permanen (Tanpa batas)</span>}
                                                                >
                                                                    <div class="text-neutral-800 dark:text-neutral-200">
                                                                        {formatDate(item.start_date)}
                                                                    </div>
                                                                    <div class="text-neutral-500 dark:text-neutral-400 text-2xs">
                                                                        s/d {item.end_date ? formatDate(item.end_date) : 'Sekarang'}
                                                                    </div>
                                                                </Show>
                                                            </div>
                                                        </td>

                                                        {/* Action Buttons */}
                                                        <td class="px-6 py-4 text-right">
                                                            <div class="flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setSelectedItemForModal(item)}
                                                                    class="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-colors cursor-pointer"
                                                                    title="Pratinjau Cepat"
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                    </svg>
                                                                </button>
                                                                <A
                                                                    href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade/${item.id}`}
                                                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-200 dark:border-emerald-800/80 transition-all hover:scale-105"
                                                                >
                                                                    <span>Detail</span>
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                                    </svg>
                                                                </A>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Cards Feed (Visible on small screens) */}
                    <div class="block md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                        <Show
                            when={!isLoading()}
                            fallback={
                                <div class="p-8 text-center">
                                    <div class="flex flex-col items-center justify-center gap-3">
                                        <div class="size-8 rounded-full border-2 border-emerald-600 border-t-transparent animate-spin" />
                                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                            Memuat data skala nilai...
                                        </span>
                                    </div>
                                </div>
                            }
                        >
                            <Show
                                when={grades().length > 0}
                                fallback={
                                    <div class="p-8 text-center">
                                        <div class="max-w-xs mx-auto flex flex-col items-center">
                                            <div class="size-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2.5">
                                                <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                                </svg>
                                            </div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                                                Tidak ada skala nilai ditemukan
                                            </h3>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                                                Tidak ada rekaman data sesuai filter saat ini.
                                            </p>
                                            <Show when={searchQuery() || selectedUnitId()}>
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setSelectedUnitId('');
                                                    }}
                                                    class="px-3 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                                                >
                                                    Hapus Filter
                                                </button>
                                            </Show>
                                        </div>
                                    </div>
                                }
                            >
                                <For each={grades()}>
                                    {(item) => {
                                        const unitName = units().find((u) => u.id === item.unit_id)?.name || item.unit_name || 'Program Studi Terdaftar';

                                        return (
                                            <div class="p-4 sm:p-5 space-y-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                                {/* Header row: Alphabet Code Badge + Name/Code + Weight Grade */}
                                                <div class="flex items-start justify-between gap-3">
                                                    <div class="flex items-start gap-3 min-w-0">
                                                        <div class={`size-11 rounded-xl border flex items-center justify-center font-mono font-extrabold text-base shrink-0 shadow-2xs ${getGradeColorClass(item.alphabet_code)}`}>
                                                            {item.alphabet_code || 'N/A'}
                                                        </div>
                                                        <div class="min-w-0">
                                                            <A
                                                                href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade/${item.id}`}
                                                                class="font-bold text-sm text-neutral-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors line-clamp-1"
                                                            >
                                                                {item.name}
                                                            </A>
                                                            <div class="flex items-center gap-2 text-2xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
                                                                <Show when={item.code !== undefined && item.code !== null}>
                                                                    <span>Kode: #{item.code}</span>
                                                                    <span>•</span>
                                                                </Show>
                                                                <span class="truncate max-w-[140px]">{unitName}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="shrink-0 text-right">
                                                        <span class="inline-flex items-center px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono font-extrabold text-xs border border-neutral-200 dark:border-neutral-700">
                                                            {item.grade.toFixed(2)} IP
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Score Range & Progress Bar */}
                                                <div class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 space-y-1.5">
                                                    <div class="flex items-center justify-between text-xs">
                                                        <span class="text-neutral-500 dark:text-neutral-400 text-2xs uppercase tracking-wider font-semibold">Rentang Skor:</span>
                                                        <span class="font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                                            {item.minimum.toFixed(2)} <span class="text-neutral-400 font-normal">s/d</span> {item.maximum.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div class="w-full h-1.5 bg-neutral-200/80 dark:bg-neutral-700/80 rounded-full overflow-hidden">
                                                        <div
                                                            class="h-full bg-emerald-500 rounded-full"
                                                            style={{
                                                                width: `${Math.min(100, Math.max(10, item.maximum))}%`,
                                                            }}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Meta details: Masa Berlaku */}
                                                <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-mono pt-0.5">
                                                    <span class="text-2xs uppercase tracking-wider">Masa Berlaku:</span>
                                                    <Show
                                                        when={item.start_date || item.end_date}
                                                        fallback={<span class="text-neutral-400">Permanen (Tanpa batas)</span>}
                                                    >
                                                        <span class="text-neutral-700 dark:text-neutral-300">
                                                            {formatDate(item.start_date)} - {item.end_date ? formatDate(item.end_date) : 'Sekarang'}
                                                        </span>
                                                    </Show>
                                                </div>

                                                {/* Action Buttons */}
                                                <div class="flex items-center gap-2 pt-0.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => setSelectedItemForModal(item)}
                                                        class="flex-1 py-2 px-3 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold text-xs text-center inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                                    >
                                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                        </svg>
                                                        <span>Pratinjau</span>
                                                    </button>
                                                    <A
                                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade/${item.id}`}
                                                        class="flex-1 py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold text-xs text-center inline-flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-800/80 transition-colors"
                                                    >
                                                        <span>Detail Lengkap</span>
                                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                                        </svg>
                                                    </A>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </Show>
                        </Show>
                    </div>

                    {/* Pagination Controls */}
                    <div class="px-4 sm:px-6 py-3.5 sm:py-4 bg-neutral-50/60 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
                        <div class="flex flex-wrap items-center justify-between sm:justify-start gap-3 text-xs text-neutral-500 dark:text-neutral-400 w-full sm:w-auto">
                            <div class="flex items-center gap-1.5">
                                <span>Per hal:</span>
                                <select
                                    value={itemsPerPage()}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.currentTarget.value));
                                        setCurrentPage(1);
                                    }}
                                    class="px-2 py-1 rounded-lg bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-xs font-medium cursor-pointer"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>
                            <span class="ml-auto sm:ml-0">
                                Total <strong>{totalData()}</strong> data
                            </span>
                        </div>

                        <div class="flex items-center justify-center gap-1.5 self-center sm:self-auto">
                            <button
                                type="button"
                                disabled={currentPage() <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                class="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                title="Halaman Sebelumnya"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>

                            <span class="text-xs font-mono font-medium px-3 py-1 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700">
                                {currentPage()} / {totalPages()}
                            </span>

                            <button
                                type="button"
                                disabled={currentPage() >= totalPages()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                                class="p-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                title="Halaman Selanjutnya"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Quick Preview Modal */}
            <Show when={selectedItemForModal()}>
                {(item) => (
                    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-y-auto max-h-[90vh] p-5 sm:p-6 space-y-5 sm:space-y-6">
                            <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                <div class="flex items-center gap-3">
                                    <div class={`size-12 rounded-xl border flex items-center justify-center font-bold text-lg ${getGradeColorClass(item().alphabet_code)}`}>
                                        {item().alphabet_code || 'N/A'}
                                    </div>
                                    <div>
                                        <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                            {item().name}
                                        </h3>
                                        <p class="text-xs text-neutral-500 font-mono">
                                            Bobot IPK: {item().grade.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedItemForModal(null)}
                                    class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 cursor-pointer"
                                >
                                    ✕
                                </button>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
                                <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                    <span class="text-neutral-500 text-2xs uppercase">Program Studi</span>
                                    <p class="font-semibold text-neutral-800 dark:text-neutral-200">
                                        {units().find((u) => u.id === item().unit_id)?.name || 'Tidak tercatat'}
                                    </p>
                                </div>
                                <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                    <span class="text-neutral-500 text-2xs uppercase">Rentang Skor</span>
                                    <p class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {item().minimum.toFixed(2)} - {item().maximum.toFixed(2)}
                                    </p>
                                </div>
                                <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                    <span class="text-neutral-500 text-2xs uppercase">Mulai Berlaku</span>
                                    <p class="font-mono text-neutral-800 dark:text-neutral-200">
                                        {formatDate(item().start_date)}
                                    </p>
                                </div>
                                <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                    <span class="text-neutral-500 text-2xs uppercase">Selesai Berlaku</span>
                                    <p class="font-mono text-neutral-800 dark:text-neutral-200">
                                        {item().end_date ? formatDate(item().end_date) : 'Berlaku Seterusnya'}
                                    </p>
                                </div>
                            </div>

                            <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setSelectedItemForModal(null)}
                                    class="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-center cursor-pointer transition-colors"
                                >
                                    Tutup
                                </button>
                                <A
                                    href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade/${item().id}`}
                                    class="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white text-center transition-colors"
                                >
                                    Buka Halaman Lengkap
                                </A>
                            </div>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
}
