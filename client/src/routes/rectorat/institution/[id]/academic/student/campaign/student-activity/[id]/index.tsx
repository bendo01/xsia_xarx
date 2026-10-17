import { createSignal, createEffect, createMemo, For, Show, lazy, Suspense } from 'solid-js';
import { useParams, useSearchParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    getStudentActivityById,
    listStudentActivities,
    printActivityPlan,
    printActivityResult,
    type StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import type { DetailActivityItem } from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import { AcademicCourseReferenceControllerVarietyIndex } from '~/controllers/academic/course/reference/AcademicCourseReferenceVarietyController';
import type { AcademicCourseReferenceVariety } from '~/models/academic/course/reference/Variety';
import type { AcademicTrendPoint } from '~/components/chart/academic_performance_chart';
import StudentCreditChart from '~/components/chart/student_credit_chart';
import SemesterGradeChart, { type SemesterGradePoint } from '~/components/chart/semester_grade_chart';
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

const AcademicPerformanceChart = lazy(() => import('~/components/chart/academic_performance_chart'));

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

    // Whole study history of the student, for the charts
    const [studentActivities, setStudentActivities] = createSignal<StudentActivityItem[]>([]);
    const [studentDetails, setStudentDetails] = createSignal<DetailActivityItem[]>([]);
    const [courseVarieties, setCourseVarieties] = createSignal<AcademicCourseReferenceVariety[]>([]);
    const [isHistoryLoading, setIsHistoryLoading] = createSignal(false);
    const [hoveredVarietyIdx, setHoveredVarietyIdx] = createSignal<number | null>(null);

    let lastFetchedActivityId = '';
    let isFetching = false;
    let historyStudentId = '';

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

    // Loads every semester of the student with its courses; runs in the background so the course table is not held up
    const loadStudentHistory = async (studentId: string) => {
        if (historyStudentId === studentId) return;
        historyStudentId = studentId;
        setIsHistoryLoading(true);
        try {
            const [actRes, varietiesRes] = await Promise.all([
                listStudentActivities({ student_id: studentId, page: 1, page_size: 100 }),
                AcademicCourseReferenceControllerVarietyIndex({ page: 1, per_page: 100 }).catch(() => ({ data: [] })),
            ]);
            const activities = actRes.data || [];
            // The show endpoint embeds each semester's courses with grade and course variety,
            // and unlike detail-activities it is readable by rectorate roles
            const semesterResults = await Promise.all(activities.map((act) => getStudentActivityById(act.id)));
            if (historyStudentId !== studentId) return;
            setStudentActivities(activities);
            setCourseVarieties(Array.isArray(varietiesRes.data) ? varietiesRes.data : []);
            setStudentDetails(
                semesterResults.flatMap((act) =>
                    (act?.detail_activities || []).map((d: DetailActivityItem) => ({ ...d, activity_id: d.activity_id || act!.id }))
                )
            );
        } catch (err) {
            console.error('Error loading student study history:', err);
        } finally {
            if (historyStudentId === studentId) setIsHistoryLoading(false);
        }
    };

    const fetchActivityDetail = async (targetId?: string) => {
        const activityId = targetId || resolveActivityId();
        if (!activityId) {
            setIsLoading(false);
            return;
        }

        if (isFetching && lastFetchedActivityId === activityId) {
            return;
        }

        lastFetchedActivityId = activityId;
        isFetching = true;
        setIsLoading(true);
        try {
            // getStudentActivityById already embeds student, unit_activity, status, unit, finance,
            // and detail_activities with courses, teaches, lecturers, and grades
            const actRes = await getStudentActivityById(activityId);

            if (actRes) {
                setActivity(actRes);
                if (actRes.student_id) {
                    void loadStudentHistory(actRes.student_id);
                }

                // Student info is already embedded in actRes.student
                if (actRes.student) {
                    setStudent(actRes.student);
                } else if (actRes.student_id) {
                    try {
                        const std = await getStudentById(actRes.student_id);
                        if (std) setStudent(std);
                    } catch (e) {
                        console.warn('Failed to load student details for activity:', e);
                    }
                }
            }

            const rawDetails: any[] = actRes?.detail_activities || [];

            const cleanName = (val?: string) => {
                if (!val || val.startsWith('DosenAktifitasPengajaran')) return '';
                return val.trim();
            };

            // Enrich detail activities with embedded course, teach, lecturer, and grade details
            const enrichedDetails: DetailActivityItem[] = rawDetails.map((detail) => {
                const course = detail.course || detail.teach?.course;
                const teach = detail.teach;
                const grade = detail.grade;

                const rawLecturers = (detail.teach_lecturers && detail.teach_lecturers.length > 0)
                    ? detail.teach_lecturers
                    : (teach?.teach_lecturers && teach.teach_lecturers.length > 0)
                        ? teach.teach_lecturers
                        : null;

                const lecturerList: { code?: string; name: string }[] = rawLecturers
                    ? rawLecturers.map((tl: any) => ({
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
            isFetching = false;
            setIsLoading(false);
        }
    };

    createEffect(() => {
        const actId = resolveActivityId();
        if (actId && actId !== lastFetchedActivityId) {
            fetchActivityDetail(actId);
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

    // --- Chart data ---
    const detailCredit = (d: DetailActivityItem) =>
        Number(d.credit ?? d.course?.total_credit ?? d.course?.credit ?? 0) || 0;

    const detailGradePoint = (d: DetailActivityItem): number | null => {
        const gp = d.grade_point != null ? Number(d.grade_point) : (d.grade?.grade != null ? Number(d.grade.grade) : null);
        return gp != null && !isNaN(gp) ? gp : null;
    };

    // Chronological order, e.g. "2024 / 1" -> "2024 / 2" -> "2025 / 1"
    const chronologicalActivities = createMemo(() => {
        const label = (a: StudentActivityItem) => a.academic_year?.name || a.name || '';
        return [...studentActivities()].sort((a, b) => {
            const matchA = label(a).match(/(\d{4})\s*[/-]?\s*(\d+)/);
            const matchB = label(b).match(/(\d{4})\s*[/-]?\s*(\d+)/);
            if (matchA && matchB) {
                const yearDiff = parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
                return yearDiff !== 0 ? yearDiff : parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
            }
            if (a.created_at && b.created_at) {
                return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            }
            return label(a).localeCompare(label(b));
        });
    });

    // IPS and SKS per semester from its courses, IPK as the running credit-weighted average
    const trendData = createMemo((): AcademicTrendPoint[] => {
        const perActivity = new Map<string, { credits: number; graded: number; weighted: number }>();
        for (const d of studentDetails()) {
            if (!d.activity_id) continue;
            const entry = perActivity.get(d.activity_id) || { credits: 0, graded: 0, weighted: 0 };
            const cred = detailCredit(d);
            const gp = detailGradePoint(d);
            entry.credits += cred;
            if (gp != null) {
                entry.graded += cred;
                entry.weighted += gp * cred;
            }
            perActivity.set(d.activity_id, entry);
        }

        let runningCredits = 0;
        let runningGraded = 0;
        let runningWeighted = 0;

        // A semester without courses yet (e.g. just opened) would plot as IPS 0 and drag the lines down
        const withCourses = chronologicalActivities().filter((act) => perActivity.has(act.id) || (act.total_credit || 0) > 0);

        return withCourses.map((act, idx) => {
            const entry = perActivity.get(act.id);
            const sks = entry && entry.credits > 0 ? entry.credits : (act.total_credit || 0);
            const ips = entry && entry.graded > 0 ? entry.weighted / entry.graded : (act.cumulative_index || 0);
            const graded = entry && entry.graded > 0 ? entry.graded : sks;
            const weighted = entry && entry.graded > 0 ? entry.weighted : ips * graded;

            runningCredits += sks;
            runningGraded += graded;
            runningWeighted += weighted;

            return {
                semName: act.academic_year?.name || act.name || `Sem ${idx + 1}`,
                ips: Number(ips.toFixed(2)),
                ipk: Number((runningGraded > 0 ? runningWeighted / runningGraded : ips).toFixed(2)),
                sks,
                totalSks: runningCredits,
            };
        });
    });

    // This semester's courses grouped by grade letter, best grade first
    const gradeDistribution = createMemo((): SemesterGradePoint[] => {
        const groups = new Map<string, SemesterGradePoint & { point: number }>();
        for (const c of detailCourses()) {
            const letter = (c.grade_letter && c.grade_letter !== '-') ? c.grade_letter.trim() : 'Belum Dinilai';
            const entry = groups.get(letter) || { grade: letter, courseCount: 0, credits: 0, point: -1 };
            entry.courseCount += 1;
            entry.credits += detailCredit(c);
            entry.point = Math.max(entry.point, detailGradePoint(c) ?? -1);
            groups.set(letter, entry);
        }
        return Array.from(groups.values())
            .sort((a, b) => b.point - a.point || a.grade.localeCompare(b.grade))
            .map(({ grade, courseCount, credits }) => ({ grade, courseCount, credits }));
    });

    // --- Course variety donut (all semesters) ---
    const varietyPalette = [
        '#6366f1', // Indigo
        '#10b981', // Emerald
        '#f59e0b', // Amber
        '#06b6d4', // Cyan
        '#ec4899', // Pink
        '#8b5cf6', // Purple
        '#3b82f6', // Blue
        '#14b8a6', // Teal
        '#f97316', // Orange
    ];

    const varietyScopeData = createMemo(() => {
        const map = new Map<string, {
            varietyName: string;
            courseCount: number;
            totalCredits: number;
            gradedCredits: number;
            weightedGradeSum: number;
        }>();

        for (const v of courseVarieties()) {
            if (v.id) {
                map.set(v.id, { varietyName: v.name, courseCount: 0, totalCredits: 0, gradedCredits: 0, weightedGradeSum: 0 });
            }
        }
        const fallbackKey = 'other';
        map.set(fallbackKey, { varietyName: 'Mata Kuliah Umum / Lainnya', courseCount: 0, totalCredits: 0, gradedCredits: 0, weightedGradeSum: 0 });

        for (const d of studentDetails()) {
            const entry = map.get(d.course?.variety_id || fallbackKey) || map.get(fallbackKey)!;
            const cred = detailCredit(d);
            const gp = detailGradePoint(d);
            entry.courseCount += 1;
            entry.totalCredits += cred;
            if (gp != null) {
                entry.gradedCredits += cred;
                entry.weightedGradeSum += gp * cred;
            }
        }

        const activeGroups = Array.from(map.values()).filter((g) => g.courseCount > 0);
        const totalAllCredits = activeGroups.reduce((acc, g) => acc + (g.totalCredits || g.courseCount), 0) || 1;

        let currentAngle = -Math.PI / 2;
        return activeGroups.map((g, idx) => {
            const share = (g.totalCredits || g.courseCount) / totalAllCredits;
            const startAngle = currentAngle;
            const endAngle = currentAngle + share * 2 * Math.PI;
            currentAngle = endAngle;
            return {
                ...g,
                color: varietyPalette[idx % varietyPalette.length],
                cumulativeIndex: g.gradedCredits > 0 ? g.weightedGradeSum / g.gradedCredits : 0,
                percent: Math.round(share * 100),
                startAngle,
                endAngle,
            };
        });
    });

    // IPK over every course the student has taken, shown in the donut center
    const overallIPK = () => {
        const groups = varietyScopeData();
        const graded = groups.reduce((acc, g) => acc + g.gradedCredits, 0);
        return graded > 0 ? (groups.reduce((acc, g) => acc + g.weightedGradeSum, 0) / graded).toFixed(2) : calculatedIPK();
    };

    function describeDonutSlice(cx: number, cy: number, innerR: number, outerR: number, startAngle: number, endAngle: number): string {
        const eps = 0.0001;
        const actualEnd = endAngle - startAngle >= 2 * Math.PI - eps ? startAngle + 2 * Math.PI - eps : endAngle;

        const x1 = cx + outerR * Math.cos(startAngle);
        const y1 = cy + outerR * Math.sin(startAngle);
        const x2 = cx + outerR * Math.cos(actualEnd);
        const y2 = cy + outerR * Math.sin(actualEnd);
        const x3 = cx + innerR * Math.cos(actualEnd);
        const y3 = cy + innerR * Math.sin(actualEnd);
        const x4 = cx + innerR * Math.cos(startAngle);
        const y4 = cy + innerR * Math.sin(startAngle);
        const largeArc = actualEnd - startAngle > Math.PI ? 1 : 0;

        return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} L ${x3.toFixed(2)} ${y3.toFixed(2)} A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4.toFixed(2)} ${y4.toFixed(2)} Z`;
    }

    const studentDisplayName = () =>
        activity()?.student_name ||
        student()?.name ||
        (student() as any)?.individual?.name ||
        individual()?.individual?.name ||
        (individual() as any)?.name ||
        'Mahasiswa';

    const studentCode = () => activity()?.student_code || student()?.code || '-';

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
                                <Show when={student()?.unit_name || (student() as any)?.unit?.name || activity()?.unit_name || (activity() as any)?.unit?.name}>
                                    <span>•</span>
                                    <span>{student()?.unit_name || (student() as any)?.unit?.name || activity()?.unit_name || (activity() as any)?.unit?.name}</span>
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

                {/* Academic Analytics Charts */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Chart 1: IPK & IPS trend over the student's semesters */}
                    <div class="min-w-0 p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2">
                                    <div class="size-7 rounded-xs bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                                    </div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Tren Indeks Prestasi
                                    </h3>
                                </div>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                    IPS semester dan IPK kumulatif per tahun akademik (skala 0.0 - 4.0).
                                </p>
                            </div>
                            <div class="flex items-center gap-3 text-[11px] font-mono shrink-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="size-2.5 rounded-xs bg-blue-600"></span>
                                    <span class="text-neutral-700 dark:text-neutral-300 font-semibold">IPK</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="size-2.5 rounded-xs bg-sky-500"></span>
                                    <span class="text-neutral-700 dark:text-neutral-300 font-semibold">IPS</span>
                                </div>
                            </div>
                        </div>

                        <Show when={!isHistoryLoading()} fallback={
                            <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                                <div class="size-6 border-2 border-blue-600 border-t-transparent rounded-xs animate-spin"></div>
                                <span class="text-xs font-mono text-neutral-400">Memuat grafik...</span>
                            </div>
                        }>
                            <Show when={trendData().length > 0} fallback={
                                <div class="py-16 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                    <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
                                    <span>Belum ada riwayat semester untuk ditampilkan.</span>
                                </div>
                            }>
                                <Suspense fallback={
                                    <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                                        <div class="size-6 border-2 border-blue-600 border-t-transparent rounded-xs animate-spin"></div>
                                        <span class="text-xs font-mono text-neutral-400">Memuat grafik...</span>
                                    </div>
                                }>
                                    <AcademicPerformanceChart data={trendData()} />
                                </Suspense>
                            </Show>
                        </Show>
                    </div>

                    {/* Chart 2: SKS load per semester and cumulative */}
                    <div class="min-w-0 p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2">
                                    <div class="size-7 rounded-xs bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                                    </div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Progres Beban Kredit SKS
                                    </h3>
                                </div>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                    Akumulasi SKS kumulatif dan SKS diambil per semester.
                                </p>
                            </div>
                            <div class="flex items-center gap-3 text-[11px] font-mono shrink-0">
                                <div class="flex items-center gap-1.5">
                                    <span class="size-2.5 rounded-xs bg-teal-600"></span>
                                    <span class="text-neutral-700 dark:text-neutral-300 font-semibold">SKS Kumulatif</span>
                                </div>
                                <div class="flex items-center gap-1.5">
                                    <span class="size-2.5 rounded-xs bg-amber-500"></span>
                                    <span class="text-neutral-700 dark:text-neutral-300 font-semibold">SKS Semester</span>
                                </div>
                            </div>
                        </div>

                        <Show when={!isHistoryLoading()} fallback={
                            <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                                <div class="size-6 border-2 border-blue-600 border-t-transparent rounded-xs animate-spin"></div>
                                <span class="text-xs font-mono text-neutral-400">Memuat grafik...</span>
                            </div>
                        }>
                            <Show when={trendData().length > 0} fallback={
                                <div class="py-16 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                    <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 20V10"/><path d="M18 20V4"/><path d="M6 20v-4"/></svg>
                                    <span>Belum ada riwayat SKS untuk ditampilkan.</span>
                                </div>
                            }>
                                <StudentCreditChart data={trendData()} />
                            </Show>
                        </Show>
                    </div>

                    {/* Chart 3: Course variety donut over every semester */}
                    <div class="min-w-0 p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2">
                                    <div class="size-7 rounded-xs bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                                    </div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Jenis Mata Kuliah & IPK
                                    </h3>
                                </div>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                    Sebaran SKS dan IPK per jenis mata kuliah, seluruh semester.
                                </p>
                            </div>
                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-mono shrink-0">
                                {varietyScopeData().length} Jenis
                            </span>
                        </div>

                        <Show when={!isHistoryLoading()} fallback={
                            <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                                <div class="size-6 border-2 border-emerald-600 border-t-transparent rounded-xs animate-spin"></div>
                                <span class="text-xs font-mono text-neutral-400">Memuat grafik...</span>
                            </div>
                        }>
                            <Show when={varietyScopeData().length > 0} fallback={
                                <div class="py-16 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                    <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>
                                    <span>Belum ada data mata kuliah yang diambil.</span>
                                </div>
                            }>
                                <div class="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                                    {/* Donut Chart SVG */}
                                    <div class="sm:col-span-5 flex items-center justify-center">
                                        <svg viewBox="0 0 220 220" class="size-44 max-w-full">
                                            <For each={varietyScopeData()}>
                                                {(slice, idx) => (
                                                    <path
                                                        d={describeDonutSlice(110, 110, 56, hoveredVarietyIdx() === idx() ? 92 : 86, slice.startAngle, slice.endAngle)}
                                                        fill={slice.color}
                                                        class="transition-all duration-200 cursor-pointer hover:opacity-90"
                                                        stroke="currentColor"
                                                        stroke-width="1.5"
                                                        stroke-opacity="0.1"
                                                        onPointerEnter={() => setHoveredVarietyIdx(idx())}
                                                        onPointerLeave={() => setHoveredVarietyIdx(null)}
                                                    />
                                                )}
                                            </For>
                                            <g pointer-events="none">
                                                <text x="110" y="104" text-anchor="middle" class="font-mono font-extrabold text-base fill-neutral-900 dark:fill-white">
                                                    {hoveredVarietyIdx() !== null
                                                        ? varietyScopeData()[hoveredVarietyIdx()!]?.cumulativeIndex.toFixed(2)
                                                        : overallIPK()}
                                                </text>
                                                <text x="110" y="122" text-anchor="middle" class="font-mono uppercase text-[9px] fill-neutral-400 tracking-wider">
                                                    {hoveredVarietyIdx() !== null ? 'IPK Jenis' : 'IPK Total'}
                                                </text>
                                            </g>
                                        </svg>
                                    </div>

                                    {/* Legend & Breakdown List */}
                                    <div class="sm:col-span-7 space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                                        <For each={varietyScopeData()}>
                                            {(slice, idx) => (
                                                <div
                                                    onPointerEnter={() => setHoveredVarietyIdx(idx())}
                                                    onPointerLeave={() => setHoveredVarietyIdx(null)}
                                                    class={`p-2 rounded-xs border transition-all cursor-pointer ${
                                                        hoveredVarietyIdx() === idx()
                                                            ? 'bg-neutral-100 dark:bg-neutral-700/60 border-neutral-300 dark:border-neutral-600 shadow-2xs'
                                                            : 'bg-neutral-50 dark:bg-neutral-900/50 border-neutral-200/60 dark:border-neutral-700/60'
                                                    }`}
                                                >
                                                    <div class="flex items-center justify-between gap-2">
                                                        <div class="flex items-center gap-2 min-w-0">
                                                            <span class="size-2.5 rounded-xs shrink-0" style={{ "background-color": slice.color }}></span>
                                                            <span class="font-bold text-neutral-800 dark:text-neutral-200 truncate">
                                                                {slice.varietyName}
                                                            </span>
                                                        </div>
                                                        <span class="font-mono font-extrabold text-blue-600 dark:text-blue-400 shrink-0">
                                                            IPK {slice.cumulativeIndex.toFixed(2)}
                                                        </span>
                                                    </div>
                                                    <div class="flex items-center justify-between text-[10px] text-neutral-400 font-mono mt-1 pl-4.5">
                                                        <span>{slice.courseCount} MK • {slice.totalCredits} SKS</span>
                                                        <span class="font-semibold text-neutral-500 dark:text-neutral-400">{slice.percent}%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </Show>
                        </Show>
                    </div>

                    {/* Chart 4: Grade distribution of this semester */}
                    <div class="min-w-0 p-5 rounded-xs bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between space-y-4">
                        <div class="flex items-start justify-between gap-3">
                            <div>
                                <div class="flex items-center gap-2">
                                    <div class="size-7 rounded-xs bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>
                                    </div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Sebaran Nilai Semester Ini
                                    </h3>
                                </div>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">
                                    Jumlah mata kuliah dan SKS per nilai huruf pada {activity()?.academic_year_name || activity()?.academic_year?.name || 'semester ini'}.
                                </p>
                            </div>
                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono shrink-0">
                                IPS {calculatedIPS()}
                            </span>
                        </div>

                        <Show when={!isLoading()} fallback={
                            <div class="py-16 text-center flex flex-col items-center justify-center gap-2">
                                <div class="size-6 border-2 border-indigo-600 border-t-transparent rounded-xs animate-spin"></div>
                                <span class="text-xs font-mono text-neutral-400">Memuat grafik...</span>
                            </div>
                        }>
                            <Show when={gradeDistribution().length > 0} fallback={
                                <div class="py-16 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                    <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="12" width="4" height="9"/><rect x="10" y="7" width="4" height="14"/><rect x="17" y="3" width="4" height="18"/></svg>
                                    <span>Belum ada mata kuliah pada semester ini.</span>
                                </div>
                            }>
                                <SemesterGradeChart data={gradeDistribution()} />
                            </Show>
                        </Show>
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
                        {/* Desktop Table View */}
                        <div class="hidden md:block overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3 px-4 text-start">No</th>
                                        {/* <th class="py-3 px-4 text-start">Teach ID</th> */}
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
                                                {/* <td class="py-3 px-4 font-mono text-neutral-400">{c.teach_id}</td> */}
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

                        {/* Mobile Card List View */}
                        <div class="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <For each={detailCourses()} fallback={
                                <div class="py-12 px-4 text-center text-neutral-400 font-mono text-xs">
                                    Tidak ada mata kuliah yang terdaftar pada aktivitas semester ini.
                                </div>
                            }>
                                {(c, idx) => (
                                    <div class="p-4 flex flex-col gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors">
                                        {/* Header Row: Index + Course Code + SKS Chip + Status Badge */}
                                        <div class="flex items-center justify-between gap-2 flex-wrap">
                                            <div class="flex items-center gap-1.5 flex-wrap">
                                                <span class="px-1.5 py-0.5 rounded-xs bg-neutral-100 dark:bg-neutral-700 font-mono text-neutral-500 dark:text-neutral-400 text-[10px] font-bold">
                                                    #{idx() + 1}
                                                </span>
                                                <span class="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                                    {c.course_code || '-'}
                                                </span>
                                                <span class="px-2 py-0.5 rounded-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-mono text-[10px] font-bold">
                                                    {c.credit ?? 0} SKS
                                                </span>
                                            </div>

                                            <div>
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
                                            </div>
                                        </div>

                                        {/* Course Name */}
                                        <div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                                                {c.course_name || '-'}
                                            </h3>
                                            {/* TODO 
                                            <Show when={c.teach_id}>
                                                <p class="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 mt-0.5 truncate">
                                                    Teach ID: {c.teach_id}
                                                </p>
                                            </Show>
                                            */}
                                        </div>

                                        {/* Lecturer */}
                                        <div class="text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-1.5">
                                            <span class="text-neutral-400 dark:text-neutral-500 shrink-0 font-medium text-[11px]">Dosen:</span>
                                            <div class="flex-1 text-[11px]">
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
                                            </div>
                                        </div>

                                        {/* Academic Performance KPI Grid */}
                                        <div class="grid grid-cols-3 gap-2 pt-2 mt-0.5 border-t border-neutral-100 dark:border-neutral-700/40 text-center">
                                            <div class="p-2 rounded-xs bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">Nilai Angka</span>
                                                <span class="font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200">
                                                    {c.mark != null && c.mark > 0 ? Number(c.mark).toFixed(2) : '-'}
                                                </span>
                                            </div>

                                            <div class="p-2 rounded-xs bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">Nilai Huruf</span>
                                                <span class={`inline-block px-2.5 py-0.5 rounded-xs font-mono font-bold text-xs ${getGradeBadgeClass(c.grade_letter)}`}>
                                                    {c.grade_letter || '-'}
                                                </span>
                                            </div>

                                            <div class="p-2 rounded-xs bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">Bobot / Indeks</span>
                                                <span class="font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200">
                                                    {c.grade_point != null ? Number(c.grade_point).toFixed(2) : '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
