import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import { LocationVillageControllerUpsert } from '~/controllers/location/LocationVillageController';
import { LocationSubDistrictControllerList } from '~/controllers/location/LocationSubDistrictController';
import { masterApiShow } from '~/controllers/master/masterApiController';

export default function LocationVillageEditPage() {
    const params = useParams();
    const navigate = useNavigate();
    const basePath = '/administrator/location/village';

    const [id, setId] = createSignal((params.id as string) || '');
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [subDistrictId, setSubDistrictId] = createSignal('');
    const [postalCode, setPostalCode] = createSignal('');
    const [diktiCode, setDiktiCode] = createSignal('');
    const [epsbedCode, setEpsbedCode] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [subDistrictOptions, setSubDistrictOptions] = createSignal<ModelSelectItem[]>([]);

    const loadData = async (targetId: string) => {
        if (!targetId || targetId === '[id]') return;
        setIsLoading(true);
        try {
            const [subOptionsRes, vilRes] = await Promise.all([
                LocationSubDistrictControllerList(),
                masterApiShow('villages', targetId),
            ]);

            if (Array.isArray(subOptionsRes.message)) {
                setSubDistrictOptions(subOptionsRes.message);
            }

            if (vilRes.data) {
                const v = vilRes.data;
                setName(v.name || '');
                setCode(v.code || '');
                setSubDistrictId(v.sub_district_id || '');
                setPostalCode(v.postal_code || '');
                setDiktiCode(v.dikti_code || '');
                setEpsbedCode(v.epsbed_code || '');
                setDescription(v.description || '');
            } else {
                toast.danger('Village not found');
            }
        } catch (e: any) {
            console.error('Error loading village:', e);
            toast.danger('Failed to load village data');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        loadData(id());
    });

    createEffect(() => {
        const currentParam = params.id as string;
        if (currentParam && currentParam !== id()) {
            setId(currentParam);
            loadData(currentParam);
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!name().trim()) {
            toast.warning('Village name is required');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await LocationVillageControllerUpsert({
                id: id(),
                code: code().trim() || null,
                name: name().trim(),
                sub_district_id: subDistrictId() || null,
                postal_code: postalCode().trim() || null,
                dikti_code: diktiCode().trim() || null,
                epsbed_code: epsbedCode().trim() || null,
                description: description().trim() || null,
            });

            if (!res.is_error) {
                toast.success(res.message || 'Village updated successfully!');
                navigate(`${basePath}/${id()}`);
            } else {
                toast.danger(res.message || 'Failed to update village.');
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

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6 max-w-3xl">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="shrink-0 hover:text-blue-600 transition-colors">Home</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Location</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="shrink-0 hover:text-blue-600 transition-colors">Village</a>
                            <span class="shrink-0">/</span>
                            <a href={`${basePath}/${id()}`} class="shrink-0 hover:text-blue-600 transition-colors">Detail</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0 font-medium text-neutral-900 dark:text-white">Edit</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Edit Village
                        </h1>
                    </div>

                    <div class="w-full sm:w-auto">
                        <a
                            href={`${basePath}/${id()}`}
                            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span>Cancel</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 max-w-3xl">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="space-y-4 py-8 animate-pulse">
                                <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                            </div>
                        }
                    >
                        <form onSubmit={handleSubmit} class="space-y-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Village Name <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        placeholder="e.g. Dago"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Code
                                    </label>
                                    <input
                                        type="text"
                                        value={code()}
                                        onInput={(e) => setCode(e.currentTarget.value)}
                                        placeholder="e.g. 3273011001"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Sub-District / Kecamatan
                                    </label>
                                    <select
                                        value={subDistrictId()}
                                        onChange={(e) => setSubDistrictId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">Select Sub-District</option>
                                        <For each={subDistrictOptions()}>
                                            {(s) => <option value={s.value}>{s.label}</option>}
                                        </For>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Postal Code
                                    </label>
                                    <input
                                        type="text"
                                        value={postalCode()}
                                        onInput={(e) => setPostalCode(e.currentTarget.value)}
                                        placeholder="e.g. 40135"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        DIKTI Code
                                    </label>
                                    <input
                                        type="text"
                                        value={diktiCode()}
                                        onInput={(e) => setDiktiCode(e.currentTarget.value)}
                                        placeholder="e.g. 01010101"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        EPSBED Code
                                    </label>
                                    <input
                                        type="text"
                                        value={epsbedCode()}
                                        onInput={(e) => setEpsbedCode(e.currentTarget.value)}
                                        placeholder="e.g. 01"
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div class="sm:col-span-2">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        Description
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={description()}
                                        onInput={(e) => setDescription(e.currentTarget.value)}
                                        placeholder="Optional notes or description..."
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>
                            </div>

                            <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <a
                                    href={`${basePath}/${id()}`}
                                    class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    {isSubmitting() ? 'Updating...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </Show>
                </div>
            </div>
        </div>
    );
}
