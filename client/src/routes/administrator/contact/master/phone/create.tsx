import { createSignal, onMount, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import RemoteSearchSelect from '~/components/form/RemoteSearchSelect';
import { CONTACT_OWNER_TYPES, findContactOwnerType, type ContactOwnerOption } from '~/components/form/contactOwnerTypes';
import { masterApiCreate, masterApiOptions, type MasterOptionItem } from '~/controllers/master/masterApiController';
import { t } from '../../../../../i18n';

export default function ContactMasterPhoneCreatePage() {
    const apiPath = 'contact/master/phones';
    const basePath = '/administrator/contact/master/phone';
    const [phoneNumber, setPhoneNumber] = createSignal('');
    const [phoneTypeId, setPhoneTypeId] = createSignal('');
    const [ownerType, setOwnerType] = createSignal<string>(CONTACT_OWNER_TYPES[0].value);
    const [ownerId, setOwnerId] = createSignal('');
    const [ownerLabel, setOwnerLabel] = createSignal('');
    const [phoneTypeOptions, setPhoneTypeOptions] = createSignal<MasterOptionItem[]>([]);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    onMount(async () => {
        setPhoneTypeOptions(await masterApiOptions('contact/reference/phone-types'));
    });

    // Switching owner type invalidates the previously picked owner
    const selectOwnerType = (value: string) => {
        setOwnerType(value);
        setOwnerId('');
        setOwnerLabel('');
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!ownerId()) {
            toast.danger(t('ad.pleaseSelectTheOwnerOfThis2'));
            return;
        }
        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                phone_number: phoneNumber().trim(),
                phone_type_id: phoneTypeId() || null,
                phoneable_id: ownerId(),
                phoneable_type: ownerType(),
            });

            if (res.success) {
                toast.success(res.message || t('ad.phoneCreatedSuccessfully'));
                setTimeout(() => {
                    window.location.href = res.data?.id ? `${basePath}/${res.data.id}` : basePath;
                }, 500);
            } else {
                toast.danger(res.message || t('ad.failedToCreatePhone'));
            }
        } catch (err: any) {
            toast.danger(err.message || t('ad.networkErrorOccurred'));
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
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">{t('ad.home')}</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">{t('ad.contact')}</span>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">{t('ad.master')}</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors shrink-0">{t('ad.phone')}</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">{t('ad.create')}</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono truncate">
                            {t('ad.addNewPhone')}
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

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 max-w-3xl">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div>
                                <label class={labelClass}>
                                    {t('ad.phoneNumber')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    required
                                    value={phoneNumber()}
                                    onInput={(e) => setPhoneNumber(e.currentTarget.value)}
                                    placeholder="e.g. 081234567890"
                                    class={inputClass}
                                />
                            </div>

                            <div>
                                <label class={labelClass}>{t('ad.phoneType')}</label>
                                <select value={phoneTypeId()} onChange={(e) => setPhoneTypeId(e.currentTarget.value)} class={inputClass}>
                                    <option value="">{t('ad.none')}</option>
                                    <For each={phoneTypeOptions()}>{(opt) => <option value={opt.id}>{opt.name}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>
                                    {t('ad.ownerType')} <span class="text-red-500">*</span>
                                </label>
                                <select value={ownerType()} onChange={(e) => selectOwnerType(e.currentTarget.value)} class={inputClass}>
                                    <For each={CONTACT_OWNER_TYPES}>{(type) => <option value={type.value}>{type.label}</option>}</For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>
                                    {t('ad.owner')} <span class="text-red-500">*</span>
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
                                            required
                                            class={`${inputClass} pr-8`}
                                        />
                                    )}
                                </Show>
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
                                <span>{isSubmitting() ? t('ad.saving') : t('ad.savePhone')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
