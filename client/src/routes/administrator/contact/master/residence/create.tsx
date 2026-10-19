import { createSignal, onMount, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import RemoteSearchSelect from '~/components/form/RemoteSearchSelect';
import { CONTACT_OWNER_TYPES, findContactOwnerType, type ContactOwnerOption } from '~/components/form/contactOwnerTypes';
import { masterApiCreate, masterApiOptions, type MasterOptionItem } from '~/controllers/master/masterApiController';
import { t } from '../../../../../i18n';

export default function ContactMasterResidenceCreatePage() {
    const apiPath = 'contact/master/residences';
    const basePath = '/administrator/contact/master/residence';
    const [street, setStreet] = createSignal('');
    const [citizensAssociation, setCitizensAssociation] = createSignal('');
    const [neighborhoodAssociation, setNeighborhoodAssociation] = createSignal('');
    const [residenceTypeId, setResidenceTypeId] = createSignal('');
    const [provinceId, setProvinceId] = createSignal('');
    const [regencyId, setRegencyId] = createSignal('');
    const [subDistrictId, setSubDistrictId] = createSignal('');
    const [villageId, setVillageId] = createSignal('');
    const [latitude, setLatitude] = createSignal('');
    const [longitude, setLongitude] = createSignal('');
    const [zoom, setZoom] = createSignal('');
    const [ownerType, setOwnerType] = createSignal<string>('');
    const [ownerId, setOwnerId] = createSignal('');
    const [ownerLabel, setOwnerLabel] = createSignal('');
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const [residenceTypeOptions, setResidenceTypeOptions] = createSignal<MasterOptionItem[]>([]);
    const [provinceOptions, setProvinceOptions] = createSignal<MasterOptionItem[]>([]);
    const [regencyOptions, setRegencyOptions] = createSignal<MasterOptionItem[]>([]);
    const [subDistrictOptions, setSubDistrictOptions] = createSignal<MasterOptionItem[]>([]);
    const [villageOptions, setVillageOptions] = createSignal<MasterOptionItem[]>([]);

    onMount(async () => {
        const [residenceTypes, provinces] = await Promise.all([
            masterApiOptions('contact/reference/residence-types'),
            masterApiOptions('provinces'),
        ]);
        setResidenceTypeOptions(residenceTypes);
        setProvinceOptions(provinces);
    });

    // Each level reloads its children and clears everything below it
    const selectProvince = async (id: string) => {
        setProvinceId(id);
        setRegencyId('');
        setSubDistrictId('');
        setVillageId('');
        setRegencyOptions([]);
        setSubDistrictOptions([]);
        setVillageOptions([]);
        if (id) setRegencyOptions(await masterApiOptions('regencies', { province_id: id }));
    };

    const selectRegency = async (id: string) => {
        setRegencyId(id);
        setSubDistrictId('');
        setVillageId('');
        setSubDistrictOptions([]);
        setVillageOptions([]);
        if (id) setSubDistrictOptions(await masterApiOptions('sub-districts', { regency_id: id }));
    };

    const selectSubDistrict = async (id: string) => {
        setSubDistrictId(id);
        setVillageId('');
        setVillageOptions([]);
        if (id) setVillageOptions(await masterApiOptions('villages', { sub_district_id: id }));
    };

    const toNumberOrNull = (value: string) => (value.trim() === '' ? null : Number(value));

    // Switching owner type invalidates the previously picked owner
    const selectOwnerType = (value: string) => {
        setOwnerType(value);
        setOwnerId('');
        setOwnerLabel('');
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                street: street().trim(),
                citizens_association: Number(citizensAssociation()),
                neighborhood_association: Number(neighborhoodAssociation()),
                province_id: provinceId() || null,
                regency_id: regencyId() || null,
                sub_district_id: subDistrictId() || null,
                village_id: villageId() || null,
                residence_type_id: residenceTypeId() || null,
                residenceable_id: ownerId() || null,
                residenceable_type: ownerId() ? ownerType() : null,
                latitude: toNumberOrNull(latitude()),
                longitude: toNumberOrNull(longitude()),
                zoom: toNumberOrNull(zoom()),
            });

            if (res.success) {
                toast.success(res.message || t('ad.residenceCreatedSuccessfully'));
                setTimeout(() => {
                    window.location.href = res.data?.id ? `${basePath}/${res.data.id}` : basePath;
                }, 500);
            } else {
                toast.danger(res.message || t('ad.failedToCreateResidence'));
            }
        } catch (err: any) {
            toast.danger(err.message || t('ad.networkErrorOccurred'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const labelClass = 'block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2';
    const inputClass =
        'w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors disabled:opacity-60';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">{t('ad.home')}</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">{t('ad.contact')}</span>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">{t('ad.master')}</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors shrink-0">{t('ad.residence')}</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">{t('ad.create')}</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono truncate">
                            {t('ad.addNewResidence')}
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
                            <span>{t('ad.cancel')}</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 max-w-4xl">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div class="sm:col-span-2">
                                <label class={labelClass}>
                                    {t('ad.street')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={street()}
                                    onInput={(e) => setStreet(e.currentTarget.value)}
                                    placeholder={t('ad.eGJlMerdekaNo10')}
                                    class={inputClass}
                                />
                            </div>

                            <div>
                                <label class={labelClass}>
                                    {t('ad.rtCitizensAssociation')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1"
                                    value={citizensAssociation()}
                                    onInput={(e) => setCitizensAssociation(e.currentTarget.value)}
                                    class={inputClass}
                                />
                            </div>

                            <div>
                                <label class={labelClass}>
                                    {t('ad.rwNeighborhoodAssociation')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1"
                                    value={neighborhoodAssociation()}
                                    onInput={(e) => setNeighborhoodAssociation(e.currentTarget.value)}
                                    class={inputClass}
                                />
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.province')}</label>
                                <select value={provinceId()} onChange={(e) => selectProvince(e.currentTarget.value)} class={inputClass}>
                                    <option value="">{t('ad.selectProvince')}</option>
                                    <For each={provinceOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.regency')}</label>
                                <select value={regencyId()} onChange={(e) => selectRegency(e.currentTarget.value)} disabled={!provinceId()} class={inputClass}>
                                    <option value="">{t('ad.selectRegency')}</option>
                                    <For each={regencyOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.subDistrict')}</label>
                                <select value={subDistrictId()} onChange={(e) => selectSubDistrict(e.currentTarget.value)} disabled={!regencyId()} class={inputClass}>
                                    <option value="">{t('ad.selectSubDistrict')}</option>
                                    <For each={subDistrictOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.village')}</label>
                                <select value={villageId()} onChange={(e) => setVillageId(e.currentTarget.value)} disabled={!subDistrictId()} class={inputClass}>
                                    <option value="">{t('ad.selectVillage')}</option>
                                    <For each={villageOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.residenceType')}</label>
                                <select value={residenceTypeId()} onChange={(e) => setResidenceTypeId(e.currentTarget.value)} class={inputClass}>
                                    <option value="">{t('ad.none')}</option>
                                    <For each={residenceTypeOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>
                                    {t('ad.ownerType')}
                                </label>
                                <select value={ownerType()} onChange={(e) => selectOwnerType(e.currentTarget.value)} class={inputClass}>
                                    <option value="">{t('ad.noOwner')}</option>
                                    <For each={CONTACT_OWNER_TYPES}>{(type) => <option value={type.value}>{type.label}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>
                                    {t('ad.owner')}
                                </label>
                                <Show
                                    when={findContactOwnerType(ownerType())}
                                    keyed
                                    fallback={<input type="text" disabled placeholder={t('ad.selectAnOwnerTypeFirst')} class={inputClass} />}
                                >
                                    {(type) => (
                                        <RemoteSearchSelect<ContactOwnerOption>
                                            apiPath={type.apiPath}
                                            value={ownerId()}
                                            selectedLabel={ownerLabel()}
                                            placeholder={t('ad.searchTypeByName', { type: type.label.toLowerCase() })}
                                            getLabel={(item) => item.name || item.id}
                                            getSublabel={(item) => item.code || ''}
                                            onSelect={(item) => {
                                                setOwnerId(item?.id || '');
                                                setOwnerLabel(item?.name || '');
                                            }}
                                            class={`${inputClass} pr-8`}
                                        />
                                    )}
                                </Show>
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.latitude')}</label>
                                <input
                                    type="number"
                                    step="any"
                                    min="-90"
                                    max="90"
                                    value={latitude()}
                                    onInput={(e) => setLatitude(e.currentTarget.value)}
                                    placeholder="e.g. -6.200000"
                                    class={inputClass}
                                />
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.longitude')}</label>
                                <input
                                    type="number"
                                    step="any"
                                    min="-180"
                                    max="180"
                                    value={longitude()}
                                    onInput={(e) => setLongitude(e.currentTarget.value)}
                                    placeholder="e.g. 106.816666"
                                    class={inputClass}
                                />
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.mapZoom')}</label>
                                <input
                                    type="number"
                                    step="1"
                                    min="0"
                                    max="22"
                                    value={zoom()}
                                    onInput={(e) => setZoom(e.currentTarget.value)}
                                    placeholder="e.g. 15"
                                    class={inputClass}
                                />
                            </div>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <a
                                href={basePath}
                                class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {t('ad.cancel')}
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <span>{isSubmitting() ? t('ad.saving') : t('ad.saveResidence')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
