import { createSignal, onMount, createEffect, Show, For, createMemo, ErrorBoundary } from 'solid-js';
import { useParams, useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { Loader, ErrorFallback } from '~/components/loader';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow, masterApiIndex, getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';
import {
    currentUserSignal,
    userRolesSignal,
    currentRoleIdSignal,
    refreshAuthState,
    getStoredUser,
    isStaffProgramStudi
} from '~/lib/authStore';
import { getStorageItem, setStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { InstitutionMasterUnit } from '~/models/institution/master/Unit';
import type { InstitutionMasterStaff } from '~/models/institution/master/Staff';
import EChart from '~/components/chart/echart_component';
import PopupBlockedAlert from '~/components/alert/PopupBlockedAlert';

// In-memory module-level cache for static reference tables across navigations
let cachedPositionTypes: any[] | null = null;
let activeFetchId = '';

export default function CourseDepartmentUnitShowPage() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const rawQueryId = ((params.id as string) || (searchParams.id as string) || (searchParams.unit_id as string) || '').trim();
    const initialQueryId = rawQueryId === '[id]' || rawQueryId === ':id' ? '' : rawQueryId;
    const [unitId, setUnitId] = createSignal<string>(initialQueryId);
    const [unitData, setUnitData] = createSignal<any | null>(null);

    // Real Data from server get_unit_dashboard
    const [staffes, setStaffes] = createSignal<any[]>([]);
    const [totalCurriculum, setTotalCurriculum] = createSignal<number>(0);
    const [matakuliah, setMatakuliah] = createSignal<{ total_matakuliah: number; total_credit: number }>({
        total_matakuliah: 0,
        total_credit: 0
    });

    // 4 ECharts Option Datasets from get_unit_dashboard
    const [studentAcademicYearChart, setStudentAcademicYearChart] = createSignal<any | null>(null);
    const [registeredStudentAcademicYearChart, setRegisteredStudentAcademicYearChart] = createSignal<any | null>(null);
    const [courseCategoryDistribution, setCourseCategoryDistribution] = createSignal<any | null>(null);
    const [studentSubDistrictDistribution, setStudentSubDistrictDistribution] = createSignal<any | null>(null);

    // Reference map for staff position types
    const [positionTypesMap, setPositionTypesMap] = createSignal<Record<string, any>>({});

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

    // Step 2: Fetch real server data using the unified get_unit_dashboard endpoint
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
            let actualUnitId = targetUnitId;

            // Attempt to fetch dashboard from /institution/master/units/{unit_id}/dashboard
            let dashRes: Response | null = await fetch(
                `${getBaseApiUrl()}/institution/master/units/${encodeURIComponent(actualUnitId)}/dashboard`,
                {
                    method: 'GET',
                    headers: getAuthHeaders(),
                }
            );

            // If not successful, check if targetUnitId was actually a staff ID
            if (!dashRes.ok) {
                try {
                    const staffRes = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', targetUnitId);
                    if (staffRes.data?.unit_id) {
                        actualUnitId = staffRes.data.unit_id;
                        dashRes = await fetch(
                            `${getBaseApiUrl()}/institution/master/units/${encodeURIComponent(actualUnitId)}/dashboard`,
                            {
                                method: 'GET',
                                headers: getAuthHeaders(),
                            }
                        );
                    }
                } catch {
                    // Ignore
                }
            }

            // Fallback resolution if still not found
            if (!dashRes || !dashRes.ok) {
                const fallbackUnitId = await resolveCurrentUserUnitId();
                if (fallbackUnitId && fallbackUnitId !== targetUnitId) {
                    activeFetchId = '';
                    setUnitId(fallbackUnitId);
                    return loadUnitData(fallbackUnitId);
                }
                throw new Error(`HTTP error ${dashRes ? dashRes.status : 'unknown'}`);
            }

            const dashJson = await dashRes.json();
            const dashboard = dashJson.data ?? dashJson;

            if (dashboard && dashboard.id) {
                actualUnitId = dashboard.id;
                setUnitId(actualUnitId);
                setStorageItem('unit_id', actualUnitId);

                if (
                    typeof window !== 'undefined' &&
                    (window.location.pathname.includes('[id]') ||
                        window.location.pathname.includes(':id') ||
                        !window.location.pathname.includes(actualUnitId))
                ) {
                    window.history.replaceState(null, '', `/course-department/institution/master/unit/${actualUnitId}/show`);
                }

                // Set unit model details and embedded relations
                setUnitData(dashboard);
                setStaffes(dashboard.staffes || []);
                setTotalCurriculum(Number(dashboard.total_curriculum) || 0);
                setMatakuliah(dashboard.matakuliah || { total_matakuliah: 0, total_credit: 0 });
                setStudentAcademicYearChart(dashboard.student_academic_year_chart || null);
                setRegisteredStudentAcademicYearChart(dashboard.registered_student_academic_year_chart || null);
                setCourseCategoryDistribution(dashboard.course_category_distribution || null);
                setStudentSubDistrictDistribution(dashboard.student_sub_district_distribution || null);

                // Fetch position types reference for staff titles (cached across navigations)
                if (!cachedPositionTypes) {
                    try {
                        const posRes = await masterApiIndex<any>('institution/reference/position-type', { page: 1, per_page: 50 });
                        cachedPositionTypes = posRes.data || [];
                    } catch {
                        cachedPositionTypes = [];
                    }
                }
                const posMap: Record<string, any> = {};
                for (const pt of (cachedPositionTypes || [])) {
                    if (pt.id) posMap[pt.id] = pt;
                }
                setPositionTypesMap(posMap);
            } else {
                toast.danger('Data Unit / Program Studi tidak ditemukan di server.');
            }
        } catch (err) {
            console.error('Error fetching unit dashboard real data:', err);
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
        const pos = positionTypesMap();
        return staffes().map(st => {
            const positionType = st.position_type_id ? pos[st.position_type_id] : null;
            const positionName = String(positionType?.name || st.position_type?.name || 'Staff');
            const employeeName = String(st.name || '-');
            const employeeCode = String(st.code || '-');

            return {
                ...st,
                employeeName,
                employeeCode,
                positionName,
                positionType,
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

    // Total and active student metrics derived from real server dashboard charts
    const totalStudents = createMemo(() => {
        const regChart = registeredStudentAcademicYearChart();
        if (regChart?.series && regChart.series.length > 0) {
            let total = 0;
            for (const s of regChart.series) {
                if (Array.isArray(s.data)) {
                    for (const d of s.data) {
                        total += Number(d) || 0;
                    }
                }
            }
            if (total > 0) return total;
        }

        const distChart = studentSubDistrictDistribution();
        if (distChart?.dataset?.source && distChart.dataset.source.length > 1) {
            let total = 0;
            for (let i = 1; i < distChart.dataset.source.length; i++) {
                total += Number(distChart.dataset.source[i][0]) || 0;
            }
            if (total > 0) return Math.round(total);
        }

        const stChart = studentAcademicYearChart();
        if (stChart?.series && stChart.series.length > 0) {
            let total = 0;
            for (const s of stChart.series) {
                if (Array.isArray(s.data)) {
                    for (const d of s.data) {
                        total += Number(d) || 0;
                    }
                }
            }
            return total;
        }
        return 0;
    });

    const totalActiveStudents = createMemo(() => {
        const stChart = studentAcademicYearChart();
        if (!stChart?.series) return 0;
        const activeSeries = stChart.series.find((s: any) =>
            (s.name || '').toLowerCase().includes('aktif') && !(s.name || '').toLowerCase().includes('non')
        );
        if (!activeSeries || !Array.isArray(activeSeries.data)) return 0;
        return activeSeries.data.reduce((acc: number, curr: number) => acc + (Number(curr) || 0), 0);
    });

    // 1. ECharts Option: Student Academic Year Status Line Chart
    const studentAcademicYearOption = createMemo(() => {
        const raw = studentAcademicYearChart();
        if (!raw || !raw.series || raw.series.length === 0) return null;

        const colors: Record<string, string> = {
            'Aktif': '#10b981',
            'Cuti': '#f59e0b',
            'Lulus': '#3b82f6',
            'Putus Studi': '#ef4444',
            'Keluar': '#f97316',
            'Non-Aktif': '#64748b',
            'Sedang Double Degree': '#8b5cf6',
            'Kampus Merdeka': '#06b6d4',
            'Tidak Diketahui': '#94a3b8',
        };

        return {
            tooltip: {
                trigger: 'axis',
                ...raw.tooltip,
            },
            legend: {
                top: '0%',
                left: 'center',
                type: 'scroll',
                textStyle: { color: '#64748b' },
                ...raw.legend,
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '8%',
                top: '16%',
                containLabel: true,
                ...raw.grid,
            },
            xAxis: {
                ...raw.xAxis,
                axisLabel: {
                    rotate: 30,
                    fontSize: 11,
                    color: '#64748b',
                },
            },
            yAxis: {
                ...raw.yAxis,
                axisLabel: {
                    fontSize: 11,
                    color: '#64748b',
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(148, 163, 184, 0.15)',
                    },
                },
            },
            series: raw.series.map((s: any) => ({
                ...s,
                smooth: 0.3,
                lineStyle: {
                    width: 2.5,
                    color: colors[s.name] || undefined,
                },
                itemStyle: {
                    color: colors[s.name] || undefined,
                },
                symbol: 'circle',
                symbolSize: 6,
            })),
        };
    });

    // 2. ECharts Option: Registered Student Gender Line Chart
    const registeredStudentGenderOption = createMemo(() => {
        const raw = registeredStudentAcademicYearChart();
        if (!raw || !raw.series || raw.series.length === 0) return null;

        const genderColors: Record<string, string> = {
            'Laki-Laki': '#0284c7',
            'Perempuan': '#ec4899',
        };

        return {
            tooltip: {
                trigger: 'axis',
                ...raw.tooltip,
            },
            legend: {
                top: '0%',
                left: 'center',
                textStyle: { color: '#64748b' },
                ...raw.legend,
            },
            grid: {
                left: '3%',
                right: '4%',
                bottom: '8%',
                top: '16%',
                containLabel: true,
                ...raw.grid,
            },
            xAxis: {
                ...raw.xAxis,
                axisLabel: {
                    rotate: 30,
                    fontSize: 11,
                    color: '#64748b',
                },
            },
            yAxis: {
                ...raw.yAxis,
                axisLabel: {
                    fontSize: 11,
                    color: '#64748b',
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(148, 163, 184, 0.15)',
                    },
                },
            },
            series: raw.series.map((s: any) => {
                const color = genderColors[s.name] || (String(s.name).toLowerCase().includes('laki') ? '#0284c7' : '#ec4899');
                return {
                    ...s,
                    smooth: 0.35,
                    lineStyle: {
                        width: 3,
                        color,
                    },
                    itemStyle: {
                        color,
                    },
                    symbol: 'circle',
                    symbolSize: 7,
                };
            }),
        };
    });

    // 3. ECharts Option: Course Category Donut/Pie Chart
    const courseCategoryOption = createMemo(() => {
        const raw = courseCategoryDistribution();
        if (!raw || !raw.series || raw.series.length === 0) return null;

        const palette = [
            '#0d9488', // teal
            '#0284c7', // sky
            '#8b5cf6', // purple
            '#f59e0b', // amber
            '#ec4899', // pink
            '#10b981', // emerald
            '#f97316', // orange
            '#6366f1', // indigo
            '#64748b', // slate
        ];

        return {
            tooltip: {
                trigger: 'item',
                formatter: '{b}: {c} Mata Kuliah ({d}%)',
                ...raw.tooltip,
            },
            legend: {
                top: '5%',
                left: 'center',
                type: 'scroll',
                textStyle: { color: '#64748b' },
                ...raw.legend,
            },
            color: palette,
            series: raw.series.map((s: any) => ({
                ...s,
                radius: ['42%', '70%'],
                center: ['50%', '58%'],
                itemStyle: {
                    borderRadius: 8,
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    ...s.itemStyle,
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 18,
                        fontWeight: 'bold',
                    },
                },
            })),
        };
    });

    // 4. ECharts Option: Student Sub-District Distribution Bar Chart
    const subDistrictOption = createMemo(() => {
        const raw = studentSubDistrictDistribution();
        if (!raw || !raw.dataset?.source || raw.dataset.source.length <= 1) return null;

        return {
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'shadow',
                },
                formatter: (params: any) => {
                    const item = Array.isArray(params) ? params[0] : params;
                    const val = item.value;
                    const count = Array.isArray(val) ? val[0] : val;
                    const name = Array.isArray(val) ? val[1] : item.name;
                    return `<b>${name}</b>: ${count} Mahasiswa`;
                },
            },
            grid: {
                left: '3%',
                right: '8%',
                bottom: '5%',
                top: '8%',
                containLabel: true,
                ...raw.grid,
            },
            dataset: {
                dimensions: ['amount', 'product'],
                source: raw.dataset.source,
            },
            xAxis: {
                type: 'value',
                name: 'Mahasiswa',
                nameLocation: 'end',
                axisLabel: {
                    fontSize: 11,
                    color: '#64748b',
                },
                splitLine: {
                    lineStyle: {
                        color: 'rgba(148, 163, 184, 0.15)',
                    },
                },
            },
            yAxis: {
                type: 'category',
                inverse: true, // Display highest at top
                axisLabel: {
                    interval: 0,
                    fontSize: 11,
                    color: '#64748b',
                },
            },
            series: [
                {
                    type: 'bar',
                    encode: {
                        x: 'amount',
                        y: 'product',
                    },
                    itemStyle: {
                        color: '#0d9488',
                        borderRadius: [0, 4, 4, 0],
                    },
                    label: {
                        show: true,
                        position: 'right',
                        formatter: '{@[0]}',
                        fontSize: 11,
                        color: '#64748b',
                    },
                },
            ],
        };
    });

    // Unit identity helpers
    const unitName = () => unitData()?.name || 'Program Studi & Jurusan';
    const unitCode = () => unitData()?.code || unitData()?.alphabet_code || '-';
    const educationName = () => unitData()?.education?.name || unitData()?.education_name || 'Strata-1 (S1)';
    const facultyName = () => unitData()?.institution?.name || unitData()?.parent?.name || 'Fakultas / Institusi';

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
                            message={`Memuat data dashboard terpadu untuk Unit ID ${unitId()}...`}
                            color="teal"
                            size="lg"
                        />
                    </Show>

                    {/* Main Content Body */}
                    <Show when={!isLoading()}>
                        {/* 4 Summary Cards based on real dashboard server data */}
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* 1. Kurikulum (dashboard.total_curriculum) */}
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
                                        {totalCurriculum()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-medium">Kurikulum Prodi</span>
                                </div>
                                <div class="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono truncate">
                                    Kurikulum Aktif & Terdata
                                </div>
                            </A>

                            {/* 2. Mata Kuliah (dashboard.matakuliah: total_matakuliah & total_credit) */}
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
                                        {matakuliah().total_matakuliah}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-medium">Mata Kuliah</span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    Total SKS: {matakuliah().total_credit} SKS
                                </div>
                            </A>

                            {/* 3. Mahasiswa (dashboard.student_academic_year_chart & registered_student_academic_year_chart) */}
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
                                        {totalStudents()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-medium">Mahasiswa Terdaftar</span>
                                </div>
                                <div class="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                                    {totalActiveStudents()} Mahasiswa Aktif
                                </div>
                            </A>

                            {/* 4. Staff & Pimpinan (dashboard.staffes) */}
                            <div class="p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
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

                        {/* Visualisasi & Analisis Data Dashboard Terpadu */}
                        <div class="space-y-6 pt-2">
                            {/* Section Header */}
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <div>
                                    <h2 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        <span class="size-2.5 rounded-xs bg-teal-500"></span>
                                        Visualisasi & Analisis Data Program Studi
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Statistik akademik, tren mahasiswa, distribusi mata kuliah, dan sebaran demografi asal mahasiswa untuk Unit ID {unitId()}.
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="px-2.5 py-1 rounded-xs bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-semibold border border-teal-200 dark:border-teal-800">
                                        Real Server Dashboard
                                    </span>
                                </div>
                            </div>

                            {/* Row 1: Two Academic Year Line Charts */}
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Chart 1: Student Status Trend by Academic Year */}
                                <div class="bg-white dark:bg-neutral-800 rounded-xs p-5 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-3">
                                    <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-2.5">
                                        <div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <span class="size-2 rounded-full bg-emerald-500"></span>
                                                Tren Status Mahasiswa per Tahun Ajaran
                                            </h3>
                                            <p class="text-[11px] text-neutral-400">
                                                Statistik status mahasiswa (Aktif, Cuti, Lulus, Putus Studi, dsb.)
                                            </p>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-semibold">
                                            Status Trend
                                        </span>
                                    </div>

                                    <Show
                                        when={studentAcademicYearOption()}
                                        fallback={
                                            <div class="h-80 flex items-center justify-center text-neutral-400 text-xs font-mono">
                                                Data tren mahasiswa belum tersedia
                                            </div>
                                        }
                                    >
                                        <EChart option={studentAcademicYearOption()!} height={360} />
                                    </Show>
                                </div>

                                {/* Chart 2: Registered Student Gender Trend by Academic Year */}
                                <div class="bg-white dark:bg-neutral-800 rounded-xs p-5 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-3">
                                    <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-2.5">
                                        <div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <span class="size-2 rounded-full bg-sky-500"></span>
                                                Tren Mahasiswa Berdasarkan Gender
                                            </h3>
                                            <p class="text-[11px] text-neutral-400">
                                                Proporsi mahasiswa Laki-Laki & Perempuan per tahun ajaran
                                            </p>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 font-semibold">
                                            Gender Trend
                                        </span>
                                    </div>

                                    <Show
                                        when={registeredStudentGenderOption()}
                                        fallback={
                                            <div class="h-80 flex items-center justify-center text-neutral-400 text-xs font-mono">
                                                Data gender mahasiswa belum tersedia
                                            </div>
                                        }
                                    >
                                        <EChart option={registeredStudentGenderOption()!} height={360} />
                                    </Show>
                                </div>
                            </div>

                            {/* Row 2: Course Category Donut Chart & Sub-District Bar Chart */}
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Chart 3: Course Category Distribution (Donut Chart) */}
                                <div class="bg-white dark:bg-neutral-800 rounded-xs p-5 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-3">
                                    <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-2.5">
                                        <div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <span class="size-2 rounded-full bg-teal-500"></span>
                                                Distribusi Kategori Mata Kuliah
                                            </h3>
                                            <p class="text-[11px] text-neutral-400">
                                                Proporsi klasifikasi dan jenis mata kuliah dalam program studi
                                            </p>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-semibold">
                                            {matakuliah().total_matakuliah} Mata Kuliah
                                        </span>
                                    </div>

                                    <Show
                                        when={courseCategoryOption()}
                                        fallback={
                                            <div class="h-80 flex items-center justify-center text-neutral-400 text-xs font-mono">
                                                Data kategori mata kuliah belum tersedia
                                            </div>
                                        }
                                    >
                                        <EChart option={courseCategoryOption()!} height={360} />
                                    </Show>
                                </div>

                                {/* Chart 4: Student Sub-District Distribution (Horizontal Bar Chart) */}
                                <div class="bg-white dark:bg-neutral-800 rounded-xs p-5 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-3">
                                    <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700/60 pb-2.5">
                                        <div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                                <span class="size-2 rounded-full bg-amber-500"></span>
                                                Sebaran Asal Mahasiswa (Kecamatan)
                                            </h3>
                                            <p class="text-[11px] text-neutral-400">
                                                Distribusi wilayah asal mahasiswa berdasarkan kode kecamatan
                                            </p>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-semibold">
                                            Demografi
                                        </span>
                                    </div>

                                    <Show
                                        when={subDistrictOption()}
                                        fallback={
                                            <div class="h-80 flex items-center justify-center text-neutral-400 text-xs font-mono">
                                                Data sebaran asal mahasiswa belum tersedia
                                            </div>
                                        }
                                    >
                                        <EChart option={subDistrictOption()!} height={360} />
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </Show>
                </ErrorBoundary>
            </main>
        </div>
    );
}
