import { createSignal, createEffect, Show, For } from 'solid-js';
import { useParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import { isUsableInstitutionId, loadInstitutionUnits } from '~/lib/rectoratCourseScope';
import { t } from '../../../../../../../../../i18n';

export default function RectoratCourseDetail() {
    const params = useParams();
    const location = useLocation();
    // This route nests two dynamic segments named `id`: params.id is the record id,
    // so the institution id is read from the pathname.
    const institutionIdFromPath = () => {
        const parts = (location.pathname || '').split('/').filter(Boolean);
        const idx = parts.indexOf('institution');
        return idx !== -1 ? parts[idx + 1] ?? '' : '';
    };
    const [institutionId, setInstitutionId] = createSignal('');
    const [isLoading, setIsLoading] = createSignal(true);
    const [record, setRecord] = createSignal<any | null>(null);
    const [unitName, setUnitName] = createSignal('-');

    const listHref = () => `/rectorat/institution/${institutionId()}/academic/course/master/course`;

    const fetchDetail = async (courseId: string) => {
        if (!courseId || courseId === '[id]' || courseId === ':id') {
            setRecord(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const instId = await resolveInstitutionFromStaffRole(institutionIdFromPath());
            setInstitutionId(instId || '');
            const res = await masterApiShow('academic/course/master/courses', courseId);
            const units = isUsableInstitutionId(instId) ? await loadInstitutionUnits(instId) : [];
            const unit = units.find((u) => u.id === res.data?.unit_id);
            if (res.data && unit) {
                setRecord(res.data);
                setUnitName(unit.name);
            } else {
                setRecord(null);
                toast.danger(t('rt.mataKuliahTidakDitemukan'));
            }
        } catch (error) {
            console.error('Error fetching course detail:', error);
            setRecord(null);
            toast.danger(t('rt.gagalMemuatMataKuliah'));
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        fetchDetail(params.id as string);
    });

    const copyToClipboard = (text: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success('ID', 3000);
    };

    const metric = (label: string, value: any) => (
        <div class="p-4 bg-neutral-50 dark:bg-neutral-950/50 border border-border rounded-lg min-w-0">
            <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">{label}</span>
            <span class="font-mono text-foreground block truncate">{value ?? '-'}</span>
        </div>
    );

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-foreground">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-2 text-xs text-muted-foreground mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-violet-600 transition-colors">{t('rt.rektorat')}</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-violet-600 transition-colors">{t('rt.akademik')}</A>
                            <span>/</span>
                            <A href={listHref()} class="hover:text-violet-600 transition-colors">{t('rt.mataKuliah')}</A>
                            <span>/</span>
                            <span class="text-foreground/80 font-semibold">{t('rt.detail')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight text-violet-600 dark:text-violet-400">
                            {t('rt.detailMataKuliah')}
                        </h1>
                    </div>
                    <A
                        href={listHref()}
                        class="inline-flex items-center justify-center px-3.5 py-2 text-sm font-medium border border-border rounded-lg bg-card hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    >
                        {t('rt.backToList')}
                    </A>
                </div>

                <div class="bg-card border border-border rounded-xl shadow-sm p-4 sm:p-6">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                                <div class="h-16 bg-neutral-200 dark:bg-neutral-800 rounded"></div>
                            </div>
                        }
                    >
                        <Show
                            when={record()}
                            fallback={<p class="py-12 text-center text-neutral-500 font-semibold">{t('rt.mataKuliahTidakDitemukan')}</p>}
                        >
                            <div class="space-y-6">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                                    <h2 class="text-xl font-bold wrap-break-words">{record()?.name || '-'}</h2>
                                    <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 rounded-full">
                                        {t('rt.code')} {record()?.code || '-'}
                                    </span>
                                </div>

                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                    {metric(t('rt.sks'), record()?.total_credit)}
                                    {metric(t('rt.sksKuliah'), record()?.lecture_credit)}
                                    {metric(t('rt.sksPraktik'), record()?.practice_credit)}
                                    {metric(t('rt.unitLabel'), unitName())}
                                </div>

                                <div>
                                    <div class="flex items-center justify-between mb-3">
                                        <h3 class="text-sm font-bold">{t('rt.semuaAtributData')}</h3>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(record()?.id)}
                                            class="text-xs font-medium text-violet-600 hover:underline cursor-pointer"
                                        >
                                            {t('rt.copy')} ID
                                        </button>
                                    </div>
                                    <div class="border border-border rounded-lg overflow-hidden divide-y divide-neutral-200 dark:divide-neutral-800">
                                        <For each={Object.entries(record() || {})}>
                                            {([key, val]) => (
                                                <div class="grid grid-cols-1 md:grid-cols-3 gap-1 md:gap-4 px-4 py-2.5 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800/40">
                                                    <div class="font-mono font-semibold text-muted-foreground">{key}</div>
                                                    <div class="md:col-span-2 font-mono break-all">
                                                        {typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val ?? '-')}
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}
