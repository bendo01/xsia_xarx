import { createSignal, onMount, For, Show, type JSX } from 'solid-js';
import { useParams, useNavigate, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';

interface OptionItem {
    id: string;
    name: string;
}

interface StaffData {
    id: string;
    code?: string | null;
    name?: string | null;
    decree_number?: string | null;
    decree_date?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    employee_id: string;
    unit_id: string;
    position_type_id?: string | null;
}

interface EmployeeInfo {
    code?: string | null;
    name?: string | null;
    individual?: {
        name?: string | null;
        front_title?: string | null;
        last_title?: string | null;
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

const fetchOptions = (path: string, body: Record<string, string> = {}) =>
    requestJson<OptionItem[]>('POST', `${path}/options`, body).catch((err) => {
        console.error(`Failed to load options for ${path}:`, err);
        return [] as OptionItem[];
    });

const inputClass = 'block w-full p-2.5 text-sm text-neutral-900 border border-neutral-200 rounded-lg bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 dark:bg-neutral-900 dark:border-neutral-800 dark:text-white transition-all shadow-sm placeholder:text-neutral-400 disabled:opacity-50';

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

function OptionSelect(props: { value: string; options: OptionItem[]; placeholder: string; onChange: (v: string) => void; disabled?: boolean; required?: boolean }) {
    return (
        <select
            class={inputClass}
            value={props.value}
            disabled={props.disabled}
            required={props.required}
            onChange={(e) => props.onChange(e.currentTarget.value)}
        >
            <option value="">{props.placeholder}</option>
            <For each={props.options}>{(o) => <option value={o.id} selected={o.id === props.value}>{o.name}</option>}</For>
        </select>
    );
}

export default function RectoratStaffEdit() {
    const params = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    // Both dynamic segments are named `id`; params.id resolves to the staff record
    const institutionId = () => location.pathname.split('/')[3] || '';
    const staffId = () => params.id ?? '';
    const listPath = () => `/rectorat/institution/${institutionId()}/staff`;
    const detailPath = () => `${listPath()}/${staffId()}`;

    const [staff, setStaff] = createSignal<StaffData | null>(null);
    const [employee, setEmployee] = createSignal<EmployeeInfo | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [unitId, setUnitId] = createSignal('');
    const [positionTypeId, setPositionTypeId] = createSignal('');
    const [decreeNumber, setDecreeNumber] = createSignal('');
    const [decreeDate, setDecreeDate] = createSignal('');
    const [startDate, setStartDate] = createSignal('');
    const [endDate, setEndDate] = createSignal('');

    const [units, setUnits] = createSignal<OptionItem[]>([]);
    const [positionTypes, setPositionTypes] = createSignal<OptionItem[]>([]);

    onMount(async () => {
        const id = staffId();
        if (!id || id === '[id]') {
            setIsLoading(false);
            return;
        }
        try {
            const [data, u, p] = await Promise.all([
                requestJson<StaffData>('GET', `institution/master/staffes/${encodeURIComponent(id)}`),
                fetchOptions('institution/master/units', { institution_id: institutionId() }),
                fetchOptions('institution/reference/position-type'),
            ]);
            setUnits(u);
            setPositionTypes(p);
            setStaff(data);
            setCode(data.code ?? '');
            setName(data.name ?? '');
            setUnitId(data.unit_id ?? '');
            setPositionTypeId(data.position_type_id ?? '');
            setDecreeNumber(data.decree_number ?? '');
            setDecreeDate(data.decree_date ?? '');
            setStartDate(data.start_date ?? '');
            setEndDate(data.end_date ?? '');

            // Non-fatal: the form still works without the employee's display name
            requestJson<EmployeeInfo>('GET', `institution/master/employees/${encodeURIComponent(data.employee_id)}`)
                .then(setEmployee)
                .catch(() => setEmployee(null));
        } catch (err: any) {
            setStaff(null);
            toast.danger(err.message || 'Gagal memuat data staf.');
        } finally {
            setIsLoading(false);
        }
    });

    const employeeLabel = () => {
        const emp = employee();
        const ind = emp?.individual;
        return [ind?.front_title, ind?.name || emp?.name, ind?.last_title].filter(Boolean).join(' ') || '-';
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();

        if (!unitId()) {
            toast.danger('Unit wajib dipilih.');
            return;
        }
        if (startDate() && endDate() && endDate() < startDate()) {
            toast.danger('Tanggal selesai tidak boleh sebelum tanggal mulai.');
            return;
        }

        setIsSubmitting(true);
        try {
            await requestJson('PUT', `institution/master/staffes/${encodeURIComponent(staffId())}`, {
                unit_id: unitId(),
                position_type_id: positionTypeId() || null,
                code: code().trim() || null,
                name: name().trim() || null,
                decree_number: decreeNumber().trim() || null,
                decree_date: decreeDate() || null,
                start_date: startDate() || null,
                end_date: endDate() || null,
            });
            toast.success('Data staf berhasil diperbarui.');
            navigate(detailPath());
        } catch (err: any) {
            toast.danger(err.message || 'Gagal menyimpan data staf.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 max-w-5xl">

                {/* Page Header */}
                <div class="flex flex-col md:flex-row md:items-end md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-6 gap-4">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <A href="/rectorat" class="hover:text-teal-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-teal-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={listPath()} class="hover:text-teal-600 transition-colors">Staf</A>
                            <span>/</span>
                            <A href={detailPath()} class="hover:text-teal-600 transition-colors">Detail</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Ubah</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Ubah Staf</h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Perbarui penempatan, jabatan, dan masa jabatan. Peran akun pegawai disesuaikan otomatis.
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
                            <div class="absolute inset-0 rounded-full border-4 border-teal-200 dark:border-teal-900/40"></div>
                            <div class="absolute inset-0 rounded-full border-4 border-teal-600 border-t-transparent animate-spin"></div>
                        </div>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 font-medium">Memuat data staf...</p>
                    </div>
                </Show>

                <Show when={!isLoading() && !staff()}>
                    <div class="flex flex-col items-center justify-center py-24 gap-4">
                        <h2 class="text-xl font-bold text-neutral-700 dark:text-neutral-300">Data Tidak Ditemukan</h2>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 text-center max-w-sm">Data staf tidak dapat ditemukan atau mungkin telah dihapus.</p>
                        <A
                            href={listPath()}
                            class="mt-2 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-teal-600 text-white hover:bg-teal-700 transition-colors shadow-sm"
                        >
                            Kembali ke Daftar Staf
                        </A>
                    </div>
                </Show>

                <Show when={!isLoading() && staff()}>
                    <form onSubmit={handleSubmit} class="space-y-6">

                        {/* Employee (read-only) */}
                        <div class="p-4 rounded-xl border border-teal-200 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-900/20">
                            <p class="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Pegawai</p>
                            <p class="font-semibold text-neutral-900 dark:text-white truncate">{employeeLabel()}</p>
                            <Show when={employee()?.code}>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 font-mono">{employee()?.code}</p>
                            </Show>
                        </div>

                        <Section title="Penempatan & Jabatan">
                            <Field label="Unit" required>
                                <OptionSelect required value={unitId()} options={units()} placeholder="Pilih unit" onChange={setUnitId} />
                            </Field>
                            <Field label="Jenis Jabatan">
                                <OptionSelect value={positionTypeId()} options={positionTypes()} placeholder="Pilih jenis jabatan" onChange={setPositionTypeId} />
                            </Field>
                            <Field label="Kode Staf">
                                <input id="staff-code" class={`${inputClass} font-mono`} value={code()} onInput={(e) => setCode(e.currentTarget.value)} />
                            </Field>
                            <Field label="Nama Jabatan">
                                <input id="staff-name" class={inputClass} value={name()} onInput={(e) => setName(e.currentTarget.value)} />
                            </Field>
                        </Section>

                        <Section title="Surat Keputusan & Masa Jabatan" description="Isi tanggal selesai untuk mengakhiri jabatan.">
                            <Field label="Nomor SK">
                                <input class={`${inputClass} font-mono`} value={decreeNumber()} onInput={(e) => setDecreeNumber(e.currentTarget.value)} />
                            </Field>
                            <Field label="Tanggal SK">
                                <input type="date" class={inputClass} value={decreeDate()} onInput={(e) => setDecreeDate(e.currentTarget.value)} />
                            </Field>
                            <Field label="Tanggal Mulai">
                                <input type="date" class={inputClass} value={startDate()} onInput={(e) => setStartDate(e.currentTarget.value)} />
                            </Field>
                            <Field label="Tanggal Selesai">
                                <input type="date" class={inputClass} min={startDate() || undefined} value={endDate()} onInput={(e) => setEndDate(e.currentTarget.value)} />
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
                                id="staff-submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
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
