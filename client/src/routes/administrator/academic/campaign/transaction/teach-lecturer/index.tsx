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

interface TeachLecturerItem {
    id: string;
    name?: string | null;
    code?: string | null;
    planning: number;
    realization: number;
    credit?: string | number | null;
    is_lecturer_home_base: boolean;
    lecturer_id: string;
    teach_id: string;
    feeder_id?: string | null;
}

interface LecturerOption {
    id: string;
    code?: string | null;
    name?: string | null;
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
    lecturer_id: string;
    lecturer_label: string;
    planning: string;
    realization: string;
    credit: string;
    is_lecturer_home_base: boolean;
    name: string;
}

const emptyForm = (): FormState => ({
    teach_id: '',
    teach_label: '',
    lecturer_id: '',
    lecturer_label: '',
    planning: '16',
    realization: '0',
    credit: '',
    is_lecturer_home_base: true,
    name: '',
});

const lecturerLabel = (l: LecturerOption) => (l.code ? `${l.name || '-'} (${l.code})` : l.name || l.id);
const teachLabel = (t: TeachOption) => {
    const course = t.course?.name || t.name || 'Teach';
    const parts = [t.class_code?.name, t.activity?.name].filter(Boolean).join(' • ');
    return parts ? `${course} — ${parts}` : course;
};

const toNumber = (v?: string | number | null) => (v === null || v === undefined || v === '' ? 0 : Number(v) || 0);
const realizationPct = (item: TeachLecturerItem) =>
    item.planning > 0 ? Math.round((item.realization / item.planning) * 100) : 0;

export default function AcademicCampaignTransactionTeachlecturerPage() {
    const basePath = '/administrator/academic/campaign/transaction/teach-lecturer';
    const apiPath = 'academic/campaign/transaction/teach-lecturers';

    // Data States
    const [records, setRecords] = createSignal<TeachLecturerItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isRefreshing, setIsRefreshing] = createSignal(false);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters (teach & lecturer are server-side; homebase & progress apply to the current page)
    const [filterTeach, setFilterTeach] = createSignal<{ id: string; label: string }>({ id: '', label: '' });
    const [filterLecturer, setFilterLecturer] = createSignal<{ id: string; label: string }>({ id: '', label: '' });
    const [selectedHomebase, setSelectedHomebase] = createSignal<'all' | 'homebase' | 'external'>('all');
    const [selectedProgress, setSelectedProgress] = createSignal<'all' | 'complete' | 'incomplete'>('all');

    // Name lookups for related records (cached across pages)
    const [lecturerNames, setLecturerNames] = createSignal<Record<string, string>>({});
    const [teachNames, setTeachNames] = createSignal<Record<string, string>>({});

    const lecturerName = (item: TeachLecturerItem) => lecturerNames()[item.lecturer_id] || `${item.lecturer_id.substring(0, 8)}...`;
    const teachName = (item: TeachLecturerItem) => teachNames()[item.teach_id] || `${item.teach_id.substring(0, 8)}...`;

    // Modal States
    let formDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [modalMode, setModalMode] = createSignal<'create' | 'edit'>('create');
    const [selectedRecord, setSelectedRecord] = createSignal<TeachLecturerItem | null>(null);
    const [formState, setFormState] = createSignal<FormState>(emptyForm());

    const updateForm = <K extends keyof FormState>(field: K, value: FormState[K]) => setFormState({ ...formState(), [field]: value });

    // Resolve lecturer and teach labels for the rows on the current page
    const resolveNames = async (items: TeachLecturerItem[]) => {
        const knownLecturers = lecturerNames();
        const knownTeaches = teachNames();
        const missingLecturers = [...new Set(items.map((i) => i.lecturer_id))].filter((id) => id && !(id in knownLecturers));
        const missingTeaches = [...new Set(items.map((i) => i.teach_id))].filter((id) => id && !(id in knownTeaches));

        const [lecturerResults, teachResults] = await Promise.all([
            Promise.allSettled(missingLecturers.map((id) => masterApiShow<LecturerOption>('academic/lecturer/master/lecturers', id))),
            Promise.allSettled(missingTeaches.map((id) => masterApiShow<TeachOption>('academic/campaign/transaction/teaches', id))),
        ]);

        const resolvedLecturers: Record<string, string> = {};
        lecturerResults.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value.data) resolvedLecturers[missingLecturers[idx]] = lecturerLabel(r.value.data);
        });
        const resolvedTeaches: Record<string, string> = {};
        teachResults.forEach((r, idx) => {
            if (r.status === 'fulfilled' && r.value.data) resolvedTeaches[missingTeaches[idx]] = teachLabel(r.value.data);
        });

        setLecturerNames({ ...lecturerNames(), ...resolvedLecturers });
        setTeachNames({ ...teachNames(), ...resolvedTeaches });
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await masterApiIndex<TeachLecturerItem>(apiPath, {
                page: currentPage(),
                per_page: itemsPerPage(),
                teach_id: filterTeach().id || undefined,
                lecturer_id: filterLecturer().id || undefined,
            });

            let items = res.data || [];
            if (selectedHomebase() === 'homebase') items = items.filter((i) => i.is_lecturer_home_base);
            else if (selectedHomebase() === 'external') items = items.filter((i) => !i.is_lecturer_home_base);
            if (selectedProgress() === 'complete') items = items.filter((i) => i.planning > 0 && i.realization >= i.planning);
            else if (selectedProgress() === 'incomplete') items = items.filter((i) => i.realization < i.planning);

            setRecords(items);
            setTotalData(res.total || items.length);
            setTotalPages(res.total_pages || Math.max(1, Math.ceil((res.total || items.length) / itemsPerPage())));
            resolveNames(items);
        } catch (error) {
            console.error('Error fetching teach lecturers:', error);
            toast.danger('Failed to load teaching lecturers.');
            setRecords([]);
            setTotalData(0);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    };

    createEffect(() => {
        currentPage();
        itemsPerPage();
        filterTeach();
        filterLecturer();
        selectedHomebase();
        selectedProgress();
        fetchData();
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData();
        toast.success('Teaching lecturers refreshed successfully.');
    };

    const summaryStats = createMemo(() => {
        const list = records();
        let planned = 0;
        let realized = 0;
        let credit = 0;
        let homebaseCount = 0;
        const lecturers = new Set<string>();

        for (const item of list) {
            planned += item.planning || 0;
            realized += Math.min(item.realization || 0, item.planning || 0);
            credit += toNumber(item.credit);
            if (item.is_lecturer_home_base) homebaseCount++;
            lecturers.add(item.lecturer_id);
        }

        return {
            totalCount: totalData(),
            lecturerCount: lecturers.size,
            homebaseCount,
            totalCredit: Math.round(credit * 100) / 100,
            realizationRate: planned > 0 ? Math.round((realized / planned) * 100) : 0,
            planned,
            realized,
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
        setSelectedRecord(null);
        setFormState({
            ...emptyForm(),
            teach_id: filterTeach().id,
            teach_label: filterTeach().label,
            lecturer_id: filterLecturer().id,
            lecturer_label: filterLecturer().label,
        });
        formDialogRef?.showModal();
    };

    const openEditModal = (item: TeachLecturerItem) => {
        setModalMode('edit');
        setSelectedRecord(item);
        setFormState({
            teach_id: item.teach_id,
            teach_label: teachName(item),
            lecturer_id: item.lecturer_id,
            lecturer_label: lecturerName(item),
            planning: String(item.planning ?? 0),
            realization: String(item.realization ?? 0),
            credit: item.credit !== null && item.credit !== undefined ? String(item.credit) : '',
            is_lecturer_home_base: item.is_lecturer_home_base,
            name: item.name || '',
        });
        formDialogRef?.showModal();
    };

    const closeFormModal = () => {
        formDialogRef?.close();
        setIsSubmitting(false);
    };

    const openDeleteModal = (item: TeachLecturerItem) => {
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

        if (!form.teach_id || !form.lecturer_id) {
            toast.danger('Teaching class and lecturer are required.');
            return;
        }
        const planning = Number(form.planning);
        const realization = Number(form.realization);
        if (!Number.isInteger(planning) || planning < 0 || !Number.isInteger(realization) || realization < 0) {
            toast.danger('Planned and realized meetings must be whole numbers of 0 or more.');
            return;
        }
        if (form.credit.trim() !== '' && (Number.isNaN(Number(form.credit)) || Number(form.credit) < 0)) {
            toast.danger('Credit must be a non-negative number.');
            return;
        }

        const payload = {
            teach_id: form.teach_id,
            lecturer_id: form.lecturer_id,
            planning,
            realization,
            // Decimal column: sent as a string to keep exact precision
            credit: form.credit.trim() === '' ? null : String(Number(form.credit)),
            is_lecturer_home_base: form.is_lecturer_home_base,
            name: form.name.trim() || null,
        };

        setIsSubmitting(true);
        try {
            const target = selectedRecord();
            const res = modalMode() === 'create'
                ? await masterApiCreate(apiPath, payload)
                : target?.id
                    ? await masterApiUpdate(apiPath, target.id, payload)
                    : null;
            if (!res) return;

            if (res.success) {
                toast.success(`Teaching lecturer ${modalMode() === 'create' ? 'assigned' : 'updated'} successfully!`);
                // Remember labels picked in the form so the table shows them immediately
                setLecturerNames({ ...lecturerNames(), [form.lecturer_id]: form.lecturer_label || lecturerNames()[form.lecturer_id] });
                setTeachNames({ ...teachNames(), [form.teach_id]: form.teach_label || teachNames()[form.teach_id] });
                closeFormModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to save teaching lecturer.');
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
            const res = await masterApiDelete(apiPath, item.id);
            if (res.success) {
                toast.success(res.message || 'Teaching lecturer removed successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to remove teaching lecturer.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'An error occurred while deleting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetFilters = () => {
        setFilterTeach({ id: '', label: '' });
        setFilterLecturer({ id: '', label: '' });
        setSelectedHomebase('all');
        setSelectedProgress('all');
        setCurrentPage(1);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + records().length, totalData());

    const inputClass = 'w-full p-2 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500';
    const labelClass = 'block text-xs font-mono font-semibold text-neutral-700 dark:text-neutral-300 mb-1';
    const filterClass = 'w-full p-2 text-xs sm:text-sm text-neutral-900 dark:text-white border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors';
    const tabClass = 'px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors flex items-center gap-2 shrink-0';
    const progressBarClass = (pct: number) => (pct >= 100 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-500');

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
                            <span class="font-medium text-neutral-900 dark:text-white">Teach Lecturer</span>
                        </nav>
                        <div class="flex items-center gap-2 mb-1">
                            <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                Administrator Workspace
                            </span>
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Teaching Lecturers
                        </h1>
                        <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl">
                            Assign lecturers to teaching classes (dosen pengajar) and track planned vs. realized meetings and credit (SKS) load.
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
                            <span>Assign Lecturer</span>
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
                    <A href={basePath} class="px-3.5 py-1.5 rounded-xs text-xs font-mono font-medium transition-colors bg-blue-600 text-white shadow-2xs flex items-center gap-2 shrink-0">
                        <span>Teach Lecturers</span>
                    </A>
                    <A href="/administrator/academic/campaign/transaction/teach-evaluation" class={tabClass}><span>Evaluations</span></A>
                </div>

                {/* KPI Metrics Summary Cards */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Total Assignments</span>
                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                {summaryStats().lecturerCount} lecturers
                            </span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().totalCount}</span>
                            <span class="text-xs text-neutral-500">records</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between">
                            <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Meeting Realization</span>
                            <span class="text-xs font-mono text-neutral-500">{summaryStats().realized}/{summaryStats().planned}</span>
                        </div>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().realizationRate}%</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full mt-2 overflow-hidden">
                            <div class={`h-full rounded-full transition-all duration-300 ${progressBarClass(summaryStats().realizationRate)}`} style={{ width: `${Math.min(100, summaryStats().realizationRate)}%` }}></div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Credit Load (SKS)</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().totalCredit}</span>
                            <span class="text-xs text-neutral-500">on this page</span>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-semibold">Homebase Lecturers</span>
                        <div class="mt-2 flex items-baseline gap-2">
                            <span class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">{summaryStats().homebaseCount}</span>
                            <span class="text-xs text-neutral-500">of {records().length} on this page</span>
                        </div>
                    </div>
                </div>

                {/* Filter and Control Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        <div class="md:col-span-4">
                            <RemoteSearchSelect<TeachOption>
                                apiPath="academic/campaign/transaction/teaches"
                                value={filterTeach().id}
                                selectedLabel={filterTeach().label}
                                placeholder="Filter by teaching class..."
                                class={`${filterClass} pr-8`}
                                getLabel={(t) => t.course?.name || t.name || 'Teach'}
                                getSublabel={(t) => [t.class_code?.name, t.activity?.name].filter(Boolean).join(' • ')}
                                onSelect={(t) => {
                                    setFilterTeach(t ? { id: t.id, label: teachLabel(t) } : { id: '', label: '' });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div class="md:col-span-3">
                            <RemoteSearchSelect<LecturerOption>
                                apiPath="academic/lecturer/master/lecturers"
                                value={filterLecturer().id}
                                selectedLabel={filterLecturer().label}
                                placeholder="Filter by lecturer..."
                                class={`${filterClass} pr-8`}
                                getLabel={(l) => l.name || '-'}
                                getSublabel={(l) => l.code || ''}
                                onSelect={(l) => {
                                    setFilterLecturer(l ? { id: l.id, label: lecturerLabel(l) } : { id: '', label: '' });
                                    setCurrentPage(1);
                                }}
                            />
                        </div>
                        <div class="md:col-span-2">
                            <select class={filterClass} value={selectedHomebase()} onChange={(e) => setSelectedHomebase((e.target as HTMLSelectElement).value as any)}>
                                <option value="all">All Lecturers</option>
                                <option value="homebase">Homebase Only</option>
                                <option value="external">Non-Homebase Only</option>
                            </select>
                        </div>
                        <div class="md:col-span-2">
                            <select class={filterClass} value={selectedProgress()} onChange={(e) => setSelectedProgress((e.target as HTMLSelectElement).value as any)}>
                                <option value="all">All Progress</option>
                                <option value="complete">Meetings Complete</option>
                                <option value="incomplete">Meetings Incomplete</option>
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
                            Showing <strong class="text-neutral-800 dark:text-neutral-200">{records().length > 0 ? startIndex() + 1 : 0}</strong> - <strong class="text-neutral-800 dark:text-neutral-200">{endIndex()}</strong> of <strong class="text-neutral-800 dark:text-neutral-200">{totalData()}</strong> assignments
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
                            when={records().length > 0}
                            fallback={
                                <div class="px-4 py-16 text-center">
                                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">No Teaching Lecturers Found</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 max-w-sm mx-auto font-mono">
                                        There are no lecturer assignments matching your current filter criteria or database state.
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
                                            + Assign Lecturer
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
                                            <th class="px-4 py-3 font-semibold">Teaching Class</th>
                                            <th class="px-4 py-3 font-semibold">Meetings</th>
                                            <th class="px-4 py-3 font-semibold text-center">Credit</th>
                                            <th class="px-4 py-3 font-semibold text-center">Homebase</th>
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
                                                        <div class="flex items-center gap-1.5 mt-1">
                                                            <Show when={item.feeder_id}>
                                                                <span class="px-1.5 py-0.5 rounded-xs text-[9px] font-mono font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">FEEDER</span>
                                                            </Show>
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
                                                    <td class="px-4 py-3.5 align-top font-mono">
                                                        <A
                                                            href={`/administrator/academic/campaign/transaction/teach/${item.teach_id}`}
                                                            class="text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 hover:underline"
                                                        >
                                                            {teachName(item)}
                                                        </A>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top font-mono min-w-40">
                                                        <div class="flex items-center justify-between text-[11px] mb-1">
                                                            <span class="text-neutral-600 dark:text-neutral-300">{item.realization} / {item.planning}</span>
                                                            <span class="text-neutral-500">{realizationPct(item)}%</span>
                                                        </div>
                                                        <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                                                            <div class={`h-full rounded-full ${progressBarClass(realizationPct(item))}`} style={{ width: `${Math.min(100, realizationPct(item))}%` }}></div>
                                                        </div>
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top text-center font-mono text-sm font-bold text-neutral-900 dark:text-white">
                                                        {item.credit !== null && item.credit !== undefined ? toNumber(item.credit) : '-'}
                                                    </td>
                                                    <td class="px-4 py-3.5 align-top text-center">
                                                        <span
                                                            class={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                                                item.is_lecturer_home_base
                                                                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-300 dark:border-neutral-700'
                                                            }`}
                                                        >
                                                            {item.is_lecturer_home_base ? 'YES' : 'NO'}
                                                        </span>
                                                    </td>
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
                                                                title="Edit Assignment"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="p-1.5 text-neutral-600 dark:text-neutral-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-xs transition-colors cursor-pointer"
                                                                title="Remove Assignment"
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
                                        <div class="p-4 space-y-2">
                                            <div class="flex items-start justify-between gap-2">
                                                <A
                                                    href={`/administrator/academic/lecturer/master/lecturer/${item.lecturer_id}`}
                                                    class="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline truncate"
                                                >
                                                    {lecturerName(item)}
                                                </A>
                                                <Show when={item.is_lecturer_home_base}>
                                                    <span class="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">HOMEBASE</span>
                                                </Show>
                                            </div>
                                            <div class="text-[11px] font-mono text-neutral-500 truncate">{teachName(item)}</div>
                                            <div class="grid grid-cols-2 gap-2 p-2.5 bg-neutral-50 dark:bg-neutral-900/40 rounded-xs border border-neutral-200/80 dark:border-neutral-700/60 text-center font-mono">
                                                <div>
                                                    <span class="text-[10px] text-neutral-500 block">Meetings</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white">{item.realization}/{item.planning} ({realizationPct(item)}%)</span>
                                                </div>
                                                <div>
                                                    <span class="text-[10px] text-neutral-500 block">Credit</span>
                                                    <span class="text-xs font-bold text-neutral-900 dark:text-white">{item.credit !== null && item.credit !== undefined ? toNumber(item.credit) : '-'}</span>
                                                </div>
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
                                                    Remove
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
                                {modalMode() === 'create' ? 'Assign Teaching Lecturer' : 'Update Teaching Lecturer'}
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

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                                <label class={labelClass}>
                                    Planned Meetings <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1"
                                    class={inputClass}
                                    value={formState().planning}
                                    onInput={(e) => updateForm('planning', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>
                                    Realized Meetings <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    step="1"
                                    class={inputClass}
                                    value={formState().realization}
                                    onInput={(e) => updateForm('realization', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                            <div>
                                <label class={labelClass}>Credit (SKS)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    class={inputClass}
                                    placeholder="e.g. 2"
                                    value={formState().credit}
                                    onInput={(e) => updateForm('credit', (e.target as HTMLInputElement).value)}
                                />
                            </div>
                        </div>

                        <label class="inline-flex items-center gap-2.5 cursor-pointer">
                            <input
                                type="checkbox"
                                class="size-4 text-blue-600 rounded-xs border-neutral-300 focus:ring-blue-500"
                                checked={formState().is_lecturer_home_base}
                                onChange={(e) => updateForm('is_lecturer_home_base', (e.target as HTMLInputElement).checked)}
                            />
                            <span class="text-xs font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                                Lecturer's homebase is the study program of this class
                            </span>
                        </label>

                        <div>
                            <label class={labelClass}>Reference Label</label>
                            <input
                                type="text"
                                class={inputClass}
                                placeholder="Optional — filled automatically by PDDikti feeder sync"
                                value={formState().name}
                                onInput={(e) => updateForm('name', (e.target as HTMLInputElement).value)}
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
                            {isSubmitting() ? 'Saving...' : modalMode() === 'create' ? 'Assign Lecturer' : 'Update Assignment'}
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
                    <h3 class="text-base font-bold font-mono text-neutral-900 dark:text-white">Remove Teaching Lecturer</h3>
                    <p class="text-xs text-neutral-600 dark:text-neutral-300 font-mono">
                        Remove <strong class="text-neutral-900 dark:text-white">{selectedRecord() ? lecturerName(selectedRecord()!) : ''}</strong> from{' '}
                        <strong class="text-neutral-900 dark:text-white">{selectedRecord() ? teachName(selectedRecord()!) : ''}</strong>? Their meeting realization and credit load for this class will be removed. This action cannot be reversed.
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
                            {isSubmitting() ? 'Removing...' : 'Confirm Remove'}
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
