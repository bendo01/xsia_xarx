import { createSignal, createEffect, onMount, Show } from 'solid-js';
import { useParams, useLocation, useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import { masterApiShow } from '~/controllers/master/masterApiController';
import {
    getGradeById,
    type GradeItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';

interface UnitDetail {
    id: string;
    name?: string;
    code?: string;
}

export default function RectoratGradeDetail() {
    const params = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const [grade, setGrade] = createSignal<GradeItem | null>(null);
    const [unit, setUnit] = createSignal<UnitDetail | null>(null);
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
            trimmed !== 'grade' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    const resolveGradeId = () => {
        if (isValidId(params.id)) {
            return params.id.trim();
        }
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (isValidId(last)) {
            return last.trim();
        }
        const qId = (searchParams.id as string) || (searchParams.grade_id as string);
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
        const gId = resolveGradeId();
        if (!gId || !isValidId(gId)) {
            setError('ID Skala Nilai tidak valid atau tidak ditemukan.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getGradeById(gId);
            if (!data) {
                setError('Data skala nilai tidak ditemukan di server.');
                setGrade(null);
                return;
            }

            setGrade(data);

            // Load unit detail if unit_id present
            if (data.unit_id && isValidId(data.unit_id)) {
                try {
                    const unitRes = await masterApiShow<UnitDetail>('institution/master/units', data.unit_id);
                    if (unitRes.data) {
                        setUnit(unitRes.data);
                    }
                } catch (e) {
                    console.warn('Could not load unit detail:', e);
                }
            }
        } catch (e: any) {
            console.error('Error loading grade detail:', e);
            setError(e.message || 'Gagal memuat detail data skala nilai.');
            toast.danger('Gagal memuat detail skala nilai.');
        } finally {
            setIsLoading(false);
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

    const getGradeColorClass = (alphabet?: string | null) => {
        const code = (alphabet || '').toUpperCase().trim();
        if (code.startsWith('A')) {
            return 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80';
        }
        if (code.startsWith('B')) {
            return 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/80';
        }
        if (code.startsWith('C')) {
            return 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/80';
        }
        if (code.startsWith('D')) {
            return 'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800/80';
        }
        return 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/80';
    };

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
                        <A href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade`} class="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                            Skala Nilai
                        </A>
                        <span>/</span>
                        <span class="text-neutral-700 dark:text-neutral-300 font-semibold truncate max-w-xs">
                            {grade()?.alphabet_code ? `Nilai ${grade()?.alphabet_code} (${grade()?.name})` : 'Detail Skala Nilai'}
                        </span>
                    </nav>

                    <Show when={!isLoading() && grade()}>
                        {/* Header Banner */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden backdrop-blur-xs">
                            <div class="absolute -right-20 -top-20 w-72 h-72 bg-linear-to-br from-emerald-500/10 via-amber-500/10 to-blue-500/10 rounded-full blur-3xl pointer-events-none" />
                            <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                                <div class="space-y-3">
                                    <div class="flex flex-wrap items-center gap-2">
                                        <A
                                            href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade`}
                                            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-semibold transition-all"
                                        >
                                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                            </svg>
                                            <span>Kembali ke Daftar</span>
                                        </A>

                                        {/* Status Badge */}
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/80">
                                            <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Standar Skala Nilai Aktif
                                        </span>
                                    </div>

                                    <div class="flex items-center gap-4">
                                        <div class={`size-16 rounded-2xl border flex items-center justify-center font-mono font-extrabold text-3xl shadow-inner shrink-0 ${getGradeColorClass(grade()?.alphabet_code)}`}>
                                            {grade()?.alphabet_code || 'N/A'}
                                        </div>
                                        <div>
                                            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                                {grade()?.name}
                                            </h1>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-1">
                                                ID Entitas: {grade()?.id}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div class="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(grade()?.id || '')}
                                        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
                                        title="Salin ID"
                                    >
                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375-7.5-7.5" />
                                        </svg>
                                        <span>{isCopied() ? 'Tersalin!' : 'Salin ID'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => fetchDetail()}
                                        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer"
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
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-16 border border-neutral-200/80 dark:border-neutral-800 flex flex-col items-center justify-center gap-3">
                        <div class="size-9 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
                        <span class="text-sm text-neutral-500 font-medium">Memuat detail data skala nilai...</span>
                    </div>
                </Show>

                {/* Error State */}
                <Show when={!isLoading() && error()}>
                    <div class="bg-red-50 dark:bg-red-950/40 rounded-2xl p-8 border border-red-200 dark:border-red-800 text-center space-y-3">
                        <div class="size-12 rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                            ✕
                        </div>
                        <h3 class="text-base font-bold text-red-900 dark:text-red-200">Terjadi Kesalahan</h3>
                        <p class="text-xs text-red-700 dark:text-red-300 max-w-md mx-auto">{error()}</p>
                        <A
                            href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade`}
                            class="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs font-semibold border border-neutral-200 dark:border-neutral-700 shadow-2xs hover:bg-neutral-50"
                        >
                            ← Kembali ke Daftar Skala Nilai
                        </A>
                    </div>
                </Show>

                {/* Main Content Details */}
                <Show when={!isLoading() && grade()}>
                    <div class="space-y-6">
                        {/* Highlights Grid */}
                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Card 1: Bobot IPK */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                                <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Bobot Indeks Prestasi</span>
                                <div class="mt-3 flex items-baseline gap-2">
                                    <span class="text-3xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                        {grade()?.grade.toFixed(2)}
                                    </span>
                                    <span class="text-xs text-neutral-500">Skala 4.00</span>
                                </div>
                                <span class="text-2xs text-neutral-400 block mt-1">Konversi nilai mutu perkuliahan</span>
                            </div>

                            {/* Card 2: Rentang Skor Angka */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                                <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Rentang Skor Angka</span>
                                <div class="mt-3 flex items-baseline gap-2">
                                    <span class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {grade()?.minimum.toFixed(2)}
                                    </span>
                                    <span class="text-xs text-neutral-400">s/d</span>
                                    <span class="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {grade()?.maximum.toFixed(2)}
                                    </span>
                                </div>
                                <span class="text-2xs text-neutral-400 block mt-1">Skor absolut nilai mahasiswa</span>
                            </div>

                            {/* Card 3: Program Studi */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                                <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Program Studi / Unit</span>
                                <div class="mt-3">
                                    <span class="text-base font-bold text-neutral-900 dark:text-white block truncate">
                                        {unit()?.name || 'Unit Terdaftar'}
                                    </span>
                                    <span class="text-xs text-neutral-500 font-mono">
                                        Kode: {unit()?.code || '-'}
                                    </span>
                                </div>
                            </div>

                            {/* Card 4: Masa Berlaku */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                                <span class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Masa Berlaku</span>
                                <div class="mt-3 text-xs font-mono space-y-0.5">
                                    <div class="text-neutral-800 dark:text-neutral-200 font-medium">
                                        {formatDate(grade()?.start_date)}
                                    </div>
                                    <div class="text-neutral-500">
                                        s/d {grade()?.end_date ? formatDate(grade()?.end_date) : 'Seterusnya'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Information Sections Grid */}
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Panel 1: Data Pokok Nilai */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                                <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                                    <div class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                        </svg>
                                    </div>
                                    <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                        Spesifikasi Standar Nilai
                                    </h3>
                                </div>

                                <dl class="divide-y divide-neutral-100 dark:divide-neutral-800/80 text-xs">
                                    <div class="py-2.5 flex justify-between">
                                        <dt class="text-neutral-500">Nilai Huruf</dt>
                                        <dd class="font-mono font-extrabold text-base text-emerald-600 dark:text-emerald-400">{grade()?.alphabet_code || '-'}</dd>
                                    </div>
                                    <div class="py-2.5 flex justify-between">
                                        <dt class="text-neutral-500">Predikat / Keterangan</dt>
                                        <dd class="font-semibold text-neutral-900 dark:text-white">{grade()?.name}</dd>
                                    </div>
                                    <div class="py-2.5 flex justify-between">
                                        <dt class="text-neutral-500">Bobot Nilai (IPK)</dt>
                                        <dd class="font-mono font-bold text-neutral-900 dark:text-white">{grade()?.grade.toFixed(2)}</dd>
                                    </div>
                                    <div class="py-2.5 flex justify-between">
                                        <dt class="text-neutral-500">Batas Nilai Minimum</dt>
                                        <dd class="font-mono text-neutral-800 dark:text-neutral-200">{grade()?.minimum.toFixed(2)}</dd>
                                    </div>
                                    <div class="py-2.5 flex justify-between">
                                        <dt class="text-neutral-500">Batas Nilai Maksimum</dt>
                                        <dd class="font-mono text-neutral-800 dark:text-neutral-200">{grade()?.maximum.toFixed(2)}</dd>
                                    </div>
                                    <div class="py-2.5 flex justify-between">
                                        <dt class="text-neutral-500">Kode Numerik</dt>
                                        <dd class="font-mono text-neutral-500">{grade()?.code ?? '-'}</dd>
                                    </div>
                                </dl>

                                {/* Visual Score Distribution Meter */}
                                <div class="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
                                    <div class="flex items-center justify-between text-2xs text-neutral-500 font-mono">
                                        <span>Skor: 0</span>
                                        <span>Batas Min: {grade()?.minimum.toFixed(1)}</span>
                                        <span>Batas Max: {grade()?.maximum.toFixed(1)}</span>
                                        <span>100</span>
                                    </div>
                                    <div class="relative w-full h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                                        <div
                                            class="absolute top-0 bottom-0 bg-emerald-500 rounded-full"
                                            style={{
                                                left: `${Math.max(0, Math.min(100, grade()?.minimum || 0))}%`,
                                                width: `${Math.max(2, Math.min(100, (grade()?.maximum || 0) - (grade()?.minimum || 0)))}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Panel 2: Unit Pengelola & Feeder Dikti */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                                <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
                                    <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.333A1.5 1.5 0 0 0 18 8.833H6a1.5 1.5 0 0 0-1.5 1.5V21" />
                                        </svg>
                                    </div>
                                    <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                        Unit & Integrasi Dikti
                                    </h3>
                                </div>

                                <div class="space-y-4 text-xs">
                                    {/* Program Studi Box */}
                                    <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-neutral-500 font-semibold uppercase text-2xs">Program Studi / Unit Pengelola</span>
                                            <span class="font-mono text-2xs px-2 py-0.5 rounded-md bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                ID: {grade()?.unit_id || '-'}
                                            </span>
                                        </div>
                                        <p class="text-sm font-bold text-neutral-900 dark:text-white">
                                            {unit()?.name || 'Unit Belum Terhubung'}
                                        </p>
                                        <Show when={unit()?.code}>
                                            <p class="text-2xs font-mono text-neutral-500">
                                                Kode Unit: {unit()?.code}
                                            </p>
                                        </Show>
                                    </div>

                                    {/* Feeder Dikti Box */}
                                    <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700/80 space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="text-neutral-500 font-semibold uppercase text-2xs">Integrasi PD-Dikti Feeder</span>
                                            <span class="inline-flex items-center gap-1 text-2xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                                {grade()?.feeder_id ? 'Tersinkronisasi' : 'Lokal (Belum Sinkron)'}
                                            </span>
                                        </div>
                                        <div class="font-mono text-xs text-neutral-800 dark:text-neutral-200">
                                            ID Feeder: {grade()?.feeder_id || 'Tidak ada ID Feeder'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Audit Trail & Metadata */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Metadata Sistem & Log Audit
                            </h3>
                            <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                                <div>
                                    <span class="text-neutral-400 text-2xs block">DIBUAT PADA</span>
                                    <span class="text-neutral-800 dark:text-neutral-200">{formatDateTime(grade()?.created_at)}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 text-2xs block">DIPERBARUI PADA</span>
                                    <span class="text-neutral-800 dark:text-neutral-200">{formatDateTime(grade()?.updated_at)}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 text-2xs block">SINKRONISASI</span>
                                    <span class="text-neutral-800 dark:text-neutral-200">{formatDateTime(grade()?.sync_at)}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 text-2xs block">STATUS REKAMAN</span>
                                    <span class="text-emerald-600 dark:text-emerald-400 font-semibold">{grade()?.deleted_at ? 'Dihapus' : 'Aktif (Normal)'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Show>
            </main>
        </div>
    );
}
