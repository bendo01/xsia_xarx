import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';
import type { InstitutionMasterUnit } from '~/models/institution/master/Unit';

interface UnitExtended extends InstitutionMasterUnit {
    unit_type?: { name: string };
    parent?: { name: string };
}

export default function RectoratUnitsIndex() {
    const params = useParams();
    const institutionId = () => params.id;

    const [allItems, setAllItems] = createSignal<UnitExtended[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [totalData, setTotalData] = createSignal(0);

    const totalPages = createMemo(() => Math.ceil(totalData() / itemsPerPage()) || 1);
    const items = createMemo(() => {
        const start = (currentPage() - 1) * itemsPerPage();
        return allItems().slice(start, start + itemsPerPage());
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await masterApiIndex<UnitExtended>('institution/master/units', {
                page: 1,
                per_page: 500,
                name: searchQuery() || undefined,
                institution_id: institutionId(),
                with_relations: true,
            });

            if (response && Array.isArray(response.data)) {
                const prodi = response.data.filter((u) => {
                    const t = (u.unit_type?.name ?? '').toLowerCase();
                    return t.includes('program studi') || t.includes('prodi') || t.includes('jurusan') || t.includes('department');
                });
                setAllItems(prodi);
                setTotalData(prodi.length);
            } else {
                setAllItems([]);
                setTotalData(0);
            }
        } catch (error) {
            console.error('Error loading units from server:', error);
            setAllItems([]);
            setTotalData(0);
            toast.danger('Gagal memuat data unit dari server.');
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

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Page Header */}
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div class="space-y-1">
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-blue-200 dark:border-blue-800/50">
                            <span class="relative flex size-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full size-2 bg-blue-500"></span>
                            </span>
                            Master Data
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                            Daftar Unit
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                            Kelola seluruh unit yang terdaftar pada institusi ini.
                        </p>
                    </div>
                </div>

                {/* Filters & Search */}
                <div class="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div class="relative w-full md:w-96 shadow-sm">
                        <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                            <svg class="size-4.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            class="block w-full p-3 pl-11 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-all shadow-sm placeholder:text-neutral-400"
                            placeholder="Cari nama unit..."
                            onInput={handleSearch}
                        />
                    </div>

                    <div class="flex items-center gap-2">
                        <select
                            class="p-2.5 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-colors shadow-sm"
                            value={itemsPerPage()}
                            onChange={(e) => {
                                setItemsPerPage(Number((e.target as HTMLSelectElement).value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10 Baris</option>
                            <option value={25}>25 Baris</option>
                            <option value={50}>50 Baris</option>
                        </select>
                    </div>
                </div>

                {/* Data Table */}
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden transition-all">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">ID / Kode</th>
                                    <th class="px-6 py-4">Nama Unit</th>
                                    <th class="px-6 py-4">Tipe Unit</th>
                                    <th class="px-6 py-4">Induk (Parent)</th>
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
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-24"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-48"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-20"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-32"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-16 mx-auto"></div></td>
                                                    <td class="px-6 py-4"><div class="h-6 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-20 ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="6" class="px-6 py-16 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center gap-3">
                                                        <div class="p-4 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                                <circle cx="12" cy="12" r="10" />
                                                                <line x1="12" y1="8" x2="12" y2="12" />
                                                                <line x1="12" y1="16" x2="12.01" y2="16" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-medium text-base text-neutral-700 dark:text-neutral-300">Tidak ada data ditemukan</span>
                                                        <span class="text-sm">Silakan ubah kata kunci pencarian Anda.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                    <td class="px-6 py-4 whitespace-nowrap font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                        {item.code || '-'}
                                                    </td>
                                                    <td class="px-6 py-4 font-medium text-neutral-900 dark:text-white">
                                                        {item.name || '-'}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span class="px-2.5 py-1 text-[11px] font-medium rounded-md bg-neutral-100 text-neutral-700 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">
                                                            {item.unit_type?.name || '-'}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                                                        {item.parent?.name || '-'}
                                                    </td>
                                                    <td class="px-6 py-4 text-center">
                                                        {item.is_active ? (
                                                            <div class="inline-flex items-center justify-center h-6 px-2.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                                Aktif
                                                            </div>
                                                        ) : (
                                                            <div class="inline-flex items-center justify-center h-6 px-2.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50">
                                                                Non-Aktif
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td class="px-6 py-4 text-right">
                                                        <A
                                                            href={`/rectorat/institution/${institutionId()}/unit/${item.id}`}
                                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-md transition-all dark:text-blue-400 dark:border-blue-800/60 dark:hover:bg-blue-600 dark:hover:text-white dark:hover:border-blue-600 cursor-pointer shadow-sm group-hover:shadow focus:ring-2 focus:ring-blue-500/20"
                                                            title="Lihat Detail Data"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                            </svg>
                                                            Detail
                                                        </A>
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
                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-4">
                        <div class="text-sm text-neutral-600 dark:text-neutral-400">
                            Menampilkan <span class="font-medium text-neutral-900 dark:text-white">{totalData() > 0 ? startIndex() + 1 : 0}</span> sampai <span class="font-medium text-neutral-900 dark:text-white">{endIndex()}</span> dari <span class="font-medium text-neutral-900 dark:text-white">{totalData()}</span> total data
                        </div>
                        <div class="flex justify-center">
                            <nav class="inline-flex -space-x-px shadow-sm rounded-lg overflow-hidden" aria-label="Pagination">
                                <button
                                    type="button"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-900 cursor-pointer transition-colors"
                                    disabled={currentPage() <= 1 || isLoading()}
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                >
                                    Sebelumnya
                                </button>
                                <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-y border-neutral-300 dark:border-neutral-600">
                                    {currentPage()} / {totalPages()}
                                </span>
                                <button
                                    type="button"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:bg-neutral-100 dark:disabled:bg-neutral-900 cursor-pointer transition-colors"
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
