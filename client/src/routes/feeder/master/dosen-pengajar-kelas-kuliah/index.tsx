import { createSignal, createEffect, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiIndex } from '~/controllers/master/masterApiController';

export default function FeederMasterIndexPage() {
    const apiPath = "feeder/master/dosen-pengajar-kelas-kuliah";
    const basePath = "/feeder/master/dosen-pengajar-kelas-kuliah";
    const [items, setItems] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [sortParam, setSortParam] = createSignal('id-asc');
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [field, dir] = sortParam().split('-');
            const response = await masterApiIndex(apiPath, {
                page: currentPage(),
                per_page: itemsPerPage(),
                search: searchQuery(),
                sort_by: field,
                sort_dir: dir || 'asc',
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
            console.error('Error loading feeder data from server:', error);
            setItems([]);
            setTotalData(0);
            setTotalPages(1);
            toast.danger('Failed to load records from server.');
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

    const getItemTitle = (item: any) => {
        return item?.nama || item?.nama_mahasiswa || item?.nama_dosen || item?.nama_mata_kuliah || item?.nama_program_studi || item?.name || item?.id || '-';
    };

    const getItemCode = (item: any) => {
        return item?.nim || item?.nidn || item?.nipd || item?.kode_mata_kuliah || item?.kode_prodi || item?.code || item?.id?.substring(0, 8) || '-';
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
                            <span>Feeder</span>
                            <span>/</span>
                            <span>Master</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Dosen Pengajar Kelas Kuliah</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Dosen Pengajar Kelas Kuliah
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Synchronized master dataset from PDDIKTI Feeder for Dosen Pengajar Kelas Kuliah.
                        </p>
                    </div>
                </div>

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
                                placeholder="Search records..."
                                onInput={handleSearch}
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
                            <option value="id-asc">ID (Ascending)</option>
                            <option value="id-desc">ID (Descending)</option>
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

                <div class="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 shadow-2xs overflow-hidden">
                    <div class="block md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                        <Show
                            when={!isLoading()}
                            fallback={
                                <For each={Array.from({ length: 3 })}>
                                    {() => (
                                        <div class="p-4 animate-pulse space-y-3">
                                            <div class="h-4 w-40 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div class="h-3 w-24 bg-neutral-200 dark:bg-neutral-700"></div>
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
                                            <span class="font-semibold text-sm text-neutral-700 dark:text-neutral-300">No feeder records found</span>
                                            <span class="text-xs text-neutral-500">No data matches your query.</span>
                                        </div>
                                    </div>
                                }
                            >
                                <For each={items()}>
                                    {(item) => (
                                        <div class="p-4 space-y-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/30 transition-colors">
                                            <div class="flex items-start justify-between gap-3">
                                                <div class="flex-1 min-w-0">
                                                    <a
                                                        href={`${basePath}/show?id=${item.id || item.id_feeder || item.uuid}`}
                                                        class="font-semibold text-sm text-blue-600 dark:text-blue-400 hover:underline block truncate"
                                                    >
                                                        {getItemTitle(item)}
                                                    </a>
                                                    <div class="flex items-center gap-1.5 mt-1">
                                                        <span class="px-1.5 py-0.5 text-xs font-mono font-medium bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-600">
                                                            {getItemCode(item)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={`${basePath}/show?id=${item.id || item.id_feeder || item.uuid}`}
                                                    class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-green-600 hover:border-green-500 hover:bg-green-50 dark:text-neutral-300 dark:hover:text-green-400 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                    title="View Record"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                    </svg>
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </Show>
                        </Show>
                    </div>

                    <div class="hidden md:block overflow-x-auto">
                        <table class="w-full text-xs sm:text-sm text-left">
                            <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th class="px-4 py-3.5 w-40">Identifier / Code</th>
                                    <th class="px-4 py-3.5">Name / Title</th>
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
                                                    <td class="px-4 py-3"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-4 py-3"><div class="h-4 w-60 bg-neutral-200 dark:bg-neutral-700"></div></td>
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
                                                <td colspan="3" class="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center gap-2">
                                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-8 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                            <circle cx="12" cy="12" r="10" />
                                                            <line x1="12" y1="8" x2="12" y2="12" />
                                                            <line x1="12" y1="16" x2="12.01" y2="16" />
                                                        </svg>
                                                        <span class="font-semibold text-sm text-neutral-700 dark:text-neutral-300">No feeder records found</span>
                                                        <span class="text-xs text-neutral-500">No data matches your query on the server.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                    <td class="px-4 py-3 font-mono font-medium text-neutral-900 dark:text-white">
                                                        <span class="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600">
                                                            {getItemCode(item)}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <a
                                                            href={`${basePath}/show?id=${item.id || item.id_feeder || item.uuid}`}
                                                            class="font-semibold text-blue-600 dark:text-blue-400 hover:underline block"
                                                        >
                                                            {getItemTitle(item)}
                                                        </a>
                                                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono block truncate max-w-sm">
                                                            {item.id || item.id_feeder || item.uuid}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3 text-right">
                                                        <a
                                                            href={`${basePath}/show?id=${item.id || item.id_feeder || item.uuid}`}
                                                            class="size-7 inline-flex items-center justify-center text-neutral-600 hover:text-green-600 hover:border-green-500 hover:bg-green-50 dark:text-neutral-300 dark:hover:text-green-400 border border-neutral-200 dark:border-neutral-700 transition-colors"
                                                            title="View Details"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-3.5">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                                            </svg>
                                                        </a>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>

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
        </div>
    );
}
