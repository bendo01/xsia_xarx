import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    getStudentActivityById, 
    StudentActivityItem 
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { 
    listDetailActivities, 
    deleteDetailActivity, 
    DetailActivityItem 
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import { listCourses } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';

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
            
            // 1. Fetch student activity header
            if (activityId) {
                const act = await getStudentActivityById(activityId);
                if (act) {
                    setActivity(act);
                }
            }

            // 2. Fetch enrolled courses (detail activities)
            const detailRes = await listDetailActivities({
                page: 1,
                page_size: 50,
                activity_id: activityId || undefined,
            });

            setDetailCourses(detailRes.data || []);
        } catch (err) {
            console.error('Error fetching activity details:', err);
            toast.danger('Failed to load semester course details.');
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
                setDetailCourses(prev => prev.filter(c => c.id !== courseId));
            } else {
                toast.danger('Failed to drop course.');
            }
        } catch (err) {
            toast.danger('Failed to drop course.');
        } finally {
            setIsDropping(null);
        }
    };

    const handlePrintKRS = () => {
        window.print();
    };

    const totalEnrolledSKS = () => detailCourses().reduce((acc, c) => acc + (c.credit || 0), 0);
    const calculatedIPS = () => {
        if (detailCourses().length === 0) return '0.00';
        const totalPoints = detailCourses().reduce((acc, c) => acc + ((c.grade_point ?? 0) * (c.credit ?? 0)), 0);
        const totalCredits = totalEnrolledSKS();
        return totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
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
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect width="12" height="8" x="6" y="14"/></svg>
                                <span>Print KRS / KHS</span>
                            </button>
                            <A
                                href={`/student/academic/student/campaign/activity/enrollment?activity_id=${activity()?.id || ''}`}
                                class="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                                <span>Add / Enroll Courses</span>
                            </A>
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
                            <span class="text-[10px] text-neutral-400 font-mono uppercase block">KRS Status</span>
                            <span class={`inline-flex items-center gap-1.5 text-xs font-bold mt-1 ${activity()?.is_lock ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                <span class={`size-2 rounded-full ${activity()?.is_lock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                {activity()?.is_lock ? 'Locked / Finalized' : 'Active / KRS Open'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Enrolled Courses Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <div class="p-5 border-b border-neutral-200 dark:border-neutral-700 flex justify-between items-center">
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
                            <p class="text-xs font-mono">Loading enrolled courses from server...</p>
                        </div>
                    }>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3 px-4 text-start">No</th>
                                        <th class="py-3 px-4 text-start">Course Code</th>
                                        <th class="py-3 px-4 text-start">Course Title</th>
                                        <th class="py-3 px-4 text-center">SKS</th>
                                        <th class="py-3 px-4 text-start">Lecturer</th>
                                        <th class="py-3 px-4 text-center">Mark</th>
                                        <th class="py-3 px-4 text-center">Grade</th>
                                        <th class="py-3 px-4 text-center">Point</th>
                                        <th class="py-3 px-4 text-center">Status</th>
                                        <th class="py-3 px-4 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={detailCourses()} fallback={
                                        <tr>
                                            <td colspan="10" class="py-12 text-center text-neutral-400">
                                                No courses enrolled in this semester yet.
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
                                                <td class="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                                                    {c.lecturer_name || '-'}
                                                </td>
                                                <td class="py-3.5 px-4 text-center font-mono font-bold">
                                                    {c.mark != null ? c.mark.toFixed(1) : '-'}
                                                </td>
                                                <td class="py-3.5 px-4 text-center">
                                                    <span class="inline-block px-2 py-0.5 rounded-md font-bold text-xs bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                        {c.grade_letter || '-'}
                                                    </span>
                                                </td>
                                                <td class="py-3.5 px-4 text-center font-mono font-bold text-neutral-800 dark:text-neutral-200">
                                                    {c.grade_point != null ? c.grade_point.toFixed(2) : '-'}
                                                </td>
                                                <td class="py-3.5 px-4 text-center">
                                                    <span class={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${c.is_lock ? 'bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'}`}>
                                                        {c.is_lock ? 'Locked' : 'Enrolled'}
                                                    </span>
                                                </td>
                                                <td class="py-3.5 px-4 text-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDropCourse(c.id, c.course_name || c.name || 'Course')}
                                                        disabled={isDropping() === c.id}
                                                        class="px-2.5 py-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                                                    >
                                                        {isDropping() === c.id ? 'Dropping...' : 'Drop'}
                                                    </button>
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
