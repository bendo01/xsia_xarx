import { createSignal, onMount, Show, type JSX } from 'solid-js';
import { useParams, useNavigate, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';

interface EmployeeData {
    id: string;
    code: string;
    name: string;
    institution_id: string;
    individual_id: string;
    decree_number?: string | null;
    decree_date?: string | null;
    is_active: boolean;
    individual?: {
        code?: string | null;
        name?: string | null;
        front_title?: string | null;
        last_title?: string | null;
        birth_place?: string | null;
        birth_date?: string | null;
    } | null;
}

// Salvo StatusError bodies nest the message under `error.brief`
const errorMessage = (json: any, status: number) =>
    json?.brief || json?.message || json?.error?.brief || json?.error?.message || `HTTP error ${status}`;

async function requestJson<T>(method: string, path: string, body?: unknown): Promise<T> {
    const response = await fetch(`${getBaseApiUrl()}/${path}`, {
        method,
        headers: getAuthHeaders(),
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(json, response.status));
    return (json?.data ?? json) as T;
}

const inputClass = 'block w-full p-2.5 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-all shadow-sm placeholder:text-neutral-400 disabled:opacity-50';

function Field(props: { label: string; required?: boolean; class?: string; children: JSX.Element }) {
    return (
        <div class={props.class}>
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1.5">
                {props.label} <Show when={props.required}><span class="text-red-500">*</span></Show>
            </label>
            {props.children}
        </div>
    );
}

function Section(props: { title: string; description?: string; children: JSX.Element }) {
    return (
        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                <h3 class="font-bold text-sm text-neutral-900 dark:text-white">{props.title}</h3>
                <Show when={props.description}>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{props.description}</p>
                </Show>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-5 p-6">{props.children}</div>
        </div>
    );
}

export default function RectoratEmployeeEdit() {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Both dynamic segments are named `id`; params.id resolves to the employee
    const institutionId = () => location.pathname.split('/')[3] || '';
    const employeeId = () => params.id ?? '';
    const listPath = () => `/rectorat/institution/${institutionId()}/employee`;
    const detailPath = () => `${listPath()}/${employeeId()}`;

    const [employee, setEmployee] = createSignal<EmployeeData | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [decreeNumber, setDecreeNumber] = createSignal('');
    const [decreeDate, setDecreeDate] = createSignal('');
    const [isActive, setIsActive] = createSignal(true);

    onMount(async () => {
        const id = employeeId();
        if (!id || id === '[id]') {
            setIsLoading(false);
            return;
        }
        try {
            const data = await requestJson<EmployeeData>('GET', `institution/master/employees/${encodeURIComponent(id)}`);
            setEmployee(data);
            setCode(data.code ?? '');
            setName(data.name ?? '');
            setDecreeNumber(data.decree_number ?? '');
            setDecreeDate(data.decree_date ?? '');
            setIsActive(!!data.is_active);
        } catch (err: any) {
            setEmployee(null);
            toast.danger(err.message || 'Gagal memuat data pegawai.');
        } finally {
            setIsLoading(false);
        }
    });

    const individualLabel = () => {
        const ind = employee()?.individual;
        return [ind?.front_title, ind?.name || employee()?.name, ind?.last_title].filter(Boolean).join(' ') || '-';
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await requestJson('PUT', `institution/master/employees/${encodeURIComponent(employeeId())}`, {
                code: code().trim(),
                name: name().trim(),
                decree_number: decreeNumber().trim() || null,
                decree_date: decreeDate() || null,
                is_active: isActive(),
            });
            toast.success('Data pegawai berhasil diperbarui.');
            navigate(detailPath());
        } catch (err: any) {
            toast.danger(err.message || 'Gagal menyimpan data pegawai.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                {/* Page Header */}
                <div class="flex flex-col md:flex-row md:items-end md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6 gap-4">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-indigo-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-indigo-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={listPath()} class="hover:text-indigo-600 transition-colors">Pegawai</A>
                            <span>/</span>
                            <A href={detailPath()} class="hover:text-indigo-600 transition-colors">Detail</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Ubah</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Ubah Pegawai</h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Perbarui data kepegawaian. Data individu dikelola terpisah.
                        </p>
                    </div>
                    <A
                        href={detailPath()}
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm w-fit"
                    >
                        Batal
                    </A>
                </div>

                <Show when={isLoading()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <div class="relative size-16">
                            <div class="absolute inset-0 rounded-full border-4 border-indigo-200 dark:border-indigo-900/40"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Memuat data pegawai...</p>
                    </div>
                </Show>

                <Show when={!isLoading() && !employee()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <h2 class="text-xl font-bold text-neutral-700 dark:text-neutral-300">Data Tidak Ditemukan</h2>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">Data pegawai tidak dapat ditemukan atau mungkin telah dihapus.</p>
                        <A
                            href={listPath()}
                            class="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            Kembali ke Daftar Pegawai
                        </A>
                    </div>
                </Show>

                <Show when={!isLoading() && employee()}>
                    <form onSubmit={handleSubmit} class="space-y-6">

                        {/* Individual (read-only) */}
                        <div class="flex items-center gap-4 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-900/20">
                            <div class="min-w-0">
                                <p class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Individu</p>
                                <p class="font-semibold text-neutral-900 dark:text-white truncate">{individualLabel()}</p>
                                <Show when={employee()?.individual}>
                                    {(ind) => (
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                            NIK <span class="font-mono">{ind().code || '-'}</span> · {ind().birth_place || '-'}, {ind().birth_date || '-'}
                                        </p>
                                    )}
                                </Show>
                            </div>
                        </div>

                        <Section title="Data Kepegawaian">
                            <Field label="Kode Pegawai" required>
                                <input id="employee-code" class={`${inputClass} font-mono`} required value={code()} onInput={(e) => setCode(e.currentTarget.value)} />
                            </Field>
                            <Field label="Nama Pegawai" required>
                                <input id="employee-name" class={inputClass} required value={name()} onInput={(e) => setName(e.currentTarget.value)} />
                            </Field>
                            <Field label="Nomor SK">
                                <input class={`${inputClass} font-mono`} value={decreeNumber()} onInput={(e) => setDecreeNumber(e.currentTarget.value)} />
                            </Field>
                            <Field label="Tanggal SK">
                                <input type="date" class={inputClass} value={decreeDate()} onInput={(e) => setDecreeDate(e.currentTarget.value)} />
                            </Field>
                            <Field label="Status">
                                <label class="inline-flex items-center gap-2 h-[10.5] text-sm cursor-pointer">
                                    <input type="checkbox" class="size-4 accent-indigo-600" checked={isActive()} onChange={(e) => setIsActive(e.currentTarget.checked)} />
                                    Aktif
                                </label>
                            </Field>
                        </Section>

                        <div class="flex items-center justify-end gap-3">
                            <A
                                href={detailPath()}
                                class="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                            >
                                Batal
                            </A>
                            <button
                                type="submit"
                                id="employee-submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                            >
                                {isSubmitting() ? 'Menyimpan...' : 'Simpan Perubahan'}
                            </button>
                        </div>
                    </form>
                </Show>
            </div>
        </div>
    );
}
