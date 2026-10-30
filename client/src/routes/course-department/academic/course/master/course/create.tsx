import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiIndex, masterApiCreate } from '~/controllers/master/masterApiController';
import { getLoggedInStaffUnit, LoggedInStaffUnitResult } from '~/lib/staffHelper';
import { t } from '../../../../../../i18n';
import { Spinner } from '~/components/loader';

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
            toast.danger(t('cd.failedToLoadDepartmentOrClassification'));
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
            setErrorMessage(t('cd.courseCodeIsRequired'));
            toast.danger(t('cd.courseCodeIsRequired'));
            return;
        }

        if (!nameVal) {
            setErrorMessage(t('cd.courseNameIsRequired'));
            toast.danger(t('cd.courseNameIsRequired'));
            return;
        }

        if (!uId) {
            setErrorMessage(t('cd.pleaseSelectADepartmentProgramStudi'));
            toast.danger(t('cd.pleaseSelectADepartmentProgramStudi'));
            return;
        }

        if (!vId) {
            setErrorMessage(t('cd.pleaseSelectACourseVarietyJenis'));
            toast.danger(t('cd.pleaseSelectACourseVariety'));
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
                toast.success(res.message || t('cd.courseCreatedSuccessfully'));
                setTimeout(() => {
                    window.location.href = `${basePath}?unit_id=${uId}`;
                }, 500);
            } else {
                setErrorMessage(res.message || t('cd.failedToCreateCourseRecord'));
                toast.danger(res.message || t('cd.failedToCreateCourseRecord'));
            }
        } catch (err: any) {
            setErrorMessage(err.message || t('cd.networkErrorOccurredWhileSaving'));
            toast.danger(err.message || t('cd.networkErrorOccurred'));
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

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header & Breadcrumb */}
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">{t('cd.home')}</a>
                            <span>/</span>
                            <span>{t('cd.academic')}</span>
                            <span>/</span>
                            <span>{t('cd.course')}</span>
                            <span>/</span>
                            <span>{t('cd.master')}</span>
                            <span>/</span>
                            <a href={backUrl()} class="hover:text-blue-600 transition-colors">{t('cd.course')}</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{t('cd.create')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            {t('cd.addNewCourse')}
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {t('cd.registerANewCourseSyllabusCredit')}
                        </p>
                    </div>

                    <div class="mt-4 sm:mt-0">
                        <a
                            href={backUrl()}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>{t('cd.cancel')}</span>
                        </a>
                    </div>
                </div>

                {/* Error Banner */}
                <Show when={errorMessage()}>
                    <div class="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5">
                        <svg class="size-4 shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
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
                                    {t('cd.courseIdentification')}
                                </h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {t('cd.basicCourseIdentityAndOfferingAcademic')}
                                </p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.managingDepartmentProgramStudi')} <span class="text-red-500">*</span>
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
                                                <option value="">{t('cd.selectDepartmentUnit')}</option>
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
                                                            fallback={<span>{t('cd.assignedDepartment')} {unitId()}</span>}
                                                        >
                                                            <span>{t('cd.retrievedFromLoggedInStaffProfile')} <strong class="text-neutral-700 dark:text-neutral-300">{staffResult()?.staffName || staffResult()?.staff?.name || 'Staff Program Studi'}</strong></span>
                                                        </Show>
                                                    </div>
                                                </div>
                                            </div>

                                            <div class="flex items-center gap-2">
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                                        <circle cx="12" cy="7" r="4" />
                                                    </svg>
                                                    <span>{t('cd.staffDepartment')}</span>
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
                                                                    {t('cd.adminSwitch')} {u.code ? `[${u.code}] ` : ''}{u.name}
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
                                        {t('cd.courseCode')} <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={code()}
                                        onInput={(e) => setCode(e.currentTarget.value)}
                                        placeholder={t('cd.eGIF101TIS204')}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                    <span class="text-[11px] text-neutral-500">{t('cd.uniqueCourseIdentifierWithinTheCurriculum')}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.courseNameTitle')} <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        placeholder={t('cd.eGAlgoritmaDanPemrograman')}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-medium focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.implementationMethod')}
                                    </label>
                                    <select
                                        value={implementationMethod()}
                                        onChange={(e) => setImplementationMethod(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="Kuliah">{t('cd.kuliahLecture')}</option>
                                        <option value="Responsi">{t('cd.responsi')}</option>
                                        <option value="Tutorial">{t('cd.tutorial')}</option>
                                        <option value="Seminar">{t('cd.seminar')}</option>
                                        <option value="Praktikum">{t('cd.praktikumLaboratory')}</option>
                                        <option value="Praktik Lapangan">{t('cd.praktikLapanganFieldPractice')}</option>
                                        <option value="Simulasi">{t('cd.simulasi')}</option>
                                        <option value="Campuran">{t('cd.campuranBlended')}</option>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.courseVarietyJenisMK')} <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={varietyId()}
                                        onChange={(e) => setVarietyId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">{t('cd.selectVariety')}</option>
                                        <For each={varieties()}>
                                            {(v) => (
                                                <option value={v.id}>
                                                    {v.code ? `[${v.code}] ` : ''}{v.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <span class="text-[11px] text-neutral-500">{t('cd.eGWajibProgramStudiPilihan')}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.courseGroupKelompokMK')}
                                    </label>
                                    <select
                                        value={groupId()}
                                        onChange={(e) => setGroupId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">{t('cd.noneOptional')}</option>
                                        <For each={groups()}>
                                            {(g) => (
                                                <option value={g.id}>
                                                    {g.code ? `[${g.code}] ` : ''}{g.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <span class="text-[11px] text-neutral-500">{t('cd.eGMPKMKKMKBMPB')}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.courseCompetenceKompetensi')}
                                    </label>
                                    <select
                                        value={competenceId()}
                                        onChange={(e) => setCompetenceId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">{t('cd.noneOptional')}</option>
                                        <For each={competences()}>
                                            {(c) => (
                                                <option value={c.id}>
                                                    {c.code ? `[${c.code}] ` : ''}{c.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                    <span class="text-[11px] text-neutral-500">{t('cd.eGUtamaPendukungKhusus')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Credits (SKS) Breakdown */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-5">
                            <div class="border-b border-neutral-200 dark:border-neutral-700 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white font-mono flex items-center gap-2">
                                        <span class="size-2 bg-emerald-600 inline-block"></span>
                                        {t('cd.creditsAllocationBebanSKS')}
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                        {t('cd.breakdownOfTheoreticalLaboratoryFieldWork')}
                                    </p>
                                </div>

                                <div class="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-mono text-xs font-semibold">
                                    {t('cd.total')} {totalCredit()} SKS
                                </div>
                            </div>

                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.sksTeoriKuliah')} <span class="text-red-500">*</span>
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
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">{t('cd.lecture')}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.sksPraktikum')} <span class="text-red-500">*</span>
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
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">{t('cd.labPractice')}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.sksLapangan')} <span class="text-red-500">*</span>
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
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">{t('cd.fieldWork')}</span>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 font-mono mb-1.5">
                                        {t('cd.sksSimulasi')} <span class="text-red-500">*</span>
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
                                    <span class="text-[11px] text-neutral-400 block text-center mt-1">{t('cd.simulation')}</span>
                                </div>
                            </div>

                            <div class="pt-2 flex items-center justify-between border-t border-neutral-100 dark:border-neutral-700/60 text-xs">
                                <div class="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="manualTotalCheck"
                                        checked={isManualTotalCredit()}
                                        onChange={(e) => setIsManualTotalCredit(e.currentTarget.checked)}
                                        class="rounded-xs border-neutral-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label for="manualTotalCheck" class="text-neutral-600 dark:text-neutral-400 cursor-pointer">
                                        {t('cd.manuallyOverrideTotalSKSDefaultSum')}
                                    </label>
                                </div>

                                <Show when={isManualTotalCredit()}>
                                    <div class="flex items-center gap-2">
                                        <span class="font-mono font-medium">{t('cd.customTotal')}</span>
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
                                    {t('cd.attributesValidityRange')}
                                </h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                    {t('cd.teachingIndicatorsMaterialAvailabilityAndActive')}
                                </p>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div class="space-y-3">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        {t('cd.pedagogicalFeatures')}
                                    </label>

                                    <div class="space-y-2 text-xs">
                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasSyllabus()}
                                                onChange={(e) => setHasSyllabus(e.currentTarget.checked)}
                                                class="rounded-xs border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{t('cd.syllabusAvailableMemilikiRPSSilabus')}</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasMaterial()}
                                                onChange={(e) => setHasMaterial(e.currentTarget.checked)}
                                                class="rounded-xs border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{t('cd.learningMaterialSAPMemilikiBahanAjar')}</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasPractice()}
                                                onChange={(e) => setHasPractice(e.currentTarget.checked)}
                                                class="rounded-xs border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{t('cd.hasPracticalSessionsAdaPraktikum')}</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasDictation()}
                                                onChange={(e) => setHasDictation(e.currentTarget.checked)}
                                                class="rounded-xs border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{t('cd.hasDictationModuleMemilikiDiktatKuliah')}</span>
                                        </label>

                                        <label class="flex items-center gap-2.5 text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={hasUnit()}
                                                onChange={(e) => setHasUnit(e.currentTarget.checked)}
                                                class="rounded-xs border-neutral-300 text-blue-600 focus:ring-blue-500"
                                            />
                                            <span>{t('cd.unitSpecificCourseMemilikiUnitPengampu')}</span>
                                        </label>
                                    </div>
                                </div>

                                <div class="space-y-4">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        {t('cd.validityDatesOptional')}
                                    </label>

                                    <div>
                                        <label class="block text-xs text-neutral-600 dark:text-neutral-400 mb-1">
                                            {t('cd.startDateTanggalBerlaku')}
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
                                            {t('cd.endDateTanggalBerakhir')}
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
                                {t('cd.cancel')}
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <Show when={isSubmitting()}>
                                    <Spinner size="xs" color="white" class="-ml-1 mr-1" aria-hidden={true} />
                                </Show>
                                <span>{isSubmitting() ? t('cd.savingCourse') : t('cd.saveCourse')}</span>
                            </button>
                        </div>
                    </form>
                </Show>
            </div>
        </div>
    );
}
