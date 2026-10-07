import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';

export default function InstitutionMasterStaffDetailPage() {
    const basePath = "/administrator/institution/master/staff";
    const params = useParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [record, setRecord] = createSignal<any | null>(null);
    const [selectedId, setSelectedId] = createSignal<string>((params.id as string) || '');

    const fetchDetail = async (id: string) => {
        if (!id || id === '[id]' || id === ':id') {
            setRecord(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const apiRes = await masterApiShow('institution/master/staffs', id);
            if (apiRes.data) {
                setRecord(apiRes.data);
            } else if (apiRes && !apiRes.is_error && apiRes.id) {
                setRecord(apiRes);
            } else {
                setRecord(null);
                toast.danger('Staff record not found.');
            }
        } catch (error) {
            console.error('Error fetching staff detail:', error);
            setRecord(null);
            toast.danger('Failed to load staff record from server.');
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

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Header Section */}
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">Home</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Institution</span>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Master</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors shrink-0">Staff</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">Detail</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono truncate">
                            Staff Details
                        </h1>
                    </div>

                    <div class="w-full sm:w-auto flex items-center gap-2 shrink-0">
                        <a
                            href={basePath}
                            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to List</span>
                        </a>
                    </div>
                </div>

                {/* Content Box */}
                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-4 w-96 max-w-full bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
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
                                    <p class="text-base font-semibold">No staff details found.</p>
                                    <p class="text-xs mt-1">Check if the ID parameter in the URL is valid.</p>
                                </div>
                            }
                        >
                            <div class="space-y-6">
                                {/* Title and Badge Banner */}
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-700 pb-4">
                                    <div class="min-w-0">
                                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">Staff Name</span>
                                        <h2 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-mono break-all sm:break-normal">
                                            {record()?.name || record()?.nama || record()?.individual?.name || '-'}
                                        </h2>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2 shrink-0">
                                        <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                                            {record()?.code || 'ACTIVE'}
                                        </span>
                                    </div>
                                </div>

                                {/* Key Metrics / Highlights Grid */}
                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
                                    <div class="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">UUID</span>
                                        <div class="flex items-center justify-between gap-2 min-w-0">
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 truncate">{record()?.id || record()?.uuid || '-'}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(record()?.id || record()?.uuid, 'ID')}
                                                class="text-blue-600 hover:text-blue-700 cursor-pointer font-mono shrink-0 text-xs font-medium"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>

                                    <div class="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">Code</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{record()?.code || '-'}</span>
                                    </div>

                                    <div class="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">Individual Reference</span>
                                        <div class="flex items-center justify-between gap-2 min-w-0">
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 truncate">{record()?.individual_id || '-'}</span>
                                            <Show when={record()?.individual_id}>
                                                <a
                                                    href={`/administrator/person/master/individual/${record()?.individual_id}`}
                                                    class="text-blue-600 hover:text-blue-700 font-mono text-[11px] shrink-0"
                                                >
                                                    Profile
                                                </a>
                                            </Show>
                                        </div>
                                    </div>
                                </div>

                                {/* All Entity Attributes: Dual Desktop Table & Mobile Card View */}
                                <div class="mt-6">
                                    <div class="flex items-center justify-between mb-3">
                                        <h3 class="text-sm font-bold font-mono text-neutral-900 dark:text-white">All Entity Attributes</h3>
                                        <span class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                                            {Object.keys(record() || {}).length} fields
                                        </span>
                                    </div>

                                    {/* Desktop Table View (>= 768px) */}
                                    <div class="hidden md:block border border-neutral-200 dark:border-neutral-700 overflow-hidden">
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

                                    {/* Mobile Cards View (< 768px) */}
                                    <div class="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700 border border-neutral-200 dark:border-neutral-700 bg-neutral-50/40 dark:bg-neutral-900/30">
                                        <For each={Object.entries(record() || {})}>
                                            {([key, val]) => (
                                                <div class="p-3 space-y-1">
                                                    <div class="text-[11px] font-mono font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                        {key}
                                                    </div>
                                                    <div class="text-xs font-mono text-neutral-900 dark:text-white break-all">
                                                        {typeof val === 'object' ? JSON.stringify(val, null, 2) : String(val ?? '-')}
                                                    </div>
                                                </div>
                                            )}
                                        </For>
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
