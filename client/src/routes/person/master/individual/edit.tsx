import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { PersonMasterIndividual, PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { initialPersonMasterIndividual } from '~/models/person/master/Individual';
import {
    PersonMasterIndividualControllerShow,
    PersonMasterIndividualControllerUpsert,
} from '~/controllers/person/master/PersonMasterIndividualController';
import { PersonReferenceControllerGenderList } from '~/controllers/person/reference/PersonReferenceGenderController';
import { PersonReferenceControllerReligionList } from '~/controllers/person/reference/PersonReferenceReligionController';
import { PersonReferenceControllerIdentificationTypeList } from '~/controllers/person/reference/PersonReferenceIdentificationTypeController';
import { PersonReferenceControllerMaritalStatusList } from '~/controllers/person/reference/PersonReferenceMaritalStatusController';
import { PersonReferenceControllerOccupationList } from '~/controllers/person/reference/PersonReferenceOccupationController';
import { PersonReferenceControllerProfessionList } from '~/controllers/person/reference/PersonReferenceProfessionController';
import { PersonReferenceControllerIncomeList } from '~/controllers/person/reference/PersonReferenceIncomeController';
import { PersonReferenceControllerAgeClassificationList } from '~/controllers/person/reference/PersonReferenceAgeClassificationController';
import { LiterateEducationControllerList } from '~/controllers/literate/LiterateEducationController';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';

export default function PersonMasterIndividualEditPage() {
    const [searchParams] = useSearchParams();
    const individualId = () => (searchParams.id as string) || '';

    const [formData, setFormData] = createSignal<PersonMasterIndividual>({ ...initialPersonMasterIndividual });
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [errors, setErrors] = createSignal<Record<string, string>>({});

    // Reference dropdown options
    const [genderOptions, setGenderOptions] = createSignal<ModelSelectItem[]>([]);
    const [religionOptions, setReligionOptions] = createSignal<ModelSelectItem[]>([]);
    const [identificationTypeOptions, setIdentificationTypeOptions] = createSignal<ModelSelectItem[]>([]);
    const [maritalStatusOptions, setMaritalStatusOptions] = createSignal<ModelSelectItem[]>([]);
    const [occupationOptions, setOccupationOptions] = createSignal<ModelSelectItem[]>([]);
    const [professionOptions, setProfessionOptions] = createSignal<ModelSelectItem[]>([]);
    const [incomeOptions, setIncomeOptions] = createSignal<ModelSelectItem[]>([]);
    const [ageClassificationOptions, setAgeClassificationOptions] = createSignal<ModelSelectItem[]>([]);
    const [educationOptions, setEducationOptions] = createSignal<ModelSelectItem[]>([]);

    // Fetch individual record details
    const fetchIndividual = async (id: string) => {
        if (!id || id === '' || id === '00000000-0000-0000-0000-000000000000') {
            setIsLoading(false);
            setIndividualData(null);
            return;
        }

        setIsLoading(true);
        try {
            const res = await PersonMasterIndividualControllerShow(id);
            if (!res.is_error && res.data && res.data.individual) {
                setIndividualData(res.data);
                const ind = res.data.individual;
                setFormData({
                    ...initialPersonMasterIndividual,
                    ...ind,
                    code: ind.code || '',
                    name: ind.name || '',
                    front_title: ind.front_title || '',
                    last_title: ind.last_title || '',
                    birth_place: ind.birth_place || '',
                    birth_date: ind.birth_date ? ind.birth_date.split('T')[0] : '',
                    gender_id: ind.gender_id || '00000000-0000-0000-0000-000000000000',
                    religion_id: ind.religion_id || '00000000-0000-0000-0000-000000000000',
                    identification_type_id: ind.identification_type_id || '3d59fc95-b07d-46ad-95ff-206b7e7f253f',
                    marital_status_id: ind.marital_status_id || '00000000-0000-0000-0000-000000000000',
                    occupation_id: ind.occupation_id || '',
                    profession_id: ind.profession_id || '00000000-0000-0000-0000-000000000000',
                    income_id: ind.income_id || '00000000-0000-0000-0000-000000000000',
                    education_id: ind.education_id || '',
                    age_classification_id: ind.age_classification_id || '',
                    is_special_need: Boolean(ind.is_special_need),
                    is_social_protection_card_recipient: Boolean(ind.is_social_protection_card_recipient),
                    is_deceased: Boolean(ind.is_deceased),
                });
            } else {
                setIndividualData(null);
                toast.danger(res.message || 'Individual record not found on server.');
            }
        } catch (err: any) {
            console.error('Failed to load individual details:', err);
            setIndividualData(null);
            toast.danger('Error connecting to server to load individual.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(async () => {
        try {
            const [
                genders,
                religions,
                idTypes,
                maritalStatuses,
                occupations,
                professions,
                incomes,
                ageClasses,
                educations,
            ] = await Promise.all([
                PersonReferenceControllerGenderList(),
                PersonReferenceControllerReligionList(),
                PersonReferenceControllerIdentificationTypeList(),
                PersonReferenceControllerMaritalStatusList(),
                PersonReferenceControllerOccupationList(),
                PersonReferenceControllerProfessionList(),
                PersonReferenceControllerIncomeList(),
                PersonReferenceControllerAgeClassificationList(),
                LiterateEducationControllerList(),
            ]);

            if (Array.isArray(genders.message)) setGenderOptions(genders.message);
            if (Array.isArray(religions.message)) setReligionOptions(religions.message);
            if (Array.isArray(idTypes.message)) setIdentificationTypeOptions(idTypes.message);
            if (Array.isArray(maritalStatuses.message)) setMaritalStatusOptions(maritalStatuses.message);
            if (Array.isArray(occupations.message)) setOccupationOptions(occupations.message);
            if (Array.isArray(professions.message)) setProfessionOptions(professions.message);
            if (Array.isArray(incomes.message)) setIncomeOptions(incomes.message);
            if (Array.isArray(ageClasses.message)) setAgeClassificationOptions(ageClasses.message);
            if (Array.isArray(educations.message)) setEducationOptions(educations.message);
        } catch (err) {
            console.error('Failed to load reference dropdown options:', err);
        }
    });

    createEffect(() => {
        const id = individualId();
        if (id) {
            fetchIndividual(id);
        } else {
            setIsLoading(false);
            setIndividualData(null);
        }
    });

    const updateField = (field: keyof PersonMasterIndividual, value: any) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
        if (errors()[field]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const current = formData();

        if (!current.code || current.code.trim() === '') {
            newErrors.code = 'Civil ID / NIK is required.';
        }
        if (!current.name || current.name.trim() === '') {
            newErrors.name = 'Full Name is required.';
        }
        if (!current.birth_date || current.birth_date.trim() === '') {
            newErrors.birth_date = 'Birth Date is required.';
        }
        if (!current.birth_place || current.birth_place.trim() === '') {
            newErrors.birth_place = 'Birth Place is required.';
        }
        if (!current.gender_id || current.gender_id === '00000000-0000-0000-0000-000000000000') {
            newErrors.gender_id = 'Please select a gender.';
        }
        if (!current.religion_id || current.religion_id === '00000000-0000-0000-0000-000000000000') {
            newErrors.religion_id = 'Please select a religion.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        if (!validateForm()) {
            toast.danger('Please fill all required fields properly.');
            return;
        }

        const id = individualId();
        if (!id) {
            toast.danger('Missing individual ID.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload: Partial<PersonMasterIndividual> = {
                ...formData(),
                id,
                front_title: formData().front_title?.trim() || null,
                last_title: formData().last_title?.trim() || null,
                age_classification_id:
                    formData().age_classification_id === '00000000-0000-0000-0000-000000000000' || !formData().age_classification_id
                        ? null
                        : formData().age_classification_id,
                education_id:
                    formData().education_id === '00000000-0000-0000-0000-000000000000' || !formData().education_id
                        ? null
                        : formData().education_id,
                occupation_id:
                    formData().occupation_id === '00000000-0000-0000-0000-000000000000' || !formData().occupation_id
                        ? null
                        : formData().occupation_id,
                profession_id:
                    formData().profession_id === '00000000-0000-0000-0000-000000000000' || !formData().profession_id
                        ? '00000000-0000-0000-0000-000000000000'
                        : formData().profession_id,
                income_id:
                    formData().income_id === '00000000-0000-0000-0000-000000000000' || !formData().income_id
                        ? '00000000-0000-0000-0000-000000000000'
                        : formData().income_id,
                marital_status_id:
                    formData().marital_status_id === '00000000-0000-0000-0000-000000000000' || !formData().marital_status_id
                        ? '00000000-0000-0000-0000-000000000000'
                        : formData().marital_status_id,
                identification_type_id:
                    formData().identification_type_id === '00000000-0000-0000-0000-000000000000' || !formData().identification_type_id
                        ? '3d59fc95-b07d-46ad-95ff-206b7e7f253f'
                        : formData().identification_type_id,
            };

            const res = await PersonMasterIndividualControllerUpsert(payload);
            if (!res.is_error) {
                toast.success('Individual profile updated successfully!');
                window.location.href = `/person/master/individual/show?id=${id}`;
            } else {
                toast.danger(res.message || 'Failed to update individual profile.');
                if (res.errors) {
                    setErrors((prev) => ({ ...prev, ...res.errors }));
                }
            }
        } catch (err: any) {
            toast.danger(err.message || 'An unexpected error occurred while updating.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateAge = () => {
        const bd = formData().birth_date;
        if (!bd) return null;
        const birth = new Date(bd);
        if (isNaN(birth.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 0 ? age : null;
    };

    const formattedFullNamePreview = () => {
        const f = formData();
        return [f.front_title, f.name, f.last_title].filter(Boolean).join(' ') || f.name || 'Individual Full Name';
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header & Breadcrumbs */}
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4 sm:flex sm:items-center sm:justify-between">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Person</span>
                            <span>/</span>
                            <a href="/person/master/individual" class="hover:text-blue-600 transition-colors">Master Individual</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Edit Individual</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Edit Individual Profile
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Update civil registration records, demographics, and personal profile attributes.
                        </p>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <Show when={individualId()}>
                            <a
                                href={`/person/master/individual/show?id=${individualId()}`}
                                class="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors cursor-pointer"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                    <circle cx="12" cy="12" r="3" />
                                </svg>
                                <span>View Profile</span>
                            </a>
                        </Show>
                        <a
                            href="/person/master/individual"
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to Directory</span>
                        </a>
                    </div>
                </div>

                {/* Main Content Area */}
                <Show
                    when={!isLoading()}
                    fallback={
                        <div class="p-12 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                            <div class="inline-flex items-center justify-center p-4">
                                <svg class="animate-spin size-8 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            </div>
                            <p class="text-sm font-medium text-neutral-600 dark:text-neutral-300 mt-2">Loading individual profile data...</p>
                        </div>
                    }
                >
                    <Show
                        when={individualData() !== null}
                        fallback={
                            <div class="p-12 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center">
                                <svg class="size-12 text-neutral-400 mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                <h2 class="text-base font-bold text-neutral-900 dark:text-white">Individual Record Not Found</h2>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto mt-1 mb-6">
                                    The individual ID provided does not exist or has been removed from the master database.
                                </p>
                                <a
                                    href="/person/master/individual"
                                    class="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    Return to Master Directory
                                </a>
                            </div>
                        }
                    >
                        <form onSubmit={handleSubmit} class="space-y-6">
                            {/* Live Header Info Banner */}
                            <div class="p-4 bg-white dark:bg-neutral-800 border-l-4 border-l-blue-600 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                <div class="flex items-center gap-3">
                                    <div class="size-12 bg-neutral-100 dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 overflow-hidden flex items-center justify-center shrink-0">
                                        <img
                                            src="/images/Portrait_Placeholder.png"
                                            alt="Thumbnail"
                                            class="w-full h-full object-cover object-top"
                                        />
                                    </div>
                                    <div>
                                        <div class="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                                            Editing Individual Record
                                        </div>
                                        <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                            {formattedFullNamePreview()}
                                        </h3>
                                        <div class="text-xs font-mono text-neutral-500 dark:text-neutral-400 flex items-center gap-2 mt-0.5">
                                            <span>NIK: {formData().code || '—'}</span>
                                            <span>•</span>
                                            <span>{formData().birth_place || 'Birth place'}, {formData().birth_date || 'YYYY-MM-DD'}</span>
                                            <Show when={calculateAge() !== null}>
                                                <span class="px-1.5 py-0.2 text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold rounded-none">
                                                    {calculateAge()} yrs
                                                </span>
                                            </Show>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2 self-start sm:self-center">
                                    <Show when={formData().is_special_need}>
                                        <span class="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                            Special Need
                                        </span>
                                    </Show>
                                    <Show when={formData().is_social_protection_card_recipient}>
                                        <span class="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                            KPS Recipient
                                        </span>
                                    </Show>
                                    <Show when={formData().is_deceased}>
                                        <span class="px-2 py-0.5 text-[11px] font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                            Deceased
                                        </span>
                                    </Show>
                                </div>
                            </div>

                            {/* SECTION 1: Identity & Primary Demographics */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="20" height="14" x="2" y="5" rx="2" />
                                            <line x1="2" x2="22" y1="10" y2="10" />
                                        </svg>
                                        <span>1. Civil Identity & Basic Demographics</span>
                                    </h2>
                                    <span class="text-xs text-neutral-500 dark:text-neutral-400">* Required fields</span>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Code / NIK */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Civil ID / NIK / Code <span class="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().code ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-blue-500'
                                                } text-neutral-900 dark:text-white rounded-none transition-colors`}
                                            value={formData().code}
                                            onInput={(e) => updateField('code', (e.target as HTMLInputElement).value)}
                                            required
                                        />
                                        <Show when={errors().code}>
                                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors().code}</p>
                                        </Show>
                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                            Official National Identification Number (NIK).
                                        </p>
                                    </div>

                                    {/* Identification Type */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Identification Type <span class="text-red-500">*</span>
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().identification_type_id}
                                            onChange={(e) => updateField('identification_type_id', (e.target as HTMLSelectElement).value)}
                                        >
                                            <For each={identificationTypeOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>

                                    {/* Full Name */}
                                    <div class="md:col-span-2">
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Full Name <span class="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().name ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-blue-500'
                                                } text-neutral-900 dark:text-white rounded-none transition-colors`}
                                            value={formData().name}
                                            onInput={(e) => updateField('name', (e.target as HTMLInputElement).value)}
                                            required
                                        />
                                        <Show when={errors().name}>
                                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors().name}</p>
                                        </Show>
                                    </div>

                                    {/* Front Title */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Front Academic Title
                                        </label>
                                        <input
                                            type="text"
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. Dr., Prof., Ir., Drs."
                                            value={formData().front_title || ''}
                                            onInput={(e) => updateField('front_title', (e.target as HTMLInputElement).value)}
                                        />
                                    </div>

                                    {/* Last Title */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Last Academic Title
                                        </label>
                                        <input
                                            type="text"
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="e.g. S.Kom., M.T., Ph.D."
                                            value={formData().last_title || ''}
                                            onInput={(e) => updateField('last_title', (e.target as HTMLInputElement).value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: Birth, Gender, Religion & Civil Status */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 6v6l4 2" />
                                        </svg>
                                        <span>2. Birth, Gender & Civil Status</span>
                                    </h2>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Birth Place */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Place of Birth <span class="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().birth_place ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-blue-500'
                                                } text-neutral-900 dark:text-white rounded-none transition-colors`}
                                            value={formData().birth_place}
                                            onInput={(e) => updateField('birth_place', (e.target as HTMLInputElement).value)}
                                            required
                                        />
                                        <Show when={errors().birth_place}>
                                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors().birth_place}</p>
                                        </Show>
                                    </div>

                                    {/* Birth Date */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Date of Birth <span class="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="date"
                                            class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().birth_date ? 'border-red-500 focus:ring-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-blue-500'
                                                } text-neutral-900 dark:text-white rounded-none transition-colors`}
                                            value={formData().birth_date}
                                            onInput={(e) => updateField('birth_date', (e.target as HTMLInputElement).value)}
                                            required
                                        />
                                        <Show when={errors().birth_date}>
                                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors().birth_date}</p>
                                        </Show>
                                    </div>

                                    {/* Gender */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Gender <span class="text-red-500">*</span>
                                        </label>
                                        <select
                                            class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().gender_id ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                                                } text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500`}
                                            value={formData().gender_id}
                                            onChange={(e) => updateField('gender_id', (e.target as HTMLSelectElement).value)}
                                            required
                                        >
                                            <option value="00000000-0000-0000-0000-000000000000">-- Select Gender --</option>
                                            <For each={genderOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                        <Show when={errors().gender_id}>
                                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors().gender_id}</p>
                                        </Show>
                                    </div>

                                    {/* Religion */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Religion <span class="text-red-500">*</span>
                                        </label>
                                        <select
                                            class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().religion_id ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'
                                                } text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500`}
                                            value={formData().religion_id}
                                            onChange={(e) => updateField('religion_id', (e.target as HTMLSelectElement).value)}
                                            required
                                        >
                                            <option value="00000000-0000-0000-0000-000000000000">-- Select Religion --</option>
                                            <For each={religionOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                        <Show when={errors().religion_id}>
                                            <p class="text-xs text-red-600 dark:text-red-400 mt-1">{errors().religion_id}</p>
                                        </Show>
                                    </div>

                                    {/* Marital Status */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Marital Status
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().marital_status_id}
                                            onChange={(e) => updateField('marital_status_id', (e.target as HTMLSelectElement).value)}
                                        >
                                            <option value="00000000-0000-0000-0000-000000000000">-- Select Marital Status --</option>
                                            <For each={maritalStatusOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>

                                    {/* Age Classification */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Age Classification
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().age_classification_id || ''}
                                            onChange={(e) => updateField('age_classification_id', (e.target as HTMLSelectElement).value || null)}
                                        >
                                            <option value="">-- Auto / Select Classification --</option>
                                            <For each={ageClassificationOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: Socio-Economic & Profession */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                        </svg>
                                        <span>3. Socio-Economic & Education</span>
                                    </h2>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Occupation */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Occupation
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().occupation_id || ''}
                                            onChange={(e) => updateField('occupation_id', (e.target as HTMLSelectElement).value || null)}
                                        >
                                            <option value="">-- Select Occupation --</option>
                                            <For each={occupationOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>

                                    {/* Profession */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Profession
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().profession_id}
                                            onChange={(e) => updateField('profession_id', (e.target as HTMLSelectElement).value)}
                                        >
                                            <option value="00000000-0000-0000-0000-000000000000">-- Select Profession --</option>
                                            <For each={professionOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>

                                    {/* Income Level */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Income Bracket
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().income_id}
                                            onChange={(e) => updateField('income_id', (e.target as HTMLSelectElement).value)}
                                        >
                                            <option value="00000000-0000-0000-0000-000000000000">-- Select Income Range --</option>
                                            <For each={incomeOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>

                                    {/* Education Level */}
                                    <div>
                                        <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                            Highest Education Level
                                        </label>
                                        <select
                                            class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                            value={formData().education_id || ''}
                                            onChange={(e) => updateField('education_id', (e.target as HTMLSelectElement).value || null)}
                                        >
                                            <option value="">-- Select Education Level --</option>
                                            <For each={educationOptions()}>
                                                {(opt) => <option value={opt.id}>{opt.label}</option>}
                                            </For>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 4: Special Status Flags */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                        </svg>
                                        <span>4. Special Needs & Protection Status</span>
                                    </h2>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Special Need Toggle */}
                                    <label class="relative flex items-start gap-3 p-3.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            class="size-4 mt-0.5 text-blue-600 border-neutral-300 rounded-none focus:ring-blue-500"
                                            checked={formData().is_special_need}
                                            onChange={(e) => updateField('is_special_need', (e.target as HTMLInputElement).checked)}
                                        />
                                        <div>
                                            <span class="block text-xs font-bold text-neutral-900 dark:text-white">Special Needs</span>
                                            <span class="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Check if individual requires disability accommodation.
                                            </span>
                                        </div>
                                    </label>

                                    {/* Social Protection Card Recipient */}
                                    <label class="relative flex items-start gap-3 p-3.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            class="size-4 mt-0.5 text-blue-600 border-neutral-300 rounded-none focus:ring-blue-500"
                                            checked={formData().is_social_protection_card_recipient}
                                            onChange={(e) => updateField('is_social_protection_card_recipient', (e.target as HTMLInputElement).checked)}
                                        />
                                        <div>
                                            <span class="block text-xs font-bold text-neutral-900 dark:text-white">KPS / Social Protection</span>
                                            <span class="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Recipient of government assistance or smart cards.
                                            </span>
                                        </div>
                                    </label>

                                    {/* Deceased */}
                                    <label class="relative flex items-start gap-3 p-3.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            class="size-4 mt-0.5 text-red-600 border-neutral-300 rounded-none focus:ring-red-500"
                                            checked={formData().is_deceased}
                                            onChange={(e) => updateField('is_deceased', (e.target as HTMLInputElement).checked)}
                                        />
                                        <div>
                                            <span class="block text-xs font-bold text-neutral-900 dark:text-white">Deceased Status</span>
                                            <span class="block text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                Check if this individual record is marked as deceased.
                                            </span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                                <a
                                    href={`/person/master/individual/show?id=${individualId()}`}
                                    class="px-5 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-none shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                                    id="btn-update-individual"
                                >
                                    <Show
                                        when={isSubmitting()}
                                        fallback={
                                            <>
                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                                                    <polyline points="17 21 17 13 7 13 7 21" />
                                                    <polyline points="7 3 7 8 15 8" />
                                                </svg>
                                                <span>Save Changes</span>
                                            </>
                                        }
                                    >
                                        <svg class="animate-spin size-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Saving Changes...</span>
                                    </Show>
                                </button>
                            </div>
                        </form>
                    </Show>
                </Show>
            </div>
        </div>
    );
}
