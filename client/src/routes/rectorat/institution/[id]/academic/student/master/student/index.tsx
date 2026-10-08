import { createSignal, createEffect, For, Show, createMemo, onMount, onCleanup } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import { getAcademicYearOptions } from '~/controllers/academic/general/reference/AcademicGeneralReferenceAcademicYearController';
import { getStatusOptions } from '~/controllers/academic/student/reference/AcademicStudentReferenceStatusController';

interface StudentRow {
    id: string;
    code: string;
    name: string;
    nisn?: string | null;
    registered?: string | null;
    individual_id?: string;
    unit_id?: string;
    status_id?: string;
    academic_year_id?: string;
    curriculum_id?: string;
    unit_name?: string | null;
    unit_code?: string | null;
    status_name?: string | null;
    academic_year_name?: string | null;
    curriculum_name?: string | null;
    selection_type_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
}

interface OptionItem {
    id: string;
    name: string;
}

export default function RectoratStudentIndex() {
    const params = useParams();
    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');

    const institutionId = () => resolvedInstitutionId() || params.id;

    // Table state
    const [items, setItems] = createSignal<StudentRow[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Search & Filter state
    const [searchQuery, setSearchQuery] = createSignal('');
    const [academicYears, setAcademicYears] = createSignal<OptionItem[]>([]);
    const [selectedAcademicYears, setSelectedAcademicYears] = createSignal<string[]>([]);
    const [statuses, setStatuses] = createSignal<OptionItem[]>([]);
    const [selectedStatus, setSelectedStatus] = createSignal<string>('');

    // Sort state: 'code' | 'name', 'asc' | 'desc'
    const [sortBy, setSortBy] = createSignal<'code' | 'name'>('code');
    const [sortDir, setSortDir] = createSignal<'asc' | 'desc'>('asc');

    // Multi-select dropdown state
    const [isAyDropdownOpen, setIsAyDropdownOpen] = createSignal(false);
    const [aySearchQuery, setAySearchQuery] = createSignal('');
    let ayDropdownRef: HTMLDivElement | undefined;

    // Load reference options on mount
    onMount(async () => {
        try {
            const [yearsData, statusData] = await Promise.all([
                getAcademicYearOptions(),
                getStatusOptions(),
            ]);
            setAcademicYears(yearsData || []);
            setStatuses(statusData || []);
        } catch (e) {
            console.warn('Failed to load filter options:', e);
        }

        // Close dropdown when clicking outside
        const handleOutsideClick = (e: MouseEvent) => {
            if (ayDropdownRef && !ayDropdownRef.contains(e.target as Node)) {
                setIsAyDropdownOpen(false);
            }
        };
        document.addEventListener('click', handleOutsideClick);
        onCleanup(() => document.removeEventListener('click', handleOutsideClick));
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

            const response = await masterApiIndex<StudentRow>('academic/student/master/students', {
                page: currentPage(),
                per_page: itemsPerPage(),
                institution_id: instId,
                search: searchQuery() || undefined,
                academic_year_ids: selectedAcademicYears().length > 0 ? selectedAcademicYears().join(',') : undefined,
                status_id: selectedStatus() || undefined,
                sort_by: sortBy(),
                sort_dir: sortDir(),
            });

            if (response) {
                setItems(response.data ?? []);
                setTotalData(response.total ?? 0);
                setTotalPages((response.total_pages ?? Math.ceil((response.total ?? 0) / itemsPerPage())) || 1);
            }
        } catch (e) {
            console.error(e);
            setItems([]);
            setTotalData(0);
            toast.danger('Gagal memuat data mahasiswa.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        institutionId();
        currentPage();
        itemsPerPage();
        searchQuery();
        selectedAcademicYears();
        selectedStatus();
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

    const initials = (name: string) =>
        (name || 'M')
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0] ?? '')
            .join('')
            .toUpperCase();

    const formatDate = (d?: string | null) => {
        if (!d) return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return d;
        }
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage() + 1;
    const endIndex = () => Math.min(currentPage() * itemsPerPage(), totalData());

    // Filtered academic years inside dropdown
    const filteredAcademicYears = createMemo(() => {
        const query = aySearchQuery().toLowerCase().trim();
        if (!query) return academicYears();
        return academicYears().filter((ay) => ay.name.toLowerCase().includes(query));
    });

    const toggleAcademicYear = (id: string) => {
        const current = selectedAcademicYears();
        if (current.includes(id)) {
            setSelectedAcademicYears(current.filter((item) => item !== id));
        } else {
            setSelectedAcademicYears([...current, id]);
        }
        setCurrentPage(1);
    };

    const selectAllFilteredAy = () => {
        const allIds = filteredAcademicYears().map((ay) => ay.id);
        const merged = Array.from(new Set([...selectedAcademicYears(), ...allIds]));
        setSelectedAcademicYears(merged);
        setCurrentPage(1);
    };

    const clearAllAy = () => {
        setSelectedAcademicYears([]);
        setCurrentPage(1);
    };

    const toggleSort = (col: 'code' | 'name') => {
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
        const searchInput = document.getElementById('student-search-input') as HTMLInputElement | null;
        if (searchInput) searchInput.value = '';
        setSelectedAcademicYears([]);
        setSelectedStatus('');
        setSortBy('code');
        setSortDir('asc');
        setCurrentPage(1);
    };

    const hasActiveFilters = () =>
        Boolean(searchQuery()) || selectedAcademicYears().length > 0 || Boolean(selectedStatus());

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
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Mahasiswa</span>
                        </nav>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200 dark:border-blue-800/50">
                            <span class="relative flex size-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full size-2 bg-blue-500"></span>
                            </span>
                            Akademik · Mahasiswa
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-9 h-9">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                            </span>
                            Daftar Mahasiswa
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Seluruh mahasiswa yang terdaftar dalam institusi ini.
                        </p>
                    </div>

                    <div class="text-center px-5 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 shadow-sm shrink-0">
                        <Show
                            when={!isLoading()}
                            fallback={<div class="h-8 w-14 bg-blue-200 dark:bg-blue-900 rounded animate-pulse mx-auto"></div>}
                        >
                            <p class="text-3xl font-black text-blue-700 dark:text-blue-400">{totalData().toLocaleString()}</p>
                        </Show>
                        <p class="text-[11px] text-blue-600 dark:text-blue-500 font-semibold uppercase tracking-wide mt-0.5">Total Mahasiswa</p>
                    </div>
                </div>

                {/* Search & Filter Toolbar */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">

                        {/* Search Input using ILIKE */}
                        <div class="md:col-span-5 relative">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="student-search-input"
                                class="block w-full py-2.5 pl-10 pr-3 text-xs sm:text-sm border border-neutral-200 rounded-lg bg-neutral-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all placeholder:text-neutral-400"
                                placeholder="Cari nama atau NIM mahasiswa (ILIKE)..."
                                onInput={handleSearch}
                            />
                        </div>

                        {/* Multiple Select: Academic Year Filter */}
                        <div class="md:col-span-3 relative" ref={ayDropdownRef}>
                            <button
                                type="button"
                                id="academic-year-multi-select-btn"
                                onClick={() => setIsAyDropdownOpen(!isAyDropdownOpen())}
                                class="w-full flex items-center justify-between py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all text-left shadow-xs"
                            >
                                <div class="flex items-center gap-2 truncate">
                                    <svg class="size-3.5 text-neutral-400 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.253M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                    </svg>
                                    <Show
                                        when={selectedAcademicYears().length > 0}
                                        fallback={<span class="text-neutral-500 dark:text-neutral-400">Semua Tahun Akademik</span>}
                                    >
                                        <span class="font-medium text-blue-600 dark:text-blue-400">
                                            {selectedAcademicYears().length === 1
                                                ? (academicYears().find(ay => ay.id === selectedAcademicYears()[0])?.name || '1 Tahun Ajaran')
                                                : `${selectedAcademicYears().length} Tahun Akademik`}
                                        </span>
                                    </Show>
                                </div>
                                <div class="flex items-center gap-1.5 shrink-0 ml-1">
                                    <Show when={selectedAcademicYears().length > 0}>
                                        <span
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                clearAllAy();
                                            }}
                                            class="size-4 rounded-full bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 flex items-center justify-center text-neutral-600 dark:text-neutral-300 text-[10px]"
                                            title="Hapus filter tahun"
                                        >
                                            ✕
                                        </span>
                                    </Show>
                                    <svg class="size-3.5 text-neutral-400 transition-transform duration-200" classList={{ 'rotate-180': isAyDropdownOpen() }} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                        <path fill-rule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
                                    </svg>
                                </div>
                            </button>

                            {/* Dropdown Popover */}
                            <Show when={isAyDropdownOpen()}>
                                <div class="absolute left-0 top-full mt-1.5 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 p-2.5 space-y-2 animate-in fade-in slide-in-from-top-1">
                                    <div class="relative">
                                        <input
                                            type="text"
                                            value={aySearchQuery()}
                                            onInput={(e) => setAySearchQuery(e.currentTarget.value)}
                                            placeholder="Cari tahun ajaran..."
                                            class="w-full text-xs px-2.5 py-1.5 rounded-md border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        />
                                    </div>

                                    <div class="flex items-center justify-between text-[11px] px-1 text-neutral-500 dark:text-neutral-400 border-b border-neutral-100 dark:border-neutral-800 pb-1.5">
                                        <button
                                            type="button"
                                            onClick={selectAllFilteredAy}
                                            class="hover:text-blue-600 dark:hover:text-blue-400 font-medium cursor-pointer"
                                        >
                                            Pilih Semua
                                        </button>
                                        <button
                                            type="button"
                                            onClick={clearAllAy}
                                            class="hover:text-red-600 dark:hover:text-red-400 font-medium cursor-pointer"
                                        >
                                            Reset
                                        </button>
                                    </div>

                                    <div class="max-h-56 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                                        <Show
                                            when={filteredAcademicYears().length > 0}
                                            fallback={<div class="p-3 text-center text-xs text-neutral-400">Tidak ada tahun ajaran</div>}
                                        >
                                            <For each={filteredAcademicYears()}>
                                                {(ay) => {
                                                    const isChecked = () => selectedAcademicYears().includes(ay.id);
                                                    return (
                                                        <label
                                                            class="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/70 cursor-pointer text-xs transition-colors"
                                                            classList={{ 'bg-blue-50/60 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold': isChecked() }}
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                checked={isChecked()}
                                                                onChange={() => toggleAcademicYear(ay.id)}
                                                                class="size-3.5 rounded text-blue-600 border-neutral-300 focus:ring-blue-500 dark:border-neutral-600 dark:bg-neutral-800"
                                                            />
                                                            <span class="truncate">{ay.name}</span>
                                                        </label>
                                                    );
                                                }}
                                            </For>
                                        </Show>
                                    </div>
                                </div>
                            </Show>
                        </div>

                        {/* Status Filter Dropdown */}
                        <div class="md:col-span-2">
                            <select
                                id="student-status-filter"
                                class="w-full py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all shadow-xs cursor-pointer"
                                value={selectedStatus()}
                                onChange={(e) => {
                                    setSelectedStatus((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">Semua Status</option>
                                <For each={statuses()}>
                                    {(st) => <option value={st.id}>{st.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Sort Selector: by Code or Name */}
                        <div class="md:col-span-2">
                            <select
                                id="student-sort-selector"
                                class="w-full py-2.5 px-3 text-xs border border-neutral-200 rounded-lg bg-neutral-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-800/60 dark:border-neutral-700 dark:focus:bg-neutral-800 dark:text-white transition-all shadow-xs cursor-pointer font-medium"
                                value={`${sortBy()}-${sortDir()}`}
                                onChange={(e) => {
                                    const [by, dir] = (e.target as HTMLSelectElement).value.split('-');
                                    setSortBy(by as 'code' | 'name');
                                    setSortDir(dir as 'asc' | 'desc');
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="code-asc">NIM: A - Z (Asc)</option>
                                <option value="code-desc">NIM: Z - A (Desc)</option>
                                <option value="name-asc">Nama: A - Z (Asc)</option>
                                <option value="name-desc">Nama: Z - A (Desc)</option>
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
                                            const el = document.getElementById('student-search-input') as HTMLInputElement | null;
                                            if (el) el.value = '';
                                            setCurrentPage(1);
                                        }}
                                        class="hover:text-blue-900 dark:hover:text-blue-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show when={selectedAcademicYears().length > 0}>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[11px] font-medium border border-indigo-200 dark:border-indigo-800/60">
                                    <span>Tahun: {selectedAcademicYears().length} dipilih</span>
                                    <button
                                        type="button"
                                        onClick={clearAllAy}
                                        class="hover:text-indigo-900 dark:hover:text-indigo-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show when={selectedStatus()}>
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[11px] font-medium border border-emerald-200 dark:border-emerald-800/60">
                                    <span>Status: {statuses().find(s => s.id === selectedStatus())?.name || selectedStatus()}</span>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedStatus('');
                                            setCurrentPage(1);
                                        }}
                                        class="hover:text-emerald-900 dark:hover:text-emerald-100 font-bold"
                                    >
                                        ✕
                                    </button>
                                </span>
                            </Show>

                            <Show
                                when={hasActiveFilters()}
                                fallback={<span class="text-neutral-400 italic text-[11px]">Tidak ada filter aktif (menampilkan semua)</span>}
                            >
                                <button
                                    type="button"
                                    onClick={resetAllFilters}
                                    class="text-neutral-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 text-[11px] font-medium underline underline-offset-2 ml-1 cursor-pointer"
                                >
                                    Reset Semua
                                </button>
                            </Show>
                        </div>

                        <div class="flex items-center gap-2 shrink-0 ml-auto">
                            <label class="text-xs text-neutral-500 dark:text-neutral-400 font-medium whitespace-nowrap">Per halaman:</label>
                            <select
                                id="student-rows-per-page"
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
                                    {/* Sortable: Mahasiswa (Name) */}
                                    <th
                                        class="px-6 py-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => toggleSort('name')}
                                        title="Klik untuk mengurutkan berdasarkan nama"
                                    >
                                        <div class="flex items-center gap-1.5">
                                            <span>Mahasiswa</span>
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

                                    {/* Sortable: NIM / Code */}
                                    <th
                                        class="px-6 py-4 cursor-pointer hover:bg-neutral-100/70 dark:hover:bg-neutral-800 transition-colors"
                                        onClick={() => toggleSort('code')}
                                        title="Klik untuk mengurutkan berdasarkan NIM / Kode"
                                    >
                                        <div class="flex items-center gap-1.5">
                                            <span>NIM / Kode</span>
                                            <Show when={sortBy() === 'code'}>
                                                <span class="text-blue-600 dark:text-blue-400 font-bold">
                                                    {sortDir() === 'asc' ? '↑' : '↓'}
                                                </span>
                                            </Show>
                                            <Show when={sortBy() !== 'code'}>
                                                <span class="text-neutral-300 dark:text-neutral-600 text-[10px]">↕</span>
                                            </Show>
                                        </div>
                                    </th>

                                    <th class="px-6 py-4">Program Studi</th>
                                    <th class="px-6 py-4">Tahun Akademik</th>
                                    <th class="px-6 py-4">Terdaftar</th>
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
                                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
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
                                                                <path d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-semibold text-base text-neutral-700 dark:text-neutral-300">Tidak ada data mahasiswa</span>
                                                        <span class="text-sm">Coba sesuaikan kata kunci pencarian atau filter tahun dan status.</span>
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
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                                {initials(item.name)}
                                                            </div>
                                                            <div class="min-w-0">
                                                                <p class="font-semibold text-neutral-900 dark:text-white truncate">{item.name}</p>
                                                                <Show when={item.nisn}>
                                                                    <p class="text-[11px] text-neutral-400 font-mono">NISN: {item.nisn}</p>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <span class="font-mono text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded">
                                                            {item.code}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <Show
                                                            when={item.unit_name}
                                                            fallback={<span class="text-neutral-400 dark:text-neutral-600">-</span>}
                                                        >
                                                            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200 truncate max-w-50">{item.unit_name}</p>
                                                            <Show when={item.unit_code}>
                                                                <p class="text-xs font-mono text-neutral-500 dark:text-neutral-400">{item.unit_code}</p>
                                                            </Show>
                                                        </Show>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
                                                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                                            {item.academic_year_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
                                                        {formatDate(item.registered)}
                                                    </td>
                                                    <td class="px-6 py-4 text-center">
                                                        <Show
                                                            when={item.status_name}
                                                            fallback={<span class="text-neutral-400 dark:text-neutral-600">-</span>}
                                                        >
                                                            <span class="inline-flex items-center justify-center h-6 px-2.5 text-[10px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                                {item.status_name}
                                                            </span>
                                                        </Show>
                                                    </td>
                                                    <td class="px-6 py-4 text-right">
                                                        <A
                                                            href={`/rectorat/institution/${institutionId()}/academic/student/master/student/${item.id}`}
                                                            id={`student-detail-btn-${item.id}`}
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

                    {/* Pagination */}
                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-3">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Menampilkan <span class="font-semibold text-neutral-900 dark:text-white">{totalData() > 0 ? startIndex() : 0}</span>–<span class="font-semibold text-neutral-900 dark:text-white">{endIndex()}</span> dari <span class="font-semibold text-neutral-900 dark:text-white">{totalData().toLocaleString()}</span> mahasiswa
                        </p>
                        <nav class="inline-flex -space-x-px rounded-lg overflow-hidden shadow-sm">
                            <button
                                type="button"
                                id="student-prev-page"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                disabled={currentPage() <= 1 || isLoading()}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Sebelumnya
                            </button>
                            <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-y border-neutral-300 dark:border-neutral-600">
                                {currentPage()} / {totalPages()}
                            </span>
                            <button
                                type="button"
                                id="student-next-page"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                disabled={currentPage() >= totalPages() || isLoading()}
                                onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
                            >
                                Selanjutnya
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
