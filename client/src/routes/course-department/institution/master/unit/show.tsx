import { createSignal, onMount, createEffect, Show, For, createMemo } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow, masterApiIndex } from '~/controllers/master/masterApiController';
import { 
    currentUserSignal, 
    userRolesSignal, 
    activeRoleSignal, 
    refreshAuthState,
    isStaffProgramStudi 
} from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { InstitutionMasterUnit } from '~/models/institution/master/Unit';
import type { InstitutionMasterStaff } from '~/models/institution/master/Staff';

export default function CourseDepartmentUnitShowPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [unitId, setUnitId] = createSignal<string>('');
    const [unitData, setUnitData] = createSignal<any | null>(null);
    
    // Real Data from server entities filtered by unit_id = current user unit_id
    const [curriculums, setCurriculums] = createSignal<any[]>([]);
    const [courses, setCourses] = createSignal<any[]>([]);
    const [students, setStudents] = createSignal<any[]>([]);
    const [staffes, setStaffes] = createSignal<any[]>([]);
    
    // Supplementary reference data for relations
    const [employeesMap, setEmployeesMap] = createSignal<Record<string, any>>({});
    const [positionTypesMap, setPositionTypesMap] = createSignal<Record<string, any>>({});
    
    // UI state
    const [activeTab, setActiveTab] = createSignal<'overview' | 'curriculums' | 'courses' | 'students' | 'staffes'>('overview');
    const [courseSearch, setCourseSearch] = createSignal('');
    const [studentSearch, setStudentSearch] = createSignal('');

    // Step 1: Resolve the Current User's Unit ID
    const resolveCurrentUserUnitId = async (): Promise<string> => {
        // Priority 1: Direct query parameter if user navigated with ?id= or ?unit_id=
        const queryId = (searchParams.id as string) || (searchParams.unit_id as string);
        if (queryId && queryId.trim() !== '') {
            return queryId.trim();
        }

        await refreshAuthState();
        const roles = userRolesSignal();
        const user = currentUserSignal();

        // Priority 2: Stored unit_id on user or storage
        const storedUnitId = (user as any)?.unit_id || getStorageItem('unit_id');
        if (storedUnitId && storedUnitId !== '00000000-0000-0000-0000-000000000000') {
            return storedUnitId;
        }

        // Priority 3: Active role or user roles with roleable_id pointing to Staff or Unit
        for (const role of roles) {
            if (role.roleable_id && role.roleable_id !== '00000000-0000-0000-0000-000000000000') {
                if (role.roleable_type === 'Staff' || isStaffProgramStudi(role)) {
                    try {
                        const staffRes = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', role.roleable_id);
                        if (staffRes.data?.unit_id) {
                            return staffRes.data.unit_id;
                        }
                    } catch {
                        // Continue checking
                    }
                }
                if (role.roleable_type === 'Unit') {
                    return role.roleable_id;
                }
            }
        }

        // Priority 4: Look up individual -> employee -> staffes -> unit_id
        let indId = user?.individual_id || getStorageItem('individual_id');
        if (!indId || indId === '00000000-0000-0000-0000-000000000000') {
            try {
                const userRes = await GetCurrentUser();
                if (userRes?.code === 200 && userRes.data?.individual_id) {
                    indId = userRes.data.individual_id;
                }
            } catch {
                // Ignore
            }
        }

        if (indId && indId !== '00000000-0000-0000-0000-000000000000') {
            try {
                const indRes = await masterApiShow<any>('person/master/individuals', indId);
                if (indRes.data?.employees && Array.isArray(indRes.data.employees)) {
                    for (const emp of indRes.data.employees) {
                        if (emp.staffes && Array.isArray(emp.staffes) && emp.staffes.length > 0) {
                            const foundUnit = emp.staffes[0].unit_id;
                            if (foundUnit) return foundUnit;
                        }
                    }
                }
            } catch {
                // Ignore
            }
        }

        // Priority 5: Fallback to the first Program Studi unit in database
        try {
            const unitsRes = await masterApiIndex<InstitutionMasterUnit>('institution/master/units', { page: 1, per_page: 20 });
            if (unitsRes.data && unitsRes.data.length > 0) {
                return unitsRes.data[0].id;
            }
        } catch (e) {
            console.error('Failed to list units fallback:', e);
        }

        return '';
    };

    // Step 2: Fetch real server data for the resolved unit_id
    const loadUnitData = async (targetUnitId: string) => {
        if (!targetUnitId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // Fetch Unit Master + All 4 Required Entities in Parallel where unit_id = targetUnitId
            const [
                unitRes,
                coursesRes,
                curriculumsRes,
                studentsRes,
                staffesRes,
                empRes,
                posTypeRes
            ] = await Promise.all([
                masterApiShow<any>('institution/master/units', targetUnitId),
                masterApiIndex<any>('academic/course/master/courses', { unit_id: targetUnitId, page: 1, per_page: 200 }),
                masterApiIndex<any>('academic/course/master/curriculums', { unit_id: targetUnitId, page: 1, per_page: 100 }),
                masterApiIndex<any>('academic/student/master/students', { unit_id: targetUnitId, page: 1, per_page: 200 }),
                masterApiIndex<any>('institution/master/staffes', { unit_id: targetUnitId, page: 1, per_page: 100 }),
                masterApiIndex<any>('institution/master/employees', { page: 1, per_page: 500 }).catch(() => ({ data: [] })),
                masterApiIndex<any>('institution/reference/position-types', { page: 1, per_page: 500 }).catch(() => ({ data: [] }))
            ]);

            // Set Unit Record
            if (unitRes.data) {
                setUnitData(unitRes.data);
            } else {
                toast.danger('Data Unit / Program Studi tidak ditemukan di server.');
            }

            // Set Real Entity Data from server
            setCourses(coursesRes?.data || []);
            setCurriculums(curriculumsRes?.data || []);
            setStudents(studentsRes?.data || []);
            setStaffes(staffesRes?.data || []);

            // Map employees & position types for enriching staff display
            const empMap: Record<string, any> = {};
            if (empRes?.data && Array.isArray(empRes.data)) {
                for (const emp of empRes.data) {
                    if (emp.id) empMap[emp.id] = emp;
                }
            }
            setEmployeesMap(empMap);

            const posMap: Record<string, any> = {};
            if (posTypeRes?.data && Array.isArray(posTypeRes.data)) {
                for (const pt of posTypeRes.data) {
                    if (pt.id) posMap[pt.id] = pt;
                }
            }
            setPositionTypesMap(posMap);

        } catch (err) {
            console.error('Error fetching unit real data:', err);
            toast.danger('Gagal memuat data Program Studi dari server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(async () => {
        const id = await resolveCurrentUserUnitId();
        setUnitId(id);
        if (id) {
            await loadUnitData(id);
        } else {
            setIsLoading(false);
        }
    });

    createEffect(() => {
        const qId = (searchParams.id as string) || (searchParams.unit_id as string);
        if (qId && qId !== unitId()) {
            setUnitId(qId);
            loadUnitData(qId);
        }
    });

    // Enriched Staff Records with Employee Name and Position Type Title
    const enrichedStaffes = createMemo(() => {
        const emps = employeesMap();
        const pos = positionTypesMap();
        return staffes().map(st => {
            const employee = st.employee_id ? emps[st.employee_id] : null;
            const positionType = st.position_type_id ? pos[st.position_type_id] : null;
            const positionName = positionType?.name || st.position_type?.name || st.name || 'Staff';
            const employeeName = employee?.name || st.employee?.name || st.name || '-';
            const employeeCode = employee?.code || st.employee?.code || st.code || '-';

            return {
                ...st,
                employeeName,
                employeeCode,
                positionName,
                positionType,
                employee
            };
        });
    });

    // Categorized Leadership
    const kaprodi = createMemo(() => {
        return enrichedStaffes().find(s => {
            const p = s.positionName.toLowerCase();
            return p.includes('kepala program studi') || p.includes('kaprodi') || p.includes('kajur');
        }) || null;
    });

    const sekprodi = createMemo(() => {
        return enrichedStaffes().find(s => {
            const p = s.positionName.toLowerCase();
            return (p.includes('sekertaris') || p.includes('sekretaris')) && (p.includes('prodi') || p.includes('program studi') || p.includes('jurusan'));
        }) || null;
    });

    const otherStaffes = createMemo(() => {
        return enrichedStaffes().filter(s => s !== kaprodi() && s !== sekprodi());
    });

    // Filtered lists for interactive tables
    const filteredCourses = createMemo(() => {
        const query = courseSearch().toLowerCase().trim();
        if (!query) return courses();
        return courses().filter(c => 
            (c.code || '').toLowerCase().includes(query) ||
            (c.name || '').toLowerCase().includes(query)
        );
    });

    const filteredStudents = createMemo(() => {
        const query = studentSearch().toLowerCase().trim();
        if (!query) return students();
        return students().filter(s => 
            (s.code || '').toLowerCase().includes(query) ||
            (s.name || '').toLowerCase().includes(query) ||
            (s.academic_year_name || '').toLowerCase().includes(query)
        );
    });

    // Unit identity helpers
    const unitName = () => unitData()?.name || 'Program Studi & Jurusan';
    const unitCode = () => unitData()?.code || unitData()?.alphabet_code || '-';
    const educationName = () => unitData()?.education?.name || unitData()?.education_name || 'Strata-1 (S1)';
    const facultyName = () => unitData()?.institution?.name || unitData()?.parent?.name || 'Fakultas / Institusi';

    // Active curriculum summary
    const activeCurriculum = createMemo(() => {
        return curriculums().find(c => c.is_active) || curriculums()[0] || null;
    });

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Hero Banner with Unit Details */}
                <div class="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
                    <div class="absolute -right-16 -top-16 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-3">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-mono font-semibold border border-teal-400/30">
                                    <span class="size-2 rounded-full bg-teal-400 animate-pulse"></span>
                                    <span>Unit ID: {unitId() ? `${unitId().substring(0, 8)}...` : '-'}</span>
                                </span>
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-mono font-semibold border border-emerald-400/30">
                                    <span>Kode: {unitCode()}</span>
                                </span>
                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
                                    <span>{educationName()}</span>
                                </span>
                            </div>

                            <div>
                                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {unitName()}
                                </h1>
                                <p class="text-xs sm:text-sm text-teal-100/80 max-w-2xl font-medium mt-1">
                                    {facultyName()} • Portal Tata Kelola Kurikulum, Mata Kuliah, Mahasiswa, dan Staff Program Studi.
                                </p>
                            </div>
                        </div>

                        {/* Direct Action Links */}
                        <div class="flex items-center gap-2.5 flex-wrap">
                            <A
                                href="/course-department/academic/course/master/curriculum"
                                class="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
                                </svg>
                                <span>Kurikulum</span>
                            </A>

                            <A
                                href="/course-department/academic/course/master/course"
                                class="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                                </svg>
                                <span>Mata Kuliah</span>
                            </A>

                            <A
                                href="/course-department/academic/student/master"
                                class="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
                                </svg>
                                <span>Mahasiswa</span>
                            </A>
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                <Show when={isLoading()}>
                    <div class="py-24 text-center flex flex-col items-center justify-center gap-3">
                        <div class="size-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-xs font-mono text-neutral-400">Memuat data real server untuk Unit ID {unitId()}...</span>
                    </div>
                </Show>

                {/* Main Content Body */}
                <Show when={!isLoading()}>
                    {/* 4 Summary Cards based on real data */}
                    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* 1. Kurikulum (academic_course_master.curriculums) */}
                        <div 
                            onClick={() => setActiveTab('curriculums')}
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 cursor-pointer hover:border-emerald-500 transition-all"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider">Kurikulum</span>
                                <div class="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                    {curriculums().length}
                                </span>
                                <span class="text-xs text-neutral-400 font-medium">Kurikulum Prodi</span>
                            </div>
                            <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                                {activeCurriculum()?.name || 'Kurikulum Aktif'}
                            </div>
                        </div>

                        {/* 2. Mata Kuliah (academic_course_master.courses) */}
                        <div 
                            onClick={() => setActiveTab('courses')}
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 cursor-pointer hover:border-teal-500 transition-all"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider">Mata Kuliah</span>
                                <div class="size-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><path d="M6 6h10M6 10h10M6 14h6"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                    {courses().length}
                                </span>
                                <span class="text-xs text-neutral-400 font-medium">Mata Kuliah</span>
                            </div>
                            <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                Total SKS: {courses().reduce((acc, curr) => acc + (Number(curr.total_credit) || 0), 0)} SKS
                            </div>
                        </div>

                        {/* 3. Mahasiswa (academic_student_master.students) */}
                        <div 
                            onClick={() => setActiveTab('students')}
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 cursor-pointer hover:border-blue-500 transition-all"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider">Mahasiswa</span>
                                <div class="size-8 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                    {students().length}
                                </span>
                                <span class="text-xs text-neutral-400 font-medium">Mahasiswa Terdaftar</span>
                            </div>
                            <div class="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                                Status Aktif & Terdata
                            </div>
                        </div>

                        {/* 4. Staff (institution_master.staffes) */}
                        <div 
                            onClick={() => setActiveTab('staffes')}
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 cursor-pointer hover:border-purple-500 transition-all"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider">Staff & Pimpinan</span>
                                <div class="size-8 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                                    </svg>
                                </div>
                            </div>
                            <div class="flex items-baseline gap-2">
                                <span class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                    {staffes().length}
                                </span>
                                <span class="text-xs text-neutral-400 font-medium">Staff Terdaftar</span>
                            </div>
                            <div class="text-[11px] text-purple-600 dark:text-purple-400 font-mono">
                                Kaprodi, Sekprodi & Staff
                            </div>
                        </div>
                    </div>

                    {/* Program Studi Leadership Card */}
                    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                        <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <div class="flex items-center gap-2">
                                <span class="size-2 rounded-full bg-teal-500"></span>
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                    Pimpinan & Staff Program Studi (institution_master.staffes)
                                </h3>
                            </div>
                            <span class="text-xs text-neutral-400 font-mono">
                                Unit ID: {unitId()}
                            </span>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {/* Kepala Program Studi */}
                            <div class="p-4 rounded-2xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
                                        Kepala Program Studi (Kaprodi)
                                    </span>
                                    <span class="px-2 py-0.5 rounded-md bg-teal-200/60 dark:bg-teal-800/60 text-teal-800 dark:text-teal-200 text-[10px] font-bold">
                                        Pimpinan
                                    </span>
                                </div>
                                <div class="font-bold text-sm text-neutral-900 dark:text-white">
                                    {kaprodi()?.employeeName || 'Belum Ditetapkan'}
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    NIP/Kode: {kaprodi()?.employeeCode || '-'}
                                </div>
                                <Show when={kaprodi()?.decree_number}>
                                    <div class="text-[10px] text-teal-600/80 dark:text-teal-400/80 font-mono truncate">
                                        SK: {kaprodi()?.decree_number}
                                    </div>
                                </Show>
                            </div>

                            {/* Sekertaris Program Studi */}
                            <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                                        Sekertaris Program Studi (Sekprodi)
                                    </span>
                                    <span class="px-2 py-0.5 rounded-md bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
                                        Sekretaris
                                    </span>
                                </div>
                                <div class="font-bold text-sm text-neutral-900 dark:text-white">
                                    {sekprodi()?.employeeName || 'Belum Ditetapkan'}
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    NIP/Kode: {sekprodi()?.employeeCode || '-'}
                                </div>
                                <Show when={sekprodi()?.decree_number}>
                                    <div class="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 font-mono truncate">
                                        SK: {sekprodi()?.decree_number}
                                    </div>
                                </Show>
                            </div>

                            {/* Staff Program Studi */}
                            <div class="p-4 rounded-2xl bg-slate-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                <div class="flex items-center justify-between">
                                    <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-400">
                                        Staff Program Studi
                                    </span>
                                    <span class="px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold">
                                        {otherStaffes().length} Staff
                                    </span>
                                </div>
                                <div class="font-bold text-sm text-neutral-900 dark:text-white truncate">
                                    {otherStaffes()[0]?.employeeName || 'Staff Tata Usaha'}
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    {otherStaffes().length > 1 ? `+ ${otherStaffes().length - 1} staff lainnya` : 'Operasional Akademik'}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive Section Tabs */}
                    <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-2 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                activeTab() === 'overview'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            Informasi Umum
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('curriculums')}
                            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                activeTab() === 'curriculums'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            Kurikulum ({curriculums().length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('courses')}
                            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                activeTab() === 'courses'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            Mata Kuliah ({courses().length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('students')}
                            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                activeTab() === 'students'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            Mahasiswa ({students().length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('staffes')}
                            class={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                activeTab() === 'staffes'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                        >
                            Daftar Staff ({staffes().length})
                        </button>
                    </div>

                    {/* Tab 1: Overview */}
                    <Show when={activeTab() === 'overview'}>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Profile Details Card */}
                            <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <span class="size-2 rounded-full bg-teal-500"></span>
                                    Identitas & Profil Program Studi
                                </h3>

                                <div class="space-y-3 divide-y divide-neutral-100 dark:divide-neutral-700/50 text-xs">
                                    <div class="pt-2 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 font-mono">Nama Program Studi</span>
                                        <span class="font-bold text-neutral-900 dark:text-white">{unitName()}</span>
                                    </div>
                                    <div class="pt-2 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 font-mono">Kode Program Studi</span>
                                        <span class="font-mono font-bold text-teal-600 dark:text-teal-400">{unitCode()}</span>
                                    </div>
                                    <div class="pt-2 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 font-mono">Jenjang Pendidikan</span>
                                        <span class="font-bold">{educationName()}</span>
                                    </div>
                                    <div class="pt-2 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 font-mono">Fakultas / Parent Unit</span>
                                        <span class="font-medium">{facultyName()}</span>
                                    </div>
                                    <div class="pt-2 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 font-mono">Status Operasional</span>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                            {unitData()?.is_active ? 'Aktif' : 'Aktif (Terdaftar)'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Management Links */}
                            <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <span class="size-2 rounded-full bg-emerald-500"></span>
                                    Manajemen & Aksi Cepat Program Studi
                                </h3>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <A
                                        href="/course-department/academic/course/master/curriculum"
                                        class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 hover:border-emerald-500 transition-all group"
                                    >
                                        <div class="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-emerald-600 flex items-center justify-between">
                                            <span>Kurikulum ({curriculums().length})</span>
                                            <span>→</span>
                                        </div>
                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Struktur kurikulum, SKS wajib & pilihan.
                                        </p>
                                    </A>

                                    <A
                                        href="/course-department/academic/course/master/course"
                                        class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 hover:border-teal-500 transition-all group"
                                    >
                                        <div class="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-teal-600 flex items-center justify-between">
                                            <span>Mata Kuliah ({courses().length})</span>
                                            <span>→</span>
                                        </div>
                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Daftar mata kuliah dan pembagian SKS.
                                        </p>
                                    </A>

                                    <A
                                        href="/course-department/academic/student/master"
                                        class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 transition-all group"
                                    >
                                        <div class="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 flex items-center justify-between">
                                            <span>Mahasiswa ({students().length})</span>
                                            <span>→</span>
                                        </div>
                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Daftar mahasiswa terdaftar di prodi.
                                        </p>
                                    </A>

                                    <A
                                        href="/course-department/academic/student/final-assignment/transaction/submission"
                                        class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 hover:border-purple-500 transition-all group"
                                    >
                                        <div class="text-xs font-bold text-neutral-900 dark:text-white group-hover:text-purple-600 flex items-center justify-between">
                                            <span>Tugas Akhir</span>
                                            <span>→</span>
                                        </div>
                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Pengajuan judul skripsi dan pembimbing.
                                        </p>
                                    </A>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 2: Curriculums (academic_course_master.curriculums) */}
                    <Show when={activeTab() === 'curriculums'}>
                        <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Daftar Kurikulum Program Studi (academic_course_master.curriculums)
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Data kurikulum real server untuk Unit ID {unitId()}.
                                    </p>
                                </div>
                                <A
                                    href="/course-department/academic/course/master/curriculum/create"
                                    class="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-colors"
                                >
                                    + Tambah Kurikulum
                                </A>
                            </div>

                            <Show when={curriculums().length > 0} fallback={
                                <div class="py-12 text-center text-neutral-400 font-mono text-xs">
                                    Belum ada kurikulum terdaftar untuk Unit ID ini.
                                </div>
                            }>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs text-left">
                                        <thead class="bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 font-mono uppercase text-[10px]">
                                            <tr>
                                                <th class="py-2.5 px-3 rounded-s-lg">Nama Kurikulum</th>
                                                <th class="py-2.5 px-3 text-center">Total SKS</th>
                                                <th class="py-2.5 px-3 text-center">SKS Wajib</th>
                                                <th class="py-2.5 px-3 text-center">SKS Pilihan</th>
                                                <th class="py-2.5 px-3 text-center">Status</th>
                                                <th class="py-2.5 px-3 text-end rounded-e-lg">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                            <For each={curriculums()}>
                                                {(c) => (
                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">
                                                            {c.name}
                                                        </td>
                                                        <td class="py-3 px-3 text-center font-mono font-bold text-emerald-600">
                                                            {c.total_credit || 0} SKS
                                                        </td>
                                                        <td class="py-3 px-3 text-center font-mono">{c.mandatory_course_credit || 0} SKS</td>
                                                        <td class="py-3 px-3 text-center font-mono">{c.optional_course_credit || 0} SKS</td>
                                                        <td class="py-3 px-3 text-center">
                                                            <span class={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                                c.is_active
                                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                                                    : 'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300'
                                                            }`}>
                                                                {c.is_active ? 'Aktif' : 'Nonaktif'}
                                                            </span>
                                                        </td>
                                                        <td class="py-3 px-3 text-end">
                                                            <A
                                                                href={`/course-department/academic/course/master/curriculum/show?id=${c.id}`}
                                                                class="text-xs font-bold text-emerald-600 hover:underline"
                                                            >
                                                                Detail →
                                                            </A>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </div>
                    </Show>

                    {/* Tab 3: Courses (academic_course_master.courses) */}
                    <Show when={activeTab() === 'courses'}>
                        <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Mata Kuliah Program Studi (academic_course_master.courses)
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Total {courses().length} mata kuliah terdaftar untuk Unit ID {unitId()}.
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Cari kode atau nama MK..."
                                        value={courseSearch()}
                                        onInput={(e) => setCourseSearch(e.currentTarget.value)}
                                        class="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-teal-500"
                                    />
                                    <A
                                        href="/course-department/academic/course/master/course/create"
                                        class="px-3 py-1.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-500 transition-colors shrink-0"
                                    >
                                        + Tambah MK
                                    </A>
                                </div>
                            </div>

                            <Show when={filteredCourses().length > 0} fallback={
                                <div class="py-12 text-center text-neutral-400 font-mono text-xs">
                                    {courseSearch() ? 'Tidak ada mata kuliah yang cocok dengan pencarian.' : 'Belum ada mata kuliah terdaftar untuk Unit ID ini.'}
                                </div>
                            }>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs text-left">
                                        <thead class="bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 font-mono uppercase text-[10px]">
                                            <tr>
                                                <th class="py-2.5 px-3 rounded-s-lg">Kode MK</th>
                                                <th class="py-2.5 px-3">Nama Mata Kuliah</th>
                                                <th class="py-2.5 px-3 text-center">Teori</th>
                                                <th class="py-2.5 px-3 text-center">Praktik</th>
                                                <th class="py-2.5 px-3 text-center">Total SKS</th>
                                                <th class="py-2.5 px-3 text-end rounded-e-lg">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                            <For each={filteredCourses()}>
                                                {(c) => (
                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                        <td class="py-3 px-3 font-mono font-bold text-teal-600 dark:text-teal-400">
                                                            {c.code || '-'}
                                                        </td>
                                                        <td class="py-3 px-3 font-medium text-neutral-900 dark:text-white">
                                                            {c.name || 'Mata Kuliah'}
                                                        </td>
                                                        <td class="py-3 px-3 text-center font-mono">{c.lecture_credit || 0}</td>
                                                        <td class="py-3 px-3 text-center font-mono">{c.practice_credit || 0}</td>
                                                        <td class="py-3 px-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">
                                                            {c.total_credit || (c.lecture_credit || 0) + (c.practice_credit || 0)} SKS
                                                        </td>
                                                        <td class="py-3 px-3 text-end">
                                                            <A
                                                                href={`/course-department/academic/course/master/course/show?id=${c.id}`}
                                                                class="text-xs font-bold text-teal-600 hover:underline"
                                                            >
                                                                Detail →
                                                            </A>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </div>
                    </Show>

                    {/* Tab 4: Students (academic_student_master.students) */}
                    <Show when={activeTab() === 'students'}>
                        <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Mahasiswa Terdaftar (academic_student_master.students)
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Total {students().length} mahasiswa terdaftar untuk Unit ID {unitId()}.
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Cari NIM atau nama mahasiswa..."
                                        value={studentSearch()}
                                        onInput={(e) => setStudentSearch(e.currentTarget.value)}
                                        class="px-3 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-blue-500"
                                    />
                                    <A
                                        href="/course-department/academic/student/master"
                                        class="text-xs font-bold text-blue-600 hover:underline shrink-0"
                                    >
                                        Semua Mahasiswa →
                                    </A>
                                </div>
                            </div>

                            <Show when={filteredStudents().length > 0} fallback={
                                <div class="py-12 text-center text-neutral-400 font-mono text-xs">
                                    {studentSearch() ? 'Tidak ada mahasiswa yang cocok dengan pencarian.' : 'Belum ada data mahasiswa terdaftar untuk Unit ID ini.'}
                                </div>
                            }>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs text-left">
                                        <thead class="bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 font-mono uppercase text-[10px]">
                                            <tr>
                                                <th class="py-2.5 px-3 rounded-s-lg">NIM</th>
                                                <th class="py-2.5 px-3">Nama Mahasiswa</th>
                                                <th class="py-2.5 px-3">Tahun Angkatan</th>
                                                <th class="py-2.5 px-3 text-center">Status</th>
                                                <th class="py-2.5 px-3 text-end rounded-e-lg">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                            <For each={filteredStudents()}>
                                                {(s) => (
                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                        <td class="py-3 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                            {s.code || '-'}
                                                        </td>
                                                        <td class="py-3 px-3 font-medium text-neutral-900 dark:text-white">
                                                            {s.name || s.individual?.name || 'Mahasiswa'}
                                                        </td>
                                                        <td class="py-3 px-3 font-mono">
                                                            {s.academic_year_name || (s.registered ? s.registered.substring(0, 4) : '-')}
                                                        </td>
                                                        <td class="py-3 px-3 text-center">
                                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                                                {s.status_name || 'Aktif'}
                                                            </span>
                                                        </td>
                                                        <td class="py-3 px-3 text-end">
                                                            <A
                                                                href={`/course-department/academic/student/master/show?id=${s.id}`}
                                                                class="text-xs font-bold text-blue-600 hover:underline"
                                                            >
                                                                Profil →
                                                            </A>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </div>
                    </Show>

                    {/* Tab 5: Staffes (institution_master.staffes) */}
                    <Show when={activeTab() === 'staffes'}>
                        <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Daftar Staff & Pejabat (institution_master.staffes)
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Staff dan pengelola akademik terdaftar pada Unit ID {unitId()}.
                                    </p>
                                </div>
                            </div>

                            <Show when={enrichedStaffes().length > 0} fallback={
                                <div class="py-12 text-center text-neutral-400 font-mono text-xs">
                                    Belum ada staff terdaftar untuk Unit ID ini.
                                </div>
                            }>
                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs text-left">
                                        <thead class="bg-neutral-100 dark:bg-neutral-900/50 text-neutral-500 font-mono uppercase text-[10px]">
                                            <tr>
                                                <th class="py-2.5 px-3 rounded-s-lg">Nama Pegawai</th>
                                                <th class="py-2.5 px-3">Jabatan / Posisi</th>
                                                <th class="py-2.5 px-3">NIP / Kode</th>
                                                <th class="py-2.5 px-3">SK Pengangkatan</th>
                                                <th class="py-2.5 px-3 text-center rounded-e-lg">Periode</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                            <For each={enrichedStaffes()}>
                                                {(st) => (
                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">
                                                            {st.employeeName}
                                                        </td>
                                                        <td class="py-3 px-3">
                                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                                                {st.positionName}
                                                            </span>
                                                        </td>
                                                        <td class="py-3 px-3 font-mono text-neutral-500">{st.employeeCode}</td>
                                                        <td class="py-3 px-3 font-mono text-xs">{st.decree_number || '-'}</td>
                                                        <td class="py-3 px-3 text-center font-mono text-neutral-400 text-[11px]">
                                                            {st.start_date ? `${st.start_date} s/d ${st.end_date || 'sekarang'}` : 'Aktif'}
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </div>
                    </Show>
                </Show>
            </main>
        </div>
    );
}
