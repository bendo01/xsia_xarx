import { createSignal, createEffect, For, Show, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import { masterApiIndex, masterApiOptions, type MasterOptionItem } from '~/controllers/master/masterApiController';
import { isUsableInstitutionId } from '~/lib/rectoratCourseScope';
import type { AcademicCandidateMasterCandidate } from '~/models/academic/candidate/master/Candidate';
import { t } from '../../../../../../../../i18n';

export default function RectoratCandidateIndex() {
    const params = useParams();
    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const institutionId = () => resolvedInstitutionId() || params.id;

    const [academicYears, setAcademicYears] = createSignal<MasterOptionItem[]>([]);
    const [filterAcademicYear, setFilterAcademicYear] = createSignal('');
    const [allItems, setAllItems] = createSignal<AcademicCandidateMasterCandidate[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [filterStatus, setFilterStatus] = createSignal('');

    const filteredItems = createMemo(() => {
        let data = allItems();
        const q = searchQuery().toLowerCase().trim();
        if (q) {
            data = data.filter(
                (c) => (c.name ?? '').toLowerCase().includes(q) ||
                    (c.code ?? '').toLowerCase().includes(q) ||
                    (c.school_name ?? '').toLowerCase().includes(q),
            );
        }
        if (filterStatus() === 'enrolled') data = data.filter((c) => !!c.student_id);
        if (filterStatus() === 'not') data = data.filter((c) => !c.student_id);
        if (filterAcademicYear()) data = data.filter((c) => c.academic_year_id === filterAcademicYear());
        return data;
    });

    const totalPages = createMemo(() => Math.max(1, Math.ceil(filteredItems().length / itemsPerPage())));
    const pagedItems = createMemo(() => {
        const start = (currentPage() - 1) * itemsPerPage();
        return filteredItems().slice(start, start + itemsPerPage());
    });
    const activeCount = createMemo(() => allItems().filter((c) => !!c.student_id).length);
    const inactiveCount = createMemo(() => allItems().filter((c) => !!!c.student_id).length);

    const fetchData = async () => {
        let instId = resolvedInstitutionId();
        if (!isUsableInstitutionId(instId)) {
            instId = await resolveInstitutionFromStaffRole(params.id);
            if (instId) setResolvedInstitutionId(instId);
        }
        if (!isUsableInstitutionId(instId)) {
            setAllItems([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            masterApiOptions('academic/general/reference/academic-years').then(setAcademicYears);
            const res = await masterApiIndex<AcademicCandidateMasterCandidate>('academic/candidate/master/candidates', {
                page: 1,
                per_page: 1000,
                institution_id: instId,
            } as any);
            setAllItems((res.data ?? []).filter((c) => !c.institution_id || c.institution_id === instId));
        } catch (e) {
            console.error(e);
            setAllItems([]);
            toast.danger(t('rt.gagalMemuatCalonMahasiswa'));
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        params.id;
        fetchData();
    });

    let searchTimeout: any;
    const handleSearch = (e: Event) => {
        const val = (e.target as HTMLInputElement).value;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            setSearchQuery(val);
            setCurrentPage(1);
        }, 300);
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage() + 1;
    const endIndex = () => Math.min(startIndex() + pagedItems().length - 1, filteredItems().length);
    const detailHref = (id: string) => `/rectorat/institution/${institutionId()}/academic/candidate/master/candidate/${id}`;

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-violet-600 transition-colors">{t('rt.rektorat')}</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-violet-600 transition-colors">{t('rt.institusi')}</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-violet-600 transition-colors">{t('rt.akademik')}</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">{t('rt.calonMahasiswa')}</span>
                        </nav>
                        <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                            <span class="text-violet-600 dark:text-violet-400">{t('rt.daftarCalonMahasiswa')}</span>
                        </h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            {t('rt.seluruhCalonMahasiswaDalamInstitusi')}
                        </p>
                    </div>

                    <div class="flex items-center gap-3 shrink-0">
                        <div class="text-center px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-sm min-w-18">
                            <p class="text-2xl font-black text-neutral-900 dark:text-white">{allItems().length}</p>
                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-medium uppercase tracking-wide">{t('rt.total')}</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 shadow-sm min-w-18">
                            <p class="text-2xl font-black text-emerald-700 dark:text-emerald-400">{activeCount()}</p>
                            <p class="text-[11px] text-emerald-600 dark:text-emerald-500 font-medium uppercase tracking-wide">{t('rt.sudahJadiMahasiswa')}</p>
                        </div>
                        <div class="text-center px-4 py-2.5 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 shadow-sm min-w-18">
                            <p class="text-2xl font-black text-amber-700 dark:text-amber-400">{inactiveCount()}</p>
                            <p class="text-[11px] text-amber-600 dark:text-amber-500 font-medium uppercase tracking-wide">{t('rt.belumJadiMahasiswa')}</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row items-center gap-3">
                    <input
                        type="text"
                        class="block w-full sm:w-96 p-3 text-sm border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white shadow-sm"
                        placeholder={t('rt.cariCalonMahasiswa')}
                        onInput={handleSearch}
                    />
                    <select
                        class="w-full sm:w-64 p-3 text-sm border border-neutral-200 rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-800 dark:text-white shadow-sm"
                        value={filterStatus()}
                        onChange={(e) => {
                            setFilterStatus(e.currentTarget.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">{t('rt.status')}</option>
                        <option value="enrolled">{t('rt.sudahJadiMahasiswa')}</option>
                        <option value="not">{t('rt.belumJadiMahasiswa')}</option>
                    </select>
                    <select
                        class="w-full sm:w-64 p-3 text-sm border border-neutral-200 rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-800 dark:text-white shadow-sm"
                        value={filterAcademicYear()}
                        onChange={(e) => {
                            setFilterAcademicYear(e.currentTarget.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="">{t('rt.tahunAkademik')}</option>
                        <For each={academicYears()}>{(y) => <option value={y.id}>{y.name}</option>}</For>
                    </select>
                    <select
                        class="w-full sm:w-40 p-3 text-sm border border-neutral-200 rounded-lg bg-white dark:bg-neutral-900 dark:border-neutral-800 dark:text-white shadow-sm"
                        value={itemsPerPage()}
                        onChange={(e) => {
                            setItemsPerPage(Number(e.currentTarget.value));
                            setCurrentPage(1);
                        }}
                    >
                        <option value={10}>10 {t('rt.tampilkanHalaman')}</option>
                        <option value={25}>25 {t('rt.tampilkanHalaman')}</option>
                        <option value={50}>50 {t('rt.tampilkanHalaman')}</option>
                    </select>
                </div>

                <div class="border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left">
                            <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-950 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-800">
                                <tr>
                                    <th class="px-4 py-3.5 w-36">{t('rt.kode')}</th>
                                    <th class="px-4 py-3.5">{t('rt.calonMahasiswa')}</th>
                                    <th class="px-4 py-3.5">{t('rt.sekolah')}</th>
                                    <th class="px-4 py-3.5">{t('rt.nisnLabel')}</th>
                                    <th class="px-4 py-3.5">{t('rt.status')}</th>
                                    <th class="px-4 py-3.5 text-right">{t('rt.aksi')}</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-800">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 5 })}>
                                            {() => (
                                                <tr class="animate-pulse">
                                                    <td colspan="6" class="px-4 py-4"><div class="h-4 w-full bg-neutral-200 dark:bg-neutral-800 rounded"></div></td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={pagedItems().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="6" class="px-4 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                                    <span class="font-semibold">{t('rt.noRecordsFound')}</span>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={pagedItems()}>
                                            {(c) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                                                    <td class="px-4 py-3 font-mono">
                                                        <span class="px-2 py-0.5 text-xs bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded">{c.code || '-'}</span>
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <A href={detailHref(c.id)} class="font-semibold text-violet-600 dark:text-violet-400 hover:underline">{c.name || '-'}</A>
                                                    </td>
                                                    <td class="px-4 py-3 text-neutral-600 dark:text-neutral-300">{c.school_name || '-'}</td>
                                                    <td class="px-4 py-3 font-mono">{c.student_national_number || '-'}</td>
                                                    <td class="px-4 py-3">
                                                        <span
                                                            class={`px-2 py-0.5 text-xs font-semibold rounded-full ${!c.student_id
                                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'}`}
                                                        >
                                                            {c.student_id ? t('rt.sudahJadiMahasiswa') : t('rt.belumJadiMahasiswa')}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3 text-right">
                                                        <A href={detailHref(c.id)} class="text-xs font-medium text-violet-600 hover:underline">{t('rt.lihatDetail')}</A>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>

                    <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-800 px-6 py-4 gap-3">
                        <p class="text-sm text-neutral-600 dark:text-neutral-400">
                            {t('rt.showing')} <span class="font-semibold">{filteredItems().length > 0 ? startIndex() : 0}</span>–<span class="font-semibold">{endIndex()}</span> {t('rt.dari')} <span class="font-semibold">{filteredItems().length.toLocaleString()}</span> {t('rt.hasil')}
                        </p>
                        <nav class="inline-flex gap-2" aria-label="pagination">
                            <button
                                type="button"
                                class="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                disabled={currentPage() <= 1 || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                {t('rt.previous')}
                            </button>
                            <span class="px-4 py-2 text-sm font-semibold text-violet-700 dark:text-violet-400">{currentPage()} / {totalPages()}</span>
                            <button
                                type="button"
                                class="px-3 py-2 text-sm border border-neutral-300 dark:border-neutral-700 rounded-lg bg-white dark:bg-neutral-900 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                disabled={currentPage() >= totalPages() || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                            >
                                {t('rt.next')}
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </div>
    );
}
