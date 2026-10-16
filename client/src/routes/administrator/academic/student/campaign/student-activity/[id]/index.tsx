import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    getStudentActivityById,
    updateStudentActivity,
    deleteStudentActivity,
    toggleStudentActivityLock,
    downloadActivityPlanPdf,
    downloadActivityResultPdf,
    StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import {
    listDetailActivities,
    createDetailActivity,
    updateDetailActivity,
    deleteDetailActivity,
    DetailActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignDetailActivityController';
import {
    listTeaches,
    TeachItem
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import {
    listGrades,
    GradeItem
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionGradeController';
import {
    listStudentStatuses,
    listStudyUnits,
    getStudentById,
    StudentMasterItem
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';

export default function AcademicStudentCampaignStudentActivityDetailPage() {
    const params = useParams();
    const navigate = useNavigate();

    // Core Data
    const [activity, setActivity] = createSignal<StudentActivityItem | null>(null);
    const [student, setStudent] = createSignal<StudentMasterItem | null>(null);
    const [detailActivities, setDetailActivities] = createSignal<DetailActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [activeTab, setActiveTab] = createSignal<'krs' | 'info' | 'feeder'>('krs');

    // Reference data
    const [statuses, setStatuses] = createSignal<any[]>([]);
    const [studyUnits, setStudyUnits] = createSignal<any[]>([]);
    const [grades, setGrades] = createSignal<GradeItem[]>([]);

    // Loading indicators
    const [isLocking, setIsLocking] = createSignal(false);
    const [isPrintingKrs, setIsPrintingKrs] = createSignal(false);
    const [isPrintingKhs, setIsPrintingKhs] = createSignal(false);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Modals
    const [showEditActivityModal, setShowEditActivityModal] = createSignal(false);
    const [showDeleteModal, setShowDeleteModal] = createSignal(false);
    const [showAddCourseModal, setShowAddCourseModal] = createSignal(false);
    const [showEditGradeModal, setShowEditGradeModal] = createSignal(false);
    const [showDropCourseModal, setShowDropCourseModal] = createSignal(false);
    const [selectedDetail, setSelectedDetail] = createSignal<DetailActivityItem | null>(null);

    // Edit Activity Form
    const [formStatusId, setFormStatusId] = createSignal('');
    const [formUnitId, setFormUnitId] = createSignal('');
    const [formSks, setFormSks] = createSignal<number>(0);
    const [formGrandSks, setFormGrandSks] = createSignal<number>(0);
    const [formIps, setFormIps] = createSignal<number>(0);
    const [formIpk, setFormIpk] = createSignal<number>(0);
    const [formFinanceFee, setFormFinanceFee] = createSignal<number>(0);
    const [formIsLock, setFormIsLock] = createSignal(false);

    // Add Course Form
    const [availableTeaches, setAvailableTeaches] = createSignal<TeachItem[]>([]);
    const [isSearchingTeaches, setIsSearchingTeaches] = createSignal(false);
    const [teachSearchQuery, setTeachSearchQuery] = createSignal('');
    const [selectedTeachId, setSelectedTeachId] = createSignal('');
    const [selectedCourseId, setSelectedCourseId] = createSignal('');
    const [selectedCourseCredit, setSelectedCourseCredit] = createSignal<number>(3);
    const [selectedCourseName, setSelectedCourseName] = createSignal('');

    // Edit Grade Form
    const [formGradeMark, setFormGradeMark] = createSignal<number>(0);
    const [formGradeId, setFormGradeId] = createSignal('');
    const [formGradeCredit, setFormGradeCredit] = createSignal<number>(0);

    // Fetch single activity details
    const loadActivityData = async () => {
        const id = params.id;
        if (!id) return;
        setIsLoading(true);
        try {
            const data = await getStudentActivityById(id);
            if (!data) {
                toast.danger('Data aktivitas kuliah tidak ditemukan');
                navigate('/administrator/academic/student/campaign/student-activity');
                return;
            }
            setActivity(data);

            // Set detail activities from embedded response or fetch
            if (data.detail_activities && Array.isArray(data.detail_activities)) {
                setDetailActivities(data.detail_activities);
            } else {
                const detailsRes = await listDetailActivities({ activity_id: id, page_size: 100 });
                setDetailActivities(detailsRes.data || []);
            }

            // Load student profile if student_id available
            if (data.student_id) {
                const stdRecord = await getStudentById(data.student_id);
                setStudent(stdRecord);
            }
        } catch (err) {
            console.error('Error fetching student activity detail:', err);
            toast.danger('Gagal memuat detail aktivitas kuliah');
        } finally {
            setIsLoading(false);
        }
    };

    // Load reference data
    const loadReferences = async () => {
        try {
            const [statusList, unitList, gradeList] = await Promise.all([
                listStudentStatuses(),
                listStudyUnits(),
                listGrades({ page: 1, page_size: 50 }),
            ]);
            setStatuses(statusList || []);
            setStudyUnits(unitList || []);
            setGrades(gradeList.data || []);
        } catch (err) {
            console.warn('Error loading references:', err);
        }
    };

    onMount(() => {
        loadActivityData();
        loadReferences();
    });

    // Toggle Lock
    const handleToggleLock = async () => {
        const act = activity();
        if (!act) return;
        setIsLocking(true);
        try {
            const currentLock = Boolean(act.is_lock);
            const res = await toggleStudentActivityLock(act.id, currentLock);
            if (!res.is_error) {
                setActivity(prev => (prev ? { ...prev, is_lock: !currentLock } : null));
                toast.success(`Aktivitas berhasil di-${!currentLock ? 'kunci' : 'buka kuncinya'}`);
            } else {
                toast.danger(res.message || 'Gagal mengubah status kunci');
            }
        } catch {
            toast.danger('Gagal memproses penguncian aktivitas');
        } finally {
            setIsLocking(false);
        }
    };

    // Print KRS
    const handlePrintKrs = async () => {
        const act = activity();
        if (!act) return;
        setIsPrintingKrs(true);
        try {
            const studentCode = act.student_code || act.student_id;
            const filename = `KRS_${studentCode}_${act.academic_year_name || 'Semester'}.pdf`;
            const ok = await downloadActivityPlanPdf(act.id, filename);
            if (ok) {
                toast.success('KRS PDF berhasil diunduh');
            } else {
                toast.danger('Gagal menghasilkan file KRS PDF');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat mengunduh KRS');
        } finally {
            setIsPrintingKrs(false);
        }
    };

    // Print KHS
    const handlePrintKhs = async () => {
        const act = activity();
        if (!act) return;
        setIsPrintingKhs(true);
        try {
            const studentCode = act.student_code || act.student_id;
            const filename = `KHS_${studentCode}_${act.academic_year_name || 'Semester'}.pdf`;
            const ok = await downloadActivityResultPdf(act.id, filename);
            if (ok) {
                toast.success('KHS PDF berhasil diunduh');
            } else {
                toast.danger('Gagal menghasilkan file KHS PDF');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat mengunduh KHS');
        } finally {
            setIsPrintingKhs(false);
        }
    };

    // Open Edit Activity Modal
    const openEditActivityModal = () => {
        const act = activity();
        if (!act) return;
        setFormStatusId(act.status_id || '');
        setFormUnitId(act.unit_id || '');
        setFormSks(act.total_credit || 0);
        setFormGrandSks(act.grand_total_credit || 0);
        setFormIps(act.cumulative_index || 0);
        setFormIpk(act.grand_cumulative_index || 0);
        setFormFinanceFee(act.finance_fee || 0);
        setFormIsLock(Boolean(act.is_lock));
        setShowEditActivityModal(true);
    };

    // Submit Edit Activity
    const handleEditActivitySubmit = async (e: Event) => {
        e.preventDefault();
        const act = activity();
        if (!act) return;

        setIsSubmitting(true);
        try {
            const res = await updateStudentActivity(act.id, {
                status_id: formStatusId(),
                unit_id: formUnitId() || null,
                total_credit: Number(formSks()),
                grand_total_credit: Number(formGrandSks()),
                cumulative_index: Number(formIps()),
                grand_cumulative_index: Number(formIpk()),
                finance_fee: Number(formFinanceFee()),
                is_lock: formIsLock(),
            });

            if (!res.is_error) {
                toast.success('Data aktivitas berhasil diperbarui');
                setShowEditActivityModal(false);
                loadActivityData();
            } else {
                toast.danger(res.message || 'Gagal memperbarui aktivitas');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat menyimpan perubahan');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete Activity
    const handleDeleteActivity = async () => {
        const act = activity();
        if (!act) return;
        setIsSubmitting(true);
        try {
            const res = await deleteStudentActivity(act.id);
            if (!res.is_error) {
                toast.success('Aktivitas mahasiswa berhasil dihapus');
                setShowDeleteModal(false);
                navigate('/administrator/academic/student/campaign/student-activity');
            } else {
                toast.danger(res.message || 'Gagal menghapus aktivitas');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat menghapus aktivitas');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Search Teaches (Classes) for KRS Enrollment
    const searchAvailableTeaches = async (search: string) => {
        setIsSearchingTeaches(true);
        try {
            const res = await listTeaches({
                page: 1,
                page_size: 20,
                name: search.trim() || undefined,
            });
            setAvailableTeaches(res.data || []);
        } catch (err) {
            console.warn('Error fetching classes:', err);
        } finally {
            setIsSearchingTeaches(false);
        }
    };

    // Open Add Course Modal
    const openAddCourseModal = () => {
        setSelectedTeachId('');
        setSelectedCourseId('');
        setSelectedCourseCredit(3);
        setSelectedCourseName('');
        setTeachSearchQuery('');
        setAvailableTeaches([]);
        searchAvailableTeaches('');
        setShowAddCourseModal(true);
    };

    // Submit Add Course (Enroll KRS)
    const handleAddCourseSubmit = async (e: Event) => {
        e.preventDefault();
        const act = activity();
        if (!act) return;
        if (!selectedCourseId()) {
            toast.warning('Pilih mata kuliah terlebih dahulu');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createDetailActivity({
                activity_id: act.id,
                course_id: selectedCourseId(),
                teach_id: selectedTeachId() || undefined,
                name: selectedCourseName() || undefined,
                credit: Number(selectedCourseCredit()),
            });

            if (!res.is_error) {
                toast.success('Mata kuliah berhasil didaftarkan ke KRS');
                setShowAddCourseModal(false);
                loadActivityData();
            } else {
                toast.danger(res.message || 'Gagal mendaftarkan mata kuliah');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat menambahkan mata kuliah ke KRS');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Edit Grade Modal
    const openEditGradeModal = (detail: DetailActivityItem) => {
        setSelectedDetail(detail);
        setFormGradeMark(detail.mark ?? 0);
        setFormGradeId(detail.grade_id || '');
        setFormGradeCredit(detail.credit ?? 3);
        setShowEditGradeModal(true);
    };

    // Submit Edit Grade
    const handleEditGradeSubmit = async (e: Event) => {
        e.preventDefault();
        const detail = selectedDetail();
        if (!detail) return;

        setIsSubmitting(true);
        try {
            const res = await updateDetailActivity(detail.id, {
                mark: Number(formGradeMark()),
                grade_id: formGradeId() || null,
                credit: Number(formGradeCredit()),
            });

            if (!res.is_error) {
                toast.success('Nilai perkuliahan berhasil diperbarui');
                setShowEditGradeModal(false);
                loadActivityData();
            } else {
                toast.danger(res.message || 'Gagal memperbarui nilai');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat menyimpan nilai');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Drop Course Modal
    const openDropCourseModal = (detail: DetailActivityItem) => {
        setSelectedDetail(detail);
        setShowDropCourseModal(true);
    };

    // Submit Drop Course
    const handleDropCourseSubmit = async () => {
        const detail = selectedDetail();
        if (!detail) return;

        setIsSubmitting(true);
        try {
            const res = await deleteDetailActivity(detail.id);
            if (!res.is_error) {
                toast.success('Mata kuliah berhasil dibatalkan dari KRS');
                setShowDropCourseModal(false);
                loadActivityData();
            } else {
                toast.danger(res.message || 'Gagal membatalkan mata kuliah');
            }
        } catch {
            toast.danger('Terjadi kesalahan saat membatalkan mata kuliah');
        } finally {
            setIsSubmitting(false);
        }
    };

    // KRS Calculations
    const totalKrsSks = () => detailActivities().reduce((acc, d) => acc + (d.credit || 0), 0);
    const totalKrsPassedSks = () => {
        return detailActivities()
            .filter(d => (d.grade_point || 0) >= 2.0)
            .reduce((acc, d) => acc + (d.credit || 0), 0);
    };
    const totalQualityPoints = () => {
        return detailActivities().reduce((acc, d) => {
            const cred = d.credit || 0;
            const pt = d.grade_point ?? 0;
            return acc + (cred * pt);
        }, 0);
    };
    const calculatedIps = () => {
        const sks = totalKrsSks();
        if (sks <= 0) return (activity()?.cumulative_index || 0).toFixed(2);
        return (totalQualityPoints() / sks).toFixed(2);
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header & Breadcrumb */}
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                            <A href="/administrator/dashboard" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Administrator</A>
                            <span>/</span>
                            <span>Akademik</span>
                            <span>/</span>
                            <span>Mahasiswa</span>
                            <span>/</span>
                            <A href="/administrator/academic/student/campaign/student-activity" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Aktivitas Kuliah</A>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white truncate max-w-[200px]">
                                {activity()?.student_name || 'Detail Aktivitas'}
                            </span>
                        </nav>
                        <div class="flex items-center gap-3">
                            <A
                                href="/administrator/academic/student/campaign/student-activity"
                                class="p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                                title="Kembali ke Daftar"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </A>
                            <div>
                                <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                    Detail Aktivitas Kuliah Mahasiswa
                                </h1>
                                <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                                    Informasi lengkap riwayat studi semester, kartu rencana studi (KRS), hasil studi (KHS), dan status evaluasi.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 flex-wrap">
                        {/* Lock / Unlock Toggle Button */}
                        <button
                            type="button"
                            disabled={isLocking()}
                            onClick={handleToggleLock}
                            class={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border transition-colors shadow-2xs ${activity()?.is_lock
                                    ? 'bg-amber-50 dark:bg-amber-950/70 border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-200 hover:bg-amber-100'
                                    : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                }`}
                        >
                            <Show
                                when={!isLocking()}
                                fallback={
                                    <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                }
                            >
                                <Show
                                    when={activity()?.is_lock}
                                    fallback={
                                        <svg class="size-3.5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                        </svg>
                                    }
                                >
                                    <svg class="size-3.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </Show>
                            </Show>
                            <span>{activity()?.is_lock ? 'Aktivitas Terkunci' : 'Kunci Aktivitas'}</span>
                        </button>

                        {/* Print KRS Button */}
                        <button
                            type="button"
                            disabled={isPrintingKrs()}
                            onClick={handlePrintKrs}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-purple-300 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 hover:bg-purple-100 transition-colors shadow-2xs disabled:opacity-50"
                        >
                            <Show
                                when={!isPrintingKrs()}
                                fallback={
                                    <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                }
                            >
                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                </svg>
                            </Show>
                            <span>Cetak KRS</span>
                        </button>

                        {/* Print KHS Button */}
                        <button
                            type="button"
                            disabled={isPrintingKhs()}
                            onClick={handlePrintKhs}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors shadow-2xs disabled:opacity-50"
                        >
                            <Show
                                when={!isPrintingKhs()}
                                fallback={
                                    <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                }
                            >
                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </Show>
                            <span>Cetak KHS</span>
                        </button>

                        {/* Edit Button */}
                        <button
                            type="button"
                            onClick={openEditActivityModal}
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                        >
                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Edit Data</span>
                        </button>

                        {/* Delete Button */}
                        <button
                            type="button"
                            onClick={() => setShowDeleteModal(true)}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100 transition-colors shadow-2xs"
                        >
                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Hapus</span>
                        </button>
                    </div>
                </div>

                {/* Hero Card: Student & Activity Overview */}
                <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 shadow-2xs">
                    <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div class="flex items-center gap-4">
                            <div class="size-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-2xl flex items-center justify-center shadow-xs shrink-0">
                                {(activity()?.student_name || 'M').charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div class="flex items-center gap-2 flex-wrap">
                                    <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">
                                        {activity()?.student_name || activity()?.student?.name || activity()?.name || 'Mahasiswa'}
                                    </h2>
                                    <span
                                        class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${(activity()?.status_name || '').toLowerCase().includes('aktif')
                                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                                                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                                            }`}
                                    >
                                        {activity()?.status_name || activity()?.status?.name || 'Aktif'}
                                    </span>

                                    <Show when={activity()?.is_lock}>
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                            <svg class="size-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                            <span>Terkunci</span>
                                        </span>
                                    </Show>
                                </div>

                                <div class="flex items-center gap-3 mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 flex-wrap">
                                    <div class="flex items-center gap-1 font-mono">
                                        <span class="text-neutral-500">NIM:</span>
                                        <span class="font-bold text-neutral-900 dark:text-white">{activity()?.student_code || activity()?.student?.code || '-'}</span>
                                    </div>
                                    <span>•</span>
                                    <div>
                                        <span class="text-neutral-500">Program Studi:</span>{' '}
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                                            {activity()?.unit_name || activity()?.unit?.name || student()?.unit_name || '-'}
                                        </span>
                                    </div>
                                    <span>•</span>
                                    <div>
                                        <span class="text-neutral-500">Periode:</span>{' '}
                                        <span class="font-semibold text-neutral-800 dark:text-neutral-200">
                                            {activity()?.academic_year_name || activity()?.unit_activity?.name || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Show when={activity()?.student_id}>
                            <A
                                href={`/administrator/academic/student/master/student/${activity()?.student_id}`}
                                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                <span>Profil Mahasiswa</span>
                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </A>
                        </Show>
                    </div>
                </div>

                {/* KPI Metrics Row */}
                <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
                    {/* IPS */}
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">IPS Semester</span>
                        <div class="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono mt-1">
                            {Number(activity()?.cumulative_index || calculatedIps()).toFixed(2)}
                        </div>
                        <span class="text-[10px] text-neutral-400 mt-0.5 block">Indeks Prestasi Semester</span>
                    </div>

                    {/* IPK */}
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">IPK Kumulatif</span>
                        <div class="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                            {Number(activity()?.grand_cumulative_index || 0).toFixed(2)}
                        </div>
                        <span class="text-[10px] text-neutral-400 mt-0.5 block">Indeks Prestasi Kumulatif</span>
                    </div>

                    {/* SKS Semester */}
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">SKS Semester</span>
                        <div class="text-2xl font-bold text-neutral-900 dark:text-white font-mono mt-1">
                            {activity()?.total_credit ?? totalKrsSks()} <span class="text-xs text-neutral-500 font-sans">SKS</span>
                        </div>
                        <span class="text-[10px] text-neutral-400 mt-0.5 block">KRS Terdaftar: {totalKrsSks()} SKS</span>
                    </div>

                    {/* SKS Kumulatif */}
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">SKS Kumulatif</span>
                        <div class="text-2xl font-bold text-neutral-900 dark:text-white font-mono mt-1">
                            {activity()?.grand_total_credit ?? 0} <span class="text-xs text-neutral-500 font-sans">SKS</span>
                        </div>
                        <span class="text-[10px] text-neutral-400 mt-0.5 block">Total SKS Diakui</span>
                    </div>

                    {/* Biaya Kuliah */}
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Biaya / SPP</span>
                        <div class="text-lg font-bold text-neutral-900 dark:text-white mt-1.5 font-mono truncate">
                            {activity()?.finance_fee ? `Rp ${(activity()?.finance_fee || 0).toLocaleString('id-ID')}` : 'Rp 0'}
                        </div>
                        <span class="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5 block font-medium">
                            {activity()?.finance_name || 'Status Terdaftar'}
                        </span>
                    </div>

                    {/* Total Matakuliah */}
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <span class="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider block">Mata Kuliah</span>
                        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono mt-1">
                            {detailActivities().length}
                        </div>
                        <span class="text-[10px] text-neutral-400 mt-0.5 block">Kelas perkuliahan diambil</span>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div class="border-b border-neutral-200 dark:border-neutral-700 flex items-center gap-6 text-sm font-semibold">
                    <button
                        type="button"
                        onClick={() => setActiveTab('krs')}
                        class={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab() === 'krs'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <span>Kartu Rencana & Hasil Studi (KRS & KHS)</span>
                        <span class="px-2 py-0.5 rounded-full text-xs font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                            {detailActivities().length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('info')}
                        class={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab() === 'info'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Informasi Aktivitas & Mahasiswa</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => setActiveTab('feeder')}
                        class={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${activeTab() === 'feeder'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                                : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                            }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                        </svg>
                        <span>Sinkronisasi PDDikti (Feeder)</span>
                    </button>
                </div>

                {/* Tab 1: KRS & KHS Course Table */}
                <Show when={activeTab() === 'krs'}>
                    <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden space-y-4 p-5">
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Daftar Mata Kuliah Diambil (KRS)
                                </h3>
                                <p class="text-xs text-neutral-500 mt-0.5">
                                    Daftar kelas dan mata kuliah yang terdaftar pada semester ini beserta penilaiannya.
                                </p>
                            </div>

                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={openAddCourseModal}
                                    class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                                >
                                    <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span>Tambah Mata Kuliah (KRS)</span>
                                </button>
                            </div>
                        </div>

                        <div class="overflow-x-auto border border-neutral-200 dark:border-neutral-700 rounded-md">
                            <table class="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr class="bg-neutral-50 dark:bg-neutral-900/60 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wider text-[11px]">
                                        <th class="w-10 px-3 py-3 text-center">No</th>
                                        <th class="px-4 py-3">Kode & Mata Kuliah</th>
                                        <th class="px-4 py-3">Kelas & Dosen</th>
                                        <th class="px-4 py-3 text-center">SKS</th>
                                        <th class="px-4 py-3 text-center">Nilai Angka</th>
                                        <th class="px-4 py-3 text-center">Nilai Huruf</th>
                                        <th class="px-4 py-3 text-center">Bobot</th>
                                        <th class="px-4 py-3 text-center">Mutu (SKS x B)</th>
                                        <th class="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/60">
                                    <Show
                                        when={detailActivities().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="9" class="px-4 py-12 text-center text-neutral-500">
                                                    Belum ada mata kuliah yang terdaftar pada semester ini.
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={detailActivities()}>
                                            {(detail, idx) => {
                                                const cred = detail.credit || 0;
                                                const mark = detail.mark ?? 0;
                                                const gradeLetter = detail.grade_letter || detail.grade?.alphabet_code || '-';
                                                const gradePoint = detail.grade_point ?? detail.grade?.grade ?? 0;
                                                const qualityPoint = cred * gradePoint;

                                                return (
                                                    <tr class="group hover:bg-neutral-50/80 dark:hover:bg-neutral-700/50 transition-colors">
                                                        <td class="px-3 py-3 text-center font-mono text-neutral-500">
                                                            {idx() + 1}
                                                        </td>
                                                        <td class="px-4 py-3">
                                                            <div class="font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {detail.course_name || detail.course?.name || detail.name || 'Mata Kuliah'}
                                                            </div>
                                                            <div class="font-mono text-[11px] text-neutral-500">
                                                                {detail.course_code || detail.course?.code || '-'}
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-3">
                                                            <div class="font-medium text-neutral-800 dark:text-neutral-200">
                                                                Kelas: {detail.class_name || detail.teach?.class_code?.name || '-'}
                                                            </div>
                                                            <div class="text-[11px] text-neutral-500 truncate max-w-[200px]">
                                                                {detail.lecturer_name || (Array.isArray(detail.lecturers) ? detail.lecturers.join(', ') : '-')}
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-3 text-center font-mono font-medium">
                                                            {cred}
                                                        </td>
                                                        <td class="px-4 py-3 text-center font-mono font-semibold">
                                                            {mark > 0 ? mark : '-'}
                                                        </td>
                                                        <td class="px-4 py-3 text-center">
                                                            <span
                                                                class={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold font-mono ${gradeLetter.startsWith('A')
                                                                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                                                        : gradeLetter.startsWith('B')
                                                                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                                                                            : gradeLetter.startsWith('C')
                                                                                ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                                                                                : gradeLetter === '-'
                                                                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                                                                                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                                                                    }`}
                                                            >
                                                                {gradeLetter}
                                                            </span>
                                                        </td>
                                                        <td class="px-4 py-3 text-center font-mono text-neutral-700 dark:text-neutral-300">
                                                            {gradePoint.toFixed(2)}
                                                        </td>
                                                        <td class="px-4 py-3 text-center font-mono font-bold text-neutral-900 dark:text-white">
                                                            {qualityPoint.toFixed(2)}
                                                        </td>
                                                        <td class="px-4 py-3 text-right">
                                                            <div class="flex items-center justify-end gap-1">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditGradeModal(detail)}
                                                                    class="p-1.5 text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                                    title="Input / Edit Nilai"
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>

                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDropCourseModal(detail)}
                                                                    class="p-1.5 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                                    title="Drop / Batalkan Mata Kuliah"
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            }}
                                        </For>
                                    </Show>
                                </tbody>
                                <tfoot class="bg-neutral-50 dark:bg-neutral-900/60 font-semibold border-t-2 border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <td colspan="3" class="px-4 py-3 text-right text-xs uppercase tracking-wider text-neutral-500">
                                            Total Semester:
                                        </td>
                                        <td class="px-4 py-3 text-center font-mono font-bold text-neutral-900 dark:text-white">
                                            {totalKrsSks()} SKS
                                        </td>
                                        <td colspan="3" class="px-4 py-3 text-right text-xs text-neutral-500">
                                            Total Mutu & IPS:
                                        </td>
                                        <td class="px-4 py-3 text-center font-mono font-bold text-blue-600 dark:text-blue-400">
                                            {totalQualityPoints().toFixed(2)} ({calculatedIps()})
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </Show>

                {/* Tab 2: Activity and Registration Information */}
                <Show when={activeTab() === 'info'}>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Detail Aktivitas Akademik */}
                        <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5 shadow-2xs space-y-4">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 flex items-center gap-2">
                                <svg class="size-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Aktivitas Perkuliahan</span>
                            </h3>

                            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                <div>
                                    <dt class="text-neutral-500 font-medium">ID Aktivitas</dt>
                                    <dd class="font-mono text-neutral-900 dark:text-neutral-100 break-all">{activity()?.id}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Periode Akademik</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-neutral-100">{activity()?.academic_year_name || '-'}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Status Registrasi</dt>
                                    <dd class="font-semibold text-emerald-600 dark:text-emerald-400">{activity()?.status_name || '-'}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Status Keluar / Cuti</dt>
                                    <dd class="text-neutral-900 dark:text-neutral-100">{activity()?.resign_status_name || '-'}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Status Kunci KRS/KHS</dt>
                                    <dd class="font-semibold">{activity()?.is_lock ? 'Terkunci' : 'Terbuka'}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Biaya Kuliah (Tagihan)</dt>
                                    <dd class="font-mono text-neutral-900 dark:text-neutral-100">
                                        Rp {(activity()?.finance_fee || 0).toLocaleString('id-ID')}
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Tanggal Dibuat</dt>
                                    <dd class="text-neutral-700 dark:text-neutral-300">
                                        {activity()?.created_at ? new Date(activity()!.created_at!).toLocaleString('id-ID') : '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Terakhir Diperbarui</dt>
                                    <dd class="text-neutral-700 dark:text-neutral-300">
                                        {activity()?.updated_at ? new Date(activity()!.updated_at!).toLocaleString('id-ID') : '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Detail Mahasiswa */}
                        <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-5 shadow-2xs space-y-4">
                            <h3 class="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200 border-b border-neutral-200 dark:border-neutral-700 pb-2 flex items-center gap-2">
                                <svg class="size-4 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                <span>Informasi Mahasiswa</span>
                            </h3>

                            <dl class="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
                                <div>
                                    <dt class="text-neutral-500 font-medium">NIM</dt>
                                    <dd class="font-mono font-bold text-neutral-900 dark:text-neutral-100">
                                        {activity()?.student_code || student()?.code || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Nama Mahasiswa</dt>
                                    <dd class="font-semibold text-neutral-900 dark:text-neutral-100">
                                        {activity()?.student_name || student()?.name || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Program Studi</dt>
                                    <dd class="text-neutral-900 dark:text-neutral-100">
                                        {activity()?.unit_name || student()?.unit_name || '-'}
                                    </dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Tahun Masuk / Angkatan</dt>
                                    <dd class="text-neutral-900 dark:text-neutral-100">{student()?.registered || '-'}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Jenis Pendaftaran</dt>
                                    <dd class="text-neutral-900 dark:text-neutral-100">{student()?.registration_name || '-'}</dd>
                                </div>
                                <div>
                                    <dt class="text-neutral-500 font-medium">Kurikulum</dt>
                                    <dd class="text-neutral-900 dark:text-neutral-100">{student()?.curriculum_name || '-'}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </Show>

                {/* Tab 3: Feeder PDDikti Sync Status */}
                <Show when={activeTab() === 'feeder'}>
                    <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 shadow-2xs space-y-4">
                        <div class="flex items-center gap-3 border-b border-neutral-200 dark:border-neutral-700 pb-3">
                            <div class="size-10 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 shrink-0">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Status Sinkronisasi Feeder PDDikti
                                </h3>
                                <p class="text-xs text-neutral-500 mt-0.5">
                                    Data integrasi AKM (Aktivitas Kuliah Mahasiswa) ke Pangkalan Data Pendidikan Tinggi Kemendikbudristek.
                                </p>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                            <div class="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block font-medium">ID Registrasi Feeder (AKM)</span>
                                <span class="font-mono font-bold text-neutral-900 dark:text-white mt-1 block break-all">
                                    {activity()?.feeder_id || 'Belum tersinkronisasi'}
                                </span>
                            </div>

                            <div class="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block font-medium">Waktu Sinkronisasi Terakhir</span>
                                <span class="font-mono text-neutral-800 dark:text-neutral-200 mt-1 block">
                                    {activity()?.sync_at ? new Date(activity()!.sync_at!).toLocaleString('id-ID') : '-'}
                                </span>
                            </div>

                            <div class="p-3.5 bg-neutral-50 dark:bg-neutral-850 rounded border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block font-medium">Status Integrasi</span>
                                <div class="mt-1">
                                    <Show
                                        when={activity()?.feeder_id}
                                        fallback={
                                            <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                Lokal (Belum Sync)
                                            </span>
                                        }
                                    >
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            <svg class="size-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                            </svg>
                                            Tersinkronisasi PDDikti
                                        </span>
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </div>
                </Show>
            </main>

            {/* Modal: Edit Aktivitas Mahasiswa */}
            <Show when={showEditActivityModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <svg class="size-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>Edit Data Aktivitas Kuliah</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowEditActivityModal(false)}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditActivitySubmit} class="p-6 overflow-y-auto space-y-4 text-xs">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Status Perkuliahan
                                    </label>
                                    <select
                                        value={formStatusId()}
                                        onChange={e => setFormStatusId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    >
                                        <For each={statuses()}>
                                            {s => <option value={s.id}>{s.name}</option>}
                                        </For>
                                    </select>
                                </div>

                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Program Studi
                                    </label>
                                    <select
                                        value={formUnitId()}
                                        onChange={e => setFormUnitId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    >
                                        <For each={studyUnits()}>
                                            {u => <option value={u.id}>{u.name}</option>}
                                        </For>
                                    </select>
                                </div>

                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        SKS Semester
                                    </label>
                                    <input
                                        type="number"
                                        value={formSks()}
                                        onInput={e => setFormSks(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Total SKS Kumulatif
                                    </label>
                                    <input
                                        type="number"
                                        value={formGrandSks()}
                                        onInput={e => setFormGrandSks(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        IPS (Indeks Prestasi Semester)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4"
                                        value={formIps()}
                                        onInput={e => setFormIps(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    />
                                </div>

                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        IPK (Indeks Prestasi Kumulatif)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4"
                                        value={formIpk()}
                                        onInput={e => setFormIpk(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    />
                                </div>

                                <div class="sm:col-span-2">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Biaya Tagihan / SPP (Rp)
                                    </label>
                                    <input
                                        type="number"
                                        value={formFinanceFee()}
                                        onInput={e => setFormFinanceFee(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div class="pt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="detailEditLock"
                                    checked={formIsLock()}
                                    onChange={e => setFormIsLock(e.currentTarget.checked)}
                                    class="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label for="detailEditLock" class="font-medium text-neutral-800 dark:text-neutral-200">
                                    Kunci aktivitas semester ini
                                </label>
                            </div>

                            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowEditActivityModal(false)}
                                    class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="px-4 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Show when={isSubmitting()}>
                                        <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </Show>
                                    <span>Simpan Perubahan</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* Modal: Tambah Mata Kuliah ke KRS */}
            <Show when={showAddCourseModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <svg class="size-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>Tambah Mata Kuliah ke KRS</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowAddCourseModal(false)}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleAddCourseSubmit} class="p-6 overflow-y-auto space-y-4 text-xs">
                            <div>
                                <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                    Cari Kelas / Mata Kuliah Ditawarkan
                                </label>
                                <div class="relative">
                                    <input
                                        type="text"
                                        value={teachSearchQuery()}
                                        onInput={e => {
                                            const q = e.currentTarget.value;
                                            setTeachSearchQuery(q);
                                            searchAvailableTeaches(q);
                                        }}
                                        placeholder="Ketik kode atau nama mata kuliah / kelas..."
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Show when={isSearchingTeaches()}>
                                        <div class="absolute right-3 top-2.5 text-neutral-400">
                                            <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    </Show>
                                </div>
                            </div>

                            {/* Available Classes List */}
                            <div class="max-h-52 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded divide-y divide-neutral-100 dark:divide-neutral-800">
                                <Show
                                    when={availableTeaches().length > 0}
                                    fallback={
                                        <div class="p-4 text-center text-neutral-500">
                                            {isSearchingTeaches() ? 'Sedang mencari kelas...' : 'Tidak ada kelas ditemukan.'}
                                        </div>
                                    }
                                >
                                    <For each={availableTeaches()}>
                                        {teach => {
                                            const isSelected = selectedTeachId() === teach.id;
                                            return (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedTeachId(teach.id);
                                                        setSelectedCourseId(teach.course_id);
                                                        setSelectedCourseCredit(teach.credits || 3);
                                                        setSelectedCourseName(teach.course_name || teach.name || '');
                                                    }}
                                                    class={`group w-full text-left p-3 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between transition-colors ${isSelected ? 'bg-blue-50 dark:bg-blue-950/60 border-l-4 border-blue-600' : ''
                                                        }`}
                                                >
                                                    <div>
                                                        <div class="font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                            {teach.course_name || teach.name || 'Mata Kuliah'}
                                                        </div>
                                                        <div class="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                                                            <span class="font-mono">{teach.course_code || '-'}</span>
                                                            <span>•</span>
                                                            <span>Kelas: {teach.class_name || '-'}</span>
                                                            <span>•</span>
                                                            <span>Dosen: {teach.lecturer_name || '-'}</span>
                                                        </div>
                                                    </div>
                                                    <span class="px-2 py-0.5 rounded font-mono font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                                                        {teach.credits || 3} SKS
                                                    </span>
                                                </button>
                                            );
                                        }}
                                    </For>
                                </Show>
                            </div>

                            <Show when={selectedCourseId()}>
                                <div class="p-3 bg-blue-50 dark:bg-blue-950/50 rounded border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                                    <div>
                                        <span class="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Kelas Terpilih</span>
                                        <div class="font-semibold text-neutral-900 dark:text-white mt-0.5">{selectedCourseName()}</div>
                                    </div>
                                    <div class="w-24">
                                        <label class="block text-[10px] text-neutral-500 mb-0.5">SKS Diambil</label>
                                        <input
                                            type="number"
                                            value={selectedCourseCredit()}
                                            onInput={e => setSelectedCourseCredit(Number(e.currentTarget.value))}
                                            class="w-full px-2 py-1 text-xs rounded border border-blue-300 dark:border-blue-700 bg-white dark:bg-neutral-800 font-mono text-center"
                                        />
                                    </div>
                                </div>
                            </Show>

                            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowAddCourseModal(false)}
                                    class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting() || !selectedCourseId()}
                                    class="px-4 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Show when={isSubmitting()}>
                                        <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </Show>
                                    <span>Tambahkan ke KRS</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* Modal: Input / Edit Nilai Perkuliahan */}
            <Show when={showEditGradeModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md flex flex-col overflow-hidden">
                        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <svg class="size-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>Input / Perbarui Nilai Perkuliahan</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowEditGradeModal(false)}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditGradeSubmit} class="p-6 space-y-4 text-xs">
                            <div class="p-3 bg-neutral-50 dark:bg-neutral-850 rounded border border-neutral-200 dark:border-neutral-700">
                                <div class="font-bold text-neutral-900 dark:text-white">
                                    {selectedDetail()?.course_name || selectedDetail()?.course?.name || selectedDetail()?.name}
                                </div>
                                <div class="text-[11px] text-neutral-500 font-mono mt-0.5">
                                    Kode: {selectedDetail()?.course_code || selectedDetail()?.course?.code || '-'}
                                </div>
                            </div>

                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Nilai Angka (0 - 100)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="0.1"
                                        value={formGradeMark()}
                                        onInput={e => setFormGradeMark(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    />
                                </div>

                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Nilai Huruf / Bobot
                                    </label>
                                    <select
                                        value={formGradeId()}
                                        onChange={e => setFormGradeId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    >
                                        <option value="">(Belum Dinilai)</option>
                                        <For each={grades()}>
                                            {g => (
                                                <option value={g.id}>
                                                    {g.name} ({g.grade.toFixed(2)})
                                                </option>
                                            )}
                                        </For>
                                    </select>
                                </div>

                                <div class="col-span-2">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        Beban SKS
                                    </label>
                                    <input
                                        type="number"
                                        value={formGradeCredit()}
                                        onInput={e => setFormGradeCredit(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    />
                                </div>
                            </div>

                            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowEditGradeModal(false)}
                                    class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="px-4 py-2 text-xs font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Show when={isSubmitting()}>
                                        <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </Show>
                                    <span>Simpan Nilai</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* Modal: Konfirmasi Drop Mata Kuliah */}
            <Show when={showDropCourseModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md p-6 space-y-4">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Batalkan Mata Kuliah (Drop)
                                </h3>
                                <p class="text-xs text-neutral-500 mt-0.5">
                                    Mata kuliah ini akan dihapus dari rencana studi mahasiswa semester ini.
                                </p>
                            </div>
                        </div>

                        <div class="bg-neutral-50 dark:bg-neutral-850 p-3 rounded border border-neutral-200 dark:border-neutral-700 text-xs">
                            <p class="font-bold text-neutral-900 dark:text-white">
                                {selectedDetail()?.course_name || selectedDetail()?.course?.name || selectedDetail()?.name}
                            </p>
                            <p class="text-neutral-500 font-mono text-[11px] mt-0.5">
                                {selectedDetail()?.course_code || '-'} • {selectedDetail()?.credit || 3} SKS
                            </p>
                        </div>

                        <div class="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowDropCourseModal(false)}
                                class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting()}
                                onClick={handleDropCourseSubmit}
                                class="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Show when={isSubmitting()}>
                                    <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </Show>
                                <span>Ya, Batalkan MK</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Show>

            {/* Modal: Hapus Aktivitas Keseluruhan */}
            <Show when={showDeleteModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md p-6 space-y-4">
                        <div class="flex items-center gap-3">
                            <div class="size-10 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </div>
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                    Hapus Aktivitas Kuliah
                                </h3>
                                <p class="text-xs text-neutral-500 mt-0.5">
                                    Aktivitas ini beserta seluruh data KRS terkait akan dihapus. Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting()}
                                onClick={handleDeleteActivity}
                                class="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Show when={isSubmitting()}>
                                    <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </Show>
                                <span>Ya, Hapus Aktivitas</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
