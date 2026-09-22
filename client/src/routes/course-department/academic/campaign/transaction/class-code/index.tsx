import { createSignal, createEffect, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import { getStorageItem } from '~/lib/storage';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    masterApiIndex,
    masterApiDelete
} from '~/controllers/master/masterApiController';

export default function ClassCodeIndexPage() {
    const apiPath = "academic/campaign/transaction/class-codes";

    // List State
    const [items, setItems] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchName, setSearchName] = createSignal('');
    const [searchCode, setSearchCode] = createSignal('');
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Modal References
    let deleteDialogRef!: HTMLDialogElement;

    // Action State
    const [selectedItem, setSelectedItem] = createSignal<any | null>(null);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await masterApiIndex(apiPath, {
                page: currentPage(),
                per_page: itemsPerPage(),
                name: searchName(),
                code: searchCode(),
                unit_id: getStorageItem('unit_id') || '',
            });

            if (response && Array.isArray(response.data)) {
                setItems(response.data);
                setTotalData(response.total);
                setTotalPages(response.total_pages || 1);
            } else {
                setItems([]);
                setTotalData(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error loading data:', error);
            setItems([]);
            toast.danger('Failed to load class codes.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        currentPage();
        itemsPerPage();
        searchName();
        searchCode();
        fetchData();
    });

    let searchTimeout: any;
    const handleNameSearch = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchName(val);
            setCurrentPage(1);
        }, 300);
    };

    const handleCodeSearch = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchCode(val);
            setCurrentPage(1);
        }, 300);
    };

    // Delete Modal Actions
    const openDeleteModal = (item: any) => {
        setSelectedItem(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedItem(null);
    };

    const handleDeleteSubmit = async () => {
        const item = selectedItem();
        const id = item?.id || item?.uuid;
        if (!id) return;

        setIsSubmitting(true);
        try {
            const res = await masterApiDelete(apiPath, id);
            if (res.success) {
                toast.success('Class code deleted successfully!');
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete record.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'Error occurred while deleting.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Course Department</span>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Class Codes</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Class Codes Directory
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Manage class codes for the academic campaign.
                        </p>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <A
                            href="/course-department/academic/campaign/transaction/class-code/create"
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xs shadow-xs transition-colors cursor-pointer"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14" />
                                <path d="M12 5v14" />
                            </svg>
                            <span>Add New Class Code</span>
                        </A>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div class="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <div class="relative w-full sm:w-48">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by name..."
                                onInput={handleNameSearch}
                                class="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xs leading-5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                            />
                        </div>
                        <div class="relative w-full sm:w-48">
                            <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="11" cy="11" r="8" />
                                    <path d="m21 21-4.3-4.3" />
                                </svg>
                            </span>
                            <input
                                type="text"
                                placeholder="Search by code..."
                                onInput={handleCodeSearch}
                                class="block w-full pl-10 pr-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xs leading-5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                            />
                        </div>
                    </div>
                    <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <label class="text-sm text-neutral-600 dark:text-neutral-400">Rows per page:</label>
                        <select
                            value={itemsPerPage()}
                            onChange={(e) => {
                                setItemsPerPage(Number(e.currentTarget.value));
                                setCurrentPage(1);
                            }}
                            class="block px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xs leading-5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                    </div>
                </div>

                <Show when={isLoading() && items().length === 0}>
                    <div class="flex items-center justify-center p-12">
                        <svg class="animate-spin size-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                </Show>

                <Show when={!isLoading() || items().length > 0}>
                <div class="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xs overflow-hidden rounded-xs">
                    {/* Desktop Tabular Display */}
                    <div class="hidden sm:block overflow-x-auto">
                        <table class="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                                <thead class="bg-neutral-50 dark:bg-neutral-900/50">
                                    <tr>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            No
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            Class Code
                                        </th>
                                        <th scope="col" class="px-6 py-3 text-right text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <Show when={items().length > 0} fallback={
                                        <tr>
                                            <td colspan="3" class="px-6 py-8 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                                No class codes found.
                                            </td>
                                        </tr>
                                    }>
                                        <For each={items()}>
                                            {(item, index) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                                                        {(currentPage() - 1) * itemsPerPage() + index() + 1}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-white">
                                                        {item.name}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <div class="flex items-center justify-end gap-3">
                                                            <A
                                                                href={`/course-department/academic/campaign/transaction/class-code/${item.id}`}
                                                                class="text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-300 transition-colors"
                                                                title="View Details"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                                    <circle cx="12" cy="12" r="3" />
                                                                </svg>
                                                            </A>
                                                            <A
                                                                href={`/course-department/academic/campaign/transaction/class-code/${item.id}/edit`}
                                                                class="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                                                title="Edit"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                                                                </svg>
                                                            </A>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                                                title="Delete"
                                                            >
                                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                                </tbody>
                            </table>
                        </div>

                    {/* Mobile Card Display */}
                    <div class="block sm:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                        <Show when={items().length > 0} fallback={
                            <div class="p-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                No class codes found.
                            </div>
                        }>
                            <For each={items()}>
                                {(item, index) => (
                                    <div class="p-4 flex flex-col gap-3">
                                        <div class="flex items-center justify-between">
                                            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700 px-2 py-1 rounded">
                                                #{(currentPage() - 1) * itemsPerPage() + index() + 1}
                                            </span>
                                            <div class="flex gap-2">
                                                <A
                                                    href={`/course-department/academic/campaign/transaction/class-code/${item.id}`}
                                                    class="p-1.5 text-neutral-600 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 rounded transition-colors"
                                                    title="View Details"
                                                >
                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                </A>
                                                <A
                                                    href={`/course-department/academic/campaign/transaction/class-code/${item.id}/edit`}
                                                    class="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40 rounded transition-colors"
                                                    title="Edit"
                                                >
                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M12 20h9" />
                                                        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z" />
                                                    </svg>
                                                </A>
                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(item)}
                                                    class="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded transition-colors"
                                                >
                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                        <line x1="10" y1="11" x2="10" y2="17" />
                                                        <line x1="14" y1="11" x2="14" y2="17" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 class="text-base font-medium text-neutral-900 dark:text-white truncate">
                                                {item.name}
                                            </h3>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </Show>
                    </div>

                    {/* Pagination */}
                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-4 py-3 sm:px-6 gap-3 sm:gap-0">
                        <div class="text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                            Showing <span class="font-medium">{totalData() > 0 ? startIndex() + 1 : 0}</span> to <span class="font-medium">{endIndex()}</span> of <span class="font-medium">{totalData()}</span> results
                        </div>
                        <div class="flex justify-center">
                            <nav class="inline-flex -space-x-px shadow-2xs" aria-label="Pagination">
                                <button
                                    type="button"
                                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer"
                                    disabled={currentPage() <= 1 || isLoading()}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    Previous
                                </button>
                                <span class="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 border border-blue-600">
                                    {currentPage()} / {totalPages()}
                                </span>
                                <button
                                    type="button"
                                    class="inline-flex items-center px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 cursor-pointer"
                                    disabled={currentPage() >= totalPages() || isLoading()}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                                >
                                    Next
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
                </Show>
            </div>

            {/* Delete Confirmation Modal */}
            <dialog
                ref={deleteDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-md w-full"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeDeleteModal();
                }}
            >
                <div class="p-6">
                    <div class="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                        <svg class="size-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 class="text-base font-bold text-neutral-900 dark:text-white">Delete Class Code</h3>
                    </div>

                    <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                        Are you sure you want to delete <span class="font-bold text-neutral-900 dark:text-white">{selectedItem()?.name || 'this item'}</span>?
                    </p>

                    <div class="flex items-center justify-end gap-2 pt-6">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            class="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-xs transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting()}
                            class="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-xs shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting() ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </dialog>

        </div>
    );
}
