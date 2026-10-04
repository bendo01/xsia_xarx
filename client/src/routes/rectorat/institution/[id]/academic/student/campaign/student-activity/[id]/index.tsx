import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useParams, useSearchParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    getStudentActivityById,
    printActivityPlan,
    printActivityResult,
    type StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import {
    listDetailActivities,
    type DetailActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import {
    listCourses,
    listTeaches
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import { listGrades } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';
import {
    getStudentById,
    type StudentMasterItem
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import {
    PersonMasterIndividualControllerShow
} from '~/controllers/person/master/PersonMasterIndividualController';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { openOrDownloadPdf } from '~/lib/pdfHelper';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';

export default function RectoratStudentActivityDetail() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const [activity, setActivity] = createSignal<StudentActivityItem | null>(null);
    const [student, setStudent] = createSignal<StudentMasterItem | null>(null);
    const [individual, setIndividual] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [detailCourses, setDetailCourses] = createSignal<DetailActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isPrintingKRS, setIsPrintingKRS] = createSignal(false);
    const [isPrintingKHS, setIsPrintingKHS] = createSignal(false);

    const isValidId = (id?: string | null): id is string => {
        if (!id) return false;
        const trimmed = id.trim();
        return (
            trimmed !== '' &&
            trimmed !== '[id]' &&
            trimmed !== ':id' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    const resolveInstitutionId = () => {
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const instIdx = parts.indexOf('institution');
        if (instIdx !== -1 && parts[instIdx + 1] && isValidId(parts[instIdx + 1])) {
            return parts[instIdx + 1].trim();
        }
        return resolvedInstitutionId() || '';
    };

    const institutionId = () => resolvedInstitutionId() || resolveInstitutionId();

    const resolveActivityId = (): string => {
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const actIdx = parts.indexOf('student-activity');
        if (actIdx !== -1 && parts[actIdx + 1] && isValidId(parts[actIdx + 1])) {
            return parts[actIdx + 1].trim();
        }
        const last = parts[parts.length - 1];
        if (isValidId(last) && last !== resolveInstitutionId()) {
            return last.trim();
        }
        if (isValidId(params.id)) {
            return params.id.trim();
        }
        const qId = (searchParams.id as string) || (searchParams.activity_id as string);
        if (isValidId(qId)) {
            return qId.trim();
        }
        return '';
    };

    // Ensure institution ID is resolved from staff role if not in path
    createEffect(async () => {
        let instId = resolvedInstitutionId();
        if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
            const preferred = resolveInstitutionId();
            instId = await resolveInstitutionFromStaffRole(preferred);
            if (instId) {
                setResolvedInstitutionId(instId);
            }
        }
    });

    const fetchActivityDetail = async () => {
        const activityId = resolveActivityId();
        if (!activityId) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            // 1. Fetch student activity and supporting datasets in parallel
            const [actRes, detailRes, coursesList, teachesRes, gradesRes] = await Promise.all([
                getStudentActivityById(activityId),
                listDetailActivities({
                    page: 1,
                    page_size: 100,
                    activity_id: activityId,
                }),
                listCourses(),
                listTeaches({ page: 1, page_size: 100 }),
                listGrades({ page: 1, page_size: 100 }),
            ]);

            if (actRes) {
                setActivity(actRes);

                // Fetch Student and Individual info if student_id is available
                if (actRes.student_id) {
                    try {
                        const std = await getStudentById(actRes.student_id);
                        if (std) {
                            setStudent(std);
                            if (std.individual_id) {
                                try {
                                    const indRes = await PersonMasterIndividualControllerShow(std.individual_id);
                                    if (indRes && indRes.data) {
                                        setIndividual(indRes.data);
                                    }
                                } catch {}
                            }
                        }
                    } catch (e) {
                        console.warn('Failed to load student details for activity:', e);
                    }
                }
            }

            const rawDetails = (detailRes.data || []).filter(
                (d) => d.activity_id === activityId || (actRes && d.activity_id === actRes.id)
            );
            const courses = coursesList || [];
            const teaches = teachesRes.data || [];
            const grades = gradesRes.data || [];

            // 2. Enrich detail activities with course, teach, lecturer, and grade details
            const enrichedDetails: DetailActivityItem[] = rawDetails.map((detail) => {
                const course = detail.course || courses.find((c: any) => c.id === detail.course_id);
                const teach = detail.teach || teaches.find((t: any) => t.id === detail.teach_id || t.course_id === detail.course_id);
                const grade = detail.grade || grades.find((g: any) => g.id === detail.grade_id);

                const cleanName = (val?: string) => {
                    if (!val || val.startsWith('DosenAktifitasPengajaran')) return '';
                    return val.trim();
                };

                const lecturerList: { code?: string; name: string }[] = detail.teach_lecturers && detail.teach_lecturers.length > 0
                    ? detail.teach_lecturers.map((tl: any) => ({
                        code: (tl.code || tl.lecturer_code || tl.lecturer?.code || '').trim(),
                        name: cleanName(tl.name || tl.lecturer_name || tl.lecturer?.name || (typeof tl === 'string' ? tl : '')),
                    })).filter((l: any) => l.name || l.code)
                    : (teach?.lecturer_name || detail.lecturer_name ? [{
                        code: (teach?.lecturer_code || detail.lecturer_code || '').trim(),
                        name: cleanName(teach?.lecturer_name || detail.lecturer_name || ''),
                    }] : []);

                const lecturerName = lecturerList.length > 0
                    ? lecturerList.map(l => (l.code && l.name ? `${l.code} - ${l.name}` : (l.name || l.code))).join(', ')
                    : '-';

                return {
                    ...detail,
                    course_code: course?.code || detail.course_code || '-',
                    course_name: course?.name || detail.name || detail.course_name || '-',
                    credit: detail.credit ?? course?.total_credit ?? course?.credit ?? 0,
                    lecturer_name: lecturerName,
                    lecturers: lecturerList,
                    grade_letter: grade?.alphabet_code || grade?.name || detail.grade_letter || '-',
                    grade_point: grade?.grade ?? detail.grade_point ?? null,
                };
            });

            setDetailCourses(enrichedDetails);
        } catch (err) {
            console.error('Error fetching student activity details:', err);
            toast.danger('Gagal memuat detail aktivitas semester mahasiswa.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchActivityDetail();
    });

    createEffect(() => {
        const actId = resolveActivityId();
        if (actId) {
            fetchActivityDetail();
        }
    });

    const handlePrintKRS = async () => {
        const act = activity();
        if (!act?.id) {
            toast.danger('ID aktivitas semester tidak ditemukan.');
            return;
        }

        setIsPrintingKRS(true);
        try {
            toast.info('Membuat berkas PDF KRS...');
            const blob = await printActivityPlan(act.id);
            if (blob) {
                const semName = (act.name || 'Semester').replace(/\s+/g, '_');
                openOrDownloadPdf(blob, `KRS_${semName}.pdf`, 'KRS (Kartu Rencana Studi)');
            } else {
                toast.danger('Gagal membuat dokumen KRS PDF.');
            }
        } catch (err) {
            console.error('Error printing KRS:', err);
            toast.danger('Terjadi kesalahan saat membuat KRS PDF.');
        } finally {
            setIsPrintingKRS(false);
        }
    };

    const handlePrintKHS = async () => {
        const act = activity();
        if (!act?.id) {
            toast.danger('ID aktivitas semester tidak ditemukan.');
            return;
        }

        setIsPrintingKHS(true);
        try {
            toast.info('Membuat berkas PDF KHS...');
            const blob = await printActivityResult(act.id);
            if (blob) {
                const semName = (act.name || 'Semester').replace(/\s+/g, '_');
                openOrDownloadPdf(blob, `KHS_${semName}.pdf`, 'KHS (Kartu Hasil Studi)');
            } else {
                toast.danger('Gagal membuat dokumen KHS PDF.');
            }
        } catch (err) {
            console.error('Error printing KHS:', err);
            toast.danger('Terjadi kesalahan saat membuat KHS PDF.');
        } finally {
            setIsPrintingKHS(false);
        }
    };

    const totalEnrolledSKS = () => {
        if (activity()?.total_credit != null && activity()!.total_credit > 0) {
            return activity()!.total_credit;
        }
        return detailCourses().reduce((acc, c) => acc + (c.credit || 0), 0);
    };

    const cumulativeSKS = () => {
        if (activity()?.grand_total_credit != null && activity()!.grand_total_credit > 0) {
            return activity()!.grand_total_credit;
        }
        return totalEnrolledSKS();
    };

    const calculatedIPS = () => {
        if (activity()?.cumulative_index != null) {
            return Number(activity()!.cumulative_index).toFixed(2);
        }
        if (detailCourses().length === 0) return '0.00';
        const totalPoints = detailCourses().reduce((acc, c) => acc + ((c.grade_point ?? 0) * (c.credit ?? 0)), 0);
        const totalCredits = totalEnrolledSKS();
        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    };

    const calculatedIPK = () => {
        if (activity()?.grand_cumulative_index != null) {
            return Number(activity()!.grand_cumulative_index).toFixed(2);
        }
        return calculatedIPS();
    };

    const studentDisplayName = () =>
        individual()?.individual?.name ||
        (individual() as any)?.name ||
        student()?.name ||
        (student() as any)?.individual?.name ||
        'Mahasiswa';

    const studentCode = () => student()?.code || '-';

    const getGradeBadgeClass = (grade?: string) => {
        if (!grade || grade === '-') {
            return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
        }
        const cleanGrade = grade.trim().toUpperCase();
        if (cleanGrade.startsWith('A')) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
        }
        if (cleanGrade.startsWith('B')) {
            return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300';
        }
        if (cleanGrade.startsWith('C')) {
            return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';
        }
        if (cleanGrade.startsWith('D')) {
            return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
        }
        if (cleanGrade.startsWith('E')) {
            return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
        }
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    };

    const backToStudentUrl = () => {
        const instId = institutionId();
        const stdId = activity()?.student_id || student()?.id;
        if (instId && stdId) {
            return `/rectorat/institution/${instId}/academic/student/master/student/${stdId}`;
        }
        if (instId) {
            return `/rectorat/institution/${instId}/academic/student/master/student`;
        }
        return `/rectorat/institution`;
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Breadcrumb Navigation */}
                <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                    <A href={institutionId() ? `/rectorat/institution/${institutionId()}` : '/rectorat/institution'} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Rektorat
                    </A>
                    <span>/</span>
                    <A href={institutionId() ? `/rectorat/institution/${institutionId()}/academic/student/master/student` : '#'} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Mahasiswa
                    </A>
                    <span>/</span>
                    <Show when={activity()?.student_id || student()?.id}>
                        <A href={backToStudentUrl()} class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate max-w-48">
                            {studentDisplayName()}
                        </A>
                        <span>/</span>
                    </Show>
                    <span class="text-neutral-900 dark:text-white font-bold">Aktivitas Semester</span>
                </nav>

                {/* Header Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <div class="space-y-1.5">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold border border-indigo-200 dark:border-indigo-800/80">
                                    <span class="size-1.5 rounded-xs bg-indigo-500"></span>
                                    <span>Aktivitas Perkuliahan Mahasiswa</span>
                                </span>
                                <Show when={activity()?.status_name}>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                        {activity()!.status_name}
                                    </span>
                                </Show>
                                <Show when={activity()?.is_lock}>
                                    <span class="inline-flex items-center px-2 py-0.5 rounded-xs text-[11px] font-mono text-neutral-500 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-700">
                                        Terkunci
                                    </span>
                                </Show>
                            </div>

                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                {activity()?.academic_year?.name || activity()?.academic_year_name || activity()?.name || activity()?.semester_name || 'Detail Aktivitas Semester'}
                            </h1>

                            <div class="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 flex-wrap">
                                <span class="font-bold text-neutral-800 dark:text-neutral-200">{studentDisplayName()}</span>
                                <span>•</span>
                                <span class="font-mono">NIM: {studentCode()}</span>
                                <Show when={student()?.unit_name || (student() as any)?.unit?.name}>
                                    <span>•</span>
                                    <span>{student()?.unit_name || (student() as any)?.unit?.name}</span>
                                </Show>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div class="flex flex-wrap items-center gap-2.5">
                            <A
                                href={backToStudentUrl()}
                                class="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-xs text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                            >
                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="19" y1="12" x2="5" y2="12" />
                                    <polyline points="12 19 5 12 12 5" />
                                </svg>
                                <span>Profil Mahasiswa</span>
                            </A>

                            <button
                                type="button"
                                onClick={handlePrintKRS}
                                disabled={isPrintingKRS()}
                                class="px-3.5 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-xs text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cetak Kartu Rencana Studi (KRS)"
                            >
                                <Show
                                    when={!isPrintingKRS()}
                                    fallback={<div class="size-3.5 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>}
                                >
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                                </Show>
                                <span>{isPrintingKRS() ? 'Mencetak...' : 'Cetak KRS'}</span>
                            </button>

                            <button
                                type="button"
                                onClick={handlePrintKHS}
                                disabled={isPrintingKHS()}
                                class="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-xs text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Cetak Kartu Hasil Studi (KHS)"
                            >
                                <Show
                                    when={!isPrintingKHS()}
                                    fallback={<div class="size-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>}
                                >
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                </Show>
                                <span>{isPrintingKHS() ? 'Mencetak...' : 'Cetak KHS'}</span>
                            </button>
                        </div>
                    </div>

                    {/* KPI Metrics Grid */}
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700/60">
                        <div class="p-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Mata Kuliah</span>
                            <span class="text-xl font-black text-neutral-900 dark:text-white">{detailCourses().length} Kelas</span>
                        </div>
                        <div class="p-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">SKS Semester</span>
                            <span class="text-xl font-black text-blue-600 dark:text-blue-400">{totalEnrolledSKS()} SKS</span>
                        </div>
                        <div class="p-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">SKS Kumulatif</span>
                            <span class="text-xl font-black text-teal-600 dark:text-teal-400">{cumulativeSKS()} SKS</span>
                        </div>
                        <div class="p-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Indeks Prestasi (IPS)</span>
                            <span class="text-xl font-black text-indigo-600 dark:text-indigo-400">{calculatedIPS()}</span>
                        </div>
                        <div class="p-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">IPK Kumulatif</span>
                            <span class="text-xl font-black text-sky-600 dark:text-sky-400">{calculatedIPK()}</span>
                        </div>
                        <div class="p-3.5 rounded-xs bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Status</span>
                            <span class="text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate block mt-1">
                                {activity()?.status_name || 'Aktif / Selesai'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Enrolled Courses Table Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                            <h2 class="text-sm font-bold text-neutral-900 dark:text-white">
                                Daftar Mata Kuliah & Hasil Studi
                            </h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                Rekapitulasi Rencana Studi (KRS) dan Nilai Evaluasi Pembelajaran (KHS) mahasiswa pada semester ini.
                            </p>
                        </div>
                        <span class="text-xs text-neutral-400 font-mono">
                            Total {detailCourses().length} Mata Kuliah
                        </span>
                    </div>

                    <Show when={!isLoading()} fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-xs font-mono">Memuat daftar mata kuliah...</p>
                        </div>
                    }>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3 px-4 text-start">No</th>
                                        <th class="py-3 px-4 text-start">Kode MK</th>
                                        <th class="py-3 px-4 text-start">Nama Mata Kuliah</th>
                                        <th class="py-3 px-4 text-center">SKS</th>
                                        <th class="py-3 px-4 text-start">Dosen Pengajar</th>
                                        <th class="py-3 px-4 text-center">Nilai Angka</th>
                                        <th class="py-3 px-4 text-center">Nilai Huruf</th>
                                        <th class="py-3 px-4 text-center">Bobot / Indeks</th>
                                        <th class="py-3 px-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={detailCourses()} fallback={
                                        <tr>
                                            <td colspan="9" class="py-12 text-center text-neutral-400 font-mono">
                                                Tidak ada mata kuliah yang terdaftar pada aktivitas semester ini.
                                            </td>
                                        </tr>
                                    }>
                                        {(c, idx) => (
                                            <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                <td class="py-3 px-4 font-mono text-neutral-400">{idx() + 1}</td>
                                                <td class="py-3 px-4 font-mono font-semibold text-neutral-800 dark:text-neutral-200">
                                                    {c.course_code || '-'}
                                                </td>
                                                <td class="py-3 px-4 font-medium text-neutral-900 dark:text-white">
                                                    {c.course_name || '-'}
                                                </td>
                                                <td class="py-3 px-4 text-center font-mono font-bold text-neutral-700 dark:text-neutral-300">
                                                    {c.credit ?? 0}
                                                </td>
                                                <td class="py-3 px-4 text-neutral-700 dark:text-neutral-300">
                                                    <Show
                                                        when={c.lecturers && c.lecturers.length > 0}
                                                        fallback={<span>{c.lecturer_name || '-'}</span>}
                                                    >
                                                        <div class="flex flex-col gap-1">
                                                            <For each={c.lecturers}>
                                                                {(lecturer: any) => (
                                                                    <span class="inline-flex items-center gap-1.5 leading-snug">
                                                                        <span class="size-1 rounded-xs bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                                                                        <span>
                                                                            {lecturer.code ? (
                                                                                <span class="font-mono text-blue-600 dark:text-blue-400 me-1">{lecturer.code} -</span>
                                                                            ) : null}
                                                                            <span>{lecturer.name || lecturer}</span>
                                                                        </span>
                                                                    </span>
                                                                )}
                                                            </For>
                                                        </div>
                                                    </Show>
                                                </td>
                                                <td class="py-3 px-4 text-center font-mono font-medium text-neutral-600 dark:text-neutral-400">
                                                    {c.mark != null && c.mark > 0 ? Number(c.mark).toFixed(2) : '-'}
                                                </td>
                                                <td class="py-3 px-4 text-center">
                                                    <span class={`inline-block px-2.5 py-0.5 rounded-xs font-mono font-bold text-xs ${getGradeBadgeClass(c.grade_letter)}`}>
                                                        {c.grade_letter || '-'}
                                                    </span>
                                                </td>
                                                <td class="py-3 px-4 text-center font-mono font-bold text-neutral-700 dark:text-neutral-300">
                                                    {c.grade_point != null ? Number(c.grade_point).toFixed(2) : '-'}
                                                </td>
                                                <td class="py-3 px-4 text-center">
                                                    <Show
                                                        when={c.grade_letter && c.grade_letter !== '-' && !c.grade_letter.toUpperCase().startsWith('E')}
                                                        fallback={
                                                            <span class="inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-500 dark:text-neutral-400">
                                                                {c.grade_letter?.toUpperCase().startsWith('E') ? 'Tidak Lulus' : 'Belum Ada Nilai'}
                                                            </span>
                                                        }
                                                    >
                                                        <span class="inline-block px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                                            Lulus
                                                        </span>
                                                    </Show>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
