import { createSignal, createEffect, createMemo, onMount, For, Show } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import {
    getTeachById,
    getCourseById,
    listActivities,
    listAcademicYears
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import {
    listTeachEvaluations,
    createTeachEvaluation,
    updateTeachEvaluation,
    deleteTeachEvaluation,
    TeachEvaluationItem
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachEvaluationController';
import {
    listDetailActivities,
    updateDetailActivity,
    DetailActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import {
    listDetailActivityEvaluationComponents,
    createDetailActivityEvaluationComponent,
    updateDetailActivityEvaluationComponent,
    DetailActivityEvaluationComponentItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityEvaluationComponentController';
import {
    listGrades,
    GradeItem
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';

interface StudentGradeRow {
    detail_activity_id: string;
    student_id?: string;
    student_name: string;
    student_code: string;
    is_lock: boolean;
    credit: number;
    // Map from teach_evaluation_id -> { id?: string, mark: number, percentage: number }
    component_scores: Record<string, {
        id?: string;
        mark: number;
        percentage: number;
    }>;
    calculated_mark: number;
    grade_id?: string | null;
    grade_letter?: string;
    grade_point?: number;
    is_saving?: boolean;
    is_dirty?: boolean;
}

export default function LecturerTeachGradePage() {
    const [searchParams] = useSearchParams();
    const teachId = () => (searchParams.id || searchParams.teach_id || '') as string;

    const [isLoading, setIsLoading] = createSignal(true);
    const [isSavingAll, setIsSavingAll] = createSignal(false);
    const [actionMessage, setActionMessage] = createSignal<{ type: 'success' | 'error'; text: string } | null>(null);

    // Teach info
    const [teachData, setTeachData] = createSignal<any>(null);
    const [courseData, setCourseData] = createSignal<any>(null);
    const [academicYearName, setAcademicYearName] = createSignal<string>('');

    // Reference data
    const [evaluations, setEvaluations] = createSignal<TeachEvaluationItem[]>([]);
    const [gradingScale, setGradingScale] = createSignal<GradeItem[]>([]);

    // Students rows
    const [studentRows, setStudentRows] = createSignal<StudentGradeRow[]>([]);
    const [searchQuery, setSearchQuery] = createSignal('');

    // Evaluation Component Modal state
    const [isComponentModalOpen, setIsComponentModalOpen] = createSignal(false);
    const [editingComponent, setEditingComponent] = createSignal<Partial<TeachEvaluationItem> | null>(null);
    const [newCompName, setNewCompName] = createSignal('');
    const [newCompWeight, setNewCompWeight] = createSignal<number>(20);
    const [isSubmittingComp, setIsSubmittingComp] = createSignal(false);

    // Lock Confirmation Modal state
    const [isLockModalOpen, setIsLockModalOpen] = createSignal(false);

    // Total Evaluation Weights sum
    const totalEvaluationWeight = createMemo(() => {
        return evaluations().reduce((sum, item) => sum + (Number(item.evaluation_weight) || 0), 0);
    });

    const isWeightValid = createMemo(() => Math.round(totalEvaluationWeight()) === 100);

    // Load initial data
    const loadAllData = async () => {
        const id = teachId();
        if (!id) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setActionMessage(null);

        try {
            // 1. Fetch Teach Detail & Course (academic_course_master.courses)
            const teach = await getTeachById(id);
            setTeachData(teach);

            let course: any = null;
            if (teach?.course_id) {
                course = await getCourseById(teach.course_id);
                setCourseData(course);
            }

            if (teach?.activity_id) {
                const activities = await listActivities();
                const activity = activities.find(a => a.id === teach.activity_id);
                if (activity?.academic_year_id) {
                    const years = await listAcademicYears();
                    const year = years.find(y => y.id === activity.academic_year_id);
                    if (year) {
                        setAcademicYearName(year.name || (year.code ? String(year.code) : ''));
                    }
                }
            }

            // 2. Fetch Grading Scale Reference (academic_campaign_transaction.grades)
            // Filter by academic_campaign_transaction.grades.unit_id where academic_course_master.courses.unit_id
            const courseUnitId = course?.unit_id;
            let sortedGrades: GradeItem[] = [];

            if (courseUnitId) {
                const gradesRes = await listGrades({ unit_id: courseUnitId, page_size: 100 });
                if (gradesRes.data && gradesRes.data.length > 0) {
                    sortedGrades = gradesRes.data.sort((a, b) => b.minimum - a.minimum);
                }
            }

            // Fallback to all grades if unit-specific scale not found
            if (sortedGrades.length === 0) {
                const fallbackRes = await listGrades({ page_size: 100 });
                sortedGrades = (fallbackRes.data || []).sort((a, b) => b.minimum - a.minimum);
            }

            setGradingScale(sortedGrades);

            // 3. Fetch Teach Evaluations (academic_campaign_transaction.teach_evaluations)
            let evalsRes = await listTeachEvaluations({ teach_id: id, page_size: 50 });
            let evals = evalsRes.data || [];

            // If no evaluations exist, initialize standard default components for the class
            if (evals.length === 0) {
                const defaultComponents = [
                    { name: 'Tugas', evaluation_weight: 20, thread: 1 },
                    { name: 'Kuis', evaluation_weight: 10, thread: 2 },
                    { name: 'Kehadiran & Partisipasi', evaluation_weight: 10, thread: 3 },
                    { name: 'UTS', evaluation_weight: 30, thread: 4 },
                    { name: 'UAS', evaluation_weight: 30, thread: 5 },
                ];
                for (const comp of defaultComponents) {
                    await createTeachEvaluation({
                        teach_id: id,
                        name: comp.name,
                        evaluation_weight: comp.evaluation_weight,
                        thread: comp.thread,
                    });
                }
                evalsRes = await listTeachEvaluations({ teach_id: id, page_size: 50 });
                evals = evalsRes.data || [];
            }
            setEvaluations(evals.sort((a, b) => (a.thread || 0) - (b.thread || 0)));

            // 4. Fetch Enrolled Students Detail Activities (academic_student_campaign.detail_activities)
            const detailActivitiesRes = await listDetailActivities({ teach_id: id, page_size: 300 });
            const details = detailActivitiesRes.data || [];

            // 5. Fetch all evaluation component marks for enrolled students
            const rows: StudentGradeRow[] = [];
            for (const da of details) {
                const compScoresRes = await listDetailActivityEvaluationComponents({
                    detail_activity_id: da.id,
                    page_size: 100,
                });
                const compScores = compScoresRes.data || [];

                const scoreMap: Record<string, { id?: string; mark: number; percentage: number }> = {};
                for (const ev of evals) {
                    const match = compScores.find(cs => cs.course_evaluation_planning_id === ev.id);
                    scoreMap[ev.id] = {
                        id: match?.id,
                        mark: match?.mark ?? 0,
                        percentage: Number(ev.evaluation_weight) || 0,
                    };
                }

                // Calculate final mark:
                // If evaluation component scores are present, compute weighted mark.
                // Otherwise, use the pre-stored final mark in detail_activities (da.mark).
                let calcMark = 0;
                if (compScores.length > 0 && evals.length > 0) {
                    calcMark = calculateStudentFinalMark(scoreMap, evals);
                } else if (da.mark != null && !isNaN(Number(da.mark))) {
                    calcMark = Number(da.mark);
                }

                // Resolve grade (letter, point, id):
                let gradeInfo = (da.grade_id && sortedGrades.find(g => g.id === da.grade_id))
                    || (da.feeder_grade_id && sortedGrades.find(g => g.id === da.feeder_grade_id))
                    || null;

                let gradeLetter = '-';
                let gradePoint = 0;
                let gradeId = da.grade_id || da.feeder_grade_id || null;

                if (gradeInfo) {
                    gradeLetter = gradeInfo.alphabet_code || gradeInfo.name || '-';
                    gradePoint = gradeInfo.grade ?? 0;
                    gradeId = gradeInfo.id;
                } else if (da.grade) {
                    gradeLetter = da.grade.alphabet_code || da.grade.name || '-';
                    gradePoint = Number(da.grade.grade) || 0;
                    gradeId = da.grade.id || gradeId;
                } else if (calcMark > 0 || (da.mark != null && sortedGrades.length > 0)) {
                    gradeInfo = findGradeForMark(calcMark, sortedGrades);
                    if (gradeInfo) {
                        gradeLetter = gradeInfo.alphabet_code || gradeInfo.name || '-';
                        gradePoint = gradeInfo.grade ?? 0;
                        gradeId = gradeInfo.id;
                    }
                }

                // Student name & NIM resolution
                const resolvedName = da.student_name 
                    || (da.name && !da.name.startsWith('DetailAktifitasPerkuliahan') ? da.name : null)
                    || `Mahasiswa ${rows.length + 1}`;
                const resolvedCode = da.student_nim 
                    || (da.curiculum_detail_sequence ? `NIM: ${da.curiculum_detail_sequence}` : `ID: ${da.id.substring(0, 8)}`);

                rows.push({
                    detail_activity_id: da.id,
                    student_id: da.activity_id,
                    student_name: resolvedName,
                    student_code: resolvedCode,
                    is_lock: Boolean(da.is_lock),
                    credit: Number(da.credit) || 0,
                    component_scores: scoreMap,
                    calculated_mark: calcMark,
                    grade_id: gradeId,
                    grade_letter: gradeLetter,
                    grade_point: gradePoint,
                    is_dirty: false,
                });
            }

            setStudentRows(rows);
        } catch (err: any) {
            console.error('Error loading teach grade data:', err);
            setActionMessage({
                type: 'error',
                text: 'Gagal memuat data penilaian pengajaran. Silakan coba lagi.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        loadAllData();
    });

    // Helper: calculate weighted mark
    const calculateStudentFinalMark = (
        scoreMap: Record<string, { id?: string; mark: number; percentage: number }>,
        evalList: TeachEvaluationItem[]
    ): number => {
        let total = 0;
        for (const ev of evalList) {
            const scoreObj = scoreMap[ev.id];
            const weight = Number(ev.evaluation_weight) || 0;
            const mark = scoreObj ? Number(scoreObj.mark) || 0 : 0;
            total += (mark * weight) / 100;
        }
        return Math.round(total * 100) / 100;
    };

    // Helper: find grade letter from grading scale
    const findGradeForMark = (mark: number, scale: GradeItem[]): GradeItem | null => {
        if (!scale || scale.length === 0) return null;
        for (const g of scale) {
            if (mark >= g.minimum && mark <= g.maximum) {
                return g;
            }
        }
        // Fallback to lowest or highest
        if (mark >= scale[0].maximum) return scale[0];
        return scale[scale.length - 1];
    };

    // Handle student component score change
    const handleScoreChange = (rowIndex: number, evalId: string, newMarkVal: string) => {
        const numVal = Math.min(100, Math.max(0, Number(newMarkVal) || 0));
        const currentRows = [...studentRows()];
        const targetRow = { ...currentRows[rowIndex] };

        const targetScores = { ...targetRow.component_scores };
        const evalItem = evaluations().find(e => e.id === evalId);
        const weight = Number(evalItem?.evaluation_weight) || 0;

        targetScores[evalId] = {
            ...targetScores[evalId],
            mark: numVal,
            percentage: weight,
        };

        targetRow.component_scores = targetScores;
        targetRow.calculated_mark = calculateStudentFinalMark(targetScores, evaluations());

        const gradeInfo = findGradeForMark(targetRow.calculated_mark, gradingScale());
        if (gradeInfo) {
            targetRow.grade_id = gradeInfo.id;
            targetRow.grade_letter = gradeInfo.alphabet_code || gradeInfo.name;
            targetRow.grade_point = gradeInfo.grade;
        }
        targetRow.is_dirty = true;

        currentRows[rowIndex] = targetRow;
        setStudentRows(currentRows);
    };

    // Save individual student row
    const saveStudentRow = async (rowIndex: number) => {
        const row = studentRows()[rowIndex];
        if (!row) return;

        // Set row saving
        const updatingRows = [...studentRows()];
        updatingRows[rowIndex].is_saving = true;
        setStudentRows(updatingRows);

        try {
            // 1. Save all component scores in detail_activity_evaluation_components
            for (const ev of evaluations()) {
                const comp = row.component_scores[ev.id];
                const mark = Number(comp?.mark) || 0;
                const weight = Number(ev.evaluation_weight) || 0;
                const total = (mark * weight) / 100;

                if (comp?.id) {
                    await updateDetailActivityEvaluationComponent(comp.id, {
                        mark,
                        percentage: weight,
                        total,
                        name: ev.name || '',
                    });
                } else {
                    const createRes = await createDetailActivityEvaluationComponent({
                        detail_activity_id: row.detail_activity_id,
                        course_evaluation_planning_id: ev.id,
                        mark,
                        percentage: weight,
                        total,
                        name: ev.name || '',
                    });
                    if (createRes.data?.id) {
                        comp.id = createRes.data.id;
                    }
                }
            }

            // 2. Save final mark & grade in detail_activities
            await updateDetailActivity(row.detail_activity_id, {
                mark: row.calculated_mark,
                grade_id: row.grade_id || undefined,
            });

            // Mark as not dirty
            const finishedRows = [...studentRows()];
            finishedRows[rowIndex].is_saving = false;
            finishedRows[rowIndex].is_dirty = false;
            setStudentRows(finishedRows);

            setActionMessage({
                type: 'success',
                text: `Nilai ${row.student_name} berhasil disimpan.`,
            });
        } catch (err: any) {
            console.error('Error saving student row:', err);
            const finishedRows = [...studentRows()];
            finishedRows[rowIndex].is_saving = false;
            setStudentRows(finishedRows);

            setActionMessage({
                type: 'error',
                text: `Gagal menyimpan nilai ${row.student_name}.`,
            });
        }
    };

    // Batch Save All Students Grades
    const handleSaveAll = async () => {
        setIsSavingAll(true);
        setActionMessage(null);

        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < studentRows().length; i++) {
            const row = studentRows()[i];
            if (!row.is_dirty) continue;

            try {
                for (const ev of evaluations()) {
                    const comp = row.component_scores[ev.id];
                    const mark = Number(comp?.mark) || 0;
                    const weight = Number(ev.evaluation_weight) || 0;
                    const total = (mark * weight) / 100;

                    if (comp?.id) {
                        await updateDetailActivityEvaluationComponent(comp.id, {
                            mark,
                            percentage: weight,
                            total,
                            name: ev.name || '',
                        });
                    } else {
                        const createRes = await createDetailActivityEvaluationComponent({
                            detail_activity_id: row.detail_activity_id,
                            course_evaluation_planning_id: ev.id,
                            mark,
                            percentage: weight,
                            total,
                            name: ev.name || '',
                        });
                        if (createRes.data?.id) {
                            comp.id = createRes.data.id;
                        }
                    }
                }

                await updateDetailActivity(row.detail_activity_id, {
                    mark: row.calculated_mark,
                    grade_id: row.grade_id || undefined,
                });

                row.is_dirty = false;
                successCount++;
            } catch (err) {
                failCount++;
            }
        }

        setStudentRows([...studentRows()]);
        setIsSavingAll(false);

        if (failCount === 0) {
            setActionMessage({
                type: 'success',
                text: `Semua nilai mahasiswa (${successCount} data) berhasil disimpan ke sistem.`,
            });
        } else {
            setActionMessage({
                type: 'error',
                text: `Tersimpan: ${successCount}, Gagal: ${failCount}. Silakan periksa kembali.`,
            });
        }
    };

    // Finalize / Lock all grades (Lecturer cannot unlock once locked)
    const handleLockGrades = async () => {
        setIsLockModalOpen(false);
        setIsLoading(true);

        try {
            for (const row of studentRows()) {
                await updateDetailActivity(row.detail_activity_id, {
                    is_lock: true,
                });
            }

            setStudentRows(prev => prev.map(r => ({ ...r, is_lock: true, is_dirty: false })));
            setActionMessage({
                type: 'success',
                text: 'Nilai kelas berhasil dikunci dan difinalisasi secara permanen. Pengubahan atau pembukaan kunci hanya dapat dilakukan oleh Administrator.',
            });
        } catch (err) {
            setActionMessage({
                type: 'error',
                text: 'Gagal mengunci nilai kelas. Silakan coba lagi.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Component Management Modal Actions
    const openAddComponentModal = () => {
        setEditingComponent(null);
        setNewCompName('');
        setNewCompWeight(20);
        setIsComponentModalOpen(true);
    };

    const openEditComponentModal = (comp: TeachEvaluationItem) => {
        setEditingComponent(comp);
        setNewCompName(comp.name || '');
        setNewCompWeight(Number(comp.evaluation_weight) || 0);
        setIsComponentModalOpen(true);
    };

    const handleSaveComponent = async (e: Event) => {
        e.preventDefault();
        const id = teachId();
        if (!id || !newCompName().trim()) return;

        setIsSubmittingComp(true);
        try {
            const comp = editingComponent();
            if (comp?.id) {
                await updateTeachEvaluation(comp.id, {
                    name: newCompName().trim(),
                    evaluation_weight: Number(newCompWeight()) || 0,
                    teach_id: id,
                });
            } else {
                await createTeachEvaluation({
                    teach_id: id,
                    name: newCompName().trim(),
                    evaluation_weight: Number(newCompWeight()) || 0,
                    thread: evaluations().length + 1,
                });
            }

            setIsComponentModalOpen(false);
            await loadAllData();
            setActionMessage({
                type: 'success',
                text: 'Komponen evaluasi kelas berhasil diperbarui.',
            });
        } catch (err) {
            setActionMessage({
                type: 'error',
                text: 'Gagal menyimpan komponen evaluasi.',
            });
        } finally {
            setIsSubmittingComp(false);
        }
    };

    const handleDeleteComponent = async (compId: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus komponen penilaian ini?')) return;
        try {
            await deleteTeachEvaluation(compId);
            await loadAllData();
            setActionMessage({
                type: 'success',
                text: 'Komponen penilaian berhasil dihapus.',
            });
        } catch (err) {
            setActionMessage({
                type: 'error',
                text: 'Gagal menghapus komponen penilaian.',
            });
        }
    };

    // Filtered student list for search
    const filteredStudents = createMemo(() => {
        const query = searchQuery().toLowerCase().trim();
        if (!query) return studentRows();
        return studentRows().filter(r =>
            (r.student_name && r.student_name.toLowerCase().includes(query)) ||
            (r.student_code && r.student_code.toLowerCase().includes(query)) ||
            (r.grade_letter && r.grade_letter.toLowerCase().includes(query))
        );
    });

    // Statistics
    const classStats = createMemo(() => {
        const rows = studentRows();
        if (rows.length === 0) return { avg: 0, highest: 0, lowest: 0, gradedCount: 0 };
        const marks = rows.map(r => r.calculated_mark);
        const sum = marks.reduce((a, b) => a + b, 0);
        const graded = rows.filter(r => r.calculated_mark > 0).length;
        return {
            avg: Math.round((sum / rows.length) * 10) / 10,
            highest: Math.max(...marks),
            lowest: Math.min(...marks),
            gradedCount: graded,
        };
    });

    const isClassLocked = createMemo(() => {
        return studentRows().length > 0 && studentRows().every(r => r.is_lock);
    });

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Breadcrumbs & Navigation Header */}
                <div class="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <A href="/lecturer/dashboard" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Dashboard
                        </A>
                        <span>/</span>
                        <A href="/lecturer/academic/campaign/transaction/teach" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Pengajaran
                        </A>
                        <span>/</span>
                        <span class="font-bold text-neutral-900 dark:text-white">
                            Form Penilaian Mahasiswa
                        </span>
                    </div>

                    <div class="flex items-center gap-2">
                        <A
                            href="/lecturer/academic/campaign/transaction/teach"
                            class="px-3 py-1.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1.5"
                        >
                            <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Daftar Kelas
                        </A>
                        <A
                            href={`/lecturer/academic/campaign/transaction/teach/show?id=${teachId()}`}
                            class="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                            Presensi & Roster →
                        </A>
                    </div>
                </div>

                {/* Notification Alert Banner */}
                <Show when={actionMessage()}>
                    {(msg) => (
                        <div class={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${msg().type === 'success'
                                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                            }`}>
                            <div class="flex items-center gap-2">
                                <span class="text-base">{msg().type === 'success' ? '✓' : '⚠️'}</span>
                                <span>{msg().text}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setActionMessage(null)}
                                class="p-1 hover:bg-black/5 dark:hover:bg-white/10 rounded-lg text-xs"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                </Show>

                {/* Class Overview Hero Card */}
                <div class="rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 p-6 sm:p-8 shadow-2xs space-y-6">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 flex-wrap">
                                <span class="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                    {courseData()?.code ? `${courseData().code} • ${courseData().name}` : (teachData()?.name || 'PENILAIAN KELAS')}
                                </span>
                                <Show when={courseData()?.total_credit}>
                                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-mono">
                                        {courseData().total_credit} SKS
                                    </span>
                                </Show>
                                <Show when={academicYearName()}>
                                    <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                                        {academicYearName()}
                                    </span>
                                </Show>
                                <span class="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-mono">
                                    {studentRows().length} Mahasiswa
                                </span>
                                <span class={`px-2.5 py-1 rounded-lg text-xs font-bold ${isClassLocked()
                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                    }`}>
                                    {isClassLocked() ? '🔒 Nilai Terkunci' : '📝 Status Terbuka (Draft)'}
                                </span>
                            </div>

                            <h1 class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                                Form Penilaian & Evaluasi Perkuliahan
                            </h1>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                Kelola bobot penilaian dan input nilai akhir mahasiswa per komponen evaluasi perkuliahan.
                            </p>
                        </div>

                        {/* Top Action Buttons */}
                        <div class="flex items-center gap-2.5 shrink-0 flex-wrap">
                            <button
                                type="button"
                                onClick={openAddComponentModal}
                                disabled={isClassLocked()}
                                class="px-4 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold text-neutral-700 dark:text-neutral-200 transition-colors inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <svg class="size-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                                Kelola Komponen
                            </button>

                            <Show
                                when={isClassLocked()}
                                fallback={
                                    <button
                                        type="button"
                                        onClick={() => setIsLockModalOpen(true)}
                                        disabled={isSavingAll() || studentRows().length === 0}
                                        class="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900 text-xs font-bold text-amber-800 dark:text-amber-200 transition-colors inline-flex items-center gap-2 disabled:opacity-50"
                                    >
                                        🔒 Kunci Nilai Kelas
                                    </button>
                                }
                            >
                                <div
                                    class="px-4 py-2.5 rounded-xl border border-amber-300/80 dark:border-amber-700/80 bg-amber-50/80 dark:bg-amber-950/50 text-xs font-bold text-amber-800 dark:text-amber-300 inline-flex items-center gap-2 cursor-not-allowed select-none"
                                    title="Nilai telah dikunci dan difinalisasi. Dosen tidak dapat membuka kunci nilai."
                                >
                                    🔒 Nilai Terkunci (Final)
                                </div>
                            </Show>

                            <button
                                type="button"
                                onClick={handleSaveAll}
                                disabled={isSavingAll() || isClassLocked()}
                                class="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all inline-flex items-center gap-2"
                            >
                                <Show when={isSavingAll()} fallback={<span>💾 Simpan Semua Nilai</span>}>
                                    <div class="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Menyimpan...</span>
                                </Show>
                            </button>
                        </div>
                    </div>

                    {/* Locked Notice Alert for Lecturer */}
                    <Show when={isClassLocked()}>
                        <div class="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3 shadow-2xs">
                            <span class="text-lg shrink-0">🔒</span>
                            <div class="space-y-0.5">
                                <h4 class="font-bold">Nilai Perkuliahan Telah Dikunci & Difinalisasi</h4>
                                <p class="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                                    Sesuai aturan akademik, dosen tidak dapat membuka kunci atau mengubah nilai yang telah dikunci. Jika diperlukan perbaikan nilai, silakan hubungi <strong>Administrator / Bagian Akademik</strong> untuk membuka kunci kelas ini.
                                </p>
                            </div>
                        </div>
                    </Show>

                    {/* Class Stats Row */}
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100 dark:border-neutral-700/60">
                        <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">Rata-Rata Kelas</span>
                            <span class="text-xl font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                                {classStats().avg}
                            </span>
                        </div>
                        <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">Nilai Tertinggi</span>
                            <span class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                                {classStats().highest}
                            </span>
                        </div>
                        <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">Mahasiswa Dinilai</span>
                            <span class="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-0.5 block">
                                {classStats().gradedCount} / {studentRows().length}
                            </span>
                        </div>
                        <div class="p-4 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60">
                            <span class="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block">Total Bobot Evaluasi</span>
                            <div class="flex items-center gap-1.5 mt-0.5">
                                <span class={`text-xl font-bold font-mono ${isWeightValid() ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                    {totalEvaluationWeight()}%
                                </span>
                                <Show when={!isWeightValid()}>
                                    <span class="text-[10px] text-rose-500 font-bold">(Wajib 100%)</span>
                                </Show>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Evaluation Components Badges Bar */}
                <div class="p-4 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-3">
                    <div class="flex items-center justify-between gap-4 flex-wrap">
                        <div class="flex items-center gap-2">
                            <span class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Komponen Evaluasi Perkuliahan:
                            </span>
                            <Show when={!isWeightValid()}>
                                <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                                    Total bobot {totalEvaluationWeight()}% (Harus 100%)
                                </span>
                            </Show>
                        </div>
                        <button
                            type="button"
                            onClick={openAddComponentModal}
                            class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                        >
                            + Tambah / Edit Komponen
                        </button>
                    </div>

                    <div class="flex items-center gap-2.5 flex-wrap">
                        <For each={evaluations()}>
                            {(ev) => (
                                <div class="px-3 py-1.5 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2 group text-xs">
                                    <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                                        {ev.name}
                                    </span>
                                    <span class="px-1.5 py-0.5 rounded-md font-mono font-bold text-[10px] bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                                        {ev.evaluation_weight}%
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => openEditComponentModal(ev)}
                                        class="text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                                        title="Edit Komponen"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => ev.id && handleDeleteComponent(ev.id)}
                                        class="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title="Hapus Komponen"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            )}
                        </For>
                    </div>
                </div>

                {/* Grade Table Controls (Search & Quick Actions) */}
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <div class="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Cari mahasiswa berdasarkan nama, NIM, atau Grade..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 rounded-2xl text-xs text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
                        />
                        <svg class="size-4 absolute left-3 top-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <Show when={searchQuery()}>
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                class="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-600 text-xs"
                            >
                                ✕
                            </button>
                        </Show>
                    </div>

                    <div class="flex items-center gap-2 self-end sm:self-auto">
                        <span class="text-xs text-neutral-500 font-mono">
                            Menampilkan {filteredStudents().length} dari {studentRows().length} mahasiswa
                        </span>
                    </div>
                </div>

                {/* Main Grading Table Roster */}
                <div class="rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 overflow-hidden shadow-2xs">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="py-24 text-center flex flex-col items-center justify-center gap-3">
                                <div class="size-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <span class="text-xs font-mono text-neutral-400">Memuat form penilaian mahasiswa...</span>
                            </div>
                        }
                    >
                        <Show
                            when={filteredStudents().length > 0}
                            fallback={
                                <div class="p-16 text-center space-y-3">
                                    <div class="size-14 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-2xl">
                                        👥
                                    </div>
                                    <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                        Belum Ada Mahasiswa Terdaftar
                                    </h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                                        {searchQuery()
                                            ? `Tidak ada mahasiswa yang cocok dengan pencarian "${searchQuery()}".`
                                            : 'Kelas pengajaran ini belum memiliki mahasiswa yang terdaftar di rencana studi.'}
                                    </p>
                                </div>
                            }
                        >
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs">
                                    <thead class="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-700 text-neutral-500 font-mono uppercase tracking-wider text-[11px]">
                                        <tr>
                                            <th class="px-4 py-4 font-bold text-center w-12">No.</th>
                                            <th class="px-6 py-4 font-bold min-w-[220px]">Mahasiswa</th>
                                            {/* Dynamic Component Headers */}
                                            <For each={evaluations()}>
                                                {(ev) => (
                                                    <th class="px-4 py-4 font-bold text-center min-w-[110px]">
                                                        <div>{ev.name}</div>
                                                        <div class="text-[9px] font-normal text-indigo-600 dark:text-indigo-400 lowercase">
                                                            ({ev.evaluation_weight}%)
                                                        </div>
                                                    </th>
                                                )}
                                            </For>
                                            <th class="px-4 py-4 font-bold text-center min-w-[90px] bg-indigo-50/50 dark:bg-indigo-950/20">
                                                Nilai Akhir
                                            </th>
                                            <th class="px-4 py-4 font-bold text-center min-w-[80px] bg-purple-50/50 dark:bg-purple-950/20">
                                                Grade
                                            </th>
                                            <th class="px-4 py-4 font-bold text-center min-w-[80px]">Status</th>
                                            <th class="px-4 py-4 font-bold text-right min-w-[90px]">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200/60 dark:divide-neutral-700/60">
                                        <For each={filteredStudents()}>
                                            {(student, index) => {
                                                const rawIndex = () => studentRows().findIndex(r => r.detail_activity_id === student.detail_activity_id);

                                                return (
                                                    <tr class={`hover:bg-neutral-50/80 dark:hover:bg-neutral-750/50 transition-colors ${student.is_dirty ? 'bg-amber-50/40 dark:bg-amber-950/20' : ''
                                                        }`}>
                                                        {/* Number */}
                                                        <td class="px-4 py-3.5 text-center font-mono text-neutral-400 font-medium">
                                                            {index() + 1}
                                                        </td>

                                                        {/* Student Name & Code */}
                                                        <td class="px-6 py-3.5">
                                                            <div class="space-y-0.5">
                                                                <h4 class="font-bold text-neutral-900 dark:text-white">
                                                                    {student.student_name}
                                                                </h4>
                                                                <div class="flex items-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                                                                    <span>{student.student_code}</span>
                                                                    <Show when={student.credit > 0}>
                                                                        <span>•</span>
                                                                        <span>{student.credit} SKS</span>
                                                                    </Show>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* Dynamic Evaluation Component Inputs */}
                                                        <For each={evaluations()}>
                                                            {(ev) => {
                                                                const score = () => student.component_scores[ev.id]?.mark ?? 0;

                                                                return (
                                                                    <td class="px-3 py-2 text-center">
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            max="100"
                                                                            step="0.1"
                                                                            value={score()}
                                                                            disabled={student.is_lock}
                                                                            onInput={(e) => handleScoreChange(rawIndex(), ev.id, e.currentTarget.value)}
                                                                            class={`w-20 px-2.5 py-1.5 text-center font-mono font-bold text-xs rounded-xl border transition-all ${student.is_lock
                                                                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-200 dark:border-neutral-700 cursor-not-allowed'
                                                                                    : 'bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white border-neutral-200 dark:border-neutral-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500'
                                                                                }`}
                                                                        />
                                                                    </td>
                                                                );
                                                            }}
                                                        </For>

                                                        {/* Calculated Final Mark */}
                                                        <td class="px-4 py-3.5 text-center font-mono font-bold text-xs text-indigo-700 dark:text-indigo-300 bg-indigo-50/30 dark:bg-indigo-950/10">
                                                            {student.calculated_mark}
                                                        </td>

                                                        {/* Letter Grade */}
                                                        <td class="px-4 py-3.5 text-center bg-purple-50/30 dark:bg-purple-950/10">
                                                            <span class={`inline-block px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${['A', 'A-', 'B+'].includes(student.grade_letter || '')
                                                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                                    : ['B', 'B-', 'C+'].includes(student.grade_letter || '')
                                                                        ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                                                                        : ['C', 'D'].includes(student.grade_letter || '')
                                                                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                                                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                                                                }`}>
                                                                {student.grade_letter || '-'}
                                                            </span>
                                                        </td>

                                                        {/* Lock / Draft Status */}
                                                        <td class="px-4 py-3.5 text-center">
                                                            <span class={`px-2 py-0.5 rounded-full text-[10px] font-bold ${student.is_lock
                                                                    ? 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300'
                                                                    : student.is_dirty
                                                                        ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                                                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                                                }`}>
                                                                {student.is_lock ? 'Locked' : student.is_dirty ? 'Unsaved' : 'Saved'}
                                                            </span>
                                                        </td>

                                                        {/* Row Action Button */}
                                                        <td class="px-4 py-3.5 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => saveStudentRow(rawIndex())}
                                                                disabled={student.is_lock || !student.is_dirty || student.is_saving}
                                                                class="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-semibold text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1"
                                                            >
                                                                <Show when={student.is_saving} fallback={<span>Simpan</span>}>
                                                                    <div class="size-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                                                </Show>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </Show>
                    </Show>
                </div>

                {/* Grading Scale Reference Breakdown Modal / Card */}
                <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-4">
                    <div class="flex items-center justify-between gap-2 flex-wrap">
                        <div class="space-y-0.5">
                            <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                Pedoman Skala Penilaian & Konversi Nilai (Grades Reference):
                            </h3>
                            <p class="text-[11px] text-neutral-400">
                                Berdasarkan skala program studi / unit perkuliahan (<span class="font-mono font-semibold text-neutral-600 dark:text-neutral-300">academic_campaign_transaction.grades.unit_id</span>).
                            </p>
                        </div>
                        <Show when={courseData()?.unit_id}>
                            <span class="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                Unit ID: {courseData()?.unit_id}
                            </span>
                        </Show>
                    </div>

                    <Show
                        when={gradingScale().length > 0}
                        fallback={
                            <div class="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 text-center text-xs text-neutral-500">
                                Belum ada skala penilaian yang dikonfigurasi untuk unit program studi ini.
                            </div>
                        }
                    >
                        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                            <For each={gradingScale()}>
                                {(g) => (
                                    <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 text-center space-y-1 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors">
                                        <span class="text-base font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                                            {g.alphabet_code || g.name}
                                        </span>
                                        <div class="text-xs font-mono font-bold text-neutral-700 dark:text-neutral-200">
                                            {g.minimum} - {g.maximum}
                                        </div>
                                        <div class="text-[10px] text-neutral-400 font-mono">
                                            Indeks: {g.grade}
                                        </div>
                                    </div>
                                )}
                            </For>
                        </div>
                    </Show>
                </div>
            </main>

            {/* Modal: Kelola Komponen Penilaian (Teach Evaluations) */}
            <Show when={isComponentModalOpen()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div class="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-xl space-y-5">
                        <div class="flex items-center justify-between">
                            <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
                                {editingComponent() ? 'Edit Komponen Penilaian' : 'Tambah Komponen Penilaian'}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsComponentModalOpen(false)}
                                class="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveComponent} class="space-y-4">
                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                    Nama Komponen (e.g. Tugas, UTS, UAS, Praktikum)
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Tugas Mandiri"
                                    value={newCompName()}
                                    onInput={(e) => setNewCompName(e.currentTarget.value)}
                                    class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div class="space-y-1.5">
                                <label class="text-xs font-bold text-neutral-700 dark:text-neutral-300">
                                    Bobot Penilaian (%)
                                </label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    required
                                    value={newCompWeight()}
                                    onInput={(e) => setNewCompWeight(Number(e.currentTarget.value))}
                                    class="w-full px-3.5 py-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
                                />
                                <span class="text-[11px] text-neutral-400">
                                    Total akumulasi seluruh komponen harus mencapai 100%.
                                </span>
                            </div>

                            <div class="pt-2 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsComponentModalOpen(false)}
                                    class="px-4 py-2 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmittingComp() || !newCompName().trim()}
                                    class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm disabled:opacity-50 transition-colors"
                                >
                                    {isSubmittingComp() ? 'Menyimpan...' : 'Simpan Komponen'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* Modal: Konfirmasi Kunci Nilai */}
            <Show when={isLockModalOpen()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
                    <div class="w-full max-w-md bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-7 border border-neutral-200 dark:border-neutral-700 shadow-xl space-y-5 text-center">
                        <div class="size-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center text-2xl">
                            🔒
                        </div>
                        <div class="space-y-2">
                            <h3 class="text-lg font-bold text-neutral-900 dark:text-white">
                                Kunci & Finalisasi Nilai Kelas?
                            </h3>
                            <div class="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed text-left bg-amber-50 dark:bg-amber-950/50 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 space-y-1.5">
                                <p class="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                                    <span>⚠️</span> PERHATIAN PENTING:
                                </p>
                                <p class="text-[11px] text-amber-800 dark:text-amber-300">
                                    Setelah nilai dikunci, dosen <strong>TIDAK DAPAT MEMBUKA KUNCI</strong> atau mengubah nilai secara mandiri. Nilai akan berstatus resmi dan permanen.
                                </p>
                                <p class="text-[11px] text-amber-800 dark:text-amber-300">
                                    Pembukaan kunci dan revisi setelah penguncian hanya dapat dilakukan oleh pihak <strong>Administrator / Bagian Akademik</strong>.
                                </p>
                            </div>
                        </div>
                        <div class="pt-2 flex items-center justify-center gap-2.5">
                            <button
                                type="button"
                                onClick={() => setIsLockModalOpen(false)}
                                class="flex-1 py-2.5 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleLockGrades}
                                class="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-sm transition-colors"
                            >
                                Ya, Kunci Nilai
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
