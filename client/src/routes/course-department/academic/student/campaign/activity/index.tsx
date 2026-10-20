import { createSignal, onMount, createEffect, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { Loader } from '~/components/loader';
import { toast } from '~/components/toast/Toaster';
import { getLoggedInStaffUnit } from '~/lib/staffHelper';
import { listAcademicYearOptions } from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import {
    listStudentActivities,
    StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import { t } from '../../../../../../i18n';

const activityLabel = (act: StudentActivityItem) =>
    act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || '-';

const detailHref = (act: StudentActivityItem) => `/course-department/academic/student/campaign/activity/${act.id}`;

export default function CourseDepartmentStudentCampaignActivityPage() {
    const [activities, setActivities] = createSignal<StudentActivityItem[]>([]);
    const [academicYears, setAcademicYears] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isResolvingUnit, setIsResolvingUnit] = createSignal(true);

    // Scope is strictly the logged-in staff's unit_id
    const [unitId, setUnitId] = createSignal('');
    const [unitName, setUnitName] = createSignal('');

    const [search, setSearch] = createSignal('');
    const [academicYearId, setAcademicYearId] = createSignal('');
    const [sortBy, setSortBy] = createSignal('student_name-asc');
    const [page, setPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);
    const [totalPages, setTotalPages] = createSignal(1);
    const [totalItems, setTotalItems] = createSignal(0);

    let searchTimer: ReturnType<typeof setTimeout> | undefined;

    const fetchActivities = async () => {
        const uId = unitId();
        if (!uId) {
            setActivities([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const res = await listStudentActivities({
                page: page(),
                page_size: pageSize(),
                unit_id: uId,
                search: search().trim() || undefined,
                academic_year_id: academicYearId() || undefined,
                sort_by: sortBy().split('-')[0],
                sort_dir: sortBy().split('-')[1],
            });
            // Defensive: never show rows outside the staff's unit
            setActivities(res.data.filter((a) => !a.unit_id || a.unit_id === uId));
            setTotalPages(res.total_pages || 1);
            setTotalItems(res.total);
        } catch (err) {
            console.error('Error fetching student activities:', err);
            toast.danger(t('cd.failedToLoadStudentActivitiesFor'));
            setActivities([]);
        } finally {
            setIsLoading(false);
        }
    };

    onMount(async () => {
        try {
            const [staffRes, years] = await Promise.all([getLoggedInStaffUnit(), listAcademicYearOptions()]);
            setAcademicYears(years);
            setUnitId(staffRes.unitId || '');
            setUnitName(staffRes.unit?.name || '');
        } catch (err) {
            console.error('Error resolving staff unit:', err);
        } finally {
            setIsResolvingUnit(false);
        }
    });

    createEffect(() => {
        page();
        academicYearId();
        pageSize();
        sortBy();
        if (!isResolvingUnit()) fetchActivities();
    });

    const handleSearchInput = (val: string) => {
        setSearch(val);
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            if (page() === 1) fetchActivities();
            else setPage(1);
        }, 400);
    };

    const handleReset = () => {
        setSearch('');
        setAcademicYearId('');
        setPage(1);
        fetchActivities();
    };

    const studentHref = (act: StudentActivityItem) =>
        `/course-department/academic/student/master/student/${act.student_id}`;

    const linkBtn =
        'inline-flex items-center px-2.5 py-1 rounded-xs text-[10px] font-bold bg-sky-100 text-sky-800 hover:bg-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:hover:bg-sky-900 transition-colors';
    const pageBtn =
        'px-3 py-1.5 text-xs font-semibold rounded-xs border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors cursor-pointer';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                    <div>
                        <h1 class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">{t('cd.aktivitasKuliahMahasiswa')}</h1>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                            {unitName() ? t('cd.studyProgramName', { name: unitName() }) : t('cd.aktivitasSemesterMahasiswaPadaProgramStudi')}
                        </p>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            value={search()}
                            onInput={(e) => handleSearchInput(e.currentTarget.value)}
                            placeholder={t('cd.cariNIMNamaMahasiswa')}
                            class="flex-1 px-3 py-2 text-xs rounded-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        />
                        <select
                            value={academicYearId()}
                            onChange={(e) => {
                                setAcademicYearId(e.currentTarget.value);
                                setPage(1);
                            }}
                            class="px-3 py-2 text-xs rounded-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        >
                            <option value="">{t('cd.semuaTahunAjaran')}</option>
                            <For each={academicYears()}>{(y) => <option value={y.id}>{y.name}</option>}</For>
                        </select>
                        <select
                            value={sortBy()}
                            onChange={(e) => {
                                setSortBy(e.currentTarget.value);
                                setPage(1);
                            }}
                            class="px-3 py-2 text-xs rounded-xs border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900"
                        >
                            <option value="student_name-asc">{t('cd.fullNameAZ')}</option>
                            <option value="student_name-desc">{t('cd.fullNameZA')}</option>
                            <option value="student_code-asc">{t('cd.nimCodeAscending')}</option>
                            <option value="student_code-desc">{t('cd.nimCodeDescending')}</option>
                        </select>
                        <Show when={search() || academicYearId()}>
                            <button type="button" onClick={handleReset} class={pageBtn}>{t('cd.reset')}</button>
                        </Show>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <Show
                        when={!isResolvingUnit() && !isLoading()}
                        fallback={<Loader message={t('cd.loadingStudentActivities')} color="teal" size="lg" class="py-20" />}
                    >
                        <Show
                            when={unitId()}
                            fallback={
                                <div class="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                                    {t('cd.akunAndaTidakTerhubungDenganProgram')}
                                </div>
                            }
                        >
                            <Show
                                when={activities().length > 0}
                                fallback={
                                    <div class="p-8 text-center text-xs text-neutral-500 dark:text-neutral-400">
                                        {t('cd.tidakAdaAktivitasMahasiswaDitemukan')}
                                    </div>
                                }
                            >
                                {/* Desktop table */}
                                <div class="hidden md:block overflow-x-auto">
                                    <table class="w-full text-xs text-left border-collapse">
                                        <thead class="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                            <tr>
                                                <th class="px-5 py-3">{t('cd.nim')}</th>
                                                <th class="px-5 py-3">{t('cd.mahasiswa')}</th>
                                                <th class="px-5 py-3">{t('cd.semesterTahunAjaran')}</th>
                                                <th class="px-5 py-3 text-center">{t('cd.sks')}</th>
                                                <th class="px-5 py-3 text-center">{t('cd.ips')}</th>
                                                <th class="px-5 py-3 text-center">{t('cd.ipk')}</th>
                                                <th class="px-5 py-3 text-center">{t('cd.status')}</th>
                                                <th class="px-5 py-3 text-center">{t('cd.aksi')}</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                                            <For each={activities()}>
                                                {(act) => (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                        <td class="px-5 py-3 font-mono text-teal-700 dark:text-teal-400">{act.student_code || '-'}</td>
                                                        <td class="px-5 py-3 font-medium text-neutral-900 dark:text-white">
                                                            <A href={studentHref(act)} class="hover:underline">{act.student_name || '-'}</A>
                                                        </td>
                                                        <td class="px-5 py-3">{activityLabel(act)}</td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold">{act.total_credit || 0}</td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                                                            {Number(act.cumulative_index || 0).toFixed(2)}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            {Number(act.grand_cumulative_index || act.cumulative_index || 0).toFixed(2)}
                                                        </td>
                                                        <td class="px-5 py-3 text-center">
                                                            <span class="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                {act.status_name || '-'}
                                                            </span>
                                                        </td>
                                                        <td class="px-5 py-3 text-center">
                                                            <A href={detailHref(act)} class={linkBtn}>{t('cd.detail')}</A>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile cards */}
                                <div class="md:hidden divide-y divide-neutral-100 dark:divide-neutral-700/60">
                                    <For each={activities()}>
                                        {(act) => (
                                            <div class="p-4 space-y-3">
                                                <div class="flex items-start justify-between gap-3">
                                                    <div class="min-w-0">
                                                        <p class="text-[10px] font-mono text-teal-700 dark:text-teal-400">{act.student_code || '-'}</p>
                                                        <A href={studentHref(act)} class="text-sm font-medium text-neutral-900 dark:text-white">
                                                            {act.student_name || '-'}
                                                        </A>
                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">{activityLabel(act)}</p>
                                                    </div>
                                                    <span class="px-2 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 shrink-0">
                                                        {act.status_name || '-'}
                                                    </span>
                                                </div>
                                                <div class="grid grid-cols-3 gap-2 text-center text-xs">
                                                    <div>
                                                        <p class="text-[10px] uppercase text-neutral-500 dark:text-neutral-400">{t('cd.sks')}</p>
                                                        <p class="font-mono font-bold">{act.total_credit || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p class="text-[10px] uppercase text-neutral-500 dark:text-neutral-400">{t('cd.ips')}</p>
                                                        <p class="font-mono font-bold text-sky-600 dark:text-sky-400">{Number(act.cumulative_index || 0).toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p class="text-[10px] uppercase text-neutral-500 dark:text-neutral-400">{t('cd.ipk')}</p>
                                                        <p class="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            {Number(act.grand_cumulative_index || act.cumulative_index || 0).toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <A href={detailHref(act)} class={`${linkBtn} w-full justify-center py-2 text-xs`}>{t('cd.lihatDetail')}</A>
                                            </div>
                                        )}
                                    </For>
                                </div>

                                {/* Pagination */}
                                <div class="p-4 border-t border-neutral-200 dark:border-neutral-700 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50 dark:bg-neutral-900/30">
                                    <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                        {t('cd.page')} {page()} {t('cd.of')} {totalPages()} ({totalItems()} total)
                                    </span>
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-xs text-neutral-400 font-mono">{t('cd.rowsPerPage')}</span>
                                        <select
                                            value={pageSize()}
                                            onChange={(e) => {
                                                setPageSize(Number(e.currentTarget.value));
                                                setPage(1);
                                            }}
                                            class="px-2.5 py-1.5 text-xs rounded-xs bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700"
                                        >
                                            <For each={[10, 25, 50, 100]}>{(n) => <option value={n}>{n}</option>}</For>
                                        </select>
                                        <button type="button" class={pageBtn} disabled={page() <= 1} onClick={() => setPage(page() - 1)}>
                                            {t('cd.previous')}
                                        </button>
                                        <button type="button" class={pageBtn} disabled={page() >= totalPages()} onClick={() => setPage(page() + 1)}>
                                            {t('cd.next')}
                                        </button>
                                    </div>
                                </div>
                            </Show>
                        </Show>
                    </Show>
                </div>
            </main>
        </div>
    );
}
