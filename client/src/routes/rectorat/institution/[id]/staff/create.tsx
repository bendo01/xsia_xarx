import { createSignal, onMount, onCleanup, For, Show, type JSX } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';

interface OptionItem {
    id: string;
    name: string;
}

// Salvo StatusError bodies nest the message under `error.brief`
const errorMessage = (json: any, status: number) =>
    json?.brief || json?.message || json?.error?.brief || json?.error?.message || `HTTP error ${status}`;

async function postJson<T>(path: string, body: unknown): Promise<T> {
    const response = await fetch(`${getBaseApiUrl()}/${path}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(body),
    });
    const json = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(errorMessage(json, response.status));
    return json as T;
}

const fetchOptions = (path: string, body: Record<string, string> = {}) =>
    postJson<OptionItem[]>(`${path}/options`, body).catch((err) => {
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

export default function RectoratStaffCreate() {
    const params = useParams();
    const navigate = useNavigate();
    const institutionId = () => params.id ?? '';
    const listPath = () => `/rectorat/institution/${institutionId()}/staff`;

    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Staff fields
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

    // Employee lookup
    const [lookupQuery, setLookupQuery] = createSignal('');
    const [lookupResults, setLookupResults] = createSignal<OptionItem[]>([]);
    const [isSearching, setIsSearching] = createSignal(false);
    const [selected, setSelected] = createSignal<OptionItem | null>(null);
    let lookupTimeout: ReturnType<typeof setTimeout> | undefined;
    let lookupSeq = 0;
    onCleanup(() => clearTimeout(lookupTimeout));

    onMount(async () => {
        const [u, p] = await Promise.all([
            fetchOptions('institution/master/units', { institution_id: institutionId() }),
            fetchOptions('institution/reference/position-type'),
        ]);
        setUnits(u);
        setPositionTypes(p);
    });

    const runLookup = async (text: string) => {
        const seq = ++lookupSeq;
        if (text.trim().length < 3) {
            setLookupResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const data = await postJson<OptionItem[]>('institution/master/employees/options', {
                search: text.trim(),
                institution_id: institutionId(),
            });
            // Ignore responses that arrive after a newer search was started
            if (seq === lookupSeq) setLookupResults(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (seq === lookupSeq) {
                setLookupResults([]);
                toast.danger(err.message || 'Gagal mencari data pegawai.');
            }
        } finally {
            if (seq === lookupSeq) setIsSearching(false);
        }
    };

    const handleLookupInput = (e: Event) => {
        const text = (e.target as HTMLInputElement).value;
        setLookupQuery(text);
        clearTimeout(lookupTimeout);
        lookupTimeout = setTimeout(() => runLookup(text), 300);
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();

        const emp = selected();
        if (!emp) {
            toast.danger('Pilih pegawai terlebih dahulu.');
            return;
        }
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
            const created = await postJson<{ id: string }>('institution/master/staffes', {
                employee_id: emp.id,
                unit_id: unitId(),
                position_type_id: positionTypeId() || null,
                code: code().trim() || null,
                name: name().trim() || null,
                decree_number: decreeNumber().trim() || null,
                decree_date: decreeDate() || null,
                start_date: startDate() || null,
                end_date: endDate() || null,
            });
            toast.success('Staf berhasil ditambahkan.');
            navigate(`${listPath()}/${created.id}`);
        } catch (err: any) {
            toast.danger(err.message || 'Gagal menyimpan data staf.');
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
                            <A href="/rectorat" class="hover:text-teal-600 transition-colors">Rektorat</A>
                            <span>/</span>
                            <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-teal-600 transition-colors">Institusi</A>
                            <span>/</span>
                            <A href={listPath()} class="hover:text-teal-600 transition-colors">Staf</A>
                            <span>/</span>
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Tambah</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Tambah Staf</h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Tetapkan pegawai pada sebuah unit dan jabatan. Jenis jabatan menentukan peran akun pegawai.
                        </p>
                    </div>
                    <A
                        href={listPath()}
                        class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all shadow-sm w-fit"
                    >
                        Batal
                    </A>
                </div>

                <form onSubmit={handleSubmit} class="space-y-6">

                    {/* Employee */}
                    <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                        <div class="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                            <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Pilih Pegawai</h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Cari pegawai institusi ini berdasarkan nama (minimal 3 karakter).</p>
                        </div>
                        <div class="p-6 space-y-4">
                            <Show
                                when={selected()}
                                fallback={
                                    <>
                                        <input
                                            type="text"
                                            id="employee-lookup-input"
                                            class={inputClass}
                                            placeholder="Ketik nama pegawai..."
                                            value={lookupQuery()}
                                            onInput={handleLookupInput}
                                        />
                                        <Show when={isSearching()}>
                                            <p class="text-xs text-neutral-500">Mencari...</p>
                                        </Show>
                                        <Show when={!isSearching() && lookupQuery().trim().length >= 3 && lookupResults().length === 0}>
                                            <p class="text-xs text-neutral-500">
                                                Pegawai tidak ditemukan. <A href={`/rectorat/institution/${institutionId()}/employee/create`} class="text-teal-600 font-semibold underline">Tambah pegawai</A> terlebih dahulu.
                                            </p>
                                        </Show>
                                        <div class="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden empty:hidden">
                                            <For each={lookupResults()}>
                                                {(item) => (
                                                    <button
                                                        type="button"
                                                        class="w-full px-4 py-3 text-left text-sm font-semibold text-neutral-900 dark:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors cursor-pointer"
                                                        onClick={() => setSelected(item)}
                                                    >
                                                        {item.name}
                                                    </button>
                                                )}
                                            </For>
                                        </div>
                                    </>
                                }
                            >
                                {(emp) => (
                                    <div class="flex items-center justify-between gap-4 p-4 rounded-lg border border-teal-200 dark:border-teal-800/60 bg-teal-50/50 dark:bg-teal-900/20">
                                        <p class="font-semibold text-neutral-900 dark:text-white truncate">{emp().name}</p>
                                        <button
                                            type="button"
                                            class="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-neutral-300 dark:border-neutral-700 hover:bg-white dark:hover:bg-neutral-800 cursor-pointer"
                                            onClick={() => setSelected(null)}
                                        >
                                            Ganti
                                        </button>
                                    </div>
                                )}
                            </Show>
                        </div>
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

                    <Section title="Surat Keputusan & Masa Jabatan" description="Kosongkan tanggal selesai jika jabatan masih berlaku.">
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
                            href={listPath()}
                            class="px-4 py-2 text-sm font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all"
                        >
                            Batal
                        </A>
                        <button
                            type="submit"
                            id="staff-submit"
                            disabled={isSubmitting() || !selected()}
                            class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {isSubmitting() ? 'Menyimpan...' : 'Simpan Staf'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
