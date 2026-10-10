import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';
import type { InstitutionMasterEmployee } from '~/models/institution/master/Employee';

interface EmployeeExtended extends InstitutionMasterEmployee {
    individual?: {
        name?: string | null;
        front_title?: string | null;
        last_title?: string | null;
        gender_id?: string | null;
        birth_date?: string | null;
        birth_place?: string | null;
    } | null;
    institution?: {
        name?: string | null;
        code?: string | null;
    } | null;
}

export default function RectoratEmployeesIndex() {
    const params = useParams();
    const institutionId = () => params.id;

    const [allItems, setAllItems] = createSignal<EmployeeExtended[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [totalData, setTotalData] = createSignal(0);
    const [filterActive, setFilterActive] = createSignal<'all' | 'active' | 'inactive'>('all');

    const filteredItems = createMemo(() => {
        let data = allItems();
        if (filterActive() === 'active') data = data.filter(e => e.is_active === true);
        if (filterActive() === 'inactive') data = data.filter(e => !e.is_active);
        return data;
    });

    const totalPages = createMemo(() => Math.ceil(filteredItems().length / itemsPerPage()) || 1);

    const pagedItems = createMemo(() => {
        const start = (currentPage() - 1) * itemsPerPage();
        return filteredItems().slice(start, start + itemsPerPage());
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await masterApiIndex<EmployeeExtended>('institution/master/employees', {
                page: 1,
                per_page: 500,
                name: searchQuery() || undefined,
                institution_id: institutionId(),
                with_relations: true,
            });

            if (response && Array.isArray(response.data)) {
                setAllItems(response.data);
                setTotalData(response.data.length);
            } else {
                setAllItems([]);
                setTotalData(0);
            }
        } catch (error) {
            console.error('Error loading employees:', error);
            setAllItems([]);
            setTotalData(0);
            toast.danger('Gagal memuat data pegawai dari server.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        institutionId();
        searchQuery();
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

    const displayName = (item: EmployeeExtended) => {
        const ind = item.individual;
        if (!ind) return item.name || '-';
        const parts = [ind.front_title, ind.name || item.name, ind.last_title].filter(Boolean);
        return parts.join(' ') || item.name || '-';
    };

    const activeCount = createMemo(() => allItems().filter(e => e.is_active).length);
    const inactiveCount = createMemo(() => allItems().filter(e => !e.is_active).length);

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + pagedItems().length, filteredItems().length);

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Page Header */}
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div class="space-y-1">
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-blue-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-blue-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Pegawai</span>
                        </nav>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-indigo-200 dark:border-indigo-800/50">
                            <span class="relative flex size-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full size-2 bg-indigo-500"></span>
                            </span>
                            Master Data
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-indigo-600 dark:text-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-9 h-9">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                </svg>
                            </span>
                            Daftar Pegawai
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                            Kelola seluruh data pegawai yang terdaftar pada institusi ini.
                        </p>
                    </div>

                    {/* Summary Stats */}
                    <div class="flex items-center gap-3 shrink-0">
                        <div class="text-center px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm min-w-[80px]">
                            <p class="text-2xl font-black text-neutral-900 dark:text-white">{totalData()}</p>
                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">Total</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm min-w-[80px]">
                            <p class="text-2xl font-black text-emerald-700 dark:text-emerald-400">{activeCount()}</p>
                            <p class="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium uppercase tracking-wide">Aktif</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 shadow-sm min-w-[80px]">
                            <p class="text-2xl font-black text-red-700 dark:text-red-400">{inactiveCount()}</p>
                            <p class="text-[11px] text-red-600 dark:text-red-500 font-medium uppercase tracking-wide">Non-Aktif</p>
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                        {/* Search */}
                        <div class="relative w-full sm:w-96 shadow-sm">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                <svg class="size-4.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="employee-search-input"
                                class="block w-full p-3 pl-11 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-all shadow-sm placeholder:text-neutral-400"
                                placeholder="Cari nama pegawai..."
                                onInput={handleSearch}
                            />
                        </div>

                        {/* Active Filter */}
                        <div class="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm shrink-0">
                            <button
                                type="button"
                                id="filter-all"
                                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterActive() === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                onClick={() => { setFilterActive('all'); setCurrentPage(1); }}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                id="filter-active"
                                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterActive() === 'active' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                onClick={() => { setFilterActive('active'); setCurrentPage(1); }}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                id="filter-inactive"
                                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterActive() === 'inactive' ? 'bg-red-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                onClick={() => { setFilterActive('inactive'); setCurrentPage(1); }}
                            >
                                Non-Aktif
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <A
                            href={`/rectorat/institution/${institutionId()}/employee/create`}
                            id="employee-create-btn"
                            class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Pegawai
                        </A>
                        <label class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Baris:</label>
                        <select
                            id="employee-rows-per-page"
                            class="p-2.5 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-indigo-500 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-colors shadow-sm"
                            value={itemsPerPage()}
                            onChange={(e) => {
                                setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden transition-all">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">Kode</th>
                                    <th class="px-6 py-4">Nama Pegawai</th>
                                    <th class="px-6 py-4">No. SK / Tanggal</th>
                                    <th class="px-6 py-4 text-center">Status</th>
                                    <th class="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 5 })}>
                                            {() => (
                                                <tr class="animate-pulse">
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-20"></div></td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                                                            <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-48"></div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-32"></div></td>
                                                    <td class="px-6 py-4"><div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-full w-16 mx-auto"></div></td>
                                                    <td class="px-6 py-4"><div class="h-7 bg-neutral-200 dark:bg-neutral-800 rounded-md w-20 ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={pagedItems().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="5" class="px-6 py-16 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center gap-3">
                                                        <div class="p-4 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                                                <circle cx="9" cy="7" r="4" />
                                                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-semibold text-base text-neutral-700 dark:text-neutral-300">Tidak ada data pegawai ditemukan</span>
                                                        <span class="text-sm text-neutral-500 dark:text-neutral-400">Silakan ubah kata kunci pencarian atau filter Anda.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={pagedItems()}>
                                            {(item) => {
                                                const initials = () => {
                                                    const name = displayName(item);
                                                    return name.split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
                                                };
                                                return (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                        <td class="px-6 py-4 whitespace-nowrap font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                            {item.code || '-'}
                                                        </td>
                                                        <td class="px-6 py-4">
                                                            <div class="flex items-center gap-3">
                                                                <div class="size-9 rounded-full bg-linear-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                                    {initials()}
                                                                </div>
                                                                <div class="min-w-0">
                                                                    <p class="font-semibold text-neutral-900 dark:text-white truncate leading-tight">
                                                                        {displayName(item)}
                                                                    </p>
                                                                    <Show when={item.individual?.birth_place || item.individual?.birth_date}>
                                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                                                            {item.individual?.birth_place}{item.individual?.birth_place && item.individual?.birth_date ? ', ' : ''}{item.individual?.birth_date || ''}
                                                                        </p>
                                                                    </Show>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="px-6 py-4">
                                                            <Show when={item.decree_number || item.decree_date} fallback={<span class="text-neutral-400 dark:text-neutral-600">-</span>}>
                                                                <div class="min-w-0">
                                                                    <Show when={item.decree_number}>
                                                                        <p class="text-xs font-mono text-neutral-700 dark:text-neutral-300 truncate">{item.decree_number}</p>
                                                                    </Show>
                                                                    <Show when={item.decree_date}>
                                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{item.decree_date}</p>
                                                                    </Show>
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="px-6 py-4 text-center">
                                                            {item.is_active ? (
                                                                <div class="inline-flex items-center justify-center gap-1.5 h-6 px-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                                    <span class="size-1.5 rounded-full bg-emerald-500"></span>
                                                                    Aktif
                                                                </div>
                                                            ) : (
                                                                <div class="inline-flex items-center justify-center gap-1.5 h-6 px-2.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50">
                                                                    <span class="size-1.5 rounded-full bg-red-500"></span>
                                                                    Non-Aktif
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td class="px-6 py-4 text-right">
                                                            <A
                                                                href={`/rectorat/institution/${institutionId()}/employee/${item.id}`}
                                                                id={`employee-detail-btn-${item.id}`}
                                                                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-md transition-all dark:text-indigo-400 dark:border-indigo-800/60 dark:hover:bg-indigo-600 dark:hover:text-white dark:hover:border-indigo-600 cursor-pointer shadow-sm group-hover:shadow focus:ring-2 focus:ring-indigo-500/20"
                                                                title="Lihat Detail Pegawai"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                                </svg>
                                                                Detail
                                                            </A>
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

                    {/* Pagination Footer */}
                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-4">
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">
                            Menampilkan <span class="font-medium text-neutral-900 dark:text-white">{filteredItems().length > 0 ? startIndex() + 1 : 0}</span> sampai <span class="font-medium text-neutral-900 dark:text-white">{endIndex()}</span> dari <span class="font-medium text-neutral-900 dark:text-white">{filteredItems().length}</span> data
                        </div>
                        <div class="flex justify-center">
                            <nav class="inline-flex -space-x-px shadow-sm rounded-lg overflow-hidden" aria-label="Pagination">
                                <button
                                    type="button"
                                    id="employee-prev-page"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    disabled={currentPage() <= 1 || isLoading()}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    Sebelumnya
                                </button>
                                <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border-y border-neutral-300 dark:border-neutral-600">
                                    {currentPage()} / {totalPages()}
                                </span>
                                <button
                                    type="button"
                                    id="employee-next-page"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    disabled={currentPage() >= totalPages() || isLoading()}
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                                >
                                    Selanjutnya
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
