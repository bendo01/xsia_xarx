import { createSignal, createEffect, onMount, Show, For, createMemo } from 'solid-js';
import { useParams, useLocation, useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import { masterApiShow, masterApiIndex } from '~/controllers/master/masterApiController';
import {
    getActivityById,
    type CampaignActivityItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';

interface UnitDetail {
    id: string;
    name?: string;
    code?: string;
}

interface AcademicYearDetail {
    id: string;
    name?: string;
    code?: number;
}

interface TeachItem {
    id: string;
    name: string;
    class_code?: {
        alphabet_code?: string;
        capacity?: number;
    };
    course?: {
        code?: string;
        name?: string;
        total_credit?: number;
    };
    activity_id?: string;
}

export default function RectoratActivityDetail() {
    const params = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const [activity, setActivity] = createSignal<CampaignActivityItem | null>(null);
    const [unit, setUnit] = createSignal<UnitDetail | null>(null);
    const [academicYear, setAcademicYear] = createSignal<AcademicYearDetail | null>(null);
    const [teaches, setTeaches] = createSignal<TeachItem[]>([]);
    const [isLoadingTeaches, setIsLoadingTeaches] = createSignal(false);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [isCopied, setIsCopied] = createSignal(false);

    const isValidId = (id?: string | null): id is string => {
        if (!id) return false;
        const trimmed = id.trim();
        return (
            trimmed !== '' &&
            trimmed !== '[id]' &&
            trimmed !== ':id' &&
            trimmed !== 'activity' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    const resolveActivityId = () => {
        if (isValidId(params.id)) {
            return params.id.trim();
        }
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (isValidId(last)) {
            return last.trim();
        }
        const qId = (searchParams.id as string) || (searchParams.activity_id as string);
        if (isValidId(qId)) {
            return qId.trim();
        }
        return '';
    };

    const resolveInstIdFromPath = () => {
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const instIdx = parts.indexOf('institution');
        if (instIdx !== -1 && parts[instIdx + 1] && isValidId(parts[instIdx + 1])) {
            return parts[instIdx + 1].trim();
        }
        return '';
    };

    const institutionId = () => resolvedInstitutionId() || resolveInstIdFromPath();

    // Resolve institution ID
    createEffect(async () => {
        let instId = resolvedInstitutionId();
        if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
            const preferred = resolveInstIdFromPath();
            instId = await resolveInstitutionFromStaffRole(preferred);
            if (instId) {
                setResolvedInstitutionId(instId);
            }
        }
    });

    const fetchDetail = async () => {
        const actId = resolveActivityId();
        if (!actId || !isValidId(actId)) {
            setError('ID Aktivitas tidak valid atau tidak ditemukan.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getActivityById(actId);
            if (!data) {
                setError('Data aktivitas tidak ditemukan di server.');
                setActivity(null);
                return;
            }

            setActivity(data);

            // Fetch unit and academic year details in parallel
            const promises: Promise<any>[] = [];

            if (data.unit_id && isValidId(data.unit_id)) {
                promises.push(
                    masterApiShow<UnitDetail>('institution/master/units', data.unit_id)
                        .then((res) => {
                            if (res.data) setUnit(res.data);
                        })
                        .catch((e) => console.warn('Could not load unit detail:', e))
                );
            }

            if (data.academic_year_id && isValidId(data.academic_year_id)) {
                promises.push(
                    masterApiShow<AcademicYearDetail>('academic/general/reference/academic-years', data.academic_year_id)
                        .then((res) => {
                            if (res.data) setAcademicYear(res.data);
                        })
                        .catch((e) => console.warn('Could not load academic year detail:', e))
                );
            }

            await Promise.allSettled(promises);

            // Fetch teaches related to this activity
            fetchTeaches(data.id);
        } catch (e: any) {
            console.error('Error loading activity detail:', e);
            setError(e.message || 'Gagal memuat detail data aktivitas.');
            toast.danger('Gagal memuat detail aktivitas.');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTeaches = async (actId: string) => {
        setIsLoadingTeaches(true);
        try {
            const res = await masterApiIndex<TeachItem>('academic/campaign/transaction/teaches', {
                activity_id: actId,
                page: 1,
                per_page: 50,
            });
            if (res && res.data) {
                setTeaches(res.data);
            } else {
                setTeaches([]);
            }
        } catch (e) {
            console.warn('Could not load related teaches:', e);
            setTeaches([]);
        } finally {
            setIsLoadingTeaches(false);
        }
    };

    onMount(() => {
        fetchDetail();
    });

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setIsCopied(true);
        toast.info('ID berhasil disalin ke clipboard');
        setTimeout(() => setIsCopied(false), 2000);
    };

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatDateTime = (dateStr?: string | null) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    // Derived conversion stats
    const stats = createMemo(() => {
        const a = activity();
        if (!a) return null;

        const target = a.student_target || 0;
        const candidates = a.candidate_number || 0;
        const pass = a.candidate_pass || 0;
        const became = a.became_student || 0;
        const transfers = a.transfer_student || 0;
        const members = a.total_class_member || 0;

        const passRate = candidates > 0 ? Math.min(100, Math.round((pass / candidates) * 100)) : 0;
        const regRate = pass > 0 ? Math.min(100, Math.round((became / pass) * 100)) : 0;
        const targetRate = target > 0 ? Math.min(100, Math.round((became / target) * 100)) : 0;

        return {
            target,
            candidates,
            pass,
            became,
            transfers,
            members,
            passRate,
            regRate,
            targetRate,
        };
    });

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Navigation and Breadcrumb */}
                <div class="space-y-4">
                    <nav class="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400">
                        <A href="/rectorat" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Rektorat
                        </A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Institusi
                        </A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Akademik
                        </A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity`} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Aktivitas
                        </A>
                        <span>/</span>
                        <span class="text-neutral-700 dark:text-neutral-300 font-semibold truncate max-w-xs">
                            {activity()?.name || 'Detail Aktivitas'}
                        </span>
                    </nav>

                    <Show when={!isLoading() && activity()}>
                        {/* Header Banner */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden backdrop-blur-xs">
                            <div class="absolute -right-20 -top-20 w-72 h-72 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                <div class="space-y-3">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <A
                                            href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity`}
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all"
                                        >
                                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                            </svg>
                                            <span>Kembali ke Daftar</span>
                                        </A>

                                        {/* Status Badge */}
                                        <Show
                                            when={activity()?.is_active !== false}
                                            fallback={
                                                <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-semibold border border-neutral-300 dark:border-neutral-700">
                                                    <span class="size-2 rounded-full bg-neutral-400" />
                                                    Non-aktif
                                                </span>
                                            }
                                        >
                                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-semibold border border-emerald-200 dark:border-emerald-800">
                                                <span class="size-2 rounded-full bg-emerald-500 animate-pulse" />
                                                Aktif
                                            </span>
                                        </Show>

                                        {/* Feeder Status Badge */}
                                        <Show when={activity()?.feeder_id}>
                                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-semibold border border-blue-200 dark:border-blue-800">
                                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                                </svg>
                                                Feeder Terhubung
                                            </span>
                                        </Show>
                                    </div>

                                    <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                        {activity()?.name}
                                    </h1>

                                    <div class="flex flex-wrap items-center gap-4 text-xs text-neutral-500 dark:text-neutral-400">
                                        <div class="flex items-center gap-1.5">
                                            <svg class="size-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                            </svg>
                                            <span class="font-medium text-neutral-700 dark:text-neutral-300">
                                                {activity()?.unit_name || unit()?.name || 'Program Studi'}
                                            </span>
                                        </div>
                                        <span>•</span>
                                        <div class="flex items-center gap-1.5">
                                            <svg class="size-4 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
                                            </svg>
                                            <span class="font-medium text-neutral-700 dark:text-neutral-300">
                                                {activity()?.academic_year_name || academicYear()?.name || 'Tahun Akademik'}
                                            </span>
                                        </div>
                                        <Show when={activity()?.week_quantity}>
                                            <span>•</span>
                                            <div class="flex items-center gap-1.5 font-mono">
                                                <svg class="size-4 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                </svg>
                                                <span>{activity()?.week_quantity} Minggu Perkuliahan</span>
                                            </div>
                                        </Show>
                                    </div>
                                </div>

                                <div class="flex items-center gap-3">
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(activity()?.id || '')}
                                        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all hover:bg-neutral-50 dark:hover:bg-neutral-700 shadow-2xs"
                                        title="Salin UUID Aktivitas"
                                    >
                                        <Show
                                            when={isCopied()}
                                            fallback={
                                                <svg class="size-3.5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                                </svg>
                                            }
                                        >
                                            <svg class="size-3.5 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        </Show>
                                        <span>{isCopied() ? 'Tersalin' : 'Salin ID'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fetchDetail()}
                                        class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md"
                                        title="Segarkan Data"
                                    >
                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                        </svg>
                                        <span>Segarkan</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Show>
                </div>

                {/* Loading State */}
                <Show when={isLoading()}>
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-16 border border-neutral-200 dark:border-neutral-800 text-center flex flex-col items-center justify-center gap-3">
                        <div class="size-10 rounded-full border-3 border-blue-600 border-t-transparent animate-spin" />
                        <p class="text-sm font-medium text-neutral-500 dark:text-neutral-400">
                            Memuat data aktivitas transaksi...
                        </p>
                    </div>
                </Show>

                {/* Error State */}
                <Show when={!isLoading() && error()}>
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-12 border border-red-200 dark:border-red-900/50 text-center max-w-lg mx-auto space-y-4">
                        <div class="size-14 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto shadow-inner">
                            <svg class="size-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <h2 class="text-xl font-bold text-neutral-900 dark:text-white">
                            Aktivitas Tidak Ditemukan
                        </h2>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                            {error()}
                        </p>
                        <A
                            href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity`}
                            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                        >
                            <span>Kembali ke Daftar Aktivitas</span>
                        </A>
                    </div>
                </Show>

                {/* Main Content when Activity Loaded */}
                <Show when={!isLoading() && activity()}>
                    {/* KPI Metrics Summary Grid */}
                    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {/* 1. Target Mahasiswa */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                            <div class="flex items-center justify-between text-neutral-400 mb-2">
                                <span class="text-2xs font-bold uppercase tracking-wider">Target Kuota</span>
                                <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {activity()?.student_target?.toLocaleString('id-ID') || 0}
                            </div>
                            <span class="text-2xs text-neutral-400 block mt-1">Target Mahasiswa</span>
                        </div>

                        {/* 2. Pendaftar Calon */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                            <div class="flex items-center justify-between text-neutral-400 mb-2">
                                <span class="text-2xs font-bold uppercase tracking-wider">Pendaftar</span>
                                <div class="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {activity()?.candidate_number?.toLocaleString('id-ID') || 0}
                            </div>
                            <span class="text-2xs text-neutral-400 block mt-1">Calon Mahasiswa</span>
                        </div>

                        {/* 3. Lolos Seleksi */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                            <div class="flex items-center justify-between text-neutral-400 mb-2">
                                <span class="text-2xs font-bold uppercase tracking-wider">Lolos</span>
                                <div class="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {activity()?.candidate_pass?.toLocaleString('id-ID') || 0}
                            </div>
                            <span class="text-2xs text-neutral-400 block mt-1">Lolos Verifikasi/Ujian</span>
                        </div>

                        {/* 4. Menjadi Mahasiswa */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                            <div class="flex items-center justify-between text-neutral-400 mb-2">
                                <span class="text-2xs font-bold uppercase tracking-wider">Mahasiswa</span>
                                <div class="p-1.5 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                    </svg>
                                </div>
                            </div>
                            <div class="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {activity()?.became_student?.toLocaleString('id-ID') || 0}
                            </div>
                            <span class="text-2xs text-neutral-400 block mt-1">Daftar Ulang Resmi</span>
                        </div>

                        {/* 5. Mahasiswa Pindahan */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                            <div class="flex items-center justify-between text-neutral-400 mb-2">
                                <span class="text-2xs font-bold uppercase tracking-wider">Pindahan</span>
                                <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                                    </svg>
                                </div>
                            </div>
                            <div class="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {activity()?.transfer_student?.toLocaleString('id-ID') || 0}
                            </div>
                            <span class="text-2xs text-neutral-400 block mt-1">Transfer Kredit/Jenjang</span>
                        </div>

                        {/* 6. Anggota Kelas */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                            <div class="flex items-center justify-between text-neutral-400 mb-2">
                                <span class="text-2xs font-bold uppercase tracking-wider">Peserta Kelas</span>
                                <div class="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                    </svg>
                                </div>
                            </div>
                            <div class="text-2xl font-extrabold text-neutral-900 dark:text-white">
                                {activity()?.total_class_member?.toLocaleString('id-ID') || 0}
                            </div>
                            <span class="text-2xs text-neutral-400 block mt-1">Total Kelas Terisi</span>
                        </div>
                    </div>

                    {/* Funnel Pipeline & Performance Progress */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-6">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Corong Konversi & Capaian Kuota
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Tahapan alur seleksi dari pendaftaran hingga menjadi mahasiswa aktif.
                                </p>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-semibold text-neutral-500">Capaian Target:</span>
                                <span class="px-2.5 py-1 rounded-full text-xs font-bold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                                    {stats()?.targetRate}%
                                </span>
                            </div>
                        </div>

                        {/* Pipeline Stage Cards */}
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Stage 1: Pendaftar */}
                            <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-bold text-neutral-600 dark:text-neutral-300">1. Pendaftar</span>
                                    <span class="font-mono font-semibold text-neutral-500">100%</span>
                                </div>
                                <div class="text-xl font-extrabold text-neutral-900 dark:text-white">
                                    {stats()?.candidates} <span class="text-xs font-normal text-neutral-500">Orang</span>
                                </div>
                                <div class="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-blue-500 rounded-full w-full" />
                                </div>
                                <span class="text-2xs text-neutral-400 block">Total formulir masuk</span>
                            </div>

                            {/* Stage 2: Lolos Seleksi */}
                            <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-bold text-neutral-600 dark:text-neutral-300">2. Lolos Seleksi</span>
                                    <span class="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                                        {stats()?.passRate}% lulus
                                    </span>
                                </div>
                                <div class="text-xl font-extrabold text-neutral-900 dark:text-white">
                                    {stats()?.pass} <span class="text-xs font-normal text-neutral-500">Orang</span>
                                </div>
                                <div class="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-emerald-500 rounded-full" style={{ width: `${stats()?.passRate}%` }} />
                                </div>
                                <span class="text-2xs text-neutral-400 block">Dari total pendaftar yang masuk</span>
                            </div>

                            {/* Stage 3: Menjadi Mahasiswa */}
                            <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/60 space-y-2">
                                <div class="flex items-center justify-between text-xs">
                                    <span class="font-bold text-neutral-600 dark:text-neutral-300">3. Registrasi Ulang</span>
                                    <span class="font-mono font-semibold text-teal-600 dark:text-teal-400">
                                        {stats()?.regRate}% daftar ulang
                                    </span>
                                </div>
                                <div class="text-xl font-extrabold text-neutral-900 dark:text-white">
                                    {stats()?.became} <span class="text-xs font-normal text-neutral-500">Mahasiswa</span>
                                </div>
                                <div class="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                    <div class="h-full bg-teal-500 rounded-full" style={{ width: `${stats()?.regRate}%` }} />
                                </div>
                                <span class="text-2xs text-neutral-400 block">Dari kandidat yang dinyatakan lolos</span>
                            </div>
                        </div>

                        {/* Overall Target Fulfillment Bar */}
                        <div class="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/40 space-y-2">
                            <div class="flex items-center justify-between text-xs">
                                <div class="flex items-center gap-2">
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">Realisasi Kuota Target:</span>
                                    <span class="text-neutral-600 dark:text-neutral-400">
                                        {stats()?.became} dari target {stats()?.target} mahasiswa
                                    </span>
                                </div>
                                <span class="font-mono font-bold text-blue-600 dark:text-blue-400">
                                    {stats()?.targetRate}%
                                </span>
                            </div>
                            <div class="w-full h-3 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                                <div
                                    class={`h-full rounded-full transition-all duration-500 ${(stats()?.targetRate || 0) >= 100
                                            ? 'bg-emerald-500'
                                            : (stats()?.targetRate || 0) >= 75
                                                ? 'bg-blue-600'
                                                : 'bg-amber-500'
                                        }`}
                                    style={{ width: `${Math.min(100, stats()?.targetRate || 0)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Detailed Information Cards */}
                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Section 1: Detail Akademik */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                    </svg>
                                </div>
                                <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                                    Informasi Akademik
                                </h3>
                            </div>

                            <dl class="space-y-4 text-xs">
                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Program Studi / Unit</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-white flex items-center justify-between">
                                        <span>{activity()?.unit_name || unit()?.name || 'Program Studi'}</span>
                                        <Show when={activity()?.unit_id}>
                                            <A
                                                href={`/rectorat/institution/${institutionId()}/unit/${activity()?.unit_id}`}
                                                class="text-blue-600 hover:underline dark:text-blue-400 font-normal ml-2"
                                            >
                                                Lihat Unit →
                                            </A>
                                        </Show>
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Tahun Akademik</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-white">
                                        {activity()?.academic_year_name || academicYear()?.name || '-'}
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Durasi Perkuliahan</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-white">
                                        {activity()?.week_quantity ? `${activity()?.week_quantity} Minggu` : '-'}
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Status Operasional</dt>
                                    <dd>
                                        <Show
                                            when={activity()?.is_active !== false}
                                            fallback={
                                                <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-2xs font-medium">
                                                    Non-aktif
                                                </span>
                                            }
                                        >
                                            <span class="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-2xs font-medium">
                                                Aktif
                                            </span>
                                        </Show>
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Section 2: Jadwal & Timeline */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                <div class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 9v7.5" />
                                    </svg>
                                </div>
                                <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                                    Jadwal & Periode Penting
                                </h3>
                            </div>

                            <dl class="space-y-4 text-xs">
                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Periode Kegiatan Perkuliahan</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-white space-y-0.5">
                                        <div>Mulai: {formatDate(activity()?.start_date)}</div>
                                        <div>Selesai: {formatDate(activity()?.end_date)}</div>
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Periode Transaksi / PMB</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-white space-y-0.5">
                                        <div>Mulai: {formatDate(activity()?.start_transaction)}</div>
                                        <div>Selesai: {formatDate(activity()?.end_transaction)}</div>
                                    </dd>
                                </div>

                                <div class="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium mb-1">Total Mahasiswa Terdaftar di Kelas</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-white">
                                        {activity()?.total_class_member || 0} Mahasiswa
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Section 3: Integrasi & Metadata */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-5">
                            <div class="flex items-center gap-2.5 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                <div class="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                                    </svg>
                                </div>
                                <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
                                    Integrasi & Audit
                                </h3>
                            </div>

                            <dl class="space-y-4 text-xs font-mono">
                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium font-sans mb-1">Feeder ID</dt>
                                    <dd class="text-neutral-800 dark:text-neutral-200 truncate">
                                        {activity()?.feeder_id ? (
                                            <span class="inline-flex items-center gap-1.5">
                                                <span class="truncate">{activity()?.feeder_id}</span>
                                                <button
                                                    onClick={() => copyToClipboard(activity()?.feeder_id || '')}
                                                    class="text-blue-500 hover:text-blue-600"
                                                    title="Salin Feeder ID"
                                                >
                                                    ⎘
                                                </button>
                                            </span>
                                        ) : (
                                            <span class="text-neutral-400 font-sans">Belum ada Feeder ID</span>
                                        )}
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium font-sans mb-1">Sinkronisasi Terakhir</dt>
                                    <dd class="text-neutral-800 dark:text-neutral-200 font-sans">
                                        {activity()?.sync_at ? formatDateTime(activity()?.sync_at) : 'Belum pernah sinkronisasi'}
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium font-sans mb-1">Waktu Dibuat</dt>
                                    <dd class="text-neutral-800 dark:text-neutral-200 font-sans">
                                        {formatDateTime(activity()?.created_at)}
                                    </dd>
                                </div>

                                <div>
                                    <dt class="text-neutral-500 dark:text-neutral-400 font-medium font-sans mb-1">Terakhir Diperbarui</dt>
                                    <dd class="text-neutral-800 dark:text-neutral-200 font-sans">
                                        {formatDateTime(activity()?.updated_at)}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Associated Teaches / Classes Section */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden space-y-4 p-6">
                        <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Daftar Kelas Perkuliahan (Teaches)
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Kelas operasional perkuliahan yang berada di bawah naungan aktivitas ini.
                                </p>
                            </div>
                            <span class="px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">
                                {teaches().length} Kelas
                            </span>
                        </div>

                        <Show
                            when={!isLoadingTeaches()}
                            fallback={
                                <div class="py-8 text-center text-xs text-neutral-500">
                                    Memuat kelas perkuliahan...
                                </div>
                            }
                        >
                            <Show
                                when={teaches().length > 0}
                                fallback={
                                    <div class="py-10 text-center text-xs text-neutral-400">
                                        Belum ada kelas perkuliahan yang ditugaskan pada aktivitas ini.
                                    </div>
                                }
                            >
                                <div class="overflow-x-auto">
                                    <table class="w-full text-left text-xs">
                                        <thead class="bg-neutral-50 dark:bg-neutral-800/50 uppercase font-semibold text-neutral-500">
                                            <tr>
                                                <th class="px-4 py-3">Nama Kelas</th>
                                                <th class="px-4 py-3">Mata Kuliah</th>
                                                <th class="px-4 py-3 text-center">SKS</th>
                                                <th class="px-4 py-3 text-center">Kapasitas</th>
                                                <th class="px-4 py-3 text-right">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            <For each={teaches()}>
                                                {(t) => (
                                                    <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/40">
                                                        <td class="px-4 py-3 font-semibold text-neutral-900 dark:text-white">
                                                            {t.class_code?.alphabet_code || t.name || '-'}
                                                        </td>
                                                        <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">
                                                            {t.course?.code && t.course?.name ? `${t.course.code} / ${t.course.name}` : t.course?.name || t.course?.code || '-'}
                                                        </td>
                                                        <td class="px-4 py-3 text-center font-mono">
                                                            {t.course?.total_credit ?? '-'}
                                                        </td>
                                                        <td class="px-4 py-3 text-center font-mono">
                                                            {t.class_code?.capacity ?? '-'}
                                                        </td>
                                                        <td class="px-4 py-3 text-right">
                                                            <A
                                                                href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach/${t.id}`}
                                                                class="text-blue-600 hover:underline dark:text-blue-400"
                                                            >
                                                                Buka Kelas →
                                                            </A>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </Show>
                        </Show>
                    </div>
                </Show>
            </main>
        </div>
    );
}
