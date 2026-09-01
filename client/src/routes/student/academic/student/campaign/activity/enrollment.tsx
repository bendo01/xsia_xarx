import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    listTeaches, 
    listCourses, 
    getCourseById,
    listTeachDecrees, 
    listClassCodes, 
    getClassCodeById,
    listTeachLecturers, 
    listLecturers, 
    listSchedules, 
    listRooms, 
    TeachItem 
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import { 
    listDetailActivities, 
    createDetailActivity, 
    deleteDetailActivity, 
    DetailActivityItem 
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import { 
    listStudentActivities, 
    StudentActivityItem 
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { 
    getActivityById, 
    CampaignActivityItem 
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';
import { 
    getStudentById, 
    listStudents, 
    StudentMasterItem 
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { getActiveStudentId } from '~/lib/authStore';

export default function StudentCourseEnrollmentPage() {
    const [searchParams] = useSearchParams();
    const [availableTeaches, setAvailableTeaches] = createSignal<TeachItem[]>([]);
    const [enrolledCourses, setEnrolledCourses] = createSignal<DetailActivityItem[]>([]);
    const [activeActivity, setActiveActivity] = createSignal<StudentActivityItem | null>(null);
    const [activeStudent, setActiveStudentState] = createSignal<StudentMasterItem | null>(null);
    const [unitActivity, setUnitActivity] = createSignal<CampaignActivityItem | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedCreditFilter, setSelectedCreditFilter] = createSignal('all');
    const [enrollingTeachId, setEnrollingTeachId] = createSignal<string | null>(null);
    const [droppingDetailId, setDroppingDetailId] = createSignal<string | null>(null);

    const maxAllowedSKS = 24;

    const fetchEnrollmentData = async () => {
        setIsLoading(true);
        try {
            // 1. Resolve student info
            let targetStudentId = getActiveStudentId();
            let studentRecord: StudentMasterItem | null = null;
            if (targetStudentId) {
                studentRecord = await getStudentById(targetStudentId);
            }
            if (!studentRecord) {
                const stdList = await listStudents({ page: 1, page_size: 10 });
                studentRecord = stdList.data?.[0] || null;
                if (studentRecord) {
                    targetStudentId = studentRecord.id;
                }
            }
            setActiveStudentState(studentRecord);

            // 2. Determine active semester activity
            const actList = await listStudentActivities({ page: 1, page_size: 20, student_id: targetStudentId || undefined });
            let currentAct: StudentActivityItem | null = null;
            if (searchParams.activity_id && actList.data) {
                currentAct = actList.data.find(a => a.id === searchParams.activity_id) || null;
            }
            if (!currentAct && actList.data) {
                currentAct = actList.data.find(a => !a.is_lock) || actList.data[0] || null;
            }
            setActiveActivity(currentAct);

            if (!currentAct) {
                setAvailableTeaches([]);
                setEnrolledCourses([]);
                setIsLoading(false);
                return;
            }

            // 3. Find unit activity (academic_campaign_transaction.activities)
            // matching student_activity.unit_activity_id
            const targetActivityId = currentAct.unit_activity_id || currentAct.id;
            const targetUnitId = studentRecord?.unit_id || currentAct.unit_id;

            let campaignActivity: CampaignActivityItem | null = null;
            if (currentAct.unit_activity_id) {
                campaignActivity = await getActivityById(currentAct.unit_activity_id);
            }
            setUnitActivity(campaignActivity);

            // 4. Fetch real relation data from server in parallel
            const [
                activityTeachesRes,
                decreesList,
                classesList,
                teachLecturersList,
                lecturersList,
                schedulesList,
                roomsList,
                unitCoursesList,
                detailActivitiesRes
            ] = await Promise.all([
                listTeaches({ page: 1, page_size: 300, activity_id: targetActivityId }),
                listTeachDecrees({ page_size: 100, activity_id: targetActivityId }),
                listClassCodes({ page_size: 500 }),
                listTeachLecturers({ page_size: 500 }),
                listLecturers({ page_size: 300 }),
                listSchedules({ page_size: 300 }),
                listRooms({ page_size: 300 }),
                targetUnitId ? listCourses({ page_size: 500, unit_id: targetUnitId }) : Promise.resolve([]),
                listDetailActivities({ page: 1, page_size: 100, activity_id: currentAct.id }),
            ]);

            const allDecrees = decreesList || [];
            const relevantDecreeIds = new Set(allDecrees.map((d: any) => d.id));

            // If there are decrees under this activity, fetch teaches associated via teach_decree_id
            let decreeTeaches: TeachItem[] = [];
            if (allDecrees.length > 0) {
                const decreeTeachesRes = await Promise.all(
                    allDecrees.map((d: any) => listTeaches({ page: 1, page_size: 300, teach_decree_id: d.id }))
                );
                decreeTeaches = decreeTeachesRes.flatMap(r => r.data || []);
            }

            // Fallback fetch general teaches if activityTeaches and decreeTeaches are empty
            let generalTeaches: TeachItem[] = [];
            if ((activityTeachesRes.data || []).length === 0 && decreeTeaches.length === 0) {
                const genRes = await listTeaches({ page: 1, page_size: 300 });
                generalTeaches = genRes.data || [];
            }

            // Merge and deduplicate teaches
            const teachMap = new Map<string, TeachItem>();
            (activityTeachesRes.data || []).forEach(t => teachMap.set(t.id, t));
            decreeTeaches.forEach(t => teachMap.set(t.id, t));
            generalTeaches.forEach(t => teachMap.set(t.id, t));
            const allTeaches = Array.from(teachMap.values());

            // Build maps for courses and class codes
            const courseMap = new Map<string, any>();
            (unitCoursesList || []).forEach((c: any) => {
                if (c && c.id) courseMap.set(c.id, c);
            });

            // Parallel fetch any missing course definitions by ID (e.g. university/general courses)
            const missingCourseIds = Array.from(
                new Set([
                    ...allTeaches.map(t => t.course_id),
                    ...(detailActivitiesRes.data || []).map((d: any) => d.course_id)
                ])
            ).filter(id => id && !courseMap.has(id));

            if (missingCourseIds.length > 0) {
                const fetchedCourses = await Promise.all(missingCourseIds.map(id => getCourseById(id)));
                fetchedCourses.forEach(c => {
                    if (c && c.id) courseMap.set(c.id, c);
                });
            }

            const classCodeMap = new Map<string, any>();
            (classesList || []).forEach((cc: any) => {
                if (cc && cc.id) classCodeMap.set(cc.id, cc);
            });

            // Parallel fetch any missing class code definitions
            const missingClassCodeIds = Array.from(new Set(allTeaches.map(t => t.class_code_id)))
                .filter(id => id && !classCodeMap.has(id));
            if (missingClassCodeIds.length > 0) {
                const fetchedClasses = await Promise.all(missingClassCodeIds.map(id => getClassCodeById(id)));
                fetchedClasses.forEach(cc => {
                    if (cc && cc.id) classCodeMap.set(cc.id, cc);
                });
            }

            const allTeachLecturers = teachLecturersList || [];
            const allLecturers = lecturersList || [];
            const allSchedules = schedulesList || [];
            const allRooms = roomsList || [];
            const studentDetails = detailActivitiesRes.data || [];

            // 5. Filter offered teaches strictly based on:
            // - academic_campaign_transaction.teaches.activity_id = student_activity.unit_activity_id (or decree.activity_id = student_activity.unit_activity_id)
            // - academic_campaign_transaction.teaches unit matching student.unit_id
            const filteredRawTeaches = allTeaches.filter((t: TeachItem) => {
                const matchesActivity = 
                    t.activity_id === targetActivityId || 
                    (t.teach_decree_id && relevantDecreeIds.has(t.teach_decree_id));

                if (!matchesActivity) return false;

                // Verify unit against student.unit_id
                if (targetUnitId) {
                    const course = courseMap.get(t.course_id);
                    const teachUnit = (t as any).unit_id || course?.unit_id || campaignActivity?.unit_id;
                    // If course unit matches targetUnitId or is universal/common or teach belongs to target activity:
                    if (teachUnit && teachUnit !== targetUnitId && !t.activity_id) {
                        return false;
                    }
                }

                return true;
            });

            // Helper to clean names and class letters
            const cleanName = (val?: string) => {
                if (!val || val.startsWith('DosenAktifitasPengajaran')) return '';
                return val.trim();
            };

            const resolveClassLetter = (cc?: any) => {
                if (!cc) return '-';
                if (cc.alphabet_code && cc.alphabet_code.trim()) return cc.alphabet_code.trim();
                if (cc.name) {
                    const parts = cc.name.trim().split(/\s+/);
                    const last = parts[parts.length - 1];
                    if (last && last.length <= 8) return last;
                    return cc.name;
                }
                return cc.code || '-';
            };

            // 6. Enrich teaches with real related entity information (no scaffold data)
            const enrichedTeaches: TeachItem[] = filteredRawTeaches.map((t: TeachItem) => {
                const course = courseMap.get(t.course_id);
                const classCode = classCodeMap.get(t.class_code_id);
                
                const assignedTeachLecturers = allTeachLecturers.filter((tl: any) => tl.teach_id === t.id);
                const lecturerNames = assignedTeachLecturers.map((tl: any) => {
                    const lec = allLecturers.find((l: any) => l.id === tl.lecturer_id);
                    const code = (lec?.code || '').trim();
                    const name = cleanName(lec?.name || tl.name || tl.lecturer_name || '');
                    return code && name ? `${code} - ${name}` : (name || code);
                }).filter(Boolean).join(', ');

                const assignedSchedules = allSchedules.filter((s: any) => s.teach_id === t.id);
                const scheduleTime = assignedSchedules.map((s: any) => {
                    if (s.start_hour && s.end_hour) {
                        return `${String(s.start_hour).slice(0, 5)} - ${String(s.end_hour).slice(0, 5)}`;
                    }
                    return s.name || '';
                }).filter(Boolean).join(', ');

                const roomNames = assignedSchedules.map((s: any) => {
                    const r = allRooms.find((rm: any) => rm.id === s.room_id);
                    return r?.name || s.room_name || '';
                }).filter(Boolean).join(', ');

                const enrolledCount = t.enrolled_count ?? 0;

                return {
                    ...t,
                    course_code: course?.code || t.course_code || '-',
                    course_name: course?.name || t.course_name || t.name || '-',
                    credits: course?.total_credit ?? course?.credit ?? t.credits ?? 0,
                    class_name: resolveClassLetter(classCode) !== '-' ? resolveClassLetter(classCode) : (t.class_name || '-'),
                    lecturer_name: lecturerNames || t.lecturer_name || '-',
                    schedule_time: scheduleTime || t.schedule_time || '-',
                    room_name: roomNames || t.room_name || '-',
                    enrolled_count: enrolledCount,
                    max_member: t.max_member ?? 40,
                };
            });

            setAvailableTeaches(enrichedTeaches);

            // 7. Enrich student's enrolled courses with actual relation data
            const enrichedEnrolled: DetailActivityItem[] = studentDetails.map((detail: any) => {
                const course = courseMap.get(detail.course_id);
                const teach = enrichedTeaches.find((t: any) => t.id === detail.teach_id) || allTeaches.find((t: any) => t.id === detail.teach_id);
                const classCode = teach ? classCodeMap.get(teach.class_code_id) : null;

                return {
                    ...detail,
                    course_code: course?.code || detail.course_code || teach?.course_code || '-',
                    course_name: course?.name || detail.course_name || detail.name || teach?.course_name || '-',
                    credit: detail.credit ?? course?.total_credit ?? course?.credit ?? teach?.credits ?? 0,
                    class_name: resolveClassLetter(classCode) !== '-' ? resolveClassLetter(classCode) : (teach?.class_name || '-'),
                    lecturer_name: teach?.lecturer_name || detail.lecturer_name || '-',
                };
            });

            setEnrolledCourses(enrichedEnrolled);
        } catch (err) {
            console.error('Error fetching enrollment data:', err);
            toast.danger('Failed to load course offerings from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchEnrollmentData();
    });

    createEffect(() => {
        const _id = searchParams.activity_id;
        fetchEnrollmentData();
    });

    const totalCurrentSKS = () => enrolledCourses().reduce((acc, c) => acc + (c.credit || 0), 0);
    const remainingSKS = () => Math.max(0, maxAllowedSKS - totalCurrentSKS());

    // Exact class enrollment check
    const isEnrolledInThisClass = (teachId: string) => {
        return enrolledCourses().some(c => c.teach_id === teachId);
    };

    // Course enrolled in another class check (prevents duplicate course registration across multiple classes)
    const isCourseEnrolledInOtherClass = (courseId: string, teachId: string) => {
        return !isEnrolledInThisClass(teachId) && enrolledCourses().some(c => c.course_id === courseId);
    };

    const isCourseAlreadyEnrolled = (courseId: string) => {
        return enrolledCourses().some(c => c.course_id === courseId);
    };

    const handleEnroll = async (teach: TeachItem) => {
        const courseCredit = teach.credits ?? 0;
        if (totalCurrentSKS() + courseCredit > maxAllowedSKS) {
            toast.danger(`Cannot enroll. Exceeds maximum SKS allowance of ${maxAllowedSKS} SKS.`);
            return;
        }

        // Prevent enrolling in the same course under a different class
        if (isCourseAlreadyEnrolled(teach.course_id)) {
            toast.warning(`You have already enrolled in ${teach.course_name || 'this course'} in another class. Please drop the existing class first to change classes.`);
            return;
        }

        setEnrollingTeachId(teach.id);
        try {
            const res = await createDetailActivity({
                name: teach.course_name || teach.name || 'Enrolled Course',
                credit: courseCredit,
                course_id: teach.course_id,
                activity_id: activeActivity()?.id || '',
                teach_id: teach.id,
            });

            if (!res.is_error && res.data) {
                toast.success(`Successfully enrolled in ${teach.course_name || teach.name || 'course'}! (+${courseCredit} SKS)`);
                await fetchEnrollmentData();
            } else {
                toast.danger(res.message || 'Failed to enroll class.');
            }
        } catch (err) {
            toast.danger('Failed to enroll class.');
        } finally {
            setEnrollingTeachId(null);
        }
    };

    const [targetToDrop, setTargetToDrop] = createSignal<{
        detailId: string;
        courseName: string;
        courseCode?: string;
        className?: string;
        credit?: number | null;
        lecturerName?: string;
    } | null>(null);

    const openDropModal = (item: {
        detailId: string;
        courseName: string;
        courseCode?: string;
        className?: string;
        credit?: number | null;
        lecturerName?: string;
    }) => {
        setTargetToDrop(item);
    };

    const closeDropModal = () => {
        if (droppingDetailId()) return;
        setTargetToDrop(null);
    };

    const confirmDrop = async () => {
        const item = targetToDrop();
        if (!item) return;

        setDroppingDetailId(item.detailId);
        try {
            const res = await deleteDetailActivity(item.detailId);
            if (!res.is_error) {
                toast.info(`Dropped ${item.courseName} from study plan.`);
                setTargetToDrop(null);
                await fetchEnrollmentData();
            } else {
                toast.danger(res.message || 'Failed to drop class.');
            }
        } catch (err) {
            toast.danger('Failed to drop class.');
        } finally {
            setDroppingDetailId(null);
        }
    };

    const filteredTeaches = () => {
        return availableTeaches().filter(t => {
            const matchesSearch = 
                !searchQuery() ||
                (t.course_name || '').toLowerCase().includes(searchQuery().toLowerCase()) ||
                (t.course_code || '').toLowerCase().includes(searchQuery().toLowerCase()) ||
                (t.class_name || '').toLowerCase().includes(searchQuery().toLowerCase()) ||
                (t.lecturer_name || '').toLowerCase().includes(searchQuery().toLowerCase());

            const matchesCredit = 
                selectedCreditFilter() === 'all' || 
                String(t.credits) === selectedCreditFilter();

            return matchesSearch && matchesCredit;
        });
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Card with SKS Allowance Calculator */}
                <div class="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
                    <div class="absolute -right-20 -bottom-20 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-2">
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-mono font-semibold">
                                <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                <span>KRS Course Enrollment Gateway</span>
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight">
                                Semester Course Enrollment (KRS)
                            </h1>
                            <p class="text-neutral-300 text-xs sm:text-sm max-w-xl">
                                Select and enroll into class offerings from the academic catalog for {activeActivity()?.name || 'Academic Semester'}.
                            </p>
                        </div>

                        {/* Realtime SKS Meter */}
                        <div class="p-5 bg-white/10 backdrop-blur-md rounded-2xl border border-white/15 min-w-[280px] space-y-3">
                            <div class="flex justify-between items-center text-xs font-mono">
                                <span class="text-neutral-300">Credit Load (SKS):</span>
                                <span class="font-bold text-white text-sm">{totalCurrentSKS()} / {maxAllowedSKS} SKS</span>
                            </div>

                            {/* Progress bar */}
                            <div class="w-full h-2.5 bg-black/40 rounded-full overflow-hidden">
                                <div
                                    class={`h-full transition-all duration-500 rounded-full ${
                                        totalCurrentSKS() >= maxAllowedSKS
                                            ? 'bg-amber-400'
                                            : 'bg-emerald-400'
                                    }`}
                                    style={{ width: `${Math.min(100, (totalCurrentSKS() / maxAllowedSKS) * 100)}%` }}
                                ></div>
                            </div>

                            <div class="flex justify-between items-center text-[11px] text-neutral-300">
                                <span>Remaining Allowance:</span>
                                <span class="font-bold text-emerald-300">{remainingSKS()} SKS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* My Selected Courses Tray (KRS Card) */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100 dark:border-neutral-700/60">
                        <div class="flex items-center gap-2.5">
                            <div class="size-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-black text-xs flex items-center justify-center">
                                ✓
                            </div>
                            <div>
                                <h2 class="text-sm font-bold text-neutral-900 dark:text-white">
                                    My Selected Study Plan ({enrolledCourses().length} Enrolled Courses)
                                </h2>
                                <p class="text-[11px] text-neutral-400 font-mono">Total {totalCurrentSKS()} SKS registered</p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2">
                            <A
                                href={`/student/academic/student/campaign/activity/show?id=${activeActivity()?.id || ''}`}
                                class="px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-colors"
                            >
                                View Study Plan (KRS Detail) →
                            </A>
                        </div>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <For each={enrolledCourses()} fallback={
                            <div class="col-span-1 sm:col-span-2 lg:col-span-3 py-6 text-center text-neutral-400 text-xs">
                                No courses selected yet. Choose from the available offerings below.
                            </div>
                        }>
                            {(enr) => (
                                <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-start justify-between gap-3">
                                    <div class="space-y-1 min-w-0">
                                        <div class="flex items-center gap-2 flex-wrap">
                                            <span class="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400">
                                                {enr.course_code || '-'}
                                            </span>
                                            <span class="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold">
                                                {enr.credit ?? 0} SKS
                                            </span>
                                            <Show when={enr.class_name && enr.class_name !== '-'}>
                                                <span class="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[10px] font-mono font-semibold">
                                                    Class: {enr.class_name}
                                                </span>
                                            </Show>
                                        </div>
                                        <h4 class="text-xs font-bold text-neutral-900 dark:text-white truncate">
                                            {enr.course_name || '-'}
                                        </h4>
                                        <p class="text-[10px] text-neutral-400 truncate">
                                            {enr.lecturer_name || '-'}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => openDropModal({
                                            detailId: enr.id,
                                            courseName: enr.course_name || 'Course',
                                            courseCode: enr.course_code,
                                            className: enr.class_name,
                                            credit: enr.credit,
                                            lecturerName: enr.lecturer_name,
                                        })}
                                        disabled={droppingDetailId() === enr.id}
                                        class="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 shrink-0"
                                        title="Drop class"
                                    >
                                        ✕
                                    </button>
                                </div>
                            )}
                        </For>
                    </div>
                </div>

                {/* Available Course Offerings Catalog */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    {/* Catalog Filter Header */}
                    <div class="p-6 border-b border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 class="text-base font-bold text-neutral-900 dark:text-white">
                                Available Class Offerings
                            </h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                Course classes available for your active semester activity and unit.
                            </p>
                        </div>

                        <div class="flex items-center gap-3">
                            <div class="relative w-64">
                                <input
                                    type="text"
                                    placeholder="Filter by course, code, class, lecturer..."
                                    value={searchQuery()}
                                    onInput={(e) => setSearchQuery(e.currentTarget.value)}
                                    class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                                />
                                <svg class="size-3.5 absolute left-2.5 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                            </div>

                            <select
                                value={selectedCreditFilter()}
                                onChange={(e) => setSelectedCreditFilter(e.currentTarget.value)}
                                class="py-1.5 px-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden"
                            >
                                <option value="all">All SKS</option>
                                <option value="1">1 SKS</option>
                                <option value="2">2 SKS</option>
                                <option value="3">3 SKS</option>
                                <option value="4">4 SKS</option>
                                <option value="6">6 SKS</option>
                            </select>
                        </div>
                    </div>

                    {/* Offerings Content */}
                    <Show when={!isLoading()} fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-xs font-mono">Loading teach class offerings from server...</p>
                        </div>
                    }>
                        {/* Desktop Table View (md and above) */}
                        <div class="hidden md:block overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3 px-4 text-start">Code</th>
                                        <th class="py-3 px-4 text-start">Course Title</th>
                                        <th class="py-3 px-4 text-center">SKS</th>
                                        <th class="py-3 px-4 text-center">Class</th>
                                        <th class="py-3 px-4 text-start">Lecturer</th>
                                        <th class="py-3 px-4 text-start">Schedule & Room</th>
                                        <th class="py-3 px-4 text-center">Quota</th>
                                        <th class="py-3 px-4 text-end">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={filteredTeaches()} fallback={
                                        <tr>
                                            <td colspan="8" class="py-12 text-center text-neutral-400">
                                                No class offerings available for current semester activity and unit.
                                            </td>
                                        </tr>
                                    }>
                                        {(t) => {
                                            const isEnrolledThis = () => isEnrolledInThisClass(t.id);
                                            const isEnrolledOther = () => isCourseEnrolledInOtherClass(t.course_id, t.id);
                                            const isFull = () => (t.enrolled_count || 0) >= (t.max_member || 40);
                                            const enrolledDetail = () => enrolledCourses().find(c => c.teach_id === t.id);
                                            const isDroppingThis = () => {
                                                const d = enrolledDetail();
                                                return d ? droppingDetailId() === d.id : false;
                                            };

                                            return (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                    <td class="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                        {t.course_code || '-'}
                                                    </td>
                                                    <td class="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                                                        {t.course_name || t.name || '-'}
                                                    </td>
                                                    <td class="py-3.5 px-4 text-center font-mono font-bold">
                                                        <span class="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                                            {t.credits ?? 0} SKS
                                                        </span>
                                                    </td>
                                                    <td class="py-3.5 px-4 text-center font-mono font-semibold text-neutral-700 dark:text-neutral-300">
                                                        {t.class_name || '-'}
                                                    </td>
                                                    <td class="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                                                        {t.lecturer_name || '-'}
                                                    </td>
                                                    <td class="py-3.5 px-4 text-neutral-500 dark:text-neutral-400 text-[11px]">
                                                        <span class="block text-neutral-800 dark:text-neutral-200">{t.schedule_time || '-'}</span>
                                                        <span class="text-[10px] font-mono">{t.room_name || '-'}</span>
                                                    </td>
                                                    <td class="py-3.5 px-4 text-center font-mono">
                                                        <span class={`font-bold ${isFull() ? 'text-red-500' : 'text-neutral-700 dark:text-neutral-300'}`}>
                                                            {t.enrolled_count ?? 0} / {t.max_member ?? '-'}
                                                        </span>
                                                    </td>
                                                    <td class="py-3.5 px-4 text-end">
                                                        <Show when={!isEnrolledThis()} fallback={
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const d = enrolledDetail();
                                                                    if (d) openDropModal({
                                                                        detailId: d.id,
                                                                        courseName: t.course_name || t.name || 'Course',
                                                                        courseCode: t.course_code,
                                                                        className: t.class_name,
                                                                        credit: t.credits,
                                                                        lecturerName: t.lecturer_name,
                                                                    });
                                                                }}
                                                                disabled={isDroppingThis()}
                                                                class="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 rounded-lg text-xs font-bold transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
                                                                title="Unenroll from this class"
                                                            >
                                                                {isDroppingThis() ? 'Dropping...' : '✕ Unenroll'}
                                                            </button>
                                                        }>
                                                            <Show when={!isEnrolledOther()} fallback={
                                                                <span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-[11px] font-semibold border border-neutral-200 dark:border-neutral-700 cursor-not-allowed" title="Already enrolled in this course in another class">
                                                                    Other Class Enrolled
                                                                </span>
                                                            }>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEnroll(t)}
                                                                    disabled={enrollingTeachId() === t.id || isFull() || remainingSKS() < (t.credits ?? 0)}
                                                                    class="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                                                                >
                                                                    {enrollingTeachId() === t.id ? 'Enrolling...' : isFull() ? 'Class Full' : '+ Enroll'}
                                                                </button>
                                                            </Show>
                                                        </Show>
                                                    </td>
                                                </tr>
                                            );
                                        }}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View (below md) */}
                        <div class="block md:hidden divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <For each={filteredTeaches()} fallback={
                                <div class="py-12 px-4 text-center text-neutral-400 font-mono text-xs">
                                    No class offerings available for current semester activity and unit.
                                </div>
                            }>
                                {(t) => {
                                    const isEnrolledThis = () => isEnrolledInThisClass(t.id);
                                    const isEnrolledOther = () => isCourseEnrolledInOtherClass(t.course_id, t.id);
                                    const isFull = () => (t.enrolled_count || 0) >= (t.max_member || 40);
                                    const enrolledDetail = () => enrolledCourses().find(c => c.teach_id === t.id);
                                    const isDroppingThis = () => {
                                        const d = enrolledDetail();
                                        return d ? droppingDetailId() === d.id : false;
                                    };

                                    return (
                                        <div class="p-4 sm:p-5 flex flex-col gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-900/30 transition-colors">
                                            <div class="flex items-start justify-between gap-2">
                                                <div>
                                                    <div class="flex items-center gap-2 flex-wrap mb-1">
                                                        <span class="font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                                                            {t.course_code || '-'}
                                                        </span>
                                                        <span class="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold">
                                                            {t.credits ?? 0} SKS
                                                        </span>
                                                        <span class="px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 font-mono text-[10px] font-semibold">
                                                            Class: {t.class_name || '-'}
                                                        </span>
                                                    </div>
                                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white leading-snug">
                                                        {t.course_name || t.name || '-'}
                                                    </h3>
                                                </div>

                                                <Show when={!isEnrolledThis()} fallback={
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const d = enrolledDetail();
                                                            if (d) openDropModal({
                                                                detailId: d.id,
                                                                courseName: t.course_name || t.name || 'Course',
                                                                courseCode: t.course_code,
                                                                className: t.class_name,
                                                                credit: t.credits,
                                                                lecturerName: t.lecturer_name,
                                                            });
                                                        }}
                                                        disabled={isDroppingThis()}
                                                        class="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-300 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800/60 rounded-xl text-[10px] font-bold transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                                        title="Unenroll from this class"
                                                    >
                                                        {isDroppingThis() ? '...' : '✕ Unenroll'}
                                                    </button>
                                                }>
                                                    <Show when={!isEnrolledOther()} fallback={
                                                        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-500 text-[10px] font-semibold border border-neutral-200 dark:border-neutral-700 shrink-0 cursor-not-allowed">
                                                            Other Class
                                                        </span>
                                                    }>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleEnroll(t)}
                                                            disabled={enrollingTeachId() === t.id || isFull() || remainingSKS() < (t.credits ?? 0)}
                                                            class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                                                        >
                                                            {enrollingTeachId() === t.id ? '...' : isFull() ? 'Full' : '+ Enroll'}
                                                        </button>
                                                    </Show>
                                                </Show>
                                            </div>

                                            <div class="text-xs text-neutral-600 dark:text-neutral-300 flex items-start gap-1.5">
                                                <span class="text-neutral-400 dark:text-neutral-500 shrink-0 font-medium text-[11px]">Lecturer:</span>
                                                <span class="text-[11px]">{t.lecturer_name || '-'}</span>
                                            </div>

                                            <div class="grid grid-cols-2 gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-700/40 text-xs">
                                                <div class="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                    <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">Schedule / Room</span>
                                                    <span class="text-[11px] text-neutral-800 dark:text-neutral-200 block truncate">
                                                        {t.schedule_time !== '-' ? t.schedule_time : ''} {t.room_name !== '-' ? `(${t.room_name})` : ''}
                                                        {t.schedule_time === '-' && t.room_name === '-' ? '-' : ''}
                                                    </span>
                                                </div>

                                                <div class="p-2 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/50 dark:border-neutral-700/50">
                                                    <span class="text-[9px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">Quota Enrolled</span>
                                                    <span class={`font-mono font-bold text-xs ${isFull() ? 'text-red-500' : 'text-neutral-800 dark:text-neutral-200'}`}>
                                                        {t.enrolled_count ?? 0} / {t.max_member ?? '-'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </Show>
                </div>
            </main>

            {/* Confirmation Modal for Unenroll / Drop */}
            <Show when={targetToDrop()}>
                {(item) => (
                    <div 
                        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-150"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) closeDropModal();
                        }}
                    >
                        <div class="w-full max-w-md bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 shadow-2xl overflow-hidden p-6 space-y-5 transform animate-in zoom-in-95 duration-150">
                            <div class="flex items-start gap-4">
                                <div class="size-11 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                                    <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div class="space-y-1 min-w-0">
                                    <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                        Confirm Unenroll Class
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                        Are you sure you want to unenroll from this course? It will be removed from your study plan.
                                    </p>
                                </div>
                            </div>

                            {/* Details summary card */}
                            <div class="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2">
                                <div class="flex items-center justify-between gap-2">
                                    <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                                        {item().courseCode || '-'}
                                    </span>
                                    <div class="flex items-center gap-1.5">
                                        <Show when={item().credit !== undefined && item().credit !== null}>
                                            <span class="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 text-[10px] font-mono font-bold">
                                                {item().credit} SKS
                                            </span>
                                        </Show>
                                        <Show when={item().className && item().className !== '-'}>
                                            <span class="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 text-[10px] font-mono font-semibold">
                                                Class {item().className}
                                            </span>
                                        </Show>
                                    </div>
                                </div>
                                <h4 class="text-sm font-bold text-neutral-900 dark:text-white">
                                    {item().courseName}
                                </h4>
                                <Show when={item().lecturerName && item().lecturerName !== '-'}>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        {item().lecturerName}
                                    </p>
                                </Show>
                            </div>

                            <div class="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={closeDropModal}
                                    disabled={droppingDetailId() !== null}
                                    class="px-4 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDrop}
                                    disabled={droppingDetailId() !== null}
                                    class="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 rounded-xl transition-colors shadow-xs disabled:opacity-50 inline-flex items-center gap-1.5"
                                >
                                    {droppingDetailId() ? 'Unenrolling...' : 'Yes, Unenroll'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </Show>
        </div>
    );
}
