import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow, masterApiUpdate } from '~/controllers/master/masterApiController';

export default function MasterEditPage() {
    const apiPath = "academic/course/master/course-learn-plannings";
    const courseMasterBasePath = "/course-department/academic/course/master/course";
    const params = useParams();
    const [searchParams] = useSearchParams();

    const courseId = () => {
        const fromSearch = ((searchParams.course_id as string) || (searchParams.courseId as string) || '').trim();
        if (fromSearch && fromSearch !== '[id]' && fromSearch !== ':id') {
            return fromSearch;
        }
        if (typeof window !== 'undefined') {
            const parts = window.location.pathname.split('/').filter(Boolean);
            const courseIdx = parts.indexOf('course');
            if (courseIdx !== -1 && parts[courseIdx + 1] && parts[courseIdx + 1] !== '[id]') {
                return parts[courseIdx + 1];
            }
        }
        return '';
    };

    const resolveRecordId = () => {
        const fromSearch = ((searchParams.id as string) || '').trim();
        if (fromSearch && fromSearch !== '[id]' && fromSearch !== ':id') {
            return fromSearch;
        }
        const pId = params.id;
        if (pId && pId !== '[id]' && pId !== ':id') {
            return pId.trim();
        }
        if (typeof window !== 'undefined') {
            const parts = window.location.pathname.split('/').filter(Boolean);
            const planningIdx = parts.indexOf('course-learn-planning');
            if (planningIdx !== -1 && parts[planningIdx + 1] && parts[planningIdx + 1] !== 'edit' && parts[planningIdx + 1] !== 'show') {
                return parts[planningIdx + 1];
            }
        }
        return '';
    };

    const listUrl = () => courseId()
        ? `${courseMasterBasePath}/${courseId()}/course-learn-planning`
        : `/course-department/academic/course/master/course/[id]/course-learn-planning`;

    const [selectedId, setSelectedId] = createSignal<string>(resolveRecordId());
    const [existingCourseId, setExistingCourseId] = createSignal<string>('');
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const fetchExisting = async (id: string) => {
        if (!id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await masterApiShow(apiPath, id);
            if (res.data) {
                const cId = courseId();
                if (cId && res.data.course_id && String(res.data.course_id) !== String(cId)) {
                    toast.danger('Record does not belong to the selected course.');
                    setIsLoading(false);
                    return;
                }
                setExistingCourseId(res.data.course_id ? String(res.data.course_id) : '');
                setCode(String(res.data.code ?? res.data.kode ?? ''));
                setName(res.data.name || res.data.nama || res.data.title || '');
                setDescription(res.data.decription_indonesian || res.data.description || res.data.keterangan || '');
            } else {
                toast.danger(res.error || 'Record not found.');
            }
        } catch (err: any) {
            toast.danger('Failed to load record details.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = resolveRecordId();
        setSelectedId(id);
        fetchExisting(id);
    });

    createEffect(() => {
        const id = resolveRecordId();
        if (id && id !== selectedId()) {
            setSelectedId(id);
            fetchExisting(id);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const id = selectedId();
        if (!id) return;

        const cId = courseId() || existingCourseId();
        setIsSubmitting(true);
        try {
            const res = await masterApiUpdate(apiPath, id, {
                code: Number(code()) || 1,
                name: name(),
                decription_indonesian: description() || name(),
                course_id: cId || undefined,
            });

            if (res.success) {
                toast.success(res.message || 'Record updated successfully!');
                setTimeout(() => {
                    window.location.href = listUrl();
                }, 500);
            } else {
                toast.danger(res.message || 'Failed to update record.');
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
                            <a href={listUrl()} class="hover:text-blue-600 transition-colors">RPS</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Edit</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Edit Course Learning Planning
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
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Code (Week / Pertemuan Ke-) <span class="text-red-500">*</span>
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
                                        placeholder="Enter name"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>
                            </div>

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
                                    <span>{isSubmitting() ? 'Updating...' : 'Update Course Learning Planning'}</span>
                                </button>
                            </div>
                        </form>
                    </Show>
                </div>
            </div>
        </div>
    );
}
