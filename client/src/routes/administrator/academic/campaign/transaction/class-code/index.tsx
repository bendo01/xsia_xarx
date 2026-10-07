import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    listClassCodes,
    createClassCode,
    updateClassCode,
    deleteClassCode,
    type ClassCodeItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionClassCodeController';
import {
    listActivities,
    getActivityById,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';

interface SelectOption {
    id: string;
    name: string;
}

interface ClassCodeFormState {
    code: string;
    alphabet_code: string;
    name: string;
    unit_id: string;
    activity_id: string;
    capacity: string;
    start_effective_date: string;
    end_effective_date: string;
}

const emptyForm = (unitId = ''): ClassCodeFormState => ({
    code: '',
    alphabet_code: '',
    name: '',
    unit_id: unitId,
    activity_id: '',
    capacity: '',
    start_effective_date: '',
    end_effective_date: '',
});

export default function AcademicCampaignTransactionClasscodePage() {
    const basePath = '/administrator/academic/campaign/transaction/class-code';

    // Data States
    const [classCodes, setClassCodes] = createSignal<ClassCodeItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedUnitId, setSelectedUnitId] = createSignal('');
    const [selectedStatus, setSelectedStatus] = createSignal<'all' | 'active' | 'expired'>('all');
    const [sortParam, setSortParam] = createSignal('name-asc');

    // Reference Options & Lookups
    const [unitOptions, setUnitOptions] = createSignal<SelectOption[]>([]);
    const unitNameMap = createMemo(() => new Map(unitOptions().map((u) => [u.id, u.name])));
    const [activityNames, setActivityNames] = createSignal<Record<string, string>>({});
    const [formActivityOptions, setFormActivityOptions] = createSignal<SelectOption[]>([]);
    const [isLoadingFormActivities, setIsLoadingFormActivities] = createSignal(false);

    const unitName = (item: ClassCodeItem) =>
        item.unit_name || (item.unit_id ? unitNameMap().get(item.unit_id) : undefined) || '-';
    const activityName = (item: ClassCodeItem) =>
        item.activity_name || activityNames()[item.activity_id] || `${item.activity_id.substring(0, 8)}...`;

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedClassCode, setSelectedClassCode] = createSignal<ClassCodeItem | null>(null);
    const [formState, setFormState] = createSignal<ClassCodeFormState>(emptyForm());

    const updateForm = (field: keyof ClassCodeFormState, value: string) => setFormState({ ...formState(), [field]: value });

    // Load filter reference options
    const loadOptions = async () => {
        try {
            const unitsData = await getUnitOptions().catch(() => []);
            if (Array.isArray(unitsData)) {
                setUnitOptions(unitsData);
            }
        } catch (error) {
            console.warn('Failed to load filter options:', error);
        }
    };

    // Resolve activity names for the rows on the current page (cached across pages)
    const resolveActivityNames = async (items: ClassCodeItem[]) => {
        const known = activityNames();
        const missing = [...new Set(items.map((i) => i.activity_id))].filter((id) => id && !(id in known));
        if (missing.length === 0) return;

        const results = await Promise.allSettled(missing.map((id) => getActivityById(id)));
        const resolved: Record<string, string> = {};
        results.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value?.name) {
                resolved[missing[idx]] = r.value.academic_year_name
                    ? `${r.value.name} (${r.value.academic_year_name})`
                    : r.value.name;
            }
        });
        setActivityNames({ ...activityNames(), ...resolved });
    };

    // Load activities for the unit selected in the form
    const loadFormActivities = async (unitId: string) => {
        if (!unitId) {
            setFormActivityOptions([]);
            return;
        }
        setIsLoadingFormActivities(true);
        try {
            const res = await listActivities({ page: 1, page_size: 100, unit_id: unitId });
            const options = (res.data || []).map((a) => ({
                id: a.id,
                name: a.academic_year_name ? `${a.name} (${a.academic_year_name})` : a.name,
            }));
            // Keep the currently assigned activity selectable even if it is not in the unit's list
            const current = formState().activity_id;
            if (current && !options.some((o) => o.id === current)) {
                options.unshift({ id: current, name: activityNames()[current] || current });
            }
            setFormActivityOptions(options);
        } catch (error) {
            console.warn('Failed to load activities for unit:', error);
            setFormActivityOptions([]);
        } finally {
            setIsLoadingFormActivities(false);
        }
    };

    // A class code is active while it has no end effective date or the date is still in the future
    const isActiveClassCode = (item: ClassCodeItem) => {
        if (!item.end_effective_date) return true;
        return new Date(item.end_effective_date).getTime() >= new Date(new Date().toDateString()).getTime();
    };

    // Fetch class codes from API
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await listClassCodes({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                unit_id: selectedUnitId() || undefined,
            });

            let items = res.data || [];

            // Client-side status filtering
            if (selectedStatus() === 'active') {
                items = items.filter((c) => isActiveClassCode(c));
            } else if (selectedStatus() === 'expired') {
                items = items.filter((c) => !isActiveClassCode(c));
            }

            // Client-side sort
            items = [...items].sort((a, b) => {
                switch (sortParam()) {
                    case 'name-asc':
                        return (a.name || '').localeCompare(b.name || '');
                    case 'name-desc':
                        return (b.name || '').localeCompare(a.name || '');
                    case 'capacity-desc':
                        return (b.capacity || 0) - (a.capacity || 0);
                    case 'capacity-asc':
                        return (a.capacity || 0) - (b.capacity || 0);
                    default:
                        return 0;
                }
            });

            setClassCodes(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
            resolveActivityNames(items);
        } catch (error) {
            console.error('Error fetching class codes:', error);
            toast.danger('Failed to load class codes.');
            setClassCodes([]);
            setTotalData(0);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    onMount(() => {
        loadOptions();
    });

    createEffect(() => {
        currentPage();
        itemsPerPage();
        searchQuery();
        selectedUnitId();
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
        toast.success('Class code records refreshed successfully.');
    };

    // Calculate Summary KPIs
    const summaryStats = createMemo(() => {
        const list = classCodes();
        let activeCount = 0;
        let totalCapacity = 0;
        const activities = new Set<string>();
        const units = new Set<string>();

        for (const item of list) {
            if (isActiveClassCode(item)) activeCount++;
            totalCapacity += item.capacity || 0;
            if (item.activity_id) activities.add(item.activity_id);
            if (item.unit_id) units.add(item.unit_id);
        }

        return {
            totalCount: totalData(),
            activeCount,
            totalCapacity,
            averageCapacity: list.length > 0 ? Math.round(totalCapacity / list.length) : 0,
            activityCount: activities.size,
            unitCount: units.size,
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
        setSelectedClassCode(null);
        const unitId = selectedUnitId() || unitOptions()[0]?.id || '';
        setFormState(emptyForm(unitId));
        loadFormActivities(unitId);
        formDialogRef?.showModal();
    };

    const openEditModal = (item: ClassCodeItem) => {
        setModalMode('edit');
        setSelectedClassCode(item);
        setFormState({
            code: item.code !== null && item.code !== undefined ? String(item.code) : '',
            alphabet_code: item.alphabet_code || '',
            name: item.name || '',
            unit_id: item.unit_id || '',
            activity_id: item.activity_id || '',
            capacity: item.capacity !== null && item.capacity !== undefined ? String(item.capacity) : '',
            start_effective_date: formatDateForInput(item.start_effective_date),
            end_effective_date: formatDateForInput(item.end_effective_date),
        });
        loadFormActivities(item.unit_id || '');
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: ClassCodeItem) => {
        setSelectedClassCode(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedClassCode(null);
        setIsSubmitting(false);
    };

    // Form Submission
    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const form = formState();

        if (!form.name.trim()) {
            toast.danger('Class name is required.');
            return;
        }
        if (!form.activity_id) {
            toast.danger('Campaign activity is required.');
            return;
        }
        if (form.capacity.trim() !== '' && (Number.isNaN(Number(form.capacity)) || Number(form.capacity) < 0)) {
            toast.danger('Capacity must be a non-negative number.');
            return;
        }
        if (form.start_effective_date && form.end_effective_date && form.start_effective_date > form.end_effective_date) {
            toast.danger('Start effective date cannot be after end effective date.');
            return;
        }

        const payload: Partial<ClassCodeItem> = {
            code: form.code.trim() === '' ? null : Number(form.code),
            alphabet_code: form.alphabet_code.trim() || null,
            name: form.name.trim(),
            activity_id: form.activity_id,
            unit_id: form.unit_id || null,
            capacity: form.capacity.trim() === '' ? null : Math.round(Number(form.capacity)),
            start_effective_date: form.start_effective_date || null,
            end_effective_date: form.end_effective_date || null,
        };

        setIsSubmitting(true);
        try {
            if (modalMode() === 'create') {
                const res = await createClassCode(payload);
                if (res.success) {
                    toast.success('Class code created successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to create class code.');
                }
            } else {
                const target = selectedClassCode();
                if (!target?.id) return;
                const res = await updateClassCode(target.id, payload);
                if (res.success) {
                    toast.success('Class code updated successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to update class code.');
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
        const item = selectedClassCode();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await deleteClassCode(item.id);
            if (res.success) {
                toast.success(res.message || 'Class code deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete class code.');
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
        setSelectedStatus('all');
        setSortParam('name-asc');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + classCodes().length, totalData());

    const inputClass = 'w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-60';
    const labelClass = 'block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1';
    const filterClass = 'w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const tabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0';
    const activeBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    const expiredBadgeClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl">
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
                            <span class="font-medium text-neutral-900 dark:text-white">Class Code</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Class Codes
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Manage class groupings (kode kelas) per campaign activity: class names, letter codes, seat capacity and effective periods.
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
                            <span>New Class Code</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <A href="/administrator/academic/campaign/transaction/activity" class={tabClass}>
                        <span>Activities</span>
                    </A>
                    <A
                        href={basePath}
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0"
                    >
                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
                        </svg>
                        <span>Class Codes</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/grade" class={tabClass}>
                        <span>Grades</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/teach" class={tabClass}>
                        <span>Teaching Activities</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/teach-lecturer" class={tabClass}>
                        <span>Teach Lecturers</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/teach-evaluation" class={tabClass}>
                        <span>Evaluations</span>
                    </A>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Class Codes</span>
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
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Capacity</span>
                            <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().totalCapacity.toLocaleString()}
                            </span>
                            <span class="text-xs text-neutral-500">seats on this page</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Average Capacity</span>
                            <span class="text-xs font-mono text-neutral-500">per class</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().averageCapacity}
                            </span>
                            <span class="text-xs text-neutral-500">seats</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Activities</span>
                            <span class="text-xs font-mono text-neutral-500">{summaryStats().unitCount} units</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().activityCount}
                            </span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Search Input */}
                        <div class="md:col-span-5 relative">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                class={`${filterClass} pl-9`}
                                placeholder="Search by class name..."
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
                        <div class="md:col-span-4">
                            <select
                                class={filterClass}
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

                        {/* Status Filter */}
                        <div class="md:col-span-2">
                            <select
                                class={filterClass}
                                value={selectedStatus()}
                                onChange={(e) => {
                                    setSelectedStatus((e.target as HTMLSelectElement).value as any);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active Only</option>
                                <option value="expired">Expired Only</option>
                            </select>
                        </div>

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
                        <span>
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{classCodes().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> class codes
                        </span>

                        <div class="flex items-center gap-2">
                            <span>Sort:</span>
                            <select
                                class="p-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                value={sortParam()}
                                onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                            >
                                <option value="name-asc">Name (A-Z)</option>
                                <option value="name-desc">Name (Z-A)</option>
                                <option value="capacity-desc">Capacity (Highest)</option>
                                <option value="capacity-asc">Capacity (Lowest)</option>
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
                                        </div>
                                    )}
                                </For>
                            </div>
                        }
                    >
                        <Show
                            when={classCodes().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <div class="inline-flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200 dark:border-blue-800">
                                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M4 9h16M4 15h16M10 3 8 21M16 3l-2 18" />
                                        </svg>
                                    </div>
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                        No Class Codes Found
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no class code records matching your current filter criteria or database state.
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
                                            + Add Class Code
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
                                            <th class="px-4 py-3 font-semibold">Class</th>
                                            <th class="px-4 py-3 font-semibold">Campaign Activity</th>
                                            <th class="px-4 py-3 font-semibold text-center">Capacity</th>
                                            <th class="px-4 py-3 font-semibold">Effective Period</th>
                                            <th class="px-4 py-3 font-semibold text-center">Status</th>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={classCodes()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                    {/* Class */}
                                                    <td class="px-4 py-3.5 align-top">
                                                        <div class="flex items-start gap-3">
                                                            <span class="inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-xs text-sm font-mono font-bold border bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                                {item.alphabet_code || item.name.substring(0, 2)}
                                                            </span>
                                                            <div>
                                                                <A
                                                                    href={`${basePath}/${item.id}`}
                                                                    class="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono"
                                                                >
                                                                    {item.name}
                                                                </A>
                                                                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                                                                    <Show when={item.code !== null && item.code !== undefined}>
                                                                        <span class="text-[10px] font-mono text-neutral-500">Code: {item.code}</span>
                                                                    </Show>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => copyToClipboard(item.id, 'UUID')}
                                                                        class="px-1.5 py-0.5 rounded-xs text-[10px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                                                        title="Click to copy UUID"
                                                                    >
                                                                        {item.id.substring(0, 8)}...
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Campaign Activity */}
                                                    <td class="px-4 py-3.5 align-top font-mono">
                                                        <A
                                                            href={`/administrator/academic/campaign/transaction/activity/${item.activity_id}`}
                                                            class="font-medium text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                                        >
                                                            {activityName(item)}
                                                        </A>
                                                        <div class="mt-1">
                                                            <span class="px-1.5 py-0.5 rounded-xs text-[10px] bg-neutral-100 dark:bg-neutral-700/70 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                                                                {unitName(item)}
                                                            </span>
                                                        </div>
                                                    </td>

                                                    {/* Capacity */}
                                                    <td class="px-4 py-3.5 align-top text-center font-mono text-sm font-bold text-neutral-900 dark:text-white">
                                                        {item.capacity ?? '-'}
                                                    </td>

                                                    {/* Effective Period */}
                                                    <td class="px-4 py-3.5 align-top font-mono text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                        <div>From: {formatDate(item.start_effective_date)}</div>
                                                        <div class="text-[10px] text-neutral-500 mt-0.5">Until: {item.end_effective_date ? formatDate(item.end_effective_date) : 'No end date'}</div>
                                                    </td>

                                                    {/* Status */}
                                                    <td class="px-4 py-3.5 align-top text-center">
                                                        <span class={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${isActiveClassCode(item) ? activeBadgeClass : expiredBadgeClass}`}>
                                                            <span class={`size-1.5 rounded-full ${isActiveClassCode(item) ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                                                            {isActiveClassCode(item) ? 'ACTIVE' : 'EXPIRED'}
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
                                                                title="Edit Class Code"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Delete Class Code"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Cards View (< 768px) */}
                            <div class="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                                <For each={classCodes()}>
                                    {(item) => (
                                        <div class="p-4 space-y-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-700/20 transition-colors">
                                            <div class="flex items-start gap-3">
                                                <span class="inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xs text-sm font-mono font-bold border shrink-0 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                                                    {item.alphabet_code || item.name.substring(0, 2)}
                                                </span>
                                                <div class="flex-1 min-w-0">
                                                    <A
                                                        href={`${basePath}/${item.id}`}
                                                        class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                    >
                                                        {item.name}
                                                    </A>
                                                    <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                                                        {activityName(item)}
                                                    </div>
                                                </div>
                                                <span class={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${isActiveClassCode(item) ? activeBadgeClass : expiredBadgeClass}`}>
                                                    {isActiveClassCode(item) ? 'ACTIVE' : 'EXPIRED'}
                                                </span>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div class="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xs border border-neutral-200/80 dark:border-neutral-700/60 text-center font-mono">
                                                <div>
                                                    <span class="text-[10px] text-neutral-500 block">Capacity</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white">{item.capacity ?? '-'}</span>
                                                </div>
                                                <div class="min-w-0">
                                                    <span class="text-[10px] text-neutral-500 block">Unit</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white block truncate">{unitName(item)}</span>
                                                </div>
                                            </div>

                                            <div class="text-[11px] font-mono text-neutral-500">
                                                Effective {formatDate(item.start_effective_date)} - {item.end_effective_date ? formatDate(item.end_effective_date) : 'no end date'}
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
                                    )}
                                </For>
                            </div>
                        </Show>
                    </Show>
                </div>

                {/* Pagination Controls */}
                <Show when={totalPages() > 1}>
                    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-neutral-600 dark:text-neutral-400">
                        <div>
                            Page {currentPage()} of {totalPages()}
                        </div>
                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage() <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                class="px-3 py-1.5 rounded-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                ← Previous
                            </button>
                            <span class="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded-xs text-neutral-900 dark:text-white font-semibold">
                                {currentPage()}
                            </span>
                            <button
                                type="button"
                                disabled={currentPage() >= totalPages()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                                class="px-3 py-1.5 rounded-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                Next →
                            </button>
                        </div>
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
                                {modalMode() === 'create' ? 'New Class Code' : 'Update Class Code'}
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
                        {/* Unit & Activity */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class={labelClass}>Unit / Study Program</label>
                                <select
                                    class={inputClass}
                                    value={formState().unit_id}
                                    onChange={(e) => {
                                        const unitId = (e.target as HTMLSelectElement).value;
                                        setFormState({ ...formState(), unit_id: unitId, activity_id: '' });
                                        loadFormActivities(unitId);
                                    }}
                                >
                                    <option value="">Select Unit</option>
                                    <For each={unitOptions()}>
                                        {(u) => <option value={u.id}>{u.name}</option>}
                                    </For>
                                </select>
                            </div>

                            <div>
                                <label class={labelClass}>
                                    Campaign Activity <span class="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    class={inputClass}
                                    disabled={!formState().unit_id || isLoadingFormActivities()}
                                    value={formState().activity_id}
                                    onChange={(e) => updateForm('activity_id', (e.target as HTMLSelectElement).value)}
                                >
                                    <option value="">
                                        {!formState().unit_id
                                            ? 'Select a unit first'
                                            : isLoadingFormActivities()
                                                ? 'Loading activities...'
                                                : formActivityOptions().length === 0
                                                    ? 'No activities for this unit'
                                                    : 'Select Activity'}
                                    </option>
                                    <For each={formActivityOptions()}>
                                        {(a) => <option value={a.id} selected={a.id === formState().activity_id}>{a.name}</option>}
                                    </For>
                                </select>
                            </div>
                        </div>

                        {/* Name, Letter & Code */}
                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div class="sm:col-span-2">
                                <label class={labelClass}>
                                    Class Name <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    class={inputClass}
                                    placeholder="e.g. Kelas A"
                                    value={formState().name}
                                    onInput={(e) => updateForm('name', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Letter Code</label>
                                <input
                                    type="text"
                                    maxLength={5}
                                    class={inputClass}
                                    placeholder="e.g. A"
                                    value={formState().alphabet_code}
                                    onInput={(e) => updateForm('alphabet_code', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Code</label>
                                <input
                                    type="number"
                                    step="1"
                                    class={inputClass}
                                    placeholder="e.g. 1"
                                    value={formState().code}
                                    onInput={(e) => updateForm('code', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>

                        {/* Capacity & Effective Dates */}
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class={labelClass}>Capacity (Seats)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    class={inputClass}
                                    placeholder="e.g. 40"
                                    value={formState().capacity}
                                    onInput={(e) => updateForm('capacity', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Effective From</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().start_effective_date}
                                    onInput={(e) => updateForm('start_effective_date', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Effective Until</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().end_effective_date}
                                    onInput={(e) => updateForm('end_effective_date', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>
                        <p class="text-[10px] font-mono text-neutral-500">
                            Leave "Effective Until" empty to keep this class code active.
                        </p>
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create Class Code' : 'Update Class Code'}
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
                                Delete Class Code
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                This action cannot be reversed.
                            </p>
                        </div>
                    </div>

                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Are you sure you want to delete class code <strong class="text-neutral-900 dark:text-white">"{selectedClassCode()?.name}"</strong>? Teaching activities and student enrolments assigned to this class may be affected.
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
