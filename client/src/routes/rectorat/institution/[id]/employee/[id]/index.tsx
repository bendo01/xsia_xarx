import { createSignal, onMount, Show, For } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';

interface IndividualDetail {
    id?: string;
    code?: string | null;
    name?: string | null;
    front_title?: string | null;
    last_title?: string | null;
    birth_date?: string | null;
    birth_place?: string | null;
    gender_id?: string | null;
    religion_id?: string | null;
    is_special_need?: boolean | null;
    is_deceased?: boolean | null;
}

interface InstitutionDetail {
    id?: string;
    code?: string | null;
    name?: string | null;
    alphabet_code?: string | null;
    is_active?: boolean;
}

interface StaffDetail {
    id?: string;
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
}

interface EmployeeDetailData {
    id: string;
    code?: string | null;
    name?: string | null;
    institution_id?: string | null;
    individual_id?: string | null;
    decree_number?: string | null;
    decree_date?: string | null;
    is_active?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
    sync_at?: string | null;
    individual?: IndividualDetail | null;
    institution?: InstitutionDetail | null;
    staffes?: StaffDetail[] | null;
}

function InfoRow(props: { label: string; value?: string | null | boolean; mono?: boolean; badge?: boolean; badgeVariant?: 'green' | 'red' | 'blue' | 'neutral' }) {
    const display = () => {
        if (props.value === null || props.value === undefined || props.value === '') return '-';
        if (typeof props.value === 'boolean') return props.value ? 'Ya' : 'Tidak';
        return String(props.value);
    };

    const badgeClass = () => {
        const v = props.badgeVariant ?? 'neutral';
        const map: Record<string, string> = {
            green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50',
            red: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50',
            blue: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800/50',
            neutral: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
        };
        return map[v];
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

export default function RectoratEmployeeDetail() {
    const params = useParams();

    const getInstitutionId = () => {
        const path = typeof window !== 'undefined' ? window.location.pathname : '';
        const segments = path.split('/');
        return segments[3] || '';
    };

    const employeeId = () => params.id;

    const [employee, setEmployee] = createSignal<EmployeeDetailData | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);

    const fetchDetail = async (id: string) => {
        if (!id || id === '[id]') {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const url = `${getBaseApiUrl()}/institution/master/employees/${encodeURIComponent(id)}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders(),
            });
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const resJson = await response.json();
            const data: EmployeeDetailData = resJson.data ?? resJson;
            if (data && data.id) {
                setEmployee(data);
            } else {
                setEmployee(null);
                toast.danger('Data pegawai tidak ditemukan.');
            }
        } catch (error: any) {
            console.error('Error fetching employee detail:', error);
            setEmployee(null);
            toast.danger('Gagal memuat data pegawai dari server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = employeeId();
        if (id) {
            fetchDetail(id);
        } else {
            setIsLoading(false);
        }
    });

    const fullName = () => {
        const emp = employee();
        if (!emp) return '-';
        const ind = emp.individual;
        if (!ind) return emp.name || '-';
        const parts = [ind.front_title, ind.name || emp.name, ind.last_title].filter(Boolean);
        return parts.join(' ') || emp.name || '-';
    };

    const initials = () => {
        return fullName().split(' ').slice(0, 2).map((w: string) => w[0] || '').join('').toUpperCase();
    };

    const formatDate = (d?: string | null) => {
        if (!d) return null;
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return d;
        }
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 font-sans">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

                {/* Breadcrumb & Header */}
                <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6 gap-4">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-indigo-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${getInstitutionId()}`} class="hover:text-indigo-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${getInstitutionId()}/employee`} class="hover:text-indigo-600 transition-colors">Pegawai</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Detail</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-indigo-600 dark:text-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </span>
                            Detail Pegawai
                        </h1>
                        <Show when={employee()}>
                            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                                Menampilkan informasi lengkap pegawai.
                            </p>
                        </Show>
                    </div>

                    <A
                        href={`/rectorat/institution/${getInstitutionId()}/employee`}
                        id="back-to-employee-list"
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm w-fit"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        Kembali ke Daftar
                    </A>
                </div>

                {/* Loading State */}
                <Show when={isLoading()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <div class="relative size-16">
                            <div class="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900/40"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Memuat data pegawai...</p>
                    </div>
                </Show>

                {/* Not Found */}
                <Show when={!isLoading() && !employee()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <div class="p-5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="12" y1="8" x2="12" y2="12" />
                                <line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                        </div>
                        <h2 class="text-xl font-bold text-neutral-700 dark:text-neutral-300">Data Tidak Ditemukan</h2>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">Data pegawai tidak dapat ditemukan atau mungkin telah dihapus.</p>
                        <A
                            href={`/rectorat/institution/${getInstitutionId()}/employee`}
                            class="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Kembali ke Daftar Pegawai
                        </A>
                    </div>
                </Show>

                {/* Main Content */}
                <Show when={!isLoading() && employee()}>
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Left Column - Profile Card */}
                        <div class="lg:col-span-1 space-y-5">

                            {/* Profile Card */}
                            <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                {/* Header Gradient */}
                                <div class="h-24 bg-gradient-to-br from-indigo-500 via-purple-600 to-indigo-700"></div>
                                {/* Avatar */}
                                <div class="-mt-12 flex flex-col items-center pb-6 px-6">
                                    <div class="size-24 rounded-full bg-gradient-to-br from-indigo-400 to-purple-600 border-4 border-white dark:border-neutral-900 flex items-center justify-center text-white text-2xl font-black shadow-lg">
                                        {initials()}
                                    </div>
                                    <h2 class="mt-3 text-lg font-bold text-neutral-900 dark:text-white text-center leading-tight">
                                        {fullName()}
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                                        {employee()?.code || '-'}
                                    </p>

                                    <div class="mt-3">
                                        {employee()?.is_active ? (
                                            <div class="inline-flex items-center gap-1.5 h-6 px-3 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800/50">
                                                <span class="size-1.5 rounded-full bg-emerald-500"></span>
                                                Aktif
                                            </div>
                                        ) : (
                                            <div class="inline-flex items-center gap-1.5 h-6 px-3 text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-full dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/50">
                                                <span class="size-1.5 rounded-full bg-red-500"></span>
                                                Non-Aktif
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Institution Info */}
                                <Show when={employee()?.institution}>
                                    <div class="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4">
                                        <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Institusi</p>
                                        <div class="flex items-start gap-2">
                                            <div class="size-8 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
                                                </svg>
                                            </div>
                                            <div class="min-w-0">
                                                <p class="text-sm font-semibold text-neutral-900 dark:text-white leading-tight">{employee()?.institution?.name || '-'}</p>
                                                <p class="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">{employee()?.institution?.code || ''}</p>
                                            </div>
                                        </div>
                                    </div>
                                </Show>

                                {/* Meta Timestamps */}
                                <div class="border-t border-neutral-100 dark:border-neutral-800 px-5 py-4 space-y-2">
                                    <p class="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-2">Metadata</p>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-neutral-500 dark:text-neutral-400">Dibuat</span>
                                        <span class="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{formatDate(employee()?.created_at) || '-'}</span>
                                    </div>
                                    <div class="flex justify-between text-xs">
                                        <span class="text-neutral-500 dark:text-neutral-400">Diperbarui</span>
                                        <span class="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{formatDate(employee()?.updated_at) || '-'}</span>
                                    </div>
                                    <Show when={employee()?.sync_at}>
                                        <div class="flex justify-between text-xs">
                                            <span class="text-neutral-500 dark:text-neutral-400">Sinkronisasi</span>
                                            <span class="font-medium text-neutral-700 dark:text-neutral-300 font-mono">{formatDate(employee()?.sync_at) || '-'}</span>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Details */}
                        <div class="lg:col-span-2 space-y-5">

                            {/* Employee Info Card */}
                            <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                <div class="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <div class="size-8 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </div>
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Informasi Pegawai</h3>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                                    <InfoRow label="Kode Pegawai" value={employee()?.code} mono />
                                    <InfoRow label="Nama Pegawai" value={employee()?.name} />
                                    <InfoRow label="Nomor SK" value={employee()?.decree_number} mono />
                                    <InfoRow label="Tanggal SK" value={formatDate(employee()?.decree_date)} />
                                    <InfoRow label="Status" value={employee()?.is_active ? 'Aktif' : 'Non-Aktif'} badge badgeVariant={employee()?.is_active ? 'green' : 'red'} />
                                    <InfoRow label="ID Pegawai" value={employee()?.id} mono />
                                </div>
                            </div>

                            {/* Individual / Personal Info */}
                            <Show when={employee()?.individual}>
                                <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                    <div class="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                        <div class="size-8 rounded-md bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                                            </svg>
                                        </div>
                                        <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Data Individu / Personal</h3>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6">
                                        <InfoRow label="Nama Lengkap" value={fullName()} />
                                        <InfoRow label="Gelar Depan" value={employee()?.individual?.front_title} />
                                        <InfoRow label="Gelar Belakang" value={employee()?.individual?.last_title} />
                                        <InfoRow label="Tempat Lahir" value={employee()?.individual?.birth_place} />
                                        <InfoRow label="Tanggal Lahir" value={formatDate(employee()?.individual?.birth_date)} />
                                        <InfoRow label="Kebutuhan Khusus" value={employee()?.individual?.is_special_need} badge badgeVariant={employee()?.individual?.is_special_need ? 'blue' : 'neutral'} />
                                        <InfoRow label="Status Meninggal" value={employee()?.individual?.is_deceased} badge badgeVariant={employee()?.individual?.is_deceased ? 'red' : 'neutral'} />
                                        <InfoRow label="ID Individu" value={employee()?.individual?.id} mono />
                                    </div>
                                </div>
                            </Show>

                            {/* Staffes Table */}
                            <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                                <div class="flex items-center gap-3 px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                    <div class="size-8 rounded-md bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
                                        </svg>
                                    </div>
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Riwayat Kepegawaian (Staf)</h3>
                                    <span class="ml-auto inline-flex items-center justify-center size-5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                        {employee()?.staffes?.length ?? 0}
                                    </span>
                                </div>

                                <Show
                                    when={(employee()?.staffes?.length ?? 0) > 0}
                                    fallback={
                                        <div class="flex flex-col items-center justify-center py-10 gap-2 text-neutral-400 dark:text-neutral-600">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                <rect width="18" height="18" x="3" y="3" rx="2" />
                                                <path d="M3 9h18M9 21V9" />
                                            </svg>
                                            <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Belum ada data kepegawaian (staf).</p>
                                        </div>
                                    }
                                >
                                    <div class="overflow-x-auto">
                                        <table class="w-full text-xs text-left">
                                            <thead class="bg-neutral-50/60 dark:bg-neutral-800/30 text-neutral-400 dark:text-neutral-500 uppercase tracking-wider font-semibold">
                                                <tr>
                                                    <th class="px-5 py-3">Kode</th>
                                                    <th class="px-5 py-3">Nama</th>
                                                    <th class="px-5 py-3">No. SK</th>
                                                    <th class="px-5 py-3">Tanggal SK</th>
                                                    <th class="px-5 py-3">Mulai</th>
                                                    <th class="px-5 py-3">Selesai</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                                <For each={employee()?.staffes ?? []}>
                                                    {(staff) => (
                                                        <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                                                            <td class="px-5 py-3 font-mono text-neutral-600 dark:text-neutral-400">{staff.code || '-'}</td>
                                                            <td class="px-5 py-3 font-medium text-neutral-900 dark:text-white">{staff.name || '-'}</td>
                                                            <td class="px-5 py-3 font-mono text-neutral-600 dark:text-neutral-400">{staff.decree_number || '-'}</td>
                                                            <td class="px-5 py-3 text-neutral-600 dark:text-neutral-400">{formatDate(staff.decree_date) || '-'}</td>
                                                            <td class="px-5 py-3 text-neutral-600 dark:text-neutral-400">{formatDate(staff.start_date) || '-'}</td>
                                                            <td class="px-5 py-3">
                                                                {staff.end_date ? (
                                                                    <span class="text-neutral-600 dark:text-neutral-400">{formatDate(staff.end_date)}</span>
                                                                ) : (
                                                                    <span class="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                                                                        <span class="size-1.5 rounded-full bg-emerald-500"></span>
                                                                        Aktif
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </For>
                                            </tbody>
                                        </table>
                                    </div>
                                </Show>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>
        </div>
    );
}
