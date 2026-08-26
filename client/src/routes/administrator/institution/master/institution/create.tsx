import { createSignal, onMount, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import {
    InstitutionMasterInstitutionControllerCreate,
    InstitutionMasterInstitutionControllerList,
    fetchInstitutionVarietyOptions,
    fetchInstitutionCategoryOptions,
    fetchCountryOptions,
    fetchAcademicYearOptions,
} from '~/controllers/institution/master/InstitutionMasterInstitutionController';

export default function InstitutionMasterInstitutionCreatePage() {
    const [formData, setFormData] = createSignal({
        name: '',
        code: '',
        alphabet_code: '',
        is_active: true,
        variety_id: '',
        category_id: '',
        country_id: '',
        parent_id: '',
        feeder_id: '',
        academic_year_id: '',
    });

    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [isLoadingReferences, setIsLoadingReferences] = createSignal(true);
    const [errors, setErrors] = createSignal<Record<string, string>>({});

    // Reference options
    const [varietyOptions, setVarietyOptions] = createSignal<ModelSelectItem[]>([]);
    const [categoryOptions, setCategoryOptions] = createSignal<ModelSelectItem[]>([]);
    const [countryOptions, setCountryOptions] = createSignal<ModelSelectItem[]>([]);
    const [parentOptions, setParentOptions] = createSignal<ModelSelectItem[]>([]);
    const [academicYearOptions, setAcademicYearOptions] = createSignal<ModelSelectItem[]>([]);

    onMount(async () => {
        setIsLoadingReferences(true);
        try {
            const [varieties, categories, countries, parents, academicYears] = await Promise.all([
                fetchInstitutionVarietyOptions(),
                fetchInstitutionCategoryOptions(),
                fetchCountryOptions(),
                InstitutionMasterInstitutionControllerList(),
                fetchAcademicYearOptions(),
            ]);

            setVarietyOptions(varieties);
            setCategoryOptions(categories);
            setCountryOptions(countries);
            setParentOptions(parents);
            setAcademicYearOptions(academicYears);

            // Set defaults if available
            if (varieties.length > 0 && !formData().variety_id) {
                setFormData((prev) => ({ ...prev, variety_id: varieties[0].id }));
            }
            if (categories.length > 0 && !formData().category_id) {
                setFormData((prev) => ({ ...prev, category_id: categories[0].id }));
            }
            if (countries.length > 0 && !formData().country_id) {
                // Look for Indonesia as default or first
                const defaultCountry = countries.find((c) => c.label?.toLowerCase().includes('indonesia')) || countries[0];
                setFormData((prev) => ({ ...prev, country_id: defaultCountry.id }));
            }
        } catch (err) {
            console.error('Failed to load institution reference options:', err);
            toast.danger('Failed to load some reference options.');
        } finally {
            setIsLoadingReferences(false);
        }
    });

    const updateField = (field: string, value: any) => {
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

        if (!current.name || current.name.trim() === '') {
            newErrors.name = 'Institution Name is required.';
        }
        if (!current.code || current.code.trim() === '') {
            newErrors.code = 'Institution Code is required.';
        }
        if (!current.variety_id) {
            newErrors.variety_id = 'Please select a variety.';
        }
        if (!current.category_id) {
            newErrors.category_id = 'Please select a category.';
        }
        if (!current.country_id) {
            newErrors.country_id = 'Please select a country.';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();

        if (!validateForm()) {
            toast.danger('Please fill out all required fields marked in red.');
            return;
        }

        setIsSubmitting(true);
        try {
            const current = formData();
            const payload: any = {
                name: current.name.trim(),
                code: current.code.trim(),
                alphabet_code: current.alphabet_code ? current.alphabet_code.trim() : null,
                is_active: current.is_active,
                variety_id: current.variety_id,
                category_id: current.category_id,
                country_id: current.country_id,
                parent_id: current.parent_id && current.parent_id !== '' && current.parent_id !== '00000000-0000-0000-0000-000000000000' ? current.parent_id : null,
                feeder_id: current.feeder_id && current.feeder_id !== '' && current.feeder_id !== '00000000-0000-0000-0000-000000000000' ? current.feeder_id : null,
                academic_year_id: current.academic_year_id && current.academic_year_id !== '' && current.academic_year_id !== '00000000-0000-0000-0000-000000000000' ? current.academic_year_id : null,
            };

            const res = await InstitutionMasterInstitutionControllerCreate(payload);

            if (!res.is_error) {
                toast.success(res.message || 'Institution created successfully!');
                setTimeout(() => {
                    window.location.href = '/institution/master/institution';
                }, 1000);
            } else {
                toast.danger(res.message || 'Failed to create institution record.');
                if (res.errors) {
                    const serverErrors: Record<string, string> = {};
                    Object.entries(res.errors).forEach(([k, v]) => {
                        serverErrors[k] = Array.isArray(v) ? v.join(', ') : String(v);
                    });
                    setErrors(serverErrors);
                }
            }
        } catch (err: any) {
            console.error('Error submitting create institution form:', err);
            toast.danger(err.message || 'Network error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 pb-12">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header with Breadcrumbs */}
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                        <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                        <span>/</span>
                        <span>Institution</span>
                        <span>/</span>
                        <a href="/institution/master/institution" class="hover:text-blue-600 transition-colors">Master Institution</a>
                        <span>/</span>
                        <span class="font-medium text-neutral-900 dark:text-white">Create</span>
                    </nav>
                    <div class="flex items-center justify-between">
                        <div>
                            <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white">
                                Create New Institution
                            </h1>
                            <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                                Register a new institution entity with classification and affiliation details.
                            </p>
                        </div>
                        <a
                            href="/institution/master/institution"
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            Cancel
                        </a>
                    </div>
                </div>

                <Show when={isLoadingReferences()}>
                    <div class="p-8 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 space-y-2">
                        <div class="animate-spin size-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        <p class="text-xs text-neutral-500">Loading form reference data...</p>
                    </div>
                </Show>

                <Show when={!isLoadingReferences()}>
                    <form onSubmit={handleSubmit} class="space-y-6">
                        {/* Section 1: Basic Information */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                            <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                    <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 21h18" />
                                        <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
                                        <path d="M5 21V10.85" />
                                        <path d="M19 21V10.85" />
                                        <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                                    </svg>
                                    <span>1. Basic Details</span>
                                </h2>
                            </div>

                            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div class="md:col-span-2">
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Institution Name <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().name ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-blue-500 focus:border-blue-500'} text-neutral-900 dark:text-white rounded-none`}
                                        placeholder="e.g. Institut Teknologi dan Kesehatan Tri Tunas Nasional"
                                        value={formData().name}
                                        onInput={(e) => updateField('name', (e.target as HTMLInputElement).value)}
                                        required
                                    />
                                    <Show when={errors().name}>
                                        <p class="text-xs text-red-500 mt-1">{errors().name}</p>
                                    </Show>
                                </div>

                                {/* Code */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Institution Code <span class="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        class={`block w-full p-2.5 text-xs sm:text-sm font-mono bg-white dark:bg-neutral-900 border ${errors().code ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-neutral-300 dark:border-neutral-700 focus:ring-blue-500 focus:border-blue-500'} text-neutral-900 dark:text-white rounded-none`}
                                        placeholder="e.g. 092010"
                                        value={formData().code}
                                        onInput={(e) => updateField('code', (e.target as HTMLInputElement).value)}
                                        required
                                    />
                                    <Show when={errors().code}>
                                        <p class="text-xs text-red-500 mt-1">{errors().code}</p>
                                    </Show>
                                </div>

                                {/* Alphabet Code */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Alphabet Code / Acronym
                                    </label>
                                    <input
                                        type="text"
                                        class="block w-full p-2.5 text-xs sm:text-sm font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="e.g. ITEKES TTN"
                                        value={formData().alphabet_code}
                                        onInput={(e) => updateField('alphabet_code', (e.target as HTMLInputElement).value)}
                                    />
                                </div>

                                {/* Active Toggle */}
                                <div class="md:col-span-2">
                                    <label class="relative flex items-center gap-3 p-3.5 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            class="size-4 text-blue-600 border-neutral-300 rounded-none focus:ring-blue-500"
                                            checked={formData().is_active}
                                            onChange={(e) => updateField('is_active', (e.target as HTMLInputElement).checked)}
                                        />
                                        <div>
                                            <span class="text-xs font-semibold uppercase tracking-wider text-neutral-900 dark:text-white">Operational Status</span>
                                            <p class="text-xs text-neutral-500">Institution is currently active and operating</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Classifications & Relations */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                            <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                    <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                        <circle cx="9" cy="7" r="4" />
                                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                    </svg>
                                    <span>2. Classification & Hierarchy</span>
                                </h2>
                            </div>

                            <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Variety */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Variety <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().variety_id ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'} text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500`}
                                        value={formData().variety_id}
                                        onChange={(e) => updateField('variety_id', (e.target as HTMLSelectElement).value)}
                                        required
                                    >
                                        <option value="">-- Select Variety --</option>
                                        <For each={varietyOptions()}>
                                            {(opt) => <option value={opt.id}>{opt.label}</option>}
                                        </For>
                                    </select>
                                    <Show when={errors().variety_id}>
                                        <p class="text-xs text-red-500 mt-1">{errors().variety_id}</p>
                                    </Show>
                                </div>

                                {/* Category */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Category <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().category_id ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'} text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500`}
                                        value={formData().category_id}
                                        onChange={(e) => updateField('category_id', (e.target as HTMLSelectElement).value)}
                                        required
                                    >
                                        <option value="">-- Select Category --</option>
                                        <For each={categoryOptions()}>
                                            {(opt) => <option value={opt.id}>{opt.label}</option>}
                                        </For>
                                    </select>
                                    <Show when={errors().category_id}>
                                        <p class="text-xs text-red-500 mt-1">{errors().category_id}</p>
                                    </Show>
                                </div>

                                {/* Country */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Country <span class="text-red-500">*</span>
                                    </label>
                                    <select
                                        class={`block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border ${errors().country_id ? 'border-red-500' : 'border-neutral-300 dark:border-neutral-700'} text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500`}
                                        value={formData().country_id}
                                        onChange={(e) => updateField('country_id', (e.target as HTMLSelectElement).value)}
                                        required
                                    >
                                        <option value="">-- Select Country --</option>
                                        <For each={countryOptions()}>
                                            {(opt) => <option value={opt.id}>{opt.label}</option>}
                                        </For>
                                    </select>
                                    <Show when={errors().country_id}>
                                        <p class="text-xs text-red-500 mt-1">{errors().country_id}</p>
                                    </Show>
                                </div>

                                {/* Parent Institution */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Parent Institution (Optional)
                                    </label>
                                    <select
                                        class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData().parent_id}
                                        onChange={(e) => updateField('parent_id', (e.target as HTMLSelectElement).value)}
                                    >
                                        <option value="">-- Top Level / No Parent --</option>
                                        <For each={parentOptions()}>
                                            {(opt) => <option value={opt.id}>{opt.label}</option>}
                                        </For>
                                    </select>
                                </div>

                                {/* Academic Year */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Academic Year (Optional)
                                    </label>
                                    <select
                                        class="block w-full p-2.5 text-xs sm:text-sm bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                        value={formData().academic_year_id}
                                        onChange={(e) => updateField('academic_year_id', (e.target as HTMLSelectElement).value)}
                                    >
                                        <option value="">-- Select Academic Year --</option>
                                        <For each={academicYearOptions()}>
                                            {(opt) => <option value={opt.id}>{opt.label}</option>}
                                        </For>
                                    </select>
                                </div>

                                {/* Feeder ID */}
                                <div>
                                    <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                                        Feeder ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        class="block w-full p-2.5 text-xs sm:text-sm font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white rounded-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="External system sync UUID"
                                        value={formData().feeder_id}
                                        onInput={(e) => updateField('feeder_id', (e.target as HTMLInputElement).value)}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Action Bar */}
                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                            <a
                                href="/institution/master/institution"
                                class="px-5 py-2.5 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="px-6 py-2.5 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-50"
                            >
                                <Show when={isSubmitting()}>
                                    <svg class="animate-spin size-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                    </svg>
                                </Show>
                                <span>{isSubmitting() ? 'Saving Institution...' : 'Save Institution'}</span>
                            </button>
                        </div>
                    </form>
                </Show>
            </div>
        </div>
    );
}
