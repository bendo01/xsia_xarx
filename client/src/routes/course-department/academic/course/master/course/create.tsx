import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiIndex, masterApiCreate, masterApiShow } from '~/controllers/master/masterApiController';
import {
    currentUserSignal,
    userRolesSignal,
    activeRoleSignal,
    refreshAuthState,
    isStaffProgramStudi
} from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import { getLoggedInStaffUnit, LoggedInStaffUnitResult } from '~/lib/staffHelper';

export default function CourseMasterCreatePage() {
    const apiPath = "academic/course/master/courses";
    const basePath = "/course-department/academic/course/master/course";
    const [searchParams] = useSearchParams();

    // Form fields
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [unitId, setUnitId] = createSignal('');
    const [varietyId, setVarietyId] = createSignal('');
    const [groupId, setGroupId] = createSignal('');
    const [competenceId, setCompetenceId] = createSignal('');
    const [implementationMethod, setImplementationMethod] = createSignal('Kuliah');

    // SKS Credits
    const [lectureCredit, setLectureCredit] = createSignal<number>(2);
    const [practiceCredit, setPracticeCredit] = createSignal<number>(0);
    const [fieldPracticeCredit, setFieldPracticeCredit] = createSignal<number>(0);
    const [simulationCredit, setSimulationCredit] = createSignal<number>(0);
    const [totalCredit, setTotalCredit] = createSignal<number>(2);
    const [isManualTotalCredit, setIsManualTotalCredit] = createSignal(false);

    // Indicators / Flags
    const [hasUnit, setHasUnit] = createSignal(true);
    const [hasSyllabus, setHasSyllabus] = createSignal(true);
    const [hasMaterial, setHasMaterial] = createSignal(true);
    const [hasPractice, setHasPractice] = createSignal(false);
    const [hasDictation, setHasDictation] = createSignal(false);

    // Validity dates
    const [startDate, setStartDate] = createSignal('');
    const [endDate, setEndDate] = createSignal('');

    // Reference datasets & staff info
    const [units, setUnits] = createSignal<any[]>([]);
    const [varieties, setVarieties] = createSignal<any[]>([]);
    const [groups, setGroups] = createSignal<any[]>([]);
    const [competences, setCompetences] = createSignal<any[]>([]);
    const [staffResult, setStaffResult] = createSignal<LoggedInStaffUnitResult | null>(null);

    // State
    const [isLoadingReferences, setIsLoadingReferences] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal('');

    // Auto-calculate Total Credit whenever components change, unless manually modified
    createEffect(() => {
        const sum = (Number(lectureCredit()) || 0) +
                    (Number(practiceCredit()) || 0) +
                    (Number(fieldPracticeCredit()) || 0) +
                    (Number(simulationCredit()) || 0);

        if (!isManualTotalCredit()) {
            setTotalCredit(sum);
        }

        // Auto check practice flag if practice credit > 0
        if ((Number(practiceCredit()) || 0) > 0) {
            setHasPractice(true);
        }
    });

    const loadReferences = async () => {
        setIsLoadingReferences(true);
        try {
            // Priority 1: Resolve unit_id directly from the logged-in staff
            const queryUnit = (searchParams.unit_id as string) || '';
            const staffUnitResult = await getLoggedInStaffUnit(queryUnit);
            setStaffResult(staffUnitResult);

            if (staffUnitResult.unitId) {
                setUnitId(staffUnitResult.unitId);
            }

            const [unitsRes, varietiesRes, groupsRes, competencesRes] = await Promise.all([
                masterApiIndex('institution/master/units', { page: 1, per_page: 200 }),
                masterApiIndex('academic/course/reference/varieties', { page: 1, per_page: 100 }),
                masterApiIndex('academic/course/reference/groups', { page: 1, per_page: 100 }),
                masterApiIndex('academic/course/reference/competences', { page: 1, per_page: 100 }),
            ]);

            const unitsList = unitsRes.data || [];
            setUnits(unitsList);

            // Fallback if no staff unit resolved and no unitId set
            if (!unitId() && unitsList.length > 0) {
                setUnitId(unitsList[0].id);
            }

            const varietiesList = varietiesRes.data || [];
            setVarieties(varietiesList);
            if (varietiesList.length > 0) {
                setVarietyId(varietiesList[0].id);
            }

            const groupsList = groupsRes.data || [];
            setGroups(groupsList);

            const competencesList = competencesRes.data || [];
            setCompetences(competencesList);
        } catch (err) {
            console.error('Failed to load references for Course creation:', err);
            toast.danger('Failed to load department or classification references.');
        } finally {
            setIsLoadingReferences(false);
        }
    };

    onMount(() => {
        loadReferences();
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setErrorMessage('');

        const codeVal = code().trim();
        const nameVal = name().trim();
        const uId = unitId().trim();
        const vId = varietyId().trim();

        if (!codeVal) {
            setErrorMessage('Course Code is required.');
            toast.danger('Course Code is required.');
            return;
        }

        if (!nameVal) {
            setErrorMessage('Course Name is required.');
            toast.danger('Course Name is required.');
            return;
        }

        if (!uId) {
            setErrorMessage('Please select a Department / Program Studi.');
            toast.danger('Please select a Department / Program Studi.');
            return;
        }

        if (!vId) {
            setErrorMessage('Please select a Course Variety (Jenis Mata Kuliah).');
            toast.danger('Please select a Course Variety.');
            return;
        }

        const payload = {
            code: codeVal,
            name: nameVal,
            unit_id: uId,
            variety_id: vId,
            group_id: groupId() ? groupId() : null,
            competence_id: competenceId() ? competenceId() : null,
            implementation_method: implementationMethod() || null,
            total_credit: Number(totalCredit()) || 0,
            lecture_credit: Number(lectureCredit()) || 0,
            practice_credit: Number(practiceCredit()) || 0,
            field_practice_credit: Number(fieldPracticeCredit()) || 0,
            simulation_credit: Number(simulationCredit()) || 0,
            has_unit: Boolean(hasUnit()),
            has_syllabus: Boolean(hasSyllabus()),
            has_material: Boolean(hasMaterial()),
            has_practice: Boolean(hasPractice()),
            has_dictation: Boolean(hasDictation()),
            start_date: startDate() || null,
            end_date: endDate() || null,
        };

        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, payload);

            if (res.success) {
                toast.success(res.message || 'Course created successfully!');
                setTimeout(() => {
                    window.location.href = `${basePath}?unit_id=${uId}`;
                }, 500);
            } else {
                setErrorMessage(res.message || 'Failed to create course record.');
                toast.danger(res.message || 'Failed to create course record.');
            }
        } catch (err: any) {
            setErrorMessage(err.message || 'Network error occurred while saving.');
            toast.danger(err.message || 'Network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const backUrl = () => {
        return unitId() ? `${basePath}?unit_id=${unitId()}` : basePath;
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-5xl">
                {/* Header & Breadcrumb */}
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span>Course</span>
                            <span>/</span>
                            <span>Master</span>
                            <span>/</span>
                            <a href={backUrl()} class="hover:text-blue-600 transition-colors">Course</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Create</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Add New Course
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            Register a new course syllabus, credit allocation, and classifications for your department.
                        </p>
                    </div>

                    <div class="mt-4 sm:mt-0">
                        <a
                            href={backUrl()}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-none shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span>Cancel</span>
                        </a>
                    </div>
                </div>

                {/* Error Banner */}
                <Show when={errorMessage()}>
                    <div class="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
                        <svg class="size-4 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                        <span>{errorMessage()}</span>
                    </div>
                </Show>

                <Show
                    when={!isLoadingReferences()}
                    fallback={
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8 space-y-4 animate-pulse">
                            <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                            <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                            <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                            <div class="h-28 bg-neutral-200 dark:bg-neutral-700"></div>
                        </div>
                    }
                >
                    <form onSubmit={handleSubmit} class="space-y-6">
                        {/* Section 1: Department & Core Information */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-5">
                            <div class="border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono flex items-center gap-2">
                                    <span class="size-2 bg-blue-600 inline-block"></span>
                                    Course Identification
                                </h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Basic course identity and offering academic department.
                                </p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Managing Department / Program Studi <span class="text-red-500">*</span>
                                    </label>

                                    <Show
                                        when={staffResult()?.unitId}
                                        fallback={
                                            <select
                                                required
                                                value={unitId()}
                                                onChange={(e) => setUnitId(e.currentTarget.value)}
                                                class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                            >
                                                <option value="">-- Select Department / Unit --</option>
                                                <For each={units()}>
                                                    {(u) => (
                                                        <option value={u.id} selected={u.id === unitId()}>
                                                            {u.code ? `[${u.code}] ` : ''}{u.name}
                                                        </option>
                                                    )}
                                                </For>
                                            </select>
                                        }
                                    >
                                        <div class="p-4 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div class="flex items-center gap-3">
                                                <div class="size-9 bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0">
                                                    {staffResult()?.unit?.code || (units().find(u => u.id === unitId())?.code) || 'PS'}
                                                </div>
                                                <div>
                                                    <div class="font-bold text-neutral-900 dark:text-white text-sm font-mono">
                                                        {staffResult()?.unit?.name || staffResult()?.unit?.nama || (units().find(u => u.id === unitId())?.name) || unitId()}
                                                    </div>
                                                    <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                        <Show
                                                            when={staffResult()?.isFromStaff}
                                                            fallback={<span>Assigned Department: {unitId()}</span>}
                                                        >
                                                            <span>Retrieved from logged-in staff profile: <strong class="text-neutral-700 dark:text-neutral-300">{staffResult()?.staffName || staffResult()?.staff?.name || 'Staff Program Studi'}</strong></span>
                                                        </Show>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-2">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                                                        <circle cx="12" cy="7" r="4"/>
                                                    </svg>
                                                    <span>Staff Department</span>
                                                </span>

                                                <Show when={staffResult()?.isAdmin && units().length > 1}>
                                                    <select
                                                        value={unitId()}
                                                        onChange={(e) => {
                                                            const newId = e.currentTarget.value;
                                                            setUnitId(newId);
                                                            const found = units().find(u => u.id === newId);
                                                            if (found) {
                                                                setStaffResult(prev => prev ? { ...prev, unitId: newId, unit: found } : null);
                                                            }
                                                        }}
                                                        class="p-1.5 text-xs border border-blue-300 dark:border-blue-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                                    >
                                                        <For each={units()}>
                                                            {(u) => (
                                                                <option value={u.id} selected={u.id === unitId()}>
                                                                    Admin Switch: {u.code ? `[${u.code}] ` : ''}{u.name}
                                                                </option>
                                                            )}
                                                        </For>
                                                    </select>
                                                </Show>
                                            </div>
                                        </div>
                                    </Show>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Course Code <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={code()}
                                        onInput={(e) => setCode(e.currentTarget.value)}
                                        placeholder="e.g. IF101, TIS-204"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                    <span class="text-[11px] text-neutral-500">Unique course identifier within the curriculum.</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Course Name / Title <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        placeholder="e.g. Algoritma dan Pemrograman"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Implementation Method
                                    </label>
                                    <select
                                        value={implementationMethod()}
                                        onChange={(e) => setImplementationMethod(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="Kuliah">Kuliah (Lecture)</option>
                                        <option value="Responsi">Responsi</option>
                                        <option value="Tutorial">Tutorial</option>
                                        <option value="Seminar">Seminar</option>
                                        <option value="Praktikum">Praktikum (Laboratory)</option>
                                        <option value="Praktik Lapangan">Praktik Lapangan (Field Practice)</option>
                                        <option value="Simulasi">Simulasi</option>
                                        <option value="Campuran">Campuran (Blended)</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Course Variety (Jenis MK) <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={varietyId()}
                                        onChange={(e) => setVarietyId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">-- Select Variety --</option>
                                        <For each={varieties()}>
                                            {(v) => (
                                                <option value={v.id}>
                                                    {v.code ? `[${v.code}] ` : ''}{v.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <span class="text-[11px] text-neutral-500">e.g. Wajib Program Studi, Pilihan, Wajib Nasional.</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Course Group (Kelompok MK)
                                    </label>
                                    <select
                                        value={groupId()}
                                        onChange={(e) => setGroupId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">-- None / Optional --</option>
                                        <For each={groups()}>
                                            {(g) => (
                                                <option value={g.id}>
                                                    {g.code ? `[${g.code}] ` : ''}{g.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <span class="text-[11px] text-neutral-500">e.g. MPK, MKK, MKB, MPB, MBB.</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        Course Competence (Kompetensi)
                                    </label>
                                    <select
                                        value={competenceId()}
                                        onChange={(e) => setCompetenceId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">-- None / Optional --</option>
                                        <For each={competences()}>
                                            {(c) => (
                                                <option value={c.id}>
                                                    {c.code ? `[${c.code}] ` : ''}{c.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <span class="text-[11px] text-neutral-500">e.g. Utama, Pendukung, Khusus.</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Credits (SKS) Breakdown */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-5">
                            <div class="border-b border-neutral-200 dark:border-neutral-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono flex items-center gap-2">
                                        <span class="size-2 bg-emerald-600 inline-block"></span>
                                        Credits Allocation (Beban SKS)
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        Breakdown of theoretical, laboratory, field work, and simulation credits.
                                    </p>
                                </div>

                                <div class="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-semibold">
                                    Total: {totalCredit()} SKS
                                </div>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        SKS Teori / Kuliah <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        required
                                        value={lectureCredit()}
                                        onInput={(e) => {
                                            setLectureCredit(parseFloat(e.currentTarget.value) || 0);
                                        }}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors text-center"
                                    />
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">Lecture</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        SKS Praktikum <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        required
                                        value={practiceCredit()}
                                        onInput={(e) => {
                                            setPracticeCredit(parseFloat(e.currentTarget.value) || 0);
                                        }}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors text-center"
                                    />
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">Lab / Practice</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        SKS Lapangan <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        required
                                        value={fieldPracticeCredit()}
                                        onInput={(e) => {
                                            setFieldPracticeCredit(parseFloat(e.currentTarget.value) || 0);
                                        }}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors text-center"
                                    />
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">Field Work</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        SKS Simulasi <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        required
                                        value={simulationCredit()}
                                        onInput={(e) => {
                                            setSimulationCredit(parseFloat(e.currentTarget.value) || 0);
                                        }}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors text-center"
                                    />
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">Simulation</span>
                                </div>
                            </div>

                            <div class="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-700/60 text-xs">
                                <div class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="manualTotalCheck"
                                        checked={isManualTotalCredit()}
                                        onChange={(e) => setIsManualTotalCredit(e.currentTarget.checked)}
                                        class="rounded-none border-neutral-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label for="manualTotalCheck" class="text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                        Manually override total SKS (default: sum of all parts)
                                    </label>
                                </div>

                                <Show when={isManualTotalCredit()}>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono font-medium">Custom Total:</span>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.5"
                                            value={totalCredit()}
                                            onInput={(e) => setTotalCredit(parseFloat(e.currentTarget.value) || 0)}
                                            class="w-20 p-1 text-xs border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 font-mono text-center"
                                        />
                                    </div>
                                </Show>
                            </div>
                        </div>

                        {/* Section 3: Indicators, Teaching Aids & Validity */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-5">
                            <div class="border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono flex items-center gap-2">
                                    <span class="size-2 bg-indigo-600 inline-block"></span>
                                    Attributes & Validity Range
                                </h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    Teaching indicators, material availability, and active date boundaries.
                                </p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Pedagogical Features
                                    </label>

                                    <div class="space-y-2 text-xs">
                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasSyllabus()}
                                                onChange={(e) => setHasSyllabus(e.currentTarget.checked)}
                                                class="rounded-none border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Syllabus Available (Memiliki RPS / Silabus)</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasMaterial()}
                                                onChange={(e) => setHasMaterial(e.currentTarget.checked)}
                                                class="rounded-none border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Learning Material / SAP (Memiliki Bahan Ajar)</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasPractice()}
                                                onChange={(e) => setHasPractice(e.currentTarget.checked)}
                                                class="rounded-none border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Has Practical Sessions (Ada Praktikum)</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasDictation()}
                                                onChange={(e) => setHasDictation(e.currentTarget.checked)}
                                                class="rounded-none border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Has Dictation / Module (Memiliki Diktat Kuliah)</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasUnit()}
                                                onChange={(e) => setHasUnit(e.currentTarget.checked)}
                                                class="rounded-none border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>Unit Specific Course (Memiliki Unit Pengampu)</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="space-y-4">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Validity Dates (Optional)
                                    </label>

                                    <div>
                                        <label class="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                            Start Date (Tanggal Berlaku)
                                        </label>
                                        <input
                                            type="date"
                                            value={startDate()}
                                            onInput={(e) => setStartDate(e.currentTarget.value)}
                                            class="w-full p-2.5 text-xs border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label class="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                            End Date (Tanggal Berakhir)
                                        </label>
                                        <input
                                            type="date"
                                            value={endDate()}
                                            onInput={(e) => setEndDate(e.currentTarget.value)}
                                            class="w-full p-2.5 text-xs border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Submission footer */}
                        <div class="flex items-center justify-end gap-3 pt-2">
                            <a
                                href={backUrl()}
                                class="px-5 py-2.5 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <Show when={isSubmitting()}>
                                    <svg class="animate-spin -ml-1 mr-1 size-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                </Show>
                                <span>{isSubmitting() ? 'Saving Course...' : 'Save Course'}</span>
                            </button>
                        </div>
                    </form>
                </Show>
            </div>
        </div>
    );
}
