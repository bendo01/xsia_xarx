import { createSignal, onMount, Show } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { InstitutionMasterInstitutionDataObject } from '~/models/institution/master/Institution';
import {
    InstitutionMasterInstitutionControllerShow,
    fetchInstitutionVarietyOptions,
    fetchInstitutionCategoryOptions,
    fetchCountryOptions,
    InstitutionMasterInstitutionControllerList,
    fetchAcademicYearOptions,
} from '~/controllers/institution/master/InstitutionMasterInstitutionController';

export default function InstitutionMasterInstitutionShowPage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [institutionData, setInstitutionData] = createSignal<InstitutionMasterInstitutionDataObject | null>(null);

    // Reference labels
    const [varietyName, setVarietyName] = createSignal('-');
    const [categoryName, setCategoryName] = createSignal('-');
    const [countryName, setCountryName] = createSignal('-');
    const [parentName, setParentName] = createSignal('-');
    const [academicYearName, setAcademicYearName] = createSignal('-');

    const institutionId = () => (searchParams.id as string) || '';

    const fetchDetail = async (id: string) => {
        if (!id) {
            setInstitutionData(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [res, varieties, categories, countries, parents, academicYears] = await Promise.all([
                InstitutionMasterInstitutionControllerShow(id),
                fetchInstitutionVarietyOptions(),
                fetchInstitutionCategoryOptions(),
                fetchCountryOptions(),
                InstitutionMasterInstitutionControllerList(),
                fetchAcademicYearOptions(),
            ]);

            if (!res.is_error && res.data) {
                setInstitutionData(res.data);
                const inst = res.data.institution;

                // Resolve labels
                const variety = varieties.find((v) => v.id === inst.variety_id);
                if (variety?.label) setVarietyName(variety.label);

                const category = categories.find((c) => c.id === inst.category_id);
                if (category?.label) setCategoryName(category.label);

                const country = countries.find((c) => c.id === inst.country_id);
                if (country?.label) setCountryName(country.label);

                const parent = parents.find((p) => p.id === inst.parent_id);
                if (parent?.label) setParentName(parent.label);

                const academicYear = academicYears.find((y) => y.id === inst.academic_year_id);
                if (academicYear?.label) setAcademicYearName(academicYear.label);
            } else {
                setInstitutionData(null);
                toast.danger(res.message || 'Institution record not found.');
            }
        } catch (error) {
            console.error('Error fetching institution details:', error);
            setInstitutionData(null);
            toast.danger('Failed to load institution profile from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = institutionId();
        fetchDetail(id);
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard: ${text}`, 3000);
    };

    const printPage = () => {
        window.print();
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 pb-12">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Page Header with Breadcrumbs */}
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Institution</span>
                            <span>/</span>
                            <a href="/institution/master/institution" class="hover:text-blue-600 transition-colors">Master Institution</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Profile Details</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span>{institutionData()?.institution.name || 'Institution Details'}</span>
                            <Show when={institutionData()?.institution}>
                                <span class={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider ${institutionData()?.institution.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                    {institutionData()?.institution.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </Show>
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Comprehensive institutional master record, classification, and operational parameters.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href="/institution/master/institution"
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-colors cursor-pointer"
                            id="btn-back-to-list"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to Index</span>
                        </a>

                        <button
                            type="button"
                            onClick={printPage}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-colors cursor-pointer"
                            id="btn-print-profile"
                            title="Print profile sheet"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect width="12" height="8" x="6" y="14" />
                            </svg>
                            <span>Print</span>
                        </button>

                        <Show when={institutionData()?.institution.id}>
                            <a
                                href={`/institution/master/institution/edit?id=${institutionData()?.institution.id}`}
                                class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors cursor-pointer"
                                id="btn-edit-institution"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                <span>Edit Record</span>
                            </a>
                        </Show>
                    </div>
                </div>

                <Show when={isLoading()}>
                    <div class="p-12 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                        <div class="animate-spin size-8 border-3 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
                        <p class="text-xs sm:text-sm text-neutral-500">Loading institution profile details...</p>
                    </div>
                </Show>

                <Show when={!isLoading() && !institutionData()}>
                    <div class="p-12 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                        <div class="size-12 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 class="text-base font-bold text-neutral-900 dark:text-white">Institution Profile Not Found</h2>
                        <p class="text-xs text-neutral-500 max-w-sm mx-auto">
                            The requested institution record does not exist or may have been deleted.
                        </p>
                        <a
                            href="/institution/master/institution"
                            class="inline-block px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            Return to Directory
                        </a>
                    </div>
                </Show>

                <Show when={!isLoading() && institutionData()}>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Quick Profile Card */}
                        <div class="lg:col-span-1 space-y-6">
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 shadow-2xs space-y-4">
                                <div class="size-16 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
                                    <svg class="size-8" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M3 21h18" />
                                        <path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4" />
                                        <path d="M5 21V10.85" />
                                        <path d="M19 21V10.85" />
                                        <path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4" />
                                    </svg>
                                </div>

                                <div class="text-center space-y-1">
                                    <h2 class="text-base font-bold text-neutral-900 dark:text-white leading-tight">
                                        {institutionData()?.institution.name || '-'}
                                    </h2>
                                    <p class="text-xs font-mono text-neutral-500">
                                        {institutionData()?.institution.alphabet_code || 'No Acronym'}
                                    </p>
                                </div>

                                <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 space-y-2.5 text-xs">
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500">Code:</span>
                                        <span class="font-mono font-semibold text-neutral-900 dark:text-white px-2 py-0.5 bg-neutral-100 dark:bg-neutral-700">
                                            {institutionData()?.institution.code || '-'}
                                        </span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500">Status:</span>
                                        <span class={`font-semibold ${institutionData()?.institution.is_active ? 'text-green-600 dark:text-green-400' : 'text-neutral-500'}`}>
                                            {institutionData()?.institution.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500">Country:</span>
                                        <span class="font-medium text-neutral-900 dark:text-white">{countryName()}</span>
                                    </div>
                                </div>

                                <div class="pt-3 border-t border-neutral-200 dark:border-neutral-700">
                                    <label class="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                                        System UUID
                                    </label>
                                    <div class="flex items-center justify-between gap-1 p-2 bg-neutral-50 dark:bg-neutral-900 font-mono text-[11px] text-neutral-600 dark:text-neutral-400 break-all">
                                        <span>{institutionData()?.institution.id}</span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(institutionData()?.institution.id || '', 'UUID')}
                                            class="text-blue-600 dark:text-blue-400 hover:underline shrink-0 cursor-pointer p-1"
                                            title="Copy UUID"
                                        >
                                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Detailed Sections */}
                        <div class="lg:col-span-2 space-y-6">
                            {/* Classification Card */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        <span>Classification & Hierarchy</span>
                                    </h3>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Variety</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white mt-0.5 block">{varietyName()}</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Category</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white mt-0.5 block">{categoryName()}</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Parent Institution</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white mt-0.5 block">{parentName()}</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60">
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Academic Year</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white mt-0.5 block">{academicYearName()}</span>
                                    </div>
                                </div>
                            </div>

                            {/* External Sync Card */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                            <path d="M3 3v5h5" />
                                            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                            <path d="M16 21h5v-5" />
                                        </svg>
                                        <span>External Integration & Sync</span>
                                    </h3>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                                    <div>
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Feeder Integration ID</span>
                                        <span class="font-mono text-neutral-900 dark:text-white mt-0.5 block">
                                            {institutionData()?.institution.feeder_id || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Last Sync Timestamp</span>
                                        <span class="text-neutral-900 dark:text-white mt-0.5 block">
                                            {institutionData()?.institution.sync_at || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* System Metadata Card */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <polyline points="12 6 12 12 16 14" />
                                        </svg>
                                        <span>System Audit & Logs</span>
                                    </h3>
                                </div>

                                <div class="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                                    <div>
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Created Timestamp</span>
                                        <span class="text-neutral-900 dark:text-white mt-0.5 block font-mono">
                                            {institutionData()?.institution.created_at || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-500 dark:text-neutral-400 block text-[11px] uppercase tracking-wider">Last Updated Timestamp</span>
                                        <span class="text-neutral-900 dark:text-white mt-0.5 block font-mono">
                                            {institutionData()?.institution.updated_at || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}
