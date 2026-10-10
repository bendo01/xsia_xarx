import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex, getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';

interface StaffRow {
    id: string;
    code?: string | null;
    name?: string | null;
    decree_number?: string | null;
    decree_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    employee_id?: string | null;
    unit_id?: string | null;
    position_type_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    // enriched from employee relation
    employee_name?: string | null;
    employee_code?: string | null;
    individual_name?: string | null;
    individual_front_title?: string | null;
    individual_last_title?: string | null;
}

export default function RectoratStaffIndex() {
    const params = useParams();
    const institutionId = () => params.id;

    const [allStaff, setAllStaff] = createSignal<StaffRow[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [filterStatus, setFilterStatus] = createSignal<'all' | 'active' | 'inactive'>('all');

    const filteredItems = createMemo(() => {
        let data = allStaff();
        const q = searchQuery().toLowerCase();
        if (q) {
            data = data.filter(s =>
                (s.name ?? '').toLowerCase().includes(q) ||
                (s.individual_name ?? '').toLowerCase().includes(q) ||
                (s.employee_name ?? '').toLowerCase().includes(q) ||
                (s.code ?? '').toLowerCase().includes(q) ||
                (s.decree_number ?? '').toLowerCase().includes(q)
            );
        }
        if (filterStatus() === 'active') data = data.filter(s => !s.end_date);
        if (filterStatus() === 'inactive') data = data.filter(s => !!s.end_date);
        return data;
    });

    const totalPages = createMemo(() => Math.max(1, Math.ceil(filteredItems().length / itemsPerPage())));

    const pagedItems = createMemo(() => {
        const start = (currentPage() - 1) * itemsPerPage();
        return filteredItems().slice(start, start + itemsPerPage());
    });

    const fetchData = async () => {
        const instId = institutionId();
        if (!instId || instId === '[id]') return;
        setIsLoading(true);
        try {
            // Step 1: get all employees for this institution (with staffes relation)
            const empRes = await masterApiIndex<any>('institution/master/employees', {
                page: 1,
                per_page: 500,
                institution_id: instId,
                with_relations: true,
            });

            const employees: any[] = empRes.data ?? [];
            const staffRows: StaffRow[] = [];

            for (const emp of employees) {
                const staffes: any[] = emp.staffes ?? [];
                for (const s of staffes) {
                    const ind = emp.individual;
                    const parts = [ind?.front_title, ind?.name || emp.name, ind?.last_title].filter(Boolean);
                    staffRows.push({
                        id: s.id,
                        code: s.code,
                        name: s.name,
                        decree_number: s.decree_number,
                        decree_date: s.decree_date,
                        start_date: s.start_date,
                        end_date: s.end_date,
                        employee_id: s.employee_id ?? emp.id,
                        unit_id: s.unit_id,
                        position_type_id: s.position_type_id,
                        created_at: s.created_at,
                        updated_at: s.updated_at,
                        employee_name: emp.name,
                        employee_code: emp.code,
                        individual_name: ind?.name ?? null,
                        individual_front_title: ind?.front_title ?? null,
                        individual_last_title: ind?.last_title ?? null,
                    });
                }
            }

            // Sort by name
            staffRows.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''));
            setAllStaff(staffRows);
        } catch (error) {
            console.error('Error loading staff:', error);
            setAllStaff([]);
            toast.danger('Gagal memuat data staf dari server.');
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

    const displayPersonName = (s: StaffRow) => {
        const parts = [s.individual_front_title, s.individual_name || s.employee_name, s.individual_last_title].filter(Boolean);
        return parts.length ? parts.join(' ') : (s.employee_name || '-');
    };

    const initials = (s: StaffRow) => {
        return displayPersonName(s).split(' ').slice(0, 2).map((w: string) => w[0] || '').join('').toUpperCase();
    };

    const formatDate = (d?: string | null) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
        catch { return d; }
    };

    const activeCount = createMemo(() => allStaff().filter(s => !s.end_date).length);
    const inactiveCount = createMemo(() => allStaff().filter(s => !!s.end_date).length);
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
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Staf</span>
                        </nav>
                        <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-xs font-semibold uppercase tracking-wider mb-2 border border-teal-200 dark:border-teal-800/50">
                            <span class="relative flex size-2">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full size-2 bg-teal-500"></span>
                            </span>
                            Master Data
                        </div>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-teal-600 dark:text-teal-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-9 h-9">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                                </svg>
                            </span>
                            Daftar Staf
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                            Seluruh data kepegawaian (staf) yang terdaftar dalam institusi ini.
                        </p>
                    </div>

                    {/* Summary Stats */}
                    <div class="flex items-center gap-3 shrink-0">
                        <div class="text-center px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm min-w-[80px]">
                            <p class="text-2xl font-black text-neutral-900 dark:text-white">{allStaff().length}</p>
                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">Total</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-800/50 shadow-sm min-w-[80px]">
                            <p class="text-2xl font-black text-teal-700 dark:text-teal-400">{activeCount()}</p>
                            <p class="text-[11px] text-teal-600 dark:text-teal-500 font-medium uppercase tracking-wide">Aktif</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 shadow-sm min-w-[80px]">
                            <p class="text-2xl font-black text-amber-700 dark:text-amber-400">{inactiveCount()}</p>
                            <p class="text-[11px] text-amber-600 dark:text-amber-500 font-medium uppercase tracking-wide">Selesai</p>
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
                                id="staff-search-input"
                                class="block w-full p-3 pl-11 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-all shadow-sm placeholder:text-neutral-400"
                                placeholder="Cari nama, kode, atau nomor SK..."
                                onInput={handleSearch}
                            />
                        </div>

                        {/* Status Filter */}
                        <div class="flex items-center gap-1 p-1 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg shadow-sm shrink-0">
                            <button
                                type="button"
                                id="staff-filter-all"
                                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus() === 'all' ? 'bg-teal-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                onClick={() => { setFilterStatus('all'); setCurrentPage(1); }}
                            >
                                Semua
                            </button>
                            <button
                                type="button"
                                id="staff-filter-active"
                                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus() === 'active' ? 'bg-teal-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                onClick={() => { setFilterStatus('active'); setCurrentPage(1); }}
                            >
                                Aktif
                            </button>
                            <button
                                type="button"
                                id="staff-filter-inactive"
                                class={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${filterStatus() === 'inactive' ? 'bg-amber-600 text-white shadow-sm' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'}`}
                                onClick={() => { setFilterStatus('inactive'); setCurrentPage(1); }}
                            >
                                Selesai
                            </button>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <A
                            href={`/rectorat/institution/${institutionId()}/staff/create`}
                            id="staff-create-btn"
                            class="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-sm transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Tambah Staf
                        </A>
                        <label class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Baris:</label>
                        <select
                            id="staff-rows-per-page"
                            class="p-2.5 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-teal-500 focus:border-teal-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-colors shadow-sm"
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
                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-neutral-500 uppercase bg-neutral-50/80 dark:bg-neutral-800/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-800 font-semibold tracking-wider">
                                <tr>
                                    <th class="px-6 py-4">Kode</th>
                                    <th class="px-6 py-4">Nama Staf / Pegawai</th>
                                    <th class="px-6 py-4">No. SK</th>
                                    <th class="px-6 py-4">Mulai Tugas</th>
                                    <th class="px-6 py-4">Selesai Tugas</th>
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
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-16"></div></td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                                                            <div class="space-y-1.5">
                                                                <div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-40"></div>
                                                                <div class="h-3 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-24"></div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-32"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-24"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 bg-neutral-200 dark:bg-neutral-800 rounded-sm w-24"></div></td>
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
                                                <td colspan="7" class="px-6 py-16 text-center">
                                                    <div class="flex flex-col items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400">
                                                        <div class="p-4 rounded-full bg-teal-50 dark:bg-teal-900/20 text-teal-400">
                                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                                <path d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                                                            </svg>
                                                        </div>
                                                        <span class="font-semibold text-base text-neutral-700 dark:text-neutral-300">Tidak ada data staf ditemukan</span>
                                                        <span class="text-sm">Silakan ubah kata kunci atau filter Anda.</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={pagedItems()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors group">
                                                    <td class="px-6 py-4 whitespace-nowrap font-mono text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                        {item.code || '-'}
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <div class="flex items-center gap-3">
                                                            <div class="size-9 rounded-full bg-linear-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shrink-0">
                                                                {initials(item)}
                                                            </div>
                                                            <div class="min-w-0">
                                                                <p class="font-semibold text-neutral-900 dark:text-white truncate leading-tight">
                                                                    {item.name || displayPersonName(item)}
                                                                </p>
                                                                <Show when={item.name && displayPersonName(item) !== item.name}>
                                                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate mt-0.5">
                                                                        {displayPersonName(item)}
                                                                    </p>
                                                                </Show>
                                                                <Show when={item.employee_code}>
                                                                    <p class="text-[10px] font-mono text-teal-600 dark:text-teal-400 mt-0.5">{item.employee_code}</p>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap">
                                                        <Show when={item.decree_number} fallback={<span class="text-neutral-400 dark:text-neutral-600">-</span>}>
                                                            <span class="text-xs font-mono text-neutral-700 dark:text-neutral-300">{item.decree_number}</span>
                                                        </Show>
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
                                                        {formatDate(item.start_date) || '-'}
                                                    </td>
                                                    <td class="px-6 py-4 whitespace-nowrap text-xs text-neutral-600 dark:text-neutral-400">
                                                        {formatDate(item.end_date) || '-'}
                                                    </td>
                                                    <td class="px-6 py-4 text-center">
                                                        {!item.end_date ? (
                                                            <div class="inline-flex items-center justify-center gap-1.5 h-6 px-2.5 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50">
                                                                <span class="size-1.5 rounded-full bg-teal-500"></span>
                                                                Aktif
                                                            </div>
                                                        ) : (
                                                            <div class="inline-flex items-center justify-center gap-1.5 h-6 px-2.5 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50">
                                                                <span class="size-1.5 rounded-full bg-amber-500"></span>
                                                                Selesai
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td class="px-6 py-4 text-right">
                                                        <A
                                                            href={`/rectorat/institution/${institutionId()}/staff/${item.id}`}
                                                            id={`staff-detail-btn-${item.id}`}
                                                            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-600 hover:text-white hover:bg-teal-600 border border-teal-200 hover:border-teal-600 rounded-md transition-all dark:text-teal-400 dark:border-teal-800/60 dark:hover:bg-teal-600 dark:hover:text-white dark:hover:border-teal-600 cursor-pointer shadow-sm group-hover:shadow focus:ring-2 focus:ring-teal-500/20"
                                                            title="Lihat Detail Staf"
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
                            Menampilkan{' '}
                            <span class="font-medium text-neutral-900 dark:text-white">{filteredItems().length > 0 ? startIndex() + 1 : 0}</span>
                            {' '}sampai{' '}
                            <span class="font-medium text-neutral-900 dark:text-white">{endIndex()}</span>
                            {' '}dari{' '}
                            <span class="font-medium text-neutral-900 dark:text-white">{filteredItems().length}</span> data
                        </div>
                        <div class="flex justify-center">
                            <nav class="inline-flex -space-x-px shadow-sm rounded-lg overflow-hidden" aria-label="Pagination">
                                <button
                                    type="button"
                                    id="staff-prev-page"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                                    disabled={currentPage() <= 1 || isLoading()}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                >
                                    Sebelumnya
                                </button>
                                <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 border-y border-neutral-300 dark:border-neutral-600">
                                    {currentPage()} / {totalPages()}
                                </span>
                                <button
                                    type="button"
                                    id="staff-next-page"
                                    class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
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
        </div>
    );
}
