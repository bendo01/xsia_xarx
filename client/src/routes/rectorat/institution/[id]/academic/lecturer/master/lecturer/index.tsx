import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';
import type { AcademicLecturerMasterLecturer } from '~/models/academic/lecturer/master/Lecturer';

export default function RectoratLecturerIndex() {
    const params = useParams();
    const institutionId = () => params.id;

    const [allItems, setAllItems] = createSignal<AcademicLecturerMasterLecturer[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [filterStatus, setFilterStatus] = createSignal<'all' | 'active' | 'inactive'>('all');

    const filteredItems = createMemo(() => {
        let data = allItems();
        const q = searchQuery().toLowerCase();
        if (q) {
            data = data.filter(l =>
                (l.name ?? '').toLowerCase().includes(q) ||
                (l.code ?? '').toLowerCase().includes(q) ||
                (l.nuptk ?? '').toLowerCase().includes(q) ||
                (l.identification_number ?? '').toLowerCase().includes(q)
            );
        }
        if (filterStatus() === 'active') data = data.filter(l => !l.end_date);
        if (filterStatus() === 'inactive') data = data.filter(l => !!l.end_date);
        return data;
    });

    const totalPages = createMemo(() => Math.max(1, Math.ceil(filteredItems().length / itemsPerPage())));

    const pagedItems = createMemo(() => {
        const start = (currentPage() - 1) * itemsPerPage();
        return filteredItems().slice(start, start + itemsPerPage());
    });

    const activeCount = createMemo(() => allItems().filter(l => !l.end_date).length);
    const inactiveCount = createMemo(() => allItems().filter(l => !!l.end_date).length);

    const fetchData = async () => {
        const instId = institutionId();
        if (!instId || instId === '[id]') return;
        setIsLoading(true);
        try {
            // Lecturer list endpoint accepts institution_id as a filter via the controller
            const response = await masterApiIndex<AcademicLecturerMasterLecturer>(
                'academic/lecturer/master/lecturers',
                {
                    page: 1,
                    per_page: 500,
                    institution_id: instId,
                }
            );
            setAllItems(response.data ?? []);
        } catch (e) {
            console.error(e);
            setAllItems([]);
            toast.danger('Gagal memuat data dosen dari server.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        institutionId();
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

    const fullName = (l: AcademicLecturerMasterLecturer) => {
        const parts = [l.front_title, l.name, l.last_title].filter(Boolean);
        return parts.join(' ') || '-';
    };

    const initials = (l: AcademicLecturerMasterLecturer) =>
        fullName(l).split(' ').slice(0, 2).map((w) => w[0] ?? '').join('').toUpperCase();

    const formatDate = (d?: string | null) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage() + 1;
    const endIndex = () => Math.min(startIndex() + pagedItems().length - 1, filteredItems().length);

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Header */}
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-violet-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-violet-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-violet-600 transition-colors">Akademik</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Dosen</span>
                        </nav>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-violet-200 dark:border-violet-800/50">
                            <span class="relative flex size-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full size-2 bg-violet-500"></span>
                            </span>
                            Akademik · Dosen
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-violet-600 dark:text-violet-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-9 h-9">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                                </svg>
                            </span>
                            Daftar Dosen
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Seluruh dosen yang bertugas dalam institusi ini.
                        </p>
                    </div>

                    {/* Stats */}
                    <div class="flex items-center gap-3 shrink-0">
                        <div class="text-center px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm min-w-[72px]">
                            <p class="text-2xl font-black text-neutral-900 dark:text-white">{allItems().length}</p>
                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">Total</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm min-w-[72px]">
                            <p class="text-2xl font-black text-emerald-700 dark:text-emerald-400">{activeCount()}</p>
                            <p class="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium uppercase tracking-wide">Aktif</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 shadow-sm min-w-[72px]">
                            <p class="text-2xl font-black text-amber-700 dark:text-amber-400">{inactiveCount()}</p>
                            <p class="text-[11px] text-amber-600 dark:text-amber-500 font-medium uppercase tracking-wide">Tidak Aktif</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                        <div class="relative w-full sm:w-96 shadow-sm">
                            <div class="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                                <svg class="size-4 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                id="lecturer-search-input"
                                class="block w-full p-3 pl-11 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-all placeholder:text-neutral-400 shadow-sm"
                                placeholder="Cari nama, NIDN, atau NUPTK..."
                                onInput={handleSearch}
                            />
                        </div>

                        <div class="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm shrink-0">
                            {(['all', 'active', 'inactive'] as const).map(status => (
                                <button
                                    type="button"
                                    id={`lecturer-filter-${status}`}
                                    class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus() === status
                                        ? status === 'inactive' ? 'bg-amber-600 text-white shadow-sm' : 'bg-violet-600 text-white shadow-sm'
                                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                                        }`}
                                    onClick={() => { setFilterStatus(status); setCurrentPage(1); }}
                                >
                                    {status === 'all' ? 'Semua' : status === 'active' ? 'Aktif' : 'Tidak Aktif'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <label class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Baris:</label>
                        <select
                            id="lecturer-rows-per-page"
                            class="p-2.5 text-sm border border-neutral-200 rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-800 dark:text-white shadow-sm"
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

                {/* Table */}
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs uppercase bg-neutral-50/80 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">Dosen</th>
                                    <th class="px-6 py-4">NIDN / Kode</th>
                                    <th class="px-6 py-4">NUPTK</th>
                                    <th class="px-6 py-4">Mulai Tugas</th>
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
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                                                            <div class="space-y-1.5">
                                                                <div class="h-4 w-40 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                                                                <div class="h-3 w-28 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                    <td class="px-6 py-4"><div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-full mx-auto"></div></td>
                                                    <td class="px-6 py-4"><div class="h-7 w-20 bg-neutral-200 dark:bg-neutral-800 rounded ml-auto"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={pagedItems().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="6" class="px-6 py-16 text-center">
                                                    <div class="flex flex-col items-center gap-3 text-neutral-500 dark:text-neutral-400">
                                                        <div class="p-4 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                                                        </div>
                                                        <span class="font-semibold text-base text-neutral-700 dark:text-neutral-300">Tidak ada data dosen</span>
                                                        <span class="text-sm">Coba ubah kata kunci atau filter.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={pagedItems()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                                {initials(item)}
                                                            </div>
                                                            <div class="min-w-0">
                                                                <p class="font-semibold text-neutral-900 dark:text-white truncate">{fullName(item)}</p>
                                                                <Show when={item.identification_number}>
                                                                    <p class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">{item.identification_number}</p>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span class="text-xs font-mono font-medium text-neutral-700 dark:text-neutral-300">{item.code || '-'}</span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <span class="text-xs font-mono text-neutral-600 dark:text-neutral-400">{item.nuptk || '-'}</span>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
                                                        {formatDate(item.start_date) || '-'}
                                                    </td>
                                                    <td class="px-6 py-4 text-center">
                                                        {!item.end_date ? (
                                                            <div class="inline-flex items-center justify-center gap-1.5 h-6 px-2.5 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                                <span class="size-1.5 rounded-full bg-emerald-500"></span>
                                                                Aktif
                                                            </div>
                                                        ) : (
                                                            <div class="inline-flex items-center justify-center gap-1.5 h-6 px-2.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50">
                                                                <span class="size-1.5 rounded-full bg-amber-500"></span>
                                                                Tidak Aktif
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td class="px-6 py-4 text-right">
                                                        <A
                                                            href={`/rectorat/institution/${institutionId()}/academic/lecturer/master/lecturer/${item.id}`}
                                                            id={`lecturer-detail-btn-${item.id}`}
                                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-violet-600 hover:text-white hover:bg-violet-600 border border-violet-200 hover:border-violet-600 rounded-md transition-all dark:text-violet-400 dark:border-violet-800/60 dark:hover:bg-violet-600 dark:hover:text-white cursor-pointer shadow-sm"
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

                    {/* Pagination */}
                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 px-6 py-4 gap-3">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            Menampilkan <span class="font-semibold text-neutral-900 dark:text-white">{filteredItems().length > 0 ? startIndex() : 0}</span>–<span class="font-semibold text-neutral-900 dark:text-white">{endIndex()}</span> dari <span class="font-semibold text-neutral-900 dark:text-white">{filteredItems().length}</span> dosen
                        </p>
                        <nav class="inline-flex -space-x-px rounded-lg overflow-hidden shadow-sm">
                            <button
                                type="button"
                                id="lecturer-prev-page"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                disabled={currentPage() <= 1 || isLoading()}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                Sebelumnya
                            </button>
                            <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-violet-700 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 border-y border-neutral-300 dark:border-neutral-600">
                                {currentPage()} / {totalPages()}
                            </span>
                            <button
                                type="button"
                                id="lecturer-next-page"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                                disabled={currentPage() >= totalPages() || isLoading()}
                                onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
                            >
                                Selanjutnya
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
