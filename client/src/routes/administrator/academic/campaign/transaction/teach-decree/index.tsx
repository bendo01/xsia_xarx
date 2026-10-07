import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
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
import type { AcademicCampaignTransactionTeachDecree } from '~/models/academic/campaign/transaction/TeachDecree';

interface ActivityOption {
    id: string;
    name: string;
    unit_name?: string | null;
    academic_year_name?: string | null;
}

interface StaffOption {
    id: string;
    code?: string | null;
    name?: string | null;
}

type TeachDecreeItem = Omit<AcademicCampaignTransactionTeachDecree, 'staff_id'> & { staff_id: string | null };

interface FormState {
    decree_number: string;
    decree_date: string;
    activity_id: string;
    activity_label: string;
    staff_id: string;
    staff_label: string;
}

const emptyForm = (): FormState => ({
    decree_number: '',
    decree_date: '',
    activity_id: '',
    activity_label: '',
    staff_id: '',
    staff_label: '',
});

const activityLabel = (a: ActivityOption) => {
    const meta = [a.unit_name, a.academic_year_name].filter(Boolean).join(' • ');
    return meta ? `${a.name} (${meta})` : a.name;
};
const staffLabel = (s: StaffOption) => (s.code ? `${s.name || '-'} (${s.code})` : s.name || s.id);

export default function AcademicCampaignTransactionTeachdecreePage() {
    const basePath = '/administrator/academic/campaign/transaction/teach-decree';
    const apiPath = 'academic/campaign/transaction/teach-decrees';

    // Data States
    const [decrees, setDecrees] = createSignal<TeachDecreeItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters (activity is server-side; decree number & year apply to the current page)
    const [filterActivity, setFilterActivity] = createSignal<{ id: string; label: string }>({ id: '', label: '' });
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedYear, setSelectedYear] = createSignal('');
    const [sortParam, setSortParam] = createSignal('date-desc');

    // Name lookups for related records (cached across pages)
    const [activityNames, setActivityNames] = createSignal<Record<string, string>>({});
    const [staffNames, setStaffNames] = createSignal<Record<string, string>>({});

    const activityName = (item: TeachDecreeItem) => activityNames()[item.activity_id] || `${item.activity_id.substring(0, 8)}...`;
    const staffName = (item: TeachDecreeItem) => (item.staff_id ? staffNames()[item.staff_id] || `${item.staff_id.substring(0, 8)}...` : '-');

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedDecree, setSelectedDecree] = createSignal<TeachDecreeItem | null>(null);
    const [formState, setFormState] = createSignal<FormState>(emptyForm());

    const updateForm = (field: keyof FormState, value: string) => setFormState({ ...formState(), [field]: value });

    // Resolve activity and staff names for the rows on the current page
    const resolveNames = async (items: TeachDecreeItem[]) => {
        const knownActivities = activityNames();
        const knownStaff = staffNames();
        const missingActivities = [...new Set(items.map((i) => i.activity_id))].filter((id) => id && !(id in knownActivities));
        const missingStaff = [...new Set(items.map((i) => i.staff_id))].filter((id): id is string => !!id && !(id in knownStaff));

        const [activityResults, staffResults] = await Promise.all([
            Promise.allSettled(missingActivities.map((id) => masterApiShow<ActivityOption>('academic/campaign/transaction/activities', id))),
            Promise.allSettled(missingStaff.map((id) => masterApiShow<StaffOption>('institution/master/staffes', id))),
        ]);

        const resolvedActivities: Record<string, string> = {};
        activityResults.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value.data) resolvedActivities[missingActivities[idx]] = activityLabel(r.value.data);
        });
        const resolvedStaff: Record<string, string> = {};
        staffResults.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value.data) resolvedStaff[missingStaff[idx]] = staffLabel(r.value.data);
        });

        setActivityNames({ ...activityNames(), ...resolvedActivities });
        setStaffNames({ ...staffNames(), ...resolvedStaff });
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await masterApiIndex<TeachDecreeItem>(apiPath, {
                page: currentPage(),
                per_page: itemsPerPage(),
                activity_id: filterActivity().id || undefined,
            });

            let items = res.data || [];
            const q = searchQuery().toLowerCase();
            if (q) items = items.filter((d) => (d.decree_number || '').toLowerCase().includes(q));
            if (selectedYear()) items = items.filter((d) => (d.decree_date || '').startsWith(selectedYear()));

            items = [...items].sort((a, b) => {
                switch (sortParam()) {
                    case 'date-desc':
                        return (b.decree_date || '').localeCompare(a.decree_date || '');
                    case 'date-asc':
                        return (a.decree_date || '').localeCompare(b.decree_date || '');
                    case 'number-asc':
                        return (a.decree_number || '').localeCompare(b.decree_number || '', undefined, { numeric: true });
                    default:
                        return 0;
                }
            });

            setDecrees(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
            resolveNames(items);
        } catch (error) {
            console.error('Error fetching teach decrees:', error);
            toast.danger('Failed to load teaching decrees.');
            setDecrees([]);
            setTotalData(0);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    createEffect(() => {
        currentPage();
        itemsPerPage();
        filterActivity();
        searchQuery();
        selectedYear();
        sortParam();
        fetchData();
    });

    let searchTimeout: any;
    const handleSearchInput = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => setSearchQuery(val.trim()), 300);
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        toast.success('Teaching decrees refreshed successfully.');
    };

    // Years offered in the filter: current year and the previous nine
    const yearOptions = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

    const summaryStats = createMemo(() => {
        const list = decrees();
        const thisYear = String(new Date().getFullYear());
        const activities = new Set<string>();
        let thisYearCount = 0;
        let withSigner = 0;
        let latest = '';

        for (const item of list) {
            activities.add(item.activity_id);
            if ((item.decree_date || '').startsWith(thisYear)) thisYearCount++;
            if (item.staff_id) withSigner++;
            if ((item.decree_date || '') > latest) latest = item.decree_date;
        }

        return { totalCount: totalData(), activityCount: activities.size, thisYearCount, withSigner, latest };
    });

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
        setSelectedDecree(null);
        setFormState({ ...emptyForm(), activity_id: filterActivity().id, activity_label: filterActivity().label });
        formDialogRef?.showModal();
    };

    const openEditModal = (item: TeachDecreeItem) => {
        setModalMode('edit');
        setSelectedDecree(item);
        setFormState({
            decree_number: item.decree_number || '',
            decree_date: formatDateForInput(item.decree_date),
            activity_id: item.activity_id,
            activity_label: activityName(item),
            staff_id: item.staff_id || '',
            staff_label: item.staff_id ? staffName(item) : '',
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: TeachDecreeItem) => {
        setSelectedDecree(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedDecree(null);
        setIsSubmitting(false);
    };

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();
        const form = formState();

        if (!form.decree_number.trim() || !form.decree_date) {
            toast.danger('Decree number and decree date are required.');
            return;
        }
        if (!form.activity_id) {
            toast.danger('Campaign activity is required.');
            return;
        }

        const payload = {
            decree_number: form.decree_number.trim(),
            decree_date: form.decree_date,
            activity_id: form.activity_id,
            staff_id: form.staff_id || null,
        };

        setIsSubmitting(true);
        try {
            const target = selectedDecree();
            const res = modalMode() === 'create'
                ? await masterApiCreate(apiPath, payload)
                : target?.id
                    ? await masterApiUpdate(apiPath, target.id, payload)
                    : null;
            if (!res) return;

            if (res.success) {
                toast.success(`Teaching decree ${modalMode() === 'create' ? 'created' : 'updated'} successfully!`);
                // Remember labels picked in the form so the table shows them immediately
                setActivityNames({ ...activityNames(), [form.activity_id]: form.activity_label || activityNames()[form.activity_id] });
                if (form.staff_id) setStaffNames({ ...staffNames(), [form.staff_id]: form.staff_label || staffNames()[form.staff_id] });
                closeFormModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to save teaching decree.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An unexpected error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        const item = selectedDecree();
        if (!item?.id) return;

        setIsSubmitting(true);
        try {
            const res = await masterApiDelete(apiPath, item.id);
            if (res.success) {
                toast.success(res.message || 'Teaching decree deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete teaching decree.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An error occurred while deleting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetFilters = () => {
        setFilterActivity({ id: '', label: '' });
        setSearchQuery('');
        setSelectedYear('');
        setSortParam('date-desc');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + decrees().length, totalData());

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
                            <span class="font-medium text-neutral-900 dark:text-white">Teach Decree</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Teaching Decrees
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Manage teaching assignment decrees (SK mengajar) issued per campaign activity, including decree number, date and signing official.
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
                            <span>New Decree</span>
                        </button>
                    </div>
                </div>

                {/* Sub-Navigation Tabs */}
                <div class="flex items-center gap-2 p-1.5 bg-white dark:bg-neutral-800/80 rounded-xs border border-neutral-200 dark:border-neutral-700/80 overflow-x-auto scrollbar-none shadow-2xs">
                    <A href="/administrator/academic/campaign/transaction/activity" class={tabClass}><span>Activities</span></A>
                    <A href="/administrator/academic/campaign/transaction/class-code" class={tabClass}><span>Class Codes</span></A>
                    <A href="/administrator/academic/campaign/transaction/grade" class={tabClass}><span>Grades</span></A>
                    <A href="/administrator/academic/campaign/transaction/teach" class={tabClass}><span>Teaching Activities</span></A>
                    <A href={basePath} class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0">
                        <span>Teach Decrees</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/teach-lecturer" class={tabClass}><span>Teach Lecturers</span></A>
                    <A href="/administrator/academic/campaign/transaction/teach-evaluation" class={tabClass}><span>Evaluations</span></A>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Decrees</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().totalCount}</span>
                            <span class="text-xs text-neutral-500">records</span>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Issued This Year</span>
                            <span class="text-xs font-mono text-neutral-500">{new Date().getFullYear()}</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().thisYearCount}</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Activities</span>
                            <span class="text-xs font-mono text-neutral-500">{summaryStats().withSigner} signed</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().activityCount}</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Latest Decree</span>
                        <div class="mt-2 text-lg font-bold font-mono text-neutral-900 dark:text-white">{formatDate(summaryStats().latest)}</div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div class="md:col-span-5">
                            <RemoteSearchSelect<ActivityOption>
                                apiPath="academic/campaign/transaction/activities"
                                value={filterActivity().id}
                                selectedLabel={filterActivity().label}
                                placeholder="Filter by campaign activity (type a name)..."
                                class={`${filterClass} pr-8`}
                                getLabel={(a) => a.name}
                                getSublabel={(a) => [a.unit_name, a.academic_year_name].filter(Boolean).join(' • ')}
                                onSelect={(a) => {
                                    setFilterActivity(a ? { id: a.id, label: activityLabel(a) } : { id: '', label: '' });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div class="md:col-span-4">
                            <input
                                type="text"
                                class={filterClass}
                                placeholder="Search decree number on this page..."
                                value={searchQuery()}
                                onInput={handleSearchInput}
                            />
                        </div>
                        <div class="md:col-span-2">
                            <select class={filterClass} value={selectedYear()} onChange={(e) => setSelectedYear((e.target as HTMLSelectElement).value)}>
                                <option value="">All Years</option>
                                <For each={yearOptions}>{(y) => <option value={y}>{y}</option>}</For>
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
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{decrees().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> decrees
                        </span>
                        <div class="flex items-center gap-2">
                            <span>Sort:</span>
                            <select
                                class="p-1 text-xs border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200"
                                value={sortParam()}
                                onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                            >
                                <option value="date-desc">Decree Date (Newest)</option>
                                <option value="date-asc">Decree Date (Oldest)</option>
                                <option value="number-asc">Decree Number</option>
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
                            when={decrees().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">No Teaching Decrees Found</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no decree records matching your current filter criteria or database state.
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
                                            + Add Decree
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
                                            <th class="px-4 py-3 font-semibold">Decree (SK)</th>
                                            <th class="px-4 py-3 font-semibold">Campaign Activity</th>
                                            <th class="px-4 py-3 font-semibold">Signed By</th>
                                            <th class="px-4 py-3 font-semibold text-center">Feeder</th>
                                            <th class="px-4 py-3 font-semibold text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={decrees()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                    <td class="px-4 py-3.5 align-top font-mono">
                                                        <div class="font-semibold text-sm text-neutral-900 dark:text-white">{item.decree_number}</div>
                                                        <div class="flex items-center gap-1.5 mt-1">
                                                            <span class="text-[10px] text-neutral-500">{formatDate(item.decree_date)}</span>
                                                            <button
                                                                type="button"
                                                                onClick={() => copyToClipboard(item.id, 'UUID')}
                                                                class="px-1.5 py-0.5 rounded-xs text-[10px] text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50 transition-colors cursor-pointer"
                                                                title="Click to copy record UUID"
                                                            >
                                                                {item.id.substring(0, 8)}...
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono">
                                                        <A
                                                            href={`/administrator/academic/campaign/transaction/activity/${item.activity_id}`}
                                                            class="font-medium text-blue-600 dark:text-blue-400 hover:underline"
                                                        >
                                                            {activityName(item)}
                                                        </A>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono text-neutral-700 dark:text-neutral-300">{staffName(item)}</td>
                                                    <td class="px-4 py-3.5 align-top text-center">
                                                        <span
                                                            class={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                                item.feeder_id
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                            }`}
                                                        >
                                                            {item.feeder_id ? 'SYNCED' : 'LOCAL'}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top text-right">
                                                        <div class="flex items-center justify-end gap-1.5">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Edit Decree"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Delete Decree"
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
                                <For each={decrees()}>
                                    {(item) => (
                                        <div class="p-4 space-y-2">
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="font-mono font-bold text-sm text-neutral-900 dark:text-white truncate">{item.decree_number}</div>
                                                <span class="text-[10px] font-mono text-neutral-500 shrink-0">{formatDate(item.decree_date)}</span>
                                            </div>
                                            <A
                                                href={`/administrator/academic/campaign/transaction/activity/${item.activity_id}`}
                                                class="text-[11px] font-mono text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                            >
                                                {activityName(item)}
                                            </A>
                                            <div class="text-[11px] font-mono text-neutral-500">Signed by: {staffName(item)}</div>
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
                                {modalMode() === 'create' ? 'New Teaching Decree' : 'Update Teaching Decree'}
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
                                    Decree Number (SK) <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    class={inputClass}
                                    placeholder="e.g. 045/SK/REK/2026"
                                    value={formState().decree_number}
                                    onInput={(e) => updateForm('decree_number', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>
                                    Decree Date <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    class={inputClass}
                                    value={formState().decree_date}
                                    onInput={(e) => updateForm('decree_date', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>

                        <div>
                            <label class={labelClass}>
                                Campaign Activity <span class="text-red-500">*</span>
                            </label>
                            <RemoteSearchSelect<ActivityOption>
                                apiPath="academic/campaign/transaction/activities"
                                value={formState().activity_id}
                                selectedLabel={formState().activity_label}
                                placeholder="Type an activity name..."
                                required
                                getLabel={(a) => a.name}
                                getSublabel={(a) => [a.unit_name, a.academic_year_name].filter(Boolean).join(' • ')}
                                onSelect={(a) => setFormState({ ...formState(), activity_id: a?.id || '', activity_label: a ? activityLabel(a) : '' })}
                            />
                        </div>

                        <div>
                            <label class={labelClass}>Signed By (Staff)</label>
                            <RemoteSearchSelect<StaffOption>
                                apiPath="institution/master/staffes"
                                value={formState().staff_id}
                                selectedLabel={formState().staff_label}
                                placeholder="Type a staff name (optional)..."
                                getLabel={(s) => s.name || '-'}
                                getSublabel={(s) => s.code || ''}
                                onSelect={(s) => setFormState({ ...formState(), staff_id: s?.id || '', staff_label: s ? staffLabel(s) : '' })}
                            />
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Create Decree' : 'Update Decree'}
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
                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">Delete Teaching Decree</h3>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Delete decree <strong class="text-neutral-900 dark:text-white">"{selectedDecree()?.decree_number}"</strong>? Teaching assignments referencing this decree may be affected. This action cannot be reversed.
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
