import { createSignal, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { currentUserSignal, refreshAuthState, getStoredRoles, normalizeRoleName } from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import { getLecturerMasterByIndividual } from '~/controllers/academic/lecturer/AcademicLecturerTransactionController';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import { masterApiShow } from '~/controllers/master/masterApiController';
import { 
    getLecturerAssignedTeaches, 
    LecturerAssignedTeachItem 
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import type { AcademicLecturerMasterLecturer } from '~/models/academic/lecturer/master/Lecturer';

export default function LecturerTeachIndexPage() {
    const user = () => currentUserSignal();
    const [isLoading, setIsLoading] = createSignal(true);
    const [lecturerMaster, setLecturerMaster] = createSignal<AcademicLecturerMasterLecturer | null>(null);
    const [assignedTeaches, setAssignedTeaches] = createSignal<LecturerAssignedTeachItem[]>([]);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [viewMode, setViewMode] = createSignal<'grid' | 'table'>('grid');
    const [selectedAcademicYearFilter, setSelectedAcademicYearFilter] = createSignal<string>('all');

    const loadLecturerTeaches = async () => {
        setIsLoading(true);
        try {
            await refreshAuthState();

            // 1. First check if active role has roleable_id pointing to lecturer
            const roles = getStoredRoles();
            const lecturerRole = roles.find(r => 
                normalizeRoleName(r.name) === 'lecturer' || 
                r.roleable_type?.toLowerCase().includes('lecturer')
            );
            const directRoleLecturerId = lecturerRole?.roleable_id || '';

            // 2. Check individual_id
            let indId = user()?.individual_id || getStorageItem('individual_id');
            if (!indId || indId === '00000000-0000-0000-0000-000000000000') {
                const userRes = await GetCurrentUser();
                if (userRes && userRes.code === 200 && userRes.data?.individual_id) {
                    indId = userRes.data.individual_id;
                }
            }

            let resolvedLecturer: AcademicLecturerMasterLecturer | null = null;

            if (indId && indId !== '00000000-0000-0000-0000-000000000000') {
                const [profileRes, masterLecturerRes] = await Promise.all([
                    PersonMasterIndividualControllerShow(indId),
                    getLecturerMasterByIndividual(indId),
                ]);

                resolvedLecturer = masterLecturerRes || profileRes.data?.lecturer || null;
            }

            // 3. Fallback to direct role lecturer_id if master not found by individual_id
            if (!resolvedLecturer && directRoleLecturerId && directRoleLecturerId !== '00000000-0000-0000-0000-000000000000') {
                try {
                    const lRes = await masterApiShow<AcademicLecturerMasterLecturer>('academic/lecturer/master/lecturers', directRoleLecturerId);
                    if (lRes.data) {
                        resolvedLecturer = lRes.data;
                    }
                } catch (e) {
                    console.warn('Failed to load lecturer by direct roleable_id:', e);
                }
            }

            setLecturerMaster(resolvedLecturer);

            const lecturerId = resolvedLecturer?.id || (directRoleLecturerId !== '00000000-0000-0000-0000-000000000000' ? directRoleLecturerId : '');

            if (lecturerId) {
                const teaches = await getLecturerAssignedTeaches(lecturerId);
                // Strictly filter only teaches assigned to this lecturer.id
                const lecturerTeaches = teaches.filter(item => item.lecturer_id === lecturerId);
                setAssignedTeaches(lecturerTeaches);
            } else {
                setAssignedTeaches([]);
            }
        } catch (err) {
            console.error('Error loading lecturer teaching assignments:', err);
            setAssignedTeaches([]);
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        loadLecturerTeaches();
    });

    // Distinct Academic Years extracted from assigned teaches (where teaches.activity_id = activities.id and activities.academic_year_id = academic_years.id)
    const distinctAcademicYears = createMemo(() => {
        const yearMap = new Map<string, { id: string; name: string; code?: number | string | null }>();
        for (const item of assignedTeaches()) {
            if (item.academic_year_id) {
                if (!yearMap.has(item.academic_year_id)) {
                    yearMap.set(item.academic_year_id, {
                        id: item.academic_year_id,
                        name: item.academic_year_name || (item.academic_year_code ? `Tahun Akademik ${item.academic_year_code}` : 'Tahun Akademik'),
                        code: item.academic_year_code,
                    });
                }
            }
        }
        return Array.from(yearMap.values()).sort((a, b) => {
            const codeA = Number(a.code) || 0;
            const codeB = Number(b.code) || 0;
            if (codeA !== codeB) return codeB - codeA;
            return a.name.localeCompare(b.name);
        });
    });

    // Filtered list based on search and academic year filters, ordered by academic_year
    const filteredTeaches = createMemo(() => {
        const query = searchQuery().toLowerCase().trim();
        const yearFilter = selectedAcademicYearFilter();

        const filtered = assignedTeaches().filter(item => {
            const matchesQuery = !query || 
                (item.course_name && item.course_name.toLowerCase().includes(query)) ||
                (item.course_code && item.course_code.toLowerCase().includes(query)) ||
                (item.class_name && item.class_name.toLowerCase().includes(query)) ||
                (item.class_alphabet_code && item.class_alphabet_code.toLowerCase().includes(query)) ||
                (item.teach_name && item.teach_name.toLowerCase().includes(query)) ||
                (item.activity_name && item.activity_name.toLowerCase().includes(query)) ||
                (item.academic_year_name && item.academic_year_name.toLowerCase().includes(query));

            const matchesYear = yearFilter === 'all' || 
                item.academic_year_id === yearFilter;

            return matchesQuery && matchesYear;
        });

        return filtered.sort((a, b) => {
            const yearCodeA = Number(a.academic_year_code) || 0;
            const yearCodeB = Number(b.academic_year_code) || 0;
            if (yearCodeA !== yearCodeB) {
                return yearCodeB - yearCodeA; // Latest academic year first
            }
            const yearNameA = a.academic_year_name || '';
            const yearNameB = b.academic_year_name || '';
            const yearComp = yearNameB.localeCompare(yearNameA);
            if (yearComp !== 0) return yearComp;

            return (a.course_name || '').localeCompare(b.course_name || '');
        });
    });

    // Summary calculations
    const totalClasses = () => assignedTeaches().length;
    const totalCredits = () => assignedTeaches().reduce((acc, curr) => acc + (curr.credit || curr.course_total_credit || 0), 0);
    const totalPlannedSessions = () => assignedTeaches().reduce((acc, curr) => acc + (curr.planning || 0), 0);
    const totalRealizedSessions = () => assignedTeaches().reduce((acc, curr) => acc + (curr.realization || 0), 0);

    const lecturerName = () => lecturerMaster()?.name || user()?.name || 'Lecturer';
    const lecturerNidn = () => lecturerMaster()?.code || lecturerMaster()?.nidn || '-';

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div class="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
                    <div class="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-2">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-mono font-semibold border border-indigo-400/30">
                                <span>NIDN: {lecturerNidn()}</span>
                                <span>•</span>
                                <span>Semester Teaching Portal</span>
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                Assigned Teaching Classes
                            </h1>
                            <p class="text-xs sm:text-sm text-indigo-200/80 max-w-2xl font-medium">
                                Direct course assignments, classroom codes, planned session hours, and student rosters for {lecturerName()}.
                            </p>
                        </div>

                        <div class="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={loadLecturerTeaches}
                                class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
                                </svg>
                                <span>Refresh Classes</span>
                            </button>
                            <A
                                href="/lecturer/person/master/individual/show"
                                class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs flex items-center gap-2 border border-white/20 transition-colors"
                            >
                                <span>Faculty Profile →</span>
                            </A>
                        </div>
                    </div>
                </div>

                {/* Summary Metric Stats */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Stat 1: Total Classes */}
                    <div class="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">Assigned Classes</span>
                            <div class="size-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                📚
                            </div>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-black text-neutral-900 dark:text-white font-mono">{totalClasses()}</span>
                            <span class="text-xs text-neutral-400 font-medium">Classes</span>
                        </div>
                    </div>

                    {/* Stat 2: Total Credits */}
                    <div class="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">Total SKS (Credits)</span>
                            <div class="size-7 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                                ⚖️
                            </div>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{totalCredits()}</span>
                            <span class="text-xs text-neutral-400 font-medium">SKS</span>
                        </div>
                    </div>

                    {/* Stat 3: Planned Sessions */}
                    <div class="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">Planned Sessions</span>
                            <div class="size-7 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                                🎯
                            </div>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{totalPlannedSessions()}</span>
                            <span class="text-xs text-neutral-400 font-medium">Sessions</span>
                        </div>
                    </div>

                    {/* Stat 4: Realized Sessions */}
                    <div class="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400">Realized Sessions</span>
                            <div class="size-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                                ✅
                            </div>
                        </div>
                        <div class="flex items-baseline gap-2">
                            <span class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{totalRealizedSessions()}</span>
                            <span class="text-xs text-neutral-400 font-medium">Recorded</span>
                        </div>
                    </div>
                </div>

                {/* Filter & View Toolbar */}
                <div class="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-2xs">
                    {/* Search input */}
                    <div class="relative flex-1">
                        <input
                            type="text"
                            placeholder="Search course title, course code (e.g. TIF101), or class..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-9 pr-4 py-2 bg-neutral-50 dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                        <svg class="size-4 text-neutral-400 absolute left-3 top-2.5 pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>
                        </svg>
                    </div>

                    {/* Filter controls */}
                    <div class="flex items-center gap-2 shrink-0">
                        {/* Academic Year (Tahun Akademik) Filter */}
                        <select
                            value={selectedAcademicYearFilter()}
                            onChange={(e) => setSelectedAcademicYearFilter(e.currentTarget.value)}
                            class="px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none focus:border-indigo-500 font-medium"
                        >
                            <option value="all">Semua Tahun Akademik</option>
                            <For each={distinctAcademicYears()}>
                                {(year) => (
                                    <option value={year.id}>
                                        {year.name}
                                    </option>
                                )}
                            </For>
                        </select>

                        {/* View Switcher */}
                        <div class="flex items-center p-0.5 rounded-xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => setViewMode('grid')}
                                class={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                    viewMode() === 'grid'
                                        ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                                title="Grid View"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
                                </svg>
                            </button>
                            <button
                                type="button"
                                onClick={() => setViewMode('table')}
                                class={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                    viewMode() === 'table'
                                        ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                                        : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                                }`}
                                title="Table Roster View"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <Show
                    when={!isLoading()}
                    fallback={
                        <div class="py-24 text-center flex flex-col items-center justify-center gap-3">
                            <div class="size-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <span class="text-xs font-mono text-neutral-400">Loading assigned teaching classes...</span>
                        </div>
                    }
                >
                    <Show
                        when={filteredTeaches().length > 0}
                        fallback={
                            <div class="p-12 text-center rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3 shadow-2xs">
                                <div class="size-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
                                    📖
                                </div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    No Teaching Classes Found
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                                    {searchQuery() 
                                        ? `No classes matching "${searchQuery()}". Try clearing search filters.`
                                        : 'You have not been assigned to any semester teaching classes yet.'}
                                </p>
                                <Show when={searchQuery() || selectedAcademicYearFilter() !== 'all'}>
                                    <button
                                        type="button"
                                        onClick={() => { setSearchQuery(''); setSelectedAcademicYearFilter('all'); }}
                                        class="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold rounded-xl text-xs transition-colors"
                                    >
                                        Clear Filters
                                    </button>
                                </Show>
                            </div>
                        }
                    >
                        {/* Grid View */}
                        <Show when={viewMode() === 'grid'}>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <For each={filteredTeaches()}>
                                    {(item) => {
                                        const progressPercent = () => item.planning > 0 
                                            ? Math.min(100, Math.round((item.realization / item.planning) * 100))
                                            : 0;

                                        return (
                                            <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-5 shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between group">
                                                <div class="space-y-3">
                                                    {/* Top Badges */}
                                                    <div class="flex items-center justify-between gap-2">
                                                        <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                            {item.course_code || 'COURSE'}
                                                        </span>
                                                        <div class="flex items-center gap-1.5 flex-wrap">
                                                            <Show when={item.academic_year_name}>
                                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                                                                    {item.academic_year_name}
                                                                </span>
                                                            </Show>
                                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                                                                {item.credit || item.course_total_credit || 0} SKS
                                                            </span>
                                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                                                {item.class_name || `Kelas ${item.class_alphabet_code}`}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Course Title */}
                                                    <div>
                                                        <h3 class="text-base font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2">
                                                            {item.course_name}
                                                        </h3>
                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 flex items-center gap-2">
                                                            <span>Class Code: <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{item.class_alphabet_code}</span></span>
                                                            <Show when={item.is_lecturer_home_base}>
                                                                <span>•</span>
                                                                <span class="text-emerald-600 dark:text-emerald-400 font-medium">Homebase</span>
                                                            </Show>
                                                        </p>
                                                    </div>

                                                    {/* Sessions & Teaching Progress */}
                                                    <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                                                        <div class="flex items-center justify-between text-xs">
                                                            <span class="text-neutral-500 font-medium">Teaching Sessions</span>
                                                            <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                                                                {item.realization} / {item.planning || 16} Pertemuan
                                                            </span>
                                                        </div>
                                                        <div class="w-full h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                                            <div 
                                                                class="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                                                style={{ width: `${progressPercent()}%` }}
                                                            ></div>
                                                        </div>
                                                        <div class="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                                                            <span>Progress: {progressPercent()}%</span>
                                                            <span>Cap: {item.class_capacity || item.max_member || 'Unset'} Mhs</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Card Actions */}
                                                <div class="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between gap-2">
                                                    <A
                                                        href={`/lecturer/academic/campaign/transaction/teach/show?id=${item.teach_id}`}
                                                        class="flex-1 py-2 px-3 text-center bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 font-semibold rounded-xl text-xs transition-colors"
                                                    >
                                                        Roster & Presensi
                                                    </A>
                                                    <A
                                                        href={`/lecturer/academic/campaign/activity`}
                                                        class="py-2 px-3 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700/80 text-neutral-700 dark:text-neutral-200 font-semibold rounded-xl text-xs transition-colors shrink-0"
                                                        title="Nilai Mahasiswa"
                                                    >
                                                        Nilai →
                                                    </A>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </Show>

                        {/* Table Roster View */}
                        <Show when={viewMode() === 'table'}>
                            <div class="rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 overflow-hidden shadow-2xs">
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left text-xs">
                                        <thead class="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 font-mono uppercase tracking-wider text-[11px]">
                                            <tr>
                                                <th class="px-6 py-4 font-bold">Course Code & Name</th>
                                                <th class="px-6 py-4 font-bold">Class Section</th>
                                                <th class="px-6 py-4 font-bold text-center">SKS</th>
                                                <th class="px-6 py-4 font-bold">Teaching Sessions</th>
                                                <th class="px-6 py-4 font-bold text-center">Homebase</th>
                                                <th class="px-6 py-4 font-bold text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-200/60 dark:divide-neutral-700/60">
                                            <For each={filteredTeaches()}>
                                                {(item) => (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-750/50 transition-colors">
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-0.5">
                                                                <div class="flex items-center gap-2">
                                                                    <span class="font-mono text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                        {item.course_code}
                                                                    </span>
                                                                    <Show when={item.academic_year_name}>
                                                                        <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                                                            {item.academic_year_name}
                                                                        </span>
                                                                    </Show>
                                                                </div>
                                                                <h4 class="font-bold text-neutral-900 dark:text-white">
                                                                    {item.course_name}
                                                                </h4>
                                                            </div>
                                                        </td>
                                                        <td class="px-6 py-4">
                                                            <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200">
                                                                {item.class_name || `Kelas ${item.class_alphabet_code}`}
                                                            </span>
                                                        </td>
                                                        <td class="px-6 py-4 text-center font-bold font-mono text-purple-600 dark:text-purple-400">
                                                            {item.credit || item.course_total_credit || 0}
                                                        </td>
                                                        <td class="px-6 py-4">
                                                            <div class="space-y-1">
                                                                <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">
                                                                    {item.realization} / {item.planning || 16}
                                                                </span>
                                                                <div class="w-24 h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                                                                    <div 
                                                                        class="h-full rounded-full bg-indigo-600"
                                                                        style={{ width: `${item.planning > 0 ? Math.min(100, Math.round((item.realization / item.planning) * 100)) : 0}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="px-6 py-4 text-center">
                                                            <Show
                                                                when={item.is_lecturer_home_base}
                                                                fallback={<span class="text-neutral-400">-</span>}
                                                            >
                                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                                                    Homebase
                                                                </span>
                                                            </Show>
                                                        </td>
                                                        <td class="px-6 py-4 text-right">
                                                            <div class="inline-flex items-center gap-2">
                                                                <A
                                                                    href={`/lecturer/academic/campaign/transaction/teach/show?id=${item.teach_id}`}
                                                                    class="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg text-xs transition-colors"
                                                                >
                                                                    Presensi
                                                                </A>
                                                                <A
                                                                    href={`/lecturer/academic/campaign/activity`}
                                                                    class="px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 font-semibold rounded-lg text-xs transition-colors"
                                                                >
                                                                    Nilai
                                                                </A>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Show>
                    </Show>
                </Show>
            </main>
        </div>
    );
}
