import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import { LocationVillageControllerUpsert } from '~/controllers/location/LocationVillageController';
import { LocationSubDistrictControllerList } from '~/controllers/location/LocationSubDistrictController';
import { masterApiShow } from '~/controllers/master/masterApiController';
import { t } from '../../../../../i18n';

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
                toast.danger(t('ad.villageNotFound'));
            }
        } catch (e: any) {
            console.error('Error loading village:', e);
            toast.danger(t('ad.failedToLoadVillageData'));
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
            toast.warning(t('ad.villageNameIsRequired'));
            return;
        }
        if (!code().trim()) {
            toast.warning(t('ad.villageCodeIsRequired'));
            return;
        }
        if (!subDistrictId()) {
            toast.warning(t('ad.subDistrictIsRequired'));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await LocationVillageControllerUpsert({
                id: id(),
                code: code().trim(),
                name: name().trim(),
                sub_district_id: subDistrictId(),
                dikti_code: diktiCode().trim() || null,
            });

            if (!res.is_error) {
                toast.success(res.message || t('ad.villageUpdatedSuccessfully'));
                navigate(`${basePath}/${id()}`);
            } else {
                toast.danger(res.message || t('ad.failedToUpdateVillage'));
            }
        } catch (err: any) {
            toast.danger(err.message || t('ad.networkErrorOccurred'));
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
                            <a href="/" class="shrink-0 hover:text-blue-600 transition-colors">{t('ad.home')}</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">{t('ad.location')}</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="shrink-0 hover:text-blue-600 transition-colors">{t('ad.village')}</a>
                            <span class="shrink-0">/</span>
                            <a href={`${basePath}/${id()}`} class="shrink-0 hover:text-blue-600 transition-colors">{t('ad.detail2')}</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0 font-medium text-neutral-900 dark:text-white">{t('ad.edit')}</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            {t('ad.editVillage')}
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
                            <span>{t('ad.cancel')}</span>
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
                                        {t('ad.villageName')} <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={name()}
                                        onInput={(e) => setName(e.currentTarget.value)}
                                        placeholder={t('ad.eGDago')}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        {t('ad.code2')}
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
                                        {t('ad.subDistrictKecamatan2')}
                                    </label>
                                    <select
                                        value={subDistrictId()}
                                        onChange={(e) => setSubDistrictId(e.currentTarget.value)}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    >
                                        <option value="">{t('ad.selectSubDistrict2')}</option>
                                        <For each={subDistrictOptions()}>
                                            {(s) => <option value={s.value}>{s.label}</option>}
                                        </For>
                                    </select>
                                </div>

                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                        {t('ad.postalCode')}
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
                                        {t('ad.diktiCode2')}
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
                                        {t('ad.epsbedCode')}
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
                                        {t('ad.description')}
                                    </label>
                                    <textarea
                                        rows="3"
                                        value={description()}
                                        onInput={(e) => setDescription(e.currentTarget.value)}
                                        placeholder={t('ad.optionalNotesOrDescription')}
                                        class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                    />
                                </div>
                            </div>

                            <div class="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                                <a
                                    href={`${basePath}/${id()}`}
                                    class="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    {t('ad.cancel')}
                                </a>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors cursor-pointer"
                                >
                                    {isSubmitting() ? t('ad.updating') : t('ad.saveChanges')}
                                </button>
                            </div>
                        </form>
                    </Show>
                </div>
            </div>
        </div>
    );
}
