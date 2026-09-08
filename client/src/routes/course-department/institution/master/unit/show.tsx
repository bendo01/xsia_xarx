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
import StudentAcademicYearChart, { StudentStatusByYear } from '~/components/chart/student_academic_year_chart';
import CourseCategoryPieChart, { CourseCategoryItem } from '~/components/chart/course_category_pie_chart';

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
    const [varietiesMap, setVarietiesMap] = createSignal<Record<string, any>>({});
    const [groupsMap, setGroupsMap] = createSignal<Record<string, any>>({});

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
            // Fetch Unit Master + All Required Entities in Parallel where unit_id = targetUnitId
            const [
                unitRes,
                coursesRes,
                curriculumsRes,
                studentsRes,
                staffesRes,
                empRes,
                posTypeRes,
                varietyRes,
                groupRes
            ] = await Promise.all([
                masterApiShow<any>('institution/master/units', targetUnitId),
                masterApiIndex<any>('academic/course/master/courses', { unit_id: targetUnitId, page: 1, per_page: 500 }),
                masterApiIndex<any>('academic/course/master/curriculums', { unit_id: targetUnitId, page: 1, per_page: 100 }),
                masterApiIndex<any>('academic/student/master/students', { unit_id: targetUnitId, page: 1, per_page: 500 }),
                masterApiIndex<any>('institution/master/staffes', { unit_id: targetUnitId, page: 1, per_page: 100 }),
                masterApiIndex<any>('institution/master/employees', { page: 1, per_page: 500 }).catch(() => ({ data: [] })),
                masterApiIndex<any>('institution/reference/position-types', { page: 1, per_page: 500 }).catch(() => ({ data: [] })),
                masterApiIndex<any>('academic/course/reference/varieties', { page: 1, per_page: 200 }).catch(() => ({ data: [] })),
                masterApiIndex<any>('academic/course/reference/groups', { page: 1, per_page: 200 }).catch(() => ({ data: [] }))
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

            // Map course varieties & groups for categorizing courses
            const vMap: Record<string, any> = {};
            if (varietyRes?.data && Array.isArray(varietyRes.data)) {
                for (const v of varietyRes.data) {
                    if (v.id) vMap[v.id] = v;
                }
            }
            setVarietiesMap(vMap);

            const gMap: Record<string, any> = {};
            if (groupRes?.data && Array.isArray(groupRes.data)) {
                for (const g of groupRes.data) {
                    if (g.id) gMap[g.id] = g;
                }
            }
            setGroupsMap(gMap);

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

    // Aggregated Student Status by Academic Year for Line Chart
    const studentYearlyTrend = createMemo<StudentStatusByYear[]>(() => {
        const map = new Map<string, StudentStatusByYear>();

        for (const s of students()) {
            const rawYear = s.academic_year_name || (s.registered ? s.registered.substring(0, 4) : 'Belum Ditentukan');
            const year = rawYear.trim() || 'Belum Ditentukan';

            if (!map.has(year)) {
                map.set(year, {
                    yearName: year,
                    total: 0,
                    active: 0,
                    leave: 0,
                    graduated: 0,
                    other: 0,
                });
            }
            const item = map.get(year)!;
            item.total += 1;

            const status = (s.status_name || '').toLowerCase();
            if (status.includes('aktif') || status.includes('active')) {
                item.active += 1;
            } else if (status.includes('cuti') || status.includes('leave')) {
                item.leave += 1;
            } else if (status.includes('lulus') || status.includes('graduat')) {
                item.graduated += 1;
            } else {
                item.other += 1;
            }
        }

        return Array.from(map.values()).sort((a, b) => a.yearName.localeCompare(b.yearName));
    });

    // Aggregated Course Distribution by Categories for Pie Chart
    const courseCategoryDistribution = createMemo<CourseCategoryItem[]>(() => {
        const vMap = varietiesMap();
        const gMap = groupsMap();
        const map = new Map<string, { count: number; credits: number }>();

        for (const c of courses()) {
            let catName = '';
            if (c.variety_id && vMap[c.variety_id]?.name) {
                catName = vMap[c.variety_id].name;
            } else if (c.group_id && gMap[c.group_id]?.name) {
                catName = gMap[c.group_id].name;
            } else if (c.variety?.name) {
                catName = c.variety.name;
            } else if (c.group?.name) {
                catName = c.group.name;
            } else if (c.practice_credit > 0 && (!c.lecture_credit || c.lecture_credit === 0)) {
                catName = 'Mata Kuliah Praktik';
            } else if (c.lecture_credit > 0 && (!c.practice_credit || c.practice_credit === 0)) {
                catName = 'Mata Kuliah Teori';
            } else if (c.lecture_credit > 0 && c.practice_credit > 0) {
                catName = 'Teori & Praktik';
            } else {
                catName = 'Mata Kuliah Umum';
            }

            const credits = Number(c.total_credit) || ((Number(c.lecture_credit) || 0) + (Number(c.practice_credit) || 0));
            if (!map.has(catName)) {
                map.set(catName, { count: 0, credits: 0 });
            }
            const item = map.get(catName)!;
            item.count += 1;
            item.credits += credits;
        }

        const colorPalette = [
            '#0ea5e9', // Sky Blue
            '#10b981', // Emerald
            '#f59e0b', // Amber
            '#8b5cf6', // Purple
            '#ec4899', // Pink
            '#06b6d4', // Cyan
            '#f97316', // Orange
            '#6366f1', // Indigo
            '#64748b', // Slate
        ];

        return Array.from(map.entries()).map(([name, val], idx) => ({
            name,
            count: val.count,
            credits: val.credits,
            color: colorPalette[idx % colorPalette.length],
        }));
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
                        <A 
                            href="/course-department/academic/course/master/curriculum"
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 hover:border-emerald-500 transition-all block group"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Kurikulum</span>
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
                        </A>

                        {/* 2. Mata Kuliah (academic_course_master.courses) */}
                        <A 
                            href="/course-department/academic/course/master/course"
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 hover:border-teal-500 transition-all block group"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-teal-600 transition-colors">Mata Kuliah</span>
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
                        </A>

                        {/* 3. Mahasiswa (academic_student_master.students) */}
                        <A 
                            href="/course-department/academic/student/master"
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 hover:border-blue-500 transition-all block group"
                        >
                            <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                <span class="text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-blue-600 transition-colors">Mahasiswa</span>
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
                        </A>

                        {/* 4. Staff (institution_master.staffes) */}
                        <div 
                            class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2"
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

                    {/* Charts Section: Scope Unit ID Real Server Data */}
                    <div class="space-y-6 pt-2">
                        {/* Section Header */}
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <div>
                                <h2 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                    <span class="size-2.5 rounded-full bg-teal-500"></span>
                                    Visualisasi & Analisis Data Program Studi
                                </h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Tren mahasiswa per tahun ajaran dan proporsi mata kuliah berbasis data real server untuk Unit ID {unitId()}.
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-semibold border border-teal-200 dark:border-teal-800">
                                    Real Server Data
                                </span>
                            </div>
                        </div>

                        {/* Chart 1: Line Chart - Academic Year vs Total Student with Status */}
                        <StudentAcademicYearChart
                            data={studentYearlyTrend()}
                            unitName={unitName()}
                        />

                        {/* Chart 2: Pie Chart - Course with Categories */}
                        <CourseCategoryPieChart
                            data={courseCategoryDistribution()}
                            unitName={unitName()}
                        />
                    </div>
                </Show>
            </main>
        </div>
    );
}
