import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import RemoteSearchSelect from '~/components/form/RemoteSearchSelect';
import {
    masterApiIndex,
    masterApiCreate,
    masterApiUpdate,
    masterApiDelete,
} from '~/controllers/master/masterApiController';
import type { AcademicLecturerTransactionHomebase } from '~/models/academic/lecturer/transaction/Homebase';

interface ReferenceOption {
    id: string;
    name: string;
}

interface UnitOption extends ReferenceOption {
    institution_id: string;
}

interface LecturerOption {
    id: string;
    code?: string | null;
    name?: string | null;
}

type HomebaseItem = AcademicLecturerTransactionHomebase & { lecturer_name?: string | null };

interface FormState {
    lecturer_id: string;
    lecturer_label: string;
    unit_id: string;
    status_id: string;
    contract_id: string;
}

const emptyForm = (): FormState => ({
    lecturer_id: '',
    lecturer_label: '',
    unit_id: '',
    status_id: '',
    contract_id: '',
});

const lecturerTabs = [
    { label: 'Homebases', path: '/administrator/academic/lecturer/transaction/homebase' },
    { label: 'Academic Ranks', path: '/administrator/academic/lecturer/transaction/academic-rank' },
    { label: 'Academic Groups', path: '/administrator/academic/lecturer/transaction/academic-group' },
    { label: 'Lecturers', path: '/administrator/academic/lecturer/master/lecturer' },
];

const lecturerLabel = (l: LecturerOption) => (l.code ? `${l.name || '-'} (${l.code})` : l.name || l.id);

export default function AcademicLecturerTransactionHomebasePage() {
    const basePath = '/administrator/academic/lecturer/transaction/homebase';
    const apiPath = 'academic/lecturer/transaction/homebases';

    // Data States
    const [homebases, setHomebases] = createSignal<HomebaseItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters (search & unit are server-side; status & contract apply to the current page)
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedUnitId, setSelectedUnitId] = createSignal('');
    const [selectedStatusId, setSelectedStatusId] = createSignal('');
    const [selectedContractId, setSelectedContractId] = createSignal('');

    // Reference Options
    const [unitOptions, setUnitOptions] = createSignal<UnitOption[]>([]);
    const [statusOptions, setStatusOptions] = createSignal<ReferenceOption[]>([]);
    const [contractOptions, setContractOptions] = createSignal<ReferenceOption[]>([]);
    const unitMap = createMemo(() => new Map(unitOptions().map((u) => [u.id, u])));
    const statusMap = createMemo(() => new Map(statusOptions().map((s) => [s.id, s.name])));
    const contractMap = createMemo(() => new Map(contractOptions().map((c) => [c.id, c.name])));

    const unitName = (item: HomebaseItem) => item.unit_name || unitMap().get(item.unit_id)?.name || '-';
    const statusName = (item: HomebaseItem) => item.status_name || statusMap().get(item.status_id) || '-';
    const contractName = (item: HomebaseItem) => item.contract_name || contractMap().get(item.contract_id) || '-';
    const lecturerName = (item: HomebaseItem) => item.lecturer_name || `${item.lecturer_id.substring(0, 8)}...`;

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedHomebase, setSelectedHomebase] = createSignal<HomebaseItem | null>(null);
    const [formState, setFormState] = createSignal<FormState>(emptyForm());

    const updateForm = (field: keyof FormState, value: string) => setFormState({ ...formState(), [field]: value });

    const loadOptions = async () => {
        const [units, statuses, contracts] = await Promise.allSettled([
            masterApiIndex<UnitOption>('institution/master/units', { page: 1, per_page: 500 }),
            masterApiIndex<ReferenceOption>('academic/lecturer/reference/statuses', { page: 1, per_page: 500 }),
            masterApiIndex<ReferenceOption>('academic/lecturer/reference/contracts', { page: 1, per_page: 500 }),
        ]);
        if (units.status === 'fulfilled') {
            setUnitOptions([...(units.value.data || [])].sort((a, b) => (a.name || '').localeCompare(b.name || '')));
        }
        if (statuses.status === 'fulfilled') setStatusOptions(statuses.value.data || []);
        if (contracts.status === 'fulfilled') setContractOptions(contracts.value.data || []);
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await masterApiIndex<HomebaseItem>(apiPath, {
                page: currentPage(),
                per_page: itemsPerPage(),
                search: searchQuery() || undefined,
                unit_id: selectedUnitId() || undefined,
            });

            let items = res.data || [];
            if (selectedStatusId()) items = items.filter((h) => h.status_id === selectedStatusId());
            if (selectedContractId()) items = items.filter((h) => h.contract_id === selectedContractId());
            items = [...items].sort((a, b) => lecturerName(a).localeCompare(lecturerName(b)));

            setHomebases(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
        } catch (error) {
            console.error('Error fetching homebases:', error);
            toast.danger('Failed to load lecturer homebases.');
            setHomebases([]);
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
        selectedStatusId();
        selectedContractId();
        fetchData();
    });

    // Debounced search (server matches lecturer name or code)
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
        toast.success('Homebase records refreshed successfully.');
    };

    // Distribution of statuses and contracts on the current page
    const summaryStats = createMemo(() => {
        const list = homebases();
        const units = new Set<string>();
        const byStatus = new Map<string, number>();
        const byContract = new Map<string, number>();

        for (const item of list) {
            units.add(item.unit_id);
            byStatus.set(statusName(item), (byStatus.get(statusName(item)) || 0) + 1);
            byContract.set(contractName(item), (byContract.get(contractName(item)) || 0) + 1);
        }

        const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1])[0] || ['-', 0];

        return {
            totalCount: totalData(),
            unitCount: units.size,
            topStatus: top(byStatus),
            topContract: top(byContract),
        };
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    // Modal Openers
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedHomebase(null);
        setFormState({ ...emptyForm(), unit_id: selectedUnitId() });
        formDialogRef?.showModal();
    };

    const openEditModal = (item: HomebaseItem) => {
        setModalMode('edit');
        setSelectedHomebase(item);
        setFormState({
            lecturer_id: item.lecturer_id,
            lecturer_label: lecturerName(item),
            unit_id: item.unit_id,
            status_id: item.status_id,
            contract_id: item.contract_id,
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: HomebaseItem) => {
        setSelectedHomebase(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedHomebase(null);
        setIsSubmitting(false);
    };

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const form = formState();

        if (!form.lecturer_id || !form.unit_id || !form.status_id || !form.contract_id) {
            toast.danger('Lecturer, unit, status and contract are all required.');
            return;
        }

        // The homebase institution always follows the selected unit
        const institutionId = unitMap().get(form.unit_id)?.institution_id || selectedHomebase()?.institution_id;
        if (!institutionId) {
            toast.danger('Could not determine the institution of the selected unit.');
            return;
        }

        const payload = {
            lecturer_id: form.lecturer_id,
            unit_id: form.unit_id,
            institution_id: institutionId,
            status_id: form.status_id,
            contract_id: form.contract_id,
        };

        setIsSubmitting(true);
        try {
            const target = selectedHomebase();
            const res = modalMode() === 'create'
                ? await masterApiCreate(apiPath, payload)
                : target?.id
                    ? await masterApiUpdate(apiPath, target.id, payload)
                    : null;
            if (!res) return;

            if (res.success) {
                toast.success(`Homebase ${modalMode() === 'create' ? 'created' : 'updated'} successfully!`);
                closeFormModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to save homebase.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        const item = selectedHomebase();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await masterApiDelete(apiPath, item.id);
            if (res.success) {
                toast.success(res.message || 'Homebase deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete homebase.');
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
        setSelectedStatusId('');
        setSelectedContractId('');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + homebases().length, totalData());

    const inputClass = 'w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500';
    const labelClass = 'block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1';
    const filterClass = 'w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const tabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0';
    const activeTabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0';

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
                            <span>Lecturer</span>
                            <span>/</span>
                            <span>Transaction</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Homebase</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Lecturer Homebases
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Manage each lecturer's homebase study program, employment status and contract type.
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
                            <span>New Homebase</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <For each={lecturerTabs}>
                        {(tab) => (
                            <A href={tab.path} class={tab.path === basePath ? activeTabClass : tabClass}>
                                <span>{tab.label}</span>
                            </A>
                        )}
                    </For>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Homebases</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().totalCount}</span>
                            <span class="text-xs text-neutral-500">records</span>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Units</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().unitCount}</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Most Common Status</span>
                            <span class="text-xs font-mono text-neutral-500">{summaryStats().topStatus[1]}x</span>
                        </div>
                        <div class="mt-2 text-lg font-bold font-mono text-neutral-900 dark:text-white truncate">{summaryStats().topStatus[0]}</div>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Most Common Contract</span>
                            <span class="text-xs font-mono text-neutral-500">{summaryStats().topContract[1]}x</span>
                        </div>
                        <div class="mt-2 text-lg font-bold font-mono text-neutral-900 dark:text-white truncate">{summaryStats().topContract[0]}</div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div class="md:col-span-4 relative">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                class={`${filterClass} pl-9`}
                                placeholder="Search lecturer name or code..."
                                value={searchQuery()}
                                onInput={handleSearchInput}
                            />
                        </div>
                        <div class="md:col-span-3">
                            <select
                                class={filterClass}
                                value={selectedUnitId()}
                                onChange={(e) => {
                                    setSelectedUnitId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="">All Units</option>
                                <For each={unitOptions()}>{(u) => <option value={u.id}>{u.name}</option>}</For>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <select class={filterClass} value={selectedStatusId()} onChange={(e) => setSelectedStatusId((e.target as HTMLSelectElement).value)}>
                                <option value="">All Statuses</option>
                                <For each={statusOptions()}>{(s) => <option value={s.id}>{s.name}</option>}</For>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <select class={filterClass} value={selectedContractId()} onChange={(e) => setSelectedContractId((e.target as HTMLSelectElement).value)}>
                                <option value="">All Contracts</option>
                                <For each={contractOptions()}>{(c) => <option value={c.id}>{c.name}</option>}</For>
                            </select>
                        </div>
                        <div class="md:col-span-1">
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
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{homebases().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> homebases
                        </span>
                        <div class="flex items-center gap-2">
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
                            when={homebases().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">No Homebases Found</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no homebase records matching your current filter criteria or database state.
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
                                            + Add Homebase
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
                                            <th class="px-4 py-3 font-semibold">Lecturer</th>
                                            <th class="px-4 py-3 font-semibold">Homebase Unit</th>
                                            <th class="px-4 py-3 font-semibold">Status</th>
                                            <th class="px-4 py-3 font-semibold">Contract</th>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={homebases()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                    <td class="px-4 py-3.5 align-top">
                                                        <A
                                                            href={`/administrator/academic/lecturer/master/lecturer/${item.lecturer_id}`}
                                                            class="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono"
                                                        >
                                                            {lecturerName(item)}
                                                        </A>
                                                        <div class="mt-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(item.id, 'UUID')}
                                                                class="px-1.5 py-0.5 rounded-xs text-[10px] font-mono text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                                                title="Click to copy record UUID"
                                                            >
                                                                {item.id.substring(0, 8)}...
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono font-medium text-neutral-800 dark:text-neutral-200">{unitName(item)}</td>
                                                    <td class="px-4 py-3.5 align-top">
                                                        <span class="px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            {statusName(item)}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top">
                                                        <span class="px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                            {contractName(item)}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top text-right">
                                                        <div class="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Edit Homebase"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Delete Homebase"
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
                                <For each={homebases()}>
                                    {(item) => (
                                        <div class="p-4 space-y-2">
                                            <A
                                                href={`/administrator/academic/lecturer/master/lecturer/${item.lecturer_id}`}
                                                class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                            >
                                                {lecturerName(item)}
                                            </A>
                                            <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">{unitName(item)}</div>
                                            <div class="flex flex-wrap gap-1.5 text-[10px] font-mono">
                                                <span class="px-1.5 py-0.5 rounded-xs bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">{statusName(item)}</span>
                                                <span class="px-1.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">{contractName(item)}</span>
                                            </div>
                                            <div class="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/60 text-xs">
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
                        <div>Page {currentPage()} of {totalPages()}</div>
                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage() <= 1}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                class="px-3 py-1.5 rounded-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors disabled:opacity-50 cursor-pointer"
                            >
                                ← Previous
                            </button>
                            <span class="px-2 py-1 bg-neutral-200 dark:bg-neutral-700 rounded-xs text-neutral-900 dark:text-white font-semibold">{currentPage()}</span>
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
                                {modalMode() === 'create' ? 'New Homebase' : 'Update Homebase'}
                            </h3>
                        </div>
                        <button type="button" onClick={closeFormModal} class="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded-xs cursor-pointer">
                            <svg class="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>

                    <div class="space-y-4 px-1">
                        <div>
                            <label class={labelClass}>
                                Lecturer <span class="text-red-500">*</span>
                            </label>
                            <RemoteSearchSelect<LecturerOption>
                                apiPath="academic/lecturer/master/lecturers"
                                value={formState().lecturer_id}
                                selectedLabel={formState().lecturer_label}
                                placeholder="Type a lecturer name..."
                                required
                                getLabel={(l) => l.name || '-'}
                                getSublabel={(l) => l.code || ''}
                                onSelect={(l) => setFormState({ ...formState(), lecturer_id: l?.id || '', lecturer_label: l ? lecturerLabel(l) : '' })}
                            />
                        </div>

                        <div>
                            <label class={labelClass}>
                                Homebase Unit <span class="text-red-500">*</span>
                            </label>
                            <select required class={inputClass} value={formState().unit_id} onChange={(e) => updateForm('unit_id', (e.target as HTMLSelectElement).value)}>
                                <option value="">Select Unit</option>
                                <For each={unitOptions()}>{(u) => <option value={u.id}>{u.name}</option>}</For>
                            </select>
                            <p class="mt-1 text-[10px] font-mono text-neutral-500">The institution is taken from the selected unit.</p>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class={labelClass}>
                                    Employment Status <span class="text-red-500">*</span>
                                </label>
                                <select required class={inputClass} value={formState().status_id} onChange={(e) => updateForm('status_id', (e.target as HTMLSelectElement).value)}>
                                    <option value="">Select Status</option>
                                    <For each={statusOptions()}>{(s) => <option value={s.id}>{s.name}</option>}</For>
                                </select>
                            </div>
                            <div>
                                <label class={labelClass}>
                                    Contract Type <span class="text-red-500">*</span>
                                </label>
                                <select required class={inputClass} value={formState().contract_id} onChange={(e) => updateForm('contract_id', (e.target as HTMLSelectElement).value)}>
                                    <option value="">Select Contract</option>
                                    <For each={contractOptions()}>{(c) => <option value={c.id}>{c.name}</option>}</For>
                                </select>
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create Homebase' : 'Update Homebase'}
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
                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">Delete Homebase</h3>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Delete the homebase of <strong class="text-neutral-900 dark:text-white">{selectedHomebase() ? lecturerName(selectedHomebase()!) : ''}</strong> at{' '}
                        <strong class="text-neutral-900 dark:text-white">{selectedHomebase() ? unitName(selectedHomebase()!) : ''}</strong>? This action cannot be reversed.
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
