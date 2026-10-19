import { createSignal, createEffect, For, Show } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    getStudentActivityById,
    printActivityPlan,
    printActivityResult,
    StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import {
    listDetailActivities,
    DetailActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import { listCourses } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import { listGrades } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';
import { openOrDownloadPdf } from '~/lib/pdfHelper';

const gradeBadgeClass = (grade?: string) => {
    const g = (grade || '').trim().toUpperCase();
    if (g.startsWith('A')) return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300';
    if (g.startsWith('B')) return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300';
    if (g.startsWith('C')) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300';
    if (g.startsWith('D')) return 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300';
    if (g.startsWith('E')) return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300';
    return 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400';
};

const cleanName = (val?: string) => {
    if (!val || val.startsWith('DosenAktifitasPengajaran')) return '';
    return val.trim();
};

export default function CourseDepartmentStudentCampaignActivityShowPage() {
    const params = useParams();
    const [activity, setActivity] = createSignal<StudentActivityItem | null>(null);
    const [courses, setCourses] = createSignal<DetailActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isPrintingKRS, setIsPrintingKRS] = createSignal(false);
    const [isPrintingKHS, setIsPrintingKHS] = createSignal(false);

    const fetchDetail = async (activityId: string) => {
        setIsLoading(true);
        try {
            const [act, detailRes, courseList, gradesRes] = await Promise.all([
                getStudentActivityById(activityId),
                listDetailActivities({ page: 1, page_size: 100, activity_id: activityId }),
                listCourses(),
                listGrades({ page: 1, page_size: 100 }),
            ]);

            setActivity(act);

            const grades = gradesRes.data || [];
            const rawDetails = (detailRes.data || []).filter((d) => d.activity_id === activityId);

            setCourses(
                rawDetails.map((detail) => {
                    const course = detail.course || (courseList || []).find((c: any) => c.id === detail.course_id);
                    const grade = detail.grade || grades.find((g: any) => g.id === detail.grade_id);

                    const lecturers = (detail.teach_lecturers || [])
                        .map((tl: any) => ({
                            code: (tl.code || tl.lecturer_code || tl.lecturer?.code || '').trim(),
                            name: cleanName(tl.name || tl.lecturer_name || tl.lecturer?.name || ''),
                        }))
                        .filter((l: any) => l.name || l.code);

                    return {
                        ...detail,
                        course_code: course?.code || detail.course_code || '-',
                        course_name: course?.name || detail.name || detail.course_name || '-',
                        credit: detail.credit ?? course?.total_credit ?? course?.credit ?? 0,
                        lecturers,
                        lecturer_name: lecturers.length
                            ? lecturers.map((l: any) => (l.code && l.name ? `${l.code} - ${l.name}` : l.name || l.code)).join(', ')
                            : cleanName(detail.lecturer_name) || '-',
                        grade_letter: grade?.alphabet_code || grade?.name || detail.grade_letter || '-',
                        grade_point: grade?.grade ?? detail.grade_point,
                    };
                }),
            );
        } catch (err) {
            console.error('Error fetching activity details:', err);
            toast.danger('Failed to load semester course details from server.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        const id = params.id;
        if (id) {
            fetchDetail(id);
        } else {
            setActivity(null);
            setCourses([]);
            setIsLoading(false);
        }
    });

    const totalSks = () => {
        const total = activity()?.total_credit;
        if (total != null && total > 0) return total;
        return courses().reduce((acc, c) => acc + (c.credit || 0), 0);
    };

    const ips = () => Number(activity()?.cumulative_index || 0).toFixed(2);
    const ipk = () => Number(activity()?.grand_cumulative_index || activity()?.cumulative_index || 0).toFixed(2);

    const backHref = () => {
        const studentId = activity()?.student_id;
        return studentId
            ? `/course-department/academic/student/master/student/${studentId}`
            : '/course-department/academic/student/master/student';
    };

    const print = async (
        kind: 'KRS' | 'KHS',
        fn: (id: string) => Promise<Blob | null>,
        setBusy: (v: boolean) => void,
    ) => {
        const act = activity();
        if (!act?.id) {
            toast.danger('Activity ID is missing.');
            return;
        }
        setBusy(true);
        try {
            const blob = await fn(act.id);
            if (blob) {
                const semName = (act.name || 'Semester').replace(/\s+/g, '_');
                openOrDownloadPdf(blob, `${kind}_${semName}.pdf`, kind);
            } else {
                toast.danger(`Failed to generate ${kind} PDF.`);
            }
        } catch (err) {
            console.error(`Error printing ${kind}:`, err);
            toast.danger(`An error occurred while generating ${kind} PDF.`);
        } finally {
            setBusy(false);
        }
    };

    const btn =
        'px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xs text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-1">
                            <p class="text-xs font-mono font-semibold text-blue-700 dark:text-blue-300">Academic Student Activity</p>
                            <h1 class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">
                                {activity()?.name || activity()?.semester_name || 'Activity Detail'}
                            </h1>
                            <Show when={activity()?.student_name}>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    {activity()?.student_code ? `${activity()?.student_code} - ` : ''}
                                    {activity()?.student_name}
                                </p>
                            </Show>
                        </div>
                        <div class="flex flex-wrap items-center gap-3">
                            <A href={backHref()} class={btn}>← Back to Student</A>
                            <button type="button" class={btn} disabled={isPrintingKRS()} onClick={() => print('KRS', printActivityPlan, setIsPrintingKRS)}>
                                {isPrintingKRS() ? 'Generating KRS...' : 'Print KRS'}
                            </button>
                            <button type="button" class={btn} disabled={isPrintingKHS()} onClick={() => print('KHS', printActivityResult, setIsPrintingKHS)}>
                                {isPrintingKHS() ? 'Generating KHS...' : 'Print KHS'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200 dark:border-neutral-700">
                        <p class="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400">SKS Semester</p>
                        <p class="text-2xl font-black font-mono text-neutral-800 dark:text-white">{totalSks()}</p>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200 dark:border-neutral-700">
                        <p class="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400">SKS Kumulatif</p>
                        <p class="text-2xl font-black font-mono text-teal-600 dark:text-teal-400">
                            {activity()?.grand_total_credit || totalSks()}
                        </p>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200 dark:border-neutral-700">
                        <p class="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400">IPS</p>
                        <p class="text-2xl font-black font-mono text-sky-600 dark:text-sky-400">{ips()}</p>
                    </div>
                    <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200 dark:border-neutral-700">
                        <p class="text-[10px] uppercase font-mono text-neutral-500 dark:text-neutral-400">IPK</p>
                        <p class="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">{ipk()}</p>
                    </div>
                </div>

                {/* Courses */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <div class="px-5 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                        <h2 class="text-sm font-bold">Mata Kuliah</h2>
                        <span class="text-xs font-mono text-neutral-500 dark:text-neutral-400">{courses().length} Mata Kuliah</span>
                    </div>

                    <Show when={!isLoading()} fallback={<div class="p-8 text-center text-xs text-neutral-500">Loading...</div>}>
                        <Show
                            when={courses().length > 0}
                            fallback={<div class="p-8 text-center text-xs text-neutral-500">Belum ada mata kuliah pada semester ini.</div>}
                        >
                            {/* Desktop table */}
                            <div class="hidden md:block overflow-x-auto">
                                <table class="w-full text-xs text-left border-collapse">
                                    <thead class="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                        <tr>
                                            <th class="px-5 py-3">No</th>
                                            <th class="px-5 py-3">Kode</th>
                                            <th class="px-5 py-3">Mata Kuliah</th>
                                            <th class="px-5 py-3">Dosen</th>
                                            <th class="px-5 py-3 text-center">SKS</th>
                                            <th class="px-5 py-3 text-center">Nilai Angka</th>
                                            <th class="px-5 py-3 text-center">Nilai</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                                        <For each={courses()}>
                                            {(c, idx) => (
                                                <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                    <td class="px-5 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                    <td class="px-5 py-3 font-mono text-blue-600 dark:text-blue-400">{c.course_code}</td>
                                                    <td class="px-5 py-3 font-medium text-neutral-900 dark:text-white">{c.course_name}</td>
                                                    <td class="px-5 py-3">
                                                        <Show when={c.lecturers && c.lecturers.length > 0} fallback={<span>{c.lecturer_name || '-'}</span>}>
                                                            <div class="flex flex-col gap-1">
                                                                <For each={c.lecturers as { code?: string; name: string }[]}>
                                                                    {(l) => <span>{l.code && l.name ? `${l.code} - ${l.name}` : l.name || l.code}</span>}
                                                                </For>
                                                            </div>
                                                        </Show>
                                                    </td>
                                                    <td class="px-5 py-3 text-center font-mono font-bold">{c.credit ?? 0}</td>
                                                    <td class="px-5 py-3 text-center font-mono">{c.grade_point != null ? Number(c.grade_point).toFixed(2) : '-'}</td>
                                                    <td class="px-5 py-3 text-center">
                                                        <span class={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${gradeBadgeClass(c.grade_letter)}`}>
                                                            {c.grade_letter || '-'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div class="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700/60">
                                <For each={courses()}>
                                    {(c, idx) => (
                                        <div class="p-4 space-y-2">
                                            <div class="flex items-start justify-between gap-3">
                                                <div>
                                                    <p class="text-[10px] font-mono text-neutral-400">
                                                        #{idx() + 1} · <span class="text-blue-600 dark:text-blue-400">{c.course_code}</span>
                                                    </p>
                                                    <p class="text-sm font-medium text-neutral-900 dark:text-white">{c.course_name}</p>
                                                </div>
                                                <span class={`px-2 py-0.5 rounded-xs text-[10px] font-bold ${gradeBadgeClass(c.grade_letter)}`}>
                                                    {c.grade_letter || '-'}
                                                </span>
                                            </div>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-400">{c.lecturer_name || '-'}</p>
                                            <div class="flex gap-4 text-xs font-mono">
                                                <span>SKS: <b>{c.credit ?? 0}</b></span>
                                                <span>Nilai: <b>{c.grade_point != null ? Number(c.grade_point).toFixed(2) : '-'}</b></span>
                                            </div>
                                        </div>
                                    )}
                                </For>
                            </div>
                        </Show>
                    </Show>
                </div>
            </main>
        </div>
    );
}
