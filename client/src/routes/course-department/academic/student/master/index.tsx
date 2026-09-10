import { createSignal, onMount, createEffect, For, Show, createMemo } from 'solid-js';
import { A, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    currentUserSignal,
    userRolesSignal,
    refreshAuthState,
    isStaffProgramStudi
} from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import { masterApiShow } from '~/controllers/master/masterApiController';
import {
    listStudents,
    listStudyUnits,
    listAcademicYears,
    listStudentStatuses,
    listStudentAcademicYears,
    StudentMasterItem
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import type { InstitutionMasterStaff } from '~/models/institution/master/Staff';

export default function CourseDepartmentStudentMasterPage() {
    const [searchParams, setSearchParams] = useSearchParams();

    // Data states
    const [students, setStudents] = createSignal<StudentMasterItem[]>([]);
    const [units, setUnits] = createSignal<any[]>([]);
    const [academicYears, setAcademicYears] = createSignal<any[]>([]);
    const [unitAcademicYears, setUnitAcademicYears] = createSignal<any[]>([]);
    const [statuses, setStatuses] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isResolvingUnit, setIsResolvingUnit] = createSignal(true);

    // Selected department / unit
    const [selectedUnitId, setSelectedUnitId] = createSignal<string>('');
    const [activeUnitData, setActiveUnitData] = createSignal<any | null>(null);

    // Filter states
    const [searchName, setSearchName] = createSignal<string>('');
    const [searchCode, setSearchCode] = createSignal<string>('');
    const [selectedAcademicYearId, setSelectedAcademicYearId] = createSignal<string>('');
    const [selectedStatusId, setSelectedStatusId] = createSignal<string>('');

    // Sorting state (default: code ascending)
    const [sortParam, setSortParam] = createSignal<string>((searchParams.sort as string) || 'code-asc');

    // Pagination states
    const [page, setPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);
    const [totalPages, setTotalPages] = createSignal(1);
    const [totalItems, setTotalItems] = createSignal(0);

    // Debounce timer for search inputs
    let searchDebounceTimer: any = null;

    // Helper: resolve current user department unit_id
    const resolveDepartmentUnitId = async (unitsList: any[]): Promise<string> => {
        // Priority 1: Query parameter in URL
        const queryUnit = (searchParams.unit_id as string) || (searchParams.id as string);
        if (queryUnit && queryUnit.trim() !== '') {
            return queryUnit.trim();
        }

        await refreshAuthState();
        const roles = userRolesSignal();
        const user = currentUserSignal();

        // Priority 2: Stored unit_id
        const storedUnitId = (user as any)?.unit_id || getStorageItem('unit_id');
        if (storedUnitId && storedUnitId !== '00000000-0000-0000-0000-000000000000') {
            return storedUnitId;
        }

        // Priority 3: Active role or user roles with roleable_id
        for (const role of roles) {
            if (role.roleable_id && role.roleable_id !== '00000000-0000-0000-0000-000000000000') {
                if (role.roleable_type === 'Staff' || isStaffProgramStudi(role)) {
                    try {
                        const staffRes = await masterApiShow<InstitutionMasterStaff>('institution/master/staffes', role.roleable_id);
                        if (staffRes.data?.unit_id) {
                            return staffRes.data.unit_id;
                        }
                    } catch {
                        // continue checking
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
                const curUserRes = await GetCurrentUser();
                if (curUserRes?.code === 200 && curUserRes.data?.individual_id) {
                    indId = curUserRes.data.individual_id;
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

        // Priority 5: Default fallback to first unit
        if (unitsList && unitsList.length > 0) {
            return unitsList[0].id;
        }

        return '';
    };

    // Load reference options (units, academic years, statuses)
    const loadReferences = async () => {
        try {
            const [uList, yList, sList] = await Promise.all([
                listStudyUnits(),
                listAcademicYears(),
                listStudentStatuses(),
            ]);

            setUnits(uList);
            setAcademicYears(yList);
            setStatuses(sList);

            // Resolve initial department unit
            const resolvedUnit = await resolveDepartmentUnitId(uList);
            setSelectedUnitId(resolvedUnit);

            if (resolvedUnit) {
                const matchingUnit = uList.find(u => u.id === resolvedUnit);
                setActiveUnitData(matchingUnit || null);
                await loadUnitAcademicYears(resolvedUnit);
            }
        } catch (err) {
            console.error('Error loading reference filters:', err);
        } finally {
            setIsResolvingUnit(false);
        }
    };

    // Load academic years specific to students enrolled in the given unit_id or institution_id
    const loadUnitAcademicYears = async (targetUnitId: string) => {
        if (!targetUnitId) {
            setUnitAcademicYears([]);
            return;
        }

        try {
            const isAll = targetUnitId === 'all';
            const instId = (searchParams.institution_id as string) || (activeUnitData()?.institution_id as string) || undefined;

            // Fetch distinct academic years scoped directly from backend
            const distinctYears = await listStudentAcademicYears({
                unit_id: !isAll ? targetUnitId : undefined,
                institution_id: isAll ? instId : undefined,
            });

            setUnitAcademicYears(distinctYears);

            // If the currently selected academic year is not among this unit's cohorts, reset it
            if (selectedAcademicYearId() && !distinctYears.some(yr => yr.id === selectedAcademicYearId())) {
                setSelectedAcademicYearId('');
            }
        } catch (err) {
            console.error('Error loading academic years for unit:', err);
            setUnitAcademicYears([]);
        }
    };

    // Main fetch students query based on unit_id, institution_id, and filters
    const fetchStudents = async () => {
        const currentUnitId = selectedUnitId();
        const currentInstId = (searchParams.institution_id as string) || (activeUnitData()?.institution_id as string) || '';

        if (!currentUnitId && !currentInstId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const isAllUnits = currentUnitId === 'all';
            const [sortField, sortDir] = sortParam().split('-');
            const res = await listStudents({
                page: page(),
                page_size: pageSize(),
                unit_id: (!isAllUnits && currentUnitId) ? currentUnitId : undefined,
                institution_id: (isAllUnits && currentInstId) ? currentInstId : ((searchParams.institution_id as string) || undefined),
                name: searchName().trim() || undefined,
                code: searchCode().trim() || undefined,
                academic_year_id: selectedAcademicYearId() || undefined,
                status_id: selectedStatusId() || undefined,
                sort_by: sortField || 'code',
                sort_dir: sortDir || 'asc',
            });

            setStudents(res.data || []);
            setTotalPages(res.total_pages || 1);
            setTotalItems(res.total ?? (res.data ? res.data.length : 0));
        } catch (err) {
            console.error('Error fetching students:', err);
            toast.danger('Failed to load students for this department.');
            setStudents([]);
            setTotalPages(1);
            setTotalItems(0);
        } finally {
            setIsLoading(false);
        }
    };

    // Initial mount
    onMount(async () => {
        await loadReferences();
        await fetchStudents();
    });

    // Reactive effect: fetch students whenever unit_id, filters, page or pageSize change
    createEffect(() => {
        const uId = selectedUnitId();
        const p = page();
        const ps = pageSize();
        const yId = selectedAcademicYearId();
        const stId = selectedStatusId();
        const sp = sortParam();

        if (uId && !isResolvingUnit()) {
            fetchStudents();
        }
    });

    // Handle column sort toggle
    const handleSortToggle = (col: string) => {
        const [currentCol, currentDir] = sortParam().split('-');
        if (currentCol === col) {
            setSortParam(`${col}-${currentDir === 'asc' ? 'desc' : 'asc'}`);
        } else {
            setSortParam(`${col}-asc`);
        }
        setPage(1);
        fetchStudents();
    };

    // Handle unit selection change
    const handleUnitChange = async (unitId: string) => {
        setSelectedUnitId(unitId);
        setSearchParams({ unit_id: unitId });
        const matchingUnit = units().find(u => u.id === unitId);
        setActiveUnitData(matchingUnit || null);
        setSelectedAcademicYearId('');
        setPage(1);
        await loadUnitAcademicYears(unitId);
    };

    // Handle debounced search input
    const handleNameInput = (val: string) => {
        setSearchName(val);
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            setPage(1);
            fetchStudents();
        }, 350);
    };

    const handleCodeInput = (val: string) => {
        setSearchCode(val);
        clearTimeout(searchDebounceTimer);
        searchDebounceTimer = setTimeout(() => {
            setPage(1);
            fetchStudents();
        }, 350);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSearchName('');
        setSearchCode('');
        setSelectedAcademicYearId('');
        setSelectedStatusId('');
        setSortParam('code-asc');
        setPage(1);
        fetchStudents();
    };

    // Filter active check
    const hasActiveFilters = createMemo(() => {
        return Boolean(
            searchName().trim() ||
            searchCode().trim() ||
            selectedAcademicYearId() ||
            selectedStatusId() ||
            sortParam() !== 'code-asc'
        );
    });

    // Helper for status badge styling
    const getStatusBadgeClass = (statusName?: string) => {
        const s = (statusName || '').toLowerCase();
        if (s.includes('aktif') || s.includes('active')) {
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60';
        }
        if (s.includes('cuti') || s.includes('leave')) {
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60';
        }
        if (s.includes('lulus') || s.includes('graduat')) {
            return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60';
        }
        if (s.includes('keluar') || s.includes('drop') || s.includes('resign')) {
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60';
        }
        return 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700';
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Summary Metrics Banner */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200/70 dark:border-neutral-700 shadow-2xs flex items-center justify-between">
                        <div class="space-y-0.5">
                            <span class="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">Total Enrolled</span>
                            <div class="text-2xl font-black text-neutral-900 dark:text-white">
                                {totalItems()}
                            </div>
                        </div>
                        <div class="size-10 rounded-xs bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-200/50 dark:border-teal-800/40">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200/70 dark:border-neutral-700 shadow-2xs flex items-center justify-between">
                        <div class="space-y-0.5">
                            <span class="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">Current Unit</span>
                            <div class="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate max-w-[180px]" title={activeUnitData()?.name}>
                                {activeUnitData()?.name || 'Program Studi'}
                            </div>
                        </div>
                        <div class="size-10 rounded-xs bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center border border-cyan-200/50 dark:border-cyan-800/40">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10M6 10h10M6 14h6" /></svg>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200/70 dark:border-neutral-700 shadow-2xs flex items-center justify-between">
                        <div class="space-y-0.5">
                            <span class="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">Academic Cohorts</span>
                            <div class="text-2xl font-black text-neutral-900 dark:text-white">
                                {unitAcademicYears().length}
                            </div>
                        </div>
                        <div class="size-10 rounded-xs bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-200/50 dark:border-purple-800/40">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200/70 dark:border-neutral-700 shadow-2xs flex items-center justify-between">
                        <div class="space-y-0.5">
                            <span class="text-[11px] font-mono font-medium text-neutral-400 uppercase tracking-wider">Page Position</span>
                            <div class="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                Page <strong class="text-teal-600 dark:text-teal-400 font-mono">{page()}</strong> of <strong class="font-mono">{totalPages()}</strong>
                            </div>
                        </div>
                        <div class="size-10 rounded-xs bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200/50 dark:border-amber-800/40">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" x2="8" y1="13" y2="13" /><line x1="16" x2="8" y1="17" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                        </div>
                    </div>
                </div>

                {/* Search & Comprehensive Filters Panel */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs p-5 sm:p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                    <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-3">
                        <div class="flex items-center gap-2">
                            <svg class="size-4 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" /></svg>
                            <h2 class="text-xs font-mono uppercase tracking-wider font-bold text-neutral-700 dark:text-neutral-200">
                                Search & Dynamic Filters
                            </h2>
                        </div>
                        <Show when={hasActiveFilters()}>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                class="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                                <span>Reset All Filters</span>
                            </button>
                        </Show>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search by Name */}
                        <div class="space-y-1">
                            <label class="text-[11px] font-mono font-semibold text-neutral-500 uppercase">
                                Student Name
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    placeholder="Search by name..."
                                    value={searchName()}
                                    onInput={(e) => handleNameInput(e.currentTarget.value)}
                                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-teal-500 transition-colors"
                                />
                                <svg class="size-4 absolute left-3 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                            </div>
                        </div>

                        {/* Search by Code / NIM */}
                        <div class="space-y-1">
                            <label class="text-[11px] font-mono font-semibold text-neutral-500 uppercase">
                                Student Code (NIM)
                            </label>
                            <div class="relative">
                                <input
                                    type="text"
                                    placeholder="Search by NIM / code..."
                                    value={searchCode()}
                                    onInput={(e) => handleCodeInput(e.currentTarget.value)}
                                    class="w-full pl-9 pr-3 py-2 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-hidden focus:border-teal-500 transition-colors"
                                />
                                <svg class="size-4 absolute left-3 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" /><path d="M7 7h10M7 12h10M7 17h6" /></svg>
                            </div>
                        </div>

                        {/* Filter by Academic Year */}
                        <div class="space-y-1">
                            <label class="text-[11px] font-mono font-semibold text-neutral-500 uppercase">
                                Academic Year / Cohort
                            </label>
                            <select
                                value={selectedAcademicYearId()}
                                onChange={(e) => {
                                    setSelectedAcademicYearId(e.currentTarget.value);
                                    setPage(1);
                                    fetchStudents();
                                }}
                                class="w-full px-3 py-2 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-teal-500 transition-colors"
                            >
                                <option value="">All Academic Years ({unitAcademicYears().length})</option>
                                <For each={unitAcademicYears()}>
                                    {(yr) => (
                                        <option value={yr.id}>
                                            {yr.name} {yr.code ? `(${yr.code})` : ''}
                                        </option>
                                    )}
                                </For>
                            </select>
                        </div>

                        {/* Filter by Status */}
                        <div class="space-y-1">
                            <label class="text-[11px] font-mono font-semibold text-neutral-500 uppercase">
                                Student Status
                            </label>
                            <select
                                value={selectedStatusId()}
                                onChange={(e) => {
                                    setSelectedStatusId(e.currentTarget.value);
                                    setPage(1);
                                    fetchStudents();
                                }}
                                class="w-full px-3 py-2 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-teal-500 transition-colors"
                            >
                                <option value="">All Student Statuses</option>
                                <For each={statuses()}>
                                    {(st) => (
                                        <option value={st.id}>
                                            {st.name} {st.code ? `(${st.code})` : ''}
                                        </option>
                                    )}
                                </For>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Student Directory Table Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">

                    {/* Table Header Bar */}
                    <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div class="flex items-center gap-2">
                            <div class="size-2 rounded-xs bg-teal-500"></div>
                            <span class="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200">
                                Students Directory Table
                            </span>
                            <span class="px-2 py-0.5 rounded-xs bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-[10px] font-mono">
                                {totalItems()} total records
                            </span>
                        </div>

                        {/* Sort Selector & Page Size Selector */}
                        <div class="flex flex-wrap items-center gap-3">
                            <div class="flex items-center gap-1.5">
                                <span class="text-xs text-neutral-400 font-mono">Sort:</span>
                                <select
                                    value={sortParam()}
                                    onChange={(e) => {
                                        setSortParam(e.currentTarget.value);
                                        setPage(1);
                                        fetchStudents();
                                    }}
                                    class="px-2.5 py-1 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-teal-500"
                                >
                                    <option value="code-asc">NIM / Code (Ascending)</option>
                                    <option value="code-desc">NIM / Code (Descending)</option>
                                    <option value="name-asc">Full Name (A-Z)</option>
                                    <option value="name-desc">Full Name (Z-A)</option>
                                    <option value="registered-desc">Registered (Newest)</option>
                                    <option value="registered-asc">Registered (Oldest)</option>
                                </select>
                            </div>

                            <div class="flex items-center gap-1.5">
                                <span class="text-xs text-neutral-400 font-mono">Rows per page:</span>
                                <select
                                    value={pageSize()}
                                    onChange={(e) => {
                                        setPageSize(Number(e.currentTarget.value));
                                        setPage(1);
                                        fetchStudents();
                                    }}
                                    class="px-2.5 py-1 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:border-teal-500"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table or Loading State */}
                    <Show
                        when={!isLoading() && !isResolvingUnit()}
                        fallback={
                            <div class="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                                <div class="size-8 border-3 border-teal-500 border-t-transparent rounded-xs animate-spin"></div>
                                <p class="text-xs font-mono tracking-wider uppercase">Loading department students from server...</p>
                            </div>
                        }
                    >
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-50/80 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3.5 px-4 text-start">
                                            <button
                                                type="button"
                                                onClick={() => handleSortToggle('code')}
                                                class="group inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                                                title="Sort by NIM / Code"
                                            >
                                                <span>NIM / Code</span>
                                                <Show
                                                    when={sortParam().startsWith('code-')}
                                                    fallback={
                                                        <svg class="size-3 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                                                    }
                                                >
                                                    <Show
                                                        when={sortParam() === 'code-asc'}
                                                        fallback={
                                                            <svg class="size-3 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        }
                                                    >
                                                        <svg class="size-3 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                    </Show>
                                                </Show>
                                            </button>
                                        </th>
                                        <th class="py-3.5 px-4 text-start">
                                            <button
                                                type="button"
                                                onClick={() => handleSortToggle('name')}
                                                class="group inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                                                title="Sort by Full Name"
                                            >
                                                <span>Full Name</span>
                                                <Show
                                                    when={sortParam().startsWith('name-')}
                                                    fallback={
                                                        <svg class="size-3 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                                                    }
                                                >
                                                    <Show
                                                        when={sortParam() === 'name-asc'}
                                                        fallback={
                                                            <svg class="size-3 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        }
                                                    >
                                                        <svg class="size-3 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                    </Show>
                                                </Show>
                                            </button>
                                        </th>
                                        <th class="py-3.5 px-4 text-start">Study Program</th>
                                        <th class="py-3.5 px-4 text-start">Academic Year</th>
                                        <th class="py-3.5 px-4 text-start">Admission Path</th>
                                        <th class="py-3.5 px-4 text-center">Status</th>
                                        <th class="py-3.5 px-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => handleSortToggle('registered')}
                                                class="group inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 hover:text-teal-600 dark:hover:text-teal-400 transition-colors cursor-pointer"
                                                title="Sort by Registered Date"
                                            >
                                                <span>Registered</span>
                                                <Show
                                                    when={sortParam().startsWith('registered-')}
                                                    fallback={
                                                        <svg class="size-3 text-neutral-300 dark:text-neutral-600 group-hover:text-neutral-400 transition-colors" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                                                    }
                                                >
                                                    <Show
                                                        when={sortParam() === 'registered-asc'}
                                                        fallback={
                                                            <svg class="size-3 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                                                        }
                                                    >
                                                        <svg class="size-3 text-teal-600 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                                                    </Show>
                                                </Show>
                                            </button>
                                        </th>
                                        <th class="py-3.5 px-4 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For
                                        each={students()}
                                        fallback={
                                            <tr>
                                                <td colspan="8" class="py-16 text-center">
                                                    <div class="flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-500 max-w-md mx-auto">
                                                        <div class="size-12 rounded-xs bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-1 text-neutral-400">
                                                            <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                            </svg>
                                                        </div>
                                                        <p class="text-sm font-bold text-neutral-700 dark:text-neutral-200">
                                                            No student records found
                                                        </p>
                                                        <p class="text-xs text-neutral-400">
                                                            {hasActiveFilters()
                                                                ? 'No students match the current search filters. Try clearing some filters or searching for different terms.'
                                                                : `There are currently no admitted student records in ${activeUnitData()?.name || 'this department'}.`}
                                                        </p>
                                                        <Show when={hasActiveFilters()}>
                                                            <button
                                                                type="button"
                                                                onClick={handleResetFilters}
                                                                class="mt-2 px-3 py-1.5 bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 rounded-xs text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
                                                            >
                                                                Clear Filters
                                                            </button>
                                                        </Show>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        {(std) => (
                                            <tr class="hover:bg-neutral-50/70 dark:hover:bg-neutral-900/40 transition-colors group">
                                                {/* NIM / Code */}
                                                <td class="py-3 px-4 font-mono font-bold text-teal-600 dark:text-teal-400">
                                                    <span class="px-2 py-0.5 rounded-xs bg-teal-50 dark:bg-teal-950/50 border border-teal-200/60 dark:border-teal-900/60">
                                                        {std.code}
                                                    </span>
                                                </td>

                                                {/* Full Name */}
                                                <td class="py-3 px-4">
                                                    <div class="flex items-center gap-2.5">
                                                        <div class="size-7 rounded-xs bg-gradient-to-br from-teal-500 to-cyan-600 text-white font-bold text-[10px] flex items-center justify-center shrink-0 shadow-2xs">
                                                            {(std.name || 'S').slice(0, 1).toUpperCase()}
                                                        </div>
                                                        <span class="font-bold text-neutral-900 dark:text-white">
                                                            {std.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Study Program / Unit */}
                                                <td class="py-3 px-4 text-neutral-600 dark:text-neutral-300">
                                                    <span class="font-medium">
                                                        {std.unit_name || activeUnitData()?.name || '-'}
                                                    </span>
                                                </td>

                                                {/* Academic Year */}
                                                <td class="py-3 px-4">
                                                    <span class="inline-flex items-center px-2 py-0.5 rounded-xs text-[10px] font-mono font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                                        {std.academic_year_name || '-'}
                                                    </span>
                                                </td>

                                                {/* Admission Path */}
                                                <td class="py-3 px-4 text-neutral-600 dark:text-neutral-400">
                                                    <span class="inline-block px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                        {std.selection_type_name || '-'}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td class="py-3 px-4 text-center">
                                                    <span class={`inline-block px-2.5 py-0.5 rounded-xs text-[10px] font-bold ${getStatusBadgeClass(std.status_name)}`}>
                                                        {std.status_name || 'Active'}
                                                    </span>
                                                </td>

                                                {/* Registered Date */}
                                                <td class="py-3 px-4 text-center font-mono text-neutral-500 dark:text-neutral-400">
                                                    {std.registered || '-'}
                                                </td>

                                                {/* Actions */}
                                                <td class="py-3 px-4 text-end">
                                                    <A
                                                        href={`/course-department/academic/student/master/show?id=${std.id}`}
                                                        class="px-3 py-1.5 bg-neutral-100 hover:bg-teal-50 dark:bg-neutral-700 dark:hover:bg-teal-950/60 text-neutral-700 hover:text-teal-700 dark:text-neutral-200 dark:hover:text-teal-300 rounded-xs text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                                                    >
                                                        <span>Detail</span>
                                                        <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                                    </A>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Footer Bar */}
                        <div class="p-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/30">
                            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                Showing page <strong class="text-neutral-800 dark:text-neutral-200">{page()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalPages()}</strong> ({totalItems()} total students)
                            </span>

                            <div class="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (page() > 1) {
                                            setPage(page() - 1);
                                            fetchStudents();
                                        }
                                    }}
                                    disabled={page() <= 1}
                                    class="px-3 py-1.5 text-xs font-semibold rounded-xs border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    <span>Previous</span>
                                </button>

                                <div class="px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xs shadow-2xs">
                                    {page()} / {totalPages()}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        if (page() < totalPages()) {
                                            setPage(page() + 1);
                                            fetchStudents();
                                        }
                                    }}
                                    disabled={page() >= totalPages()}
                                    class="px-3 py-1.5 text-xs font-semibold rounded-xs border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                >
                                    <span>Next</span>
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6" /></svg>
                                </button>
                            </div>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
