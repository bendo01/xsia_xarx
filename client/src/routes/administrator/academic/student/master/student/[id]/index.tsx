import { createSignal, onMount, createEffect, Show, For, JSX } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';

const NIL_UUID = '00000000-0000-0000-0000-000000000000';

const text = (val: any): string => {
    if (val === null || val === undefined || val === '' || val === NIL_UUID) return '-';
    return String(val);
};

const formatDate = (val?: string | null): string => {
    if (!val) return '-';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
};

const formatDateTime = (val?: string | null): string => {
    if (!val) return '-';
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const formatNumber = (val?: number | null, digits = 0): string => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('id-ID', { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const formatCurrency = (val?: number | null): string => {
    if (val === null || val === undefined) return '-';
    return Number(val).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
};

const refLabel = (ref: any, fallbackName?: string | null): string => {
    const name = ref?.name || fallbackName;
    if (!name) return '-';
    return ref?.code ? `${ref.code} — ${name}` : name;
};

function Field(props: { label: string; value: JSX.Element; mono?: boolean }) {
    return (
        <div class="min-w-0">
            <dt class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">{props.label}</dt>
            <dd class={`mt-0.5 text-xs sm:text-sm text-neutral-900 dark:text-white wrap-break-word ${props.mono ? 'font-mono' : ''}`}>
                {props.value}
            </dd>
        </div>
    );
}

function Section(props: { title: string; children: JSX.Element }) {
    return (
        <section class="border border-neutral-200 dark:border-neutral-700">
            <h3 class="px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider text-neutral-700 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-700">
                {props.title}
            </h3>
            <div class="p-4">{props.children}</div>
        </section>
    );
}

export default function MasterShowPage() {
    const apiPath = "academic/student/master/students";
    const basePath = "/administrator/academic/student/master/student";
    const params = useParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [record, setRecord] = createSignal<any | null>(null);
    const [selectedId, setSelectedId] = createSignal<string>((params.id as string) || '');

    const fetchDetail = async (id: string) => {
        if (!id) {
            setRecord(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await masterApiShow(apiPath, id);
            if (res.data) {
                setRecord(res.data);
            } else {
                setRecord(null);
                toast.danger(res.error || 'Record not found on server.');
            }
        } catch (error) {
            console.error('Error fetching detail:', error);
            setRecord(null);
            toast.danger('Failed to load record from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = (params.id as string) || '';
        fetchDetail(id);
    });

    createEffect(() => {
        const id = params.id as string;
        if (id && id !== selectedId()) {
            setSelectedId(id);
            fetchDetail(id);
        }
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    const individualFullName = () => {
        const ind = record()?.individual;
        if (!ind) return '-';
        return [ind.front_title, ind.name, ind.last_title].filter(Boolean).join(' ');
    };

    const activities = () => {
        const list = (record()?.student_activities || []) as any[];
        return [...list].sort((a, b) =>
            String(a.academic_year?.code || a.academic_year_name || '').localeCompare(String(b.academic_year?.code || b.academic_year_name || ''))
        );
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
                            <span>Academic</span>
                            <span>/</span>
                            <span>Student</span>
                            <span>/</span>
                            <span>Master</span>
                            <span>/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors">Student</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Detail</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Student Details
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0 flex items-center gap-2">
                        <a
                            href={basePath}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-xs shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span>Back to List</span>
                        </a>
                        <Show when={selectedId()}>
                            <a
                                href={`${basePath}/${selectedId()}/edit`}
                                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xs shadow-xs transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 20h9" />
                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                </svg>
                                <span>Edit Student</span>
                            </a>
                        </Show>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-4 w-96 max-w-full bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="grid grid-cols-2 gap-4 pt-4">
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                </div>
                            </div>
                        }
                    >
                        <Show
                            when={record()}
                            fallback={
                                <div class="py-12 text-center text-neutral-500">
                                    <p class="text-base font-semibold">No record details found.</p>
                                    <p class="text-xs mt-1">Check if the ID parameter in the URL is valid.</p>
                                </div>
                            }
                        >
                            <div class="space-y-6">
                                {/* Title banner */}
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-700 pb-4">
                                    <div class="min-w-0">
                                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Student Name</span>
                                        <h2 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-mono wrap-break-word">
                                            {text(record()?.name)}
                                        </h2>
                                        <p class="text-xs font-mono text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            NIM {text(record()?.code)}
                                        </p>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2 shrink-0">
                                        <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                                            {(record()?.status_name || record()?.status?.name || 'UNKNOWN').toUpperCase()}
                                        </span>
                                        <Show when={record()?.resign_status?.name}>
                                            <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700">
                                                {record()?.resign_status?.name}
                                            </span>
                                        </Show>
                                    </div>
                                </div>

                                {/* Highlights */}
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-xs">
                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">UUID</span>
                                        <div class="flex items-center justify-between gap-2">
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 truncate">{text(record()?.id)}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(record()?.id, 'ID')}
                                                class="text-blue-600 hover:text-blue-700 cursor-pointer font-mono shrink-0"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Unit</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{refLabel(record()?.unit, record()?.unit_name)}</span>
                                    </div>
                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Entry Academic Year</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{text(record()?.academic_year_name || record()?.academic_year?.name)}</span>
                                    </div>
                                    <div class="p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1">Registered</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200 block truncate">{formatDate(record()?.registered)}</span>
                                    </div>
                                </div>

                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                    <Section title="Academic Information">
                                        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <Field label="Concentration" value={refLabel(record()?.concentration)} />
                                            <Field label="Curriculum" value={text(record()?.curriculum_name || record()?.curriculum?.name)} />
                                            <Field label="Class Code" value={refLabel(record()?.class_code)} />
                                            <Field label="Selection Type" value={text(record()?.selection_type_name || record()?.selection_type?.name)} />
                                            <Field label="Registration" value={text(record()?.registration?.name)} />
                                            <Field label="Resign Status" value={text(record()?.resign_status?.name)} />
                                            <Field label="Finance" value={text(record()?.finance?.name)} />
                                            <Field label="Finance Fee" value={formatCurrency(record()?.finance_fee)} mono />
                                            <Field label="NISN" value={text(record()?.nisn)} mono />
                                            <Field label="Transfer Code" value={text(record()?.transfer_code)} mono />
                                        </dl>
                                    </Section>

                                    <Section title="Personal Information">
                                        <Show
                                            when={record()?.individual}
                                            fallback={<p class="text-xs text-neutral-500">No linked individual record.</p>}
                                        >
                                            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div class="sm:col-span-2">
                                                    <Field label="Full Name" value={individualFullName()} />
                                                </div>
                                                <Field label="Identity Number" value={text(record()?.individual?.code)} mono />
                                                <Field
                                                    label="Birth"
                                                    value={`${text(record()?.individual?.birth_place)}, ${formatDate(record()?.individual?.birth_date)}`}
                                                />
                                                <Field label="Special Needs" value={record()?.individual?.is_special_need ? 'Yes' : 'No'} />
                                                <Field label="Social Protection Card" value={record()?.individual?.is_social_protection_card_recipient ? 'Yes' : 'No'} />
                                                <Field label="Deceased" value={record()?.individual?.is_deceased ? 'Yes' : 'No'} />
                                            </dl>
                                        </Show>
                                    </Section>
                                </div>

                                <Section title={`Semester Activities (${activities().length})`}>
                                    <Show
                                        when={activities().length > 0}
                                        fallback={<p class="text-xs text-neutral-500">No semester activities recorded.</p>}
                                    >
                                        {/* Desktop table */}
                                        <div class="hidden md:block overflow-x-auto -m-4">
                                            <table class="w-full text-xs text-left">
                                                <thead class="bg-neutral-50 dark:bg-neutral-900/30 text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                                                    <tr>
                                                        <th class="px-4 py-2.5 font-semibold">Academic Year</th>
                                                        <th class="px-4 py-2.5 font-semibold">Status</th>
                                                        <th class="px-4 py-2.5 font-semibold text-right">Credits</th>
                                                        <th class="px-4 py-2.5 font-semibold text-right">GPA (IPS)</th>
                                                        <th class="px-4 py-2.5 font-semibold text-right">Total Credits</th>
                                                        <th class="px-4 py-2.5 font-semibold text-right">CGPA (IPK)</th>
                                                        <th class="px-4 py-2.5 font-semibold">Finance</th>
                                                        <th class="px-4 py-2.5 font-semibold text-center">Locked</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700 font-mono">
                                                    <For each={activities()}>
                                                        {(act) => (
                                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                                                <td class="px-4 py-2.5">{text(act.academic_year_name || act.academic_year?.name)}</td>
                                                                <td class="px-4 py-2.5">{text(act.status_name)}</td>
                                                                <td class="px-4 py-2.5 text-right">{formatNumber(act.total_credit)}</td>
                                                                <td class="px-4 py-2.5 text-right">{formatNumber(act.cumulative_index, 2)}</td>
                                                                <td class="px-4 py-2.5 text-right">{formatNumber(act.grand_total_credit)}</td>
                                                                <td class="px-4 py-2.5 text-right font-semibold">{formatNumber(act.grand_cumulative_index, 2)}</td>
                                                                <td class="px-4 py-2.5">{text(act.finance_name)}</td>
                                                                <td class="px-4 py-2.5 text-center">{act.is_lock ? 'Yes' : 'No'}</td>
                                                            </tr>
                                                        )}
                                                    </For>
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Mobile cards */}
                                        <div class="md:hidden divide-y divide-neutral-200 dark:divide-neutral-700 -m-4">
                                            <For each={activities()}>
                                                {(act) => (
                                                    <div class="p-3 space-y-1.5 text-xs">
                                                        <div class="flex items-center justify-between gap-2">
                                                            <span class="font-mono font-semibold">{text(act.academic_year_name || act.academic_year?.name)}</span>
                                                            <span class="text-neutral-500">{text(act.status_name)}</span>
                                                        </div>
                                                        <div class="grid grid-cols-2 gap-1 font-mono text-neutral-700 dark:text-neutral-300">
                                                            <span>IPS {formatNumber(act.cumulative_index, 2)}</span>
                                                            <span>SKS {formatNumber(act.total_credit)}</span>
                                                            <span>IPK {formatNumber(act.grand_cumulative_index, 2)}</span>
                                                            <span>Total SKS {formatNumber(act.grand_total_credit)}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </Section>

                                <Section title="System Metadata">
                                    <dl class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <Field label="Feeder Student ID" value={text(record()?.id_mahasiswa)} mono />
                                        <Field label="Feeder Registration ID" value={text(record()?.id_registrasi_mahasiswa)} mono />
                                        <Field label="Individual ID" value={text(record()?.individual_id)} mono />
                                        <Field label="Synced At" value={formatDateTime(record()?.sync_at)} />
                                        <Field label="Created At" value={formatDateTime(record()?.created_at)} />
                                        <Field label="Updated At" value={formatDateTime(record()?.updated_at)} />
                                    </dl>
                                </Section>
                            </div>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}
