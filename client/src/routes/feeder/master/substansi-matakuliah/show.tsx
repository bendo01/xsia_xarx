import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';

export default function FeederMasterShowPage() {
    const apiPath = "feeder/master/substansi-matakuliah";
    const basePath = "/feeder/master/substansi-matakuliah";
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [record, setRecord] = createSignal<any | null>(null);
    const [selectedId, setSelectedId] = createSignal<string>((searchParams.id as string) || '');

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
        const id = (searchParams.id as string) || '';
        fetchDetail(id);
    });

    createEffect(() => {
        const id = searchParams.id as string;
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
                            <span>Feeder</span>
                            <span>/</span>
                            <span>Master</span>
                            <span>/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors">Substansi Matakuliah</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Detail</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Substansi Matakuliah Record Details
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href={basePath}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-none shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span>Back to List</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-4 w-96 bg-neutral-200 dark:bg-neutral-700"></div>
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
                                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Feeder Entity</span>
                                        <h2 class="text-xl font-bold text-neutral-900 dark:text-white font-mono">
                                            {record()?.nama || record()?.nama_mahasiswa || record()?.nama_dosen || record()?.nama_mata_kuliah || record()?.nama_program_studi || record()?.name || '-'}
                                        </h2>
                                    </div>
                                    <div>
                                        <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                                            FEEDER SYNCED
                                        </span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Identifier</span>
                                        <div class="flex items-center justify-between gap-2">
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 truncate">{record()?.id || record()?.id_feeder || '-'}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(record()?.id || record()?.id_feeder, 'ID')}
                                                class="text-blue-600 hover:text-blue-700 cursor-pointer font-mono"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Code / NIM / NIDN</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block">{record()?.nim || record()?.nidn || record()?.nipd || record()?.kode_mata_kuliah || '-'}</span>
                                    </div>

                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Updated At</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block">{record()?.updated_at || record()?.last_update || '-'}</span>
                                    </div>
                                </div>

                                <div class="mt-6">
                                    <h3 class="text-sm font-bold font-mono text-neutral-900 dark:text-white mb-3">All Synchronized Fields</h3>
                                    <div class="border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                        <table class="w-full text-xs text-left">
                                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                                <For each={Object.entries(record() || {})}>
                                                    {([key, val]) => (
                                                        <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                                            <td class="px-4 py-2.5 font-mono font-semibold text-neutral-600 dark:text-neutral-400 w-1/3 bg-neutral-50 dark:bg-neutral-900/30">
                                                                {key}
                                                            </td>
                                                            <td class="px-4 py-2.5 font-mono text-neutral-900 dark:text-white break-all">
                                                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '-')}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </For>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}
