import { createSignal, createEffect, onMount, Show, For, createMemo } from 'solid-js';
import { useParams, useSearchParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    getStudentById,
    type StudentMasterItem
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import {
    PersonMasterIndividualControllerShow
} from '~/controllers/person/master/PersonMasterIndividualController';
import {
    listStudentActivities,
    printActivityPlan,
    printActivityResult,
    type StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { openOrDownloadPdf } from '~/lib/pdfHelper';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import AcademicPerformanceChart, { type AcademicTrendPoint } from '~/components/chart/academic_performance_chart';
import StudentCreditChart from '~/components/chart/student_credit_chart';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';

export default function RectoratStudentDetail() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const [student, setStudent] = createSignal<StudentMasterItem | null>(null);
    const [individual, setIndividual] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [activities, setActivities] = createSignal<StudentActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);

    const isValidId = (id?: string | null): id is string => {
        if (!id) return false;
        const trimmed = id.trim();
        return (
            trimmed !== '' &&
            trimmed !== '[id]' &&
            trimmed !== ':id' &&
            trimmed !== 'student' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    const resolveStudentId = () => {
        // 1. In SolidStart routes with nested [id], params.id is the inner (student) param
        if (isValidId(params.id)) {
            return params.id.trim();
        }

        // 2. Extract from reactive router location pathname or window.location
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (isValidId(last)) {
            return last.trim();
        }

        // 3. Fallback to query params
        const qId = (searchParams.id as string) || (searchParams.student_id as string);
        if (isValidId(qId)) {
            return qId.trim();
        }

        return '';
    };

    const resolveInstIdFromPath = () => {
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const instIdx = parts.indexOf('institution');
        if (
            instIdx !== -1 &&
            parts[instIdx + 1] &&
            isValidId(parts[instIdx + 1])
        ) {
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

    const fetchStudentDetail = async () => {
        const sid = resolveStudentId();
        if (!isValidId(sid)) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch Student Master Record
            const stdRecord = await getStudentById(sid);
            if (!stdRecord) {
                setError('Data mahasiswa tidak ditemukan.');
                toast.danger('Gagal memuat data mahasiswa.');
                return;
            }
            setStudent(stdRecord);

            // 2. Fetch Student Academic Activities (KHS, IPK, IPS, SKS per semester)
            const actRes = await listStudentActivities({ student_id: sid, page: 1, page_size: 50 }).catch(() => null);
            setActivities(actRes?.data || []);

            // 3. Fetch linked Individual details (NIK, Birth, Address)
            if (stdRecord.individual_id && stdRecord.individual_id !== '00000000-0000-0000-0000-000000000000') {
                const indRes = await PersonMasterIndividualControllerShow(stdRecord.individual_id);
                if (!indRes.is_error && indRes.data) {
                    setIndividual(indRes.data);
                }
            }
        } catch (e: any) {
            console.error('Error loading student details:', e);
            setError(e.message || 'Terjadi kesalahan saat memuat data mahasiswa.');
            toast.danger('Gagal memuat data mahasiswa dari server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchStudentDetail();
    });

    createEffect(() => {
        const sid = resolveStudentId();
        if (sid) {
            fetchStudentDetail();
        }
    });

    const ind = () => individual()?.individual;

    // Academic Trend Points for Apache ECharts
    const academicTrendData = createMemo<AcademicTrendPoint[]>(() => {
        const list = activities();
        if (list.length === 0) return [];

        return list.map((act, idx) => {
            const semName = act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || `Sem ${idx + 1}`;
            const ips = Number(act.cumulative_index || 0);
            const ipk = Number(act.grand_cumulative_index || act.cumulative_index || 0);
            const sks = Number(act.total_credit || 0);
            const totalSks = Number(act.grand_total_credit || act.total_credit || 0);
            return {
                semName,
                ips: Number(ips.toFixed(2)),
                ipk: Number(ipk.toFixed(2)),
                sks,
                totalSks,
            };
        });
    });

    // Summary computed values
    const latestActivity = createMemo(() => {
        const list = activities();
        return list.length > 0 ? list[list.length - 1] : null;
    });

    const currentIpk = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        return Number(act.grand_cumulative_index || act.cumulative_index || 0).toFixed(2);
    };

    const currentIps = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        return Number(act.cumulative_index || 0).toFixed(2);
    };

    const currentTotalSks = () => {
        const act = latestActivity();
        if (!act) return 0;
        return act.grand_total_credit || act.total_credit || 0;
    };

    const [printingKey, setPrintingKey] = createSignal<string | null>(null);

    const isPrintingKRS = (actId?: string) => {
        if (!actId) return (printingKey() || '').startsWith('krs');
        return printingKey() === `krs-${actId}`;
    };

    const isPrintingKHS = (actId?: string) => {
        if (!actId) return (printingKey() || '').startsWith('khs');
        return printingKey() === `khs-${actId}`;
    };

    const handlePrintKRS = async (targetAct?: StudentActivityItem) => {
        const act = targetAct || latestActivity() || activities()[0];
        if (!act?.id) {
            toast.danger('Activity ID is missing.');
            return;
        }

        const key = `krs-${act.id}`;
        setPrintingKey(key);
        try {
            const semLabel = act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || 'Semester';
            toast.info(`Generating KRS (${semLabel}) PDF...`);
            const blob = await printActivityPlan(act.id);
            if (blob) {
                const nim = student()?.code || 'Student';
                const semName = (act.name || semLabel).replace(/\s+/g, '_');
                openOrDownloadPdf(blob, `KRS_${nim}_${semName}.pdf`, `KRS (${semLabel})`, true);
            } else {
                toast.danger('Failed to generate KRS PDF.');
            }
        } catch (err) {
            console.error('Error printing KRS:', err);
            toast.danger('An error occurred while generating KRS PDF.');
        } finally {
            setPrintingKey(null);
        }
    };

    const handlePrintKHS = async (targetAct?: StudentActivityItem) => {
        const act = targetAct || latestActivity() || activities()[0];
        if (!act?.id) {
            toast.danger('Activity ID is missing.');
            return;
        }

        const key = `khs-${act.id}`;
        setPrintingKey(key);
        try {
            const semLabel = act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || 'Semester';
            toast.info(`Generating KHS (${semLabel}) PDF...`);
            const blob = await printActivityResult(act.id);
            if (blob) {
                const nim = student()?.code || 'Student';
                const semName = (act.name || semLabel).replace(/\s+/g, '_');
                openOrDownloadPdf(blob, `KHS_${nim}_${semName}.pdf`, `KHS (${semLabel})`, true);
            } else {
                toast.danger('Failed to generate KHS PDF.');
            }
        } catch (err) {
            console.error('Error printing KHS:', err);
            toast.danger('An error occurred while generating KHS PDF.');
        } finally {
            setPrintingKey(null);
        }
    };

    const formatDate = (d?: string | null) => {
        if (!d) return '-';
        try {
            return new Date(d).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
        } catch {
            return d;
        }
    };

    const initials = (name?: string) =>
        (name || 'M')
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0] ?? '')
            .join('')
            .toUpperCase();

    const Field = (props: { label: string; value?: string | number | null; mono?: boolean; isCurrency?: boolean }) => {
        const displayValue = () => {
            if (props.value === undefined || props.value === null || props.value === '') return '-';
            if (props.isCurrency && typeof props.value === 'number') {
                return `Rp ${props.value.toLocaleString('id-ID')}`;
            }
            return String(props.value);
        };

        return (
            <div class="flex justify-between py-2 border-b border-neutral-100 dark:border-neutral-800 text-xs">
                <span class="text-neutral-500 dark:text-neutral-400 font-medium">{props.label}</span>
                <span class={`font-semibold text-neutral-900 dark:text-neutral-100 text-right ${props.mono ? 'font-mono' : ''}`}>
                    {displayValue()}
                </span>
            </div>
        );
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Breadcrumb Navigation */}
                <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium flex-wrap">
                    <A href="/rectorat" class="hover:text-blue-600 transition-colors">Rektorat</A>
                    <span>/</span>
                    <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-blue-600 transition-colors">Institusi</A>
                    <span>/</span>
                    <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-blue-600 transition-colors">Akademik</A>
                    <span>/</span>
                    <A href={`/rectorat/institution/${institutionId()}/academic/student/master/student`} class="hover:text-blue-600 transition-colors">Mahasiswa</A>
                    <span>/</span>
                    <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Detail Mahasiswa</span>
                </nav>

                {/* Loading skeleton */}
                <Show when={isLoading()}>
                    <div class="animate-pulse space-y-6">
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
                            <div class="flex items-center gap-5">
                                <div class="size-20 rounded-2xl bg-neutral-200 dark:bg-neutral-800 shrink-0" />
                                <div class="space-y-3 flex-1">
                                    <div class="h-7 w-64 bg-neutral-200 dark:bg-neutral-800 rounded-lg" />
                                    <div class="h-4 w-40 bg-neutral-200 dark:bg-neutral-800 rounded" />
                                    <div class="h-5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full" />
                                </div>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {Array.from({ length: 4 }).map(() => (
                                <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 shadow-sm space-y-2">
                                    <div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-800 rounded" />
                                    <div class="h-8 w-16 bg-neutral-200 dark:bg-neutral-800 rounded" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Show>

                {/* Error State */}
                <Show when={!isLoading() && error()}>
                    <div class="flex flex-col items-center justify-center py-20 gap-4 text-center bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm p-8">
                        <div class="p-5 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                        </div>
                        <div>
                            <p class="font-bold text-lg text-neutral-800 dark:text-neutral-200">Gagal Memuat Detail Mahasiswa</p>
                            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{error()}</p>
                        </div>
                        <div class="flex items-center gap-3">
                            <button
                                type="button"
                                id="student-detail-retry"
                                onClick={fetchStudentDetail}
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                Coba Lagi
                            </button>
                            <A
                                href={`/rectorat/institution/${institutionId()}/academic/student/master/student`}
                                class="px-4 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition-colors"
                            >
                                Kembali
                            </A>
                        </div>
                    </div>
                </Show>

                {/* Main Content */}
                <Show when={!isLoading() && !error() && student()}>
                    <div class="space-y-6">

                        {/* Header Banner */}
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                            <div class="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500" />
                            <div class="p-6 sm:p-8">
                                <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div class="flex items-center gap-5">
                                        <div class="size-16 sm:size-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg shrink-0 select-none">
                                            {initials(student()?.name)}
                                        </div>
                                        <div class="space-y-1 min-w-0">
                                            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                                <span>NIM: {student()?.code || '-'}</span>
                                            </div>
                                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white truncate">
                                                {student()?.name || 'Detail Mahasiswa'}
                                            </h1>
                                            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                                {student()?.unit_name || 'Program Studi'} • Tahun Akademik {student()?.academic_year_name || '-'}
                                            </p>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-3 shrink-0">
                                        <A
                                            href={`/rectorat/institution/${institutionId()}/academic/student/master/student`}
                                            id="student-detail-back-btn"
                                            class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-neutral-200 dark:border-neutral-700 shadow-xs"
                                        >
                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m15 18-6-6 6-6" />
                                            </svg>
                                            <span>Kembali ke Daftar Mahasiswa</span>
                                        </A>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 4 Academic Summary Stat Cards */}
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* IPK Kumulatif */}
                            <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">IPK Kumulatif</span>
                                    <div class="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                        {currentIpk()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-mono">/ 4.00</span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    Indeks Prestasi Kumulatif
                                </div>
                            </div>

                            {/* IPS Terakhir */}
                            <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">IPS Terakhir</span>
                                    <div class="size-8 rounded-lg bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="m19 9-5 5-4-4-3 3" />
                                            <path d="M3 3v18h18" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
                                        {currentIps()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-mono">/ 4.00</span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    Indeks Prestasi Semester
                                </div>
                            </div>

                            {/* Total SKS Lulus */}
                            <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">Total SKS Lulus</span>
                                    <div class="size-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                        {currentTotalSks()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-medium">SKS</span>
                                </div>
                                <div class="text-[11px] text-blue-600 dark:text-blue-400 font-mono">
                                    Kredit Kumulatif Selesai
                                </div>
                            </div>

                            {/* Status & Semester */}
                            <div class="p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">Status & Semester</span>
                                    <div class="size-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <path d="m9 11 3 3L22 4" />
                                        </svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                                        {student()?.status_name || 'Aktif'}
                                    </span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    {activities().length} Semester Tercatat
                                </div>
                            </div>
                        </div>

                        {/* Visualizations Section Powered by Apache ECharts */}
                        <div class="space-y-4">
                            <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-3">
                                <div>
                                    <h2 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        <span class="size-2.5 rounded-full bg-blue-500"></span>
                                        Visualisasi Akademik Mahasiswa
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Grafik perkembangan indeks prestasi (IPS & IPK) dan beban kredit SKS mahasiswa berbasis Apache ECharts.
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-mono text-[11px] font-semibold border border-blue-200 dark:border-blue-800">
                                        Apache ECharts
                                    </span>
                                </div>
                            </div>

                            <Show
                                when={academicTrendData().length > 0}
                                fallback={
                                    <div class="p-8 rounded-xl bg-white dark:bg-neutral-900 border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-3">
                                        <div class="size-12 mx-auto rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                            <svg class="size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m19 9-5 5-4-4-3 3" />
                                                <path d="M3 3v18h18" />
                                            </svg>
                                        </div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Belum Ada Riwayat Aktivitas & Nilai</h3>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                                            Data aktivitas perkuliahan mahasiswa dengan NIM <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{student()?.code || '-'}</span> belum tercatat di sistem akademik. Grafik ECharts akan otomatis muncul setelah nilai semester diinput.
                                        </p>
                                    </div>
                                }
                            >
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Chart 1: Academic Performance (IPS & IPK Trend) */}
                                    <div class="min-w-0 p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Tren Indeks Prestasi (IPS & IPK)
                                                </h3>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                                    Grafik fluktuasi IP Semester dan IP Kumulatif per semester.
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-3 text-xs font-mono">
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-indigo-500"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">IPK</span>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-sky-500"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">IPS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <AcademicPerformanceChart data={academicTrendData()} />
                                    </div>

                                    {/* Chart 2: Credit SKS Load Progression */}
                                    <div class="min-w-0 p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Progres Beban Kredit SKS
                                                </h3>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                                    Akumulasi SKS lulus kumulatif dan SKS diambil per semester.
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-3 text-xs font-mono">
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-teal-600"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">SKS Kumulatif</span>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-amber-500"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">SKS Semester</span>
                                                </div>
                                            </div>
                                        </div>

                                        <StudentCreditChart data={academicTrendData()} />
                                    </div>
                                </div>
                            </Show>
                        </div>

                        {/* Semester Breakdown Table (KHS) */}
                        <Show when={activities().length > 0}>
                            <div class="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
                                <div class="p-5 border-b border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Riwayat Aktivitas Semester & Nilai (KHS)
                                        </h3>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                            Rincian capaian akademik per semester mahasiswa.
                                        </p>
                                    </div>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs text-left border-collapse">
                                        <thead class="bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 dark:text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-800">
                                            <tr>
                                                <th class="px-5 py-3">No</th>
                                                <th class="px-5 py-3">Semester / Tahun Ajaran</th>
                                                <th class="px-5 py-3 text-center">SKS Semester</th>
                                                <th class="px-5 py-3 text-center">SKS Kumulatif</th>
                                                <th class="px-5 py-3 text-center">IPS</th>
                                                <th class="px-5 py-3 text-center">IPK</th>
                                                <th class="px-5 py-3 text-center">Status</th>
                                                <th class="px-5 py-3 text-center">Dokumen / Cetak</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                            <For each={activities()}>
                                                {(act, idx) => (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                                                        <td class="px-5 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                        <td class="px-5 py-3 font-medium text-neutral-900 dark:text-white">
                                                            {act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || `Semester ${idx() + 1}`}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-neutral-700 dark:text-neutral-300">
                                                            {act.total_credit || 0}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">
                                                            {act.grand_total_credit || act.total_credit || 0}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                                                            {Number(act.cumulative_index || 0).toFixed(2)}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            {Number(act.grand_cumulative_index || act.cumulative_index || 0).toFixed(2)}
                                                        </td>
                                                        <td class="px-5 py-3 text-center">
                                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                                {act.status_name || 'Selesai'}
                                                            </span>
                                                        </td>
                                                        <td class="px-5 py-3 text-center">
                                                            <div class="flex items-center justify-center gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePrintKRS(act)}
                                                                    disabled={isPrintingKRS(act.id)}
                                                                    class="px-2.5 py-1 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                    title="Cetak KRS (Kartu Rencana Studi)"
                                                                >
                                                                    <Show
                                                                        when={!isPrintingKRS(act.id)}
                                                                        fallback={<div class="size-3 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>}
                                                                    >
                                                                        <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                                                                    </Show>
                                                                    <span>KRS</span>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePrintKHS(act)}
                                                                    disabled={isPrintingKHS(act.id)}
                                                                    class="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-md text-[11px] font-bold inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                                                                    title="Cetak KHS (Kartu Hasil Studi)"
                                                                >
                                                                    <Show
                                                                        when={!isPrintingKHS(act.id)}
                                                                        fallback={<div class="size-3 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>}
                                                                    >
                                                                        <svg class="size-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                                                    </Show>
                                                                    <span>KHS</span>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Show>

                        {/* Detailed Information Cards Grid */}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Academic & Enrolment Information Card */}
                            <div class="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                    <div class="flex items-center gap-2">
                                        <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                            </svg>
                                        </div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Informasi Akademik & Pendaftaran</h3>
                                    </div>
                                    <Show when={student()?.status_name}>
                                        <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            {student()?.status_name}
                                        </span>
                                    </Show>
                                </div>

                                <div class="space-y-1">
                                    <Field label="NIM / Kode Mahasiswa" value={student()?.code} mono />
                                    <Field label="Nomor Registrasi" value={student()?.registration_id} mono />
                                    <Field label="Jalur Masuk / Seleksi" value={student()?.selection_type_name} />
                                    <Field label="Tanggal Terdaftar" value={formatDate(student()?.registered)} />
                                    <Field label="Program Studi (Unit)" value={student()?.unit_name} />
                                    <Field label="Tahun Akademik / Angkatan" value={student()?.academic_year_name} />
                                    <Field label="Kurikulum" value={student()?.curriculum_name || student()?.curriculum_id} />
                                    <Field label="Biaya Kuliah (Finance Fee)" value={student()?.finance_fee} isCurrency mono />
                                    <Field label="Status Mahasiswa" value={student()?.status_name} />
                                </div>
                            </div>

                            {/* Personal & Demographics Card */}
                            <div class="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                    <div class="flex items-center gap-2">
                                        <div class="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                            </svg>
                                        </div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Biodata Pribadi & Identitas</h3>
                                    </div>
                                    <span class="text-xs text-neutral-400 font-mono">Registry</span>
                                </div>

                                <div class="space-y-1">
                                    <Field label="Nama Lengkap" value={student()?.name} />
                                    <Field label="Nomor Induk Kependudukan (NIK)" value={ind()?.code} mono />
                                    <Field label="NISN" value={student()?.nisn} mono />
                                    <Field
                                        label="Tempat & Tanggal Lahir"
                                        value={
                                            ind()?.birth_place
                                                ? `${ind()?.birth_place}, ${formatDate(ind()?.birth_date)}`
                                                : formatDate(ind()?.birth_date)
                                        }
                                    />
                                    <Show when={individual()?.gender?.name}>
                                        <Field label="Jenis Kelamin" value={individual()?.gender?.name} />
                                    </Show>
                                    <Show when={individual()?.religion?.name}>
                                        <Field label="Agama" value={individual()?.religion?.name} />
                                    </Show>
                                    <Field label="Alamat Tetap" value={individual()?.biodata?.address} />
                                </div>
                            </div>
                        </div>

                        {/* System Metadata Section */}
                        <div class="bg-white dark:bg-neutral-900 rounded-xl p-6 border border-neutral-200 dark:border-neutral-800 shadow-sm space-y-4">
                            <div class="flex items-center gap-2 pb-3 border-b border-neutral-200 dark:border-neutral-800">
                                <div class="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                    </svg>
                                </div>
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Informasi Sistem & Audit</h3>
                            </div>
                            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                                <div>
                                    <span class="text-neutral-400 font-mono text-[11px] uppercase tracking-wider block">ID Mahasiswa</span>
                                    <span class="font-mono text-neutral-700 dark:text-neutral-300 font-medium break-all">{student()?.id || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 font-mono text-[11px] uppercase tracking-wider block">Waktu Dibuat</span>
                                    <span class="font-medium text-neutral-700 dark:text-neutral-300">{formatDate(student()?.created_at)}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 font-mono text-[11px] uppercase tracking-wider block">Terakhir Diperbarui</span>
                                    <span class="font-medium text-neutral-700 dark:text-neutral-300">{formatDate(student()?.updated_at)}</span>
                                </div>
                            </div>
                        </div>

                    </div>
                </Show>

            </div>
        </div>
    );
}
