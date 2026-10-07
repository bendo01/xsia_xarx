import { createSignal, onMount, Show, For, createEffect } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { InstitutionMasterInstitutionDataObject } from '~/models/institution/master/Institution';
import {
    InstitutionMasterInstitutionControllerShow,
} from '~/controllers/institution/master/InstitutionMasterInstitutionController';

export default function InstitutionMasterInstitutionDetailPage() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [institutionData, setInstitutionData] = createSignal<InstitutionMasterInstitutionDataObject | null>(null);
    const [activeTab, setActiveTab] = createSignal<'overview' | 'contacts' | 'system'>('overview');

    // Reference labels
    const [varietyName, setVarietyName] = createSignal('-');
    const [categoryName, setCategoryName] = createSignal('-');
    const [countryName, setCountryName] = createSignal('-');
    const [parentName, setParentName] = createSignal('-');
    const [feederName, setFeederName] = createSignal('-');
    const [academicYearName, setAcademicYearName] = createSignal('-');

    const resolveId = () => {
        const pId = params.id;
        if (pId && pId !== '[id]' && pId !== ':id') {
            return pId.trim();
        }
        return ((searchParams.id as string) || '').trim();
    };

    const fetchDetail = async (id: string) => {
        if (!id || id === '00000000-0000-0000-0000-000000000000') {
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
                setVarietyName(d.variety?.name || (d.variety?.code ? `Variety #${d.variety.code}` : '-'));
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
        const id = resolveId();
        fetchDetail(id);
    });

    createEffect(() => {
        const id = resolveId();
        if (id) {
            fetchDetail(id);
        }
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard: ${text}`, 3000);
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 pb-12">
            <TopBar />

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Page Header with Breadcrumbs */}
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">Home</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Institution</span>
                            <span class="shrink-0">/</span>
                            <a href="/administrator/institution/master/institution" class="hover:text-blue-600 transition-colors shrink-0">Master Institution</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">Profile Details</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex flex-wrap items-center gap-2 sm:gap-3 font-mono">
                            <span class="break-all sm:break-normal">{institutionData()?.institution.name || 'Institution Details'}</span>
                            <Show when={institutionData()?.institution}>
                                <span class={`px-2 py-0.5 text-xs font-semibold uppercase tracking-wider shrink-0 ${institutionData()?.institution.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                    {institutionData()?.institution.is_active ? 'Active' : 'Inactive'}
                                </span>
                            </Show>
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Comprehensive institutional master record, classification, and relational entities.
                        </p>
                    </div>

                    {/* Quick Actions */}
                    <div class="w-full sm:w-auto flex items-center gap-2 shrink-0">
                        <a
                            href="/administrator/institution/master/institution"
                            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-colors cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to Index</span>
                        </a>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            class="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 shadow-2xs transition-colors cursor-pointer"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect width="12" height="8" x="6" y="14" />
                            </svg>
                            <span>Print</span>
                        </button>
                    </div>
                </div>

                <Show when={isLoading()}>
                    <div class="p-12 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                        <div class="animate-spin size-8 border-3 border-blue-600 border-t-transparent rounded-xs mx-auto"></div>
                        <p class="text-xs sm:text-sm text-neutral-500">Loading institution profile details and related data...</p>
                    </div>
                </Show>

                <Show when={!isLoading() && !institutionData()}>
                    <div class="p-12 text-center bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                        <div class="size-12 rounded-xs bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
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
                            href="/administrator/institution/master/institution"
                            class="inline-block px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                        >
                            Return to Directory
                        </a>
                    </div>
                </Show>

                <Show when={!isLoading() && institutionData()}>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column: Quick Profile */}
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
                                    <h2 class="text-base font-bold text-neutral-900 dark:text-white leading-tight font-mono">
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
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500">Category:</span>
                                        <span class="font-medium text-neutral-900 dark:text-white">{categoryName()}</span>
                                    </div>
                                    <div class="flex items-center justify-between">
                                        <span class="text-neutral-500">Variety:</span>
                                        <span class="font-medium text-neutral-900 dark:text-white">{varietyName()}</span>
                                    </div>
                                </div>
                            </div>

                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-6 shadow-2xs space-y-3">
                                <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
                                    Identifiers & System
                                </h3>
                                <div class="space-y-2 text-xs">
                                    <div class="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="text-neutral-500 block mb-0.5">UUID:</span>
                                        <div class="flex items-center justify-between gap-1">
                                            <span class="font-mono truncate">{institutionData()?.institution.id}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(institutionData()?.institution.id || '', 'UUID')}
                                                class="text-blue-600 hover:text-blue-700 font-mono text-[10px] cursor-pointer"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700">
                                        <span class="text-neutral-500">Parent:</span>
                                        <span class="font-mono">{parentName()}</span>
                                    </div>
                                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700">
                                        <span class="text-neutral-500">Feeder ID:</span>
                                        <span class="font-mono">{feederName()}</span>
                                    </div>
                                    <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700">
                                        <span class="text-neutral-500">Academic Year:</span>
                                        <span class="font-mono">{academicYearName()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Detailed Panels */}
                        <div class="lg:col-span-2 space-y-6">
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <div class="border-b border-neutral-200 dark:border-neutral-700 flex px-6">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('overview')}
                                        class={`py-3.5 px-4 text-xs font-mono font-semibold border-b-2 cursor-pointer transition-colors ${activeTab() === 'overview' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Overview & Attributes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('system')}
                                        class={`py-3.5 px-4 text-xs font-mono font-semibold border-b-2 cursor-pointer transition-colors ${activeTab() === 'system' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        System Metadata
                                    </button>
                                </div>

                                <div class="p-6">
                                    <Show when={activeTab() === 'overview'}>
                                        <div class="space-y-4">
                                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                                <div class="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                                    <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Official Name</span>
                                                    <span class="font-mono font-bold text-neutral-900 dark:text-white">{institutionData()?.institution.name || '-'}</span>
                                                </div>
                                                <div class="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                                    <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Acronym / Alphabet Code</span>
                                                    <span class="font-mono font-bold text-neutral-900 dark:text-white">{institutionData()?.institution.alphabet_code || '-'}</span>
                                                </div>
                                                <div class="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                                    <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Institution Code</span>
                                                    <span class="font-mono font-bold text-neutral-900 dark:text-white">{institutionData()?.institution.code || '-'}</span>
                                                </div>
                                                <div class="p-4 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                                    <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Status</span>
                                                    <span class="font-mono font-bold text-neutral-900 dark:text-white">{institutionData()?.institution.is_active ? 'Active' : 'Inactive'}</span>
                                                </div>
                                            </div>

                                            <div class="pt-4">
                                                <h4 class="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                                    All Entity Fields
                                                </h4>
                                                <div class="border border-neutral-200 dark:border-neutral-700 overflow-hidden">
                                                    <table class="w-full text-xs text-left">
                                                        <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                                            <For each={Object.entries(institutionData()?.institution || {})}>
                                                                {([k, v]) => (
                                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                                                        <td class="px-4 py-2 font-mono font-semibold text-neutral-600 dark:text-neutral-400 w-1/3 bg-neutral-50 dark:bg-neutral-900/30">{k}</td>
                                                                        <td class="px-4 py-2 font-mono text-neutral-900 dark:text-white break-all">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')}</td>
                                                                    </tr>
                                                                )}
                                                            </For>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </Show>

                                    <Show when={activeTab() === 'system'}>
                                        <div class="space-y-3 text-xs">
                                            <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                                                <span class="text-neutral-500 font-mono">Created At:</span>
                                                <span class="font-mono text-neutral-900 dark:text-white">{institutionData()?.institution.created_at || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                                                <span class="text-neutral-500 font-mono">Updated At:</span>
                                                <span class="font-mono text-neutral-900 dark:text-white">{institutionData()?.institution.updated_at || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                                                <span class="text-neutral-500 font-mono">Created By:</span>
                                                <span class="font-mono text-neutral-900 dark:text-white">{institutionData()?.institution.created_by || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                                                <span class="text-neutral-500 font-mono">Updated By:</span>
                                                <span class="font-mono text-neutral-900 dark:text-white">{institutionData()?.institution.updated_by || '-'}</span>
                                            </div>
                                            <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-700">
                                                <span class="text-neutral-500 font-mono">Sync At:</span>
                                                <span class="font-mono text-neutral-900 dark:text-white">{institutionData()?.institution.sync_at || '-'}</span>
                                            </div>
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
