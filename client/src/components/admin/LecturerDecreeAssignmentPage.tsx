import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import RemoteSearchSelect from '~/components/form/RemoteSearchSelect';
import {
    masterApiIndex,
    masterApiShow,
    masterApiCreate,
    masterApiUpdate,
    masterApiDelete,
} from '~/controllers/master/masterApiController';

/**
 * Shared administrator CRUD page for lecturer transaction records that assign a
 * reference value (rank, group, ...) to a lecturer through a decree with a validity period.
 * Used by academic/lecturer/transaction/academic-rank and academic-group.
 */
export interface LecturerDecreeAssignmentConfig {
    /** Server API path, e.g. 'academic/lecturer/transaction/academic-ranks' */
    apiPath: string;
    /** Reference API path for the assigned value, e.g. 'academic/lecturer/reference/ranks' */
    referenceApiPath: string;
    /** Foreign key column holding the assigned reference, e.g. 'rank_id' */
    referenceKey: string;
    /** Client route of this page */
    basePath: string;
    breadcrumb: string;
    title: string;
    description: string;
    /** Singular label of the assigned value, e.g. 'Rank' */
    referenceLabel: string;
    /** Singular label of a record, e.g. 'Academic Rank' */
    recordLabel: string;
}

interface DecreeAssignmentItem {
    id: string;
    decree_number?: string | null;
    decree_date?: string | null;
    lecturer_id: string;
    start_date?: string | null;
    end_date?: string | null;
    [key: string]: any;
}

interface ReferenceOption {
    id: string;
    name: string;
    code?: string | number | null;
}

interface LecturerOption {
    id: string;
    code?: string | null;
    name?: string | null;
}

interface FormState {
    lecturer_id: string;
    lecturer_label: string;
    reference_id: string;
    decree_number: string;
    decree_date: string;
    start_date: string;
    end_date: string;
}

const emptyForm = (): FormState => ({
    lecturer_id: '',
    lecturer_label: '',
    reference_id: '',
    decree_number: '',
    decree_date: '',
    start_date: '',
    end_date: '',
});

const lecturerTabs = [
    { label: 'Homebases', path: '/administrator/academic/lecturer/transaction/homebase' },
    { label: 'Academic Ranks', path: '/administrator/academic/lecturer/transaction/academic-rank' },
    { label: 'Academic Groups', path: '/administrator/academic/lecturer/transaction/academic-group' },
    { label: 'Lecturers', path: '/administrator/academic/lecturer/master/lecturer' },
];

const lecturerLabel = (l: LecturerOption) => (l.code ? `${l.name || '-'} (${l.code})` : l.name || l.id);

export default function LecturerDecreeAssignmentPage(props: { config: LecturerDecreeAssignmentConfig }) {
    const cfg = props.config;

    // Data States
    const [records, setRecords] = createSignal<DecreeAssignmentItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters & Sorting (lecturer is filtered server-side; the rest applies to the current page)
    const [filterLecturer, setFilterLecturer] = createSignal<{ id: string; label: string }>({ id: '', label: '' });
    const [selectedReferenceId, setSelectedReferenceId] = createSignal('');
    const [selectedStatus, setSelectedStatus] = createSignal<'all' | 'current' | 'ended'>('all');
    const [sortParam, setSortParam] = createSignal('decree-desc');

    // Reference Options & Lookups
    const [referenceOptions, setReferenceOptions] = createSignal<ReferenceOption[]>([]);
    const referenceNameMap = createMemo(() => new Map(referenceOptions().map((r) => [r.id, r.name])));
    const [lecturerNames, setLecturerNames] = createSignal<Record<string, string>>({});

    const referenceName = (item: DecreeAssignmentItem) =>
        item[cfg.referenceKey.replace(/_id$/, '_name')] || referenceNameMap().get(item[cfg.referenceKey]) || '-';
    const lecturerName = (item: DecreeAssignmentItem) =>
        lecturerNames()[item.lecturer_id] || `${item.lecturer_id.substring(0, 8)}...`;

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedRecord, setSelectedRecord] = createSignal<DecreeAssignmentItem | null>(null);
    const [formState, setFormState] = createSignal<FormState>(emptyForm());

    const updateForm = (field: keyof FormState, value: string) => setFormState({ ...formState(), [field]: value });

    const loadOptions = async () => {
        try {
            const res = await masterApiIndex<ReferenceOption>(cfg.referenceApiPath, { page: 1, per_page: 500 });
            setReferenceOptions(res.data || []);
        } catch (error) {
            console.warn(`Failed to load ${cfg.referenceLabel} options:`, error);
        }
    };

    // Resolve lecturer names for the rows on the current page (cached across pages)
    const resolveLecturerNames = async (items: DecreeAssignmentItem[]) => {
        const known = lecturerNames();
        const missing = [...new Set(items.map((i) => i.lecturer_id))].filter((id) => id && !(id in known));
        if (missing.length === 0) return;

        const results = await Promise.allSettled(missing.map((id) => masterApiShow<LecturerOption>('academic/lecturer/master/lecturers', id)));
        const resolved: Record<string, string> = {};
        results.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value.data) {
                resolved[missing[idx]] = lecturerLabel(r.value.data);
            }
        });
        setLecturerNames({ ...lecturerNames(), ...resolved });
    };

    // A record is current while it has no end date or the end date is still in the future
    const isCurrent = (item: DecreeAssignmentItem) => {
        if (!item.end_date) return true;
        return new Date(item.end_date).getTime() >= new Date(new Date().toDateString()).getTime();
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await masterApiIndex<DecreeAssignmentItem>(cfg.apiPath, {
                page: currentPage(),
                per_page: itemsPerPage(),
                lecturer_id: filterLecturer().id || undefined,
            });

            let items = res.data || [];

            if (selectedReferenceId()) {
                items = items.filter((i) => i[cfg.referenceKey] === selectedReferenceId());
            }
            if (selectedStatus() === 'current') {
                items = items.filter((i) => isCurrent(i));
            } else if (selectedStatus() === 'ended') {
                items = items.filter((i) => !isCurrent(i));
            }

            items = [...items].sort((a, b) => {
                switch (sortParam()) {
                    case 'decree-desc':
                        return (b.decree_date || '').localeCompare(a.decree_date || '');
                    case 'decree-asc':
                        return (a.decree_date || '').localeCompare(b.decree_date || '');
                    case 'start-desc':
                        return (b.start_date || '').localeCompare(a.start_date || '');
                    case 'reference-asc':
                        return referenceName(a).localeCompare(referenceName(b));
                    default:
                        return 0;
                }
            });

            setRecords(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
            resolveLecturerNames(items);
        } catch (error) {
            console.error(`Error fetching ${cfg.recordLabel} records:`, error);
            toast.danger(`Failed to load ${cfg.recordLabel.toLowerCase()} records.`);
            setRecords([]);
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
        filterLecturer();
        selectedReferenceId();
        selectedStatus();
        sortParam();
        fetchData();
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([loadOptions(), fetchData()]);
        toast.success(`${cfg.recordLabel} records refreshed successfully.`);
    };

    const summaryStats = createMemo(() => {
        const list = records();
        let currentCount = 0;
        let withDecree = 0;
        const lecturers = new Set<string>();
        const distribution = new Map<string, number>();

        for (const item of list) {
            if (isCurrent(item)) currentCount++;
            if (item.decree_number) withDecree++;
            lecturers.add(item.lecturer_id);
            const name = referenceName(item);
            distribution.set(name, (distribution.get(name) || 0) + 1);
        }

        const top = [...distribution.entries()].sort((a, b) => b[1] - a[1])[0];

        return {
            totalCount: totalData(),
            currentCount,
            withDecree,
            lecturerCount: lecturers.size,
            topReference: top ? top[0] : '-',
            topReferenceCount: top ? top[1] : 0,
        };
    });

    // Helpers
    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    const formatDateForInput = (d?: string | null) => (d ? d.substring(0, 10) : '');

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    // Modal Openers
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedRecord(null);
        setFormState({ ...emptyForm(), lecturer_id: filterLecturer().id, lecturer_label: filterLecturer().label });
        formDialogRef?.showModal();
    };

    const openEditModal = (item: DecreeAssignmentItem) => {
        setModalMode('edit');
        setSelectedRecord(item);
        setFormState({
            lecturer_id: item.lecturer_id,
            lecturer_label: lecturerName(item),
            reference_id: item[cfg.referenceKey] || '',
            decree_number: item.decree_number || '',
            decree_date: formatDateForInput(item.decree_date),
            start_date: formatDateForInput(item.start_date),
            end_date: formatDateForInput(item.end_date),
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: DecreeAssignmentItem) => {
        setSelectedRecord(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedRecord(null);
        setIsSubmitting(false);
    };

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const form = formState();

        if (!form.lecturer_id) {
            toast.danger('Lecturer is required.');
            return;
        }
        if (!form.reference_id) {
            toast.danger(`${cfg.referenceLabel} is required.`);
            return;
        }
        if (form.start_date && form.end_date && form.start_date > form.end_date) {
            toast.danger('Start date cannot be after end date.');
            return;
        }

        const payload = {
            lecturer_id: form.lecturer_id,
            [cfg.referenceKey]: form.reference_id,
            decree_number: form.decree_number.trim() || null,
            decree_date: form.decree_date || null,
            start_date: form.start_date || null,
            end_date: form.end_date || null,
        };

        setIsSubmitting(true);
        try {
            const target = selectedRecord();
            const res = modalMode() === 'create'
                ? await masterApiCreate(cfg.apiPath, payload)
                : target?.id
                    ? await masterApiUpdate(cfg.apiPath, target.id, payload)
                    : null;
            if (!res) return;

            if (res.success) {
                toast.success(`${cfg.recordLabel} ${modalMode() === 'create' ? 'created' : 'updated'} successfully!`);
                // Remember the lecturer label picked in the form so the table shows it immediately
                setLecturerNames({ ...lecturerNames(), [form.lecturer_id]: form.lecturer_label || lecturerNames()[form.lecturer_id] });
                closeFormModal();
                fetchData();
            } else {
                toast.danger(res.message || `Failed to save ${cfg.recordLabel.toLowerCase()}.`);
            }
        } catch (err: any) {
            toast.danger(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        const item = selectedRecord();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await masterApiDelete(cfg.apiPath, item.id);
            if (res.success) {
                toast.success(res.message || `${cfg.recordLabel} deleted successfully!`);
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || `Failed to delete ${cfg.recordLabel.toLowerCase()}.`);
            }
        } catch (err: any) {
            toast.danger(err.message || 'An error occurred while deleting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetFilters = () => {
        setFilterLecturer({ id: '', label: '' });
        setSelectedReferenceId('');
        setSelectedStatus('all');
        setSortParam('decree-desc');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + records().length, totalData());

    const inputClass = 'w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500';
    const labelClass = 'block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1';
    const filterClass = 'w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const tabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0';
    const activeTabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0';
    const currentBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
    const endedBadgeClass = 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700';

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
                            <span class="font-medium text-neutral-900 dark:text-white">{cfg.breadcrumb}</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            {cfg.title}
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            {cfg.description}
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
                            <span>New {cfg.recordLabel}</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <For each={lecturerTabs}>
                        {(tab) => (
                            <A href={tab.path} class={tab.path === cfg.basePath ? activeTabClass : tabClass}>
                                <span>{tab.label}</span>
                            </A>
                        )}
                    </For>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Records</span>
                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {summaryStats().currentCount} Current
                            </span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().totalCount}</span>
                            <span class="text-xs text-neutral-500">records</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Lecturers</span>
                            <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                            </svg>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().lecturerCount}</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Most Common {cfg.referenceLabel}</span>
                            <span class="text-xs font-mono text-neutral-500">{summaryStats().topReferenceCount}x</span>
                        </div>
                        <div class="mt-2 text-lg font-bold font-mono text-neutral-900 dark:text-white truncate" title={summaryStats().topReference}>
                            {summaryStats().topReference}
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">With Decree</span>
                            <span class="text-xs font-mono text-neutral-500">SK number</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().withDecree}</span>
                            <span class="text-xs text-neutral-500">of {records().length} on this page</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div class="md:col-span-5">
                            <RemoteSearchSelect<LecturerOption>
                                apiPath="academic/lecturer/master/lecturers"
                                value={filterLecturer().id}
                                selectedLabel={filterLecturer().label}
                                placeholder="Filter by lecturer (type a name)..."
                                class={`${filterClass} pr-8`}
                                getLabel={(l) => l.name || '-'}
                                getSublabel={(l) => l.code || ''}
                                onSelect={(l) => {
                                    setFilterLecturer(l ? { id: l.id, label: lecturerLabel(l) } : { id: '', label: '' });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>

                        <div class="md:col-span-4">
                            <select
                                class={filterClass}
                                value={selectedReferenceId()}
                                onChange={(e) => setSelectedReferenceId((e.target as HTMLSelectElement).value)}
                            >
                                <option value="">All {cfg.referenceLabel}s</option>
                                <For each={referenceOptions()}>
                                    {(r) => <option value={r.id}>{r.name}</option>}
                                </For>
                            </select>
                        </div>

                        <div class="md:col-span-2">
                            <select
                                class={filterClass}
                                value={selectedStatus()}
                                onChange={(e) => setSelectedStatus((e.target as HTMLSelectElement).value as any)}
                            >
                                <option value="all">All Status</option>
                                <option value="current">Current Only</option>
                                <option value="ended">Ended Only</option>
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
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{records().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> records
                        </span>

                        <div class="flex items-center gap-2">
                            <span>Sort:</span>
                            <select
                                class="p-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                value={sortParam()}
                                onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                            >
                                <option value="decree-desc">Decree Date (Newest)</option>
                                <option value="decree-asc">Decree Date (Oldest)</option>
                                <option value="start-desc">Start Date (Newest)</option>
                                <option value="reference-asc">{cfg.referenceLabel} (A-Z)</option>
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
                            when={records().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">
                                        No {cfg.recordLabel} Records Found
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no records matching your current filter criteria or database state.
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
                                            + Add {cfg.recordLabel}
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
                                            <th class="px-4 py-3 font-semibold">{cfg.referenceLabel}</th>
                                            <th class="px-4 py-3 font-semibold">Decree (SK)</th>
                                            <th class="px-4 py-3 font-semibold">Period</th>
                                            <th class="px-4 py-3 font-semibold text-center">Status</th>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={records()}>
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
                                                    <td class="px-4 py-3.5 align-top">
                                                        <span class="px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                            {referenceName(item)}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono">
                                                        <div class="font-medium text-neutral-800 dark:text-neutral-200">{item.decree_number || '-'}</div>
                                                        <div class="text-[10px] text-neutral-500 mt-0.5">{formatDate(item.decree_date)}</div>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono text-[11px] text-neutral-600 dark:text-neutral-400 whitespace-nowrap">
                                                        <div>From: {formatDate(item.start_date)}</div>
                                                        <div class="text-[10px] text-neutral-500 mt-0.5">Until: {item.end_date ? formatDate(item.end_date) : 'No end date'}</div>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top text-center">
                                                        <span class={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${isCurrent(item) ? currentBadgeClass : endedBadgeClass}`}>
                                                            <span class={`size-1.5 rounded-full ${isCurrent(item) ? 'bg-emerald-500' : 'bg-neutral-400'}`}></span>
                                                            {isCurrent(item) ? 'CURRENT' : 'ENDED'}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top text-right">
                                                        <div class="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title={`Edit ${cfg.recordLabel}`}
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title={`Delete ${cfg.recordLabel}`}
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
                                <For each={records()}>
                                    {(item) => (
                                        <div class="p-4 space-y-3">
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="flex-1 min-w-0">
                                                    <A
                                                        href={`/administrator/academic/lecturer/master/lecturer/${item.lecturer_id}`}
                                                        class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                    >
                                                        {lecturerName(item)}
                                                    </A>
                                                    <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                        {cfg.referenceLabel}: {referenceName(item)}
                                                    </div>
                                                </div>
                                                <span class={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${isCurrent(item) ? currentBadgeClass : endedBadgeClass}`}>
                                                    {isCurrent(item) ? 'CURRENT' : 'ENDED'}
                                                </span>
                                            </div>
                                            <div class="text-[11px] font-mono text-neutral-500 space-y-0.5">
                                                <div>SK: {item.decree_number || '-'} ({formatDate(item.decree_date)})</div>
                                                <div>Period: {formatDate(item.start_date)} - {item.end_date ? formatDate(item.end_date) : 'no end date'}</div>
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
                                {modalMode() === 'create' ? `New ${cfg.recordLabel}` : `Update ${cfg.recordLabel}`}
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
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                                    {cfg.referenceLabel} <span class="text-red-500">*</span>
                                </label>
                                <select
                                    required
                                    class={inputClass}
                                    value={formState().reference_id}
                                    onChange={(e) => updateForm('reference_id', (e.target as HTMLSelectElement).value)}
                                >
                                    <option value="">Select {cfg.referenceLabel}</option>
                                    <For each={referenceOptions()}>
                                        {(r) => <option value={r.id}>{r.name}</option>}
                                    </For>
                                </select>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class={labelClass}>Decree Number (SK)</label>
                                <input
                                    type="text"
                                    class={inputClass}
                                    placeholder="e.g. 123/SK/2026"
                                    value={formState().decree_number}
                                    onInput={(e) => updateForm('decree_number', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Decree Date</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().decree_date}
                                    onInput={(e) => updateForm('decree_date', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class={labelClass}>Start Date</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().start_date}
                                    onInput={(e) => updateForm('start_date', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>End Date</label>
                                <input
                                    type="date"
                                    class={inputClass}
                                    value={formState().end_date}
                                    onInput={(e) => updateForm('end_date', (e.target as HTMLInputElement).value)}
                                />
                                <p class="mt-1 text-[10px] font-mono text-neutral-500">Leave empty while the {cfg.referenceLabel.toLowerCase()} is still held.</p>
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? `Create ${cfg.recordLabel}` : `Update ${cfg.recordLabel}`}
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
                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">Delete {cfg.recordLabel}</h3>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Delete the {cfg.referenceLabel.toLowerCase()} <strong class="text-neutral-900 dark:text-white">"{selectedRecord() ? referenceName(selectedRecord()!) : ''}"</strong> record of{' '}
                        <strong class="text-neutral-900 dark:text-white">{selectedRecord() ? lecturerName(selectedRecord()!) : ''}</strong>? This action cannot be reversed.
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
