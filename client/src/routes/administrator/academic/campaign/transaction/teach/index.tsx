import { createSignal, createEffect, onMount, For, Show, createMemo } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    listTeaches,
    listCourses,
    listClassCodes,
    listActivities,
    listTeachDecrees,
    type TeachItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import {
    masterApiCreate,
    masterApiUpdate,
    masterApiDelete,
} from '~/controllers/master/masterApiController';

export default function AcademicCampaignTransactionTeachPage() {
    const basePath = '/administrator/academic/campaign/transaction/teach';
    const apiPath = 'academic/campaign/transaction/teaches';

    // Data State
    const [items, setItems] = createSignal<TeachItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Filters & Sorting
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedActivityId, setSelectedActivityId] = createSignal('');
    const [selectedLockFilter, setSelectedLockFilter] = createSignal<'all' | 'open' | 'locked'>('all');
    const [selectedCapacityFilter, setSelectedCapacityFilter] = createSignal<'all' | 'available' | 'near-full' | 'full'>('all');
    const [sortField, setSortField] = createSignal<'name' | 'code' | 'enrolled' | 'capacity' | 'date'>('name');
    const [sortDirection, setSortDirection] = createSignal<'asc' | 'desc'>('asc');

    // Reference Options
    const [courseOptions, setCourseOptions] = createSignal<any[]>([]);
    const [classCodeOptions, setClassCodeOptions] = createSignal<any[]>([]);
    const [activityOptions, setActivityOptions] = createSignal<any[]>([]);
    const [teachDecreeOptions, setTeachDecreeOptions] = createSignal<any[]>([]);
    const [isLoadingOptions, setIsLoadingOptions] = createSignal(false);

    // Modal States
    const [isFormModalOpen, setIsFormModalOpen] = createSignal(false);
    const [isEditing, setIsEditing] = createSignal(false);
    const [editingItem, setEditingItem] = createSignal<TeachItem | null>(null);
    const [isSubmittingForm, setIsSubmittingForm] = createSignal(false);

    const [isDeleteModalOpen, setIsDeleteModalOpen] = createSignal(false);
    const [itemToDelete, setItemToDelete] = createSignal<TeachItem | null>(null);
    const [isDeleting, setIsDeleting] = createSignal(false);

    const [isPreviewModalOpen, setIsPreviewModalOpen] = createSignal(false);
    const [previewItem, setPreviewItem] = createSignal<TeachItem | null>(null);

    // Form inputs
    const [formName, setFormName] = createSignal('');
    const [formCourseId, setFormCourseId] = createSignal('');
    const [formClassCodeId, setFormClassCodeId] = createSignal('');
    const [formActivityId, setFormActivityId] = createSignal('');
    const [formTeachDecreeId, setFormTeachDecreeId] = createSignal('');
    const [formMaxMember, setFormMaxMember] = createSignal<number>(40);
    const [formStartDate, setFormStartDate] = createSignal('');
    const [formEndDate, setFormEndDate] = createSignal('');
    const [formPracticeStartDate, setFormPracticeStartDate] = createSignal('');
    const [formPracticeEndDate, setFormPracticeEndDate] = createSignal('');
    const [formIsLock, setFormIsLock] = createSignal(false);
    const [formDescription, setFormDescription] = createSignal('');

    // Fetch reference datasets for selects and filters
    const loadReferenceOptions = async () => {
        setIsLoadingOptions(true);
        try {
            const [courses, classCodes, activities, decrees] = await Promise.all([
                listCourses({ page_size: 500 }),
                listClassCodes({ page_size: 300 }),
                listActivities({ page_size: 200 }),
                listTeachDecrees({ page_size: 200 }),
            ]);
            setCourseOptions(courses || []);
            setClassCodeOptions(classCodes || []);
            setActivityOptions(activities || []);
            setTeachDecreeOptions(decrees || []);
        } catch (err) {
            console.warn('Failed to load some reference options:', err);
        } finally {
            setIsLoadingOptions(false);
        }
    };

    // Fetch teaching classes list
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await listTeaches({
                page: currentPage(),
                page_size: itemsPerPage(),
                name: searchQuery().trim() || undefined,
                activity_id: selectedActivityId() || undefined,
            });

            if (response && Array.isArray(response.data)) {
                setItems(response.data);
                setTotalData(response.total);
                setTotalPages(response.total_pages || Math.max(1, Math.ceil(response.total / itemsPerPage())));
            } else {
                setItems([]);
                setTotalData(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error fetching teach classes:', error);
            setItems([]);
            setTotalData(0);
            setTotalPages(1);
            toast.danger('Failed to load teaching classes from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        loadReferenceOptions();
    });

    createEffect(() => {
        currentPage();
        itemsPerPage();
        searchQuery();
        selectedActivityId();
        fetchData();
    });

    // Client-side filtering & sorting over loaded data for fine-grained filters
    const displayedItems = createMemo(() => {
        let list = [...items()];

        // Filter by lock status
        if (selectedLockFilter() === 'open') {
            list = list.filter((item) => !item.is_lock);
        } else if (selectedLockFilter() === 'locked') {
            list = list.filter((item) => item.is_lock);
        }

        // Filter by capacity
        if (selectedCapacityFilter() === 'available') {
            list = list.filter((item) => {
                const max = item.max_member || 0;
                const enrolled = item.enrolled_count || 0;
                return max === 0 || enrolled < max * 0.8;
            });
        } else if (selectedCapacityFilter() === 'near-full') {
            list = list.filter((item) => {
                const max = item.max_member || 0;
                const enrolled = item.enrolled_count || 0;
                return max > 0 && enrolled >= max * 0.8 && enrolled < max;
            });
        } else if (selectedCapacityFilter() === 'full') {
            list = list.filter((item) => {
                const max = item.max_member || 0;
                const enrolled = item.enrolled_count || 0;
                return max > 0 && enrolled >= max;
            });
        }

        // Sorting
        const field = sortField();
        const dir = sortDirection() === 'asc' ? 1 : -1;
        list.sort((a, b) => {
            if (field === 'name') {
                const nameA = a.name || a.course?.name || '';
                const nameB = b.name || b.course?.name || '';
                return nameA.localeCompare(nameB) * dir;
            }
            if (field === 'code') {
                const codeA = a.course?.code || a.course_code || '';
                const codeB = b.course?.code || b.course_code || '';
                return codeA.localeCompare(codeB) * dir;
            }
            if (field === 'enrolled') {
                const enrA = a.enrolled_count || 0;
                const enrB = b.enrolled_count || 0;
                return (enrA - enrB) * dir;
            }
            if (field === 'capacity') {
                const capA = a.max_member || 0;
                const capB = b.max_member || 0;
                return (capA - capB) * dir;
            }
            if (field === 'date') {
                const dateA = a.start_date || '';
                const dateB = b.start_date || '';
                return dateA.localeCompare(dateB) * dir;
            }
            return 0;
        });

        return list;
    });

    // KPI Metrics calculation
    const metrics = createMemo(() => {
        const total = totalData();
        const loaded = items();
        const lockedCount = loaded.filter((i) => i.is_lock).length;
        const openCount = loaded.filter((i) => !i.is_lock).length;
        const totalEnrolled = loaded.reduce((acc, curr) => acc + (curr.enrolled_count || 0), 0);
        const totalCapacity = loaded.reduce((acc, curr) => acc + (curr.max_member || 0), 0);
        const utilizationPct = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

        return {
            total,
            lockedCount,
            openCount,
            totalEnrolled,
            totalCapacity,
            utilizationPct,
        };
    });

    // Debounced search
    let searchDebounceTimeout: any;
    const handleSearchInput = (e: Event) => {
        const value = (e.target as HTMLInputElement).value;
        clearTimeout(searchDebounceTimeout);
        searchDebounceTimeout = setTimeout(() => {
            setSearchQuery(value);
            setCurrentPage(1);
        }, 300);
    };

    const resetFilters = () => {
        setSearchQuery('');
        setSelectedActivityId('');
        setSelectedLockFilter('all');
        setSelectedCapacityFilter('all');
        setSortField('name');
        setSortDirection('asc');
        setCurrentPage(1);
    };

    // Helper text extraction
    const getItemCourseName = (item: TeachItem) => {
        return item.course?.name || item.course_name || item.name || 'Untitled Course';
    };

    const getItemCourseCode = (item: TeachItem) => {
        return item.course?.code || item.course_code || '-';
    };

    const getItemCredits = (item: TeachItem) => {
        return item.course?.total_credit ?? item.credits ?? '-';
    };

    const getItemClassCode = (item: TeachItem) => {
        return item.class_code?.name || item.class_code?.alphabet_code || item.class_name || '-';
    };

    const getItemLecturers = (item: TeachItem) => {
        if (item.teach_lecturers && item.teach_lecturers.length > 0) {
            const names = item.teach_lecturers
                .map((tl: any) => tl.name || tl.lecturer?.name || tl.code)
                .filter(Boolean);
            if (names.length > 0) return names.join(', ');
        }
        return item.lecturer_name || 'No instructor assigned';
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 2500);
    };

    // Quick Lock / Unlock Toggle
    const handleToggleLock = async (item: TeachItem) => {
        const nextLock = !item.is_lock;
        try {
            const res = await masterApiUpdate(apiPath, item.id, { is_lock: nextLock });
            if (res.success) {
                toast.success(`Class section ${nextLock ? 'locked' : 'unlocked'} successfully.`);
                // Update local state
                setItems((prev) =>
                    prev.map((i) => (i.id === item.id ? { ...i, is_lock: nextLock } : i))
                );
            } else {
                toast.danger(res.message || 'Failed to update lock status.');
            }
        } catch (err: any) {
            toast.danger(err?.message || 'Error updating lock status.');
        }
    };

    // Form modal management
    const openCreateModal = () => {
        setIsEditing(false);
        setEditingItem(null);
        setFormName('');
        setFormCourseId(courseOptions()[0]?.id || '');
        setFormClassCodeId(classCodeOptions()[0]?.id || '');
        setFormActivityId(activityOptions()[0]?.id || selectedActivityId() || '');
        setFormTeachDecreeId(teachDecreeOptions()[0]?.id || '');
        setFormMaxMember(40);
        setFormStartDate('');
        setFormEndDate('');
        setFormPracticeStartDate('');
        setFormPracticeEndDate('');
        setFormIsLock(false);
        setFormDescription('');
        setIsFormModalOpen(true);
    };

    const openEditModal = (item: TeachItem) => {
        setIsEditing(true);
        setEditingItem(item);
        setFormName(item.name || '');
        setFormCourseId(item.course_id || item.course?.id || '');
        setFormClassCodeId(item.class_code_id || item.class_code?.id || '');
        setFormActivityId(item.activity_id || item.activity?.id || '');
        setFormTeachDecreeId(item.teach_decree_id || item.teach_decree?.id || '');
        setFormMaxMember(item.max_member ?? 40);
        setFormStartDate(item.start_date || '');
        setFormEndDate(item.end_date || '');
        setFormPracticeStartDate(item.practice_start_date || '');
        setFormPracticeEndDate(item.practice_end_date || '');
        setFormIsLock(Boolean(item.is_lock));
        setFormDescription(item.description || '');
        setIsFormModalOpen(true);
    };

    const closeFormModal = () => {
        setIsFormModalOpen(false);
        setEditingItem(null);
    };

    const handleFormSubmit = async (e: Event) => {
        e.preventDefault();

        if (!formCourseId()) {
            toast.warning('Please select a course.');
            return;
        }
        if (!formClassCodeId()) {
            toast.warning('Please select a class code.');
            return;
        }
        if (!isEditing() && !formTeachDecreeId() && teachDecreeOptions().length > 0) {
            setFormTeachDecreeId(teachDecreeOptions()[0].id);
        }

        setIsSubmittingForm(true);
        try {
            if (isEditing()) {
                const item = editingItem();
                if (!item) return;

                const payload = {
                    name: formName().trim() || undefined,
                    course_id: formCourseId() || undefined,
                    class_code_id: formClassCodeId() || undefined,
                    activity_id: formActivityId() || undefined,
                    teach_decree_id: formTeachDecreeId() || undefined,
                    max_member: Number(formMaxMember()) || 0,
                    start_date: formStartDate() || undefined,
                    end_date: formEndDate() || undefined,
                    practice_start_date: formPracticeStartDate() || undefined,
                    practice_end_date: formPracticeEndDate() || undefined,
                    is_lock: formIsLock(),
                    description: formDescription().trim() || undefined,
                };

                const res = await masterApiUpdate(apiPath, item.id, payload);
                if (res.success) {
                    toast.success('Teaching class updated successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to update teaching class.');
                }
            } else {
                const payload = {
                    name: formName().trim() || undefined,
                    course_id: formCourseId(),
                    class_code_id: formClassCodeId(),
                    activity_id: formActivityId() || undefined,
                    teach_decree_id: formTeachDecreeId() || '00000000-0000-0000-0000-000000000000',
                    max_member: Number(formMaxMember()) || 0,
                    start_date: formStartDate() || undefined,
                    end_date: formEndDate() || undefined,
                    practice_start_date: formPracticeStartDate() || undefined,
                    practice_end_date: formPracticeEndDate() || undefined,
                    is_lock: formIsLock(),
                    description: formDescription().trim() || undefined,
                };

                const res = await masterApiCreate(apiPath, payload);
                if (res.success) {
                    toast.success('New teaching class created successfully!');
                    closeFormModal();
                    fetchData();
                } else {
                    toast.danger(res.message || 'Failed to create teaching class.');
                }
            }
        } catch (err: any) {
            console.error('Error submitting form:', err);
            toast.danger(err?.message || 'Error occurred while saving record.');
        } finally {
            setIsSubmittingForm(false);
        }
    };

    // Delete modal management
    const openDeleteModal = (item: TeachItem) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
    };

    const closeDeleteModal = () => {
        setIsDeleteModalOpen(false);
        setItemToDelete(null);
    };

    const handleDeleteSubmit = async () => {
        const item = itemToDelete();
        if (!item?.id) return;

        setIsDeleting(true);
        try {
            const res = await masterApiDelete(apiPath, item.id);
            if (res.success) {
                toast.success(res.message || 'Teaching class deleted successfully.');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete teaching class.');
            }
        } catch (err: any) {
            toast.danger(err?.message || 'Error deleting record.');
        } finally {
            setIsDeleting(false);
        }
    };

    // Quick preview modal
    const openPreviewModal = (item: TeachItem) => {
        setPreviewItem(item);
        setIsPreviewModalOpen(true);
    };

    const closePreviewModal = () => {
        setIsPreviewModalOpen(false);
        setPreviewItem(null);
    };

    // Export CSV of loaded entries
    const handleExportCsv = () => {
        const data = displayedItems();
        if (data.length === 0) {
            toast.warning('No data to export.');
            return;
        }

        const headers = ['UUID', 'Section Name', 'Course Code', 'Course Title', 'Class Code', 'Credits', 'Lecturers', 'Enrolled', 'Max Capacity', 'Status', 'Start Date', 'End Date'];
        const csvRows = [headers.join(',')];

        data.forEach((row) => {
            const values = [
                `"${row.id}"`,
                `"${(row.name || '').replace(/"/g, '""')}"`,
                `"${getItemCourseCode(row)}"`,
                `"${getItemCourseName(row).replace(/"/g, '""')}"`,
                `"${getItemClassCode(row)}"`,
                `"${getItemCredits(row)}"`,
                `"${getItemLecturers(row).replace(/"/g, '""')}"`,
                row.enrolled_count || 0,
                row.max_member || 0,
                row.is_lock ? 'LOCKED' : 'OPEN',
                `"${row.start_date || ''}"`,
                `"${row.end_date || ''}"`,
            ];
            csvRows.push(values.join(','));
        });

        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `teach_classes_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Exported ${data.length} records to CSV!`);
    };

    // Pagination helper values
    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-5">
                {/* Header Section */}
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div class="space-y-1">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            <a href="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</a>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span>Campaign</span>
                            <span>/</span>
                            <span>Transaction</span>
                            <span>/</span>
                            <span class="font-semibold text-neutral-900 dark:text-white">Teach</span>
                        </nav>
                        <div class="flex items-center gap-2.5">
                            <div class="size-9 rounded-xs bg-blue-600 text-white flex items-center justify-center shadow-xs">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                    <path d="M6 6h10" />
                                    <path d="M6 10h10" />
                                </svg>
                            </div>
                            <div>
                                <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                                    Teaching Classes Directory
                                </h1>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                    Central management for course class sections, student quotas, schedules, and instructor assignments.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fetchData()}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-mono text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors cursor-pointer"
                            title="Reload data"
                        >
                            <svg class={`size-3.5 ${isLoading() ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
                                <path d="M21 3v5h-5" />
                            </svg>
                            <span>Refresh</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportCsv}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium font-mono text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors cursor-pointer"
                        >
                            <svg class="size-3.5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                <polyline points="7 10 12 15 17 10" />
                                <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                            <span>Export CSV</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium font-mono text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-xs shadow-xs transition-colors cursor-pointer"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19" />
                                <line x1="5" y1="12" x2="19" y2="12" />
                            </svg>
                            <span>Add New Class</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Strip */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/70 rounded-xs shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                            <span class="text-xs font-mono font-medium uppercase tracking-wider">Total Classes</span>
                            <span class="p-1.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="18" height="18" x="3" y="3" rx="2" />
                                    <path d="M3 9h18" />
                                    <path d="M9 21V9" />
                                </svg>
                            </span>
                        </div>
                        <div class="text-2xl font-bold font-mono text-neutral-900 dark:text-white">
                            {metrics().total}
                        </div>
                        <span class="text-[11px] font-mono text-neutral-500">Registered academic sections</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/70 rounded-xs shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                            <span class="text-xs font-mono font-medium uppercase tracking-wider">Open Sections</span>
                            <span class="p-1.5 rounded-xs bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                            </span>
                        </div>
                        <div class="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {metrics().openCount}
                        </div>
                        <span class="text-[11px] font-mono text-neutral-500">Currently accepting roster/grading</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/70 rounded-xs shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                            <span class="text-xs font-mono font-medium uppercase tracking-wider">Locked / Finalized</span>
                            <span class="p-1.5 rounded-xs bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                </svg>
                            </span>
                        </div>
                        <div class="text-2xl font-bold font-mono text-rose-600 dark:text-rose-400">
                            {metrics().lockedCount}
                        </div>
                        <span class="text-[11px] font-mono text-neutral-500">Locked from grade modification</span>
                    </div>

                    <div class="p-4 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/70 rounded-xs shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 mb-1">
                            <span class="text-xs font-mono font-medium uppercase tracking-wider">Enrolled Students</span>
                            <span class="p-1.5 rounded-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                </svg>
                            </span>
                        </div>
                        <div class="text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                            {metrics().totalEnrolled}
                        </div>
                        <span class="text-[11px] font-mono text-neutral-500">Total participants across loaded</span>
                    </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700/70 p-3.5 sm:p-4 rounded-xs shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
                        {/* Search Input */}
                        <div class="md:col-span-5 relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery()}
                                onInput={handleSearchInput}
                                placeholder="Search by class name, course title..."
                                class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            />
                            <Show when={searchQuery()}>
                                <button
                                    type="button"
                                    onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
                                    class="absolute inset-y-0 right-0 pr-2.5 flex items-center text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <line x1="18" y1="6" x2="6" y2="18" />
                                        <line x1="6" y1="6" x2="18" y2="18" />
                                    </svg>
                                </button>
                            </Show>
                        </div>

                        {/* Activity Filter */}
                        <div class="md:col-span-3">
                            <select
                                value={selectedActivityId()}
                                onChange={(e) => {
                                    setSelectedActivityId((e.target as HTMLSelectElement).value);
                                    setCurrentPage(1);
                                }}
                                class="w-full py-2 px-3 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            >
                                <option value="">All Campaign Activities</option>
                                <For each={activityOptions()}>
                                    {(act) => (
                                        <option value={act.id}>
                                            {act.name || `Activity ${act.id?.substring(0, 8)}`}
                                        </option>
                                    )}
                                </For>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div class="md:col-span-2">
                            <select
                                value={selectedLockFilter()}
                                onChange={(e) => setSelectedLockFilter((e.target as HTMLSelectElement).value as any)}
                                class="w-full py-2 px-3 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            >
                                <option value="all">Status: All</option>
                                <option value="open">Open Only</option>
                                <option value="locked">Locked Only</option>
                            </select>
                        </div>

                        {/* Capacity Filter */}
                        <div class="md:col-span-2">
                            <select
                                value={selectedCapacityFilter()}
                                onChange={(e) => setSelectedCapacityFilter((e.target as HTMLSelectElement).value as any)}
                                class="w-full py-2 px-3 text-xs sm:text-sm font-mono text-neutral-900 dark:text-white bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                            >
                                <option value="all">Capacity: All</option>
                                <option value="available">Has Free Seats</option>
                                <option value="near-full">Near Full (&gt;80%)</option>
                                <option value="full">Completely Full</option>
                            </select>
                        </div>
                    </div>

                    {/* Secondary toolbar: Sort, Per Page, Reset */}
                    <div class="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/50 text-xs font-mono">
                        <div class="flex items-center gap-2">
                            <span class="text-neutral-500">Sort by:</span>
                            <div class="inline-flex rounded-xs border border-neutral-300 dark:border-neutral-700 overflow-hidden">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (sortField() === 'name') {
                                            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                        } else {
                                            setSortField('name');
                                            setSortDirection('asc');
                                        }
                                    }}
                                    class={`px-2.5 py-1 text-xs cursor-pointer ${sortField() === 'name' ? 'bg-blue-600 text-white font-semibold' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50'}`}
                                >
                                    Name {sortField() === 'name' && (sortDirection() === 'asc' ? '↑' : '↓')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (sortField() === 'code') {
                                            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                        } else {
                                            setSortField('code');
                                            setSortDirection('asc');
                                        }
                                    }}
                                    class={`px-2.5 py-1 text-xs cursor-pointer border-l border-neutral-300 dark:border-neutral-700 ${sortField() === 'code' ? 'bg-blue-600 text-white font-semibold' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50'}`}
                                >
                                    Code {sortField() === 'code' && (sortDirection() === 'asc' ? '↑' : '↓')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (sortField() === 'enrolled') {
                                            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                                        } else {
                                            setSortField('enrolled');
                                            setSortDirection('desc');
                                        }
                                    }}
                                    class={`px-2.5 py-1 text-xs cursor-pointer border-l border-neutral-300 dark:border-neutral-700 ${sortField() === 'enrolled' ? 'bg-blue-600 text-white font-semibold' : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50'}`}
                                >
                                    Enrolled {sortField() === 'enrolled' && (sortDirection() === 'asc' ? '↑' : '↓')}
                                </button>
                            </div>

                            <button
                                type="button"
                                onClick={resetFilters}
                                class="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer ml-1"
                            >
                                Reset filters
                            </button>
                        </div>

                        <div class="flex items-center gap-2">
                            <span class="text-neutral-500">Show:</span>
                            <select
                                value={itemsPerPage()}
                                onChange={(e) => {
                                    setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                    setCurrentPage(1);
                                }}
                                class="py-1 px-2 text-xs font-mono bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xs text-neutral-900 dark:text-white"
                            >
                                <option value={10}>10 / page</option>
                                <option value={25}>25 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div class="border border-neutral-200 dark:border-neutral-700/70 bg-white dark:bg-neutral-800 rounded-xs shadow-2xs overflow-hidden">
                    {/* Desktop Table View */}
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full text-xs text-left">
                            <thead class="text-[11px] font-mono text-neutral-600 dark:text-neutral-400 uppercase bg-neutral-50 dark:bg-neutral-900/80 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th class="px-4 py-3.5 w-12 text-center">#</th>
                                    <th class="px-4 py-3.5 min-w-50">Class / Section</th>
                                    <th class="px-4 py-3.5 min-w-55">Course</th>
                                    <th class="px-4 py-3.5 min-w-45">Instructors</th>
                                    <th class="px-4 py-3.5 min-w-35">Enrollment</th>
                                    <th class="px-4 py-3.5 min-w-30">Period</th>
                                    <th class="px-4 py-3.5 min-w-22.5 text-center">Status</th>
                                    <th class="px-4 py-3.5 text-right min-w-32.5">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/60 font-mono">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 5 })}>
                                            {() => (
                                                <tr class="animate-pulse">
                                                    <td class="px-4 py-3.5 text-center"><div class="size-4 bg-neutral-200 dark:bg-neutral-700 mx-auto"></div></td>
                                                    <td class="px-4 py-3.5"><div class="h-4 w-40 bg-neutral-200 dark:bg-neutral-700 mb-1.5"></div><div class="h-3 w-20 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3.5"><div class="h-4 w-48 bg-neutral-200 dark:bg-neutral-700 mb-1.5"></div><div class="h-3 w-24 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3.5"><div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3.5"><div class="h-3 w-24 bg-neutral-200 dark:bg-neutral-700 mb-1"></div><div class="h-2 w-full bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3.5"><div class="h-3 w-20 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3.5 text-center"><div class="h-5 w-14 bg-neutral-200 dark:bg-neutral-700 mx-auto rounded-xs"></div></td>
                                                    <td class="px-4 py-3.5 text-right"><div class="h-7 w-20 bg-neutral-200 dark:bg-neutral-700 ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={displayedItems().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="8" class="px-4 py-16 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center gap-2 max-w-sm mx-auto">
                                                        <div class="size-12 rounded-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-400">
                                                            <svg class="size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                                                <path d="M3 9h18" />
                                                                <path d="M9 21V9" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-bold text-sm text-neutral-800 dark:text-neutral-200">No teaching classes found</span>
                                                        <span class="text-xs text-neutral-500">
                                                            {searchQuery() || selectedActivityId() || selectedLockFilter() !== 'all'
                                                                ? 'Try adjusting your search criteria or clear the applied filters.'
                                                                : 'No teaching records are currently registered on the server.'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={resetFilters}
                                                            class="mt-2 px-3 py-1.5 text-xs font-mono font-medium text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/80 rounded-xs hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                                        >
                                                            Reset all filters
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={displayedItems()}>
                                            {(item, idx) => {
                                                const enrolled = item.enrolled_count || 0;
                                                const maxCap = item.max_member || 0;
                                                const capPct = maxCap > 0 ? Math.min(100, Math.round((enrolled / maxCap) * 100)) : 0;
                                                const isFull = maxCap > 0 && enrolled >= maxCap;

                                                return (
                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                                        <td class="px-4 py-3 text-center text-neutral-400 font-mono text-xs">
                                                            {startIndex() + idx() + 1}
                                                        </td>

                                                        <td class="px-4 py-3">
                                                            <div class="flex items-start gap-2">
                                                                <span class="inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600 shrink-0">
                                                                    {getItemClassCode(item)}
                                                                </span>
                                                                <div class="min-w-0">
                                                                    <a
                                                                        href={`${basePath}/${item.id}`}
                                                                        class="font-bold text-blue-600 dark:text-blue-400 hover:underline block truncate max-w-xs"
                                                                    >
                                                                        {item.name || getItemCourseName(item)}
                                                                    </a>
                                                                    <div class="flex items-center gap-1.5 mt-0.5 text-[11px] text-neutral-500">
                                                                        <span class="truncate max-w-35">{item.activity?.name || 'General Activity'}</span>
                                                                        <span>•</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => copyToClipboard(item.id, 'ID')}
                                                                            class="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 cursor-pointer"
                                                                            title={`Copy UUID: ${item.id}`}
                                                                        >
                                                                            ID
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td class="px-4 py-3">
                                                            <div class="space-y-0.5">
                                                                <div class="font-semibold text-neutral-900 dark:text-white truncate max-w-sm">
                                                                    {getItemCourseName(item)}
                                                                </div>
                                                                <div class="flex items-center gap-2 text-[11px]">
                                                                    <span class="px-1 py-0.2 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-[10px]">
                                                                        {getItemCourseCode(item)}
                                                                    </span>
                                                                    <span class="text-neutral-500">
                                                                        {getItemCredits(item)} SKS
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td class="px-4 py-3">
                                                            <span class="text-xs text-neutral-700 dark:text-neutral-300 block truncate max-w-50" title={getItemLecturers(item)}>
                                                                {getItemLecturers(item)}
                                                            </span>
                                                        </td>

                                                        <td class="px-4 py-3">
                                                            <div class="space-y-1">
                                                                <div class="flex items-center justify-between text-[11px]">
                                                                    <span class={isFull ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-neutral-700 dark:text-neutral-300'}>
                                                                        {enrolled} / {maxCap > 0 ? maxCap : '∞'}
                                                                    </span>
                                                                    <span class="text-neutral-400 text-[10px]">
                                                                        {maxCap > 0 ? `${capPct}%` : 'open'}
                                                                    </span>
                                                                </div>
                                                                <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                                                                    <div
                                                                        class={`h-full transition-all duration-300 ${
                                                                            capPct >= 95
                                                                                ? 'bg-rose-500'
                                                                                : capPct >= 80
                                                                                ? 'bg-amber-500'
                                                                                : 'bg-emerald-500'
                                                                        }`}
                                                                        style={{ width: `${maxCap > 0 ? capPct : 15}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400 text-[11px]">
                                                            <div>{item.start_date || '-'}</div>
                                                            <div class="text-[10px] text-neutral-400">to {item.end_date || '-'}</div>
                                                        </td>

                                                        <td class="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleToggleLock(item)}
                                                                class={`px-2 py-0.5 text-[10px] font-bold border transition-colors cursor-pointer inline-flex items-center gap-1 ${
                                                                    item.is_lock
                                                                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                                                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                                                }`}
                                                                title={`Click to ${item.is_lock ? 'unlock' : 'lock'} class`}
                                                            >
                                                                <svg class="size-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                                                    {item.is_lock ? (
                                                                        <>
                                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                                                            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                                                        </>
                                                                    )}
                                                                </svg>
                                                                <span>{item.is_lock ? 'LOCKED' : 'OPEN'}</span>
                                                            </button>
                                                        </td>

                                                        <td class="px-4 py-3 text-right">
                                                            <div class="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openPreviewModal(item)}
                                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50 dark:text-neutral-300 dark:hover:text-indigo-400 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                                    title="Quick Preview"
                                                                >
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                                        <circle cx="12" cy="12" r="3" />
                                                                    </svg>
                                                                </button>

                                                                <a
                                                                    href={`${basePath}/${item.id}`}
                                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:text-neutral-300 dark:hover:text-blue-400 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                                    title="Full Detail View"
                                                                >
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                                                        <polyline points="15 3 21 3 21 9" />
                                                                        <line x1="10" y1="14" x2="21" y2="3" />
                                                                    </svg>
                                                                </a>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(item)}
                                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-amber-600 hover:border-amber-400 hover:bg-amber-50 dark:text-neutral-300 dark:hover:text-amber-400 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                                    title="Edit Class"
                                                                >
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M12 20h9" />
                                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                                    </svg>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteModal(item)}
                                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-rose-600 hover:border-rose-400 hover:bg-rose-50 dark:text-neutral-300 dark:hover:text-rose-400 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                                    title="Delete Class"
                                                                >
                                                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                                        <path d="M3 6h18" />
                                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile Responsive Card View (< md) */}
                    <div class="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                        <Show
                            when={!isLoading()}
                            fallback={
                                <For each={Array.from({ length: 3 })}>
                                    {() => (
                                        <div class="p-4 space-y-3 animate-pulse">
                                            <div class="h-4 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div class="h-3 w-32 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div class="h-8 bg-neutral-200 dark:bg-neutral-700"></div>
                                        </div>
                                    )}
                                </For>
                            }
                        >
                            <Show
                                when={displayedItems().length > 0}
                                fallback={
                                    <div class="p-8 text-center text-neutral-500 text-xs font-mono">
                                        No teaching classes match the filters.
                                    </div>
                                }
                            >
                                <For each={displayedItems()}>
                                    {(item) => {
                                        const enrolled = item.enrolled_count || 0;
                                        const maxCap = item.max_member || 0;
                                        const capPct = maxCap > 0 ? Math.min(100, Math.round((enrolled / maxCap) * 100)) : 0;

                                        return (
                                            <div class="p-4 space-y-3 font-mono text-xs">
                                                <div class="flex items-start justify-between gap-2">
                                                    <div class="min-w-0">
                                                        <div class="flex items-center gap-1.5 mb-1">
                                                            <span class="px-1.5 py-0.5 text-[10px] font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-600">
                                                                {getItemClassCode(item)}
                                                            </span>
                                                            <span class="text-[10px] text-neutral-500 truncate max-w-37.5">
                                                                {item.activity?.name || 'General Activity'}
                                                            </span>
                                                        </div>
                                                        <a
                                                            href={`${basePath}/${item.id}`}
                                                            class="font-bold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                        >
                                                            {item.name || getItemCourseName(item)}
                                                        </a>
                                                        <div class="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 truncate">
                                                            {getItemCourseName(item)} ({getItemCourseCode(item)} • {getItemCredits(item)} SKS)
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleLock(item)}
                                                        class={`px-2 py-0.5 text-[10px] font-bold border shrink-0 ${
                                                            item.is_lock
                                                                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800'
                                                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                                                        }`}
                                                    >
                                                        {item.is_lock ? 'LOCKED' : 'OPEN'}
                                                    </button>
                                                </div>

                                                <div class="space-y-1 py-1 border-t border-b border-neutral-100 dark:border-neutral-700/60 text-[11px]">
                                                    <div class="flex justify-between text-neutral-500">
                                                        <span>Instructors:</span>
                                                        <span class="text-neutral-800 dark:text-neutral-200 font-medium truncate max-w-45">
                                                            {getItemLecturers(item)}
                                                        </span>
                                                    </div>
                                                    <div class="flex justify-between text-neutral-500">
                                                        <span>Enrollment:</span>
                                                        <span class="text-neutral-800 dark:text-neutral-200 font-medium">
                                                            {enrolled} / {maxCap > 0 ? maxCap : '∞'} ({capPct}%)
                                                        </span>
                                                    </div>
                                                    <div class="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden mt-1">
                                                        <div
                                                            class={`h-full ${capPct >= 95 ? 'bg-rose-500' : capPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                            style={{ width: `${maxCap > 0 ? capPct : 15}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                <div class="flex items-center justify-end gap-1.5 pt-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => openPreviewModal(item)}
                                                        class="px-2.5 py-1 text-xs border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                                    >
                                                        Preview
                                                    </button>
                                                    <a
                                                        href={`${basePath}/${item.id}`}
                                                        class="px-2.5 py-1 text-xs bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 hover:bg-blue-100"
                                                    >
                                                        Details
                                                    </a>
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        class="px-2.5 py-1 text-xs border border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => openDeleteModal(item)}
                                                        class="px-2.5 py-1 text-xs border border-rose-300 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    }}
                                </For>
                            </Show>
                        </Show>
                    </div>

                    {/* Pagination Bar */}
                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-3">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Showing <span class="font-semibold text-neutral-900 dark:text-white">{startIndex() + (totalData() > 0 ? 1 : 0)}</span>–<span class="font-semibold text-neutral-900 dark:text-white">{endIndex()}</span> of <span class="font-semibold text-neutral-900 dark:text-white">{totalData().toLocaleString()}</span> classes
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
                </div>
            </main>

            {/* CREATE / EDIT CLASS MODAL */}
            <Show when={isFormModalOpen()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                    <div class="w-full max-w-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xs shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Modal Header */}
                        <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between bg-neutral-50 dark:bg-neutral-900/60 font-mono">
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    {isEditing() ? 'Edit Teaching Class Section' : 'Create New Teaching Class'}
                                </h3>
                                <p class="text-xs text-neutral-500">
                                    {isEditing() ? `Updating record ${editingItem()?.id}` : 'Fill in the details to schedule a new teaching class section.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeFormModal}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer p-1"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        {/* Modal Form Body */}
                        <form onSubmit={handleFormSubmit} class="flex-1 overflow-y-auto p-5 space-y-4 font-mono text-xs">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Course Selection */}
                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Course (Mata Kuliah) <span class="text-rose-500">*</span>
                                        <Show when={isLoadingOptions()}>
                                            <span class="text-[10px] text-blue-500 animate-pulse font-normal ml-1.5">(loading options...)</span>
                                        </Show>
                                    </label>
                                    <select
                                        required
                                        value={formCourseId()}
                                        onChange={(e) => setFormCourseId((e.target as HTMLSelectElement).value)}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Select Course</option>
                                        <For each={courseOptions()}>
                                            {(c) => (
                                                <option value={c.id}>
                                                    {c.code ? `[${c.code}] ` : ''}{c.name} {c.total_credit ? `(${c.total_credit} SKS)` : ''}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </div>

                                {/* Class Code Selection */}
                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Class Code (Kode Kelas) <span class="text-rose-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formClassCodeId()}
                                        onChange={(e) => setFormClassCodeId((e.target as HTMLSelectElement).value)}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Select Class Code</option>
                                        <For each={classCodeOptions()}>
                                            {(cc) => (
                                                <option value={cc.id}>
                                                    {cc.alphabet_code || cc.code ? `[${cc.alphabet_code || cc.code}] ` : ''}{cc.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </div>

                                {/* Section Name */}
                                <div class="space-y-1 sm:col-span-2">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Section Name (Nama Kelas/Ruang Ajar)
                                    </label>
                                    <input
                                        type="text"
                                        value={formName()}
                                        onInput={(e) => setFormName((e.target as HTMLInputElement).value)}
                                        placeholder="e.g. Pemrograman Web - Kelas A"
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <p class="text-[11px] text-neutral-400">Leave blank to inherit course and class naming automatically.</p>
                                </div>

                                {/* Campaign Activity */}
                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Campaign Activity (Semester/Periode)
                                    </label>
                                    <select
                                        value={formActivityId()}
                                        onChange={(e) => setFormActivityId((e.target as HTMLSelectElement).value)}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Select Activity</option>
                                        <For each={activityOptions()}>
                                            {(act) => (
                                                <option value={act.id}>
                                                    {act.name}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </div>

                                {/* Teach Decree */}
                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Teach Decree (SK Mengajar)
                                    </label>
                                    <select
                                        value={formTeachDecreeId()}
                                        onChange={(e) => setFormTeachDecreeId((e.target as HTMLSelectElement).value)}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        <option value="">Select Decree</option>
                                        <For each={teachDecreeOptions()}>
                                            {(dec) => (
                                                <option value={dec.id}>
                                                    {dec.decree_number || `SK: ${dec.id.substring(0, 8)}`}
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </div>

                                {/* Max Capacity */}
                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Max Capacity (Kapasitas Maksimal)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formMaxMember()}
                                        onInput={(e) => setFormMaxMember(Number((e.target as HTMLInputElement).value))}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                    <p class="text-[11px] text-neutral-400">Set 0 for unlimited student capacity.</p>
                                </div>

                                {/* Lock Status */}
                                <div class="space-y-1 flex flex-col justify-center">
                                    <label class="font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Lock Status
                                    </label>
                                    <label class="inline-flex items-center gap-2 cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            checked={formIsLock()}
                                            onChange={(e) => setFormIsLock((e.target as HTMLInputElement).checked)}
                                            class="rounded text-blue-600 focus:ring-blue-500 size-4"
                                        />
                                        <span class="text-neutral-800 dark:text-neutral-200">
                                            Lock class section (prevent score & roster edits)
                                        </span>
                                    </label>
                                </div>

                                {/* Dates */}
                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Start Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formStartDate()}
                                        onInput={(e) => setFormStartDate((e.target as HTMLInputElement).value)}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                <div class="space-y-1">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        End Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formEndDate()}
                                        onInput={(e) => setFormEndDate((e.target as HTMLInputElement).value)}
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Description */}
                                <div class="space-y-1 sm:col-span-2">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                        Description & Operational Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formDescription()}
                                        onInput={(e) => setFormDescription((e.target as HTMLTextAreaElement).value)}
                                        placeholder="Add syllabus details, classroom instructions, or notes..."
                                        class="w-full p-2 border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Modal Footer Actions */}
                            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={closeFormModal}
                                    class="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xs hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingForm()}
                                    class="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xs disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
                                >
                                    <Show when={isSubmittingForm()}>
                                        <svg class="size-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" stroke-dasharray="32" stroke-linecap="round" />
                                        </svg>
                                    </Show>
                                    <span>{isEditing() ? 'Save Changes' : 'Create Class'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* QUICK PREVIEW MODAL */}
            <Show when={isPreviewModalOpen() && previewItem()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                    <div class="w-full max-w-lg bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xs shadow-xl p-5 space-y-4 font-mono text-xs animate-in fade-in duration-150">
                        <div class="flex items-start justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <div>
                                <span class="text-[10px] text-blue-600 dark:text-blue-400 uppercase tracking-wider font-bold">Class Section Preview</span>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white mt-0.5">
                                    {previewItem()?.name || getItemCourseName(previewItem()!)}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={closePreviewModal}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>

                        <div class="space-y-2.5">
                            <div class="p-2.5 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700/60 rounded-xs space-y-1.5">
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Course:</span>
                                    <span class="font-bold text-neutral-900 dark:text-white text-right">
                                        {getItemCourseName(previewItem()!)} ({getItemCourseCode(previewItem()!)})
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Class Code:</span>
                                    <span class="font-bold text-neutral-900 dark:text-white">{getItemClassCode(previewItem()!)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Credits (SKS):</span>
                                    <span class="text-neutral-800 dark:text-neutral-200">{getItemCredits(previewItem()!)} SKS</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Instructors:</span>
                                    <span class="text-neutral-800 dark:text-neutral-200 text-right">{getItemLecturers(previewItem()!)}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Activity:</span>
                                    <span class="text-neutral-800 dark:text-neutral-200">{previewItem()?.activity?.name || '-'}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Status:</span>
                                    <span class={`font-bold ${previewItem()?.is_lock ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {previewItem()?.is_lock ? 'LOCKED' : 'OPEN'}
                                    </span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">Capacity:</span>
                                    <span>{previewItem()?.enrolled_count || 0} / {previewItem()?.max_member || '∞'} enrolled</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-neutral-500">UUID:</span>
                                    <span class="font-mono text-[10px] text-neutral-500">{previewItem()?.id}</span>
                                </div>
                            </div>

                            <Show when={previewItem()?.description}>
                                <div class="text-[11px] text-neutral-600 dark:text-neutral-300 italic">
                                    "{previewItem()?.description}"
                                </div>
                            </Show>
                        </div>

                        <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => copyToClipboard(previewItem()!.id, 'UUID')}
                                class="text-blue-600 hover:underline"
                            >
                                Copy UUID
                            </button>
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={closePreviewModal}
                                    class="px-3 py-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xs hover:bg-neutral-50"
                                >
                                    Close
                                </button>
                                <a
                                    href={`${basePath}/${previewItem()!.id}`}
                                    class="px-3.5 py-1.5 bg-blue-600 text-white font-bold rounded-xs hover:bg-blue-700"
                                >
                                    Open Full Details
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </Show>

            {/* DELETE CONFIRMATION MODAL */}
            <Show when={isDeleteModalOpen() && itemToDelete()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
                    <div class="w-full max-w-md bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xs shadow-xl p-5 space-y-4 font-mono text-xs animate-in fade-in zoom-in-95 duration-150">
                        <div class="flex items-start gap-3">
                            <div class="size-9 rounded-xs bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M3 6h18" />
                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                            </div>
                            <div class="space-y-1">
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Confirm Class Deletion
                                </h3>
                                <p class="text-xs text-neutral-500">
                                    Are you sure you want to delete this teaching class section? This operation will soft-delete the class record.
                                </p>
                            </div>
                        </div>

                        <div class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700/60 rounded-xs space-y-1">
                            <div class="font-bold text-neutral-900 dark:text-white">
                                {itemToDelete()?.name || getItemCourseName(itemToDelete()!)}
                            </div>
                            <div class="text-[11px] text-neutral-500">
                                Class Code: {getItemClassCode(itemToDelete()!)} • Course: {getItemCourseCode(itemToDelete()!)}
                            </div>
                            <div class="text-[10px] text-neutral-400 font-mono">
                                ID: {itemToDelete()?.id}
                            </div>
                        </div>

                        <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeDeleteModal}
                                class="px-3.5 py-1.5 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xs hover:bg-neutral-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting()}
                                onClick={handleDeleteSubmit}
                                class="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold rounded-xs disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Show when={isDeleting()}>
                                    <svg class="size-3 animate-spin" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                        <circle cx="12" cy="12" r="10" stroke-width="4" stroke="currentColor" stroke-dasharray="32" stroke-linecap="round" />
                                    </svg>
                                </Show>
                                <span>Delete Record</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
