import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { t } from '~/i18n';
import {
    getStudentActivityById,
    printActivityPlan,
    printActivityResult,
    StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import {
    listDetailActivities,
    deleteDetailActivity,
    DetailActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import {
    listCourses,
    listTeaches
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import { listGrades } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';

export default function StudentCampaignActivityShowPage() {
    const [searchParams] = useSearchParams();
    const [activity, setActivity] = createSignal<StudentActivityItem | null>(null);
    const [detailCourses, setDetailCourses] = createSignal<DetailActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isDropping, setIsDropping] = createSignal<string | null>(null);

    const fetchActivityDetail = async () => {
        setIsLoading(true);
        try {
            const activityId = (searchParams.id as string) || '';
            if (!activityId) {
                setActivity(null);
                setDetailCourses([]);
                setIsLoading(false);
                return;
            }

            // 1. Fetch student activity, detail activities, courses, teaches, and grades directly from server
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
            }

            const rawDetails = (detailRes.data || []).filter(
                (d) => d.activity_id === activityId || (actRes && d.activity_id === actRes.id)
            );
            const courses = coursesList || [];
            const teaches = teachesRes.data || [];
            const grades = gradesRes.data || [];

            // 2. Enrich detail activities with server relation entities (or fallbacks)
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
            console.error('Error fetching activity details:', err);
            toast.danger('Failed to load semester course details from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchActivityDetail();
    });

    createEffect(() => {
        const idFromQuery = searchParams.id as string;
        if (idFromQuery) {
            fetchActivityDetail();
        }
    });

    const handleDropCourse = async (courseId: string, courseName: string) => {
        if (!confirm(`Are you sure you want to drop "${courseName}" from your study plan?`)) return;

        setIsDropping(courseId);
        try {
            const res = await deleteDetailActivity(courseId);
            if (!res.is_error) {
                toast.success(`Dropped ${courseName} from your KRS.`);
                await fetchActivityDetail();
            } else {
                toast.danger(res.message || 'Failed to drop course.');
            }
        } catch (err) {
            toast.danger('Failed to drop course.');
        } finally {
            setIsDropping(null);
        }
    };

    const [isPrintingKRS, setIsPrintingKRS] = createSignal(false);
    const [isPrintingKHS, setIsPrintingKHS] = createSignal(false);

    const handlePrintKRS = async () => {
        const id = activity()?.id;
        if (!id) {
            toast.danger('Activity ID is missing.');
            return;
        }

        setIsPrintingKRS(true);
        try {
            toast.info('Generating KRS (Study Plan Card) PDF...');
            const blob = await printActivityPlan(id);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                toast.success('KRS PDF opened successfully.');
            } else {
                toast.danger('Failed to generate KRS PDF.');
            }
        } catch (err) {
            console.error('Error printing KRS:', err);
            toast.danger('An error occurred while generating KRS PDF.');
        } finally {
            setIsPrintingKRS(false);
        }
    };

    const handlePrintKHS = async () => {
        const id = activity()?.id;
        if (!id) {
            toast.danger('Activity ID is missing.');
            return;
        }

        setIsPrintingKHS(true);
        try {
            toast.info('Generating KHS (Study Result Card) PDF...');
            const blob = await printActivityResult(id);
            if (blob) {
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                toast.success('KHS PDF opened successfully.');
            } else {
                toast.danger('Failed to generate KHS PDF.');
            }
        } catch (err) {
            console.error('Error printing KHS:', err);
            toast.danger('An error occurred while generating KHS PDF.');
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

    const calculatedIPS = () => {
        if (activity()?.cumulative_index != null) {
            return activity()!.cumulative_index.toFixed(2);
        }
        if (detailCourses().length === 0) return '0.00';
        const totalPoints = detailCourses().reduce((acc, c) => acc + ((c.grade_point ?? 0) * (c.credit ?? 0)), 0);
        const totalCredits = totalEnrolledSKS();
        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    };

    const calculatedIPK = () => {
        if (activity()?.grand_cumulative_index != null) {
            return activity()!.grand_cumulative_index.toFixed(2);
        }
        return calculatedIPS();
    };

    const renderLecturers = (c: DetailActivityItem) => (
        <Show
            when={c.lecturers && c.lecturers.length > 1}
            fallback={
                <span>
                    {(() => {
                        const l: any = c.lecturers?.[0];
                        if (!l) return c.lecturer_name || '-';
                        if (typeof l === 'string') return l;
                        const code = l.code?.trim();
                        const name = l.name?.trim();
                        if (code && name) {
                            return (
                                <span class="inline-flex items-center gap-1.5">
                                    <span class="font-mono font-medium text-blue-600 dark:text-blue-400">{code}</span>
                                    <span class="text-neutral-400 dark:text-neutral-500">-</span>
                                    <span>{name}</span>
                                </span>
                            );
                        }
                        if (name) return <span>{name}</span>;
                        if (code) return <span class="font-mono font-medium text-blue-600 dark:text-blue-400">{code}</span>;
                        return c.lecturer_name || '-';
                    })()}
                </span>
            }
        >
            <div class="flex flex-col gap-1">
                <For each={c.lecturers}>
                    {(lecturer: any) => (
                        <span class="inline-flex items-center gap-1.5 leading-snug">
                            <span class="size-1 rounded-full bg-neutral-400 dark:bg-neutral-500 shrink-0"></span>
                            {typeof lecturer === 'string' ? (
                                <span>{lecturer}</span>
                            ) : (() => {
                                const code = lecturer.code?.trim();
                                const name = lecturer.name?.trim();
                                if (code && name) {
                                    return (
                                        <span>
                                            <span class="font-mono font-medium text-blue-600 dark:text-blue-400">{code}</span>
                                            <span class="text-neutral-400 dark:text-neutral-500 mx-1">-</span>
                                            <span>{name}</span>
                                        </span>
                                    );
                                }
                                if (name) return <span>{name}</span>;
                                if (code) return <span class="font-mono font-medium text-blue-600 dark:text-blue-400">{code}</span>;
                                return <span>-</span>;
                            })()}
                        </span>
                    )}
                </For>
            </div>
        </Show>
    );

    const getGradeBadgeClass = (grade?: string) => {
        if (!grade || grade === '-') {
            return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
        }
        const cleanGrade = grade.trim().toUpperCase();
        if (cleanGrade.startsWith('A')) {
            return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
        }
        if (cleanGrade.startsWith('B')) {
            return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
        }
        if (cleanGrade.startsWith('C')) {
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
        }
        if (cleanGrade.startsWith('D')) {
            return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
        }
        if (cleanGrade.startsWith('E')) {
            return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
        }
        return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-1">
                            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold border border-indigo-200 dark:border-indigo-800/80">
                                <span class="size-1.5 rounded-full bg-indigo-500"></span>
                                <span>Academic Student Activity Detail</span>
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                {activity()?.name || 'Academic Activity Detail'}
                            </h1>
                            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                Study Plan Card (KRS) & Academic Grade Evaluation (KHS) for this active campaign.
                            </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div class="flex flex-wrap items-center gap-3">
                            <A
                                href="/student/academic/student/campaign/activity"
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-bold transition-colors"
                            >
                                ← Back to Activities
                            </A>
                            <button
                                type="button"
                                onClick={handlePrintKRS}
                                disabled={isPrintingKRS()}
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Print Study Plan Card (KRS)"
                            >
                                <Show
                                    when={!isPrintingKRS()}
                                    fallback={<div class="size-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin"></div>}
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect width="12" height="8" x="6" y="14" /></svg>
                                </Show>
                                <span>{isPrintingKRS() ? 'Generating KRS...' : 'Print KRS'}</span>
                            </button>
                            <button
                                type="button"
                                onClick={handlePrintKHS}
                                disabled={isPrintingKHS()}
                                class="px-4 py-2.5 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/80 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Print Study Result Card (KHS)"
                            >
                                <Show
                                    when={!isPrintingKHS()}
                                    fallback={<div class="size-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>}
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
                                </Show>
                                <span>{isPrintingKHS() ? 'Generating KHS...' : 'Print KHS'}</span>
                            </button>
                            <Show
                                when={!activity()?.is_lock}
                                fallback={
                                    <button
                                        type="button"
                                        disabled
                                        class="px-5 py-2.5 bg-neutral-200 dark:bg-neutral-700 text-neutral-400 dark:text-neutral-500 rounded-xl text-xs font-bold transition-colors cursor-not-allowed flex items-center gap-1.5 opacity-60"
                                        title="Academic activity is locked"
                                    >
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                        <span>Add / Enroll Courses</span>
                                    </button>
                                }
                            >
                                <A
                                    href={`/student/academic/student/campaign/activity/enrollment?activity_id=${activity()?.id || ''}`}
                                    class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14" /></svg>
                                    <span>Add / Enroll Courses</span>
                                </A>
                            </Show>
                        </div>
                    </div>

                    {/* Summary KPI Badges */}
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-neutral-100 dark:border-neutral-700/50">
                        <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Enrolled Courses</span>
                            <span class="text-xl font-black text-neutral-900 dark:text-white">{detailCourses().length} Classes</span>
                        </div>
                        <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Semester SKS Taken</span>
                            <span class="text-xl font-black text-blue-600 dark:text-blue-400">{totalEnrolledSKS()} SKS</span>
                        </div>
                        <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Semester GPA (IPS)</span>
                            <span class="text-xl font-black text-indigo-600 dark:text-indigo-400">{calculatedIPS()}</span>
                        </div>
                        <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">Cumulative GPA (IPK)</span>
                            <span class="text-xl font-black text-emerald-600 dark:text-emerald-400">{calculatedIPK()}</span>
                        </div>
                    </div>
                </div>

                {/* Enrolled Courses Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <div class="p-4 sm:p-5 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h2 class="text-sm font-bold text-neutral-900 dark:text-white">
                            Enrolled Courses List (Rencana & Hasil Studi)
                        </h2>
                        <span class="text-xs text-neutral-400 font-mono">
                            Total {detailCourses().length} Enrolled Courses
                        </span>
                    </div>

                    <Show when={!isLoading()} fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-xs font-mono">{t('academic.loadingCourses')}</p>
                        </div>
                    }>
                        {/* Desktop Table View (md and above) */}
                        <div class="hidden md:block overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3 px-4 text-start">{t('academic.no')}</th>
                                        <th class="py-3 px-4 text-start">{t('academic.courseCode')}</th>
                                        <th class="py-3 px-4 text-start">{t('academic.courseTitle')}</th>
                                        <th class="py-3 px-4 text-center">{t('academic.sks')}</th>
                                        <th class="py-3 px-4 text-start">{t('academic.lecturer')}</th>
                                        <th class="py-3 px-4 text-center">{t('academic.mark')}</th>
                                        <th class="py-3 px-4 text-center">{t('academic.grade')}</th>
                                        <th class="py-3 px-4 text-center">{t('academic.point')}</th>
                                        <th class="py-3 px-4 text-center">{t('academic.status')}</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={detailCourses()} fallback={
                                        <tr>
                                            <td colspan="9" class="py-12 text-center text-neutral-400">
                                                {t('academic.noCoursesEnrolled')}
                                            </td>
                                        </tr>
                                    }>
                                        {(c, idx) => (
                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                <td class="py-3.5 px-4 font-mono text-neutral-400">{idx() + 1}</td>
                                                <td class="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                    {c.course_code || '-'}
                                                </td>
                                                <td class="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                                                    {c.course_name || c.name || '-'}
                                                </td>
                                                <td class="py-3.5 px-4 text-center font-mono font-bold">
                                                    {c.credit ?? 0}
                                                </td>
                                                <td class="py-3.5 px-4 text-neutral-600 dark:text-neutral-300 text-xs">
                                                    {renderLecturers(c)}
                                                </td>
                                                <td class="py-3.5 px-4 text-center font-mono font-bold">
                                                    {c.mark != null ? c.mark.toFixed(1) : '-'}
                                                </td>
                                                <td class="py-3.5 px-4 text-center">
                                                    <span class={`inline-block px-2 py-0.5 rounded-md font-bold text-xs ${getGradeBadgeClass(c.grade_letter || c.grade?.alphabet_code || c.grade?.name)}`}>
                                                        {c.grade_letter || c.grade?.alphabet_code || c.grade?.name || '-'}
                                                    </span>
                                                </td>
                                                <td class="py-3.5 px-4 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                                    {c.grade_point != null ? c.grade_point.toFixed(2) : (c.grade?.grade != null ? c.grade.grade.toFixed(2) : '-')}
                                                </td>
                                                <td class="py-3.5 px-4 text-center">
                                                    <Show
                                                        when={c.is_lock}
                                                        fallback={
                                                            <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-red-800 dark:text-red-300" title="Unlocked">
                                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                                                                </svg>
                                                            </span>
                                                        }
                                                    >
                                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 dark:text-emerald-300" title="Locked">
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                                                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                                            </svg>
                                                        </span>
                                                    </Show>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card List View (below md) */}
                        <div class="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <For each={detailCourses()} fallback={
                                <div class="py-12 px-4 text-center text-neutral-400 font-mono text-xs">
                                    {t('academic.noCoursesEnrolled')}
                                </div>
                            }>
                                {(c, idx) => (
                                    <div class="p-4 sm:p-5 flex flex-col gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors">
                                        {/* Header Row: Index + Course Code + SKS Badge + Lock Status */}
                                        <div class="flex items-center justify-between gap-2">
                                            <div class="flex items-center gap-2 flex-wrap">
                                                <span class="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 font-mono text-neutral-500 dark:text-neutral-400 text-[10px] font-bold">
                                                    #{idx() + 1}
                                                </span>
                                                <span class="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                                    {c.course_code || '-'}
                                                </span>
                                                <span class="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60 font-mono text-[10px] font-bold">
                                                    {c.credit ?? 0} {t('academic.sks')}
                                                </span>
                                            </div>

                                            <Show
                                                when={c.is_lock}
                                                fallback={
                                                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/80">
                                                        <span class="size-1.5 rounded-full bg-amber-500"></span>
                                                        <span>Unlocked</span>
                                                    </span>
                                                }
                                            >
                                                <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80">
                                                    <span class="size-1.5 rounded-full bg-emerald-500"></span>
                                                    <span>Locked</span>
                                                </span>
                                            </Show>
                                        </div>

                                        {/* Course Title */}
                                        <div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                                                {c.course_name || c.name || '-'}
                                            </h3>
                                        </div>

                                        {/* Lecturer */}
                                        <div class="text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-1.5">
                                            <span class="text-neutral-400 dark:text-neutral-500 shrink-0 font-medium text-[11px]">{t('academic.lecturer')}:</span>
                                            <div class="flex-1 text-[11px]">
                                                {renderLecturers(c)}
                                            </div>
                                        </div>

                                        {/* Academic Performance KPI Grid */}
                                        <div class="grid grid-cols-3 gap-2 pt-2 mt-0.5 border-t border-neutral-100 dark:border-neutral-700/40 text-center">
                                            <div class="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">{t('academic.mark')}</span>
                                                <span class="font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200">
                                                    {c.mark != null ? c.mark.toFixed(1) : '-'}
                                                </span>
                                            </div>

                                            <div class="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">{t('academic.grade')}</span>
                                                <span class={`inline-block px-2 py-0.5 rounded font-bold text-xs ${getGradeBadgeClass(c.grade_letter || c.grade?.alphabet_code || c.grade?.name)}`}>
                                                    {c.grade_letter || c.grade?.alphabet_code || c.grade?.name || '-'}
                                                </span>
                                            </div>

                                            <div class="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">{t('academic.point')}</span>
                                                <span class="font-mono font-bold text-xs text-neutral-800 dark:text-neutral-200">
                                                    {c.grade_point != null ? c.grade_point.toFixed(2) : (c.grade?.grade != null ? c.grade.grade.toFixed(2) : '-')}
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
