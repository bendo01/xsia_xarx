import { createSignal, onMount, Show } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';

interface EmployeeInfo {
    id?: string;
    code?: string | null;
    name?: string | null;
    institution_id?: string | null;
    individual_id?: string | null;
    decree_number?: string | null;
    decree_date?: string | null;
    is_active?: boolean | null;
    individual?: {
        id?: string;
        name?: string | null;
        front_title?: string | null;
        last_title?: string | null;
        birth_date?: string | null;
        birth_place?: string | null;
        gender_id?: string | null;
        religion_id?: string | null;
        is_special_need?: boolean | null;
        is_deceased?: boolean | null;
    } | null;
    institution?: {
        id?: string;
        name?: string | null;
        code?: string | null;
        alphabet_code?: string | null;
    } | null;
}

interface StaffDetailData {
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
    sync_at?: string | null;
    // enriched after fetching employee
    employee?: EmployeeInfo | null;
}

function InfoRow(props: {
    label: string;
    value?: string | null | boolean;
    mono?: boolean;
    badge?: boolean;
    badgeVariant?: 'green' | 'red' | 'teal' | 'amber' | 'neutral';
}) {
    const display = () => {
        if (props.value === null || props.value === undefined || props.value === '') return '-';
        if (typeof props.value === 'boolean') return props.value ? 'Ya' : 'Tidak';
        return String(props.value);
    };

    const badgeClass = () => {
        const map: Record<string, string> = {
            green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
            teal: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50',
            red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
            amber: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50',
            neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
        };
        return map[props.badgeVariant ?? 'neutral'];
    };

    return (
        <div class="flex flex-col gap-0.5">
            <span class="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{props.label}</span>
            <Show
                when={props.badge}
                fallback={
                    <span class={`text-sm font-medium text-neutral-900 dark:text-white ${props.mono ? 'font-mono' : ''}`}>
                        {display()}
                    </span>
                }
            >
                <span class={`inline-flex items-center gap-1.5 h-6 px-2.5 text-xs font-bold rounded-full border w-fit ${badgeClass()}`}>
                    {display()}
                </span>
            </Show>
        </div>
    );
}

export default function RectoratStaffDetail() {
    const params = useParams();

    const getInstitutionId = () => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const segments = path.split('/');
        return segments[3] || '';
    };

    const staffId = () => params.id;

    const [staff, setStaff] = createSignal<StaffDetailData | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);

    const fetchDetail = async (id: string) => {
        if (!id || id === '[id]') {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            // Fetch staff record
            const url = `${getBaseApiUrl()}/institution/master/staffes/${encodeURIComponent(id)}`;
            const res = await fetch(url, { method: 'GET', headers: getAuthHeaders() });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const resJson = await res.json();
            const data: StaffDetailData = resJson.data ?? resJson;

            if (!data?.id) {
                setStaff(null);
                toast.danger('Data staf tidak ditemukan.');
                return;
            }

            // Enrich with employee (+ individual) if employee_id present
            if (data.employee_id) {
                try {
                    const empUrl = `${getBaseApiUrl()}/institution/master/employees/${encodeURIComponent(data.employee_id)}`;
                    const empRes = await fetch(empUrl, { method: 'GET', headers: getAuthHeaders() });
                    if (empRes.ok) {
                        const empJson = await empRes.json();
                        data.employee = empJson.data ?? empJson;
                    }
                } catch {
                    // Non-fatal – show staff without employee info
                }
            }

            setStaff(data);
        } catch (error: any) {
            console.error('Error fetching staff detail:', error);
            setStaff(null);
            toast.danger('Gagal memuat data staf dari server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = staffId();
        if (id) fetchDetail(id);
        else setIsLoading(false);
    });

    const isActive = () => !staff()?.end_date;

    const formatDate = (d?: string | null) => {
        if (!d) return null;
        try { return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' }); }
        catch { return d; }
    };

    const fullPersonName = () => {
        const emp = staff()?.employee;
        const ind = emp?.individual;
        if (!ind) return emp?.name || staff()?.name || '-';
        const parts = [ind.front_title, ind.name || emp?.name, ind.last_title].filter(Boolean);
        return parts.join(' ') || emp?.name || '-';
    };

    const initials = () =>
        fullPersonName().split(' ').slice(0, 2).map((w: string) => w[0] || '').join('').toUpperCase();

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Breadcrumb & Header */}
                <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6 gap-4">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-teal-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${getInstitutionId()}`} class="hover:text-teal-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${getInstitutionId()}/staff`} class="hover:text-teal-600 transition-colors">Staf</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Detail</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-teal-600 dark:text-teal-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                                </svg>
                            </span>
                            Detail Staf
                        </h1>
                    </div>

                    <A
                        href={`/rectorat/institution/${getInstitutionId()}/staff`}
                        id="back-to-staff-list"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm w-fit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Kembali ke Daftar
                    </A>
                </div>

                {/* Loading */}
                <Show when={isLoading()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <div class="relative size-16">
                            <div class="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-900/40"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Memuat data staf...</p>
                    </div>
                </Show>

                {/* Not Found */}
                <Show when={!isLoading() && !staff()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <div class="p-5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 class="text-xl font-bold text-neutral-700 dark:text-neutral-300">Data Tidak Ditemukan</h2>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">Data staf tidak dapat ditemukan atau mungkin telah dihapus.</p>
                        <A
                            href={`/rectorat/institution/${getInstitutionId()}/staff`}
                            class="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
                        >
                            Kembali ke Daftar Staf
                        </A>
                    </div>
                </Show>

                {/* Content */}
                <Show when={!isLoading() && staff()}>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column — Profile Card */}
                        <div class="lg:col-span-1 space-y-5">
                            <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                {/* Gradient header */}
                                <div class="h-24 bg-linear-to-br from-teal-500 via-cyan-500 to-teal-700"></div>
                                {/* Avatar */}
                                <div class="-mt-12 flex flex-col items-center pb-6 px-6">
                                    <div class="size-24 rounded-full bg-linear-to-br from-teal-400 to-cyan-600 border-4 border-white dark:border-neutral-900 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                        {initials()}
                                    </div>
                                    <h2 class="mt-3 text-lg font-bold text-neutral-900 dark:text-white text-center leading-tight">
                                        {staff()?.name || fullPersonName()}
                                    </h2>
                                    <Show when={staff()?.name && fullPersonName() !== staff()?.name}>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-0.5">{fullPersonName()}</p>
                                    </Show>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                                        {staff()?.code || '-'}
                                    </p>
                                    <div class="mt-3">
                                        {isActive() ? (
                                            <div class="inline-flex items-center gap-1.5 h-6 px-3 text-xs font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800/50">
                                                <span class="size-1.5 rounded-full bg-teal-500"></span>
                                                Aktif
                                            </div>
                                        ) : (
                                            <div class="inline-flex items-center gap-1.5 h-6 px-3 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50">
                                                <span class="size-1.5 rounded-full bg-amber-500"></span>
                                                Selesai
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Employee link */}
                                <Show when={staff()?.employee_id}>
                                    <div class="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4">
                                        <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Pegawai Terkait</p>
                                        <A
                                            href={`/rectorat/institution/${getInstitutionId()}/employee/${staff()?.employee_id}`}
                                            class="flex items-start gap-2 p-2.5 rounded-lg bg-teal-50/60 dark:bg-teal-900/10 border border-teal-100 dark:border-teal-800/40 hover:bg-teal-50 dark:hover:bg-teal-900/20 transition-colors group"
                                        >
                                            <div class="size-8 rounded-md bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                                </svg>
                                            </div>
                                            <div class="min-w-0 flex-1">
                                                <p class="text-sm font-semibold text-teal-800 dark:text-teal-300 group-hover:text-teal-600 transition-colors truncate">
                                                    {staff()?.employee?.name || fullPersonName()}
                                                </p>
                                                <Show when={staff()?.employee?.code}>
                                                    <p class="text-xs font-mono text-teal-600/70 dark:text-teal-400/70">{staff()?.employee?.code}</p>
                                                </Show>
                                            </div>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-3.5 text-teal-500 shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                            </svg>
                                        </A>
                                    </div>
                                </Show>

                                {/* Institution */}
                                <Show when={staff()?.employee?.institution}>
                                    <div class="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4">
                                        <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Institusi</p>
                                        <div class="flex items-start gap-2">
                                            <div class="size-8 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 dark:text-neutral-400 shrink-0">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                                </svg>
                                            </div>
                                            <div class="min-w-0">
                                                <p class="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">
                                                    {staff()?.employee?.institution?.name || '-'}
                                                </p>
                                                <p class="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                    {staff()?.employee?.institution?.code || ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </Show>

                                {/* Timestamps */}
                                <div class="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4 space-y-2">
                                    <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Metadata</p>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-neutral-500 dark:text-neutral-400">Dibuat</span>
                                        <span class="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{formatDate(staff()?.created_at) || '-'}</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-neutral-500 dark:text-neutral-400">Diperbarui</span>
                                        <span class="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{formatDate(staff()?.updated_at) || '-'}</span>
                                    </div>
                                    <Show when={staff()?.sync_at}>
                                        <div class="flex justify-between text-xs">
                                            <span class="text-neutral-500 dark:text-neutral-400">Sinkronisasi</span>
                                            <span class="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{formatDate(staff()?.sync_at) || '-'}</span>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </div>

                        {/* Right Column — Details */}
                        <div class="lg:col-span-2 space-y-5">

                            {/* Assignment Info */}
                            <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                <div class="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <div class="size-8 rounded-md bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center text-teal-600 dark:text-teal-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                                        </svg>
                                    </div>
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Informasi Penugasan Staf</h3>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                                    <InfoRow label="Kode Staf" value={staff()?.code} mono />
                                    <InfoRow label="Nama Staf" value={staff()?.name} />
                                    <InfoRow label="Nomor SK" value={staff()?.decree_number} mono />
                                    <InfoRow label="Tanggal SK" value={formatDate(staff()?.decree_date)} />
                                    <InfoRow label="Mulai Tugas" value={formatDate(staff()?.start_date)} />
                                    <InfoRow label="Selesai Tugas" value={formatDate(staff()?.end_date)} />
                                    <InfoRow
                                        label="Status Penugasan"
                                        value={isActive() ? 'Aktif' : 'Selesai'}
                                        badge
                                        badgeVariant={isActive() ? 'teal' : 'amber'}
                                    />
                                    <InfoRow label="ID Staf" value={staff()?.id} mono />
                                    <Show when={staff()?.unit_id}>
                                        <InfoRow label="ID Unit" value={staff()?.unit_id} mono />
                                    </Show>
                                    <Show when={staff()?.position_type_id}>
                                        <InfoRow label="ID Tipe Jabatan" value={staff()?.position_type_id} mono />
                                    </Show>
                                </div>
                            </div>

                            {/* Employee — Personal Info */}
                            <Show when={staff()?.employee}>
                                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                    <div class="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                        <div class="size-8 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                        <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Data Pegawai & Personal</h3>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                                        <InfoRow label="Kode Pegawai" value={staff()?.employee?.code} mono />
                                        <InfoRow label="Nama Pegawai" value={staff()?.employee?.name} />
                                        <InfoRow label="Nama Lengkap" value={fullPersonName()} />
                                        <InfoRow label="Gelar Depan" value={staff()?.employee?.individual?.front_title} />
                                        <InfoRow label="Gelar Belakang" value={staff()?.employee?.individual?.last_title} />
                                        <InfoRow label="Tempat Lahir" value={staff()?.employee?.individual?.birth_place} />
                                        <InfoRow label="Tanggal Lahir" value={formatDate(staff()?.employee?.individual?.birth_date)} />
                                        <InfoRow
                                            label="Status Pegawai"
                                            value={staff()?.employee?.is_active ? 'Aktif' : 'Non-Aktif'}
                                            badge
                                            badgeVariant={staff()?.employee?.is_active ? 'green' : 'amber'}
                                        />
                                        <InfoRow label="No. SK Pegawai" value={staff()?.employee?.decree_number} mono />
                                        <InfoRow label="Tanggal SK Pegawai" value={formatDate(staff()?.employee?.decree_date)} />
                                        <Show when={staff()?.employee?.individual?.is_special_need}>
                                            <InfoRow label="Kebutuhan Khusus" value={staff()?.employee?.individual?.is_special_need} badge badgeVariant="neutral" />
                                        </Show>
                                    </div>
                                </div>
                            </Show>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}
