import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import {
    listStudentActivities,
    type StudentActivityItem,
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';
import { getAcademicYearOptions } from '~/controllers/academic/general/reference/AcademicGeneralReferenceAcademicYearController';
import { getStatusOptions } from '~/controllers/academic/student/reference/AcademicStudentReferenceStatusController';

interface OptionItem {
    id: string;
    name: string;
}

export default function RectoratStudentActivityIndex() {
    const params = useParams();
    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');

    const institutionId = () => resolvedInstitutionId() || params.id;

    // Table state
    const [items, setItems] = createSignal<StudentActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = createSignal('');
    const [units, setUnits] = createSignal<OptionItem[]>([]);
    const [selectedUnitId, setSelectedUnitId] = createSignal<string>('');
    const [academicYears, setAcademicYears] = createSignal<OptionItem[]>([]);
    const [selectedAcademicYearId, setSelectedAcademicYearId] = createSignal<string>('');
    const [statuses, setStatuses] = createSignal<OptionItem[]>([]);
    const [selectedStatusId, setSelectedStatusId] = createSignal<string>('');

    // Sort state: 'name' | 'created_at', 'asc' | 'desc'
    const [sortBy, setSortBy] = createSignal<'name' | 'created_at'>('created_at');
    const [sortDir, setSortDir] = createSignal<'asc' | 'desc'>('desc');

    // Load reference options (units scoped to institution) on mount / institution resolve
    const loadFilterOptions = async (instId: string) => {
        try {
            const [unitsData, yearsData, statusData] = await Promise.all([
                getUnitOptions({ institution_id: instId }),
                getAcademicYearOptions(),
                getStatusOptions(),
            ]);
            setUnits(unitsData || []);
            setAcademicYears(yearsData || []);
            setStatuses(statusData || []);
        } catch (e) {
            console.warn('Failed to load filter options:', e);
        }
    };

    onMount(async () => {
        let instId = resolvedInstitutionId();
        if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
            instId = await resolveInstitutionFromStaffRole(params.id);
            if (instId) {
                setResolvedInstitutionId(instId);
            }
        }
        if (instId && instId !== '[id]') {
            loadFilterOptions(instId);
        }
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let instId = resolvedInstitutionId();
            if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
                instId = await resolveInstitutionFromStaffRole(params.id);
                if (instId) {
                    setResolvedInstitutionId(instId);
                }
            }

            if (!instId || instId === '[id]') {
                setItems([]);
                setTotalData(0);
                setIsLoading(false);
                return;
            }

            const response = await listStudentActivities({
                page: currentPage(),
                page_size: itemsPerPage(),
                institution_id: instId,
                unit_id: selectedUnitId() || undefined,
                academic_year_id: selectedAcademicYearId() || undefined,
                status_id: selectedStatusId() || undefined,
                search: searchQuery() || undefined,
                sort_by: sortBy(),
                sort_dir: sortDir(),
            });

            if (response) {
                setItems(response.data ?? []);
                setTotalData(response.total ?? 0);
                setTotalPages(response.total_pages || Math.ceil((response.total ?? 0) / itemsPerPage()) || 1);
            }
        } catch (e) {
            console.error('Failed to fetch student activities:', e);
            setItems([]);
            setTotalData(0);
            toast.danger('Gagal memuat data aktivitas semester mahasiswa.');
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
        selectedAcademicYearId();
        selectedStatusId();
        sortBy();
        sortDir();
        fetchData();
    });

    let searchTimeout: any;
    const handleSearch = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchQuery(val);
            setCurrentPage(1);
        }, 350);
    };

    const initials = (name?: string | null) =>
        (name || 'M')
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0] ?? '')
            .join('')
            .toUpperCase();

    const startIndex = () => (currentPage() - 1) * itemsPerPage() + 1;
    const endIndex = () => Math.min(currentPage() * itemsPerPage(), totalData());

    const toggleSort = (col: 'name' | 'created_at') => {
        if (sortBy() === col) {
            setSortDir(sortDir() === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(col);
            setSortDir('asc');
        }
        setCurrentPage(1);
    };

    const resetAllFilters = () => {
        setSearchQuery('');
        const searchInput = document.getElementById('activity-search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.value = '';
        setSelectedUnitId('');
        setSelectedAcademicYearId('');
        setSelectedStatusId('');
        setSortBy('created_at');
        setSortDir('desc');
        setCurrentPage(1);
    };

    const hasActiveFilters = () =>
        Boolean(searchQuery()) ||
        Boolean(selectedUnitId()) ||
        Boolean(selectedAcademicYearId()) ||
        Boolean(selectedStatusId());

    const getGradeColor = (val?: number | null) => {
        if (val == null || val === 0) return 'text-neutral-500 dark:text-neutral-400';
        if (val >= 3.5) return 'text-blue-600 dark:text-blue-400 font-bold';
        if (val >= 3.0) return 'text-emerald-600 dark:text-emerald-400 font-bold';
        if (val >= 2.5) return 'text-amber-600 dark:text-amber-400 font-semibold';
        return 'text-red-600 dark:text-red-400 font-semibold';
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Header */}
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-blue-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-blue-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-blue-600 transition-colors">Akademik</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}/academic/student/master/student`} class="hover:text-blue-600 transition-colors">Mahasiswa</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Aktivitas Semester</span>
                        </nav>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200 dark:border-blue-800/50">
                            <span class="relative flex size-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full size-2 bg-blue-500"></span>
                            </span>
                            Akademik · Aktivitas Semester
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-9 h-9">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                            </span>
                            Aktivitas Semester Mahasiswa
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Daftar aktivitas perkuliahan semester mahasiswa (KRS, KHS, SKS, IPS, IPK) dalam lingkup institusi.
                        </p>
                    </div>

                    <div class="text-center px-5 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 shadow-sm shrink-0">
                        <Show
                            when={!isLoading()}
                            fallback={<div class="h-8 w-14 bg-blue-200 dark:bg-blue-900 rounded animate-pulse mx-auto"></div>}
                        >
                            <p class="text-3xl font-black text-blue-700 dark:text-blue-400">{totalData().toLocaleString()}</p>
                        </Show>
                        <p class="text-[11px] text-blue-600 dark:text-blue-500 font-semibold uppercase tracking-wide mt-0.5">Total Aktivitas</p>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 items-center">

                        {/* Search Input */}
                        <div class="md:col-span-4 relative">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="activity-search-input"
                                class="block w-full py-2.5 pl-10 pr-3 text-xs sm:text-sm border border-neutral-200 rounded-lg bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all placeholder:text-neutral-400"
                                placeholder="Cari nama, NIM, atau semester..."
                                onInput={handleSearch}
                            />
                        </div>

                        {/* Unit / Program Studi Filter Dropdown (Scoped to user institution) */}
                        <div class="md:col-span-3">
                            <select
                                id="activity-unit-filter"
                                class="w-full py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all shadow-xs cursor-pointer truncate"
                                value={selectedUnitId()}
                                onChange={(e) => {
                                    setSelectedUnitId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Semua Program Studi (Unit)</option>
                                <For each={units()}>
                                    {(u) => <option value={u.id}>{u.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Academic Year Filter Dropdown */}
                        <div class="md:col-span-2">
                            <select
                                id="activity-year-filter"
                                class="w-full py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all shadow-xs cursor-pointer truncate"
                                value={selectedAcademicYearId()}
                                onChange={(e) => {
                                    setSelectedAcademicYearId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Semua Tahun Ajaran</option>
                                <For each={academicYears()}>
                                    {(ay) => <option value={ay.id}>{ay.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Status Filter Dropdown */}
                        <div class="md:col-span-1.5 sm:col-span-1">
                            <select
                                id="activity-status-filter"
                                class="w-full py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all shadow-xs cursor-pointer"
                                value={selectedStatusId()}
                                onChange={(e) => {
                                    setSelectedStatusId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Semua Status</option>
                                <For each={statuses()}>
                                    {(st) => <option value={st.id}>{st.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Sort Selector */}
                        <div class="md:col-span-1.5 sm:col-span-1">
                            <select
                                id="activity-sort-selector"
                                class="w-full py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all shadow-xs cursor-pointer font-medium"
                                value={`${sortBy()}-${sortDir()}`}
                                onChange={(e) => {
                                    const [by, dir] = (e.target as HTMLSelectElement).value.split('-');
                                    setSortBy(by as 'name' | 'created_at');
                                    setSortDir(dir as 'asc' | 'desc');
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="created_at-desc">Terbaru</option>
                                <option value="created_at-asc">Terlama</option>
                                <option value="name-asc">Nama: A - Z</option>
                                <option value="name-desc">Nama: Z - A</option>
                            </select>
                        </div>

                    </div>

                    {/* Active Filters Badges & Rows Per Page */}
                    <div class="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-neutral-400 text-[11px] font-medium">Filter Aktif:</span>

                            <Show when={searchQuery()}>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-800/60">
                                    <span>Cari: "{searchQuery()}"</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSearchQuery('');
                                            const el = document.getElementById('activity-search-input') as HTMLInputElement | null;
                                            if (el) el.value = '';
                                            setCurrentPage(1);
                                        }}
                                        class="hover:text-blue-900 dark:hover:text-blue-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show when={selectedUnitId()}>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 text-[11px] font-medium border border-purple-200 dark:border-purple-800/60">
                                    <span>Prodi: {units().find(u => u.id === selectedUnitId())?.name || '1 Unit'}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedUnitId('');
                                            setCurrentPage(1);
                                        }}
                                        class="hover:text-purple-900 dark:hover:text-purple-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show when={selectedAcademicYearId()}>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/60">
                                    <span>Tahun: {academicYears().find(ay => ay.id === selectedAcademicYearId())?.name || 'Tahun Ajaran'}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAcademicYearId('');
                                            setCurrentPage(1);
                                        }}
                                        class="hover:text-indigo-900 dark:hover:text-indigo-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show when={selectedStatusId()}>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
                                    <span>Status: {statuses().find(s => s.id === selectedStatusId())?.name || 'Status'}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatusId('');
                                            setCurrentPage(1);
                                        }}
                                        class="hover:text-emerald-900 dark:hover:text-emerald-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show when={!hasActiveFilters()}>
                                <span class="text-neutral-400 italic text-[11px]">Tidak ada filter aktif (menampilkan seluruh data institusi)</span>
                            </Show>

                            <Show when={hasActiveFilters()}>
                                <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    class="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 text-[11px] font-medium underline ml-1 cursor-pointer"
                                >
                                    Reset Semua
                                </button>
                            </Show>
                        </div>

                        <div class="flex items-center gap-2 shrink-0 ml-auto">
                            <label class="text-xs text-neutral-500 dark:text-neutral-400 font-medium whitespace-nowrap">Per halaman:</label>
                            <select
                                id="activity-rows-per-page"
                                class="p-1.5 text-xs border border-neutral-200 rounded-md bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white shadow-xs"
                                value={itemsPerPage()}
                                onChange={(e) => {
                                    setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs uppercase bg-neutral-50/80 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold tracking-wider select-none">
                                <tr>
                                    <th class="px-6 py-4">Mahasiswa</th>
                                    <th class="px-6 py-4">Program Studi</th>
                                    <th
                                        class="px-6 py-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => toggleSort('name')}
                                        title="Klik untuk mengurutkan berdasarkan nama semester"
                                    >
                                        <div class="flex items-center gap-1.5">
                                            <span>Semester / Tahun</span>
                                            <Show when={sortBy() === 'name'}>
                                                <span class="text-blue-600 dark:text-blue-400 font-bold">
                                                    {sortDir() === 'asc' ? '↑' : '↓'}
                                                </span>
                                            </Show>
                                            <Show when={sortBy() !== 'name'}>
                                                <span class="text-neutral-300 dark:text-neutral-600 text-[10px]">↕</span>
                                            </Show>
                                        </div>
                                    </th>
                                    <th class="px-6 py-4 text-center">SKS (Sem / Kum)</th>
                                    <th class="px-6 py-4 text-center">Indeks (IPS / IPK)</th>
                                    <th class="px-6 py-4 text-center">Status</th>
                                    <th class="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 5 })}>
                                            {() => (
                                                <tr class="animate-pulse">
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                                                            <div class="space-y-1.5">
                                                                <div class="h-4 w-36 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                                                                <div class="h-3 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4"><div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-28 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded mx-auto"></div></td>
                                                    <td class="px-6 py-4"><div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto"></div></td>
                                                    <td class="px-6 py-4"><div class="h-7 w-20 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="7" class="px-6 py-16 text-center">
                                                    <div class="flex flex-col items-center gap-3 text-neutral-500 dark:text-neutral-400">
                                                        <div class="p-4 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-semibold text-base text-neutral-700 dark:text-neutral-300">Tidak ada aktivitas semester mahasiswa</span>
                                                        <span class="text-sm">Coba sesuaikan kata kunci pencarian atau filter program studi dan tahun ajaran.</span>
                                                        <Show when={hasActiveFilters()}>
                                                            <button
                                                                type="button"
                                                                onClick={resetAllFilters}
                                                                class="mt-2 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg transition-colors cursor-pointer"
                                                            >
                                                                Reset Semua Filter
                                                            </button>
                                                        </Show>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                    {/* Mahasiswa Info */}
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                                {initials(item.student_name)}
                                                            </div>
                                                            <div class="min-w-0">
                                                                <p class="font-semibold text-neutral-900 dark:text-white truncate">
                                                                    {item.student_name || 'Mahasiswa'}
                                                                </p>
                                                                <Show when={item.student_code}>
                                                                    <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                                                        NIM: {item.student_code}
                                                                    </p>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Program Studi */}
                                                    <td class="px-6 py-4">
                                                        <Show
                                                            when={item.unit_name}
                                                            fallback={<span class="text-neutral-400 dark:text-neutral-600">-</span>}
                                                        >
                                                            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-[200px]">
                                                                {item.unit_name}
                                                            </p>
                                                            <Show when={item.unit_code}>
                                                                <p class="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                                                    {item.unit_code}
                                                                </p>
                                                            </Show>
                                                        </Show>
                                                    </td>

                                                    {/* Semester / Academic Year */}
                                                    <td class="px-6 py-4">
                                                        <p class="font-medium text-neutral-900 dark:text-white text-sm">
                                                            {item.name || item.semester_name || 'Semester'}
                                                        </p>
                                                        <Show when={item.academic_year_name}>
                                                            <span class="inline-flex items-center px-2 py-0.5 mt-0.5 rounded text-[11px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                                                {item.academic_year_name}
                                                            </span>
                                                        </Show>
                                                    </td>

                                                    {/* SKS (Semester / Kumulatif) */}
                                                    <td class="px-6 py-4 text-center">
                                                        <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-neutral-100 dark:bg-neutral-800/80 font-mono text-xs">
                                                            <span class="font-bold text-neutral-900 dark:text-white" title="SKS Semester">
                                                                {item.total_credit ?? 0}
                                                            </span>
                                                            <span class="text-neutral-400">/</span>
                                                            <span class="font-medium text-neutral-600 dark:text-neutral-400" title="SKS Kumulatif">
                                                                {item.grand_total_credit ?? item.total_credit ?? 0} SKS
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Indeks Prestasi (IPS / IPK) */}
                                                    <td class="px-6 py-4 text-center">
                                                        <div class="inline-flex flex-col items-center">
                                                            <div class="flex items-center gap-1.5 font-mono text-xs">
                                                                <span class={getGradeColor(item.cumulative_index)} title="IPS (Indeks Prestasi Semester)">
                                                                    {Number(item.cumulative_index ?? 0).toFixed(2)}
                                                                </span>
                                                                <span class="text-neutral-400">/</span>
                                                                <span class={getGradeColor(item.grand_cumulative_index)} title="IPK (Indeks Prestasi Kumulatif)">
                                                                    {Number(item.grand_cumulative_index ?? item.cumulative_index ?? 0).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <span class="text-[10px] text-neutral-400 font-mono">IPS / IPK</span>
                                                        </div>
                                                    </td>

                                                    {/* Status Badge */}
                                                    <td class="px-6 py-4 text-center">
                                                        <div class="flex flex-col items-center gap-1">
                                                            <span class="inline-flex items-center justify-center h-6 px-2.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                                {item.status_name || 'Aktif'}
                                                            </span>
                                                            <Show when={item.is_lock}>
                                                                <span class="inline-flex items-center gap-1 text-[9px] font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                                                                    <svg class="size-2.5" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                                                                    </svg>
                                                                    Terkunci
                                                                </span>
                                                            </Show>
                                                        </div>
                                                    </td>

                                                    {/* Aksi Button */}
                                                    <td class="px-6 py-4 text-right">
                                                        <A
                                                            href={`/rectorat/institution/${institutionId()}/academic/student/campaign/student-activity/${item.id}`}
                                                            id={`activity-detail-btn-${item.id}`}
                                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-md transition-all dark:text-blue-400 dark:border-blue-800/60 dark:hover:bg-blue-600 dark:hover:text-white cursor-pointer shadow-xs"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                            </svg>
                                                            Detail
                                                        </A>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div class="p-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                        <div>
                            Menampilkan <span class="font-bold text-neutral-900 dark:text-white">{totalData() > 0 ? startIndex() : 0}</span> sampai{' '}
                            <span class="font-bold text-neutral-900 dark:text-white">{endIndex()}</span> dari{' '}
                            <span class="font-bold text-neutral-900 dark:text-white">{totalData().toLocaleString()}</span> aktivitas
                        </div>

                        <div class="flex items-center gap-1">
                            <button
                                type="button"
                                id="activity-pagination-prev"
                                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                disabled={currentPage() === 1 || isLoading()}
                                class="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                            >
                                Sebelumnya
                            </button>

                            <div class="px-2 font-medium">
                                Halaman <span class="font-bold text-neutral-900 dark:text-white">{currentPage()}</span> dari{' '}
                                <span class="font-bold text-neutral-900 dark:text-white">{totalPages()}</span>
                            </div>

                            <button
                                type="button"
                                id="activity-pagination-next"
                                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages()))}
                                disabled={currentPage() >= totalPages() || isLoading()}
                                class="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                            >
                                Selanjutnya
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
