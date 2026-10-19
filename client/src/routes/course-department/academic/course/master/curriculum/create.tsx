import { createSignal, onMount, For } from 'solid-js';
import { getBaseApiUrl, getAuthHeaders, masterApiShow } from '~/controllers/master/masterApiController';
import { isStaffProgramStudi, userRolesSignal, currentRoleIdSignal } from '~/lib/authStore';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiCreate } from '~/controllers/master/masterApiController';
import { t } from '../../../../../../i18n';

export default function MasterCreatePage() {
    const apiPath = "academic/course/master/curriculums";
    const basePath = "/course-department/academic/course/master/curriculum";
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [academicYears, setAcademicYears] = createSignal<any[]>([]);
    const [curriculumTypes, setCurriculumTypes] = createSignal<any[]>([]);
    const [academicYearId, setAcademicYearId] = createSignal('');
    const [curriculumTypeId, setCurriculumTypeId] = createSignal('');
    const [unitId, setUnitId] = createSignal('');

    onMount(async () => {
        try {
            const h = getAuthHeaders();
            const ayRes = await fetch(`${getBaseApiUrl()}/academic/general/reference/academic-years/options`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({ option_last_year: 10 })
            });
            if (ayRes.ok) {
                const ayData = await ayRes.json();
                setAcademicYears(Array.isArray(ayData) ? ayData : []);
            }

            const ctRes = await fetch(`${getBaseApiUrl()}/academic/course/reference/curriculum-types/options`, {
                method: 'POST',
                headers: h,
                body: JSON.stringify({})
            });
            if (ctRes.ok) {
                const ctData = await ctRes.json();
                setCurriculumTypes(Array.isArray(ctData) ? ctData : []);
            }

            const role = userRolesSignal().find(r => r.id === currentRoleIdSignal());
            if (role && role.roleable_id && role.roleable_id !== '00000000-0000-0000-0000-000000000000') {
                const rType = String(role.roleable_type || '');
                const rName = String(role.name || '').toLowerCase();

                if (rType === 'Unit' || rType.includes('Unit')) {
                    setUnitId(role.roleable_id);
                } else if (rType.includes('Staff') || isStaffProgramStudi(role) || rName.includes('kaprodi') || rName.includes('prodi') || rName.includes('jurusan')) {
                    try {
                        const staffRes = await masterApiShow<any>('institution/master/staffes', role.roleable_id);
                        if (staffRes.data?.unit_id) {
                            setUnitId(staffRes.data.unit_id);
                        }
                    } catch { }
                }
            }
        } catch (e) {
            console.error('Failed to load options', e);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                code: code(),
                name: name(),
                description: description(),
                academic_year_id: academicYearId() || null,
                curriculum_type_id: curriculumTypeId() || null,
                unit_id: unitId() || null,
            });

            if (res.success) {
                toast.success(res.message || t('cd.recordCreatedSuccessfully'));
                setTimeout(() => {
                    window.location.href = basePath;
                }, 500);
            } else {
                toast.danger(res.message || t('cd.failedToCreateRecord'));
            }
        } catch (err: any) {
            toast.danger(err.message || t('cd.networkErrorOccurred'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                            <a href={basePath} class="hover:text-blue-600 transition-colors">{t('cd.curriculum')}</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{t('cd.create')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            {t('cd.addNewCurriculum')}
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0">
                        <a
                            href={basePath}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>{t('cd.cancel')}</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    {t('cd.academicYear')} <span class="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={academicYearId()}
                                    onChange={(e) => setAcademicYearId(e.currentTarget.value)}
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                >
                                    <option value="" disabled>{t('cd.selectAcademicYear')}</option>
                                    <For each={academicYears()}>
                                        {(opt) => <option value={opt.id}>{opt.name}</option>}
                                    </For>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    {t('cd.curriculumType')} <span class="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    value={curriculumTypeId()}
                                    onChange={(e) => setCurriculumTypeId(e.currentTarget.value)}
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                >
                                    <option value="" disabled>{t('cd.selectCurriculumType')}</option>
                                    <For each={curriculumTypes()}>
                                        {(opt) => <option value={opt.id}>{opt.name}</option>}
                                    </For>
                                </select>
                            </div>
                        </div>
                        <div class="grid grid-cols-1 sm:grid-cols-1 gap-6">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    {t('cd.nameTitle')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    placeholder={t('cd.enterName')}
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                {t('cd.descriptionNotes')}
                            </label>
                            <textarea
                                rows={4}
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder={t('cd.additionalDetailsOrRemarks')}
                                class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                            ></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <a
                                href={basePath}
                                class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {t('cd.cancel')}
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <span>{isSubmitting() ? t('cd.saving') : t('cd.saveCurriculum')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
