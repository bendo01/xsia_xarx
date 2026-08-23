import { createSignal, createEffect, For, Show, onMount } from 'solid-js';
import SlimSelect from 'slim-select';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { InstitutionMasterInstitutionDataObject } from '~/models/institution/master/Institution';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import {
    InstitutionMasterInstitutionControllerIndex,
    InstitutionMasterInstitutionControllerDelete,
    fetchInstitutionCategoryOptions,
    fetchInstitutionVarietyOptions,
} from '~/controllers/institution/master/InstitutionMasterInstitutionController';

export default function InstitutionMasterInstitutionIndexPage() {
    let multiSelectRefCategory: HTMLSelectElement | undefined;
    let multiSelectRefVariety: HTMLSelectElement | undefined;
    const inputClass = "block w-full p-3 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-neutral-50 focus:outline-none focus:rounded-none focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder-neutral-400 dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors";

    const [items, setItems] = createSignal<InstitutionMasterInstitutionDataObject[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [sortParam, setSortParam] = createSignal('name-asc');
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Reference options for filters
    const [categoryOptions, setCategoryOptions] = createSignal<ModelSelectItem[]>([]);
    const [varietyOptions, setVarietyOptions] = createSignal<ModelSelectItem[]>([]);

    // Selected item for Delete modal
    let deleteDialogRef!: HTMLDialogElement;
    const [selectedItem, setSelectedItem] = createSignal<InstitutionMasterInstitutionDataObject | null>(null);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await InstitutionMasterInstitutionControllerIndex({
                page: currentPage(),
                per_page: itemsPerPage(),
                search: searchQuery(),
                sort_by: sortParam().split('-')[0],
                sort_dir: sortParam().split('-')[1] || 'asc',
            });

            if (response && Array.isArray(response.data)) {
                setItems(response.data);
                setTotalData(response.pagination?.total_data ?? response.data.length);
                setTotalPages(response.pagination?.total_page || 1);
            } else {
                setItems([]);
                setTotalData(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error loading institutions from server:', error);
            setItems([]);
            setTotalData(0);
            setTotalPages(1);
            toast.danger('Failed to load institutions from server.');
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

    const openDeleteModal = (item: InstitutionMasterInstitutionDataObject) => {
        setSelectedItem(item);
        deleteDialogRef?.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef?.close();
        setSelectedItem(null);
    };

    const handleDeleteSubmit = async () => {
        const item = selectedItem();
        if (!item || !item.institution?.id) return;

        setIsSubmitting(true);
        try {
            const res = await InstitutionMasterInstitutionControllerDelete(item.institution.id);
            if (!res.is_error) {
                toast.success(res.message || 'Institution record deleted successfully!', 5000);
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to delete institution record.', 5000);
            }
        } catch (err: any) {
            toast.danger(err.message || 'Error occurred while deleting.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    onMount(async () => {
        let slimCat: SlimSelect | undefined;
        let slimVar: SlimSelect | undefined;

        if (multiSelectRefCategory) {
            slimCat = new SlimSelect({ select: multiSelectRefCategory });
        }
        if (multiSelectRefVariety) {
            slimVar = new SlimSelect({ select: multiSelectRefVariety });
        }

        try {
            const [categories, varieties] = await Promise.all([
                fetchInstitutionCategoryOptions(),
                fetchInstitutionVarietyOptions(),
            ]);

            setCategoryOptions(categories);
            setVarietyOptions(varieties);

            if (slimCat) {
                slimCat.setData([
                    { placeholder: true, text: 'Choose Category' },
                    ...categories.map((c) => ({
                        text: c.label || '',
                        value: c.id,
                    })),
                ]);
            }

            if (slimVar) {
                slimVar.setData([
                    { placeholder: true, text: 'Choose Variety' },
                    ...varieties.map((v) => ({
                        text: v.label || '',
                        value: v.id,
                    })),
                ]);
            }
        } catch (err) {
            console.error('Failed to load category or variety options:', err);
        }
    });

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Page Header */}
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Institution</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Master Institution</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
                            Institution Master Directory
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Manage institution master directory, parent hierarchies, affiliations, and operational statuses.
                        </p>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href="/institution/master/institution/create"
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-none shadow-xs transition-colors cursor-pointer"
                            id="btn-add-institution"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M5 12h14" />
                                <path d="M12 5v14" />
                            </svg>
                            <span>Add New Institution</span>
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
                                placeholder="Search by institution name or code..."
                                onInput={handleSearch}
                                id="input-search-institution"
                            />
                        </div>
                    </div>

                    <div class="w-full md:w-1/3 flex gap-2">
                        <select
                            class="w-1/2 p-2.5 text-xs sm:text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                            value={sortParam()}
                            onChange={(e) => {
                                setSortParam((e.target as HTMLSelectElement).value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="name-asc">Name (A-Z)</option>
                            <option value="name-desc">Name (Z-A)</option>
                            <option value="code-asc">Code (Ascending)</option>
                            <option value="code-desc">Code (Descending)</option>
                        </select>

                        <select
                            class="w-1/2 p-2.5 text-xs sm:text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
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
                <div class="flex flex-col md:flex-row items-center gap-3">
                    <div class="w-full md:w-1/2">
                        <select id="select-category" ref={multiSelectRefCategory} multiple class={inputClass}>
                            <option data-placeholder="true">Choose Category</option>
                            <For each={categoryOptions()}>
                                {(item) => <option value={item.id}>{item.label}</option>}
                            </For>
                        </select>
                    </div>
                    <div class="w-full md:w-1/2 gap-2">
                        <select id="select-variety" ref={multiSelectRefVariety} multiple class={inputClass}>
                            <option data-placeholder="true">Choose Variety</option>
                            <For each={varietyOptions()}>
                                {(item) => <option value={item.id}>{item.label}</option>}
                            </For>
                        </select>
                    </div>
                </div>

                {/* Table & Cards Container */}
                <div class="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xs overflow-hidden">
                    {/* Mobile View: Cards */}
                    <div class="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                        <Show
                            when={!isLoading()}
                            fallback={
                                <For each={Array.from({ length: 3 })}>
                                    {() => (
                                        <div class="p-4 animate-pulse space-y-3">
                                            <div class="flex items-center gap-3">
                                                <div class="size-10 bg-neutral-200 dark:bg-neutral-700"></div>
                                                <div class="space-y-2 flex-1">
                                                    <div class="h-4 w-40 bg-neutral-200 dark:bg-neutral-700"></div>
                                                    <div class="h-3 w-24 bg-neutral-200 dark:bg-neutral-700"></div>
                                                </div>
                                            </div>
                                            <div class="h-3 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div class="flex justify-end gap-1.5 pt-2">
                                                <div class="size-7 bg-neutral-200 dark:bg-neutral-700"></div>
                                                <div class="size-7 bg-neutral-200 dark:bg-neutral-700"></div>
                                                <div class="size-7 bg-neutral-200 dark:bg-neutral-700"></div>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            }
                        >
                            <Show
                                when={items().length > 0}
                                fallback={
                                    <div class="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                        <div class="flex flex-col items-center justify-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                            </svg>
                                            <span class="font-semibold text-sm text-neutral-700 dark:text-neutral-300">No institutions found</span>
                                            <span class="text-xs text-neutral-500">No data matches your search query.</span>
                                        </div>
                                    </div>
                                }
                            >
                                <For each={items()}>
                                    {(item) => (
                                        <div class="p-4 space-y-3 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                            {/* Header: Name and Code */}
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="min-w-0 flex-1">
                                                    <a
                                                        href={`/institution/master/institution/show?id=${item.institution.id}`}
                                                        class="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                    >
                                                        {item.institution.name || '-'}
                                                    </a>
                                                    <div class="flex flex-wrap items-center gap-1.5 mt-1">
                                                        <span class="px-1.5 py-0.5 text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600">
                                                            {item.institution.code || '-'}
                                                        </span>
                                                        <Show when={item.institution.alphabet_code}>
                                                            <span class="px-1.5 py-0.5 text-xs bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                                                                {item.institution.alphabet_code}
                                                            </span>
                                                        </Show>
                                                        <span class={`inline-flex items-center px-1.5 py-0.5 text-[11px] font-semibold ${item.institution.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-200 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                                            {item.institution.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Metadata */}
                                            <div class="text-xs text-neutral-500 dark:text-neutral-400 pt-1 border-t border-neutral-100 dark:border-neutral-700/60 font-mono truncate" title={item.institution.id}>
                                                UUID: {item.institution.id}
                                            </div>

                                            {/* Actions */}
                                            <div class="flex items-center justify-end gap-1.5 pt-2 border-t border-neutral-100 dark:border-neutral-700/60">
                                                <a
                                                    href={`/institution/master/institution/show?id=${item.institution.id}`}
                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-green-600 hover:border-green-500 hover:bg-green-50 dark:text-neutral-300 dark:hover:text-green-400 dark:hover:border-green-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                    title="View Profile Details"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                    </svg>
                                                </a>

                                                <a
                                                    href={`/institution/master/institution/edit?id=${item.institution.id}`}
                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-yellow-600 hover:border-yellow-500 hover:bg-yellow-50 dark:text-neutral-300 dark:hover:text-yellow-400 dark:hover:border-yellow-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                    title="Edit Record"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                    </svg>
                                                </a>

                                                <button
                                                    type="button"
                                                    onClick={() => openDeleteModal(item)}
                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-red-600 hover:border-red-500 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:border-red-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                    title="Delete Record"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                        <path d="M3 6h18" />
                                                        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </Show>
                        </Show>
                    </div>

                    {/* Desktop View: Table */}
                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full text-xs sm:text-sm text-left">
                            <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th class="px-4 py-3.5 w-40">Code</th>
                                    <th class="px-4 py-3.5">Institution Name</th>
                                    <th class="px-4 py-3.5 w-44">Alphabet Code</th>
                                    <th class="px-4 py-3.5 w-28">Status</th>
                                    <th class="px-4 py-3.5 text-right w-36">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 3 })}>
                                            {() => (
                                                <tr class="animate-pulse">
                                                    <td class="px-4 py-3"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-60 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-28 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-16 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3 text-right"><div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="5" class="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="12" y1="8" x2="12" y2="12" />
                                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                                        </svg>
                                                        <span class="font-semibold text-sm text-neutral-700 dark:text-neutral-300">No institutions found</span>
                                                        <span class="text-xs text-neutral-500">No data matches your query. Try searching with a different keyword.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                    {/* Code */}
                                                    <td class="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-white">
                                                        <span class="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600">
                                                            {item.institution.code || '-'}
                                                        </span>
                                                    </td>

                                                    {/* Name */}
                                                    <td class="px-4 py-3">
                                                        <a
                                                            href={`/institution/master/institution/show?id=${item.institution.id}`}
                                                            class="font-semibold text-blue-600 dark:text-blue-400 hover:underline block"
                                                        >
                                                            {item.institution.name || '-'}
                                                        </a>
                                                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono block truncate max-w-xs">
                                                            {item.institution.id}
                                                        </span>
                                                    </td>

                                                    {/* Alphabet Code */}
                                                    <td class="px-4 py-3 text-neutral-700 dark:text-neutral-300 font-mono text-xs">
                                                        {item.institution.alphabet_code || '-'}
                                                    </td>

                                                    {/* Status */}
                                                    <td class="px-4 py-3">
                                                        <span class={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${item.institution.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'}`}>
                                                            {item.institution.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>

                                                    {/* Actions */}
                                                    <td class="px-4 py-3 text-right">
                                                        <div class="flex items-center justify-end gap-1.5">
                                                            {/* Show / View Details Button */}
                                                            <a
                                                                href={`/institution/master/institution/show?id=${item.institution.id}`}
                                                                class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-green-600 hover:border-green-500 hover:bg-green-50 dark:text-neutral-300 dark:hover:text-green-400 dark:hover:border-green-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                                title="View Profile Details"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                                </svg>
                                                            </a>

                                                            {/* Edit Button */}
                                                            <a
                                                                href={`/institution/master/institution/edit?id=${item.institution.id}`}
                                                                class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-yellow-600 hover:border-yellow-500 hover:bg-yellow-50 dark:text-neutral-300 dark:hover:text-yellow-400 dark:hover:border-yellow-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors"
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
                                                                class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-red-600 hover:border-red-500 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:border-red-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
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

            {/* Delete Confirmation Modal */}
            <dialog
                ref={deleteDialogRef}
                class="p-0 backdrop:bg-black/60 backdrop:backdrop-blur-xs bg-transparent fixed inset-0 m-auto max-w-md w-full"
            >
                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-xl p-6 space-y-4">
                    <div class="flex items-center gap-3 text-red-600 dark:text-red-400">
                        <div class="size-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">Confirm Deletion</h3>
                            <p class="text-xs text-neutral-500">This action will soft-delete the institution.</p>
                        </div>
                    </div>

                    <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300">
                        Are you sure you want to delete <span class="font-semibold text-neutral-900 dark:text-white">{selectedItem()?.institution.name || 'this institution'}</span>?
                    </p>

                    <div class="flex items-center justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            disabled={isSubmitting()}
                            class="px-3.5 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting()}
                            class="px-3.5 py-2 text-xs font-medium text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                            <Show when={isSubmitting()}>
                                <svg class="animate-spin size-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                                </svg>
                            </Show>
                            <span>{isSubmitting() ? 'Deleting...' : 'Delete Institution'}</span>
                        </button>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
