import { createSignal, onMount, For, Show } from 'solid-js';
import { A, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    currentUserSignal, 
    refreshAuthState, 
} from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import type { PersonMasterIndividual } from '~/models/person/master/Individual';
import { 
    listStudents, 
    listStudyUnits, 
    StudentMasterItem 
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { t } from '../../../../../i18n';
import { Spinner } from '~/components/loader';

export default function StudentMasterIndexPage() {
    const [searchParams] = useSearchParams();
    const [students, setStudents] = createSignal<StudentMasterItem[]>([]);
    const [individual, setIndividual] = createSignal<PersonMasterIndividual | null>(null);
    const [units, setUnits] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [page, setPage] = createSignal(1);
    const [pageSize, setPageSize] = createSignal(10);
    const [totalPages, setTotalPages] = createSignal(1);
    const [totalItems, setTotalItems] = createSignal(0);

    const resolveIndividualId = async (): Promise<string> => {
        let targetIndId = (searchParams.id as string) || (searchParams.individual_id as string) || currentUserSignal()?.individual_id || getStorageItem('individual_id') || '';
        if (!targetIndId || targetIndId === '00000000-0000-0000-0000-000000000000') {
            const curUserRes = await GetCurrentUser();
            if (curUserRes.code === 200 && curUserRes.data?.individual_id) {
                targetIndId = curUserRes.data.individual_id;
                refreshAuthState();
            }
        }
        return targetIndId;
    };

    const fetchStudents = async () => {
        setIsLoading(true);
        try {
            const targetIndId = await resolveIndividualId();
            
            let indRecord: PersonMasterIndividual | null = null;
            if (targetIndId && targetIndId !== '00000000-0000-0000-0000-000000000000') {
                const indRes = await PersonMasterIndividualControllerShow(targetIndId);
                if (!indRes.is_error && indRes.data?.individual) {
                    indRecord = indRes.data.individual;
                    setIndividual(indRecord);
                }
            }

            const indId = indRecord?.id || targetIndId;

            const [res, uRes] = await Promise.all([
                listStudents({
                    page: page(),
                    page_size: pageSize(),
                    name: searchQuery() || undefined,
                    individual_id: indId || undefined,
                }),
                listStudyUnits(),
            ]);

            const rawItems = res.data || [];
            const filteredItems = indId 
                ? rawItems.filter((item) => item.individual_id === indId)
                : rawItems;

            const items = filteredItems.map((item) => ({
                ...item,
                unit_name: item.unit_name || '-',
                status_name: item.status_name || 'Active',
                selection_type_name: item.selection_type_name || '-',
                academic_year_name: item.academic_year_name || '-',
            }));

            setStudents(items);
            setUnits(uRes || []);
            setTotalPages(res.total_pages || 1);
            setTotalItems(res.total ?? items.length);
        } catch (err) {
            console.error('Error fetching students:', err);
            toast.danger(t('st.failedToLoadAdmittedStudentDirectory'));
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchStudents();
    });

    const handleSearchSubmit = (e: Event) => {
        e.preventDefault();
        setPage(1);
        fetchStudents();
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header Card */}
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-1">
                            <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                <span>{t('st.student')}</span>
                                <span>/</span>
                                <span>{t('st.academic')}</span>
                                <span>/</span>
                                <span>{t('st.student')}</span>
                                <span>/</span>
                                <span class="font-medium text-neutral-900 dark:text-white">{t('st.master')}</span>
                            </nav>
                            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                                {t('st.admittedStudentsDirectory')}
                            </h1>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                                {t('st.comprehensiveInstitutionalRegistryOfAdmittedStudents')}
                            </p>
                        </div>

                        <div class="flex items-center gap-3">
                            <A
                                href={currentUserSignal()?.individual_id || getStorageItem('individual_id') ? `/student/person/master/individual/${currentUserSignal()?.individual_id || getStorageItem('individual_id')}/show` : '/student/person/master/individual/[id]/show'}
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xs text-xs font-bold transition-colors"
                            >
                                {t('st.myProfile')}
                            </A>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs p-4 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <form onSubmit={handleSearchSubmit} class="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder={t('st.searchByStudentNIMOrName')}
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-9 pr-4 py-2 text-xs rounded-xs bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <svg class="size-4 absolute left-3 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </form>

                    <div class="flex items-center gap-3 w-full sm:w-auto">
                        <span class="text-xs text-neutral-400 font-mono">
                            {t('st.total2')} <strong class="text-neutral-700 dark:text-neutral-200">{totalItems()}</strong> {t('st.students')}
                        </span>
                    </div>
                </div>

                {/* Student Master Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <Show when={!isLoading()} fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <Spinner size="lg" color="blue" aria-hidden={true} />
                            <p class="text-xs font-mono">{t('st.loadingAdmittedStudentsFromServer')}</p>
                        </div>
                    }>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3.5 px-4 text-start">{t('st.studentNIM')}</th>
                                        <th class="py-3.5 px-4 text-start">{t('st.fullName')}</th>
                                        <th class="py-3.5 px-4 text-start">{t('st.studyProgram')}</th>
                                        <th class="py-3.5 px-4 text-start">{t('st.admissionPath')}</th>
                                        <th class="py-3.5 px-4 text-center">{t('st.registrationDate')}</th>
                                        <th class="py-3.5 px-4 text-center">{t('st.status')}</th>
                                        <th class="py-3.5 px-4 text-end">{t('st.action')}</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={students()} fallback={
                                        <tr>
                                            <td colspan="7" class="py-16 text-center">
                                                <div class="flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-500">
                                                    <svg class="size-10 text-neutral-300 dark:text-neutral-600 mb-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                                                        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                                                    </svg>
                                                    <p class="text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                                                        {t('st.noAdmittedStudentRecordsFound')}
                                                    </p>
                                                    <p class="text-xs text-neutral-400 max-w-sm">
                                                        {searchQuery() 
                                                            ? t('st.noStudentsMatchingQueryWereFound', { query: searchQuery() }) 
                                                            : t('st.thereAreCurrentlyNoAdmittedStudent')}
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    }>
                                        {(std) => (
                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                <td class="py-3.5 px-4 font-mono font-bold text-blue-600 dark:text-blue-400">
                                                    {std.code}
                                                </td>
                                                <td class="py-3.5 px-4 font-bold text-neutral-900 dark:text-white">
                                                    {std.name}
                                                </td>
                                                <td class="py-3.5 px-4 text-neutral-600 dark:text-neutral-300">
                                                    {std.unit_name || 'Informatics Engineering'}
                                                </td>
                                                <td class="py-3.5 px-4">
                                                    <span class="inline-block px-2 py-0.5 rounded-xs text-[10px] font-semibold bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300">
                                                        {std.selection_type_name || 'SNBP'}
                                                    </span>
                                                </td>
                                                <td class="py-3.5 px-4 text-center font-mono text-neutral-500 dark:text-neutral-400">
                                                    {std.registered}
                                                </td>
                                                <td class="py-3.5 px-4 text-center">
                                                    <span class="px-2.5 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                        {t('st.active')}
                                                    </span>
                                                </td>
                                                <td class="py-3.5 px-4 text-end">
                                                    <A
                                                        href={`/student/academic/student/master/student/${std.id}/show`}
                                                        class="px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-xs text-xs font-bold transition-colors"
                                                    >
                                                        {t('st.viewDetail')}
                                                    </A>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        <div class="p-4 border-t border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <span class="text-xs text-neutral-400 font-mono">
                                {t('st.page')} {page()} of {totalPages()}
                            </span>
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (page() > 1) {
                                            setPage(page() - 1);
                                            fetchStudents();
                                        }
                                    }}
                                    disabled={page() <= 1}
                                    class="px-3 py-1 text-xs rounded-xs border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                >
                                    {t('st.previous')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (page() < totalPages()) {
                                            setPage(page() + 1);
                                            fetchStudents();
                                        }
                                    }}
                                    disabled={page() >= totalPages()}
                                    class="px-3 py-1 text-xs rounded-xs border border-neutral-200 dark:border-neutral-700 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                                >
                                    {t('st.next')}
                                </button>
                            </div>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
