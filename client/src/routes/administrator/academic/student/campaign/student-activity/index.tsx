import { createSignal, createEffect, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    listStudentActivities,
    createStudentActivity,
    updateStudentActivity,
    deleteStudentActivity,
    toggleStudentActivityLock,
    downloadActivityPlanPdf,
    downloadActivityResultPdf,
    StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import {
    listStudents,
    listAcademicYears,
    listStudentStatuses,
    listStudyUnits,
    StudentMasterItem
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import {
    listActivities,
    CampaignActivityItem
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';
import { t } from '../../../../../../i18n';

export default function AcademicStudentCampaignStudentActivityPage() {
    // Data list state
    const [items, setItems] = createSignal<StudentActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);

    // Filters state
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedAcademicYear, setSelectedAcademicYear] = createSignal('');
    const [selectedUnit, setSelectedUnit] = createSignal('');
    const [selectedStatus, setSelectedStatus] = createSignal('');
    const [selectedLockFilter, setSelectedLockFilter] = createSignal('all');
    const [sortOption, setSortOption] = createSignal('created_at-desc');

    // Reference options
    const [academicYears, setAcademicYears] = createSignal<any[]>([]);
    const [studyUnits, setStudyUnits] = createSignal<any[]>([]);
    const [statuses, setStatuses] = createSignal<any[]>([]);
    const [campaignActivities, setCampaignActivities] = createSignal<CampaignActivityItem[]>([]);
    const [studentOptions, setStudentOptions] = createSignal<StudentMasterItem[]>([]);
    const [isSearchingStudents, setIsSearchingStudents] = createSignal(false);

    // Selection & Bulk actions
    const [selectedIds, setSelectedIds] = createSignal<string[]>([]);
    const [isBulkProcessing, setIsBulkProcessing] = createSignal(false);

    // Active action loading states
    const [lockingId, setLockingId] = createSignal<string | null>(null);
    const [printingPlanId, setPrintingPlanId] = createSignal<string | null>(null);
    const [printingResultId, setPrintingResultId] = createSignal<string | null>(null);

    // Modals state
    const [showCreateModal, setShowCreateModal] = createSignal(false);
    const [showEditModal, setShowEditModal] = createSignal(false);
    const [showDeleteModal, setShowDeleteModal] = createSignal(false);
    const [selectedActivity, setSelectedActivity] = createSignal<StudentActivityItem | null>(null);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Form inputs state
    const [formStudentId, setFormStudentId] = createSignal('');
    const [formStudentSearch, setFormStudentSearch] = createSignal('');
    const [formUnitActivityId, setFormUnitActivityId] = createSignal('');
    const [formStatusId, setFormStatusId] = createSignal('');
    const [formUnitId, setFormUnitId] = createSignal('');
    const [formName, setFormName] = createSignal('');
    const [formSks, setFormSks] = createSignal<number>(0);
    const [formGrandSks, setFormGrandSks] = createSignal<number>(0);
    const [formIps, setFormIps] = createSignal<number>(0);
    const [formIpk, setFormIpk] = createSignal<number>(0);
    const [formFinanceFee, setFormFinanceFee] = createSignal<number>(0);
    const [formIsLock, setFormIsLock] = createSignal(false);

    // Fetch primary data
    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [sortBy, sortDir] = sortOption().split('-');
            const res = await listStudentActivities({
                page: currentPage(),
                page_size: itemsPerPage(),
                search: searchQuery().trim() || undefined,
                academic_year_id: selectedAcademicYear() || undefined,
                unit_id: selectedUnit() || undefined,
                status_id: selectedStatus() || undefined,
                sort_by: sortBy,
                sort_dir: sortDir || 'desc',
            });

            let filtered = res.data || [];
            if (selectedLockFilter() === 'locked') {
                filtered = filtered.filter(item => item.is_lock === true);
            } else if (selectedLockFilter() === 'unlocked') {
                filtered = filtered.filter(item => !item.is_lock);
            }

            setItems(filtered);
            setTotalData(res.total);
            setTotalPages(res.total_pages || 1);
        } catch (err) {
            console.error('Failed to load student activities:', err);
            toast.danger(t('ad.gagalMemuatDataAktivitasMahasiswa'));
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Load filter reference datasets
    const loadReferences = async () => {
        try {
            const [ayList, unitList, statusList, actList] = await Promise.all([
                listAcademicYears(),
                listStudyUnits(),
                listStudentStatuses(),
                listActivities({ page: 1, page_size: 100 }),
            ]);
            setAcademicYears(ayList || []);
            setStudyUnits(unitList || []);
            setStatuses(statusList || []);
            setCampaignActivities(actList.data || []);
        } catch (err) {
            console.error('Failed to load references:', err);
        }
    };

    // Search students for form
    const searchStudents = async (query: string) => {
        if (!query || query.length < 2) return;
        setIsSearchingStudents(true);
        try {
            const res = await listStudents({ page: 1, page_size: 20, search: query });
            setStudentOptions(res.data || []);
        } catch (err) {
            console.warn('Error searching students:', err);
        } finally {
            setIsSearchingStudents(false);
        }
    };

    onMount(() => {
        loadReferences();
    });

    createEffect(() => {
        currentPage();
        itemsPerPage();
        searchQuery();
        selectedAcademicYear();
        selectedUnit();
        selectedStatus();
        selectedLockFilter();
        sortOption();
        fetchData();
    });

    // Reset filters
    const resetFilters = () => {
        setSearchQuery('');
        setSelectedAcademicYear('');
        setSelectedUnit('');
        setSelectedStatus('');
        setSelectedLockFilter('all');
        setSortOption('created_at-desc');
        setCurrentPage(1);
    };

    // Quick toggle lock
    const handleToggleLock = async (item: StudentActivityItem) => {
        const targetId = item.id;
        setLockingId(targetId);
        try {
            const currentLock = Boolean(item.is_lock);
            const res = await toggleStudentActivityLock(targetId, currentLock);
            if (!res.is_error) {
                // Optimistically update
                setItems(prev =>
                    prev.map(a => (a.id === targetId ? { ...a, is_lock: !currentLock } : a))
                );
                toast.success(!currentLock ? t('ad.activityLockedSuccessfully') : t('ad.activityUnlockedSuccessfully'));
            } else {
                toast.danger(res.message || t('ad.gagalMengubahStatusKunci'));
            }
        } catch {
            toast.danger(t('ad.gagalMemprosesPerubahanStatusKunci'));
        } finally {
            setLockingId(null);
        }
    };

    // Print KRS PDF
    const handlePrintPlan = async (item: StudentActivityItem) => {
        setPrintingPlanId(item.id);
        try {
            const studentCode = item.student_code || item.student_id;
            const filename = `KRS_${studentCode}_${item.academic_year_name || 'Semester'}.pdf`;
            const ok = await downloadActivityPlanPdf(item.id, filename);
            if (ok) {
                toast.success(t('ad.fileKRSPDFBerhasilDiunduh'));
            } else {
                toast.danger(t('ad.gagalMencetakKRSPDF'));
            }
        } catch {
            toast.danger(t('ad.terjadiKesalahanSaatMengunduhKRS'));
        } finally {
            setPrintingPlanId(null);
        }
    };

    // Print KHS PDF
    const handlePrintResult = async (item: StudentActivityItem) => {
        setPrintingResultId(item.id);
        try {
            const studentCode = item.student_code || item.student_id;
            const filename = `KHS_${studentCode}_${item.academic_year_name || 'Semester'}.pdf`;
            const ok = await downloadActivityResultPdf(item.id, filename);
            if (ok) {
                toast.success(t('ad.fileKHSPDFBerhasilDiunduh'));
            } else {
                toast.danger(t('ad.gagalMencetakKHSPDF'));
            }
        } catch {
            toast.danger(t('ad.terjadiKesalahanSaatMengunduhKHS'));
        } finally {
            setPrintingResultId(null);
        }
    };

    // Select row / Select all
    const handleSelectRow = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleSelectAll = () => {
        const allCurrentIds = items().map(i => i.id);
        const allSelected = allCurrentIds.every(id => selectedIds().includes(id));
        if (allSelected) {
            setSelectedIds(prev => prev.filter(id => !allCurrentIds.includes(id)));
        } else {
            const newSet = new Set([...selectedIds(), ...allCurrentIds]);
            setSelectedIds(Array.from(newSet));
        }
    };

    // Bulk Lock / Unlock
    const handleBulkLock = async (lockState: boolean) => {
        const ids = selectedIds();
        if (!ids.length) return;
        setIsBulkProcessing(true);
        try {
            let successCount = 0;
            for (const id of ids) {
                const res = await updateStudentActivity(id, { is_lock: lockState });
                if (!res.is_error) successCount++;
            }
            toast.success(`${successCount} aktivitas berhasil di-${lockState ? 'kunci' : 'buka'}`);
            setSelectedIds([]);
            fetchData();
        } catch {
            toast.danger(t('ad.terjadiKesalahanPadaAksiMassal'));
        } finally {
            setIsBulkProcessing(false);
        }
    };

    // Export to CSV
    const exportCsv = (dataList: StudentActivityItem[]) => {
        if (!dataList.length) {
            toast.warning(t('ad.tidakAdaDataUntukDiekspor'));
            return;
        }
        const rows = dataList.map((item, idx) => ({
            No: idx + 1,
            NIM: item.student_code || item.student?.code || '-',
            Nama_Mahasiswa: item.student_name || item.student?.name || item.name || '-',
            Program_Studi: item.unit_name || item.unit?.name || '-',
            Tahun_Akademik: item.academic_year_name || item.unit_activity?.name || '-',
            Status: item.status_name || item.status?.name || '-',
            SKS_Semester: item.total_credit ?? 0,
            SKS_Kumulatif: item.grand_total_credit ?? 0,
            IPS: Number(item.cumulative_index || 0).toFixed(2),
            IPK: Number(item.grand_cumulative_index || 0).toFixed(2),
            Status_Kunci: item.is_lock ? t('ad.terkunci') : t('ad.terbuka'),
            Biaya_Kuliah: item.finance_fee ?? 0,
            Feeder_ID: item.feeder_id || '-',
        }));

        const separator = ',';
        const keys = Object.keys(rows[0]);
        const csvContent =
            keys.join(separator) +
            '\n' +
            rows
                .map(row =>
                    keys
                        .map(k => {
                            let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                            cell = cell.toString().replace(/"/g, '""');
                            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
                            return cell;
                        })
                        .join(separator)
                )
                .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Aktivitas_Mahasiswa_${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success(t('ad.dataAktivitasBerhasilDieksporKeCSV'));
    };

    // Open Create Modal
    const openCreateModal = () => {
        setFormStudentId('');
        setFormStudentSearch('');
        setFormUnitActivityId(campaignActivities()[0]?.id || '');
        setFormStatusId(statuses()[0]?.id || '');
        setFormUnitId('');
        setFormName('');
        setFormSks(0);
        setFormGrandSks(0);
        setFormIps(0);
        setFormIpk(0);
        setFormFinanceFee(0);
        setFormIsLock(false);
        setStudentOptions([]);
        setShowCreateModal(true);
    };

    // Submit Create
    const handleCreateSubmit = async (e: Event) => {
        e.preventDefault();
        if (!formStudentId() || !formUnitActivityId() || !formStatusId()) {
            toast.warning(t('ad.mahasiswaPeriodeAktivitasDanStatusWajib'));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await createStudentActivity({
                student_id: formStudentId(),
                unit_activity_id: formUnitActivityId(),
                status_id: formStatusId(),
                unit_id: formUnitId() || null,
                name: formName() || null,
                total_credit: Number(formSks()),
                grand_total_credit: Number(formGrandSks()),
                cumulative_index: Number(formIps()),
                grand_cumulative_index: Number(formIpk()),
                finance_fee: Number(formFinanceFee()),
                is_lock: formIsLock(),
            });

            if (!res.is_error) {
                toast.success(t('ad.aktivitasMahasiswaBerhasilDitambahkan'));
                setShowCreateModal(false);
                fetchData();
            } else {
                toast.danger(res.message || t('ad.gagalMenambahkanAktivitas'));
            }
        } catch {
            toast.danger(t('ad.terjadiKesalahanSaatMenyimpanAktivitas'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Edit Modal
    const openEditModal = (item: StudentActivityItem) => {
        setSelectedActivity(item);
        setFormName(item.name || '');
        setFormStatusId(item.status_id || '');
        setFormUnitId(item.unit_id || '');
        setFormSks(item.total_credit || 0);
        setFormGrandSks(item.grand_total_credit || 0);
        setFormIps(item.cumulative_index || 0);
        setFormIpk(item.grand_cumulative_index || 0);
        setFormFinanceFee(item.finance_fee || 0);
        setFormIsLock(Boolean(item.is_lock));
        setShowEditModal(true);
    };

    // Submit Edit
    const handleEditSubmit = async (e: Event) => {
        e.preventDefault();
        const active = selectedActivity();
        if (!active) return;

        setIsSubmitting(true);
        try {
            const res = await updateStudentActivity(active.id, {
                name: formName() || null,
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
                toast.success(t('ad.aktivitasMahasiswaBerhasilDiperbarui'));
                setShowEditModal(false);
                fetchData();
            } else {
                toast.danger(res.message || t('ad.gagalMemperbaruiAktivitas'));
            }
        } catch {
            toast.danger(t('ad.terjadiKesalahanSaatMemperbaruiAktivitas'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Open Delete Modal
    const openDeleteModal = (item: StudentActivityItem) => {
        setSelectedActivity(item);
        setShowDeleteModal(true);
    };

    // Confirm Delete
    const handleDeleteConfirm = async () => {
        const active = selectedActivity();
        if (!active) return;

        setIsSubmitting(true);
        try {
            const res = await deleteStudentActivity(active.id);
            if (!res.is_error) {
                toast.success(t('ad.aktivitasMahasiswaBerhasilDihapus'));
                setShowDeleteModal(false);
                fetchData();
            } else {
                toast.danger(res.message || t('ad.gagalMenghapusAktivitas'));
            }
        } catch {
            toast.danger(t('ad.terjadiKesalahanSaatMenghapusAktivitas'));
        } finally {
            setIsSubmitting(false);
        }
    };

    // Computed Stats
    const activeCount = () => items().filter(i => (i.status_name || '').toLowerCase().includes('aktif')).length;
    const lockedCount = () => items().filter(i => i.is_lock).length;
    const avgIpk = () => {
        const valid = items().filter(i => (i.grand_cumulative_index || 0) > 0);
        if (!valid.length) return '0.00';
        const sum = valid.reduce((acc, curr) => acc + (curr.grand_cumulative_index || 0), 0);
        return (sum / valid.length).toFixed(2);
    };
    const avgSks = () => {
        const valid = items().filter(i => (i.total_credit || 0) > 0);
        if (!valid.length) return '0';
        const sum = valid.reduce((acc, curr) => acc + (curr.total_credit || 0), 0);
        return (sum / valid.length).toFixed(1);
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header and Breadcrumbs */}
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                            <A href="/administrator/dashboard" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{t('ad.administrator')}</A>
                            <span>/</span>
                            <span>{t('ad.akademik')}</span>
                            <span>/</span>
                            <span>{t('ad.mahasiswa')}</span>
                            <span>/</span>
                            <span>{t('ad.kampanye')}</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">{t('ad.aktivitasKuliah')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                            {t('ad.aktivitasKuliahMahasiswaAKM')}
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            {t('ad.manajemenDataRiwayatAktivitasSemesterSKS')}
                        </p>
                    </div>

                    <div class="flex items-center gap-2.5 flex-wrap">
                        <button
                            type="button"
                            onClick={() => fetchData()}
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
                            title={t('ad.segarkanData')}
                        >
                            <svg class={`size-3.5 ${isLoading() ? 'animate-spin' : ''}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>{t('ad.refresh')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => exportCsv(items())}
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs"
                        >
                            <svg class="size-3.5 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span>{t('ad.eksporCSV')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            class="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                        >
                            <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                            </svg>
                            <span>{t('ad.tambahAktivitas')}</span>
                        </button>
                    </div>
                </div>

                {/* KPI Metrics Summary */}
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs flex items-center gap-3.5">
                        <div class="size-11 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <div>
                            <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('ad.totalAktivitas')}</span>
                            <div class="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">{totalData()}</div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs flex items-center gap-3.5">
                        <div class="size-11 rounded-md bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('ad.statusAktif')}</span>
                            <div class="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {activeCount()} <span class="text-xs font-normal text-neutral-500">{t('ad.diHalamanIni')}</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs flex items-center gap-3.5">
                        <div class="size-11 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/60 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <div>
                            <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('ad.terkunciLock')}</span>
                            <div class="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                                {lockedCount()} <span class="text-xs font-normal text-neutral-500">aktivitas</span>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs flex items-center gap-3.5">
                        <div class="size-11 rounded-md bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/60 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <span class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">{t('ad.rataRataIPKSKS')}</span>
                            <div class="text-xl font-bold text-neutral-900 dark:text-white mt-0.5">
                                {avgIpk()} <span class="text-xs font-normal text-neutral-500">/ {avgSks()} SKS</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter and Search Bar */}
                <div class="bg-white dark:bg-neutral-800 p-4 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Search Input */}
                        <div class="lg:col-span-2 relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={searchQuery()}
                                onInput={e => {
                                    setSearchQuery(e.currentTarget.value);
                                    setCurrentPage(1);
                                }}
                                placeholder={t('ad.cariNamaNIMAtauAktivitas')}
                                class="w-full pl-9 pr-3 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                            />
                        </div>

                        {/* Academic Year Filter */}
                        <div>
                            <select
                                value={selectedAcademicYear()}
                                onChange={e => {
                                    setSelectedAcademicYear(e.currentTarget.value);
                                    setCurrentPage(1);
                                }}
                                class="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('ad.semuaPeriodeTA')}</option>
                                <For each={academicYears()}>
                                    {ay => <option value={ay.id}>{ay.name || ay.code}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Study Program / Unit Filter */}
                        <div>
                            <select
                                value={selectedUnit()}
                                onChange={e => {
                                    setSelectedUnit(e.currentTarget.value);
                                    setCurrentPage(1);
                                }}
                                class="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('ad.semuaProgramStudi')}</option>
                                <For each={studyUnits()}>
                                    {u => <option value={u.id}>{u.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Status Filter */}
                        <div>
                            <select
                                value={selectedStatus()}
                                onChange={e => {
                                    setSelectedStatus(e.currentTarget.value);
                                    setCurrentPage(1);
                                }}
                                class="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">{t('ad.semuaStatusKuliah')}</option>
                                <For each={statuses()}>
                                    {s => <option value={s.id}>{s.name}</option>}
                                </For>
                            </select>
                        </div>

                        {/* Lock Status Filter */}
                        <div>
                            <select
                                value={selectedLockFilter()}
                                onChange={e => {
                                    setSelectedLockFilter(e.currentTarget.value);
                                    setCurrentPage(1);
                                }}
                                class="w-full px-2.5 py-2 text-xs rounded-md border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="all">{t('ad.statusKunciSemua')}</option>
                                <option value="locked">{t('ad.hanyaTerkunci')}</option>
                                <option value="unlocked">{t('ad.hanyaBelumTerkunci')}</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700/60 pt-3 text-xs">
                        <div class="flex items-center gap-2">
                            <span class="text-neutral-500">{t('ad.urutkan')}</span>
                            <select
                                value={sortOption()}
                                onChange={e => setSortOption(e.currentTarget.value)}
                                class="px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            >
                                <option value="created_at-desc">{t('ad.tanggalDibuatTerbaru')}</option>
                                <option value="created_at-asc">{t('ad.tanggalDibuatTerlama')}</option>
                                <option value="name-asc">{t('ad.namaMahasiswaAZ')}</option>
                                <option value="name-desc">{t('ad.namaMahasiswaZA')}</option>
                            </select>

                            <span class="text-neutral-500 ml-2">{t('ad.perHalaman')}</span>
                            <select
                                value={itemsPerPage()}
                                onChange={e => {
                                    setItemsPerPage(Number(e.currentTarget.value));
                                    setCurrentPage(1);
                                }}
                                class="px-2 py-1 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            >
                                <option value="10">10</option>
                                <option value="25">25</option>
                                <option value="50">50</option>
                                <option value="100">100</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={resetFilters}
                            class="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium transition-colors"
                        >
                            {t('ad.resetFilter')}
                        </button>
                    </div>
                </div>

                {/* Bulk Actions Floating Toolbar */}
                <Show when={selectedIds().length > 0}>
                    <div class="bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800/80 p-3 rounded-lg flex items-center justify-between gap-4">
                        <div class="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
                            <span class="px-2 py-0.5 rounded-full bg-blue-600 text-white font-mono text-xs">
                                {selectedIds().length}
                            </span>
                            <span>{t('ad.aktivitasDipilih')}</span>
                        </div>

                        <div class="flex items-center gap-2 flex-wrap">
                            <button
                                type="button"
                                disabled={isBulkProcessing()}
                                onClick={() => handleBulkLock(true)}
                                class="px-3 py-1.5 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50"
                            >
                                {t('ad.kunciTerpilih')}
                            </button>
                            <button
                                type="button"
                                disabled={isBulkProcessing()}
                                onClick={() => handleBulkLock(false)}
                                class="px-3 py-1.5 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                            >
                                {t('ad.bukaKunciTerpilih')}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const selectedItems = items().filter(i => selectedIds().includes(i.id));
                                    exportCsv(selectedItems);
                                }}
                                class="px-3 py-1.5 text-xs font-semibold rounded bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {t('ad.eksporTerpilih')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedIds([])}
                                class="px-2.5 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                            >
                                {t('ad.batal')}
                            </button>
                        </div>
                    </div>
                </Show>

                {/* Main Data Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr class="bg-neutral-50 dark:bg-neutral-900/50 border-b border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 font-semibold uppercase tracking-wider text-[11px]">
                                    <th class="w-10 px-3 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={items().length > 0 && items().every(i => selectedIds().includes(i.id))}
                                            onChange={handleSelectAll}
                                            class="rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </th>
                                    <th class="px-4 py-3">{t('ad.mahasiswa')}</th>
                                    <th class="px-4 py-3">{t('ad.periodeSemester')}</th>
                                    <th class="px-4 py-3 text-center">{t('ad.status')}</th>
                                    <th class="px-4 py-3 text-center">{t('ad.sks')}</th>
                                    <th class="px-4 py-3 text-center">{t('ad.ipsIPK')}</th>
                                    <th class="px-4 py-3 text-center">{t('ad.kunci')}</th>
                                    <th class="px-4 py-3 text-right">{t('ad.aksi')}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700/60">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <tr>
                                            <td colspan="8" class="px-4 py-16 text-center text-neutral-500 dark:text-neutral-400">
                                                <div class="flex flex-col items-center justify-center gap-2">
                                                    <svg class="size-6 animate-spin text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    <span>{t('ad.memuatDataAktivitasMahasiswa')}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    }
                                >
                                    <Show
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="8" class="px-4 py-16 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center max-w-sm mx-auto">
                                                        <div class="size-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-2">
                                                            <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                            </svg>
                                                        </div>
                                                        <h4 class="font-bold text-neutral-800 dark:text-neutral-200">{t('ad.tidakAdaDataAktivitas')}</h4>
                                                        <p class="text-xs text-neutral-500 mt-1">{t('ad.cobaSesuaikanKataKunciPencarianAtau')}</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {item => {
                                                const studentName = item.student_name || item.student?.name || item.name || 'Mahasiswa';
                                                const studentCode = item.student_code || item.student?.code || '-';
                                                const unitName = item.unit_name || item.unit?.name || 'Program Studi';
                                                const semesterName = item.academic_year_name || item.unit_activity?.name || '-';
                                                const status = item.status_name || item.status?.name || 'Aktif';
                                                const ips = Number(item.cumulative_index || 0);
                                                const ipk = Number(item.grand_cumulative_index || 0);
                                                const semSks = item.total_credit ?? 0;
                                                const totalSks = item.grand_total_credit ?? 0;

                                                const isStatusAktif = status.toLowerCase().includes('aktif');
                                                const isStatusCuti = status.toLowerCase().includes('cuti');

                                                return (
                                                    <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                        <td class="px-3 py-3 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds().includes(item.id)}
                                                                onChange={() => handleSelectRow(item.id)}
                                                                class="rounded border-neutral-300 dark:border-neutral-600 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            />
                                                        </td>
                                                        <td class="px-4 py-3">
                                                            <div class="flex items-center gap-2.5">
                                                                <div class="size-8 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-xs shrink-0">
                                                                    {studentName.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div class="min-w-0">
                                                                    <A
                                                                        href={`/administrator/academic/student/campaign/student-activity/${item.id}`}
                                                                        class="font-semibold text-neutral-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate max-w-[200px]"
                                                                    >
                                                                        {studentName}
                                                                    </A>
                                                                    <div class="flex items-center gap-1.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                                                                        <span class="font-mono text-neutral-600 dark:text-neutral-300 font-medium">{studentCode}</span>
                                                                        <span>•</span>
                                                                        <span class="truncate max-w-[130px]">{unitName}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-3">
                                                            <div class="font-medium text-neutral-800 dark:text-neutral-200">{semesterName}</div>
                                                            <Show when={item.unit_activity?.name && item.unit_activity?.name !== semesterName}>
                                                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 truncate max-w-[150px]">
                                                                    {item.unit_activity?.name}
                                                                </div>
                                                            </Show>
                                                        </td>
                                                        <td class="px-4 py-3 text-center">
                                                            <span
                                                                class={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${isStatusAktif
                                                                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
                                                                        : isStatusCuti
                                                                            ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                                                                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-300 dark:border-neutral-700'
                                                                    }`}
                                                            >
                                                                {status}
                                                            </span>
                                                        </td>
                                                        <td class="px-4 py-3 text-center">
                                                            <div class="font-mono font-medium text-neutral-900 dark:text-white">
                                                                {semSks} <span class="text-neutral-400 text-[10px]">sem</span>
                                                            </div>
                                                            <div class="text-[10px] text-neutral-500 font-mono">
                                                                {t('ad.total')} {totalSks} SKS
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-3 text-center">
                                                            <div class="flex items-center justify-center gap-1 font-mono">
                                                                <span
                                                                    class={`px-1.5 py-0.5 rounded text-[11px] font-bold ${ips >= 3.5
                                                                            ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200'
                                                                            : ips >= 3.0
                                                                                ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200'
                                                                                : ips >= 2.5
                                                                                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200'
                                                                                    : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200'
                                                                        }`}
                                                                    title={t('ad.indeksPrestasiSemester')}
                                                                >
                                                                    {ips.toFixed(2)}
                                                                </span>
                                                                <span class="text-neutral-400">/</span>
                                                                <span class="font-semibold text-neutral-700 dark:text-neutral-300" title={t('ad.indeksPrestasiKumulatif')}>
                                                                    {ipk.toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div class="text-[9px] text-neutral-400 uppercase tracking-tighter mt-0.5">
                                                                {t('ad.ipsIPK')}
                                                            </div>
                                                        </td>
                                                        <td class="px-4 py-3 text-center">
                                                            <button
                                                                type="button"
                                                                disabled={lockingId() === item.id}
                                                                onClick={() => handleToggleLock(item)}
                                                                class={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-all ${item.is_lock
                                                                        ? 'bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 hover:bg-amber-100 border border-amber-200 dark:border-amber-800/80'
                                                                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 border border-neutral-300 dark:border-neutral-700'
                                                                    }`}
                                                                title={item.is_lock ? t('ad.klikUntukMembukaKunci') : t('ad.klikUntukMengunciAktivitas')}
                                                            >
                                                                <Show
                                                                    when={lockingId() !== item.id}
                                                                    fallback={
                                                                        <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                        </svg>
                                                                    }
                                                                >
                                                                    <Show
                                                                        when={item.is_lock}
                                                                        fallback={
                                                                            <svg class="size-3.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                                                                            </svg>
                                                                        }
                                                                    >
                                                                        <svg class="size-3.5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                                        </svg>
                                                                    </Show>
                                                                </Show>
                                                                <span>{item.is_lock ? t('ad.kunci') : t('ad.buka')}</span>
                                                            </button>
                                                        </td>
                                                        <td class="px-4 py-3 text-right">
                                                            <div class="flex items-center justify-end gap-1">
                                                                {/* Detail Link */}
                                                                <A
                                                                    href={`/administrator/academic/student/campaign/student-activity/${item.id}`}
                                                                    class="p-1.5 text-neutral-600 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                                    title={t('ad.lihatDetailKRS')}
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                    </svg>
                                                                </A>

                                                                {/* Quick Edit */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openEditModal(item)}
                                                                    class="p-1.5 text-neutral-600 hover:text-amber-600 dark:text-neutral-400 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                                    title={t('ad.editAktivitas')}
                                                                >
                                                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>

                                                                {/* Print KRS */}
                                                                <button
                                                                    type="button"
                                                                    disabled={printingPlanId() === item.id}
                                                                    onClick={() => handlePrintPlan(item)}
                                                                    class="p-1.5 text-neutral-600 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                                                                    title={t('ad.cetakKRSKartuRencanaStudi')}
                                                                >
                                                                    <Show
                                                                        when={printingPlanId() !== item.id}
                                                                        fallback={
                                                                            <svg class="size-4 animate-spin text-purple-600" viewBox="0 0 24 24" fill="none">
                                                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                        }
                                                                    >
                                                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                                        </svg>
                                                                    </Show>
                                                                </button>

                                                                {/* Print KHS */}
                                                                <button
                                                                    type="button"
                                                                    disabled={printingResultId() === item.id}
                                                                    onClick={() => handlePrintResult(item)}
                                                                    class="p-1.5 text-neutral-600 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                                                                    title={t('ad.cetakKHSKartuHasilStudi')}
                                                                >
                                                                    <Show
                                                                        when={printingResultId() !== item.id}
                                                                        fallback={
                                                                            <svg class="size-4 animate-spin text-emerald-600" viewBox="0 0 24 24" fill="none">
                                                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                            </svg>
                                                                        }
                                                                    >
                                                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                                                        </svg>
                                                                    </Show>
                                                                </button>

                                                                {/* Delete Action */}
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openDeleteModal(item)}
                                                                    class="p-1.5 text-neutral-600 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded transition-colors"
                                                                    title={t('ad.hapusAktivitas')}
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
                                </Show>
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div class="px-4 py-3 bg-neutral-50 dark:bg-neutral-900/40 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <div class="text-neutral-600 dark:text-neutral-400">
                            {t('ad.menampilkan')} <span class="font-semibold text-neutral-900 dark:text-white">{items().length ? (currentPage() - 1) * itemsPerPage() + 1 : 0}</span> sampai{' '}
                            <span class="font-semibold text-neutral-900 dark:text-white">{Math.min(currentPage() * itemsPerPage(), totalData())}</span> dari{' '}
                            <span class="font-semibold text-neutral-900 dark:text-white">{totalData()}</span> {t('ad.totalAktivitas2')}
                        </div>

                        <div class="flex items-center gap-1.5">
                            <button
                                type="button"
                                disabled={currentPage() <= 1}
                                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                                class="px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                            >
                                {t('ad.sebelumnya')}
                            </button>

                            <span class="px-3 py-1 font-mono text-neutral-700 dark:text-neutral-300">
                                {currentPage()} / {totalPages()}
                            </span>

                            <button
                                type="button"
                                disabled={currentPage() >= totalPages()}
                                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages()))}
                                class="px-2.5 py-1.5 rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-xs transition-colors"
                            >
                                {t('ad.selanjutnya')}
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal: Tambah Aktivitas Mahasiswa */}
            <Show when={showCreateModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <svg class="size-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span>{t('ad.tambahAktivitasKuliahMahasiswa')}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowCreateModal(false)}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} class="p-6 overflow-y-auto space-y-4 text-xs">
                            {/* Search and Select Student */}
                            <div class="space-y-1.5">
                                <label class="block font-semibold text-neutral-700 dark:text-neutral-300">
                                    {t('ad.pilihMahasiswa')} <span class="text-rose-500">*</span>
                                </label>
                                <div class="relative">
                                    <input
                                        type="text"
                                        value={formStudentSearch()}
                                        onInput={e => {
                                            const val = e.currentTarget.value;
                                            setFormStudentSearch(val);
                                            searchStudents(val);
                                        }}
                                        placeholder={t('ad.ketikNIMAtauNamaMahasiswaMin')}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                    />
                                    <Show when={isSearchingStudents()}>
                                        <div class="absolute right-3 top-2.5 text-neutral-400">
                                            <svg class="size-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        </div>
                                    </Show>
                                </div>

                                <Show when={studentOptions().length > 0}>
                                    <div class="max-h-36 overflow-y-auto border border-neutral-200 dark:border-neutral-700 rounded bg-white dark:bg-neutral-850 shadow-xs divide-y divide-neutral-100 dark:divide-neutral-800">
                                        <For each={studentOptions()}>
                                            {std => (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setFormStudentId(std.id);
                                                        setFormStudentSearch(`${std.code} - ${std.name}`);
                                                        if (std.unit_id) setFormUnitId(std.unit_id);
                                                        setStudentOptions([]);
                                                    }}
                                                    class={`w-full text-left px-3 py-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center justify-between ${formStudentId() === std.id ? 'bg-blue-50 dark:bg-blue-950/60 font-semibold text-blue-600' : ''
                                                        }`}
                                                >
                                                    <div>
                                                        <span class="font-mono font-medium">{std.code}</span> - {std.name}
                                                    </div>
                                                    <span class="text-[10px] text-neutral-400">{std.unit_name || ''}</span>
                                                </button>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                                <Show when={formStudentId()}>
                                    <p class="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                                        <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        {t('ad.mahasiswaTerpilih')}
                                    </p>
                                </Show>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Unit Activity / Periode */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.periodeAktivitasSemester')} <span class="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formUnitActivityId()}
                                        onChange={e => setFormUnitActivityId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">{t('ad.pilihPeriodeAktivitas')}</option>
                                        <For each={campaignActivities()}>
                                            {act => <option value={act.id}>{act.name} {act.academic_year_name ? `(${act.academic_year_name})` : ''}</option>}
                                        </For>
                                    </select>
                                </div>

                                {/* Status Mahasiswa */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.statusPerkuliahan')} <span class="text-rose-500">*</span>
                                    </label>
                                    <select
                                        value={formStatusId()}
                                        onChange={e => setFormStatusId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                        required
                                    >
                                        <option value="">{t('ad.pilihStatus')}</option>
                                        <For each={statuses()}>
                                            {s => <option value={s.id}>{s.name}</option>}
                                        </For>
                                    </select>
                                </div>

                                {/* Program Studi / Unit */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.programStudiUnit')}
                                    </label>
                                    <select
                                        value={formUnitId()}
                                        onChange={e => setFormUnitId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">{t('ad.otomatisDariMahasiswa')}</option>
                                        <For each={studyUnits()}>
                                            {u => <option value={u.id}>{u.name}</option>}
                                        </For>
                                    </select>
                                </div>

                                {/* Biaya Kuliah / SPP */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.biayaKuliahSPPRp')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formFinanceFee()}
                                        onInput={e => setFormFinanceFee(Number(e.currentTarget.value))}
                                        placeholder="0"
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                {/* SKS Semester */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.sksSemester')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formSks()}
                                        onInput={e => setFormSks(Number(e.currentTarget.value))}
                                        placeholder="0"
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                {/* SKS Kumulatif */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.totalSKSKumulatif')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formGrandSks()}
                                        onInput={e => setFormGrandSks(Number(e.currentTarget.value))}
                                        placeholder="0"
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                {/* IPS */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.ipsIndeksPrestasiSemester')}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4"
                                        value={formIps()}
                                        onInput={e => setFormIps(Number(e.currentTarget.value))}
                                        placeholder="0.00"
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    />
                                </div>

                                {/* IPK */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.ipkIndeksPrestasiKumulatif')}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="4"
                                        value={formIpk()}
                                        onInput={e => setFormIpk(Number(e.currentTarget.value))}
                                        placeholder="0.00"
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white font-mono"
                                    />
                                </div>
                            </div>

                            {/* Lock Toggle */}
                            <div class="pt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="createIsLock"
                                    checked={formIsLock()}
                                    onChange={e => setFormIsLock(e.currentTarget.checked)}
                                    class="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label for="createIsLock" class="font-medium text-neutral-800 dark:text-neutral-200">
                                    {t('ad.kunciAktivitasIniKRSDanKHS')}
                                </label>
                            </div>

                            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                    {t('ad.batal')}
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
                                    <span>{t('ad.simpanAktivitas')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* Modal: Edit Aktivitas Mahasiswa */}
            <Show when={showEditModal()}>
                <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
                    <div class="bg-white dark:bg-neutral-800 rounded-lg shadow-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div class="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                <svg class="size-5 text-amber-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                <span>{t('ad.editDataAktivitasMahasiswa')}</span>
                            </h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                class="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                            >
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} class="p-6 overflow-y-auto space-y-4 text-xs">
                            <div class="bg-neutral-50 dark:bg-neutral-850 p-3 rounded border border-neutral-200 dark:border-neutral-700">
                                <div class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                                    {selectedActivity()?.student_name || selectedActivity()?.name}
                                </div>
                                <div class="text-[11px] text-neutral-500 font-mono mt-0.5">
                                    {t('ad.nim')} {selectedActivity()?.student_code || '-'} • Periode: {selectedActivity()?.academic_year_name || '-'}
                                </div>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Status Mahasiswa */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.statusPerkuliahan')}
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

                                {/* Program Studi */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.programStudi')}
                                    </label>
                                    <select
                                        value={formUnitId()}
                                        onChange={e => setFormUnitId(e.currentTarget.value)}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    >
                                        <option value="">{t('ad.default')}</option>
                                        <For each={studyUnits()}>
                                            {u => <option value={u.id}>{u.name}</option>}
                                        </For>
                                    </select>
                                </div>

                                {/* SKS Semester */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.sksSemester')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formSks()}
                                        onInput={e => setFormSks(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                {/* SKS Kumulatif */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.totalSKSKumulatif')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formGrandSks()}
                                        onInput={e => setFormGrandSks(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>

                                {/* IPS */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.ipsIndeksPrestasiSemester')}
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

                                {/* IPK */}
                                <div>
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.ipkIndeksPrestasiKumulatif')}
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

                                {/* Biaya Kuliah */}
                                <div class="sm:col-span-2">
                                    <label class="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                                        {t('ad.biayaTagihanSPPRp')}
                                    </label>
                                    <input
                                        type="number"
                                        value={formFinanceFee()}
                                        onInput={e => setFormFinanceFee(Number(e.currentTarget.value))}
                                        class="w-full px-3 py-2 text-xs rounded border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            {/* Lock Toggle */}
                            <div class="pt-2 flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="editIsLock"
                                    checked={formIsLock()}
                                    onChange={e => setFormIsLock(e.currentTarget.checked)}
                                    class="rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label for="editIsLock" class="font-medium text-neutral-800 dark:text-neutral-200">
                                    {t('ad.kunciAktivitasIniTerkunciDariRevisi')}
                                </label>
                            </div>

                            <div class="pt-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                                >
                                    {t('ad.batal')}
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting()}
                                    class="px-4 py-2 text-xs font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                                >
                                    <Show when={isSubmitting()}>
                                        <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    </Show>
                                    <span>{t('ad.simpanPerubahan')}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>

            {/* Modal: Hapus Aktivitas Mahasiswa */}
            <Show when={showDeleteModal()}>
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
                                    {t('ad.hapusAktivitasMahasiswa')}
                                </h3>
                                <p class="text-xs text-neutral-500 mt-0.5">
                                    {t('ad.tindakanIniTidakDapatDibatalkan')}
                                </p>
                            </div>
                        </div>

                        <div class="bg-neutral-50 dark:bg-neutral-850 p-3 rounded border border-neutral-200 dark:border-neutral-700 text-xs">
                            <p class="text-neutral-700 dark:text-neutral-300">
                                {t('ad.andaAkanMenghapusDataAktivitasSemester')}
                            </p>
                            <p class="font-bold text-neutral-900 dark:text-white mt-1">
                                {selectedActivity()?.student_name || selectedActivity()?.name}
                            </p>
                            <p class="text-neutral-500 font-mono text-[11px]">
                                {t('ad.nim')} {selectedActivity()?.student_code || '-'} • Periode: {selectedActivity()?.academic_year_name || '-'}
                            </p>
                        </div>

                        <div class="flex items-center justify-end gap-2.5 pt-2">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                class="px-4 py-2 text-xs font-semibold rounded border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700"
                            >
                                {t('ad.batal')}
                            </button>
                            <button
                                type="button"
                                disabled={isSubmitting()}
                                onClick={handleDeleteConfirm}
                                class="px-4 py-2 text-xs font-semibold rounded bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <Show when={isSubmitting()}>
                                    <svg class="size-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </Show>
                                <span>{t('ad.yaHapusData')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </Show>
        </div>
    );
}
