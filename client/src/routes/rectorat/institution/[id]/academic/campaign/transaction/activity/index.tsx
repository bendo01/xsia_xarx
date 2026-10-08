import { createSignal, createEffect, For, Show, createMemo, onMount } from 'solid-js';
import { useParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import CampaignTransactionNavBar from '~/components/navigation/CampaignTransactionNavBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import {
    listActivities,
    type CampaignActivityItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';
import { getAcademicYearOptions } from '~/controllers/academic/general/reference/AcademicGeneralReferenceAcademicYearController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';
import { InstitutionReferenceControllerUnitTypeIndex } from '~/controllers/institution/reference/InstitutionReferenceUnitTypeController';

interface UnitOption {
    id: string;
    name: string;
}

interface AcademicYearOption {
    id: string;
    name: string;
}

export default function RectoratInstitutionActivityIndex() {
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
    const [activities, setActivities] = createSignal<CampaignActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters State
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedUnitId, setSelectedUnitId] = createSignal('');
    const [selectedAcademicYearId, setSelectedAcademicYearId] = createSignal('');
    const [selectedStatus, setSelectedStatus] = createSignal<'all' | 'active' | 'inactive'>('all');

    // Options
    const [units, setUnits] = createSignal<UnitOption[]>([]);
    const [academicYears, setAcademicYears] = createSignal<AcademicYearOption[]>([]);

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

    // Load filter options (Units via units::option_select filtered by PRODI unit type, and Academic Years via academic_years::option_select)
    const loadFilterOptions = async (instId: string) => {
        try {
            const prodiUnitTypeId = await resolveProdiUnitTypeId();
            const [unitsData, ayData] = await Promise.all([
                getUnitOptions({ institution_id: instId, unit_type_id: prodiUnitTypeId }),
                getAcademicYearOptions(),
            ]);

            if (Array.isArray(unitsData)) {
                setUnits(unitsData);
            }
            if (Array.isArray(ayData)) {
                setAcademicYears(ayData);
            }
        } catch (e) {
            console.warn('Failed to load filter options:', e);
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
            loadFilterOptions(instId);
        }
    });

    onMount(() => {
        const instId = institutionId();
        if (instId && isValidId(instId)) {
            loadFilterOptions(instId);
        }
    });

    // Fetch activities
    const fetchActivities = async () => {
        const instId = institutionId();
        if (!instId || !isValidId(instId)) {
            setActivities([]);
            setTotalData(0);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await listActivities({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                unit_id: selectedUnitId() || undefined,
                academic_year_id: selectedAcademicYearId() || undefined,
                institution_id: instId,
            });

            let items = res.data || [];

            // Client-side filter for status if selected
            if (selectedStatus() === 'active') {
                items = items.filter((a) => a.is_active === true);
            } else if (selectedStatus() === 'inactive') {
                items = items.filter((a) => a.is_active === false);
            }

            setActivities(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
        } catch (e) {
            console.error('Error fetching activities:', e);
            toast.danger('Gagal memuat daftar aktivitas kampanye.');
            setActivities([]);
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
        selectedAcademicYearId();
        selectedStatus();
        fetchActivities();
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
        const list = activities();
        let target = 0;
        let candidates = 0;
        let passed = 0;
        let became = 0;
        let transfers = 0;

        for (const a of list) {
            target += a.student_target || 0;
            candidates += a.candidate_number || 0;
            passed += a.candidate_pass || 0;
            became += a.became_student || 0;
            transfers += a.transfer_student || 0;
        }

        const targetPercentage = target > 0 ? Math.min(100, Math.round((became / target) * 100)) : 0;

        return {
            target,
            candidates,
            passed,
            became,
            transfers,
            targetPercentage,
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

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8 space-y-6 sm:space-y-8">
                {/* Header & Breadcrumb */}
                <div class="space-y-3 sm:space-y-4">
                    <nav class="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 overflow-x-auto scrollbar-none whitespace-nowrap py-1">
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
                            Aktivitas Kampanye
                        </span>
                    </nav>

                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden backdrop-blur-xs">
                        <div class="absolute -right-16 -top-16 w-64 h-64 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 relative z-10">
                            <div class="space-y-1.5 sm:space-y-2">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-2xs sm:text-xs font-semibold uppercase tracking-wider border border-blue-200 dark:border-blue-800/80">
                                    <span class="size-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span>Academic / Campaign / Transaction</span>
                                </div>
                                <h1 class="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                    Aktivitas Transaksi Akademik
                                </h1>
                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                    Monitoring dan kelola aktivitas kampanye penerimaan dan registrasi mahasiswa per Program Studi pada institusi ini.
                                </p>
                            </div>

                            <div class="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => fetchActivities()}
                                    class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs sm:text-sm font-medium transition-all shadow-2xs hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
                    activeTab="activity"
                />

                {/* KPI Metrics Cards */}
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                    {/* Card 1: Total Activities */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-blue-400 dark:hover:border-blue-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Total Aktivitas</span>
                            <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4">
                            <span class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {totalData()}
                            </span>
                            <span class="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Entitas Terdaftar</span>
                        </div>
                    </div>

                    {/* Card 2: Target Mahasiswa */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-indigo-400 dark:hover:border-indigo-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Target Siswa</span>
                            <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4">
                            <span class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {summaryStats().target.toLocaleString('id-ID')}
                            </span>
                            <span class="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Kuota Ditargetkan</span>
                        </div>
                    </div>

                    {/* Card 3: Pendaftar Calon */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-amber-400 dark:hover:border-amber-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Pendaftar</span>
                            <div class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4">
                            <span class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {summaryStats().candidates.toLocaleString('id-ID')}
                            </span>
                            <span class="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Calon Mengisi Formulir</span>
                        </div>
                    </div>

                    {/* Card 4: Lolos Seleksi */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-emerald-400 dark:hover:border-emerald-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Lolos Seleksi</span>
                            <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4">
                            <span class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                {summaryStats().passed.toLocaleString('id-ID')}
                            </span>
                            <span class="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Kandidat Diterima</span>
                        </div>
                    </div>

                    {/* Card 5: Menjadi Mahasiswa */}
                    <div class="col-span-2 lg:col-span-1 bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs relative overflow-hidden group hover:border-teal-400 dark:hover:border-teal-700 transition-all duration-200">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Mahasiswa Baru</span>
                            <div class="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800/60">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                </svg>
                            </div>
                        </div>
                        <div class="mt-4">
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white">
                                    {summaryStats().became.toLocaleString('id-ID')}
                                </span>
                                <span class="text-xs font-semibold text-teal-600 dark:text-teal-400">
                                    {summaryStats().targetPercentage}% kuota
                                </span>
                            </div>
                            <span class="text-xs text-neutral-500 dark:text-neutral-400 block mt-0.5">Tuntas Daftar Ulang</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search Input */}
                        <div class="relative">
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Cari Aktivitas
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    placeholder="Ketik nama aktivitas..."
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

                        {/* Unit / Prodi Dropdown */}
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Program Studi / Unit
                                </label>
                                <Show when={units().length > 0}>
                                    <span class="text-2xs font-mono text-neutral-400 dark:text-neutral-500">
                                        ({units().length})
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
                                    class={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer ${selectedUnitId()
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
                                        class="absolute right-8 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 text-xs px-1"
                                        title="Hapus filter Program Studi"
                                    >
                                        ✕
                                    </button>
                                </Show>
                            </div>
                        </div>

                        {/* Academic Year Dropdown */}
                        <div>
                            <div class="flex items-center justify-between mb-1.5">
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    Tahun Akademik
                                </label>
                                <Show when={academicYears().length > 0}>
                                    <span class="text-2xs font-mono text-neutral-400 dark:text-neutral-500">
                                        ({academicYears().length})
                                    </span>
                                </Show>
                            </div>
                            <div class="relative">
                                <select
                                    value={selectedAcademicYearId()}
                                    onChange={(e) => {
                                        setSelectedAcademicYearId(e.currentTarget.value);
                                        setCurrentPage(1);
                                    }}
                                    class={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer ${selectedAcademicYearId()
                                            ? 'border-purple-500 dark:border-purple-400 pr-8 ring-1 ring-purple-500/20'
                                            : 'border-neutral-300 dark:border-neutral-700'
                                        }`}
                                >
                                    <option value="">Semua Tahun Akademik</option>
                                    <For each={academicYears()}>
                                        {(ay) => <option value={ay.id}>{ay.name}</option>}
                                    </For>
                                </select>
                                <Show when={selectedAcademicYearId()}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedAcademicYearId('');
                                            setCurrentPage(1);
                                        }}
                                        class="absolute right-8 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-red-500 text-xs px-1"
                                        title="Hapus filter Tahun Akademik"
                                    >
                                        ✕
                                    </button>
                                </Show>
                            </div>
                        </div>

                        {/* Status Dropdown */}
                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                                Status
                            </label>
                            <select
                                value={selectedStatus()}
                                onChange={(e) => {
                                    setSelectedStatus(e.currentTarget.value as any);
                                    setCurrentPage(1);
                                }}
                                class="w-full px-3.5 py-2.5 rounded-xl text-sm bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all cursor-pointer"
                            >
                                <option value="all">Semua Status</option>
                                <option value="active">Aktif Saja</option>
                                <option value="inactive">Non-aktif Saja</option>
                            </select>
                        </div>
                    </div>

                    {/* Active Filters Bar */}
                    <Show when={searchQuery() || selectedUnitId() || selectedAcademicYearId() || selectedStatus() !== 'all'}>
                        <div class="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-xs">
                            <span class="text-neutral-500 dark:text-neutral-400 font-medium">Filter Aktif:</span>
                            <Show when={searchQuery()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                    Cari: "{searchQuery()}"
                                    <button onClick={() => setSearchQuery('')} class="hover:text-blue-900 dark:hover:text-white ml-0.5">×</button>
                                </span>
                            </Show>
                            <Show when={selectedUnitId()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    Unit: {units().find((u) => u.id === selectedUnitId())?.name || selectedUnitId()}
                                    <button onClick={() => setSelectedUnitId('')} class="hover:text-indigo-900 dark:hover:text-white ml-0.5">×</button>
                                </span>
                            </Show>
                            <Show when={selectedAcademicYearId()}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                    Tahun: {academicYears().find((ay) => ay.id === selectedAcademicYearId())?.name || selectedAcademicYearId()}
                                    <button onClick={() => setSelectedAcademicYearId('')} class="hover:text-purple-900 dark:hover:text-white ml-0.5">×</button>
                                </span>
                            </Show>
                            <Show when={selectedStatus() !== 'all'}>
                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                    Status: {selectedStatus() === 'active' ? 'Aktif' : 'Non-aktif'}
                                    <button onClick={() => setSelectedStatus('all')} class="hover:text-emerald-900 dark:hover:text-white ml-0.5">×</button>
                                </span>
                            </Show>
                            <button
                                onClick={() => {
                                    setSearchQuery('');
                                    setSelectedUnitId('');
                                    setSelectedAcademicYearId('');
                                    setSelectedStatus('all');
                                    setCurrentPage(1);
                                }}
                                class="text-neutral-500 hover:text-red-600 dark:hover:text-red-400 font-medium ml-2 underline cursor-pointer"
                            >
                                Reset Semua
                            </button>
                        </div>
                    </Show>
                </div>

                {/* Data Table & Mobile Card List Container */}
                <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="px-6 py-16 text-center">
                                <div class="flex flex-col items-center justify-center gap-3">
                                    <div class="size-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                    <span class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">
                                        Memuat data aktivitas...
                                    </span>
                                </div>
                            </div>
                        }
                    >
                        <Show
                            when={activities().length > 0}
                            fallback={
                                <div class="px-6 py-16 text-center">
                                    <div class="max-w-sm mx-auto flex flex-col items-center">
                                        <div class="size-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3 shadow-inner">
                                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                            </svg>
                                        </div>
                                        <h3 class="text-base font-bold text-neutral-900 dark:text-white mb-1">
                                            Tidak ada aktivitas ditemukan
                                        </h3>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                                            Tidak ada rekaman data aktivitas transaksi pada scope institusi ini dengan filter yang dipilih.
                                        </p>
                                        <Show when={searchQuery() || selectedUnitId() || selectedAcademicYearId() || selectedStatus() !== 'all'}>
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setSelectedUnitId('');
                                                    setSelectedAcademicYearId('');
                                                    setSelectedStatus('all');
                                                }}
                                                class="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer"
                                            >
                                                Hapus Filter
                                            </button>
                                        </Show>
                                    </div>
                                </div>
                            }
                        >
                            {/* Desktop Table View (md and above) */}
                            <div class="hidden md:block overflow-x-auto">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        <tr>
                                            <th class="px-6 py-4">Aktivitas & Durasi</th>
                                            <th class="px-6 py-4">Program Studi</th>
                                            <th class="px-6 py-4">Tahun Akademik</th>
                                            <th class="px-6 py-4">Realisasi Target</th>
                                            <th class="px-6 py-4">Periode Transaksi</th>
                                            <th class="px-6 py-4 text-center">Status</th>
                                            <th class="px-6 py-4 text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                        <For each={activities()}>
                                            {(item) => {
                                                const target = item.student_target || 0;
                                                const became = item.became_student || 0;
                                                const percentage = target > 0 ? Math.min(100, Math.round((became / target) * 100)) : 0;

                                                return (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                        {/* Activity Name & Period */}
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-1">
                                                                <A
                                                                    href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity/${item.id}`}
                                                                    class="font-semibold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block text-base"
                                                                >
                                                                    {item.name}
                                                                </A>
                                                                <div class="flex flex-wrap items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                                                                    <Show when={item.week_quantity}>
                                                                        <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono text-2xs">
                                                                            {item.week_quantity} Minggu
                                                                        </span>
                                                                    </Show>
                                                                    <Show when={item.start_date || item.end_date}>
                                                                        <span class="font-mono text-2xs">
                                                                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                                                        </span>
                                                                    </Show>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Program Studi / Unit */}
                                                        <td class="px-6 py-4">
                                                            <div class="flex items-center gap-2">
                                                                <div class="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                                                    </svg>
                                                                </div>
                                                                <span class="font-medium text-neutral-800 dark:text-neutral-200">
                                                                    {item.unit_name || units().find((u) => u.id === item.unit_id)?.name || 'Unit Terdaftar'}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Academic Year */}
                                                        <td class="px-6 py-4">
                                                            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 font-medium text-xs">
                                                                <span class="size-1.5 rounded-full bg-purple-500" />
                                                                {item.academic_year_name || academicYears().find((ay) => ay.id === item.academic_year_id)?.name || 'Tahun Akademik'}
                                                            </span>
                                                        </td>

                                                        {/* Target vs Realisasi */}
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-1.5 min-w-[150px]">
                                                                <div class="flex items-center justify-between text-xs">
                                                                    <span class="font-semibold text-neutral-900 dark:text-white">
                                                                        {became} <span class="font-normal text-neutral-400">/ {target} Mhs</span>
                                                                    </span>
                                                                    <span class="font-mono text-2xs font-semibold text-neutral-600 dark:text-neutral-300">
                                                                        {percentage}%
                                                                    </span>
                                                                </div>
                                                                {/* Progress Bar */}
                                                                <div class="w-full h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                                                    <div
                                                                        class={`h-full rounded-full transition-all duration-300 ${percentage >= 100
                                                                                ? 'bg-emerald-500'
                                                                                : percentage >= 75
                                                                                    ? 'bg-blue-500'
                                                                                    : percentage >= 50
                                                                                        ? 'bg-amber-500'
                                                                                        : 'bg-indigo-500'
                                                                            }`}
                                                                        style={{ width: `${percentage}%` }}
                                                                    />
                                                                </div>
                                                                <div class="flex items-center gap-2 text-2xs text-neutral-400 font-mono">
                                                                    <span>Pendaftar: {item.candidate_number || 0}</span>
                                                                    <span>•</span>
                                                                    <span>Lolos: {item.candidate_pass || 0}</span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Periode Transaksi */}
                                                        <td class="px-6 py-4">
                                                            <div class="font-mono text-xs text-neutral-600 dark:text-neutral-300">
                                                                <div>{formatDate(item.start_transaction)}</div>
                                                                <div class="text-neutral-400 text-2xs">s/d {formatDate(item.end_transaction)}</div>
                                                            </div>
                                                        </td>

                                                        {/* Status */}
                                                        <td class="px-6 py-4 text-center">
                                                            <Show
                                                                when={item.is_active !== false}
                                                                fallback={
                                                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium border border-neutral-300 dark:border-neutral-700">
                                                                        <span class="size-1.5 rounded-full bg-neutral-400" />
                                                                        Non-aktif
                                                                    </span>
                                                                }
                                                            >
                                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                                                                    <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                                    Aktif
                                                                </span>
                                                            </Show>
                                                        </td>

                                                        {/* Actions */}
                                                        <td class="px-6 py-4 text-right">
                                                            <A
                                                                href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity/${item.id}`}
                                                                class="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 text-xs font-semibold transition-all border border-blue-200/80 dark:border-blue-800/60 group-hover:shadow-xs"
                                                            >
                                                                <span>Detail</span>
                                                                <svg class="size-3.5 transform group-hover:translate-x-0.5 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                                </svg>
                                                            </A>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List View (below md) */}
                            <div class="block md:hidden divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                <For each={activities()}>
                                    {(item) => {
                                        const target = item.student_target || 0;
                                        const became = item.became_student || 0;
                                        const percentage = target > 0 ? Math.min(100, Math.round((became / target) * 100)) : 0;
                                        const unitName = item.unit_name || units().find((u) => u.id === item.unit_id)?.name || 'Unit Terdaftar';
                                        const yearName = item.academic_year_name || academicYears().find((ay) => ay.id === item.academic_year_id)?.name || 'Tahun Akademik';

                                        return (
                                            <div class="p-4 sm:p-5 flex flex-col gap-3.5 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/30 transition-colors">
                                                {/* Top row: Status & Year badge */}
                                                <div class="flex items-center justify-between gap-2">
                                                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/50 font-medium text-xs">
                                                        <span class="size-1.5 rounded-full bg-purple-500" />
                                                        {yearName}
                                                    </span>

                                                    <Show
                                                        when={item.is_active !== false}
                                                        fallback={
                                                            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-medium border border-neutral-300 dark:border-neutral-700">
                                                                <span class="size-1.5 rounded-full bg-neutral-400" />
                                                                Non-aktif
                                                            </span>
                                                        }
                                                    >
                                                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-medium border border-emerald-200 dark:border-emerald-800">
                                                            <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            Aktif
                                                        </span>
                                                    </Show>
                                                </div>

                                                {/* Activity Name & Unit */}
                                                <div class="space-y-1">
                                                    <A
                                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity/${item.id}`}
                                                        class="font-bold text-base text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-snug block"
                                                    >
                                                        {item.name}
                                                    </A>
                                                    <div class="flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                                                        <svg class="size-3.5 text-blue-500 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                                        </svg>
                                                        <span class="font-medium text-neutral-700 dark:text-neutral-300">{unitName}</span>
                                                    </div>
                                                </div>

                                                {/* Target & Realisasi Card */}
                                                <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 space-y-2">
                                                    <div class="flex items-center justify-between text-xs">
                                                        <span class="font-medium text-neutral-500 dark:text-neutral-400">
                                                            Realisasi Kuota
                                                        </span>
                                                        <span class="font-mono font-bold text-neutral-900 dark:text-white">
                                                            {became} / {target} Mhs ({percentage}%)
                                                        </span>
                                                    </div>
                                                    <div class="w-full h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                        <div
                                                            class={`h-full rounded-full transition-all duration-300 ${
                                                                percentage >= 100
                                                                    ? 'bg-emerald-500'
                                                                    : percentage >= 75
                                                                        ? 'bg-blue-500'
                                                                        : percentage >= 50
                                                                            ? 'bg-amber-500'
                                                                            : 'bg-indigo-500'
                                                            }`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                    <div class="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
                                                        <div class="p-1.5 rounded-lg bg-white dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                            <span class="text-2xs text-neutral-400 block">Target</span>
                                                            <span class="font-bold text-neutral-800 dark:text-neutral-200">{target}</span>
                                                        </div>
                                                        <div class="p-1.5 rounded-lg bg-white dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                            <span class="text-2xs text-neutral-400 block">Pendaftar</span>
                                                            <span class="font-bold text-neutral-800 dark:text-neutral-200">{item.candidate_number || 0}</span>
                                                        </div>
                                                        <div class="p-1.5 rounded-lg bg-white dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                            <span class="text-2xs text-neutral-400 block">Lolos</span>
                                                            <span class="font-bold text-emerald-600 dark:text-emerald-400">{item.candidate_pass || 0}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Date Info */}
                                                <div class="grid grid-cols-2 gap-2 text-xs font-mono">
                                                    <div class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50">
                                                        <span class="text-2xs uppercase text-neutral-400 block font-semibold">Periode Aktivitas</span>
                                                        <span class="text-neutral-800 dark:text-neutral-200 block text-2xs mt-0.5">
                                                            {formatDate(item.start_date)} - {formatDate(item.end_date)}
                                                        </span>
                                                        <Show when={item.week_quantity}>
                                                            <span class="text-2xs text-blue-600 dark:text-blue-400 font-semibold mt-0.5 block">
                                                                {item.week_quantity} Minggu
                                                            </span>
                                                        </Show>
                                                    </div>
                                                    <div class="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/50 dark:border-neutral-700/50">
                                                        <span class="text-2xs uppercase text-neutral-400 block font-semibold">Periode Transaksi</span>
                                                        <span class="text-neutral-800 dark:text-neutral-200 block text-2xs mt-0.5">
                                                            {formatDate(item.start_transaction)}
                                                        </span>
                                                        <span class="text-2xs text-neutral-400 block">
                                                            s/d {formatDate(item.end_transaction)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Detail Button */}
                                                <A
                                                    href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity/${item.id}`}
                                                    class="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/80 text-blue-700 dark:text-blue-300 font-semibold text-xs border border-blue-200/80 dark:border-blue-800/80 transition-all shadow-2xs active:scale-[0.98]"
                                                >
                                                    <span>Lihat Detail Aktivitas</span>
                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                                    </svg>
                                                </A>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </Show>
                    </Show>

                    {/* Pagination Bar */}
                    <div class="px-4 sm:px-6 py-3.5 sm:py-4 bg-neutral-50/80 dark:bg-neutral-800/40 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                        <div class="flex flex-wrap items-center justify-between sm:justify-start gap-3 text-xs text-neutral-500 dark:text-neutral-400">
                            <div>
                                Menampilkan <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                                    {totalData() === 0 ? 0 : (currentPage() - 1) * itemsPerPage() + 1}
                                </span> - <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                                    {Math.min(currentPage() * itemsPerPage(), totalData())}
                                </span> dari <span class="font-semibold text-neutral-800 dark:text-neutral-200">{totalData()}</span>
                            </div>
                            <div class="flex items-center gap-1.5 ml-auto sm:ml-0">
                                <span>Per hal:</span>
                                <select
                                    value={itemsPerPage()}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.currentTarget.value));
                                        setCurrentPage(1);
                                    }}
                                    class="px-2 py-1 rounded-lg text-xs bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-hidden cursor-pointer"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                </select>
                            </div>
                        </div>

                        {/* Page Navigation */}
                        <div class="flex items-center justify-center gap-1.5 self-center sm:self-auto">
                            <button
                                type="button"
                                disabled={currentPage() <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                title="Halaman Sebelumnya"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                                </svg>
                            </button>

                            <div class="px-3 py-1 text-xs font-semibold font-mono text-neutral-700 dark:text-neutral-300">
                                {currentPage()} / {totalPages()}
                            </div>

                            <button
                                type="button"
                                disabled={currentPage() >= totalPages()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                                class="p-2 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
        </div>
    );
}
