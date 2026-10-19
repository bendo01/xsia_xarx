import { createSignal, createEffect, onCleanup, Show, For } from 'solid-js';
import { useNavigate, useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';
import { listActivities, type CampaignActivityItem } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';
import { listTeaches, type TeachItem } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import { listStudents, type StudentMasterItem } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';

export default function ClassCodeDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
    const apiPath = "academic/campaign/transaction/class-codes";

    const [activities, setActivities] = createSignal<CampaignActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [itemData, setItemData] = createSignal<any | null>(null);

    const [teaches, setTeaches] = createSignal<TeachItem[]>([]);
    const [isTeachesLoading, setIsTeachesLoading] = createSignal(false);

    const STUDENT_PAGE_SIZE = 20;
    const [students, setStudents] = createSignal<StudentMasterItem[]>([]);
    const [studentTotal, setStudentTotal] = createSignal(0);
    const [studentPage, setStudentPage] = createSignal(1);
    const [studentTotalPages, setStudentTotalPages] = createSignal(1);
    const [studentSearch, setStudentSearch] = createSignal('');
    const [isStudentsLoading, setIsStudentsLoading] = createSignal(false);
    let studentSearchTimer: ReturnType<typeof setTimeout> | undefined;
    let studentRequestSeq = 0;

    createEffect(() => {
        listActivities({ page_size: 100 }).then(res => setActivities(res.data || []));
    });

    createEffect(async () => {
        if (!params.id) return;
        setIsLoading(true);
        try {
            const res = await masterApiShow(apiPath, params.id);
            if (res.data) {
                setItemData(res.data);
            } else {
                toast.danger('Failed to load class code data');
                navigate('/course-department/academic/campaign/transaction/class-code');
            }
        } catch {
            toast.danger('Failed to load class code data');
            navigate('/course-department/academic/campaign/transaction/class-code');
        } finally {
            setIsLoading(false);
        }
    });

    const fetchTeaches = async (cId: string) => {
        setIsTeachesLoading(true);
        try {
            // A class code holds one semester's courses, so a single page covers it
            const res = await listTeaches({ class_code_id: cId, page_size: 100 });
            setTeaches(res.data);
        } catch (e) {
            console.warn('Could not load class teaches:', e);
            setTeaches([]);
        } finally {
            setIsTeachesLoading(false);
        }
    };

    createEffect(() => {
        const cId = itemData()?.id;
        if (cId) fetchTeaches(cId);
    });

    const totalTeachCredit = () =>
        teaches().reduce((sum, t) => sum + (Number(t.course?.total_credit) || 0), 0);

    const fetchStudents = async () => {
        const cId = itemData()?.id;
        if (!cId) return;

        const seq = ++studentRequestSeq;
        setIsStudentsLoading(true);
        try {
            const res = await listStudents({
                class_code_id: cId,
                search: studentSearch().trim() || undefined,
                page: studentPage(),
                page_size: STUDENT_PAGE_SIZE,
                sort_by: 'code',
                sort_dir: 'asc',
            });
            if (seq !== studentRequestSeq) return;
            setStudents(res.data);
            setStudentTotal(res.total);
            setStudentTotalPages(Math.max(1, res.total_pages));
        } catch (e) {
            if (seq !== studentRequestSeq) return;
            console.warn('Could not load class students:', e);
            setStudents([]);
            setStudentTotal(0);
            setStudentTotalPages(1);
        } finally {
            if (seq === studentRequestSeq) setIsStudentsLoading(false);
        }
    };

    // Reload students whenever the class code, page, or search changes
    createEffect(() => {
        itemData();
        studentPage();
        studentSearch();
        fetchStudents();
    });

    const onStudentSearchInput = (value: string) => {
        clearTimeout(studentSearchTimer);
        studentSearchTimer = setTimeout(() => {
            setStudentPage(1);
            setStudentSearch(value);
        }, 350);
    };

    onCleanup(() => clearTimeout(studentSearchTimer));

    const getActivityName = (id: string) => {
        return activities().find(a => a.id === id)?.name || id || '-';
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Course Department</span>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span>Campaign</span>
                            <span>/</span>
                            <span>Transaction</span>
                            <span>/</span>
                            <a href="/course-department/academic/campaign/transaction/class-code" class="hover:text-blue-600 transition-colors">Class Code</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Detail</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Class Code Detail
                        </h1>
                    </div>
                    <div class="mt-4 sm:mt-0 flex gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/course-department/academic/campaign/transaction/class-code')}
                            class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm transition-colors cursor-pointer"
                        >
                            Back to List
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/course-department/academic/campaign/transaction/class-code/${params.id}/edit`)}
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors cursor-pointer"
                        >
                            Edit
                        </button>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm p-6">
                    <Show when={isLoading()}>
                        <div class="flex items-center justify-center p-12">
                            <svg class="animate-spin size-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </Show>

                    <Show when={!isLoading() && itemData()}>
                        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Class Code Name</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white font-semibold uppercase">{itemData().name}</dd>
                            </div>

                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Code</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{itemData().code}</dd>
                            </div>

                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Alphabet Code</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{itemData().alphabet_code || '-'}</dd>
                            </div>

                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Activity</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{getActivityName(itemData().activity_id)}</dd>
                            </div>

                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Start Effective Date</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">
                                    {itemData().start_effective_date ? new Date(itemData().start_effective_date).toLocaleDateString() : '-'}
                                </dd>
                            </div>

                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">End Effective Date</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">
                                    {itemData().end_effective_date ? new Date(itemData().end_effective_date).toLocaleDateString() : '-'}
                                </dd>
                            </div>

                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Capacity</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{itemData().capacity}</dd>
                            </div>
                        </dl>
                    </Show>
                </div>

                <Show when={!isLoading() && itemData()}>
                    <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm p-6 space-y-4">
                        <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Teaches in This Class</h2>
                            <span class="font-mono text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                {teaches().length} courses · {totalTeachCredit()} credits
                            </span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                        <th class="py-2.5 pr-3 font-medium w-12">No</th>
                                        <th class="py-2.5 pr-3 font-medium">Course Code</th>
                                        <th class="py-2.5 pr-3 font-medium">Course</th>
                                        <th class="py-2.5 pr-3 font-medium text-right">Credits</th>
                                        <th class="py-2.5 font-medium text-right">Participants</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/80">
                                    <Show
                                        when={!isTeachesLoading()}
                                        fallback={
                                            <tr>
                                                <td colspan="5" class="py-10 text-center text-neutral-500">
                                                    <div class="inline-flex items-center gap-2">
                                                        <div class="size-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                                        Loading teaches...
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For
                                            each={teaches()}
                                            fallback={
                                                <tr>
                                                    <td colspan="5" class="py-10 text-center text-neutral-500">
                                                        No teaches are assigned to this class yet.
                                                    </td>
                                                </tr>
                                            }
                                        >
                                            {(teach, index) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors">
                                                    <td class="py-2.5 pr-3 font-mono text-neutral-400">{index() + 1}</td>
                                                    <td class="py-2.5 pr-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                        {teach.course?.code || '-'}
                                                    </td>
                                                    <td class="py-2.5 pr-3 font-medium text-neutral-900 dark:text-white">
                                                        {teach.course?.name || teach.name || '-'}
                                                    </td>
                                                    <td class="py-2.5 pr-3 font-mono text-right text-neutral-600 dark:text-neutral-300">
                                                        {teach.course?.total_credit ?? '-'}
                                                    </td>
                                                    <td class="py-2.5 font-mono text-right text-neutral-600 dark:text-neutral-300">
                                                        {teach.enrolled_count ?? 0}
                                                        <Show when={teach.max_member}>
                                                            <span class="text-neutral-400"> / {teach.max_member}</span>
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

                <Show when={!isLoading() && itemData()}>
                    <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm p-6 space-y-4">
                        <div class="sm:flex sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <div class="flex items-center gap-2">
                                <h2 class="text-lg font-semibold text-neutral-900 dark:text-white">Students in This Class</h2>
                                <span class="font-mono text-xs px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                    {studentTotal()} / {itemData()?.capacity || 0}
                                </span>
                            </div>
                            <input
                                type="search"
                                placeholder="Search NIM or name..."
                                onInput={(e) => onStudentSearchInput(e.currentTarget.value)}
                                class="mt-3 sm:mt-0 w-full sm:w-64 px-3 py-2 text-sm rounded-md bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            />
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-sm">
                                <thead>
                                    <tr class="text-left text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                        <th class="py-2.5 pr-3 font-medium w-12">No</th>
                                        <th class="py-2.5 pr-3 font-medium">NIM</th>
                                        <th class="py-2.5 pr-3 font-medium">Name</th>
                                        <th class="py-2.5 pr-3 font-medium">Academic Year</th>
                                        <th class="py-2.5 pr-3 font-medium">Status</th>
                                        <th class="py-2.5 font-medium text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/80">
                                    <Show
                                        when={!isStudentsLoading()}
                                        fallback={
                                            <tr>
                                                <td colspan="6" class="py-10 text-center text-neutral-500">
                                                    <div class="inline-flex items-center gap-2">
                                                        <div class="size-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                                                        Loading students...
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For
                                            each={students()}
                                            fallback={
                                                <tr>
                                                    <td colspan="6" class="py-10 text-center text-neutral-500">
                                                        {studentSearch() ? 'No students match your search.' : 'No students are assigned to this class yet.'}
                                                    </td>
                                                </tr>
                                            }
                                        >
                                            {(student, index) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/40 transition-colors">
                                                    <td class="py-2.5 pr-3 font-mono text-neutral-400">
                                                        {(studentPage() - 1) * STUDENT_PAGE_SIZE + index() + 1}
                                                    </td>
                                                    <td class="py-2.5 pr-3 font-mono font-semibold text-blue-600 dark:text-blue-400">
                                                        {student.code || '-'}
                                                    </td>
                                                    <td class="py-2.5 pr-3 font-medium text-neutral-900 dark:text-white">
                                                        {student.name || '-'}
                                                    </td>
                                                    <td class="py-2.5 pr-3 font-mono text-neutral-600 dark:text-neutral-300">
                                                        {student.academic_year_name || '-'}
                                                    </td>
                                                    <td class="py-2.5 pr-3">
                                                        <span class="inline-flex px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs font-medium">
                                                            {student.status_name || '-'}
                                                        </span>
                                                    </td>
                                                    <td class="py-2.5 text-right">
                                                        <A
                                                            href={`/course-department/academic/student/master/student/${student.id}`}
                                                            class="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                                        >
                                                            Detail →
                                                        </A>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </tbody>
                            </table>
                        </div>

                        <Show when={studentTotalPages() > 1}>
                            <div class="flex items-center justify-between pt-2 text-sm text-neutral-500">
                                <span class="font-mono text-xs">
                                    Page {studentPage()} of {studentTotalPages()}
                                </span>
                                <div class="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={studentPage() <= 1 || isStudentsLoading()}
                                        onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                                        class="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        ← Previous
                                    </button>
                                    <button
                                        type="button"
                                        disabled={studentPage() >= studentTotalPages() || isStudentsLoading()}
                                        onClick={() => setStudentPage((p) => Math.min(studentTotalPages(), p + 1))}
                                        class="px-3 py-1.5 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-md disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        Next →
                                    </button>
                                </div>
                            </div>
                        </Show>
                    </div>
                </Show>
            </div>
        </div>
    );
}
