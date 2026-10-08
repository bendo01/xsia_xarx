import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import RemoteSearchSelect from '~/components/form/RemoteSearchSelect';
import {
    listTeachEvaluations,
    createTeachEvaluation,
    updateTeachEvaluation,
    deleteTeachEvaluation,
    type TeachEvaluationItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachEvaluationController';
import { masterApiIndex, masterApiShow } from '~/controllers/master/masterApiController';

interface ReferenceOption {
    id: string;
    name: string;
}

interface TeachOption {
    id: string;
    name?: string | null;
    course?: { name?: string | null; code?: string | null } | null;
    class_code?: { name?: string | null } | null;
    activity?: { name?: string | null } | null;
}

interface FormState {
    teach_id: string;
    teach_label: string;
    thread: string;
    name: string;
    english_name: string;
    evaluation_weight: string;
    evaluation_type_id: string;
}

const emptyForm = (): FormState => ({
    teach_id: '',
    teach_label: '',
    thread: '',
    name: '',
    english_name: '',
    evaluation_weight: '',
    evaluation_type_id: '',
});

const teachLabel = (t: TeachOption) => {
    const course = t.course?.name || t.name || 'Teach';
    const parts = [t.class_code?.name, t.activity?.name].filter(Boolean).join(' • ');
    return parts ? `${course} — ${parts}` : course;
};

const formatWeight = (w?: number | null) => (w === null || w === undefined ? '-' : `${Number(w.toFixed(2))}%`);

export default function AcademicCampaignTransactionTeachevaluationPage() {
    const basePath = '/administrator/academic/campaign/transaction/teach-evaluation';

    // Data States
    const [evaluations, setEvaluations] = createSignal<TeachEvaluationItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(25);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters (teach & name are server-side; type applies to the current page)
    const [filterTeach, setFilterTeach] = createSignal<{ id: string; label: string }>({ id: '', label: '' });
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedTypeId, setSelectedTypeId] = createSignal('');

    // Reference Options & Lookups
    const [typeOptions, setTypeOptions] = createSignal<ReferenceOption[]>([]);
    const typeMap = createMemo(() => new Map(typeOptions().map((t) => [t.id, t.name])));
    const [teachNames, setTeachNames] = createSignal<Record<string, string>>({});

    const typeName = (item: TeachEvaluationItem) => (item.evaluation_type_id ? typeMap().get(item.evaluation_type_id) || '-' : '-');
    const teachName = (item: TeachEvaluationItem) =>
        item.teach_id ? teachNames()[item.teach_id] || `${item.teach_id.substring(0, 8)}...` : '-';

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedEvaluation, setSelectedEvaluation] = createSignal<TeachEvaluationItem | null>(null);
    const [formState, setFormState] = createSignal<FormState>(emptyForm());

    const updateForm = (field: keyof FormState, value: string) => setFormState({ ...formState(), [field]: value });

    const loadOptions = async () => {
        try {
            const res = await masterApiIndex<ReferenceOption>('academic/course/reference/evaluation-types', { page: 1, per_page: 500 });
            setTypeOptions(res.data || []);
        } catch (error) {
            console.warn('Failed to load evaluation types:', error);
        }
    };

    // Resolve teach labels for the rows on the current page (cached across pages)
    const resolveTeachNames = async (items: TeachEvaluationItem[]) => {
        const known = teachNames();
        const missing = [...new Set(items.map((i) => i.teach_id))].filter((id): id is string => !!id && !(id in known));
        if (missing.length === 0) return;

        const results = await Promise.allSettled(missing.map((id) => masterApiShow<TeachOption>('academic/campaign/transaction/teaches', id)));
        const resolved: Record<string, string> = {};
        results.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value.data) resolved[missing[idx]] = teachLabel(r.value.data);
        });
        setTeachNames({ ...teachNames(), ...resolved });
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await listTeachEvaluations({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery() || undefined,
                teach_id: filterTeach().id || undefined,
            });

            let items = res.data || [];
            if (selectedTypeId()) items = items.filter((e) => e.evaluation_type_id === selectedTypeId());

            setEvaluations(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
            resolveTeachNames(items);
        } catch (error) {
            console.error('Error fetching teach evaluations:', error);
            toast.danger('Failed to load teach evaluations.');
            setEvaluations([]);
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
        filterTeach();
        searchQuery();
        selectedTypeId();
        fetchData();
    });

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
        toast.success('Teach evaluations refreshed successfully.');
    };

    // Weight composition is only meaningful when a single teaching class is selected
    const summaryStats = createMemo(() => {
        const list = evaluations();
        const teaches = new Set<string>();
        let totalWeight = 0;
        let synced = 0;
        const types = new Set<string>();

        for (const item of list) {
            if (item.teach_id) teaches.add(item.teach_id);
            if (item.evaluation_type_id) types.add(item.evaluation_type_id);
            if (item.feeder_id) synced++;
            totalWeight += Number(item.evaluation_weight) || 0;
        }

        return {
            totalCount: totalData(),
            teachCount: teaches.size,
            typeCount: types.size,
            synced,
            totalWeight: Math.round(totalWeight * 100) / 100,
        };
    });

    const isTeachSelected = () => !!filterTeach().id;
    const weightIsComplete = () => Math.abs(summaryStats().totalWeight - 100) < 0.01;

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    // Modal Openers
    const openCreateModal = () => {
        setModalMode('create');
        setSelectedEvaluation(null);
        const nextThread = evaluations().reduce((max, e) => Math.max(max, e.thread || 0), 0) + 1;
        setFormState({
            ...emptyForm(),
            teach_id: filterTeach().id,
            teach_label: filterTeach().label,
            thread: isTeachSelected() ? String(nextThread) : '',
            // Pre-fill the remaining weight so the class adds up to 100%
            evaluation_weight: isTeachSelected() && summaryStats().totalWeight < 100 ? String(Math.round((100 - summaryStats().totalWeight) * 100) / 100) : '',
        });
        formDialogRef?.showModal();
    };

    const openEditModal = (item: TeachEvaluationItem) => {
        setModalMode('edit');
        setSelectedEvaluation(item);
        setFormState({
            teach_id: item.teach_id || '',
            teach_label: teachName(item),
            thread: item.thread !== null && item.thread !== undefined ? String(item.thread) : '',
            name: item.name || '',
            english_name: item.english_name || '',
            evaluation_weight: item.evaluation_weight !== null && item.evaluation_weight !== undefined ? String(item.evaluation_weight) : '',
            evaluation_type_id: item.evaluation_type_id || '',
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: TeachEvaluationItem) => {
        setSelectedEvaluation(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedEvaluation(null);
        setIsSubmitting(false);
    };

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const form = formState();

        if (!form.teach_id) {
            toast.danger('Teaching class is required.');
            return;
        }
        if (!form.name.trim()) {
            toast.danger('Component name is required.');
            return;
        }
        const weight = Number(form.evaluation_weight);
        if (form.evaluation_weight.trim() === '' || Number.isNaN(weight) || weight < 0 || weight > 100) {
            toast.danger('Weight must be a number between 0 and 100.');
            return;
        }

        const payload = {
            teach_id: form.teach_id,
            thread: form.thread.trim() === '' ? undefined : Math.round(Number(form.thread)),
            name: form.name.trim(),
            english_name: form.english_name.trim() || undefined,
            evaluation_weight: weight,
            evaluation_type_id: form.evaluation_type_id || undefined,
        };

        setIsSubmitting(true);
        try {
            const target = selectedEvaluation();
            const res = modalMode() === 'create'
                ? await createTeachEvaluation(payload)
                : target?.id
                    ? await updateTeachEvaluation(target.id, payload)
                    : null;
            if (!res) return;

            if (!res.is_error) {
                toast.success(`Evaluation component ${modalMode() === 'create' ? 'created' : 'updated'} successfully!`);
                setTeachNames({ ...teachNames(), [form.teach_id]: form.teach_label || teachNames()[form.teach_id] });
                closeFormModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to save evaluation component.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        const item = selectedEvaluation();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await deleteTeachEvaluation(item.id);
            if (!res.is_error) {
                toast.success(res.message || 'Evaluation component deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete evaluation component.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An error occurred while deleting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetFilters = () => {
        setFilterTeach({ id: '', label: '' });
        setSearchQuery('');
        setSelectedTypeId('');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + evaluations().length, totalData());

    const inputClass = 'w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500';
    const labelClass = 'block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1';
    const filterClass = 'w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const tabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0';

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
                            <span class="font-medium text-neutral-900 dark:text-white">Teach Evaluation</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Teach Evaluations
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Manage evaluation components (komponen evaluasi) of each teaching class: order, name, type and grading weight.
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
                            <span>New Component</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <A href="/administrator/academic/campaign/transaction/activity" class={tabClass}><span>Activities</span></A>
                    <A href="/administrator/academic/campaign/transaction/class-code" class={tabClass}><span>Class Codes</span></A>
                    <A href="/administrator/academic/campaign/transaction/grade" class={tabClass}><span>Grades</span></A>
                    <A href="/administrator/academic/campaign/transaction/teach" class={tabClass}><span>Teaching Activities</span></A>
                    <A href="/administrator/academic/campaign/transaction/teach-decree" class={tabClass}><span>Teach Decrees</span></A>
                    <A href="/administrator/academic/campaign/transaction/teach-lecturer" class={tabClass}><span>Teach Lecturers</span></A>
                    <A href={basePath} class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0">
                        <span>Evaluations</span>
                    </A>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Components</span>
                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {summaryStats().synced} synced
                            </span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().totalCount}</span>
                            <span class="text-xs text-neutral-500">records</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Teaching Classes</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().teachCount}</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Evaluation Types</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().typeCount}</span>
                            <span class="text-xs text-neutral-500">in use on this page</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Weight Total</span>
                            <Show
                                when={isTeachSelected()}
                                fallback={<span class="text-[10px] font-mono text-neutral-500">select a class</span>}
                            >
                                <span class={`text-[10px] font-mono font-bold ${weightIsComplete() ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                    {weightIsComplete() ? 'COMPLETE' : summaryStats().totalWeight > 100 ? 'OVER 100%' : 'INCOMPLETE'}
                                </span>
                            </Show>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                                {isTeachSelected() ? formatWeight(summaryStats().totalWeight) : '-'}
                            </span>
                            <span class="text-xs text-neutral-500">of 100%</span>
                        </div>
                        <Show when={isTeachSelected()}>
                            <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
                                <div
                                    class={`h-full rounded-full transition-all duration-300 ${weightIsComplete() ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                    style={{ width: `${Math.min(100, summaryStats().totalWeight)}%` }}
                                ></div>
                            </div>
                        </Show>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div class="md:col-span-5">
                            <RemoteSearchSelect<TeachOption>
                                apiPath="academic/campaign/transaction/teaches"
                                value={filterTeach().id}
                                selectedLabel={filterTeach().label}
                                placeholder="Filter by teaching class (type a name)..."
                                class={`${filterClass} pr-8`}
                                getLabel={(t) => t.course?.name || t.name || 'Teach'}
                                getSublabel={(t) => [t.class_code?.name, t.activity?.name].filter(Boolean).join(' • ')}
                                onSelect={(t) => {
                                    setFilterTeach(t ? { id: t.id, label: teachLabel(t) } : { id: '', label: '' });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div class="md:col-span-4">
                            <input
                                type="text"
                                class={filterClass}
                                placeholder="Search component name..."
                                value={searchQuery()}
                                onInput={handleSearchInput}
                            />
                        </div>
                        <div class="md:col-span-2">
                            <select class={filterClass} value={selectedTypeId()} onChange={(e) => setSelectedTypeId((e.target as HTMLSelectElement).value)}>
                                <option value="">All Types</option>
                                <For each={typeOptions()}>{(t) => <option value={t.id}>{t.name}</option>}</For>
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
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{evaluations().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> components
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
                            when={evaluations().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">No Evaluation Components Found</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no evaluation components matching your current filter criteria or database state.
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
                                            + Add Component
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
                                            <th class="px-4 py-3 font-semibold text-center">#</th>
                                            <th class="px-4 py-3 font-semibold">Component</th>
                                            <th class="px-4 py-3 font-semibold">Type</th>
                                            <th class="px-4 py-3 font-semibold">Weight</th>
                                            <Show when={!isTeachSelected()}>
                                                <th class="px-4 py-3 font-semibold">Teaching Class</th>
                                            </Show>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={evaluations()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                    <td class="px-4 py-3.5 align-top text-center font-mono font-bold text-neutral-500">{item.thread ?? '-'}</td>
                                                    <td class="px-4 py-3.5 align-top">
                                                        <A href={`${basePath}/${item.id}`} class="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline font-mono">
                                                            {item.name || '-'}
                                                        </A>
                                                        <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                                                            <Show when={item.english_name}>
                                                                <span class="text-[10px] font-mono text-neutral-500 italic">{item.english_name}</span>
                                                            </Show>
                                                            <Show when={item.feeder_id}>
                                                                <span class="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">FEEDER</span>
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
                                                    <td class="px-4 py-3.5 align-top">
                                                        <span class="px-2 py-0.5 rounded-xs text-[11px] font-mono font-semibold bg-neutral-100 dark:bg-neutral-700/70 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                                                            {typeName(item)}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono min-w-36">
                                                        <div class="text-sm font-bold text-neutral-900 dark:text-white">{formatWeight(item.evaluation_weight)}</div>
                                                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-1 overflow-hidden">
                                                            <div class="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(100, Number(item.evaluation_weight) || 0)}%` }}></div>
                                                        </div>
                                                    </td>
                                                    <Show when={!isTeachSelected()}>
                                                        <td class="px-4 py-3.5 align-top font-mono">
                                                            <Show when={item.teach_id} fallback={<span class="text-neutral-400">-</span>}>
                                                                <A
                                                                    href={`/administrator/academic/campaign/transaction/teach/${item.teach_id}`}
                                                                    class="text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                                                >
                                                                    {teachName(item)}
                                                                </A>
                                                            </Show>
                                                        </td>
                                                    </Show>
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
                                                                title="Edit Component"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Delete Component"
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
                                <For each={evaluations()}>
                                    {(item) => (
                                        <div class="p-4 space-y-2">
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="min-w-0">
                                                    <A href={`${basePath}/${item.id}`} class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate">
                                                        {item.thread ? `${item.thread}. ` : ''}{item.name || '-'}
                                                    </A>
                                                    <div class="text-[11px] font-mono text-neutral-500">{typeName(item)}</div>
                                                </div>
                                                <span class="text-sm font-mono font-bold text-neutral-900 dark:text-white shrink-0">{formatWeight(item.evaluation_weight)}</span>
                                            </div>
                                            <Show when={!isTeachSelected()}>
                                                <div class="text-[11px] font-mono text-neutral-500 truncate">{teachName(item)}</div>
                                            </Show>
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
                                                <A href={`${basePath}/${item.id}`} class="px-2.5 py-1 font-mono text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-xs">
                                                    Detail →
                                                </A>
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
                    <div class="flex flex-col sm:flex-row items-center justify-between border rounded-lg border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-3">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Showing <span class="font-semibold text-neutral-900 dark:text-white">{totalData() > 0 ? startIndex() + 1 : 0}</span>–<span class="font-semibold text-neutral-900 dark:text-white">{endIndex()}</span> of <span class="font-semibold text-neutral-900 dark:text-white">{totalData().toLocaleString()}</span> components
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
                                {modalMode() === 'create' ? 'New Evaluation Component' : 'Update Evaluation Component'}
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
                                Teaching Class <span class="text-red-500">*</span>
                            </label>
                            <RemoteSearchSelect<TeachOption>
                                apiPath="academic/campaign/transaction/teaches"
                                value={formState().teach_id}
                                selectedLabel={formState().teach_label}
                                placeholder="Type a teaching class name..."
                                required
                                getLabel={(t) => t.course?.name || t.name || 'Teach'}
                                getSublabel={(t) => [t.class_code?.name, t.activity?.name].filter(Boolean).join(' • ')}
                                onSelect={(t) => setFormState({ ...formState(), teach_id: t?.id || '', teach_label: t ? teachLabel(t) : '' })}
                            />
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                                <label class={labelClass}>Order</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    class={inputClass}
                                    placeholder="e.g. 1"
                                    value={formState().thread}
                                    onInput={(e) => updateForm('thread', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div class="sm:col-span-3">
                                <label class={labelClass}>
                                    Component Name <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    class={inputClass}
                                    placeholder="e.g. Ujian Tengah Semester"
                                    value={formState().name}
                                    onInput={(e) => updateForm('name', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label class={labelClass}>English Name</label>
                            <input
                                type="text"
                                class={inputClass}
                                placeholder="e.g. Midterm Exam"
                                value={formState().english_name}
                                onInput={(e) => updateForm('english_name', (e.target as HTMLInputElement).value)}
                            />
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class={labelClass}>Evaluation Type</label>
                                <select class={inputClass} value={formState().evaluation_type_id} onChange={(e) => updateForm('evaluation_type_id', (e.target as HTMLSelectElement).value)}>
                                    <option value="">Select Type</option>
                                    <For each={typeOptions()}>{(t) => <option value={t.id}>{t.name}</option>}</For>
                                </select>
                            </div>
                            <div>
                                <label class={labelClass}>
                                    Weight (%) <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    max="100"
                                    step="0.01"
                                    class={inputClass}
                                    placeholder="e.g. 30"
                                    value={formState().evaluation_weight}
                                    onInput={(e) => updateForm('evaluation_weight', (e.target as HTMLInputElement).value)}
                                />
                                <p class="mt-1 text-[10px] font-mono text-neutral-500">All components of one class should add up to 100%.</p>
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create Component' : 'Update Component'}
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
                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">Delete Evaluation Component</h3>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Delete <strong class="text-neutral-900 dark:text-white">"{selectedEvaluation()?.name}"</strong> ({formatWeight(selectedEvaluation()?.evaluation_weight)})? Student scores recorded for this component may be affected, and the class weight total will no longer add up to 100%. This action cannot be reversed.
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
