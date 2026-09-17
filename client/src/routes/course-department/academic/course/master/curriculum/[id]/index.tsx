import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';

export default function MasterShowPage() {
    const apiPath = "academic/course/master/curriculums";
    const basePath = "/course-department/academic/course/master/curriculum";
    const params = useParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [record, setRecord] = createSignal<any | null>(null);
    const [selectedId, setSelectedId] = createSignal<string>((params.id as string) || '');

    const fetchDetail = async (id: string) => {
        if (!id) {
            setRecord(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await masterApiShow(apiPath, id);
            if (res.data) {
                setRecord(res.data);
            } else {
                setRecord(null);
                toast.danger(res.error || 'Record not found on server.');
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
            setRecord(null);
            toast.danger('Failed to load record from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = (params.id as string) || '';
        fetchDetail(id);
    });

    createEffect(() => {
        const id = params.id as string;
        if (id && id !== selectedId()) {
            setSelectedId(id);
            fetchDetail(id);
        }
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
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
                            <span>Course</span>
                            <span>/</span>
                            <span>Master</span>
                            <span>/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors">Curriculum</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Detail</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Curriculum Details
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href={basePath}
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
                                <span>Edit Curriculum</span>
                            </a>
                        </Show>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-4 w-96 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="grid grid-cols-2 gap-4 pt-4">
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                </div>
                            </div>
                        }
                    >
                        <Show
                            when={record()}
                            fallback={
                                <div class="py-12 text-center text-neutral-500">
                                    <p class="text-base font-semibold">No record details found.</p>
                                    <p class="text-xs mt-1">Check if the ID parameter in the URL is valid.</p>
                                </div>
                            }
                        >
                            <div class="space-y-6">
                                <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-700 pb-4">
                                    <div>
                                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Record Name</span>
                                        <h2 class="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                                            {record()?.name || record()?.nama || record()?.title || '-'}
                                        </h2>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                                            {record()?.code || record()?.kode || 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">UUID</span>
                                        <div class="flex items-center justify-between gap-2">
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 truncate">{record()?.id || record()?.uuid || '-'}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(record()?.id || record()?.uuid, 'ID')}
                                                class="text-blue-600 hover:text-blue-700 cursor-pointer font-mono"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Created At</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block">{record()?.created_at || '-'}</span>
                                    </div>

                                    <Show when={record()?.unit}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Unit</span>
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{record().unit.name || record().unit.nama || '-'}</span>
                                        </div>
                                    </Show>

                                    <Show when={record()?.academic_year}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Academic Year</span>
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{record().academic_year.name || record().academic_year.nama || '-'}</span>
                                        </div>
                                    </Show>

                                    <Show when={record()?.curriculum_type}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Curriculum Type</span>
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{record().curriculum_type.name || record().curriculum_type.nama || '-'}</span>
                                        </div>
                                    </Show>
                                    <Show when={record()?.total_credit !== undefined && record()?.total_credit !== null}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Total Credit</span>
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 block">{record().total_credit}</span>
                                        </div>
                                    </Show>

                                    <Show when={record()?.mandatory_course_credit !== undefined && record()?.mandatory_course_credit !== null}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Mandatory Credit</span>
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 block">{record().mandatory_course_credit}</span>
                                        </div>
                                    </Show>

                                    <Show when={record()?.optional_course_credit !== undefined && record()?.optional_course_credit !== null}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Optional Credit</span>
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 block">{record().optional_course_credit}</span>
                                        </div>
                                    </Show>

                                    <Show when={record()?.is_active !== undefined && record()?.is_active !== null}>
                                        <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Status</span>
                                            <span class="font-mono block">
                                                <span class={`px-1.5 py-0.5 text-xs font-medium border ${record().is_active
                                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                                    : 'bg-neutral-100 text-neutral-600 border-neutral-200 dark:bg-neutral-700 dark:text-neutral-400'
                                                    }`}>
                                                    {record().is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </span>
                                        </div>
                                    </Show>

                                </div>
                                <Show when={record()?.curriculum_details && Array.isArray(record().curriculum_details) && record().curriculum_details.length > 0}>
                                    <div class="mt-8">
                                        <h3 class="text-sm font-bold font-mono text-neutral-900 dark:text-white mb-3">Curriculum Details</h3>

                                        {/* Desktop Table View */}
                                        <div class="hidden md:block border border-neutral-200 dark:border-neutral-700 overflow-hidden bg-white dark:bg-neutral-900">
                                            <table class="w-full text-sm text-left">
                                                <thead class="bg-neutral-50 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 font-mono text-xs uppercase">
                                                    <tr>
                                                        <th class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">Sequence</th>
                                                        <th class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">Code</th>
                                                        <th class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">Name</th>
                                                        <th class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">Credit</th>
                                                        <th class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">MBKM</th>
                                                        <th class="px-4 py-3 border-b border-neutral-200 dark:border-neutral-700">RPL</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                                    <For each={record().curriculum_details}>
                                                        {(detail: any) => (
                                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                                <td class="px-4 py-3 font-mono">{detail.code || '-'}</td>
                                                                <td class="px-4 py-3 font-mono">{detail.course?.code || '-'}</td>
                                                                <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{detail.name || '-'}</td>
                                                                <td class="px-4 py-3">{detail.credit || '-'}</td>
                                                                <td class="px-4 py-3">
                                                                    <span class={`px-2 py-1 text-xs font-medium rounded ${detail.is_convertable_to_mbkm ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                                        {detail.is_convertable_to_mbkm ? 'Yes' : 'No'}
                                                                    </span>
                                                                </td>
                                                                <td class="px-4 py-3">
                                                                    <span class={`px-2 py-1 text-xs font-medium rounded ${detail.is_convertable_to_prior_learning_recognition ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                                        {detail.is_convertable_to_prior_learning_recognition ? 'Yes' : 'No'}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </For>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile Card View */}
                                        <div class="block md:hidden space-y-4">
                                            <For each={record().curriculum_details}>
                                                {(detail: any) => (
                                                    <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 p-4 space-y-3 shadow-sm">
                                                        <div class="flex justify-between items-start">
                                                            <div>
                                                                <div class="font-mono text-xs text-neutral-500 dark:text-neutral-400 mb-1">{detail.code || '-'}</div>
                                                                <div class="font-mono text-xs text-neutral-500 dark:text-neutral-400 mb-1">{detail.course?.code || '-'}</div>
                                                                <div class="font-bold text-neutral-900 dark:text-white">{detail.name || '-'}</div>
                                                            </div>
                                                            <div class="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 text-xs font-bold rounded">
                                                                {detail.credit || '-'} SKS
                                                            </div>
                                                        </div>
                                                        <div class="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-neutral-100 dark:border-neutral-800">
                                                            <div>
                                                                <span class="text-neutral-500 dark:text-neutral-400 block mb-1">MBKM</span>
                                                                <span class={`inline-block px-2 py-1 font-medium rounded ${detail.is_convertable_to_mbkm ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                                    {detail.is_convertable_to_mbkm ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span class="text-neutral-500 dark:text-neutral-400 block mb-1">RPL</span>
                                                                <span class={`inline-block px-2 py-1 font-medium rounded ${detail.is_convertable_to_prior_learning_recognition ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                                                    {detail.is_convertable_to_prior_learning_recognition ? 'Yes' : 'No'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </div>
                                </Show>
                            </div>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}
