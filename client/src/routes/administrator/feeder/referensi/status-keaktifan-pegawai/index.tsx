import { createSignal, createEffect, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { FeederReferensiStatusKeaktifanPegawai } from '~/models/feeder/referensi/StatusKeaktifanPegawai';
import {
    FeederReferensiControllerStatusKeaktifanPegawaiIndex,
    FeederReferensiControllerStatusKeaktifanPegawaiUpsert,
    FeederReferensiControllerStatusKeaktifanPegawaiDelete,
} from '~/controllers/feeder/referensi/FeederReferensiStatusKeaktifanPegawaiController';

export default function FeederReferensiStatusKeaktifanPegawaiPage() {
    const [items, setItems] = createSignal<FeederReferensiStatusKeaktifanPegawai[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [sortParam, setSortParam] = createSignal('name-asc');
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Dialog refs
    let createDialogRef!: HTMLDialogElement;
    let editDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;

    // Form state for Create & Edit
    const [formData, setFormData] = createSignal<{
        id?: string | null;
        id_status_aktif?: any;
        nama_status_aktif?: string;
    }>({
        id: null,
        id_status_aktif: '',
        nama_status_aktif: '',
    });
    const [formErrors, setFormErrors] = createSignal<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Selected item for Delete
    const [selectedItem, setSelectedItem] = createSignal<FeederReferensiStatusKeaktifanPegawai | null>(null);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [field, dir] = sortParam().split('-');
            const response = await FeederReferensiControllerStatusKeaktifanPegawaiIndex({
                page: currentPage(),
                per_page: itemsPerPage(),
                search: searchQuery(),
                sort_by: field,
                sort_dir: dir || 'asc',
            });

            if (response && response.data) {
                let data = response.data as unknown as FeederReferensiStatusKeaktifanPegawai[];
                const order = dir === 'desc' ? -1 : 1;
                data = [...data].sort((a, b) => {
                    const aVal = String(a.nama_status_aktif || '').toLowerCase();
                    const bVal = String(b.nama_status_aktif || '').toLowerCase();
                    if (aVal < bVal) return -1 * order;
                    if (aVal > bVal) return 1 * order;
                    return 0;
                });

                setItems(data);
                setTotalData(response.pagination?.total_data || data.length);
                setTotalPages(response.pagination?.total_page || 1);
            } else {
                setItems([]);
                setTotalData(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            toast.danger('Failed to load referensi keaktifan pegawai from server.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        currentPage();
        itemsPerPage();
        searchQuery();
        sortParam();
        fetchData();
    });

    let searchTimeout: any;
    const handleSearch = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchQuery(val);
            setCurrentPage(1);
        }, 300);
    };

    const handleItemsPerPageChange = (e: Event) => {
        const value = Number((e.target as HTMLSelectElement).value);
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const openCreateModal = () => {
        setFormData({
            id: null,
            id_status_aktif: '',
            nama_status_aktif: '',
        });
        setFormErrors({});
        createDialogRef.showModal();
    };

    const closeCreateModal = () => {
        createDialogRef.close();
    };

    const openEditModal = (item: FeederReferensiStatusKeaktifanPegawai) => {
        setFormData({
            id: item.id,
            id_status_aktif: item.id_status_aktif ?? '',
            nama_status_aktif: item.nama_status_aktif ?? '',
        });
        setFormErrors({});
        editDialogRef.showModal();
    };

    const closeEditModal = () => {
        editDialogRef.close();
    };

    const openDeleteModal = (item: FeederReferensiStatusKeaktifanPegawai) => {
        setSelectedItem(item);
        deleteDialogRef.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef.close();
        setSelectedItem(null);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        const currentForm = formData();

        if (!currentForm.nama_status_aktif || currentForm.nama_status_aktif.trim() === '') {
            errors.nama_status_aktif = 'Nama Status Aktif is required.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateSubmit = async (e: Event) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const res = await FeederReferensiControllerStatusKeaktifanPegawaiUpsert(formData());
            if (!res.is_error) {
                toast.success(res.message || 'Record created successfully!', 5000);
                closeCreateModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to create record.', 5000);
            }
        } catch (error: any) {
            toast.danger(error.message || 'Error occurred while creating.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: Event) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const res = await FeederReferensiControllerStatusKeaktifanPegawaiUpsert(formData());
            if (!res.is_error) {
                toast.success(res.message || 'Record updated successfully!', 5000);
                closeEditModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to update record.', 5000);
            }
        } catch (error: any) {
            toast.danger(error.message || 'Error occurred while updating.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        const item = selectedItem();
        if (!item || !item.id) return;

        setIsSubmitting(true);
        try {
            const res = await FeederReferensiControllerStatusKeaktifanPegawaiDelete({ id: item.id });
            if (!res.is_error) {
                toast.success(res.message || 'Record deleted successfully!', 5000);
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete record.', 5000);
            }
        } catch (error: any) {
            toast.danger(error.message || 'Error occurred while deleting.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    return (
        <>
            <TopBar />

            {/* Page Header */}
            <div class="sm:flex sm:items-center sm:justify-between mb-4 px-3 pt-4">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Referensi Keaktifan Pegawai
                    </h1>
                    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Master referensi status dinas aktif/cuti/tugas belajar pegawai PDDIKTI Feeder.
                    </p>
                </div>
                <div class="mt-4 sm:mt-0 flex items-center gap-2 justify-end">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        class="inline-flex items-center gap-x-2 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-none shadow-xs transition-colors cursor-pointer"
                        id="btn-add-status-keaktifan-pegawai"
                    >
                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                        <span>Add Record</span>
                    </button>
                </div>
            </div>

            {/* Search & Filter Controls */}
            <div class="px-3 mb-4 flex flex-col md:flex-row items-center gap-3 w-full">
                <div class="w-full md:w-2/3">
                    <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                        Search Filter
                    </label>
                    <div class="relative w-full">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                            <svg class="w-4 h-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            class="block w-full p-2 pl-10 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:placeholder-neutral-400 dark:text-white transition-colors"
                            placeholder="Search by name..."
                            onInput={handleSearch}
                            id="input-search-status-keaktifan-pegawai"
                        />
                    </div>
                </div>

                <div class="w-full md:w-1/3 flex gap-2">
                    <div class="w-1/2">
                        <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                            Sort By
                        </label>
                        <select
                            class="block w-full p-2 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                            value={sortParam()}
                            onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                            id="select-sort-status-keaktifan-pegawai"
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                        </select>
                    </div>
                    <div class="w-1/2">
                        <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                            Per Page
                        </label>
                        <select
                            class="block w-full p-2 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                            value={itemsPerPage()}
                            onChange={handleItemsPerPageChange}
                            id="select-per-page-status-keaktifan-pegawai"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Content Table Container */}
            <div class="lg:mx-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xs">
                {/* Desktop Table View */}
                <div class="hidden md:flex md:flex-col">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left whitespace-nowrap">
                            <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider">ID Status Aktif</th>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider">Nama Status Aktif</th>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider">Created At</th>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 3 })}>
                                            {() => (
                                                <tr class="animate-pulse hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                    <td class="px-6 py-4"><div class="h-5 w-24 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-6 py-4"><div class="h-5 w-48 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-6 py-4 text-right flex justify-end gap-2">
                                                        <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700"></div>
                                                        <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700"></div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="4" class="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center space-y-2">
                                                        <svg class="size-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                                        </svg>
                                                        <p class="text-sm font-medium">No records found</p>
                                                        <p class="text-xs">Click "Add Record" to create a new reference entry.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                                                    <td class="px-6 py-4 font-mono">
                                                        <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                                                            {item.id_status_aktif ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="font-medium text-neutral-900 dark:text-white">{item.nama_status_aktif}</div>
                                                        <div class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">{item.id}</div>
                                                    </td>
                                                    <td class="px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td class="px-6 py-4 text-right">
                                                        <div class="flex justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                class="size-8 inline-flex justify-center items-center text-neutral-700 hover:text-yellow-600 hover:border-yellow-500 hover:bg-yellow-50 dark:text-neutral-300 dark:hover:text-yellow-400 dark:hover:border-yellow-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                                title="Edit Record"
                                                                aria-label="Edit record"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="size-8 inline-flex justify-center items-center text-neutral-700 hover:text-red-600 hover:border-red-500 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:border-red-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                                title="Delete Record"
                                                                aria-label="Delete record"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <path d="M3 6h18" />
                                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div class="md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <For each={Array.from({ length: 2 })}>
                                {() => (
                                    <div class="p-4 space-y-3 animate-pulse">
                                        <div class="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-700"></div>
                                        <div class="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-700"></div>
                                        <div class="flex justify-end gap-2 pt-2">
                                            <div class="h-8 w-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div class="h-8 w-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                        </div>
                                    </div>
                                )}
                            </For>
                        }
                    >
                        <Show
                            when={items().length > 0}
                            fallback={
                                <div class="p-8 text-center text-neutral-500 dark:text-neutral-400">
                                    No records found.
                                </div>
                            }
                        >
                            <For each={items()}>
                                {(item) => (
                                    <div class="p-4 space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200">
                                                ID: {item.id_status_aktif ?? '-'}
                                            </span>
                                            <span class="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <div>
                                            <h3 class="font-medium text-neutral-900 dark:text-white">{item.nama_status_aktif}</h3>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">{item.id}</p>
                                        </div>
                                        <div class="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(item)}
                                                class="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-500 dark:text-blue-400 dark:bg-blue-950/50 dark:hover:text-yellow-400 dark:hover:border-yellow-500 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(item)}
                                                class="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-50 hover:text-red-600 hover:border-red-500 dark:text-red-400 dark:bg-red-950/50 dark:hover:text-red-400 dark:hover:border-red-500 border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </Show>
                    </Show>
                </div>

                {/* Pagination Footer */}
                <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-4 py-3 sm:px-6 gap-3 sm:gap-0">
                    <div class="text-sm text-neutral-700 dark:text-neutral-300 text-center sm:text-left">
                        Showing <span class="font-medium">{totalData() > 0 ? startIndex() + 1 : 0}</span> to <span class="font-medium">{endIndex()}</span> of <span class="font-medium">{totalData()}</span> results
                    </div>
                    <div class="flex justify-center">
                        <nav class="inline-flex -space-x-px shadow-2xs" aria-label="Pagination">
                            <button
                                type="button"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                disabled={currentPage() <= 1 || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                <span class="sr-only">Previous</span>
                                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600">
                                {currentPage()} / {totalPages()}
                            </span>
                            <button
                                type="button"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                disabled={currentPage() >= totalPages() || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                            >
                                <span class="sr-only">Next</span>
                                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* 1. CREATE MODAL */}
            <dialog
                ref={createDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeCreateModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div>
                            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                                Add Referensi Keaktifan Pegawai
                            </h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Create a new reference record.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeCreateModal}
                            class="size-8 inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            aria-label="Close dialog"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit} class="space-y-4 pt-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                ID Status Aktif
                            </label>
                            <input
                                type="text"
                                class="block w-full p-2.5 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                                placeholder="e.g. 1"
                                value={formData().id_status_aktif}
                                onInput={(e) => setFormData({ ...formData(), id_status_aktif: e.currentTarget.value })}
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Nama Status Aktif <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                class={`block w-full p-2.5 text-sm text-neutral-900 border rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors ${
                                    formErrors().nama_status_aktif ? 'border-red-500 dark:border-red-500' : 'border-neutral-300'
                                }`}
                                placeholder="Enter name..."
                                value={formData().nama_status_aktif}
                                onInput={(e) => setFormData({ ...formData(), nama_status_aktif: e.currentTarget.value })}
                            />
                            {formErrors().nama_status_aktif && (
                                <p class="text-xs text-red-500 mt-1">{formErrors().nama_status_aktif}</p>
                            )}
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
                            >
                                {isSubmitting() ? 'Creating...' : 'Save Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* 2. EDIT MODAL */}
            <dialog
                ref={editDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeEditModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div>
                            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                                Edit Referensi Keaktifan Pegawai
                            </h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Modify reference record properties.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeEditModal}
                            class="size-8 inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            aria-label="Close dialog"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit} class="space-y-4 pt-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                ID Status Aktif
                            </label>
                            <input
                                type="text"
                                class="block w-full p-2.5 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                                placeholder="e.g. 1"
                                value={formData().id_status_aktif}
                                onInput={(e) => setFormData({ ...formData(), id_status_aktif: e.currentTarget.value })}
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Nama Status Aktif <span class="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                class={`block w-full p-2.5 text-sm text-neutral-900 border rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors ${
                                    formErrors().nama_status_aktif ? 'border-red-500 dark:border-red-500' : 'border-neutral-300'
                                }`}
                                placeholder="Enter name..."
                                value={formData().nama_status_aktif}
                                onInput={(e) => setFormData({ ...formData(), nama_status_aktif: e.currentTarget.value })}
                            />
                            {formErrors().nama_status_aktif && (
                                <p class="text-xs text-red-500 mt-1">{formErrors().nama_status_aktif}</p>
                            )}
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
                            >
                                {isSubmitting() ? 'Updating...' : 'Update Record'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* 3. DELETE CONFIRMATION MODAL */}
            <dialog
                ref={deleteDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-md w-full"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeDeleteModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="size-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                Confirm Delete
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Are you sure you want to delete this record?
                            </p>
                        </div>
                    </div>

                    <p class="text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-none border border-neutral-200 dark:border-neutral-700 mb-4 font-mono text-xs">
                        {selectedItem()?.nama_status_aktif}
                    </p>

                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting()}
                            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
                        >
                            {isSubmitting() ? 'Deleting...' : 'Delete'}
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
