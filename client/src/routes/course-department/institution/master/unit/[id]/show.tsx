import { createSignal, onMount, createEffect, Show, For, createMemo, ErrorBoundary } from 'solid-js';
import { useParams, useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { Loader, ErrorFallback } from '~/components/loader';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow, masterApiIndex } from '~/controllers/master/masterApiController';
import {
    currentUserSignal,
    userRolesSignal,
    activeRoleSignal,
    currentRoleIdSignal,
    getStoredRoles,
    refreshAuthState,
    getStoredUser,
    isStaffProgramStudi
} from '~/lib/authStore';
import { getStorageItem, setStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { InstitutionMasterUnit } from '~/models/institution/master/Unit';
import type { InstitutionMasterStaff } from '~/models/institution/master/Staff';
import StudentAcademicYearChart, { StudentStatusByYear } from '~/components/chart/student_academic_year_chart';
import CourseCategoryPieChart, { CourseCategoryItem } from '~/components/chart/course_category_pie_chart';
import PopupBlockedAlert from '~/components/alert/PopupBlockedAlert';

// In-memory module-level cache for static reference tables across navigations
let cachedVarieties: any[] | null = null;
let cachedGroups: any[] | null = null;
let cachedPositionTypes: any[] | null = null;
let activeFetchId = '';

export default function CourseDepartmentUnitShowPage() {
    const params = useParams();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const rawQueryId = ((params.id as string) || (searchParams.id as string) || (searchParams.unit_id as string) || '').trim();
    const initialQueryId = rawQueryId === '[id]' || rawQueryId === ':id' ? '' : rawQueryId;
    const [unitId, setUnitId] = createSignal<string>(initialQueryId);
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

    // Helper to resolve unit_id from a role item
    const resolveRoleUnitId = async (role: any): Promise<string | null> => {
        if (!role) return null;
        if (role.unit_id && role.unit_id !== '00000000-0000-0000-0000-000000000000') {
            return role.unit_id;
        }
        if (!role.roleable_id || role.roleable_id === '00000000-0000-0000-0000-000000000000') {
            return null;
        }
        const rType = String(role.roleable_type || '');
        const rName = String(role.name || '').toLowerCase();

        // Direct Unit role
        if (rType === 'Unit' || rType.includes('Unit')) {
            return role.roleable_id;
        }

        // Staff / Kaprodi role pointing to institution_master.staffes
        if (
            rType.includes('Staff') ||
            isStaffProgramStudi(role) ||
            rName.includes('kaprodi') ||
            rName.includes('prodi') ||
            rName.includes('jurusan')
        ) {
            try {
                const staffRes = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', role.roleable_id);
                if (staffRes.data?.unit_id) {
                    return staffRes.data.unit_id;
                }
            } catch {
                // Continue checking other candidates
            }
        }
        return null;
    };

    // Step 1: Resolve the Current User's Unit ID
    const resolveCurrentUserUnitId = async (): Promise<string> => {
        // Priority 1: Direct route parameter or query parameter if navigated with real ID
        const rawParam = ((params.id as string) || (searchParams.id as string) || (searchParams.unit_id as string) || '').trim();
        const queryId = (rawParam === '[id]' || rawParam === ':id') ? '' : rawParam;

        if (queryId) {
            // Check if queryId is a valid Unit ID
            try {
                const checkUnit = await masterApiShow<InstitutionMasterUnit>('institution/master/units', queryId);
                if (checkUnit.data?.id) {
                    setStorageItem('unit_id', checkUnit.data.id);
                    return checkUnit.data.id;
                }
            } catch {
                // Not a unit, check if queryId is a Staff ID
            }

            // Check if queryId is a Staff ID (e.g. from roleable_id)
            try {
                const checkStaff = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', queryId);
                if (checkStaff.data?.unit_id) {
                    const realUnitId = checkStaff.data.unit_id;
                    setStorageItem('unit_id', realUnitId);
                    if (typeof window !== 'undefined') {
                        window.history.replaceState(null, '', `/course-department/institution/master/unit/${realUnitId}/show`);
                    }
                    return realUnitId;
                }
            } catch {
                // Not a staff ID either
            }
        }

        // Priority 2: Stored unit_id on user or local storage
        const user = currentUserSignal();
        const storedUnitId = (user as any)?.unit_id || getStorageItem('unit_id');
        if (
            storedUnitId &&
            storedUnitId !== '00000000-0000-0000-0000-000000000000' &&
            storedUnitId !== '[id]' &&
            storedUnitId !== ':id'
        ) {
            try {
                const checkUnit = await masterApiShow<InstitutionMasterUnit>('institution/master/units', storedUnitId);
                if (checkUnit.data?.id) {
                    return checkUnit.data.id;
                }
            } catch {
                // If storedUnitId was actually a staff ID
                try {
                    const checkStaff = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', storedUnitId);
                    if (checkStaff.data?.unit_id) {
                        setStorageItem('unit_id', checkStaff.data.unit_id);
                        return checkStaff.data.unit_id;
                    }
                } catch {
                    // Ignore
                }
            }
        }

        // Priority 3: Active role or roles already in memory
        const currentRoleId = currentRoleIdSignal() || getStorageItem('current_role');
        const currentRoles = userRolesSignal();
        const storedRoles = getStoredUser()?.roles || [];
        const combinedRoles = [...currentRoles, ...storedRoles];

        const activeRoleItem = combinedRoles.find(r => r.id === currentRoleId);
        if (activeRoleItem) {
            const activeUnit = await resolveRoleUnitId(activeRoleItem);
            if (activeUnit) {
                setStorageItem('unit_id', activeUnit);
                return activeUnit;
            }
        }

        for (const role of combinedRoles) {
            const resolved = await resolveRoleUnitId(role);
            if (resolved) {
                setStorageItem('unit_id', resolved);
                return resolved;
            }
        }

        // Priority 4: Refresh auth state if local checks did not find unit_id
        await refreshAuthState();
        const refreshedRoles = userRolesSignal();
        for (const role of refreshedRoles) {
            const resolved = await resolveRoleUnitId(role);
            if (resolved) {
                setStorageItem('unit_id', resolved);
                return resolved;
            }
        }

        // Priority 5: Look up individual -> employee -> staffes -> unit_id
        let indId = currentUserSignal()?.individual_id || getStorageItem('individual_id');
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
                // Fix: singular /person/master/individual/{id}
                const indRes = await masterApiShow<any>('person/master/individual', indId);
                if (indRes.data?.employees && Array.isArray(indRes.data.employees)) {
                    for (const emp of indRes.data.employees) {
                        if (emp.id) {
                            const staffRes = await masterApiIndex<InstitutionMasterStaff>('institution/master/staffes', {
                                employee_id: emp.id,
                                page: 1,
                                per_page: 10,
                            });
                            const staffList = staffRes.data || [];
                            for (const st of staffList) {
                                if (st.unit_id && st.unit_id !== '00000000-0000-0000-0000-000000000000') {
                                    setStorageItem('unit_id', st.unit_id);
                                    return st.unit_id;
                                }
                            }
                        }
                    }
                }
            } catch {
                // Ignore
            }
        }

        // Priority 6: Fallback to the first Program Studi unit in database
        try {
            const unitsRes = await masterApiIndex<InstitutionMasterUnit>('institution/master/units', { page: 1, per_page: 20 });
            if (unitsRes.data && unitsRes.data.length > 0) {
                const fallbackId = unitsRes.data[0].id;
                setStorageItem('unit_id', fallbackId);
                return fallbackId;
            }
        } catch (e) {
            console.error('Failed to list units fallback:', e);
        }

        return '';
    };

    // Step 2: Fetch real server data for the resolved unit_id
    const loadUnitData = async (targetUnitId: string) => {
        if (!targetUnitId || targetUnitId === '[id]' || targetUnitId === ':id') {
            const resolved = await resolveCurrentUserUnitId();
            if (resolved && resolved !== targetUnitId) {
                setUnitId(resolved);
                return loadUnitData(resolved);
            }
            setIsLoading(false);
            return;
        }

        // Prevent duplicate concurrent fetches for the same unit_id
        if (activeFetchId === targetUnitId) {
            return;
        }
        activeFetchId = targetUnitId;
        setIsLoading(true);

        try {
            // First check if targetUnitId is valid unit or needs staff resolution
            let actualUnitId = targetUnitId;
            let unitRes = await masterApiShow<any>('institution/master/units', targetUnitId);

            if (!unitRes.data) {
                // Check if targetUnitId was actually a staff ID
                try {
                    const staffRes = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', targetUnitId);
                    if (staffRes.data?.unit_id) {
                        actualUnitId = staffRes.data.unit_id;
                        unitRes = await masterApiShow<any>('institution/master/units', actualUnitId);
                    }
                } catch {
                    // Ignore
                }
            }

            if (!unitRes.data) {
                // Fallback to resolveCurrentUserUnitId
                const fallbackUnitId = await resolveCurrentUserUnitId();
                if (fallbackUnitId && fallbackUnitId !== targetUnitId) {
                    activeFetchId = '';
                    setUnitId(fallbackUnitId);
                    return loadUnitData(fallbackUnitId);
                }
            }

            if (actualUnitId !== targetUnitId) {
                setUnitId(actualUnitId);
                setStorageItem('unit_id', actualUnitId);
                if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', `/course-department/institution/master/unit/${actualUnitId}/show`);
                }
            }

            // Concurrent promises for static references (utilizing module-level cache)
            // Note: position-type is singular in server API routes
            const refPromises = [
                cachedPositionTypes
                    ? Promise.resolve({ data: cachedPositionTypes })
                    : masterApiIndex<any>('institution/reference/position-type', { page: 1, per_page: 50 })
                        .then(r => { cachedPositionTypes = r.data || []; return r; })
                        .catch(() => ({ data: [] })),
                cachedVarieties
                    ? Promise.resolve({ data: cachedVarieties })
                    : masterApiIndex<any>('academic/course/reference/varieties', { page: 1, per_page: 50 })
                        .then(r => { cachedVarieties = r.data || []; return r; })
                        .catch(() => ({ data: [] })),
                cachedGroups
                    ? Promise.resolve({ data: cachedGroups })
                    : masterApiIndex<any>('academic/course/reference/groups', { page: 1, per_page: 50 })
                        .then(r => { cachedGroups = r.data || []; return r; })
                        .catch(() => ({ data: [] }))
            ];

            // Fetch Unit Master + Core Prodi Entities in Parallel
            const [
                coursesRes,
                curriculumsRes,
                studentsRes,
                staffesRes,
                [posTypeRes, varietyRes, groupRes]
            ] = await Promise.all([
                masterApiIndex<any>(`academic/course/master/courses/unit/${actualUnitId}`),
                masterApiIndex<any>(`academic/course/master/curriculums/unit/${actualUnitId}`),
                masterApiIndex<any>(`academic/student/master/students/unit/${actualUnitId}`),
                masterApiIndex<any>(`institution/master/staffes/unit/${actualUnitId}`),
                Promise.all(refPromises)
            ]);

            // Set Unit Record
            if (unitRes.data) {
                setUnitData(unitRes.data);
                setStorageItem('unit_id', actualUnitId);
                if (typeof window !== 'undefined' && (window.location.pathname.includes('[id]') || window.location.pathname.includes(':id'))) {
                    window.history.replaceState(null, '', `/course-department/institution/master/unit/${actualUnitId}/show`);
                }
            } else {
                toast.danger('Data Unit / Program Studi tidak ditemukan di server.');
            }

            // Set Real Entity Data from server
            const staffList = staffesRes?.data || [];
            setCourses(coursesRes?.data || []);
            setCurriculums(curriculumsRes?.data || []);
            setStudents(studentsRes?.data || []);
            setStaffes(staffList);

            // Map position types
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

            // Fetch only the specific employees for the staff assigned to this unit (1-3 targeted requests vs 500 records)
            const empIds = Array.from(new Set(
                staffList
                    .map((st: any) => st.employee_id)
                    .filter((id: any): id is string => Boolean(id) && id !== '00000000-0000-0000-0000-000000000000')
            ));

            if (empIds.length > 0) {
                const empResults = await Promise.all(
                    empIds.map(id => masterApiShow<any>('institution/master/employees', id).catch(() => null))
                );
                const empMap: Record<string, any> = {};
                for (const res of empResults) {
                    if (res?.data?.id) {
                        empMap[res.data.id] = res.data;
                    }
                }
                setEmployeesMap(empMap);
            }

        } catch (err) {
            console.error('Error fetching unit real data:', err);
            toast.danger('Gagal memuat data Program Studi dari server.');
        } finally {
            activeFetchId = '';
            setIsLoading(false);
        }
    };

    onMount(async () => {
        let id = unitId();
        if (!id || id === '[id]' || id === ':id') {
            id = await resolveCurrentUserUnitId();
            setUnitId(id);
        }
        if (id) {
            await loadUnitData(id);
        } else {
            setIsLoading(false);
        }
    });

    createEffect(() => {
        const raw = ((params.id as string) || (searchParams.id as string) || (searchParams.unit_id as string) || '').trim();
        const qId = (raw === '[id]' || raw === ':id') ? '' : raw;
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
            const positionName = String(positionType?.name || st.position_type?.name || st.name || 'Staff');
            const employeeName = String(employee?.name || st.employee?.name || st.name || '-');
            const employeeCode = String(employee?.code || st.employee?.code || st.code || '-');

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
            const p = (s.positionName || '').toLowerCase();
            return p.includes('kepala program studi') || p.includes('kaprodi') || p.includes('kajur');
        }) || null;
    });

    const sekprodi = createMemo(() => {
        return enrichedStaffes().find(s => {
            const p = (s.positionName || '').toLowerCase();
            return (p.includes('sekertaris') || p.includes('sekretaris')) && (p.includes('prodi') || p.includes('program studi') || p.includes('jurusan'));
        }) || null;
    });

    const otherStaffes = createMemo(() => {
        const k = kaprodi();
        const s = sekprodi();
        return enrichedStaffes().filter(item => item !== k && item !== s);
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
                {/* Pop-up blocker detection alert for PDF generation */}
                <PopupBlockedAlert />

                <ErrorBoundary
                    fallback={(err, reset) => (
                        <ErrorFallback
                            error={err}
                            reset={reset}
                            title="Terjadi Kendala Memuat Data Program Studi"
                            accentColor="teal"
                        />
                    )}
                >
                    {/* Hero Banner with Unit Details */}
                    <div class="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-900 rounded-xs p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
                        <div class="absolute -right-16 -top-16 w-80 h-80 bg-teal-500/10 rounded-xs blur-3xl pointer-events-none"></div>

                        <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div class="space-y-3">
                                <div class="flex items-center gap-2 flex-wrap">
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-emerald-500/20 text-emerald-200 text-xs font-mono font-semibold border border-emerald-400/30">
                                        <span>Kode: {unitCode()}</span>
                                    </span>
                                    <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-xs bg-blue-500/20 text-blue-200 text-xs font-semibold border border-blue-400/30">
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
                                    class="px-3.5 py-2 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
                                    </svg>
                                    <span>Kurikulum</span>
                                </A>

                                <A
                                    href="/course-department/academic/course/master/course"
                                    class="px-3.5 py-2 rounded-xs bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                    </svg>
                                    <span>Mata Kuliah</span>
                                </A>

                                <A
                                    href="/course-department/academic/student/master/student"
                                    class="px-3.5 py-2 rounded-xs bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/20 flex items-center gap-1.5 transition-colors"
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                                    </svg>
                                    <span>Mahasiswa</span>
                                </A>
                            </div>
                        </div>
                    </div>

                    {/* Loading State */}
                    <Show when={isLoading()}>
                        <Loader
                            message={`Memuat data real server untuk Unit ID ${unitId()}...`}
                            color="teal"
                            size="lg"
                        />
                    </Show>

                    {/* Main Content Body */}
                    <Show when={!isLoading()}>
                        {/* 4 Summary Cards based on real data */}
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 1. Kurikulum (academic_course_master.curriculums) */}
                            <A
                                href="/course-department/academic/course/master/curriculum"
                                class="p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 hover:border-emerald-500 transition-all block group"
                            >
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-emerald-600 transition-colors">Kurikulum</span>
                                    <div class="size-8 rounded-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" />
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
                                class="p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 hover:border-teal-500 transition-all block group"
                            >
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-teal-600 transition-colors">Mata Kuliah</span>
                                    <div class="size-8 rounded-xs bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10M6 10h10M6 14h6" />
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
                                href="/course-department/academic/student/master/student"
                                class="p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2 hover:border-blue-500 transition-all block group"
                            >
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider group-hover:text-blue-600 transition-colors">Mahasiswa</span>
                                    <div class="size-8 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
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
                                class="p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2"
                            >
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">Staff & Pimpinan</span>
                                    <div class="size-8 rounded-xs bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
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
                        <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <div class="flex items-center gap-2">
                                    <span class="size-2 rounded-xs bg-teal-500"></span>
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
                                <div class="p-4 rounded-xs bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200/80 dark:border-teal-800/60 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-teal-700 dark:text-teal-300">
                                            Kepala Program Studi (Kaprodi)
                                        </span>
                                        <span class="px-2 py-0.5 rounded-xs bg-teal-200/60 dark:bg-teal-800/60 text-teal-800 dark:text-teal-200 text-[10px] font-bold">
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
                                <div class="p-4 rounded-xs bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300">
                                            Sekertaris Program Studi (Sekprodi)
                                        </span>
                                        <span class="px-2 py-0.5 rounded-xs bg-emerald-200/60 dark:bg-emerald-800/60 text-emerald-800 dark:text-emerald-200 text-[10px] font-bold">
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
                                <div class="p-4 rounded-xs bg-slate-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                    <div class="flex items-center justify-between">
                                        <span class="text-[10px] font-mono uppercase font-bold tracking-wider text-neutral-600 dark:text-neutral-400">
                                            Staff Program Studi
                                        </span>
                                        <span class="px-2 py-0.5 rounded-xs bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-[10px] font-bold">
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
                                        <span class="size-2.5 rounded-xs bg-teal-500"></span>
                                        Visualisasi & Analisis Data Program Studi
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Tren mahasiswa per tahun ajaran dan proporsi mata kuliah berbasis data real server untuk Unit ID {unitId()}.
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="px-2.5 py-1 rounded-xs bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-semibold border border-teal-200 dark:border-teal-800">
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
                </ErrorBoundary>
            </main>
        </div>
    );
}
