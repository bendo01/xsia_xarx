import { createSignal, onMount, For, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import RemoteSearchSelect from '~/components/form/RemoteSearchSelect';
import { masterApiCreate, masterApiOptions, masterApiShow, type MasterOptionItem } from '~/controllers/master/masterApiController';

type CourseOption = { id: string; code?: string; name?: string; total_credit?: number };

export default function AcademicCourseMasterCurriculumDetailCreatePage() {
    const apiPath = 'academic/course/master/curriculum-details';
    const params = useParams();
    const curriculumId = params.id as string;
    const basePath = `/administrator/academic/course/master/curriculum/${curriculumId}/curriculum-detail`;
    const [curriculumName, setCurriculumName] = createSignal('');
    const [unitId, setUnitId] = createSignal('');
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [credit, setCredit] = createSignal('');
    const [semesterId, setSemesterId] = createSignal('');
    const [courseId, setCourseId] = createSignal('');
    const [courseLabel, setCourseLabel] = createSignal('');
    const [concentrationId, setConcentrationId] = createSignal('');
    const [isConvertableToMbkm, setIsConvertableToMbkm] = createSignal(false);
    const [isConvertableToPriorLearning, setIsConvertableToPriorLearning] = createSignal(false);
    const [semesterOptions, setSemesterOptions] = createSignal<MasterOptionItem[]>([]);
    const [concentrationOptions, setConcentrationOptions] = createSignal<MasterOptionItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    onMount(async () => {
        try {
            const [curriculum, semesters] = await Promise.all([
                masterApiShow(`academic/course/master/curriculums`, curriculumId),
                masterApiOptions('academic/course/reference/semesters'),
            ]);
            setSemesterOptions(semesters);
            if (curriculum.data) {
                setCurriculumName(curriculum.data.name || '');
                setUnitId(curriculum.data.unit_id || '');
            } else {
                toast.danger(curriculum.error || 'Curriculum not found.');
            }
            // Courses and concentrations are limited to the curriculum's study program
            setConcentrationOptions(await masterApiOptions('academic/course/master/concentrations', { unit_id: unitId() }));
        } finally {
            setIsLoading(false);
        }
    });

    const selectCourse = (item: CourseOption | null) => {
        setCourseId(item?.id || '');
        setCourseLabel(item ? `${item.code ? `[${item.code}] ` : ''}${item.name || ''}` : '');
        if (item) {
            if (!name()) setName(item.name || '');
            if (!credit() && item.total_credit != null) setCredit(String(item.total_credit));
        }
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!courseId()) {
            toast.danger('Please select a course.');
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                curriculum_id: curriculumId,
                semester_id: semesterId(),
                course_id: courseId(),
                concentration_id: concentrationId() || null,
                code: code().trim() === '' ? null : parseInt(code(), 10),
                name: name().trim() || null,
                credit: credit().trim() === '' ? null : Number(credit()),
                is_convertable_to_mbkm: isConvertableToMbkm(),
                is_convertable_to_prior_learning_recognition: isConvertableToPriorLearning(),
            });

            if (res.success) {
                toast.success(res.message || 'Curriculum detail created successfully!');
                setTimeout(() => {
                    window.location.href = res.data?.id ? `${basePath}/${res.data.id}` : basePath;
                }, 500);
            } else {
                toast.danger(res.message || 'Failed to create curriculum detail.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'Network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2';
    const inputClass =
        'w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">Home</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Academic</span>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Course</span>
                            <span class="shrink-0">/</span>
                            <a href={`/administrator/academic/course/master/curriculum/${curriculumId}`} class="hover:text-blue-600 transition-colors shrink-0">
                                {curriculumName() || 'Curriculum'}
                            </a>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors shrink-0">Curriculum Detail</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">Create</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono truncate">
                            Add New Curriculum Detail
                        </h1>
                    </div>

                    <div class="w-full sm:w-auto flex items-center gap-2 shrink-0">
                        <a
                            href={basePath}
                            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Cancel</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 max-w-3xl">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-20 bg-neutral-200 dark:bg-neutral-700"></div>
                            </div>
                        }
                    >
                        <form onSubmit={handleSubmit} class="space-y-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                <div class="sm:col-span-2">
                                    <label class={labelClass}>
                                        Course <span class="text-red-500">*</span>
                                    </label>
                                    <RemoteSearchSelect<CourseOption>
                                        apiPath="academic/course/master/courses"
                                        searchParam="search"
                                        extraParams={{ unit_id: unitId() || undefined }}
                                        value={courseId()}
                                        selectedLabel={courseLabel()}
                                        placeholder="Search course by code or name..."
                                        getLabel={(item) => item.name || item.id}
                                        getSublabel={(item) => `${item.code || ''}${item.total_credit != null ? ` · ${item.total_credit} SKS` : ''}`}
                                        onSelect={selectCourse}
                                        required
                                        class={`${inputClass} pr-8`}
                                    />
                                </div>

                                <div>
                                    <label class={labelClass}>
                                        Semester <span class="text-red-500">*</span>
                                    </label>
                                    <select required value={semesterId()} onChange={(e) => setSemesterId(e.currentTarget.value)} class={inputClass}>
                                        <option value="">-- Select Semester --</option>
                                        <For each={semesterOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                    </select>
                                </div>

                                <div>
                                    <label class={labelClass}>Concentration</label>
                                    <select value={concentrationId()} onChange={(e) => setConcentrationId(e.currentTarget.value)} class={inputClass}>
                                        <option value="">-- None --</option>
                                        <For each={concentrationOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                    </select>
                                </div>

                                <div>
                                    <label class={labelClass}>Name</label>
                                    <input
                                        type="text"
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        placeholder="Filled from the course if left empty"
                                        class={inputClass}
                                    />
                                </div>

                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class={labelClass}>Code</label>
                                        <input
                                            type="number"
                                            step="1"
                                            value={code()}
                                            onInput={(e) => setCode(e.currentTarget.value)}
                                            placeholder="e.g. 1"
                                            class={inputClass}
                                        />
                                    </div>
                                    <div>
                                        <label class={labelClass}>Credit (SKS)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            min="0"
                                            value={credit()}
                                            onInput={(e) => setCredit(e.currentTarget.value)}
                                            placeholder="e.g. 3"
                                            class={inputClass}
                                        />
                                    </div>
                                </div>

                                <div class="sm:col-span-2 flex flex-col sm:flex-row gap-3 sm:gap-6">
                                    <label class="inline-flex items-center gap-2 text-xs font-mono text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                        <input type="checkbox" checked={isConvertableToMbkm()} onChange={(e) => setIsConvertableToMbkm(e.currentTarget.checked)} class="size-4" />
                                        <span>Convertible to MBKM</span>
                                    </label>
                                    <label class="inline-flex items-center gap-2 text-xs font-mono text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isConvertableToPriorLearning()}
                                            onChange={(e) => setIsConvertableToPriorLearning(e.currentTarget.checked)}
                                            class="size-4"
                                        />
                                        <span>Convertible to Prior Learning Recognition (RPL)</span>
                                    </label>
                                </div>
                            </div>

                            <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                                <a
                                    href={basePath}
                                    class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    <span>{isSubmitting() ? 'Saving...' : 'Save Curriculum Detail'}</span>
                                </button>
                            </div>
                        </form>
                    </Show>
                </div>
            </div>
        </div>
    );
}
