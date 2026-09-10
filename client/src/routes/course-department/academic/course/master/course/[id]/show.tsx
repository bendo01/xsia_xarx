import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow, masterApiIndex, masterApiDelete } from '~/controllers/master/masterApiController';

export default function CourseMasterShowPage() {
    const apiPath = "academic/course/master/courses";
    const basePath = "/course-department/academic/course/master/course";
    const params = useParams();
    const [searchParams] = useSearchParams();

    const resolveId = () => {
        const pId = params.id;
        if (pId && pId !== '[id]' && pId !== ':id') {
            return pId.trim();
        }
        return ((searchParams.id as string) || '').trim();
    };

    const [selectedId, setSelectedId] = createSignal<string>(resolveId());
    const [course, setCourse] = createSignal<any | null>(null);
    const [unitName, setUnitName] = createSignal<string>('-');
    const [varietyName, setVarietyName] = createSignal<string>('-');
    const [groupName, setGroupName] = createSignal<string>('-');
    const [competenceName, setCompetenceName] = createSignal<string>('-');

    const [isLoading, setIsLoading] = createSignal(true);
    const [isDeleting, setIsDeleting] = createSignal(false);
    let deleteDialogRef!: HTMLDialogElement;

    const fetchDetail = async (id: string) => {
        if (!id) {
            setCourse(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await masterApiShow<any>(apiPath, id);
            if (res.data) {
                const data = res.data;
                setCourse(data);

                // Fetch foreign names in parallel
                const promises: Promise<any>[] = [];

                if (data.unit_id) {
                    promises.push(
                        masterApiShow<any>('institution/master/units', data.unit_id)
                            .then(u => {
                                if (u.data) setUnitName(u.data.name || u.data.nama || data.unit_id);
                            })
                            .catch(() => { })
                    );
                }

                if (data.variety_id) {
                    promises.push(
                        masterApiShow<any>('academic/course/reference/varieties', data.variety_id)
                            .then(v => {
                                if (v.data) setVarietyName(v.data.name || data.variety_id);
                            })
                            .catch(() => { })
                    );
                }

                if (data.group_id) {
                    promises.push(
                        masterApiShow<any>('academic/course/reference/groups', data.group_id)
                            .then(g => {
                                if (g.data) setGroupName(g.data.name || data.group_id);
                            })
                            .catch(() => { })
                    );
                }

                if (data.competence_id) {
                    promises.push(
                        masterApiShow<any>('academic/course/reference/competences', data.competence_id)
                            .then(c => {
                                if (c.data) setCompetenceName(c.data.name || data.competence_id);
                            })
                            .catch(() => { })
                    );
                }

                await Promise.allSettled(promises);
            } else {
                setCourse(null);
                toast.danger(res.error || 'Course record not found.');
            }
        } catch (error) {
            console.error('Error fetching course detail:', error);
            setCourse(null);
            toast.danger('Failed to load course details from server.');
        } finally {
            setIsLoading(false);
        }
    };

    const cleanRedundantIdParam = (resolvedId: string) => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            let changed = false;

            if (url.searchParams.has('id')) {
                url.searchParams.delete('id');
                changed = true;
            }

            if ((params.id === '[id]' || params.id === ':id' || !params.id) && resolvedId) {
                url.pathname = `${basePath}/${resolvedId}/show`;
                changed = true;
            }

            if (changed) {
                const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
                window.history.replaceState(null, '', cleanUrl);
            }
        }
    };

    onMount(() => {
        const id = resolveId();
        setSelectedId(id);
        cleanRedundantIdParam(id);
        fetchDetail(id);
    });

    createEffect(() => {
        const id = resolveId();
        if (id && id !== selectedId()) {
            setSelectedId(id);
            cleanRedundantIdParam(id);
            fetchDetail(id);
        }
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    const openDeleteModal = () => {
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
    };

    const handleDeleteSubmit = async () => {
        const id = selectedId();
        if (!id) return;

        setIsDeleting(true);
        try {
            const res = await masterApiDelete(apiPath, id);
            if (res.success) {
                toast.success(res.message || 'Course deleted successfully!');
                closeDeleteModal();
                setTimeout(() => {
                    const uId = course()?.unit_id || searchParams.unit_id;
                    window.location.href = uId ? `${basePath}?unit_id=${uId}` : basePath;
                }, 500);
            } else {
                toast.danger(res.message || 'Failed to delete course.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'Error occurred while deleting course.');
        } finally {
            setIsDeleting(false);
        }
    };

    const backUrl = () => {
        const uId = course()?.unit_id || searchParams.unit_id;
        return uId ? `${basePath}?unit_id=${uId}` : basePath;
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                            <span class="font-medium text-neutral-900 dark:text-white">Detail</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Course Details: <span class="text-blue-600 dark:text-blue-400">{course()?.code || '...'}</span>
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href={backUrl()}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to List</span>
                        </a>

                        <Show when={selectedId()}>
                            <a
                                href={`${basePath}/${selectedId()}/edit`}
                                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xs shadow-xs transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                <span>Edit Course</span>
                            </a>

                            <button
                                type="button"
                                onClick={openDeleteModal}
                                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-xs shadow-xs transition-colors cursor-pointer"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                                <span>Delete</span>
                            </button>
                        </Show>
                    </div>
                </div>

                <Show
                    when={!isLoading()}
                    fallback={
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8 space-y-4 animate-pulse">
                            <div class="h-8 w-64 bg-neutral-200 dark:bg-neutral-700"></div>
                            <div class="h-4 w-96 bg-neutral-200 dark:bg-neutral-700"></div>
                            <div class="grid grid-cols-2 gap-4 pt-4">
                                <div class="h-20 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-20 bg-neutral-200 dark:bg-neutral-700"></div>
                            </div>
                        </div>
                    }
                >
                    <Show
                        when={course()}
                        fallback={
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-12 text-center text-neutral-500">
                                <p class="text-base font-semibold">Course details not found.</p>
                                <p class="text-xs mt-1">Check if the ID in the URL is correct or if the record was removed.</p>
                                <a href={basePath} class="inline-block mt-4 text-xs font-mono text-blue-600 hover:underline">Return to Course List</a>
                            </div>
                        }
                    >
                        {/* Course Overview Banner */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 dark:border-neutral-700 pb-5">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="px-2.5 py-0.5 text-xs font-mono font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                            {course()?.code || '-'}
                                        </span>
                                        <span class="px-2.5 py-0.5 text-xs font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                            {course()?.implementation_method || 'Kuliah'}
                                        </span>
                                    </div>
                                    <h2 class="text-2xl font-bold text-neutral-900 dark:text-white font-mono">
                                        {course()?.name || '-'}
                                    </h2>
                                    <div class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 flex items-center gap-2">
                                        <span>Program Studi: <strong class="text-neutral-800 dark:text-neutral-200">{unitName()}</strong></span>
                                        <span>•</span>
                                        <span>Jenis: <strong class="text-neutral-800 dark:text-neutral-200">{varietyName()}</strong></span>
                                    </div>
                                </div>

                                <div class="flex items-center gap-3">
                                    <div class="text-right">
                                        <span class="text-xs text-neutral-500 block uppercase font-mono tracking-wider">Total Beban</span>
                                        <span class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                                            {course()?.total_credit ?? 0} <span class="text-sm font-normal text-neutral-500">SKS</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Credit Distribution Cards */}
                            <div class="mt-5">
                                <h3 class="text-xs font-mono font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">
                                    Credits Breakdown (Distribusi SKS)
                                </h3>

                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/70">
                                        <span class="text-[11px] text-neutral-500 uppercase font-mono block">Teori / Kuliah</span>
                                        <span class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                                            {course()?.lecture_credit ?? 0}
                                        </span>
                                        <span class="text-[10px] text-neutral-400 block">SKS</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/70">
                                        <span class="text-[11px] text-neutral-500 uppercase font-mono block">Praktikum</span>
                                        <span class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                                            {course()?.practice_credit ?? 0}
                                        </span>
                                        <span class="text-[10px] text-neutral-400 block">SKS</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/70">
                                        <span class="text-[11px] text-neutral-500 uppercase font-mono block">Praktik Lapangan</span>
                                        <span class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                                            {course()?.field_practice_credit ?? 0}
                                        </span>
                                        <span class="text-[10px] text-neutral-400 block">SKS</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/70">
                                        <span class="text-[11px] text-neutral-500 uppercase font-mono block">Simulasi</span>
                                        <span class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                                            {course()?.simulation_credit ?? 0}
                                        </span>
                                        <span class="text-[10px] text-neutral-400 block">SKS</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Pedagogical Flags & Classification Cards */}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Classifications */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <h3 class="text-sm font-bold font-mono uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3">
                                    <span class="size-2 bg-blue-600 inline-block"></span>
                                    Curricular Classifications
                                </h3>

                                <div class="space-y-3 text-xs">
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 font-medium">Department / Program Studi</span>
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">{unitName()}</span>
                                    </div>

                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 font-medium">Variety (Jenis Mata Kuliah)</span>
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">{varietyName()}</span>
                                    </div>

                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 font-medium">Group (Kelompok Mata Kuliah)</span>
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">{groupName()}</span>
                                    </div>

                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 font-medium">Competence (Kompetensi)</span>
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">{competenceName()}</span>
                                    </div>

                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 font-medium">Implementation Method</span>
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">{course()?.implementation_method || '-'}</span>
                                    </div>

                                    <div class="flex justify-between py-1.5">
                                        <span class="text-neutral-500 font-medium">Active Dates</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200">
                                            {course()?.start_date ? String(course().start_date).substring(0, 10) : 'Always'}
                                            {course()?.end_date ? ` ~ ${String(course().end_date).substring(0, 10)}` : ''}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Teaching Aids & Policies */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <h3 class="text-sm font-bold font-mono uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3">
                                    <span class="size-2 bg-indigo-600 inline-block"></span>
                                    Pedagogical Indicators
                                </h3>

                                <div class="space-y-3 text-xs">
                                    <div class="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-700 dark:text-neutral-300">Syllabus / RPS (Silabus Tersedia)</span>
                                        <span class={`px-2 py-0.5 text-xs font-mono font-medium ${course()?.has_syllabus ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                                            {course()?.has_syllabus ? 'Available' : 'No'}
                                        </span>
                                    </div>

                                    <div class="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-700 dark:text-neutral-300">Teaching Materials / SAP (Bahan Ajar)</span>
                                        <span class={`px-2 py-0.5 text-xs font-mono font-medium ${course()?.has_material ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                                            {course()?.has_material ? 'Available' : 'No'}
                                        </span>
                                    </div>

                                    <div class="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-700 dark:text-neutral-300">Practical Sessions (Praktikum)</span>
                                        <span class={`px-2 py-0.5 text-xs font-mono font-medium ${course()?.has_practice ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                                            {course()?.has_practice ? 'Yes' : 'No'}
                                        </span>
                                    </div>

                                    <div class="flex items-center justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/60">
                                        <span class="text-neutral-700 dark:text-neutral-300">Lecture Dictation / Module (Diktat)</span>
                                        <span class={`px-2 py-0.5 text-xs font-mono font-medium ${course()?.has_dictation ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                                            {course()?.has_dictation ? 'Available' : 'No'}
                                        </span>
                                    </div>

                                    <div class="flex items-center justify-between py-1.5">
                                        <span class="text-neutral-700 dark:text-neutral-300">Offering Unit Assigned (Unit Pengampu)</span>
                                        <span class={`px-2 py-0.5 text-xs font-mono font-medium ${course()?.has_unit ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-500'}`}>
                                            {course()?.has_unit ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sub-resource shortcuts: RPS and Evaluation Planning */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                            <h3 class="text-sm font-bold font-mono uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-3">
                                <span class="size-2 bg-amber-500 inline-block"></span>
                                Course Learning & Evaluation Planning
                            </h3>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <a
                                    href={`${basePath}/${selectedId()}/course-learn-planning?course_id=${selectedId()}`}
                                    class="p-4 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-white dark:hover:bg-neutral-800 transition-all group"
                                >
                                    <div class="flex items-start gap-3">
                                        <div class="size-8 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                                <path d="M6 6h10" />
                                                <path d="M6 10h10" />
                                            </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 flex items-center justify-between">
                                                <span>RPS (Course Learn Planning)</span>
                                                <span class="text-neutral-400 group-hover:translate-x-0.5 transition-transform">→</span>
                                            </div>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Weekly semester learning plans, lesson outcomes, and teaching activities.
                                            </p>
                                        </div>
                                    </div>
                                </a>

                                <a
                                    href={`${basePath}/${selectedId()}/course-evaluation-planning?course_id=${selectedId()}`}
                                    class="p-4 border border-neutral-200 dark:border-neutral-700 hover:border-purple-500 dark:hover:border-purple-500 bg-neutral-50 dark:bg-neutral-900/40 hover:bg-white dark:hover:bg-neutral-800 transition-all group"
                                >
                                    <div class="flex items-start gap-3">
                                        <div class="size-8 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                                                <polyline points="14 2 14 8 20 8" />
                                                <path d="m9 15 2 2 4-4" />
                                            </svg>
                                        </div>
                                        <div class="flex-1 min-w-0">
                                            <div class="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 flex items-center justify-between">
                                                <span>Course Evaluation Planning</span>
                                                <span class="text-neutral-400 group-hover:translate-x-0.5 transition-transform">→</span>
                                            </div>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                                                Evaluation components, grading rubrics, and weight percentages.
                                            </p>
                                        </div>
                                    </div>
                                </a>
                            </div>
                        </div>

                        {/* System Metadata Card */}
                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700 text-xs flex flex-wrap items-center justify-between gap-4 font-mono">
                            <div class="flex items-center gap-2">
                                <span class="text-neutral-500">ID:</span>
                                <span class="text-neutral-800 dark:text-neutral-200">{course()?.id}</span>
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(course()?.id, 'ID')}
                                    class="text-blue-600 hover:text-blue-700 cursor-pointer"
                                >
                                    Copy
                                </button>
                            </div>

                            <div class="text-neutral-500 flex items-center gap-4">
                                <span>Created: {course()?.created_at ? new Date(course()?.created_at).toLocaleDateString() : '-'}</span>
                                <span>Updated: {course()?.updated_at ? new Date(course()?.updated_at).toLocaleDateString() : '-'}</span>
                            </div>
                        </div>
                    </Show>
                </Show>
            </div>

            {/* Delete Confirmation Modal */}
            <dialog
                ref={deleteDialogRef}
                class="p-6 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 shadow-xl max-w-md w-full backdrop:bg-black/50"
            >
                <div class="space-y-4">
                    <div class="flex items-center gap-3 text-red-600">
                        <svg class="size-6 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <h3 class="text-lg font-bold font-mono">Confirm Course Deletion</h3>
                    </div>

                    <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                        Are you sure you want to delete course <strong class="font-mono text-neutral-900 dark:text-white">{course()?.code} - {course()?.name}</strong>?
                        This action cannot be undone.
                    </p>

                    <div class="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-700">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isDeleting()}
                            onClick={handleDeleteSubmit}
                            class="px-4 py-2 text-xs font-mono font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            <span>{isDeleting() ? 'Deleting...' : 'Delete Course'}</span>
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
