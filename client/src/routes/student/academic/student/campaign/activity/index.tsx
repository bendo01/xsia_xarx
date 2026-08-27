import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    currentUserSignal, 
    refreshAuthState, 
    getActiveStudentId, 
    getActiveStudentCode, 
    setActiveStudent 
} from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import { getStudentById, StudentMasterItem } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { 
    listStudentActivities, 
    StudentActivityItem 
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';

export default function StudentCampaignActivityIndexPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activities, setActivities] = createSignal<StudentActivityItem[]>([]);
    const [availableStudents, setAvailableStudents] = createSignal<StudentMasterItem[]>([]);
    const [activeStudent, setActiveStudentState] = createSignal<StudentMasterItem | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [page, setPage] = createSignal(1);
    const [totalPages, setTotalPages] = createSignal(1);

    const resolveActiveStudent = async (): Promise<StudentMasterItem | null> => {
        try {
            let targetIndId = currentUserSignal()?.individual_id || getStorageItem('individual_id') || '';
            
            if (!targetIndId || targetIndId === '00000000-0000-0000-0000-000000000000') {
                const curUserRes = await GetCurrentUser();
                if (curUserRes.code === 200 && curUserRes.data?.individual_id) {
                    targetIndId = curUserRes.data.individual_id;
                    refreshAuthState();
                }
            }

            if (targetIndId && targetIndId !== '00000000-0000-0000-0000-000000000000') {
                const res = await PersonMasterIndividualControllerShow(targetIndId);
                if (!res.is_error && res.data?.students) {
                    const rawStudents = res.data.students || [];
                    const enrichedStudents: StudentMasterItem[] = await Promise.all(
                        rawStudents.map(async (s) => {
                            try {
                                const detail = await getStudentById(s.id);
                                return detail || s;
                            } catch {
                                return s;
                            }
                        })
                    );
                    setAvailableStudents(enrichedStudents);

                    const targetCode = searchParams.code as string;
                    const targetStudentId = searchParams.student_id as string;
                    const savedStudentId = getActiveStudentId();
                    const savedStudentCode = getActiveStudentCode();

                    let matched: StudentMasterItem | null = null;
                    if (enrichedStudents.length > 0) {
                        if (targetCode) {
                            matched = enrichedStudents.find(s => s.code === targetCode) || null;
                        }
                        if (!matched && targetStudentId) {
                            matched = enrichedStudents.find(s => s.id === targetStudentId) || null;
                        }
                        if (!matched && savedStudentCode) {
                            matched = enrichedStudents.find(s => s.code === savedStudentCode) || null;
                        }
                        if (!matched && savedStudentId) {
                            matched = enrichedStudents.find(s => s.id === savedStudentId) || null;
                        }
                        if (!matched) {
                            matched = enrichedStudents[0];
                        }
                    }

                    if (matched) {
                        setActiveStudent(matched.id, matched.code);
                        setActiveStudentState(matched);
                    }
                    return matched;
                }
            }
        } catch (err) {
            console.error('Error resolving active student:', err);
        }
        return null;
    };

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            let currentStudent = activeStudent();
            if (!currentStudent) {
                currentStudent = await resolveActiveStudent();
            }

            const studentId = currentStudent?.id || getActiveStudentId();

            const res = await listStudentActivities({
                page: page(),
                page_size: 10,
                name: searchQuery() || undefined,
                student_id: studentId || undefined,
            });

            setActivities(res.data || []);
            setTotalPages(res.total_pages || 1);
        } catch (err) {
            console.error('Error fetching student activities:', err);
            toast.danger('Failed to load academic semester activities.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectStudent = async (student: StudentMasterItem) => {
        if (activeStudent()?.id === student.id && activeStudent()?.code === student.code) return;
        
        setActiveStudentState(student);
        setActiveStudent(student.id, student.code);
        setSearchParams({ code: student.code });
        setPage(1);
        
        toast.success(`Memuat aktivitas semester untuk NIM: ${student.code}`);
        await fetchActivities();
    };

    onMount(() => {
        fetchActivities();
    });

    createEffect(() => {
        const idParam = searchParams.student_id as string;
        const codeParam = searchParams.code as string;
        if (idParam || codeParam) {
            fetchActivities();
        }
    });

    const handleSearch = (e: Event) => {
        e.preventDefault();
        setPage(1);
        fetchActivities();
    };

    const latestAct = () => activities()[0] || null;
    const currentIPK = () => (latestAct()?.grand_cumulative_index ?? latestAct()?.cumulative_index ?? 0).toFixed(2);
    const totalSKS = () => latestAct()?.grand_total_credit ?? latestAct()?.total_credit ?? 0;
    const semesterIPS = () => (latestAct()?.cumulative_index ?? 0).toFixed(2);
    const semesterSKS = () => latestAct()?.total_credit ?? 0;

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-2">
                            <div class="flex flex-wrap items-center gap-2">
                                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold border border-indigo-200 dark:border-indigo-800/80">
                                    <span class="size-1.5 rounded-full bg-indigo-500"></span>
                                    <span>Academic Student Campaign Activities</span>
                                </div>
                                <Show when={activeStudent()}>
                                    <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-bold border border-blue-200 dark:border-blue-800">
                                        <span>NIM: {activeStudent()?.code}</span>
                                        <span class="text-neutral-400">•</span>
                                        <span>{activeStudent()?.unit_name || 'Program Studi'}</span>
                                    </div>
                                </Show>
                            </div>

                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                Academic Activities & Semester Records
                            </h1>
                            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                                Track semester activity campaigns, Study Plan Cards (KRS), academic evaluations (KHS), and cumulative progression from <span class="font-mono text-indigo-600 dark:text-indigo-400">academic_student_campaign.student_activities</span>.
                            </p>
                        </div>

                        {/* Top KPI Stats */}
                        <div class="grid grid-cols-2 sm:grid-cols-2 gap-3">
                            <div class="p-3.5 px-5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-center">
                                <span class="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Cumulative GPA (IPK)</span>
                                <span class="text-xl font-black text-blue-900 dark:text-blue-200">{currentIPK()}</span>
                                <span class="text-[10px] text-blue-500/80 font-mono block">IPS: {semesterIPS()}</span>
                            </div>
                            <div class="p-3.5 px-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-center">
                                <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">Credits Taken (SKS)</span>
                                <span class="text-xl font-black text-indigo-900 dark:text-indigo-200">{totalSKS()} <span class="text-xs font-normal">SKS</span></span>
                                <span class="text-[10px] text-indigo-500/80 font-mono block">Sem: {semesterSKS()} SKS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multiple Student Identity Switcher (if user has multiple student records e.g. NIM 111301760 & 141302134) */}
                <Show when={availableStudents().length > 1}>
                    <div class="p-4 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div class="flex items-center gap-2.5">
                            <div class="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-xs font-bold text-neutral-900 dark:text-white">Pilih Profil Mahasiswa Aktif</h3>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Pilih identitas NIM untuk melihat aktivitas semester terkait</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 flex-wrap">
                            <For each={availableStudents()}>
                                {(std) => {
                                    const isSel = () => activeStudent()?.id === std.id || activeStudent()?.code === std.code;
                                    return (
                                        <button
                                            type="button"
                                            onClick={() => handleSelectStudent(std)}
                                            class={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                                                isSel()
                                                    ? 'bg-blue-600 text-white shadow-xs'
                                                    : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-600'
                                            }`}
                                        >
                                            <span class="font-mono">NIM {std.code}</span>
                                            <span class="text-[10px] opacity-80">({std.unit_name || 'Program Studi'})</span>
                                            <Show when={isSel()}>
                                                <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                                    <polyline points="20 6 9 17 4 12"/>
                                                </svg>
                                            </Show>
                                        </button>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                </Show>

                {/* Search & Actions Bar */}
                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <form onSubmit={handleSearch} class="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search semester or academic campaign..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                        />
                        <svg class="size-4 absolute left-3 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </form>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <A
                            href="/student/academic/student/campaign/activity/enrollment"
                            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            <span>Enroll in KRS Classes</span>
                        </A>
                    </div>
                </div>

                {/* Semester Activities Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <Show when={!isLoading()} fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-xs font-mono">Loading academic semester activities from server...</p>
                        </div>
                    }>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3.5 px-4 text-start">Academic Semester</th>
                                        <th class="py-3.5 px-4 text-center">Semester SKS</th>
                                        <th class="py-3.5 px-4 text-center">Cumulative SKS</th>
                                        <th class="py-3.5 px-4 text-center">Semester IPS</th>
                                        <th class="py-3.5 px-4 text-center">Cumulative IPK</th>
                                        <th class="py-3.5 px-4 text-center">Study Plan Status</th>
                                        <th class="py-3.5 px-4 text-end">Action Portals</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={activities()} fallback={
                                        <tr>
                                            <td colspan="7" class="py-12 text-center text-neutral-400 font-mono">
                                                No academic activities found for active student ({activeStudent()?.code || getActiveStudentCode() || 'N/A'}).
                                            </td>
                                        </tr>
                                    }>
                                        {(act) => (
                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                <td class="py-4 px-4 font-bold text-neutral-900 dark:text-white">
                                                    <div class="flex items-center gap-2.5">
                                                        <div class="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center">
                                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                                                        </div>
                                                        <div>
                                                            <span class="block">{act.name || 'Academic Semester'}</span>
                                                            <span class="text-[10px] text-neutral-400 font-mono">ID: {act.id ? `${act.id.slice(0, 8)}...` : '-'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-bold">
                                                    {act.total_credit ?? 0}
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-bold">
                                                    {act.grand_total_credit ?? act.total_credit ?? 0}
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-extrabold text-blue-600 dark:text-blue-400">
                                                    {(act.cumulative_index ?? 0).toFixed(2)}
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                                                    {(act.grand_cumulative_index ?? act.cumulative_index ?? 0).toFixed(2)}
                                                </td>

                                                <td class="py-4 px-4 text-center">
                                                    <span class={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                                                        act.is_lock
                                                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                    }`}>
                                                        <span class={`size-1.5 rounded-full ${act.is_lock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                        {act.is_lock ? 'Locked / Finalized' : 'Active / KRS Open'}
                                                    </span>
                                                </td>

                                                <td class="py-4 px-4 text-end">
                                                    <div class="flex items-center justify-end gap-2">
                                                        <A
                                                            href={`/student/academic/student/campaign/activity/show?id=${act.id}`}
                                                            class="px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            View Details
                                                        </A>
                                                        <Show when={!act.is_lock}>
                                                            <A
                                                                href={`/student/academic/student/campaign/activity/enrollment?activity_id=${act.id}`}
                                                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                                                            >
                                                                Enroll (KRS)
                                                            </A>
                                                        </Show>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
