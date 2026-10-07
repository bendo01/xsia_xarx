import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    listGrades,
    createGrade,
    updateGrade,
    deleteGrade,
    type GradeItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';

interface SelectOption {
    id: string;
    name: string;
}

interface GradeFormState {
    code: string;
    alphabet_code: string;
    name: string;
    grade: string;
    minimum: string;
    maximum: string;
    start_date: string;
    end_date: string;
    unit_id: string;
}

const emptyForm = (unitId = ''): GradeFormState => ({
    code: '',
    alphabet_code: '',
    name: '',
    grade: '',
    minimum: '',
    maximum: '',
    start_date: '',
    end_date: '',
    unit_id: unitId,
});

export default function AcademicCampaignTransactionGradePage() {
    const basePath = '/administrator/academic/campaign/transaction/grade';

    // Data States
    const [grades, setGrades] = createSignal<GradeItem[]>([]);
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
    const [sortParam, setSortParam] = createSignal('minimum-desc');

    // Reference Options
    const [unitOptions, setUnitOptions] = createSignal<SelectOption[]>([]);
    const unitNameMap = createMemo(() => new Map(unitOptions().map((u) => [u.id, u.name])));
    const unitName = (item: GradeItem) => item.unit_name || unitNameMap().get(item.unit_id) || 'Unit';

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedGrade, setSelectedGrade] = createSignal<GradeItem | null>(null);
    const [formState, setFormState] = createSignal<GradeFormState>(emptyForm());

    const updateForm = (field: keyof GradeFormState, value: string) => setFormState({ ...formState(), [field]: value });

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

    // A grade scale is active while it has no end date or the end date is still in the future
    const isActiveGrade = (item: GradeItem) => {
        if (!item.end_date) return true;
        return new Date(item.end_date).getTime() >= new Date(new Date().toDateString()).getTime();
    };

    // Fetch grades from API
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await listGrades({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                unit_id: selectedUnitId() || undefined,
            });

            let items = res.data || [];

            // Client-side status filtering
            if (selectedStatus() === 'active') {
                items = items.filter((g) => isActiveGrade(g));
            } else if (selectedStatus() === 'expired') {
                items = items.filter((g) => !isActiveGrade(g));
            }

            // Client-side sort
            items = [...items].sort((a, b) => {
                switch (sortParam()) {
                    case 'minimum-desc':
                        return (b.minimum || 0) - (a.minimum || 0);
                    case 'minimum-asc':
                        return (a.minimum || 0) - (b.minimum || 0);
                    case 'grade-desc':
                        return (b.grade || 0) - (a.grade || 0);
                    case 'name-asc':
                        return (a.name || '').localeCompare(b.name || '');
                    default:
                        return 0;
                }
            });

            setGrades(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
        } catch (error) {
            console.error('Error fetching grades:', error);
            toast.danger('Failed to load grade scales.');
            setGrades([]);
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
        toast.success('Grade records refreshed successfully.');
    };

    // Calculate Summary KPIs
    const summaryStats = createMemo(() => {
        const list = grades();
        let activeCount = 0;
        let topGrade = 0;
        let lowestPassing: number | null = null;
        const units = new Set<string>();

        for (const item of list) {
            if (isActiveGrade(item)) activeCount++;
            if ((item.grade || 0) > topGrade) topGrade = item.grade || 0;
            if ((item.grade || 0) > 0 && (lowestPassing === null || item.minimum < lowestPassing)) {
                lowestPassing = item.minimum;
            }
            if (item.unit_id) units.add(item.unit_id);
        }

        return {
            totalCount: totalData(),
            activeCount,
            topGrade,
            lowestPassing,
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

    const formatNumber = (n?: number | null, digits = 2) => (n === null || n === undefined ? '-' : Number(n).toFixed(digits));

    const gradeBadgeClass = (grade: number) => {
        if (grade >= 3.5) return 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
        if (grade >= 2.5) return 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
        if (grade >= 1.5) return 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        if (grade > 0) return 'bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800';
        return 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    };

    const rangeStyle = (item: GradeItem) => {
        const min = Math.max(0, Math.min(100, item.minimum || 0));
        const max = Math.max(min, Math.min(100, item.maximum || 0));
        return { left: `${min}%`, width: `${Math.max(1, max - min)}%` };
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    // Modal Openers
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedGrade(null);
        setFormState(emptyForm(selectedUnitId() || unitOptions()[0]?.id || ''));
        formDialogRef?.showModal();
    };

    const openEditModal = (item: GradeItem) => {
        setModalMode('edit');
        setSelectedGrade(item);
        setFormState({
            code: item.code !== null && item.code !== undefined ? String(item.code) : '',
            alphabet_code: item.alphabet_code || '',
            name: item.name || '',
            grade: String(item.grade ?? ''),
            minimum: String(item.minimum ?? ''),
            maximum: String(item.maximum ?? ''),
            start_date: formatDateForInput(item.start_date),
            end_date: formatDateForInput(item.end_date),
            unit_id: item.unit_id || '',
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: GradeItem) => {
        setSelectedGrade(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedGrade(null);
        setIsSubmitting(false);
    };

    // Form Submission
    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const form = formState();

        if (!form.name.trim()) {
            toast.danger('Grade name is required.');
            return;
        }
        if (!form.unit_id) {
            toast.danger('Unit is required.');
            return;
        }
        const grade = Number(form.grade);
        const minimum = Number(form.minimum);
        const maximum = Number(form.maximum);
        if ([form.grade, form.minimum, form.maximum].some((v) => v.trim() === '') || [grade, minimum, maximum].some(Number.isNaN)) {
            toast.danger('Grade point, minimum and maximum score are required numbers.');
            return;
        }
        if (minimum > maximum) {
            toast.danger('Minimum score cannot be greater than maximum score.');
            return;
        }
        if (form.start_date && form.end_date && form.start_date > form.end_date) {
            toast.danger('Start date cannot be after end date.');
            return;
        }

        const payload: Partial<GradeItem> = {
            code: form.code.trim() === '' ? null : Number(form.code),
            alphabet_code: form.alphabet_code.trim() || null,
            name: form.name.trim(),
            grade,
            minimum,
            maximum,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
            unit_id: form.unit_id,
        };

        setIsSubmitting(true);
        try {
            if (modalMode() === 'create') {
                const res = await createGrade(payload);
                if (res.success) {
                    toast.success('Grade scale created successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to create grade scale.');
                }
            } else {
                const target = selectedGrade();
                if (!target?.id) return;
                const res = await updateGrade(target.id, payload);
                if (res.success) {
                    toast.success('Grade scale updated successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to update grade scale.');
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
        const item = selectedGrade();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await deleteGrade(item.id);
            if (res.success) {
                toast.success(res.message || 'Grade scale deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete grade scale.');
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
        setSortParam('minimum-desc');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + grades().length, totalData());

    const inputClass = 'w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500';
    const labelClass = 'block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1';
    const filterClass = 'w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const tabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0';

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
                            <span class="font-medium text-neutral-900 dark:text-white">Grade</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Grade Scales
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Manage study program grading scales (skala nilai): letter codes, grade points, score ranges and validity periods.
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
                            <span>New Grade</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <A href="/administrator/academic/campaign/transaction/activity" class={tabClass}>
                        <span>Activities</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/class-code" class={tabClass}>
                        <span>Class Codes</span>
                    </A>
                    <A
                        href={basePath}
                        class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0"
                    >
                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
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
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Grades</span>
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
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Units Covered</span>
                            <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 21h18M5 21V7l7-4 7 4v14M9 9h1M9 13h1M14 9h1M14 13h1" />
                            </svg>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {summaryStats().unitCount}
                            </span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Top Grade Point</span>
                            <span class="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">max</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {formatNumber(summaryStats().topGrade)}
                            </span>
                            <span class="text-xs text-neutral-500">points</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Lowest Passing Score</span>
                            <span class="text-xs font-mono text-neutral-500">grade &gt; 0</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {formatNumber(summaryStats().lowestPassing)}
                            </span>
                            <span class="text-xs text-neutral-500">minimum score</span>
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
                                placeholder="Search by grade name..."
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
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{grades().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> grades
                        </span>

                        <div class="flex items-center gap-2">
                            <span>Sort:</span>
                            <select
                                class="p-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                value={sortParam()}
                                onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                            >
                                <option value="minimum-desc">Score (Highest)</option>
                                <option value="minimum-asc">Score (Lowest)</option>
                                <option value="grade-desc">Grade Point (Highest)</option>
                                <option value="name-asc">Name (A-Z)</option>
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
                            when={grades().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <div class="inline-flex size-14 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mb-3 border border-blue-200 dark:border-blue-800">
                                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                            <path d="M3 3v18h18" />
                                            <path d="m19 9-5 5-4-4-3 3" />
                                        </svg>
                                    </div>
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                        No Grade Scales Found
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no grade records matching your current filter criteria or database state.
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
                                            + Add Grade
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
                                            <th class="px-4 py-3 font-semibold">Letter</th>
                                            <th class="px-4 py-3 font-semibold">Grade & Unit</th>
                                            <th class="px-4 py-3 font-semibold text-center">Grade Point</th>
                                            <th class="px-4 py-3 font-semibold">Score Range</th>
                                            <th class="px-4 py-3 font-semibold">Validity</th>
                                            <th class="px-4 py-3 font-semibold text-center">Status</th>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={grades()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                    {/* Letter */}
                                                    <td class="px-4 py-3.5 align-top">
                                                        <span class={`inline-flex items-center justify-center min-w-9 h-9 px-2 rounded-xs text-sm font-mono font-bold border ${gradeBadgeClass(item.grade || 0)}`}>
                                                            {item.alphabet_code || item.name}
                                                        </span>
                                                    </td>

                                                    {/* Grade & Unit */}
                                                    <td class="px-4 py-3.5 align-top">
                                                        <A
                                                            href={`${basePath}/${item.id}`}
                                                            class="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono"
                                                        >
                                                            {item.name}
                                                        </A>
                                                        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                                                            <span class="px-1.5 py-0.5 rounded-xs text-[10px] font-mono bg-neutral-100 dark:bg-neutral-700/70 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                                                                {unitName(item)}
                                                            </span>
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
                                                    </td>

                                                    {/* Grade Point */}
                                                    <td class="px-4 py-3.5 align-top text-center font-mono text-sm font-bold text-neutral-900 dark:text-white">
                                                        {formatNumber(item.grade)}
                                                    </td>

                                                    {/* Score Range */}
                                                    <td class="px-4 py-3.5 align-top font-mono min-w-48">
                                                        <div class="flex items-center justify-between text-[11px] mb-1 text-neutral-600 dark:text-neutral-300">
                                                            <span>{formatNumber(item.minimum)}</span>
                                                            <span class="text-neutral-400">to</span>
                                                            <span>{formatNumber(item.maximum)}</span>
                                                        </div>
                                                        <div class="relative w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                                                            <div class="absolute h-full bg-blue-500 rounded-full" style={rangeStyle(item)}></div>
                                                        </div>
                                                    </td>

                                                    {/* Validity */}
                                                    <td class="px-4 py-3.5 align-top font-mono text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                        <div>From: {formatDate(item.start_date)}</div>
                                                        <div class="text-[10px] text-neutral-500 mt-0.5">Until: {item.end_date ? formatDate(item.end_date) : 'No end date'}</div>
                                                    </td>

                                                    {/* Status */}
                                                    <td class="px-4 py-3.5 align-top text-center">
                                                        <span
                                                            class={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                                isActiveGrade(item)
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                            }`}
                                                        >
                                                            <span class={`size-1.5 rounded-full ${isActiveGrade(item) ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                                                            {isActiveGrade(item) ? 'ACTIVE' : 'EXPIRED'}
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
                                                                title="Edit Grade"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Delete Grade"
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
                                <For each={grades()}>
                                    {(item) => (
                                        <div class="p-4 space-y-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-700/20 transition-colors">
                                            <div class="flex items-start gap-3">
                                                <span class={`inline-flex items-center justify-center min-w-10 h-10 px-2 rounded-xs text-sm font-mono font-bold border shrink-0 ${gradeBadgeClass(item.grade || 0)}`}>
                                                    {item.alphabet_code || item.name}
                                                </span>
                                                <div class="flex-1 min-w-0">
                                                    <A
                                                        href={`${basePath}/${item.id}`}
                                                        class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                    >
                                                        {item.name}
                                                    </A>
                                                    <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5 truncate">
                                                        {unitName(item)}
                                                    </div>
                                                </div>
                                                <span
                                                    class={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                                                        isActiveGrade(item)
                                                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                    }`}
                                                >
                                                    {isActiveGrade(item) ? 'ACTIVE' : 'EXPIRED'}
                                                </span>
                                            </div>

                                            {/* Metrics Grid */}
                                            <div class="grid grid-cols-3 gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xs border border-neutral-200/80 dark:border-neutral-700/60 text-center font-mono">
                                                <div>
                                                    <span class="text-[10px] text-neutral-500 block">Point</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white">{formatNumber(item.grade)}</span>
                                                </div>
                                                <div>
                                                    <span class="text-[10px] text-neutral-500 block">Min</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white">{formatNumber(item.minimum)}</span>
                                                </div>
                                                <div>
                                                    <span class="text-[10px] text-neutral-500 block">Max</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white">{formatNumber(item.maximum)}</span>
                                                </div>
                                            </div>

                                            <div class="text-[11px] font-mono text-neutral-500">
                                                Valid {formatDate(item.start_date)} - {item.end_date ? formatDate(item.end_date) : 'no end date'}
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
                                {modalMode() === 'create' ? 'New Grade Scale' : 'Update Grade Scale'}
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
                        {/* Unit */}
                        <div>
                            <label class={labelClass}>
                                Unit / Study Program <span class="text-red-500">*</span>
                            </label>
                            <select
                                required
                                class={inputClass}
                                value={formState().unit_id}
                                onChange={(e) => updateForm('unit_id', (e.target as HTMLSelectElement).value)}
                            >
                                <option value="">Select Unit</option>
                                <For each={unitOptions()}>
                                    {(u) => <option value={u.id}>{u.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Name, Letter & Code */}
                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div class="sm:col-span-2">
                                <label class={labelClass}>
                                    Grade Name <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    class={inputClass}
                                    placeholder="e.g. A"
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
                                    placeholder="e.g. A-"
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

                        {/* Grade Point & Score Range */}
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class={labelClass}>
                                    Grade Point <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    class={inputClass}
                                    placeholder="e.g. 4.00"
                                    value={formState().grade}
                                    onInput={(e) => updateForm('grade', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>
                                    Minimum Score <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    class={inputClass}
                                    placeholder="e.g. 85"
                                    value={formState().minimum}
                                    onInput={(e) => updateForm('minimum', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>
                                    Maximum Score <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="0.01"
                                    class={inputClass}
                                    placeholder="e.g. 100"
                                    value={formState().maximum}
                                    onInput={(e) => updateForm('maximum', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>

                        {/* Validity Dates */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class={labelClass}>Valid From</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().start_date}
                                    onInput={(e) => updateForm('start_date', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Valid Until</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().end_date}
                                    onInput={(e) => updateForm('end_date', (e.target as HTMLInputElement).value)}
                                />
                                <p class="mt-1 text-[10px] font-mono text-neutral-500">Leave empty to keep this scale active.</p>
                            </div>
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create Grade' : 'Update Grade'}
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
                                Delete Grade
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                This action cannot be reversed.
                            </p>
                        </div>
                    </div>

                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Are you sure you want to delete grade <strong class="text-neutral-900 dark:text-white">"{selectedGrade()?.name}"</strong> ({formatNumber(selectedGrade()?.minimum)} - {formatNumber(selectedGrade()?.maximum)})? Student scores using this scale may no longer resolve to a letter grade.
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
