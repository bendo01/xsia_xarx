import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    listActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    type CampaignActivityItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';
import { getAcademicYearOptions } from '~/controllers/academic/general/reference/AcademicGeneralReferenceAcademicYearController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';

interface SelectOption {
    id: string;
    name: string;
}

export default function AcademicCampaignTransactionActivityPage() {
    const basePath = '/administrator/academic/campaign/transaction/activity';

    // Data States
    const [activities, setActivities] = createSignal<CampaignActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedUnitId, setSelectedUnitId] = createSignal('');
    const [selectedAcademicYearId, setSelectedAcademicYearId] = createSignal('');
    const [selectedStatus, setSelectedStatus] = createSignal<'all' | 'active' | 'inactive'>('all');
    const [sortParam, setSortParam] = createSignal('name-asc');

    // Reference Options
    const [unitOptions, setUnitOptions] = createSignal<SelectOption[]>([]);
    const [academicYearOptions, setAcademicYearOptions] = createSignal<SelectOption[]>([]);

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedActivity, setSelectedActivity] = createSignal<CampaignActivityItem | null>(null);

    // Form Form State
    const [formState, setFormState] = createSignal<Partial<CampaignActivityItem>>({
        name: '',
        unit_id: '',
        academic_year_id: '',
        student_target: 0,
        week_quantity: 0,
        candidate_number: 0,
        candidate_pass: 0,
        became_student: 0,
        transfer_student: 0,
        total_class_member: 0,
        start_date: '',
        end_date: '',
        start_transaction: '',
        end_transaction: '',
        is_active: true,
    });

    // Load filter reference options
    const loadOptions = async () => {
        try {
            const [unitsData, ayData] = await Promise.all([
                getUnitOptions().catch(() => []),
                getAcademicYearOptions().catch(() => []),
            ]);
            if (Array.isArray(unitsData)) {
                setUnitOptions(unitsData);
            }
            if (Array.isArray(ayData)) {
                setAcademicYearOptions(ayData);
            }
        } catch (error) {
            console.warn('Failed to load filter options:', error);
        }
    };

    // Fetch activities from API
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await listActivities({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                unit_id: selectedUnitId() || undefined,
                academic_year_id: selectedAcademicYearId() || undefined,
            });

            let items = res.data || [];

            // Client-side status filtering if needed
            if (selectedStatus() === 'active') {
                items = items.filter((a) => a.is_active === true);
            } else if (selectedStatus() === 'inactive') {
                items = items.filter((a) => a.is_active === false);
            }

            // Client-side sort if desired
            items = [...items].sort((a, b) => {
                switch (sortParam()) {
                    case 'name-asc':
                        return (a.name || '').localeCompare(b.name || '');
                    case 'name-desc':
                        return (b.name || '').localeCompare(a.name || '');
                    case 'target-desc':
                        return (b.student_target || 0) - (a.student_target || 0);
                    case 'target-asc':
                        return (a.student_target || 0) - (b.student_target || 0);
                    default:
                        return 0;
                }
            });

            setActivities(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
        } catch (error) {
            console.error('Error fetching activities:', error);
            toast.danger('Failed to load campaign activities.');
            setActivities([]);
            setTotalData(0);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    onMount(() => {
        loadOptions();
        fetchData();
    });

    createEffect(() => {
        currentPage();
        itemsPerPage();
        searchQuery();
        selectedUnitId();
        selectedAcademicYearId();
        selectedStatus();
        sortParam();
        fetchData();
    });

    // Debounced search
    let searchTimeout: any;
    const handleSearchInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchQuery(val.trim());
            setCurrentPage(1);
        }, 300);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([loadOptions(), fetchData()]);
        toast.success('Activity records refreshed successfully.');
    };

    // Calculate Summary KPIs
    const summaryStats = createMemo(() => {
        const list = activities();
        let totalTarget = 0;
        let totalCandidates = 0;
        let totalPassed = 0;
        let totalEnrolled = 0;
        let activeCount = 0;

        for (const item of list) {
            totalTarget += item.student_target || 0;
            totalCandidates += item.candidate_number || 0;
            totalPassed += item.candidate_pass || 0;
            totalEnrolled += item.became_student || 0;
            if (item.is_active) activeCount++;
        }

        const fulfillmentRate = totalTarget > 0 ? Math.min(100, Math.round((totalEnrolled / totalTarget) * 100)) : 0;

        return {
            totalCount: totalData(),
            currentCount: list.length,
            activeCount,
            totalTarget,
            totalCandidates,
            totalPassed,
            totalEnrolled,
            fulfillmentRate,
        };
    });

    // Helpers
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatDateForInput = (d?: string | null) => {
        if (!d) return '';
        return d.substring(0, 10);
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    // Modal Openers
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedActivity(null);
        setFormState({
            name: '',
            unit_id: unitOptions()[0]?.id || '',
            academic_year_id: academicYearOptions()[0]?.id || '',
            student_target: 0,
            week_quantity: 16,
            candidate_number: 0,
            candidate_pass: 0,
            became_student: 0,
            transfer_student: 0,
            total_class_member: 0,
            start_date: '',
            end_date: '',
            start_transaction: '',
            end_transaction: '',
            is_active: true,
        });
        formDialogRef?.showModal();
    };

    const openEditModal = (activity: CampaignActivityItem) => {
        setModalMode('edit');
        setSelectedActivity(activity);
        setFormState({
            name: activity.name || '',
            unit_id: activity.unit_id || '',
            academic_year_id: activity.academic_year_id || '',
            student_target: activity.student_target || 0,
            week_quantity: activity.week_quantity || 0,
            candidate_number: activity.candidate_number || 0,
            candidate_pass: activity.candidate_pass || 0,
            became_student: activity.became_student || 0,
            transfer_student: activity.transfer_student || 0,
            total_class_member: activity.total_class_member || 0,
            start_date: formatDateForInput(activity.start_date),
            end_date: formatDateForInput(activity.end_date),
            start_transaction: formatDateForInput(activity.start_transaction),
            end_transaction: formatDateForInput(activity.end_transaction),
            is_active: activity.is_active ?? true,
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (activity: CampaignActivityItem) => {
        setSelectedActivity(activity);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedActivity(null);
        setIsSubmitting(false);
    };

    // Form Submission
    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const payload = formState();

        if (!payload.name?.trim()) {
            toast.danger('Activity name is required.');
            return;
        }

        setIsSubmitting(true);
        try {
            if (modalMode() === 'create') {
                const res = await createActivity(payload);
                if (res.success) {
                    toast.success('Activity created successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to create activity.');
                }
            } else {
                const target = selectedActivity();
                if (!target?.id) return;
                const res = await updateActivity(target.id, payload);
                if (res.success) {
                    toast.success('Activity updated successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to update activity.');
                }
            }
        } catch (err: any) {
            toast.danger(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Submission
    const handleDeleteSubmit = async () => {
        const item = selectedActivity();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await deleteActivity(item.id);
            if (res.success) {
                toast.success(res.message || 'Activity deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete activity.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An error occurred while deleting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedUnitId('');
        setSelectedAcademicYearId('');
        setSelectedStatus('all');
        setSortParam('name-asc');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + activities().length, totalData());

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header Section */}
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</a>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span>Campaign</span>
                            <span>/</span>
                            <span>Transaction</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Activity</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Campaign Activities
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Configure academic campaign cycles, target student quotas, timeline schedules, and monitor candidate admissions.
                        </p>
                    </div>

                    <div class="flex flex-wrap items-center gap-2.5">
                        <button
                            type="button"
                            onClick={handleRefresh}
                            disabled={isRefreshing()}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
                        >
                            <svg class={`size-4 ${isRefreshing() ? 'animate-spin text-blue-600' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                                <path d="M3 3v5h5" />
                                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                                <path d="M16 21h5v-5" />
                            </svg>
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            class="inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xs shadow-xs transition-colors cursor-pointer"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14" />
                                <path d="M12 5v14" />
                            </svg>
                            <span>New Activity</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <A
                        href={basePath}
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0"
                    >
                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18M9 21V9" />
                        </svg>
                        <span>Activities</span>
                    </A>
                    <A
                        href="/administrator/academic/campaign/transaction/class-code"
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0"
                    >
                        <span>Class Codes</span>
                    </A>
                    <A
                        href="/administrator/academic/campaign/transaction/teach"
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0"
                    >
                        <span>Teaching Activities</span>
                    </A>
                    <A
                        href="/administrator/academic/campaign/transaction/teach-lecturer"
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0"
                    >
                        <span>Teach Lecturers</span>
                    </A>
                    <A
                        href="/administrator/academic/campaign/transaction/teach-evaluation"
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0"
                    >
                        <span>Evaluations</span>
                    </A>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Activities</span>
                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {summaryStats().activeCount} Active
                            </span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().totalCount}
                            </span>
                            <span class="text-xs text-neutral-500">records</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Target</span>
                            <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10" />
                                <circle cx="12" cy="12" r="6" />
                                <circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().totalTarget.toLocaleString()}
                            </span>
                            <span class="text-xs text-neutral-500">students target</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Candidates</span>
                            <span class="text-xs font-mono text-neutral-500">
                                {summaryStats().totalPassed} passed
                            </span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().totalCandidates.toLocaleString()}
                            </span>
                            <span class="text-xs text-neutral-500">applicants</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Enrolled Students</span>
                            <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                {summaryStats().fulfillmentRate}% quota
                            </span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().totalEnrolled.toLocaleString()}
                            </span>
                            <span class="text-xs text-neutral-500">registered</span>
                        </div>
                        {/* Fulfillment Progress Bar */}
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div
                                class="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, summaryStats().fulfillmentRate)}%` }}
                            ></div>
                        </div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Search Input */}
                        <div class="md:col-span-4 relative">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                class="block w-full p-2 pl-9 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                placeholder="Search by activity name..."
                                value={searchQuery()}
                                onInput={handleSearchInput}
                            />
                            <Show when={searchQuery()}>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                    class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                >
                                    <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </Show>
                        </div>

                        {/* Unit Filter */}
                        <div class="md:col-span-3">
                            <select
                                class="w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={selectedUnitId()}
                                onChange={(e) => {
                                    setSelectedUnitId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Units</option>
                                <For each={unitOptions()}>
                                    {(u) => <option value={u.id}>{u.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Academic Year Filter */}
                        <div class="md:col-span-2">
                            <select
                                class="w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={selectedAcademicYearId()}
                                onChange={(e) => {
                                    setSelectedAcademicYearId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Academic Years</option>
                                <For each={academicYearOptions()}>
                                    {(ay) => <option value={ay.id}>{ay.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div class="md:col-span-2">
                            <select
                                class="w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                value={selectedStatus()}
                                onChange={(e) => {
                                    setSelectedStatus((e.target as HTMLSelectElement).value as any);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="inactive">Inactive Only</option>
                            </select>
                        </div>

                        {/* Sort & Limit */}
                        <div class="md:col-span-1 flex gap-2">
                            <button
                                type="button"
                                title="Reset all filters"
                                onClick={resetFilters}
                                class="w-full p-2 text-xs flex items-center justify-center font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xs transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-700/60">
                        <div class="flex items-center gap-3">
                            <span>
                                Showing <strong class="text-neutral-800 dark:text-neutral-200">{activities().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> activities
                            </span>
                        </div>

                        <div class="flex items-center gap-2">
                            <span>Sort:</span>
                            <select
                                class="p-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                value={sortParam()}
                                onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="target-desc">Target (Highest)</option>
                                <option value="target-asc">Target (Lowest)</option>
                            </select>

                            <span>Per page:</span>
                            <select
                                class="p-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                value={itemsPerPage()}
                                onChange={(e) => {
                                    setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Presentation Container */}
                <div class="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 rounded-xs shadow-2xs overflow-hidden">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="p-6 space-y-4">
                                <For each={Array.from({ length: 4 })}>
                                    {() => (
                                        <div class="p-4 animate-pulse space-y-2.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                            <div class="h-4 w-60 bg-neutral-200 dark:bg-neutral-700 rounded-xs"></div>
                                            <div class="h-3 w-40 bg-neutral-200 dark:bg-neutral-700 rounded-xs"></div>
                                            <div class="grid grid-cols-4 gap-4 pt-2">
                                                <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-xs"></div>
                                                <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-xs"></div>
                                                <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-xs"></div>
                                                <div class="h-3 bg-neutral-200 dark:bg-neutral-700 rounded-xs"></div>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        }
                    >
                        <Show
                            when={activities().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <div class="inline-flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200 dark:border-blue-800">
                                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <rect width="18" height="18" x="3" y="3" rx="2" />
                                            <path d="M3 9h18M9 21V9" />
                                        </svg>
                                    </div>
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                        No Campaign Activities Found
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no activity records matching your current filter criteria or database state.
                                    </p>
                                    <div class="mt-4 flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            onClick={resetFilters}
                                            class="px-3.5 py-1.5 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 rounded-xs transition-colors"
                                        >
                                            Clear Filters
                                        </button>
                                        <button
                                            type="button"
                                            onClick={openCreateModal}
                                            class="px-3.5 py-1.5 text-xs font-mono font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xs transition-colors"
                                        >
                                            + Add Activity
                                        </button>
                                    </div>
                                </div>
                            }
                        >
                            {/* Desktop Table View (>= 768px) */}
                            <div class="hidden md:block overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-700 font-mono text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
                                        <tr>
                                            <th class="px-4 py-3 font-semibold">Activity & Unit</th>
                                            <th class="px-4 py-3 font-semibold">Academic Period</th>
                                            <th class="px-4 py-3 font-semibold">Quota & Admission Funnel</th>
                                            <th class="px-4 py-3 font-semibold">Timeline</th>
                                            <th class="px-4 py-3 font-semibold text-center">Status</th>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={activities()}>
                                            {(item) => {
                                                const target = item.student_target || 0;
                                                const enrolled = item.became_student || 0;
                                                const pct = target > 0 ? Math.min(100, Math.round((enrolled / target) * 100)) : 0;

                                                return (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                        {/* Activity & Unit */}
                                                        <td class="px-4 py-3.5 align-top">
                                                            <div class="font-semibold text-sm text-neutral-900 dark:text-white">
                                                                <A
                                                                    href={`${basePath}/${item.id}`}
                                                                    class="text-blue-600 dark:text-blue-400 hover:underline font-mono"
                                                                >
                                                                    {item.name}
                                                                </A>
                                                            </div>
                                                            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                <span class="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-neutral-100 dark:bg-neutral-700/70 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                                                                    {item.unit_name || 'Unit'}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => copyToClipboard(item.id, 'UUID')}
                                                                    class="px-1.5 py-0.5 rounded-xs text-[10px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer flex items-center gap-1"
                                                                    title="Click to copy UUID"
                                                                >
                                                                    <span>{item.id.substring(0, 8)}...</span>
                                                                    <svg class="size-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <rect width="14" height="14" x="8" y="8" rx="2" />
                                                                        <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>

                                                        {/* Academic Period */}
                                                        <td class="px-4 py-3.5 align-top font-mono">
                                                            <div class="font-medium text-neutral-800 dark:text-neutral-200">
                                                                {item.academic_year_name || 'Academic Year'}
                                                            </div>
                                                            <div class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                                Duration: {item.week_quantity ? `${item.week_quantity} Weeks` : '-'}
                                                            </div>
                                                        </td>

                                                        {/* Quota & Funnel */}
                                                        <td class="px-4 py-3.5 align-top font-mono">
                                                            <div class="flex items-center justify-between text-[11px] mb-1">
                                                                <span class="text-neutral-500">Target: <strong class="text-neutral-800 dark:text-neutral-200">{target}</strong></span>
                                                                <span class="text-neutral-500">Enrolled: <strong class="text-emerald-600 dark:text-emerald-400">{enrolled}</strong> ({pct}%)</span>
                                                            </div>
                                                            <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mb-1.5">
                                                                <div
                                                                    class="bg-emerald-500 h-full rounded-full"
                                                                    style={{ width: `${pct}%` }}
                                                                ></div>
                                                            </div>
                                                            <div class="flex items-center gap-2 text-[10px] text-neutral-500">
                                                                <span>Candidates: {item.candidate_number || 0}</span>
                                                                <span>•</span>
                                                                <span>Passed: {item.candidate_pass || 0}</span>
                                                            </div>
                                                        </td>

                                                        {/* Timeline */}
                                                        <td class="px-4 py-3.5 align-top font-mono text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                            <div>Period: {formatDate(item.start_date)} - {formatDate(item.end_date)}</div>
                                                            <div class="text-[10px] text-neutral-500 mt-0.5">
                                                                Tx: {formatDate(item.start_transaction)} - {formatDate(item.end_transaction)}
                                                            </div>
                                                        </td>

                                                        {/* Status */}
                                                        <td class="px-4 py-3.5 align-top text-center">
                                                            <span
                                                                class={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                                    item.is_active
                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                                }`}
                                                            >
                                                                <span class={`size-1.5 rounded-full ${item.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-400'}`}></span>
                                                                {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td class="px-4 py-3.5 align-top text-right">
                                                            <div class="flex items-center justify-end gap-1.5">
                                                                <A
                                                                    href={`${basePath}/${item.id}`}
                                                                    class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors"
                                                                    title="View Details"
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                </A>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(item)}
                                                                    class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                    title="Edit Activity"
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteModal(item)}
                                                                    class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                    title="Delete Activity"
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards View (< 768px) */}
                            <div class="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                                <For each={activities()}>
                                    {(item) => {
                                        const target = item.student_target || 0;
                                        const enrolled = item.became_student || 0;
                                        const pct = target > 0 ? Math.min(100, Math.round((enrolled / target) * 100)) : 0;

                                        return (
                                            <div class="p-4 space-y-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-700/20 transition-colors">
                                                <div class="flex items-start justify-between gap-2">
                                                    <div class="flex-1 min-w-0">
                                                        <A
                                                            href={`${basePath}/${item.id}`}
                                                            class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                        >
                                                            {item.name}
                                                        </A>
                                                        <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                            {item.unit_name || 'Unit'} • {item.academic_year_name || 'Academic Year'}
                                                        </div>
                                                    </div>
                                                    <span
                                                        class={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                                                            item.is_active
                                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                        }`}
                                                    >
                                                        {item.is_active ? 'ACTIVE' : 'INACTIVE'}
                                                    </span>
                                                </div>

                                                {/* Metrics Grid */}
                                                <div class="grid grid-cols-3 gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xs border border-neutral-200/80 dark:border-neutral-700/60 text-center font-mono">
                                                    <div>
                                                        <span class="text-[10px] text-neutral-500 block">Target</span>
                                                        <span class="text-xs font-bold text-neutral-900 dark:text-white">{target}</span>
                                                    </div>
                                                    <div>
                                                        <span class="text-[10px] text-neutral-500 block">Candidates</span>
                                                        <span class="text-xs font-bold text-neutral-900 dark:text-white">{item.candidate_number || 0}</span>
                                                    </div>
                                                    <div>
                                                        <span class="text-[10px] text-neutral-500 block">Enrolled</span>
                                                        <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">{enrolled}</span>
                                                    </div>
                                                </div>

                                                {/* Progress Bar */}
                                                <div>
                                                    <div class="flex justify-between text-[10px] font-mono text-neutral-500 mb-1">
                                                        <span>Enrollment fulfillment</span>
                                                        <span>{pct}%</span>
                                                    </div>
                                                    <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                                                        <div class="bg-emerald-500 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div class="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-700/60 text-xs">
                                                    <button
                                                        type="button"
                                                        onClick={() => copyToClipboard(item.id, 'UUID')}
                                                        class="text-neutral-500 hover:text-neutral-800 font-mono text-[11px]"
                                                    >
                                                        UUID: {item.id.substring(0, 8)}...
                                                    </button>
                                                    <div class="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => openEditModal(item)}
                                                            class="px-2.5 py-1 font-mono text-xs text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 rounded-xs"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteModal(item)}
                                                            class="px-2.5 py-1 font-mono text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xs"
                                                        >
                                                            Delete
                                                        </button>
                                                        <A
                                                            href={`${basePath}/${item.id}`}
                                                            class="px-2.5 py-1 font-mono text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xs"
                                                        >
                                                            Detail →
                                                        </A>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </div>
                        </Show>
                    </Show>
                </div>

                {/* Pagination Controls */}
                <Show when={totalPages() > 1}>
                    <div class="flex flex-col sm:flex-row items-center justify-between border rounded-lg border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-3">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Showing <span class="font-semibold text-neutral-900 dark:text-white">{totalData() > 0 ? startIndex() + 1 : 0}</span>–<span class="font-semibold text-neutral-900 dark:text-white">{endIndex()}</span> of <span class="font-semibold text-neutral-900 dark:text-white">{totalData().toLocaleString()}</span> activities
                        </p>
                        <nav class="inline-flex -space-x-px rounded-lg overflow-hidden shadow-sm" aria-label="Pagination">
                            <button
                                type="button"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                disabled={currentPage() <= 1 || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                Previous
                            </button>
                            <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-y border-neutral-300 dark:border-neutral-600">
                                {currentPage()} / {totalPages()}
                            </span>
                            <button
                                type="button"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                disabled={currentPage() >= totalPages() || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                            >
                                Next
                            </button>
                        </nav>
                    </div>
                </Show>
            </main>

            {/* Create & Edit Modal Dialog */}
            <dialog
                ref={formDialogRef}
                class="fixed inset-0 m-auto w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xs border border-neutral-300 dark:border-neutral-700 shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-xs text-neutral-900 dark:text-neutral-100"
            >
                <form onSubmit={handleFormSubmit} class="p-6 space-y-5">
                    <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                        <div>
                            <span class="text-xs font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                                {modalMode() === 'create' ? 'Create Record' : 'Edit Record'}
                            </span>
                            <h3 class="text-lg font-bold font-mono text-neutral-900 dark:text-white">
                                {modalMode() === 'create' ? 'New Campaign Activity' : 'Update Campaign Activity'}
                            </h3>
                        </div>
                        <button
                            type="button"
                            onClick={closeFormModal}
                            class="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xs cursor-pointer"
                        >
                            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4 max-h-[68vh] overflow-y-auto px-1 pr-2">
                        {/* Name */}
                        <div>
                            <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                Activity Name <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                required
                                class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                placeholder="e.g. Penerimaan Mahasiswa Baru Gelombang 1"
                                value={formState().name || ''}
                                onInput={(e) => setFormState({ ...formState(), name: (e.target as HTMLInputElement).value })}
                            />
                        </div>

                        {/* Unit & Academic Year */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Unit / Study Program
                                </label>
                                <select
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                    value={formState().unit_id || ''}
                                    onChange={(e) => setFormState({ ...formState(), unit_id: (e.target as HTMLSelectElement).value })}
                                >
                                    <option value="">Select Unit</option>
                                    <For each={unitOptions()}>
                                        {(u) => <option value={u.id}>{u.name}</option>}
                                    </For>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Academic Year
                                </label>
                                <select
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                                    value={formState().academic_year_id || ''}
                                    onChange={(e) => setFormState({ ...formState(), academic_year_id: (e.target as HTMLSelectElement).value })}
                                >
                                    <option value="">Select Academic Year</option>
                                    <For each={academicYearOptions()}>
                                        {(ay) => <option value={ay.id}>{ay.name}</option>}
                                    </For>
                                </select>
                            </div>
                        </div>

                        {/* Quota Targets & Numbers */}
                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Student Target
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().student_target || 0}
                                    onInput={(e) => setFormState({ ...formState(), student_target: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Duration (Weeks)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().week_quantity || 0}
                                    onInput={(e) => setFormState({ ...formState(), week_quantity: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Candidates
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().candidate_number || 0}
                                    onInput={(e) => setFormState({ ...formState(), candidate_number: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Candidate Passed
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().candidate_pass || 0}
                                    onInput={(e) => setFormState({ ...formState(), candidate_pass: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Became Student
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().became_student || 0}
                                    onInput={(e) => setFormState({ ...formState(), became_student: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Transfer Student
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().transfer_student || 0}
                                    onInput={(e) => setFormState({ ...formState(), transfer_student: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Class Member Count
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().total_class_member || 0}
                                    onInput={(e) => setFormState({ ...formState(), total_class_member: Number((e.target as HTMLInputElement).value) })}
                                />
                            </div>
                        </div>

                        {/* Dates */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Activity Start Date
                                </label>
                                <input
                                    type="date"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().start_date || ''}
                                    onInput={(e) => setFormState({ ...formState(), start_date: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Activity End Date
                                </label>
                                <input
                                    type="date"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().end_date || ''}
                                    onInput={(e) => setFormState({ ...formState(), end_date: (e.target as HTMLInputElement).value })}
                                />
                            </div>
                        </div>

                        {/* Transaction Dates */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Transaction Start Date
                                </label>
                                <input
                                    type="date"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().start_transaction || ''}
                                    onInput={(e) => setFormState({ ...formState(), start_transaction: (e.target as HTMLInputElement).value })}
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Transaction End Date
                                </label>
                                <input
                                    type="date"
                                    class="w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    value={formState().end_transaction || ''}
                                    onInput={(e) => setFormState({ ...formState(), end_transaction: (e.target as HTMLInputElement).value })}
                                />
                            </div>
                        </div>

                        {/* Active Status */}
                        <div class="pt-2">
                            <label class="inline-flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    class="size-4 text-blue-600 rounded-xs border-neutral-300 focus:ring-blue-500"
                                    checked={formState().is_active ?? true}
                                    onChange={(e) => setFormState({ ...formState(), is_active: (e.target as HTMLInputElement).checked })}
                                />
                                <span class="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                                    Active Status (Visible and open for academic operations)
                                </span>
                            </label>
                        </div>
                    </div>

                    <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={closeFormModal}
                            class="px-4 py-2 text-xs sm:text-sm font-mono font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xs transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting()}
                            class="px-4 py-2 text-xs sm:text-sm font-mono font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create Activity' : 'Update Activity'}
                        </button>
                    </div>
                </form>
            </dialog>

            {/* Delete Confirmation Modal Dialog */}
            <dialog
                ref={deleteDialogRef}
                class="fixed inset-0 m-auto w-full max-w-md bg-white dark:bg-neutral-900 rounded-xs border border-neutral-300 dark:border-neutral-700 shadow-2xl p-0 backdrop:bg-black/50 backdrop:backdrop-blur-xs text-neutral-900 dark:text-neutral-100"
            >
                <div class="p-6 space-y-4">
                    <div class="flex items-center gap-3">
                        <div class="size-10 rounded-full bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M12 9v4M12 17h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                Delete Activity
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                This action cannot be reversed.
                            </p>
                        </div>
                    </div>

                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Are you sure you want to delete <strong class="text-neutral-900 dark:text-white">"{selectedActivity()?.name}"</strong>? All associated campaign registration mappings may be affected.
                    </p>

                    <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            class="px-3.5 py-1.5 text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 rounded-xs transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isSubmitting()}
                            onClick={handleDeleteSubmit}
                            class="px-4 py-1.5 text-xs font-mono font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xs transition-colors cursor-pointer disabled:opacity-50"
                        >
                            {isSubmitting() ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
