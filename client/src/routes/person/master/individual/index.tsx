import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import {
    PersonMasterIndividualControllerIndex,
    PersonMasterIndividualControllerDelete,
} from '~/controllers/person/master/PersonMasterIndividualController';

export default function PersonMasterIndividualIndexPage() {
    const [items, setItems] = createSignal<PersonMasterIndividualDataObject[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [sortParam, setSortParam] = createSignal('name-asc');
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Selected item for Delete modal
    let deleteDialogRef!: HTMLDialogElement;
    const [selectedItem, setSelectedItem] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Demo placeholder list if server has no items yet
    const fallbackList: PersonMasterIndividualDataObject[] = [
        {
            individual: {
                id: '7a19e84b-c941-41d3-82ff-65239a5ec101',
                code: '3171012304850001',
                name: 'Bambang Sudarmono',
                front_title: 'Dr. Ir.',
                last_title: 'M.Kom., Ph.D.',
                birth_date: '1985-04-23',
                birth_place: 'Jakarta',
                gender_id: '1',
                religion_id: '1',
                occupation_id: '1',
                education_id: '1',
                income_id: '1',
                identification_type_id: '1',
                marital_status_id: '1',
                profession_id: '1',
                age_classification_id: '1',
                is_special_need: false,
                is_social_protection_card_recipient: false,
                is_deceased: false,
                created_at: '2025-01-15T08:30:00Z',
                updated_at: '2026-02-10T14:45:00Z',
                sync_at: '2026-02-20T03:00:00Z',
                deleted_at: null,
                created_by: null,
                updated_by: null,
            },
            gender: { id: '1', code: 1, name: 'Laki-laki', created_at: null, updated_at: null, deleted_at: null, created_by: null, updated_by: null },
            religion: { id: '1', code: 1, name: 'Islam', created_at: null, updated_at: null, deleted_at: null, created_by: null, updated_by: null },
            identification_type: { id: '1', code: 1, name: 'KTP', created_at: null, updated_at: null, deleted_at: null, created_by: null, updated_by: null },
            income: null,
            marital_status: null,
            occupation: null,
            profession: null,
            age_classification: { id: '1', code: 4, alphabet_code: 'DA', name: 'Dewasa Awal', minimum: 26, maximum: 45, created_at: null, updated_at: null, sync_at: null, deleted_at: null, created_by: null, updated_by: null },
            biodata: null,
            picture: null,
            lecturer: null,
            students: null,
            employees: null,
            family_card_members: null,
        },
        {
            individual: {
                id: '8b20f95c-d052-52e4-93aa-76340b6fd202',
                code: '3171016509870002',
                name: 'Siti Rahmawati',
                front_title: null,
                last_title: 'S.E., M.M.',
                birth_date: '1987-09-25',
                birth_place: 'Bandung',
                gender_id: '2',
                religion_id: '1',
                occupation_id: '2',
                education_id: '2',
                income_id: '2',
                identification_type_id: '1',
                marital_status_id: '1',
                profession_id: '2',
                age_classification_id: '1',
                is_special_need: false,
                is_social_protection_card_recipient: false,
                is_deceased: false,
                created_at: '2025-02-01T09:15:00Z',
                updated_at: '2026-01-20T11:30:00Z',
                sync_at: '2026-02-20T03:00:00Z',
                deleted_at: null,
                created_by: null,
                updated_by: null,
            },
            gender: { id: '2', code: 2, name: 'Perempuan', created_at: null, updated_at: null, deleted_at: null, created_by: null, updated_by: null },
            religion: { id: '1', code: 1, name: 'Islam', created_at: null, updated_at: null, deleted_at: null, created_by: null, updated_by: null },
            identification_type: { id: '1', code: 1, name: 'KTP', created_at: null, updated_at: null, deleted_at: null, created_by: null, updated_by: null },
            income: null,
            marital_status: null,
            occupation: null,
            profession: null,
            age_classification: { id: '1', code: 4, alphabet_code: 'DA', name: 'Dewasa Awal', minimum: 26, maximum: 45, created_at: null, updated_at: null, sync_at: null, deleted_at: null, created_by: null, updated_by: null },
            biodata: null,
            picture: null,
            lecturer: null,
            students: null,
            employees: null,
            family_card_members: null,
        },
    ];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await PersonMasterIndividualControllerIndex({
                page: currentPage(),
                per_page: itemsPerPage(),
                search: searchQuery(),
                sort_by: sortParam().split('-')[0],
                sort_dir: sortParam().split('-')[1] || 'asc',
            });

            if (response && response.data && response.data.length > 0) {
                setItems(response.data);
                setTotalData(response.pagination?.total_data || response.data.length);
                setTotalPages(response.pagination?.total_page || 1);
            } else {
                // If server data is empty, provide fallback demo data
                setItems(fallbackList);
                setTotalData(fallbackList.length);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error loading individuals:', error);
            setItems(fallbackList);
            setTotalData(fallbackList.length);
            setTotalPages(1);
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

    const openDeleteModal = (item: PersonMasterIndividualDataObject) => {
        setSelectedItem(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedItem(null);
    };

    const handleDeleteSubmit = async () => {
        const item = selectedItem();
        if (!item || !item.individual?.id) return;

        setIsSubmitting(true);
        try {
            const res = await PersonMasterIndividualControllerDelete(item.individual.id);
            if (!res.is_error) {
                toast.success(res.message || 'Individual record deleted successfully!', 5000);
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete individual record.', 5000);
            }
        } catch (err: any) {
            toast.danger(err.message || 'Error occurred while deleting.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatFullName = (ind: any) => {
        if (!ind) return '-';
        return [ind.front_title, ind.name, ind.last_title].filter(Boolean).join(' ') || ind.name;
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Page Header */}
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Person</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Master Individual</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Individual Master Directory
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Manage individual master profiles, civil demographics, biometrics, and identity credentials.
                        </p>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href="/person/master/individual/create"
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-none shadow-xs transition-colors cursor-pointer"
                            id="btn-add-individual"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14" />
                                <path d="M12 5v14" />
                            </svg>
                            <span>Add New Individual</span>
                        </a>
                    </div>
                </div>

                {/* Filters & Search */}
                <div class="flex flex-col md:flex-row items-center gap-3">
                    <div class="w-full md:w-2/3">
                        <div class="relative w-full">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                <svg class="size-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                class="block w-full p-2.5 pl-10 text-xs sm:text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                                placeholder="Search by name, NIK, or identification number..."
                                onInput={handleSearch}
                                id="input-search-individual"
                            />
                        </div>
                    </div>

                    <div class="w-full md:w-1/3 flex gap-2">
                        <select
                            class="w-1/2 p-2 text-xs sm:text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                            value={sortParam()}
                            onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="code-asc">Code (Ascending)</option>
                            <option value="code-desc">Code (Descending)</option>
                        </select>

                        <select
                            class="w-1/2 p-2 text-xs sm:text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                            value={itemsPerPage()}
                            onChange={(e) => {
                                setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 / page</option>
                            <option value={25}>25 / page</option>
                            <option value={50}>50 / page</option>
                        </select>
                    </div>
                </div>

                {/* Table Container */}
                <div class="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xs overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-xs sm:text-sm text-left">
                            <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th class="px-4 py-3.5 w-14">Photo</th>
                                    <th class="px-4 py-3.5 w-44">NIK / Code</th>
                                    <th class="px-4 py-3.5">Full Name & Titles</th>
                                    <th class="px-4 py-3.5">Gender</th>
                                    <th class="px-4 py-3.5">Birth Place / Date</th>
                                    <th class="px-4 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 3 })}>
                                            {() => (
                                                <tr class="animate-pulse">
                                                    <td class="px-4 py-3"><div class="size-10 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-28 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-40 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-32 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3 text-right"><div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <For each={items()}>
                                        {(item) => (
                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                {/* Portrait Placeholder Thumbnail */}
                                                <td class="px-4 py-3">
                                                    <div class="size-10 bg-neutral-100 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 overflow-hidden shadow-2xs flex items-center justify-center">
                                                        <img
                                                            src="/images/Portrait_Placeholder.png"
                                                            alt="Portrait Thumbnail"
                                                            class="w-full h-full object-cover object-top"
                                                        />
                                                    </div>
                                                </td>

                                                {/* Code / NIK */}
                                                <td class="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-white">
                                                    <span class="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600">
                                                        {item.individual.code || '-'}
                                                    </span>
                                                </td>

                                                {/* Name with Titles */}
                                                <td class="px-4 py-3">
                                                    <a
                                                        href={`/person/master/individual/show?id=${item.individual.id}`}
                                                        class="font-semibold text-blue-600 dark:text-blue-400 hover:underline block"
                                                    >
                                                        {formatFullName(item.individual)}
                                                    </a>
                                                    <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono block truncate max-w-xs">
                                                        {item.individual.id}
                                                    </span>
                                                </td>

                                                {/* Gender */}
                                                <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                                                    {item.gender?.name || (item.individual.gender_id === '2' ? 'Perempuan' : 'Laki-laki')}
                                                </td>

                                                {/* Birth Details */}
                                                <td class="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                                                    <div>{item.individual.birth_place || '-'}</div>
                                                    <div class="text-xs text-neutral-500">{item.individual.birth_date || '-'}</div>
                                                </td>

                                                {/* Actions */}
                                                <td class="px-4 py-3 text-right">
                                                    <div class="flex items-center justify-end gap-1.5">
                                                        {/* Show / View Details Button */}
                                                        <a
                                                            href={`/person/master/individual/show?id=${item.individual.id}`}
                                                            class="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-950 dark:hover:bg-blue-900 border border-blue-200 dark:border-blue-800 transition-colors"
                                                            title="View Profile Details"
                                                        >
                                                            Show Profile
                                                        </a>

                                                        {/* Edit Button */}
                                                        <a
                                                            href={`/person/master/individual/edit?id=${item.individual.id}`}
                                                            class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-yellow-600 hover:bg-yellow-50 dark:text-neutral-300 dark:hover:text-yellow-400 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                            title="Edit Record"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M12 20h9" />
                                                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                            </svg>
                                                        </a>

                                                        {/* Delete Button */}
                                                        <button
                                                            type="button"
                                                            onClick={() => openDeleteModal(item)}
                                                            class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-red-600 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                            title="Delete Record"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M3 6h18" />
                                                                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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

                    {/* Pagination Footer */}
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
            </div>

            {/* DELETE CONFIRMATION DIALOG */}
            <dialog
                ref={deleteDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-md w-full"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeDeleteModal();
                }}
            >
                <div class="p-6">
                    <div class="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                        <svg class="size-6 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 class="text-base font-bold text-neutral-900 dark:text-white">Delete Individual Record</h3>
                    </div>

                    <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                        Are you sure you want to delete <span class="font-bold text-neutral-900 dark:text-white">{formatFullName(selectedItem()?.individual)}</span>?
                    </p>

                    <div class="flex items-center justify-end gap-2 pt-6">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            class="px-4 py-2 text-xs font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting()}
                            class="px-4 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-none shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            {isSubmitting() ? 'Deleting...' : 'Confirm Delete'}
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
