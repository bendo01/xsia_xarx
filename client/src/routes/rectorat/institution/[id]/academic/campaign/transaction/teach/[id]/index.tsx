import { createSignal, createEffect, onMount, Show, For, createMemo } from 'solid-js';
import { useParams, useLocation, useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import { masterApiShow } from '~/controllers/master/masterApiController';
import {
    getTeachById,
    getCourseById,
    getClassCodeById,
    getActivityById,
    listTeachLecturers,
    listLecturers,
    type TeachItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';

interface UnitDetail {
    id: string;
    name?: string;
    code?: string;
}

export default function RectoratTeachDetail() {
    const params = useParams();
    const location = useLocation();
    const [searchParams] = useSearchParams();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const [teach, setTeach] = createSignal<TeachItem | null>(null);
    const [course, setCourse] = createSignal<any | null>(null);
    const [classCode, setClassCode] = createSignal<any | null>(null);
    const [activity, setActivity] = createSignal<any | null>(null);
    const [unit, setUnit] = createSignal<UnitDetail | null>(null);
    const [teachLecturers, setTeachLecturers] = createSignal<any[]>([]);
    const [lecturersList, setLecturersList] = createSignal<any[]>([]);

    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [isCopied, setIsCopied] = createSignal(false);

    // Active Tab in Detail: 'overview' | 'lecturers' | 'students' | 'evaluations'
    const [activeTab, setActiveTab] = createSignal<'overview' | 'lecturers' | 'students' | 'evaluations'>('overview');

    // Student list search filter
    const [studentSearchQuery, setStudentSearchQuery] = createSignal('');

    const isValidId = (id?: string | null): id is string => {
        if (!id) return false;
        const trimmed = id.trim();
        return (
            trimmed !== '' &&
            trimmed !== '[id]' &&
            trimmed !== ':id' &&
            trimmed !== 'teach' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    const resolveTeachId = () => {
        if (isValidId(params.id)) {
            return params.id.trim();
        }
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (isValidId(last)) {
            return last.trim();
        }
        const qId = (searchParams.id as string) || (searchParams.teach_id as string);
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
        const tId = resolveTeachId();
        if (!tId || !isValidId(tId)) {
            setError('ID Kelas Mengajar tidak valid atau tidak ditemukan.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const data = await getTeachById(tId);
            if (!data) {
                setError('Data kelas mengajar tidak ditemukan di server.');
                setTeach(null);
                return;
            }

            setTeach(data);

            // Populate directly from the enhanced TeachResponse
            if (data.course) setCourse(data.course);
            if (data.class_code) setClassCode(data.class_code);
            if (data.activity) setActivity(data.activity);
            if (data.teach_lecturers && Array.isArray(data.teach_lecturers)) {
                setTeachLecturers(data.teach_lecturers);
            }
        } catch (e: any) {
            console.error('Error loading teach detail:', e);
            setError(e.message || 'Gagal memuat detail data kelas mengajar.');
            toast.danger('Gagal memuat detail kelas.');
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

    // Filtered students from detail_activities
    const filteredStudents = createMemo(() => {
        const list = teach()?.detail_activities || [];
        const query = studentSearchQuery().trim().toLowerCase();
        if (!query) return list;
        return list.filter((s: any) => {
            const name = (s.student_name || '').toLowerCase();
            const nim = (s.student_nim || '').toLowerCase();
            return name.includes(query) || nim.includes(query);
        });
    });

    // Evaluation total percentage calculation
    const totalEvaluationWeight = createMemo(() => {
        const evals = teach()?.teach_evaluations || [];
        return evals.reduce((sum, e) => sum + (Number(e.evaluation_weight) || 0), 0);
    });

    // Enrolled count & capacity
    const enrolledCount = () => teach()?.enrolled_count || (teach()?.detail_activities?.length || 0);
    const maxCapacity = () => teach()?.max_member || classCode()?.capacity || 0;
    const capacityRate = () => (maxCapacity() > 0 ? Math.min(100, Math.round((enrolledCount() / maxCapacity()) * 100)) : 0);

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header & Breadcrumb */}
                <div class="space-y-4">
                    <nav class="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 overflow-x-auto scrollbar-none whitespace-nowrap pb-1">
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
                        <A href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach`} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                            Aktivitas Mengajar
                        </A>
                        <span>/</span>
                        <span class="text-neutral-700 dark:text-neutral-300 font-semibold truncate max-w-[200px] sm:max-w-none">
                            {teach()?.name || course()?.name || 'Detail Kelas'}
                        </span>
                    </nav>

                    {/* Hero Header Card */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-5 sm:p-8 border border-neutral-200/80 dark:border-neutral-800 shadow-sm relative overflow-hidden backdrop-blur-xs">
                        <div class="absolute -right-16 -top-16 w-72 h-72 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none" />

                        <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                            <div class="space-y-3">
                                <div class="flex flex-wrap items-center gap-2">
                                    <A
                                        href={`/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach`}
                                        class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 text-xs font-semibold transition-colors"
                                    >
                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                        </svg>
                                        <span>Daftar Kelas</span>
                                    </A>

                                    <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-semibold border border-blue-200 dark:border-blue-800/80">
                                        <span class="size-1.5 rounded-full bg-blue-500" />
                                        <span>Kode Kelas: {classCode()?.alphabet_code || 'KL'}</span>
                                    </div>

                                    <Show
                                        when={teach()?.is_lock}
                                        fallback={
                                            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800/80">
                                                <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                <span>Input Nilai Terbuka</span>
                                            </span>
                                        }
                                    >
                                        <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800/80">
                                            <svg class="size-3 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                            </svg>
                                            <span>Nilai Terkunci (Final)</span>
                                        </span>
                                    </Show>
                                </div>

                                <h1 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                    {teach()?.name || course()?.name || 'Aktivitas Kelas Mengajar'}
                                </h1>

                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                    Mata Kuliah: <strong class="text-neutral-800 dark:text-neutral-200">{course()?.code || '-'} - {course()?.name || '-'}</strong> ({course()?.total_credit || 0} SKS) • Program Studi: <strong class="text-neutral-800 dark:text-neutral-200">{unit()?.name || 'Program Studi Terdaftar'}</strong>
                                </p>
                            </div>

                            <div class="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(teach()?.id || '')}
                                    class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
                                    title="Salin ID Kelas"
                                >
                                    <Show
                                        when={isCopied()}
                                        fallback={
                                            <>
                                                <svg class="size-4 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                                                </svg>
                                                <span>Salin ID</span>
                                            </>
                                        }
                                    >
                                        <svg class="size-4 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                        </svg>
                                        <span class="text-emerald-600">Tersalin!</span>
                                    </Show>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => fetchDetail()}
                                    class="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
                                    title="Segarkan Data"
                                >
                                    <svg
                                        class={`size-4 ${isLoading() ? 'animate-spin' : ''}`}
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        stroke-width="2"
                                    >
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                    </svg>
                                    <span>Segarkan</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metric Summary Cards */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Card 1: Total SKS */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider">Total SKS MK</span>
                            <span class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                </svg>
                            </span>
                        </div>
                        <div class="mt-3">
                            <span class="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {course()?.total_credit || 0} SKS
                            </span>
                            <span class="text-2xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                                Teori: {course()?.lecture_credit || 0} • Praktek: {course()?.practice_credit || 0}
                            </span>
                        </div>
                    </div>

                    {/* Card 2: Peserta & Kapasitas */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider">Kapasitas Mahasiswa</span>
                            <span class="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.999-3.199a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                </svg>
                            </span>
                        </div>
                        <div class="mt-3">
                            <span class="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {enrolledCount()} / {maxCapacity()}
                            </span>
                            <span class="text-2xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                                Keterisian: {capacityRate()}%
                            </span>
                        </div>
                    </div>

                    {/* Card 3: Dosen Ditugaskan */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider">Dosen Pengajar</span>
                            <span class="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            </span>
                        </div>
                        <div class="mt-3">
                            <span class="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {teachLecturers().length} Dosen
                            </span>
                            <span class="text-2xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                                Tim Pengajar Kelas
                            </span>
                        </div>
                    </div>

                    {/* Card 4: Komponen Penilaian */}
                    <div class="bg-white dark:bg-neutral-900 rounded-2xl p-4 sm:p-5 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                            <span class="text-2xs sm:text-xs font-semibold uppercase tracking-wider">Instrumen Evaluasi</span>
                            <span class="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                                </svg>
                            </span>
                        </div>
                        <div class="mt-3">
                            <span class="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white font-mono">
                                {teach()?.teach_evaluations?.length || 0} Komponen
                            </span>
                            <span class="text-2xs text-neutral-500 dark:text-neutral-400 block mt-0.5">
                                Bobot Terencana: {totalEvaluationWeight()}%
                            </span>
                        </div>
                    </div>
                </div>

                {/* Detail Content Section with Tabs */}
                <div class="space-y-6">
                    {/* Navigation Tab Bar */}
                    <div class="flex items-center gap-1.5 p-1.5 bg-neutral-100 dark:bg-neutral-900/90 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 w-full overflow-x-auto scrollbar-none shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setActiveTab('overview')}
                            class={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab() === 'overview'
                                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/60 dark:border-neutral-700/80'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <span>Informasi Kelas & Kurikulum</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('lecturers')}
                            class={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab() === 'lecturers'
                                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/60 dark:border-neutral-700/80'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <span>Dosen Pengajar ({teachLecturers().length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('students')}
                            class={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab() === 'students'
                                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/60 dark:border-neutral-700/80'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <span>Mahasiswa Peserta ({enrolledCount()})</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('evaluations')}
                            class={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap cursor-pointer ${
                                activeTab() === 'evaluations'
                                    ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/60 dark:border-neutral-700/80'
                                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                            }`}
                        >
                            <span>Komponen Evaluasi ({teach()?.teach_evaluations?.length || 0})</span>
                        </button>
                    </div>

                    {/* Tab 1: Overview & Curriculum Details */}
                    <Show when={activeTab() === 'overview'}>
                        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Course Details Card */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                                <div class="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                    <div class="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Spesifikasi Mata Kuliah
                                        </h3>
                                        <p class="text-xs text-neutral-500">
                                            Kurikulum & bobot pembelajaran
                                        </p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Nama Mata Kuliah</span>
                                        <p class="font-bold text-neutral-900 dark:text-white">{course()?.name || '-'}</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Kode Mata Kuliah</span>
                                        <p class="font-mono font-bold text-blue-600 dark:text-blue-400">{course()?.code || '-'}</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Total SKS</span>
                                        <p class="font-mono font-bold text-neutral-900 dark:text-white">{course()?.total_credit || 0} SKS</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Rincian SKS</span>
                                        <p class="font-mono text-neutral-700 dark:text-neutral-300">
                                            Teori: {course()?.lecture_credit || 0} • Praktik: {course()?.practice_credit || 0}
                                        </p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1 sm:col-span-2">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Program Studi Pengampu</span>
                                        <p class="font-medium text-neutral-800 dark:text-neutral-200">{unit()?.name || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Class Allocation & Dates Card */}
                            <div class="bg-white dark:bg-neutral-900 rounded-2xl p-6 border border-neutral-200/80 dark:border-neutral-800 shadow-2xs space-y-4">
                                <div class="flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                                    <div class="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                        <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <rect width="18" height="18" x="3" y="3" rx="2" />
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M3 9h18M9 21V9" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Penugasan Kelas & Periode
                                        </h3>
                                        <p class="text-xs text-neutral-500">
                                            Jadwal pelaksanaan & kapasitas ruangan
                                        </p>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Nama Kelas</span>
                                        <p class="font-bold text-neutral-900 dark:text-white">{teach()?.name || '-'}</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Kode Alfabet Kelas</span>
                                        <p class="font-mono font-bold text-indigo-600 dark:text-indigo-400">{classCode()?.alphabet_code || 'KL'}</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Mulai Perkuliahan</span>
                                        <p class="font-mono text-neutral-800 dark:text-neutral-200">{formatDate(teach()?.start_date)}</p>
                                    </div>
                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1">
                                        <span class="text-2xs text-neutral-400 uppercase font-semibold">Selesai Perkuliahan</span>
                                        <p class="font-mono text-neutral-800 dark:text-neutral-200">{formatDate(teach()?.end_date)}</p>
                                    </div>
                                    <Show when={teach()?.practice_start_date || teach()?.practice_end_date}>
                                        <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 space-y-1 sm:col-span-2">
                                            <span class="text-2xs text-neutral-400 uppercase font-semibold">Periode Praktikum</span>
                                            <p class="font-mono text-neutral-700 dark:text-neutral-300">
                                                {formatDate(teach()?.practice_start_date)} s/d {formatDate(teach()?.practice_end_date)}
                                            </p>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 2: Lecturers (Dosen Pengajar) */}
                    <Show when={activeTab() === 'lecturers'}>
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden">
                            <div class="p-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Tim Dosen Pengajar
                                    </h3>
                                    <p class="text-xs text-neutral-500">
                                        Daftar penugasan dosen, bobot SKS ajar, serta realisasi tatap muka
                                    </p>
                                </div>
                                <span class="px-3 py-1 rounded-full text-xs font-semibold bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/80">
                                    {teachLecturers().length} Dosen Terdaftar
                                </span>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        <tr>
                                            <th class="px-6 py-4">Nama Dosen Pengajar</th>
                                            <th class="px-6 py-4 text-center">Bobot SKS</th>
                                            <th class="px-6 py-4">Rencana Pertemuan</th>
                                            <th class="px-6 py-4">Realisasi Pertemuan</th>
                                            <th class="px-6 py-4 text-center">Homebase</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                        <Show
                                            when={teachLecturers().length > 0}
                                            fallback={
                                                <tr>
                                                    <td colspan="5" class="px-6 py-12 text-center text-xs text-neutral-500">
                                                        Belum ada dosen yang ditugaskan pada kelas ini.
                                                    </td>
                                                </tr>
                                            }
                                        >
                                            <For each={teachLecturers()}>
                                                {(tl) => {
                                                    const lecturerInfo = lecturersList().find((l) => l.id === tl.lecturer_id);
                                                    const lecturerName = tl.name || lecturerInfo?.name || lecturerInfo?.display_name || 'Dosen Pengajar';

                                                    return (
                                                        <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                                                            <td class="px-6 py-4">
                                                                <div class="flex items-center gap-3">
                                                                    <div class="size-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                                                                        {lecturerName.slice(0, 2).toUpperCase()}
                                                                    </div>
                                                                    <div>
                                                                        <span class="font-bold text-neutral-900 dark:text-white block text-sm">
                                                                            {lecturerName}
                                                                        </span>
                                                                        <span class="text-2xs text-neutral-500 font-mono">
                                                                            ID: {tl.lecturer_id}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td class="px-6 py-4 text-center font-mono font-bold text-sm">
                                                                {tl.credit || 0} SKS
                                                            </td>
                                                            <td class="px-6 py-4 font-mono text-xs">
                                                                {tl.planning || 0} Sesi
                                                            </td>
                                                            <td class="px-6 py-4">
                                                                <div class="space-y-1 w-28">
                                                                    <div class="flex items-center justify-between text-2xs font-mono">
                                                                        <span>{tl.realization || 0} / {tl.planning || 0}</span>
                                                                        <span>
                                                                            {tl.planning > 0 ? Math.round(((tl.realization || 0) / tl.planning) * 100) : 0}%
                                                                        </span>
                                                                    </div>
                                                                    <div class="w-full h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                                                                        <div
                                                                            class="h-full bg-purple-500 rounded-full"
                                                                            style={{
                                                                                width: `${tl.planning > 0 ? Math.min(100, Math.round(((tl.realization || 0) / tl.planning) * 100)) : 0}%`,
                                                                            }}
                                                                        />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td class="px-6 py-4 text-center">
                                                                <Show
                                                                    when={tl.is_lecturer_home_base}
                                                                    fallback={
                                                                        <span class="px-2.5 py-0.5 rounded-full text-2xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                                                            Luar Homebase
                                                                        </span>
                                                                    }
                                                                >
                                                                    <span class="px-2.5 py-0.5 rounded-full text-2xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                                                        Homebase
                                                                    </span>
                                                                </Show>
                                                            </td>
                                                        </tr>
                                                    );
                                                }}
                                            </For>
                                        </Show>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 3: Enrolled Students & Marks */}
                    <Show when={activeTab() === 'students'}>
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Mahasiswa Peserta Kelas Kuliah
                                    </h3>
                                    <p class="text-xs text-neutral-500">
                                        Data nilai akhir dan status penguncian KRS mahasiswa
                                    </p>
                                </div>

                                <div class="relative w-full sm:w-64">
                                    <input
                                        type="text"
                                        placeholder="Cari NIM atau nama..."
                                        value={studentSearchQuery()}
                                        onInput={(e) => setStudentSearchQuery(e.currentTarget.value)}
                                        class="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                                    />
                                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            <div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        <tr>
                                            <th class="px-6 py-3.5">NIM & Nama Mahasiswa</th>
                                            <th class="px-6 py-3.5 text-center">SKS</th>
                                            <th class="px-6 py-3.5 text-center">Nilai Angka</th>
                                            <th class="px-6 py-3.5 text-center">Nilai Huruf</th>
                                            <th class="px-6 py-3.5 text-center">Status Kunci</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                        <Show
                                            when={filteredStudents().length > 0}
                                            fallback={
                                                <tr>
                                                    <td colspan="5" class="px-6 py-12 text-center text-xs text-neutral-500">
                                                        Tidak ada data mahasiswa terdaftar yang cocok dengan filter.
                                                    </td>
                                                </tr>
                                            }
                                        >
                                            <For each={filteredStudents()}>
                                                {(student) => (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                                                        <td class="px-6 py-3.5">
                                                            <div class="flex items-center gap-3">
                                                                <div class="size-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center font-bold text-2xs text-neutral-600 dark:text-neutral-300">
                                                                    {(student.student_name || 'M').slice(0, 1)}
                                                                </div>
                                                                <div>
                                                                    <span class="font-bold text-neutral-900 dark:text-white text-xs block">
                                                                        {student.student_name || 'Mahasiswa'}
                                                                    </span>
                                                                    <span class="text-2xs font-mono text-neutral-500">
                                                                        NIM: {student.student_nim || '-'}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="px-6 py-3.5 text-center font-mono text-xs">
                                                            {student.credit || course()?.total_credit || 0}
                                                        </td>
                                                        <td class="px-6 py-3.5 text-center font-mono font-bold text-xs">
                                                            {student.mark !== null && student.mark !== undefined ? student.mark.toFixed(2) : '-'}
                                                        </td>
                                                        <td class="px-6 py-3.5 text-center font-mono font-bold text-xs">
                                                            {student.grade?.alphabet_code || '-'}
                                                        </td>
                                                        <td class="px-6 py-3.5 text-center">
                                                            <Show
                                                                when={student.is_lock}
                                                                fallback={
                                                                    <span class="px-2 py-0.5 rounded text-2xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                                        Terbuka
                                                                    </span>
                                                                }
                                                            >
                                                                <span class="px-2 py-0.5 rounded text-2xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                                                                    Terkunci
                                                                </span>
                                                            </Show>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </Show>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 4: Evaluation Components */}
                    <Show when={activeTab() === 'evaluations'}>
                        <div class="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xs overflow-hidden space-y-4 p-5 sm:p-6">
                            <div class="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-4">
                                <div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Komponen Evaluasi & Penilaian
                                    </h3>
                                    <p class="text-xs text-neutral-500">
                                        Rancangan bobot penilaian pembelajaran untuk kelas ini
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-neutral-500">Total Bobot:</span>
                                    <span class={`font-mono font-extrabold text-sm px-3 py-1 rounded-xl border ${
                                        totalEvaluationWeight() === 100
                                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                            : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                    }`}>
                                        {totalEvaluationWeight()}%
                                    </span>
                                </div>
                            </div>

                            <div class="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
                                <table class="w-full text-left text-sm">
                                    <thead class="bg-neutral-50/80 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800 text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        <tr>
                                            <th class="px-6 py-3.5">Urutan</th>
                                            <th class="px-6 py-3.5">Nama Komponen Evaluasi</th>
                                            <th class="px-6 py-3.5">Nama Bahasa Inggris</th>
                                            <th class="px-6 py-3.5 text-center">Bobot Persentase</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200/80 dark:divide-neutral-800/80">
                                        <Show
                                            when={(teach()?.teach_evaluations?.length || 0) > 0}
                                            fallback={
                                                <tr>
                                                    <td colspan="4" class="px-6 py-12 text-center text-xs text-neutral-500">
                                                        Belum ada komponen evaluasi yang ditentukan untuk kelas ini.
                                                    </td>
                                                </tr>
                                            }
                                        >
                                            <For each={teach()?.teach_evaluations || []}>
                                                {(ev, idx) => (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40 transition-colors">
                                                        <td class="px-6 py-3.5 font-mono text-xs text-neutral-500">
                                                            #{ev.thread || idx() + 1}
                                                        </td>
                                                        <td class="px-6 py-3.5 font-semibold text-neutral-900 dark:text-white text-xs">
                                                            {ev.name || '-'}
                                                        </td>
                                                        <td class="px-6 py-3.5 text-xs text-neutral-500 italic">
                                                            {ev.english_name || '-'}
                                                        </td>
                                                        <td class="px-6 py-3.5 text-center font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                                            {ev.evaluation_weight || 0}%
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </Show>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
