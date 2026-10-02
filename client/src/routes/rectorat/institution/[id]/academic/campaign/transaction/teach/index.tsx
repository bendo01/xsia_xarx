import { createSignal, createEffect, For, Show, createMemo, onMount } from 'solid-js';
import { useParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import CampaignTransactionNavBar from '~/components/navigation/CampaignTransactionNavBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import {
    listTeaches,
    listCourses,
    listClassCodes,
    listActivities,
    type TeachItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';
import { InstitutionReferenceControllerUnitTypeIndex } from '~/controllers/institution/reference/InstitutionReferenceUnitTypeController';

interface UnitOption {
    id: string;
    name: string;
}

interface CourseOption {
    id: string;
    name: string;
    code: string;
    unit_id?: string;
    total_credit?: number;
}

interface ClassCodeOption {
    id: string;
    name: string;
    alphabet_code?: string;
    capacity?: number;
    unit_id?: string;
}

interface ActivityOption {
    id: string;
    name: string;
    academic_year_id?: string;
}

export default function RectoratInstitutionTeachIndex() {
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
    const [teaches, setTeaches] = createSignal<TeachItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters State
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedUnitId, setSelectedUnitId] = createSignal('');
    const [selectedActivityId, setSelectedActivityId] = createSignal('');
    const [selectedLockStatus, setSelectedLockStatus] = createSignal<'all' | 'locked' | 'unlocked'>('all');

    // Reference Options
    const [units, setUnits] = createSignal<UnitOption[]>([]);
    const [courses, setCourses] = createSignal<CourseOption[]>([]);
    const [classCodes, setClassCodes] = createSignal<ClassCodeOption[]>([]);
    const [activities, setActivities] = createSignal<ActivityOption[]>([]);

    // Quick Detail Modal State
    const [selectedItemForModal, setSelectedItemForModal] = createSignal<TeachItem | null>(null);

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

    // Load filter reference options
    const loadFilterOptions = async (instId: string) => {
        try {
            const prodiUnitTypeId = await resolveProdiUnitTypeId();
            const [unitsData, coursesData, classCodesData, activitiesData] = await Promise.all([
                getUnitOptions({ institution_id: instId, unit_type_id: prodiUnitTypeId }),
                listCourses({ page_size: 500 }),
                listClassCodes({ page_size: 200 }),
                listActivities({ page_size: 200 }),
            ]);

            if (Array.isArray(unitsData)) setUnits(unitsData);
            if (Array.isArray(coursesData)) setCourses(coursesData);
            if (Array.isArray(classCodesData)) setClassCodes(classCodesData);
            if (Array.isArray(activitiesData)) setActivities(activitiesData);
        } catch (e) {
            console.warn('Failed to load filter options for teach page:', e);
        }
    };

    // Resolve institution on load
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
            loadFilterOptions(instId);
        }
    });

    onMount(() => {
        const instId = institutionId();
        if (instId && isValidId(instId)) {
            loadFilterOptions(instId);
        }
    });

    // Fetch teaches list
    const fetchTeaches = async () => {
        const instId = institutionId();
        if (!instId || !isValidId(instId)) {
            setTeaches([]);
            setTotalData(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await listTeaches({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                activity_id: selectedActivityId() || undefined,
            });

            let list = res.data || [];

            // Client filter by Program Studi if selected
            if (selectedUnitId()) {
                const targetUnitId = selectedUnitId();
                list = list.filter((item) => {
                    const c = courses().find((course) => course.id === item.course_id);
                    if (c && c.unit_id === targetUnitId) return true;
                    const cc = classCodes().find((code) => code.id === item.class_code_id);
                    if (cc && cc.unit_id === targetUnitId) return true;
                    return false;
                });
            }

            // Client filter by Lock Status if selected
            if (selectedLockStatus() === 'locked') {
                list = list.filter((item) => Boolean(item.is_lock));
            } else if (selectedLockStatus() === 'unlocked') {
                list = list.filter((item) => !item.is_lock);
            }

            setTeaches(list);
            setTotalData(selectedUnitId() || selectedLockStatus() !== 'all' ? list.length : (res.total || list.length));
            setTotalPages(
                selectedUnitId() || selectedLockStatus() !== 'all'
                    ? Math.max(1, Math.ceil(list.length / itemsPerPage()))
                    : (res.total_pages || Math.max(1, Math.ceil((res.total || 0) / itemsPerPage())))
            );
        } catch (e) {
            console.error('Error fetching teaches:', e);
            toast.danger('Gagal memuat daftar aktivitas mengajar.');
            setTeaches([]);
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
        selectedActivityId();
        selectedLockStatus();
        fetchTeaches();
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
        const list = teaches();
        let totalEnrolled = 0;
        let totalCapacity = 0;
        let lockedCount = 0;
        const uniqueCourses = new Set<string>();

        for (const t of list) {
            totalEnrolled += t.enrolled_count || 0;
            totalCapacity += t.max_member || 0;
            if (t.is_lock) lockedCount++;
            if (t.course_id) uniqueCourses.add(t.course_id);
        }

        const avgCapacityRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

        return {
            totalEnrolled,
            totalCapacity,
            avgCapacityRate,
            lockedCount,
            unlockedCount: list.length - lockedCount,
            uniqueCoursesCount: uniqueCourses.size,
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
                            Aktivitas Mengajar
                        </span>
                    </nav>

                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden backdrop-blur-xs">
                        <div class="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6 relative z-10">
                            <div class="space-y-2">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider border border-blue-200 dark:border-blue-800/80">
                                    <span class="size-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span>Academic / Campaign / Transaction</span>
                                </div>
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                    Aktivitas Mengajar & Kelas Kuliah
                                </h1>
                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                    Manajemen penugasan kelas kuliah, alokasi mata kuliah, daya tampung mahasiswa, serta status penguncian nilai perkuliahan.
                                </p>
                            </div>

                            <div class="flex items-center gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={() => fetchTeaches()}
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
                    activeTab="teach"
                />

                {/* KPI Metrics Cards */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Card 1: Total Kelas */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total Kelas Kuliah</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {totalData()}
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Kelas Terjadwal</span>
                        </div>
                    </div>

                    {/* Card 2: Total Mahasiswa Terdaftar */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Peserta Terdaftar</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {summaryStats().totalEnrolled}
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Mahasiswa Mengambil</span>
                        </div>
                    </div>

                    {/* Card 3: Rata-rata Keterisian */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Tingkat Keterisian</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {summaryStats().avgCapacityRate}%
                            </span>
                            <span class="text-2xs sm:text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Dari Kuota Maksimal</span>
                        </div>
                    </div>

                    {/* Card 4: Status Kunci */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-purple-400 dark:hover:border-purple-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Status Kunci Nilai</span>
                            <div class="p-2 sm:p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-3 sm:mt-4 flex items-baseline gap-2">
                            <span class="text-xl sm:text-2xl lg:text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {summaryStats().lockedCount}
                            </span>
                            <span class="text-xs text-neutral-500 font-mono">
                                / {teaches().length} Terkunci
                            </span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div class="relative">
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Cari Kelas Kuliah
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    placeholder="Nama kelas atau kode..."
                                    onInput={handleSearchInput}
                                    value={searchQuery()}
                                    class="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all"
                                />
                                <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Program Studi / Unit Select */}
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Program Studi
                                </label>
                                <Show when={units().length > 0}>
                                    <span class="text-2xs font-mono text-neutral-400 dark:text-neutral-500">
                                        ({units().length} prodi)
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
                                    class={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer ${
                                        selectedUnitId()
                                            ? 'border-blue-500 dark:border-blue-400 pr-8 ring-1 ring-blue-500/20'
                                            : 'border-neutral-300 dark:border-neutral-700'
                                    }`}
                                >
                                    <option value="">Semua Program Studi</option>
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

                        {/* Semester / Aktivitas Select */}
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Semester / Aktivitas
                            </label>
                            <div class="relative">
                                <select
                                    value={selectedActivityId()}
                                    onChange={(e) => {
                                        setSelectedActivityId(e.currentTarget.value);
                                        setCurrentPage(1);
                                    }}
                                    class={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer ${
                                        selectedActivityId()
                                            ? 'border-blue-500 dark:border-blue-400 pr-8 ring-1 ring-blue-500/20'
                                            : 'border-neutral-300 dark:border-neutral-700'
                                    }`}
                                >
                                    <option value="">Semua Aktivitas</option>
                                    <For each={activities()}>
                                        {(act) => <option value={act.id}>{act.name}</option>}
                                    </For>
                                </select>
                                <Show when={selectedActivityId()}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedActivityId('');
                                            setCurrentPage(1);
                                        }}
                                        class="absolute right-8 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 text-xs px-1 cursor-pointer"
                                        title="Hapus filter Aktivitas"
                                    >
                                        ✕
                                    </button>
                                </Show>
                            </div>
                        </div>

                        {/* Status Kunci Nilai Filter */}
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Status Kunci Nilai
                            </label>
                            <select
                                value={selectedLockStatus()}
                                onChange={(e) => {
                                    setSelectedLockStatus(e.currentTarget.value as any);
                                    setCurrentPage(1);
                                }}
                                class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="all">Semua Status</option>
                                <option value="unlocked">Terbuka (Dapat Diinput)</option>
                                <option value="locked">Terkunci (Final)</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filter Tags */}
                    <Show when={searchQuery() || selectedUnitId() || selectedActivityId() || selectedLockStatus() !== 'all'}>
                        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                            <span class="text-neutral-500 dark:text-neutral-400 font-medium">Filter Aktif:</span>
                            <Show when={searchQuery()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    Pencarian: "{searchQuery()}"
                                    <button onClick={() => setSearchQuery('')} class="hover:text-blue-900 dark:hover:text-white ml-0.5 cursor-pointer">×</button>
                                </span>
                            </Show>
                            <Show when={selectedUnitId()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Prodi: {units().find((u) => u.id === selectedUnitId())?.name || selectedUnitId()}
                                    <button onClick={() => setSelectedUnitId('')} class="hover:text-purple-900 dark:hover:text-white ml-0.5 cursor-pointer">×</button>
                                </span>
                            </Show>
                            <Show when={selectedActivityId()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                    Aktivitas: {activities().find((a) => a.id === selectedActivityId())?.name || selectedActivityId()}
                                    <button onClick={() => setSelectedActivityId('')} class="hover:text-amber-900 dark:hover:text-white ml-0.5 cursor-pointer">×</button>
                                </span>
                            </Show>
                            <Show when={selectedLockStatus() !== 'all'}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700">
                                    Status: {selectedLockStatus() === 'locked' ? 'Terkunci' : 'Terbuka'}
                                    <button onClick={() => setSelectedLockStatus('all')} class="hover:text-red-500 ml-0.5 cursor-pointer">×</button>
                                </span>
                            </Show>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedUnitId('');
                                    setSelectedActivityId('');
                                    setSelectedLockStatus('all');
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
                    {/* Desktop Table View */}
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full text-left text-sm">
                            <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                <tr>
                                    <th class="px-6 py-4">Kelas & Mata Kuliah</th>
                                    <th class="px-6 py-4">Program Studi & Semester</th>
                                    <th class="px-6 py-4">Kapasitas Mahasiswa</th>
                                    <th class="px-6 py-4 text-center">Status Kunci</th>
                                    <th class="px-6 py-4">Masa Kuliah</th>
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
                                                    <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                                    <span class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                                        Memuat data kelas mengajar...
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                >
                                    <Show
                                        when={teaches().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="6" class="px-6 py-16 text-center">
                                                    <div class="max-w-sm mx-auto flex flex-col items-center">
                                                        <div class="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
                                                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                            </svg>
                                                        </div>
                                                        <h3 class="text-base font-bold text-neutral-900 dark:text-white mb-1">
                                                            Tidak ada kelas mengajar ditemukan
                                                        </h3>
                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                                                            Tidak ada data penugasan kelas yang cocok dengan filter atau kata kunci saat ini.
                                                        </p>
                                                        <Show when={searchQuery() || selectedUnitId() || selectedActivityId() || selectedLockStatus() !== 'all'}>
                                                            <button
                                                                onClick={() => {
                                                                    setSearchQuery('');
                                                                    setSelectedUnitId('');
                                                                    setSelectedActivityId('');
                                                                    setSelectedLockStatus('all');
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
                                        <For each={teaches()}>
                                            {(item) => {
                                                const course = courses().find((c) => c.id === item.course_id);
                                                const classCode = classCodes().find((cc) => cc.id === item.class_code_id);
                                                const activity = activities().find((a) => a.id === item.activity_id);
                                                const unit = units().find((u) => u.id === course?.unit_id || u.id === classCode?.unit_id);
                                                const enrolled = item.enrolled_count || 0;
                                                const maxCapacity = item.max_member || classCode?.capacity || 0;
                                                const fillPercentage = maxCapacity > 0 ? Math.min(100, Math.round((enrolled / maxCapacity) * 100)) : 0;

                                                return (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                        {/* Class Name & Course Info */}
                                                        <td class="px-6 py-4">
                                                            <div class="flex items-start gap-3">
                                                                <div class="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center font-mono font-bold text-sm text-blue-700 dark:text-blue-300 shrink-0 shadow-2xs">
                                                                    {classCode?.alphabet_code || 'KL'}
                                                                </div>
                                                                <div class="space-y-0.5">
                                                                    <A
                                                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach/${item.id}`}
                                                                        class="font-semibold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block text-sm"
                                                                    >
                                                                        {item.name || course?.name || 'Kelas Perkuliahan'}
                                                                    </A>
                                                                    <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                                                        <span class="font-mono text-neutral-700 dark:text-neutral-300 font-medium">
                                                                            {course?.code || 'KODE-MK'}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span>{course?.name || 'Mata Kuliah'}</span>
                                                                        <Show when={course?.total_credit}>
                                                                            <span class="px-1.5 py-0.5 rounded text-2xs bg-neutral-100 dark:bg-neutral-800 font-mono">
                                                                                {course?.total_credit} SKS
                                                                            </span>
                                                                        </Show>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Unit & Semester */}
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-1">
                                                                <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                                                    {unit?.name || 'Program Studi Terdaftar'}
                                                                </div>
                                                                <div class="text-2xs text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5 font-mono">
                                                                    <svg class="size-3 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
                                                                    </svg>
                                                                    <span>{activity?.name || 'Semester Aktif'}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Capacity & Enrolled */}
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-1.5 w-36">
                                                                <div class="flex items-center justify-between text-xs font-mono">
                                                                    <span class="font-bold text-neutral-900 dark:text-white">
                                                                        {enrolled} <span class="text-neutral-400 font-normal">/</span> {maxCapacity}
                                                                    </span>
                                                                    <span class="text-2xs font-semibold text-neutral-500">
                                                                        {fillPercentage}%
                                                                    </span>
                                                                </div>
                                                                <div class="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        class={`h-full rounded-full transition-all duration-300 ${
                                                                            fillPercentage >= 90
                                                                                ? 'bg-rose-500'
                                                                                : fillPercentage >= 70
                                                                                ? 'bg-amber-500'
                                                                                : 'bg-blue-500'
                                                                        }`}
                                                                        style={{ width: `${fillPercentage}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Status Lock */}
                                                        <td class="px-6 py-4 text-center">
                                                            <Show
                                                                when={item.is_lock}
                                                                fallback={
                                                                    <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                                                        <span class="size-1.5 rounded-full bg-emerald-500" />
                                                                        Terbuka
                                                                    </span>
                                                                }
                                                            >
                                                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                                                    <svg class="size-3 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                                    </svg>
                                                                    Terkunci
                                                                </span>
                                                            </Show>
                                                        </td>

                                                        {/* Effective Dates */}
                                                        <td class="px-6 py-4">
                                                            <div class="text-xs space-y-0.5 font-mono">
                                                                <Show
                                                                    when={item.start_date || item.end_date}
                                                                    fallback={<span class="text-neutral-400">Jadwal Reguler</span>}
                                                                >
                                                                    <div class="text-neutral-800 dark:text-neutral-200">
                                                                        {formatDate(item.start_date)}
                                                                    </div>
                                                                    <div class="text-neutral-500 dark:text-neutral-400 text-2xs">
                                                                        s/d {item.end_date ? formatDate(item.end_date) : 'Selesai'}
                                                                    </div>
                                                                </Show>
                                                            </div>
                                                        </td>

                                                        {/* Actions */}
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
                                                                    href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach/${item.id}`}
                                                                    class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200 dark:border-blue-800/80 transition-all hover:scale-105"
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
                                        <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                            Memuat data kelas mengajar...
                                        </span>
                                    </div>
                                </div>
                            }
                        >
                            <Show
                                when={teaches().length > 0}
                                fallback={
                                    <div class="p-8 text-center">
                                        <div class="max-w-xs mx-auto flex flex-col items-center">
                                            <div class="size-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2.5">
                                                <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                </svg>
                                            </div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                                                Tidak ada kelas ditemukan
                                            </h3>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
                                                Tidak ada rekaman data sesuai filter saat ini.
                                            </p>
                                            <Show when={searchQuery() || selectedUnitId() || selectedActivityId() || selectedLockStatus() !== 'all'}>
                                                <button
                                                    onClick={() => {
                                                        setSearchQuery('');
                                                        setSelectedUnitId('');
                                                        setSelectedActivityId('');
                                                        setSelectedLockStatus('all');
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
                                <For each={teaches()}>
                                    {(item) => {
                                        const course = courses().find((c) => c.id === item.course_id);
                                        const classCode = classCodes().find((cc) => cc.id === item.class_code_id);
                                        const activity = activities().find((a) => a.id === item.activity_id);
                                        const unit = units().find((u) => u.id === course?.unit_id || u.id === classCode?.unit_id);
                                        const enrolled = item.enrolled_count || 0;
                                        const maxCapacity = item.max_member || classCode?.capacity || 0;
                                        const fillPercentage = maxCapacity > 0 ? Math.min(100, Math.round((enrolled / maxCapacity) * 100)) : 0;

                                        return (
                                            <div class="p-4 sm:p-5 space-y-3.5 hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30 transition-colors">
                                                {/* Header row: Alphabet badge + Class/Course name + Lock status */}
                                                <div class="flex items-start justify-between gap-3">
                                                    <div class="flex items-start gap-3 min-w-0">
                                                        <div class="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center font-mono font-bold text-sm text-blue-700 dark:text-blue-300 shrink-0 shadow-2xs">
                                                            {classCode?.alphabet_code || 'KL'}
                                                        </div>
                                                        <div class="min-w-0">
                                                            <A
                                                                href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach/${item.id}`}
                                                                class="font-bold text-sm text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-1"
                                                            >
                                                                {item.name || course?.name || 'Kelas Perkuliahan'}
                                                            </A>
                                                            <div class="flex items-center gap-1.5 text-2xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                                <span class="font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                                                                    {course?.code || 'KODE-MK'}
                                                                </span>
                                                                <span>•</span>
                                                                <span class="truncate max-w-[130px]">{course?.name || 'Mata Kuliah'}</span>
                                                                <Show when={course?.total_credit}>
                                                                    <span>({course?.total_credit} SKS)</span>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div class="shrink-0 text-right">
                                                        <Show
                                                            when={item.is_lock}
                                                            fallback={
                                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                                                    <span class="size-1.5 rounded-full bg-emerald-500" />
                                                                    Terbuka
                                                                </span>
                                                            }
                                                        >
                                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                                                Terkunci
                                                            </span>
                                                        </Show>
                                                    </div>
                                                </div>

                                                {/* Unit & Semester Metadata */}
                                                <div class="grid grid-cols-2 gap-2 text-xs">
                                                    <div class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 space-y-0.5">
                                                        <span class="text-2xs text-neutral-400 uppercase tracking-wider block font-semibold">Program Studi</span>
                                                        <p class="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                                                            {unit?.name || 'Program Studi Terdaftar'}
                                                        </p>
                                                    </div>
                                                    <div class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-100 dark:border-neutral-800/80 space-y-0.5">
                                                        <span class="text-2xs text-neutral-400 uppercase tracking-wider block font-semibold">Semester / Aktivitas</span>
                                                        <p class="font-mono text-neutral-800 dark:text-neutral-200 truncate">
                                                            {activity?.name || 'Semester Aktif'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Capacity progress */}
                                                <div class="space-y-1.5">
                                                    <div class="flex items-center justify-between text-xs font-mono">
                                                        <span class="text-neutral-500 text-2xs uppercase tracking-wider">Kapasitas Mahasiswa:</span>
                                                        <span class="font-bold text-neutral-900 dark:text-white">
                                                            {enrolled} / {maxCapacity} ({fillPercentage}%)
                                                        </span>
                                                    </div>
                                                    <div class="w-full h-1.5 bg-neutral-200/80 dark:bg-neutral-700/80 rounded-full overflow-hidden">
                                                        <div
                                                            class={`h-full rounded-full ${
                                                                fillPercentage >= 90
                                                                    ? 'bg-rose-500'
                                                                    : fillPercentage >= 70
                                                                    ? 'bg-amber-500'
                                                                    : 'bg-blue-500'
                                                            }`}
                                                            style={{ width: `${fillPercentage}%` }}
                                                        />
                                                    </div>
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
                                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach/${item.id}`}
                                                        class="flex-1 py-2 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-semibold text-xs text-center inline-flex items-center justify-center gap-1.5 border border-blue-200 dark:border-blue-800/80 transition-colors"
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
                {(item) => {
                    const course = courses().find((c) => c.id === item().course_id);
                    const classCode = classCodes().find((cc) => cc.id === item().class_code_id);
                    const activity = activities().find((a) => a.id === item().activity_id);
                    const unit = units().find((u) => u.id === course?.unit_id || u.id === classCode?.unit_id);
                    const enrolled = item().enrolled_count || 0;
                    const maxCapacity = item().max_member || classCode?.capacity || 0;

                    return (
                        <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl max-w-lg w-full border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-y-auto max-h-[90vh] p-5 sm:p-6 space-y-5 sm:space-y-6">
                                <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                                    <div class="flex items-center gap-3">
                                        <div class="size-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center font-bold text-base text-blue-700 dark:text-blue-300">
                                            {classCode?.alphabet_code || 'KL'}
                                        </div>
                                        <div>
                                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                                {item().name || course?.name || 'Detail Kelas Kuliah'}
                                            </h3>
                                            <p class="text-xs text-neutral-500 font-mono">
                                                {course?.code ? `${course.code} • ${course.name}` : `ID: ${item().id}`}
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
                                            {unit?.name || 'Tidak tercatat'}
                                        </p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                        <span class="text-neutral-500 text-2xs uppercase">Bobot SKS</span>
                                        <p class="font-bold text-blue-600 dark:text-blue-400 font-mono">
                                            {course?.total_credit ? `${course.total_credit} SKS` : 'Tidak tercatat'}
                                        </p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                        <span class="text-neutral-500 text-2xs uppercase">Mahasiswa Terdaftar</span>
                                        <p class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            {enrolled} / {maxCapacity} Mahasiswa
                                        </p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                        <span class="text-neutral-500 text-2xs uppercase">Status Kunci Nilai</span>
                                        <p class="font-semibold text-neutral-800 dark:text-neutral-200">
                                            {item().is_lock ? 'Terkunci (Final)' : 'Terbuka (Input Aktif)'}
                                        </p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                        <span class="text-neutral-500 text-2xs uppercase">Mulai Kuliah</span>
                                        <p class="font-mono text-neutral-800 dark:text-neutral-200">
                                            {formatDate(item().start_date)}
                                        </p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1">
                                        <span class="text-neutral-500 text-2xs uppercase">Akhir Kuliah</span>
                                        <p class="font-mono text-neutral-800 dark:text-neutral-200">
                                            {formatDate(item().end_date)}
                                        </p>
                                    </div>
                                </div>

                                <Show when={item().description}>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 space-y-1 text-xs">
                                        <span class="text-neutral-500 text-2xs uppercase">Deskripsi / Catatan</span>
                                        <p class="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                            {item().description}
                                        </p>
                                    </div>
                                </Show>

                                <div class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 sm:gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedItemForModal(null)}
                                        class="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-center cursor-pointer transition-colors"
                                    >
                                        Tutup
                                    </button>
                                    <A
                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach/${item().id}`}
                                        class="w-full sm:w-auto px-4 py-2.5 sm:py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white text-center transition-colors"
                                    >
                                        Buka Halaman Lengkap
                                    </A>
                                </div>
                            </div>
                        </div>
                    );
                }}
            </Show>
        </div>
    );
}
