import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    currentUserSignal, 
    refreshAuthState, 
    getActiveStudentId, 
    getActiveStudentCode, 
    setActiveStudent,
    activeStudentIdSignal,
    activeStudentCodeSignal
} from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import { listStudentActivities, StudentActivityItem } from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { getStudentById, StudentMasterItem } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { listCounsellors, CounsellorItem } from '~/controllers/academic/student/adviser/AcademicStudentAdviserController';

export default function StudentDashboardProfilePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubLoading, setIsSubLoading] = createSignal(false);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [availableStudents, setAvailableStudents] = createSignal<StudentMasterItem[]>([]);
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

                    // 2. Fetch and enrich all linked student identities for this individual
                    const rawStudents = res.data.students || [];
                    const enrichedStudents: StudentMasterItem[] = await Promise.all(
                        rawStudents.map(async (std) => {
                            try {
                                const detailed = await getStudentById(std.id);
                                return detailed || std;
                            } catch {
                                return std;
                            }
                        })
                    );

                    setAvailableStudents(enrichedStudents);

                    // 3. Determine selected active student identity (by query code, saved ID/code, or first available)
                    const targetCode = searchParams.code as string;
                    const targetStudentId = searchParams.student_id as string;
                    const savedStudentId = getActiveStudentId();
                    const savedStudentCode = getActiveStudentCode();

                    let matchedStudent: StudentMasterItem | null = null;
                    if (enrichedStudents.length > 0) {
                        if (targetCode) {
                            matchedStudent = enrichedStudents.find(s => s.code === targetCode) || null;
                        }
                        if (!matchedStudent && targetStudentId) {
                            matchedStudent = enrichedStudents.find(s => s.id === targetStudentId) || null;
                        }
                        if (!matchedStudent && savedStudentCode) {
                            matchedStudent = enrichedStudents.find(s => s.code === savedStudentCode) || null;
                        }
                        if (!matchedStudent && savedStudentId) {
                            matchedStudent = enrichedStudents.find(s => s.id === savedStudentId) || null;
                        }
                        if (!matchedStudent) {
                            matchedStudent = enrichedStudents[0];
                        }
                    }

                    setStudentRecord(matchedStudent);

                    if (matchedStudent) {
                        setActiveStudent(matchedStudent.id, matchedStudent.code);
                        // Fetch academic activities and advisers specifically for this student
                        await loadStudentSubRecords(matchedStudent.id);
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

    const loadStudentSubRecords = async (studentId: string) => {
        setIsSubLoading(true);
        try {
            const [actRes, advRes] = await Promise.all([
                listStudentActivities({ student_id: studentId, page: 1, page_size: 5 }),
                listCounsellors({ student_id: studentId, page: 1, page_size: 5 })
            ]);

            setRecentActivities(actRes.data || []);
            setAdvisers(advRes.data || []);
        } catch (err) {
            console.error('Error loading student activities or advisers:', err);
        } finally {
            setIsSubLoading(false);
        }
    };

    const handleSelectStudent = async (student: StudentMasterItem) => {
        if (studentRecord()?.id === student.id && studentRecord()?.code === student.code) return;
        
        setStudentRecord(student);
        setActiveStudent(student.id, student.code);
        setSearchParams({ code: student.code });
        
        toast.success(`Identitas mahasiswa aktif dialihkan ke NIM: ${student.code} (${student.unit_name || 'Program Studi'})`);
        await loadStudentSubRecords(student.id);
    };

    onMount(() => {
        fetchStudentProfile();
    });

    createEffect(() => {
        const idFromQuery = searchParams.id as string;
        const codeFromQuery = searchParams.code as string;
        const studentIdFromQuery = searchParams.student_id as string;
        const currentStudentCode = activeStudentCodeSignal();
        const currentStudentId = activeStudentIdSignal();

        if (idFromQuery && idFromQuery !== individualData()?.individual?.id) {
            fetchStudentProfile();
            return;
        }

        const students = availableStudents();
        if (students.length > 0) {
            const target = students.find(s => 
                (codeFromQuery && s.code === codeFromQuery) ||
                (studentIdFromQuery && s.id === studentIdFromQuery) ||
                (currentStudentCode && s.code === currentStudentCode) ||
                (currentStudentId && s.id === currentStudentId)
            );
            if (target && target.id !== studentRecord()?.id) {
                setStudentRecord(target);
                setActiveStudent(target.id, target.code);
                loadStudentSubRecords(target.id);
            }
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
    const semesterCredits = () => latestActivity()?.total_credit ?? 0;
    const gpa = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        const val = act.grand_cumulative_index ?? act.cumulative_index ?? 0;
        return Number(val).toFixed(2);
    };
    const semesterGpa = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        return Number(act.cumulative_index ?? 0).toFixed(2);
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
                                <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                    <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-mono font-bold">
                                        <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
                                        <span>NIM: {studentRecord()?.code || ind()?.code || '-'}</span>
                                    </div>

                                    {/* Multiple student identities badge */}
                                    <Show when={availableStudents().length > 1}>
                                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-medium">
                                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                            </svg>
                                            <span>{availableStudents().length} Identitas Mahasiswa Terdaftar</span>
                                        </span>
                                    </Show>
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
                                <span class="block text-[11px] text-blue-200 font-mono uppercase tracking-wider">Cumulative GPA (IPK)</span>
                                <span class="text-xl sm:text-2xl font-black text-white">{gpa()}</span>
                                <span class="block text-[10px] text-blue-300/80 font-mono mt-0.5">IPS: {semesterGpa()}</span>
                            </div>
                            <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center">
                                <span class="block text-[11px] text-blue-200 font-mono uppercase tracking-wider">Total Credits (SKS)</span>
                                <span class="text-xl sm:text-2xl font-black text-white">{totalCredits()} <span class="text-xs font-normal text-white/70">SKS</span></span>
                                <span class="block text-[10px] text-blue-300/80 font-mono mt-0.5">Sem: {semesterCredits()} SKS</span>
                            </div>
                            <div class="p-3.5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 text-center col-span-2 sm:col-span-1 flex flex-col justify-center">
                                <span class="block text-[11px] text-blue-200 font-mono uppercase tracking-wider">Academic Status</span>
                                <span class="text-sm sm:text-base font-bold text-emerald-300">{studentRecord()?.status_name || 'Active'}</span>
                                <span class="block text-[10px] text-neutral-300 font-mono mt-0.5 truncate">{studentRecord()?.academic_year_name || 'Reguler'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Multiple Student Identity Switcher Card (when user has multiple student records e.g. NIM 111301760 & 141302134) */}
                <Show when={availableStudents().length > 1}>
                    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-700">
                            <div class="flex items-center gap-3">
                                <div class="size-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                    <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        <span>Pilih Identitas Akademik Mahasiswa</span>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                            {availableStudents().length} Identitas
                                        </span>
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Akun ini terdaftar pada multi program studi/identitas. Klik salah satu kartu identitas untuk beralih.
                                    </p>
                                </div>
                            </div>
                            <div class="text-xs font-mono text-neutral-400 dark:text-neutral-500 self-start sm:self-auto">
                                Identitas Aktif: <span class="font-bold text-blue-600 dark:text-blue-400">NIM {studentRecord()?.code || '-'}</span>
                            </div>
                        </div>

                        {/* Interactive Identity Cards Grid */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <For each={availableStudents()}>
                                {(std) => {
                                    const isCurrent = () => studentRecord()?.code === std.code || studentRecord()?.id === std.id;
                                    return (
                                        <div
                                            role="button"
                                            tabIndex="0"
                                            onClick={() => handleSelectStudent(std)}
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSelectStudent(std); }}
                                            class={`p-5 rounded-2xl border transition-all text-start cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                                                isCurrent()
                                                    ? 'bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-600 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20'
                                                    : 'bg-white dark:bg-neutral-800/80 border-neutral-200 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-neutral-600 hover:shadow-xs'
                                            }`}
                                        >
                                            {/* Selection Ribbon indicator */}
                                            <Show when={isCurrent()}>
                                                <div class="absolute top-0 right-0 px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-bl-xl tracking-wider uppercase flex items-center gap-1 shadow-xs">
                                                    <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                                                        <polyline points="20 6 9 17 4 12"/>
                                                    </svg>
                                                    <span>Identitas Aktif</span>
                                                </div>
                                            </Show>

                                            <div class="space-y-2.5">
                                                <div class="flex items-center gap-3">
                                                    <div class={`size-11 rounded-xl flex items-center justify-center font-bold text-sm ${
                                                        isCurrent()
                                                            ? 'bg-blue-600 text-white shadow-sm'
                                                            : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                                    }`}>
                                                        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div class="flex items-center gap-2">
                                                            <span class="text-xs font-mono font-bold text-neutral-900 dark:text-white">
                                                                NIM: {std.code}
                                                            </span>
                                                            <span class="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                {std.status_name || 'Terdaftar'}
                                                            </span>
                                                        </div>
                                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                            {std.unit_name || 'Program Studi Mahasiswa'}
                                                        </h3>
                                                    </div>
                                                </div>

                                                <div class="pt-2 border-t border-neutral-100 dark:border-neutral-700/60 grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-300">
                                                    <div>
                                                        <span class="text-neutral-400 block text-[10px] font-mono uppercase">Angkatan:</span>
                                                        <span class="font-semibold">{std.academic_year_name || std.registered?.substring(0, 4) || '-'}</span>
                                                    </div>
                                                    <div>
                                                        <span class="text-neutral-400 block text-[10px] font-mono uppercase">Tgl Registrasi:</span>
                                                        <span class="font-semibold">{std.registered || '-'}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="mt-4 pt-3 flex items-center justify-between">
                                                <Show when={isCurrent()} fallback={
                                                    <button
                                                        type="button"
                                                        onClick={(e) => { e.stopPropagation(); handleSelectStudent(std); }}
                                                        class="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-xl text-xs font-bold transition-colors text-center"
                                                    >
                                                        Gunakan Identitas NIM {std.code} →
                                                    </button>
                                                }>
                                                    <div class="w-full py-2 px-3 bg-blue-600 text-white rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-xs">
                                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                            <polyline points="20 6 9 17 4 12"/>
                                                        </svg>
                                                        <span>Identitas Sedang Aktif</span>
                                                    </div>
                                                </Show>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                </Show>

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
                            title="Overview & Academic History"
                            aria-label="Overview & Academic History"
                            class={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap px-1 ${
                                activeTab() === 'overview'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                            <span class="hidden sm:inline">Overview & Academic History</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('biodata')}
                            title="Personal Biodata & Address"
                            aria-label="Personal Biodata & Address"
                            class={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap px-1 ${
                                activeTab() === 'biodata'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                            </svg>
                            <span class="hidden sm:inline">Personal Biodata & Address</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('academic')}
                            title="Advisers & Guidance"
                            aria-label="Advisers & Guidance"
                            class={`flex items-center gap-2 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap px-1 ${
                                activeTab() === 'academic'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.75" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                            </svg>
                            <span class="hidden sm:inline">Advisers & Guidance</span>
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
                                            <div class="flex items-center justify-between">
                                                <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                                    Enrollment Summary
                                                </h3>
                                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-mono">
                                                    NIM: {studentRecord()?.code || '-'}
                                                </span>
                                            </div>
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
                                            <div class="flex items-center gap-2">
                                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Recent Academic Semesters
                                                </h3>
                                                <Show when={isSubLoading()}>
                                                    <div class="size-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                </Show>
                                            </div>
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
                                                                No semester academic activities recorded for NIM {studentRecord()?.code || '-'}.
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
                                        <div class="flex items-center gap-2">
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                Assigned Academic Advisers & Counsellors
                                            </h3>
                                            <Show when={isSubLoading()}>
                                                <div class="size-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                            </Show>
                                        </div>
                                        <A href="/student/academic/student/adviser" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                                            Adviser Workspace →
                                        </A>
                                    </div>

                                    <Show when={advisers().length > 0} fallback={
                                        <div class="p-8 text-center text-neutral-400 font-mono bg-neutral-50 dark:bg-neutral-900/60 rounded-2xl border border-neutral-200/80 dark:border-neutral-700/80">
                                            No academic advisers assigned yet for NIM {studentRecord()?.code || '-'}.
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
