import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { currentUserSignal, refreshAuthState } from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import { listStudentActivities, StudentActivityItem } from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { getStudentById, StudentMasterItem } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { listCounsellors, CounsellorItem } from '~/controllers/academic/student/adviser/AcademicStudentAdviserController';

export default function StudentDashboardProfilePage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [studentRecord, setStudentRecord] = createSignal<StudentMasterItem | null>(null);
    const [recentActivities, setRecentActivities] = createSignal<StudentActivityItem[]>([]);
    const [advisers, setAdvisers] = createSignal<CounsellorItem[]>([]);
    const [activeTab, setActiveTab] = createSignal<'overview' | 'biodata' | 'academic'>('overview');

    const fetchStudentProfile = async () => {
        setIsLoading(true);
        try {
            let targetIndId = (searchParams.id as string) || '';
            const user = currentUserSignal();

            // 1. Resolve individual ID from query param, reactive user signal, or storage
            if (!targetIndId) {
                targetIndId = user?.individual_id || getStorageItem('individual_id') || '';
            }

            // If still missing or empty/default uuid, fetch current authenticated user from server
            if (!targetIndId || targetIndId === '00000000-0000-0000-0000-000000000000') {
                const curUserRes = await GetCurrentUser();
                if (curUserRes.code === 200 && curUserRes.data?.individual_id) {
                    targetIndId = curUserRes.data.individual_id;
                    refreshAuthState();
                }
            }

            if (targetIndId && targetIndId !== '00000000-0000-0000-0000-000000000000') {
                const res = await PersonMasterIndividualControllerShow(targetIndId);
                if (!res.is_error && res.data) {
                    setIndividualData(res.data);

                    // 2. Fetch associated student academic record for this individual
                    let matchedStudent: StudentMasterItem | null = null;
                    if (res.data.students && res.data.students.length > 0) {
                        const linkedStudentId = res.data.students[0].id;
                        const fullStudent = await getStudentById(linkedStudentId);
                        matchedStudent = fullStudent || res.data.students[0];
                    }
                    setStudentRecord(matchedStudent);

                    // 3. Fetch academic activities specifically for this student
                    if (matchedStudent?.id) {
                        const actRes = await listStudentActivities({ student_id: matchedStudent.id, page: 1, page_size: 5 });
                        if (actRes.data) {
                            setRecentActivities(actRes.data);
                        } else {
                            setRecentActivities([]);
                        }

                        // 4. Fetch advisers specifically for this student
                        const advRes = await listCounsellors({ student_id: matchedStudent.id, page: 1, page_size: 5 });
                        if (advRes.data) {
                            setAdvisers(advRes.data);
                        } else {
                            setAdvisers([]);
                        }
                    } else {
                        setRecentActivities([]);
                        setAdvisers([]);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching student profile data:', error);
            toast.danger('Failed to load student profile from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchStudentProfile();
    });

    createEffect(() => {
        const idFromQuery = searchParams.id as string;
        if (idFromQuery) {
            fetchStudentProfile();
        }
    });

    const ind = () => individualData()?.individual;
    const fullName = () => {
        const item = ind();
        if (!item) return currentUserSignal()?.name || 'Student Account';
        return [item.front_title, item.name, item.last_title].filter(Boolean).join(' ') || item.name;
    };

    const latestActivity = () => recentActivities()[0] || null;
    const totalCredits = () => latestActivity()?.grand_total_credit ?? latestActivity()?.total_credit ?? 0;
    const gpa = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        const val = act.grand_cumulative_index ?? act.cumulative_index ?? 0;
        return Number(val).toFixed(2);
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Profile Header Hero Card */}
                <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
                    <div class="absolute -right-16 -top-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Avatar & Main Info */}
                        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <div class="relative">
                                <div class="size-24 sm:size-28 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 p-1 shadow-lg">
                                    <div class="w-full h-full rounded-xl bg-neutral-800 flex items-center justify-center text-white text-3xl font-black uppercase">
                                        {(fullName() || 'S').charAt(0)}
                                    </div>
                                </div>
                                <span class="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-emerald-500 text-[10px] font-bold tracking-wider uppercase text-white shadow-xs border-2 border-neutral-900">
                                    {studentRecord()?.status_name || 'Active Student'}
                                </span>
                            </div>

                            <div class="space-y-2 text-center sm:text-start">
                                <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-semibold">
                                    <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
                                    <span>NIM: {studentRecord()?.code || ind()?.code || '-'}</span>
                                </div>
                                <h1 class="text-2xl sm:text-3xl font-black tracking-tight">{fullName()}</h1>
                                <p class="text-neutral-300 text-xs sm:text-sm max-w-xl">
                                    {studentRecord()?.unit_name || '-'} • Academic Batch {studentRecord()?.academic_year_name || studentRecord()?.registered?.substring(0, 4) || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Quick Stats Badges */}
                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
                                <span class="block text-[11px] text-blue-200 font-mono uppercase tracking-wider">Cumulative GPA</span>
                                <span class="text-xl sm:text-2xl font-black text-white">{gpa()}</span>
                            </div>
                            <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
                                <span class="block text-[11px] text-blue-200 font-mono uppercase tracking-wider">Total Credits</span>
                                <span class="text-xl sm:text-2xl font-black text-white">{totalCredits()} <span class="text-xs font-normal text-white/70">SKS</span></span>
                            </div>
                            <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center col-span-2 sm:col-span-1">
                                <span class="block text-[11px] text-blue-200 font-mono uppercase tracking-wider">Academic Status</span>
                                <span class="text-sm font-bold text-emerald-300">{studentRecord()?.status_name || 'Registered'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Quick Action Navigation Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <A
                        href="/student/academic/student/campaign/activity/enrollment"
                        class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:shadow-md hover:border-blue-500 dark:hover:border-blue-500 transition-all flex items-center justify-between group"
                    >
                        <div class="flex items-center gap-3.5">
                            <div class="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Course Enrollment</h3>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Select & Enroll in KRS Classes</p>
                            </div>
                        </div>
                        <span class="text-neutral-400 group-hover:translate-x-1 transition-transform">→</span>
                    </A>

                    <A
                        href="/student/academic/student/campaign/activity"
                        class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:shadow-md hover:border-indigo-500 dark:hover:border-indigo-500 transition-all flex items-center justify-between group"
                    >
                        <div class="flex items-center gap-3.5">
                            <div class="size-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h6"/></svg>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Semester Activities</h3>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">View Study Plan & Grades (KHS)</p>
                            </div>
                        </div>
                        <span class="text-neutral-400 group-hover:translate-x-1 transition-transform">→</span>
                    </A>

                    <A
                        href="/student/academic/student/adviser"
                        class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:shadow-md hover:border-amber-500 dark:hover:border-amber-500 transition-all flex items-center justify-between group"
                    >
                        <div class="flex items-center gap-3.5">
                            <div class="size-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">Academic Advisers</h3>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Consultation & Guidance</p>
                            </div>
                        </div>
                        <span class="text-neutral-400 group-hover:translate-x-1 transition-transform">→</span>
                    </A>

                    <A
                        href="/student/academic/student/master"
                        class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:shadow-md hover:border-teal-500 dark:hover:border-teal-500 transition-all flex items-center justify-between group"
                    >
                        <div class="flex items-center gap-3.5">
                            <div class="size-11 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                            </div>
                            <div>
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">Admitted Students</h3>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Student Directory & Master</p>
                            </div>
                        </div>
                        <span class="text-neutral-400 group-hover:translate-x-1 transition-transform">→</span>
                    </A>
                </div>

                {/* Tabbed Profile Content */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    {/* Navigation Tabs */}
                    <div class="flex border-b border-neutral-200 dark:border-neutral-700 px-6 pt-4 gap-4 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            class={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                                activeTab() === 'overview'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            Overview & Academic History
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('biodata')}
                            class={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                                activeTab() === 'biodata'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            Personal Biodata & Address
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('academic')}
                            class={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${
                                activeTab() === 'academic'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            Advisers & Guidance
                        </button>
                    </div>

                    <div class="p-6 sm:p-8">
                        <Show when={!isLoading()} fallback={
                            <div class="py-12 flex flex-col items-center justify-center gap-3 text-neutral-400">
                                <div class="size-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                <p class="text-xs font-mono">Loading student profile details from server...</p>
                            </div>
                        }>
                            {/* TAB 1: OVERVIEW */}
                            <Show when={activeTab() === 'overview'}>
                                <div class="space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Academic Status Card */}
                                        <div class="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                                            <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                Enrollment Summary
                                            </h3>
                                            <div class="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span class="text-neutral-400 block">Student NIM</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{studentRecord()?.code || '-'}</span>
                                                </div>
                                                <div>
                                                    <span class="text-neutral-400 block">Registration Date</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{studentRecord()?.registered || '-'}</span>
                                                </div>
                                                <div>
                                                    <span class="text-neutral-400 block">Study Program</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{studentRecord()?.unit_name || '-'}</span>
                                                </div>
                                                <div>
                                                    <span class="text-neutral-400 block">Current Status</span>
                                                    <span class="font-bold text-emerald-600 dark:text-emerald-400">{studentRecord()?.status_name || 'Active / Terdaftar'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Identity Summary Card */}
                                        <div class="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3">
                                            <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                Identity & Citizenship
                                            </h3>
                                            <div class="grid grid-cols-2 gap-3 text-xs">
                                                <div>
                                                    <span class="text-neutral-400 block">National ID (NIK)</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{ind()?.code || '-'}</span>
                                                </div>
                                                <div>
                                                    <span class="text-neutral-400 block">NISN</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{studentRecord()?.nisn || '-'}</span>
                                                </div>
                                                <div>
                                                    <span class="text-neutral-400 block">Birth Place & Date</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                                        {ind()?.birth_place ? `${ind()?.birth_place}, ${ind()?.birth_date || '-'}` : (ind()?.birth_date || '-')}
                                                    </span>
                                                </div>
                                                <div>
                                                    <span class="text-neutral-400 block">Gender</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                                        {individualData()?.gender?.name || '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Recent Semester Activity Preview */}
                                    <div class="space-y-3">
                                        <div class="flex items-center justify-between">
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                Recent Academic Semesters
                                            </h3>
                                            <A href="/student/academic/student/campaign/activity" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                                View All Semesters →
                                            </A>
                                        </div>

                                        <div class="overflow-x-auto">
                                            <table class="w-full text-xs text-start">
                                                <thead class="bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 font-mono uppercase text-[10px]">
                                                    <tr>
                                                        <th class="py-2.5 px-3 text-start rounded-s-lg">Semester / Campaign</th>
                                                        <th class="py-2.5 px-3 text-center">Semester SKS</th>
                                                        <th class="py-2.5 px-3 text-center">Total SKS</th>
                                                        <th class="py-2.5 px-3 text-center">Semester IPS</th>
                                                        <th class="py-2.5 px-3 text-center">Cumulative IPK</th>
                                                        <th class="py-2.5 px-3 text-center">Lock Status</th>
                                                        <th class="py-2.5 px-3 text-end rounded-e-lg">Action</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                                    <Show when={recentActivities().length > 0} fallback={
                                                        <tr>
                                                            <td colspan="7" class="py-8 text-center text-neutral-400 font-mono">
                                                                No semester academic activities recorded yet.
                                                            </td>
                                                        </tr>
                                                    }>
                                                        <For each={recentActivities()}>
                                                            {(act) => (
                                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                                    <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">
                                                                        {act.name || act.semester_name || 'Academic Semester'}
                                                                    </td>
                                                                    <td class="py-3 px-3 text-center font-mono">{act.total_credit ?? 0}</td>
                                                                    <td class="py-3 px-3 text-center font-mono">{act.grand_total_credit ?? act.total_credit ?? 0}</td>
                                                                    <td class="py-3 px-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                                                        {Number(act.cumulative_index ?? 0).toFixed(2)}
                                                                    </td>
                                                                    <td class="py-3 px-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                                        {Number(act.grand_cumulative_index ?? act.cumulative_index ?? 0).toFixed(2)}
                                                                    </td>
                                                                    <td class="py-3 px-3 text-center">
                                                                        <span class={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full ${
                                                                            act.is_lock
                                                                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                                                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                        }`}>
                                                                            {act.is_lock ? 'Locked' : 'Unlocked'}
                                                                        </span>
                                                                    </td>
                                                                    <td class="py-3 px-3 text-end">
                                                                        <A
                                                                            href={`/student/academic/student/campaign/activity/show?id=${act.id}`}
                                                                            class="px-2.5 py-1 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg text-xs font-semibold"
                                                                        >
                                                                            Details
                                                                        </A>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </For>
                                                    </Show>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </Show>

                            {/* TAB 2: BIODATA & ADDRESS */}
                            <Show when={activeTab() === 'biodata'}>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                                    <div class="space-y-4 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80">
                                        <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Personal Details
                                        </h3>
                                        <div class="space-y-2.5">
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Full Name</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{fullName()}</span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Email</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{individualData()?.user?.email || currentUserSignal()?.email || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Phone Number</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{individualData()?.biodata?.phone_number || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Blood Type</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{individualData()?.biodata?.blood_type?.name || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Religion</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{individualData()?.religion?.name || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="space-y-4 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80">
                                        <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Permanent Address & Residency
                                        </h3>
                                        <div class="space-y-2.5">
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Address Line</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{individualData()?.biodata?.address || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Postal Code</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{individualData()?.biodata?.postal_code || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">RT / RW</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">
                                                    {individualData()?.biodata?.rt && individualData()?.biodata?.rw ? `${individualData()?.biodata?.rt} / ${individualData()?.biodata?.rw}` : '-'}
                                                </span>
                                            </div>
                                            <div class="flex justify-between py-1 border-b border-neutral-200/60 dark:border-neutral-800">
                                                <span class="text-neutral-400">Country</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">Indonesia</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Show>

                            {/* TAB 3: ADVISERS */}
                            <Show when={activeTab() === 'academic'}>
                                <div class="space-y-4">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Assigned Academic Advisers & Counsellors
                                        </h3>
                                        <A href="/student/academic/student/adviser" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                            Adviser Workspace →
                                        </A>
                                    </div>

                                    <Show when={advisers().length > 0} fallback={
                                        <div class="p-8 text-center text-neutral-400 font-mono bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80">
                                            No academic advisers assigned yet.
                                        </div>
                                    }>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <For each={advisers()}>
                                                {(adv, idx) => (
                                                    <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 flex items-start gap-4">
                                                        <div class="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center shrink-0">
                                                            {idx() + 1}
                                                        </div>
                                                        <div class="flex-1 min-w-0">
                                                            <h4 class="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                                                {adv.lecturer_name || '-'}
                                                            </h4>
                                                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                                                NIDN: {adv.lecturer_nidn || '-'}
                                                            </p>
                                                            <span class="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                                                                {adv.role_type || 'Academic Advisor (PA)'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            </Show>
                        </Show>
                    </div>
                </div>
            </main>
        </div>
    );
}
