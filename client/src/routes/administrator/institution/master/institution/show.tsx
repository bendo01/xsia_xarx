import { createSignal, onMount, Show, For } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { InstitutionMasterInstitutionDataObject } from '~/models/institution/master/Institution';
import {
    InstitutionMasterInstitutionControllerShow,
} from '~/controllers/institution/master/InstitutionMasterInstitutionController';

export default function InstitutionMasterInstitutionShowPage() {
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [institutionData, setInstitutionData] = createSignal<InstitutionMasterInstitutionDataObject | null>(null);
    const [activeTab, setActiveTab] = createSignal<'units' | 'employees' | 'lecturers' | 'candidates'>('units');

    // Reference labels
    const [varietyName, setVarietyName] = createSignal('-');
    const [categoryName, setCategoryName] = createSignal('-');
    const [countryName, setCountryName] = createSignal('-');
    const [parentName, setParentName] = createSignal('-');
    const [feederName, setFeederName] = createSignal('-');
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
            const res = await InstitutionMasterInstitutionControllerShow(id);

            if (!res.is_error && res.data) {
                setInstitutionData(res.data);
                const d = res.data;

                // Resolve labels directly from loaded relationships
                setVarietyName(d.variety?.name || (d.variety?.code ? `Variety #${d.variety.code}` : '-') );
                setCategoryName(d.category?.name || '-');
                setCountryName(d.country?.name ? `${d.country.name}${d.country.alpha2_code ? ` (${d.country.alpha2_code})` : ''}` : '-');
                setParentName(d.parent?.name ? `${d.parent.name}${d.parent.code ? ` (${d.parent.code})` : ''}` : (d.institution.parent_id ? 'Parent Configured' : '-'));
                setFeederName(d.feeder?.name ? `${d.feeder.name}${d.feeder.code ? ` (${d.feeder.code})` : ''}` : (d.institution.feeder_id || '-'));
                setAcademicYearName(d.academic_year?.name || '-');
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
                            Comprehensive institutional master record, classification, and relational entities.
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
                        <p class="text-xs sm:text-sm text-neutral-500">Loading institution profile details and related data...</p>
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
                        {/* Left Column: Quick Profile & Classification Cards */}
                        <div class="lg:col-span-1 space-y-6">
                            {/* Profile Card */}
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

                                <div class="p-6 space-y-3 text-xs sm:text-sm">
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Variety</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white">{varietyName()}</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Category</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white">{categoryName()}</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Parent Institution</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white">{parentName()}</span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Academic Year</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white">{academicYearName()}</span>
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

                                <div class="p-6 space-y-3 text-xs sm:text-sm">
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Feeder Ref:</span>
                                        <span class="font-medium text-neutral-900 dark:text-white">{feederName()}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Feeder UUID:</span>
                                        <span class="font-mono text-neutral-900 dark:text-white text-xs">{institutionData()?.institution.feeder_id || '-'}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Sync Timestamp:</span>
                                        <span class="text-neutral-900 dark:text-white">{institutionData()?.institution.sync_at || '-'}</span>
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

                                <div class="p-6 space-y-3 text-xs">
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Created:</span>
                                        <span class="text-neutral-900 dark:text-white font-mono">{institutionData()?.institution.created_at || '-'}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500 dark:text-neutral-400 text-[11px] uppercase tracking-wider">Updated:</span>
                                        <span class="text-neutral-900 dark:text-white font-mono">{institutionData()?.institution.updated_at || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Loaded Relational Lists with Tabs */}
                        <div class="lg:col-span-2 space-y-6">
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                                {/* Tab Navigation */}
                                <div class="border-b border-neutral-200 dark:border-neutral-700 flex overflow-x-auto">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('units')}
                                        class={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${activeTab() === 'units' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    >
                                        <span>Units & Divisions</span>
                                        <span class={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${activeTab() === 'units' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
                                            {institutionData()?.units?.length || 0}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('employees')}
                                        class={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${activeTab() === 'employees' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    >
                                        <span>Employees</span>
                                        <span class={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${activeTab() === 'employees' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
                                            {institutionData()?.employees?.length || 0}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('lecturers')}
                                        class={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${activeTab() === 'lecturers' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    >
                                        <span>Faculty / Lecturers</span>
                                        <span class={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${activeTab() === 'lecturers' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
                                            {institutionData()?.lecturers?.length || 0}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('candidates')}
                                        class={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-2 shrink-0 ${activeTab() === 'candidates' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300'}`}
                                    >
                                        <span>Registered Candidates</span>
                                        <span class={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${activeTab() === 'candidates' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200' : 'bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'}`}>
                                            {institutionData()?.candidates?.length || 0}
                                        </span>
                                    </button>
                                </div>

                                {/* Tab Contents */}
                                <div class="p-6">
                                    {/* Units Tab */}
                                    <Show when={activeTab() === 'units'}>
                                        <div class="space-y-4">
                                            <div class="flex items-center justify-between">
                                                <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Associated Units & Departments ({institutionData()?.units?.length || 0})
                                                </h4>
                                            </div>

                                            <Show when={(institutionData()?.units?.length || 0) === 0}>
                                                <div class="p-8 text-center bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-500 space-y-2">
                                                    <p>No operational units or sub-divisions associated with this institution.</p>
                                                </div>
                                            </Show>

                                            <Show when={(institutionData()?.units?.length || 0) > 0}>
                                                <div class="overflow-x-auto border border-neutral-200 dark:border-neutral-700">
                                                    <table class="w-full text-left text-xs">
                                                        <thead class="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 uppercase tracking-wider text-neutral-500">
                                                            <tr>
                                                                <th class="px-4 py-2.5">#</th>
                                                                <th class="px-4 py-2.5">Unit Name</th>
                                                                <th class="px-4 py-2.5">Code</th>
                                                                <th class="px-4 py-2.5">Status</th>
                                                                <th class="px-4 py-2.5">Created At</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                                                            <For each={institutionData()?.units}>
                                                                {(unit, idx) => (
                                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                                                        <td class="px-4 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                                        <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{unit.name || '-'}</td>
                                                                        <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{unit.code || '-'}</td>
                                                                        <td class="px-4 py-3">
                                                                            <span class={`px-2 py-0.5 text-[10px] font-semibold uppercase ${unit.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                                                                {unit.is_active ? 'Active' : 'Inactive'}
                                                                            </span>
                                                                        </td>
                                                                        <td class="px-4 py-3 text-neutral-500 font-mono">{unit.created_at || '-'}</td>
                                                                    </tr>
                                                                )}
                                                            </For>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Show>
                                        </div>
                                    </Show>

                                    {/* Employees Tab */}
                                    <Show when={activeTab() === 'employees'}>
                                        <div class="space-y-4">
                                            <div class="flex items-center justify-between">
                                                <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Associated Employees & Staff ({institutionData()?.employees?.length || 0})
                                                </h4>
                                            </div>

                                            <Show when={(institutionData()?.employees?.length || 0) === 0}>
                                                <div class="p-8 text-center bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-500 space-y-2">
                                                    <p>No active employees or staff records registered under this institution.</p>
                                                </div>
                                            </Show>

                                            <Show when={(institutionData()?.employees?.length || 0) > 0}>
                                                <div class="overflow-x-auto border border-neutral-200 dark:border-neutral-700">
                                                    <table class="w-full text-left text-xs">
                                                        <thead class="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 uppercase tracking-wider text-neutral-500">
                                                            <tr>
                                                                <th class="px-4 py-2.5">#</th>
                                                                <th class="px-4 py-2.5">Employee Name</th>
                                                                <th class="px-4 py-2.5">Employee Code</th>
                                                                <th class="px-4 py-2.5">Decree No.</th>
                                                                <th class="px-4 py-2.5">Status</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                                                            <For each={institutionData()?.employees}>
                                                                {(emp, idx) => (
                                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                                                        <td class="px-4 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                                        <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{emp.name}</td>
                                                                        <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{emp.code}</td>
                                                                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{emp.decree_number || '-'}</td>
                                                                        <td class="px-4 py-3">
                                                                            <span class={`px-2 py-0.5 text-[10px] font-semibold uppercase ${emp.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-200 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                                                                {emp.is_active ? 'Active' : 'Inactive'}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </For>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Show>
                                        </div>
                                    </Show>

                                    {/* Lecturers Tab */}
                                    <Show when={activeTab() === 'lecturers'}>
                                        <div class="space-y-4">
                                            <div class="flex items-center justify-between">
                                                <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Associated Faculty & Lecturers ({institutionData()?.lecturers?.length || 0})
                                                </h4>
                                            </div>

                                            <Show when={(institutionData()?.lecturers?.length || 0) === 0}>
                                                <div class="p-8 text-center bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-500 space-y-2">
                                                    <p>No lecturers or faculty members affiliated with this institution.</p>
                                                </div>
                                            </Show>

                                            <Show when={(institutionData()?.lecturers?.length || 0) > 0}>
                                                <div class="overflow-x-auto border border-neutral-200 dark:border-neutral-700">
                                                    <table class="w-full text-left text-xs">
                                                        <thead class="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 uppercase tracking-wider text-neutral-500">
                                                            <tr>
                                                                <th class="px-4 py-2.5">#</th>
                                                                <th class="px-4 py-2.5">Faculty Name</th>
                                                                <th class="px-4 py-2.5">Code</th>
                                                                <th class="px-4 py-2.5">NUPTK</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                                                            <For each={institutionData()?.lecturers}>
                                                                {(lecturer, idx) => (
                                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                                                        <td class="px-4 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                                        <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                                                                            {lecturer.front_title ? `${lecturer.front_title} ` : ''}
                                                                            {lecturer.name || '-'}
                                                                            {lecturer.last_title ? `, ${lecturer.last_title}` : ''}
                                                                        </td>
                                                                        <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{lecturer.code || '-'}</td>
                                                                        <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{lecturer.nuptk || '-'}</td>
                                                                    </tr>
                                                                )}
                                                            </For>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Show>
                                        </div>
                                    </Show>

                                    {/* Candidates Tab */}
                                    <Show when={activeTab() === 'candidates'}>
                                        <div class="space-y-4">
                                            <div class="flex items-center justify-between">
                                                <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Registered Candidates ({institutionData()?.candidates?.length || 0})
                                                </h4>
                                            </div>

                                            <Show when={(institutionData()?.candidates?.length || 0) === 0}>
                                                <div class="p-8 text-center bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700/60 text-xs text-neutral-500 space-y-2">
                                                    <p>No academic candidates currently registered under this institution.</p>
                                                </div>
                                            </Show>

                                            <Show when={(institutionData()?.candidates?.length || 0) > 0}>
                                                <div class="overflow-x-auto border border-neutral-200 dark:border-neutral-700">
                                                    <table class="w-full text-left text-xs">
                                                        <thead class="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700 uppercase tracking-wider text-neutral-500">
                                                            <tr>
                                                                <th class="px-4 py-2.5">#</th>
                                                                <th class="px-4 py-2.5">Candidate Name</th>
                                                                <th class="px-4 py-2.5">Registration Code</th>
                                                                <th class="px-4 py-2.5">National Student ID (NISN)</th>
                                                                <th class="px-4 py-2.5">Origin School</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/50">
                                                            <For each={institutionData()?.candidates}>
                                                                {(cand, idx) => (
                                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-750 transition-colors">
                                                                        <td class="px-4 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                                        <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">{cand.name}</td>
                                                                        <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{cand.code || '-'}</td>
                                                                        <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">{cand.student_national_number || '-'}</td>
                                                                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{cand.school_name || '-'}</td>
                                                                    </tr>
                                                                )}
                                                            </For>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Show>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}
