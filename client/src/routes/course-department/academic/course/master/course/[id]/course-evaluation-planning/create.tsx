import { createSignal, onMount, For, Show } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiCreate, masterApiShow, masterApiIndex } from '~/controllers/master/masterApiController';

export default function MasterCreatePage() {
    const apiPath = "academic/course/master/course-evaluation-plannings";
    const courseMasterBasePath = "/course-department/academic/course/master/course";
    const params = useParams();
    const [searchParams] = useSearchParams();

    const courseId = () => {
        const pId = params.id;
        if (pId && pId !== '[id]' && pId !== ':id') {
            return pId.trim();
        }
        return ((searchParams.course_id as string) || (searchParams.id as string) || '').trim();
    };

    const courseDetailUrl = () => courseId() ? `${courseMasterBasePath}/${courseId()}/show` : courseMasterBasePath;
    const listUrl = () => courseId()
        ? `${courseMasterBasePath}/${courseId()}/course-evaluation-planning`
        : `/course-department/academic/course/master/course/[id]/course-evaluation-planning`;

    const cleanRedundantParams = () => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            let changed = false;

            if (url.searchParams.has('course_id')) {
                url.searchParams.delete('course_id');
                changed = true;
            }
            if (url.searchParams.has('courseId')) {
                url.searchParams.delete('courseId');
                changed = true;
            }
            if (url.searchParams.has('id')) {
                url.searchParams.delete('id');
                changed = true;
            }

            if (changed) {
                const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
                window.history.replaceState(null, '', cleanUrl);
            }
        }
    };

    const [course, setCourse] = createSignal<any | null>(null);
    const [evaluationTypes, setEvaluationTypes] = createSignal<any[]>([]);
    const [evaluationTypeId, setEvaluationTypeId] = createSignal('');
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [percentage, setPercentage] = createSignal<number | ''>('');
    const [description, setDescription] = createSignal('');
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    onMount(async () => {
        cleanRedundantParams();
        const cId = courseId();
        if (cId) {
            try {
                const res = await masterApiShow<any>('academic/course/master/courses', cId);
                if (res?.data) setCourse(res.data);
            } catch {
                // ignore
            }
        }
        try {
            const typesRes = await masterApiIndex<any>('academic/course/reference/evaluation-types', { per_page: 50 });
            if (typesRes?.data && typesRes.data.length > 0) {
                setEvaluationTypes(typesRes.data);
                setEvaluationTypeId(typesRes.data[0].id);
            }
        } catch {
            // ignore
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const cId = courseId();
        if (!cId) {
            toast.danger('Course ID is missing. Cannot create planning without course association.');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                code: Number(code()) || 1,
                name: name(),
                percentage: Number(percentage()) || 0,
                decription_indonesian: description() || name(),
                course_id: cId,
                evaluation_type_id: evaluationTypeId() || undefined,
            });

            if (res.success) {
                toast.success(res.message || 'Record created successfully!');
                setTimeout(() => {
                    window.location.href = listUrl();
                }, 500);
            } else {
                toast.danger(res.message || 'Failed to create record.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'Network error occurred.');
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
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <a href={courseMasterBasePath} class="hover:text-blue-600 transition-colors">Course</a>
                            <span>/</span>
                            <a href={courseDetailUrl()} class="hover:text-blue-600 transition-colors">
                                {course()?.code ? `${course()?.code}` : (courseId() || 'Course')}
                            </a>
                            <span>/</span>
                            <a href={listUrl()} class="hover:text-blue-600 transition-colors">Evaluation Planning</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Create</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Add New Course Evaluation Planning
                            <Show when={course()?.code || course()?.name}>
                                : <span class="text-blue-600 dark:text-blue-400">{course()?.code} {course()?.name ? `- ${course()?.name}` : ''}</span>
                            </Show>
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0">
                        <a
                            href={listUrl()}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Cancel</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    Code (Urutan) <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={code()}
                                    onInput={(e) => setCode(e.currentTarget.value)}
                                    placeholder="e.g. 1"
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    Name / Title <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    placeholder="e.g. Tugas 1 / UTS"
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    Percentage (%)
                                </label>
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    max="100"
                                    value={percentage()}
                                    onInput={(e) => setPercentage(e.currentTarget.value === '' ? '' : Number(e.currentTarget.value))}
                                    placeholder="e.g. 20"
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>
                        </div>

                        <Show when={evaluationTypes().length > 0}>
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    Evaluation Type
                                </label>
                                <select
                                    value={evaluationTypeId()}
                                    onChange={(e) => setEvaluationTypeId(e.currentTarget.value)}
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                >
                                    <For each={evaluationTypes()}>
                                        {(type) => (
                                            <option value={type.id}>{type.name || type.nama || type.code || type.id}</option>
                                        )}
                                    </For>
                                </select>
                            </div>
                        </Show>

                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                Description / Notes
                            </label>
                            <textarea
                                rows={4}
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder="Additional details or remarks..."
                                class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                            ></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <a
                                href={listUrl()}
                                class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <span>{isSubmitting() ? 'Saving...' : 'Save Course Evaluation Planning'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
