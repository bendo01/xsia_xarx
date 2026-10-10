import { createSignal, onMount, onCleanup, For, Show, type JSX } from 'solid-js';
import { useParams, useNavigate, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';

type CreateMode = 'existing' | 'new';

interface OptionItem {
    id: string;
    name: string;
}

interface IndividualLookupItem {
    id: string;
    code: string;
    name: string;
    front_title?: string | null;
    last_title?: string | null;
    birth_place: string;
    birth_date: string;
    user_id?: string | null;
    user_email?: string | null;
    is_employee: boolean;
}

const emptyNewIndividual = {
    code: '',
    name: '',
    front_title: '',
    last_title: '',
    birth_place: '',
    birth_date: '',
    gender_id: '',
    religion_id: '',
    email: '',
    password: '',
    phone_number: '',
    street: '',
    citizens_association: '',
    neighborhood_association: '',
    province_id: '',
    regency_id: '',
    sub_district_id: '',
    village_id: '',
};

type NewIndividualForm = typeof emptyNewIndividual;

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

export default function RectoratEmployeeCreate() {
    const params = useParams();
    const navigate = useNavigate();
    const institutionId = () => params.id;
    const listPath = () => `/rectorat/institution/${institutionId()}/employee`;

    const [mode, setMode] = createSignal<CreateMode>('existing');
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Employee fields (shared by both modes)
    const [code, setCode] = createSignal('');
    const [decreeNumber, setDecreeNumber] = createSignal('');
    const [decreeDate, setDecreeDate] = createSignal('');
    const [isActive, setIsActive] = createSignal(true);

    // Existing individual lookup
    const [lookupQuery, setLookupQuery] = createSignal('');
    const [lookupResults, setLookupResults] = createSignal<IndividualLookupItem[]>([]);
    const [isSearching, setIsSearching] = createSignal(false);
    const [selected, setSelected] = createSignal<IndividualLookupItem | null>(null);
    // Login account for a selected individual that has none
    const [accountEmail, setAccountEmail] = createSignal('');
    const [accountPassword, setAccountPassword] = createSignal('');
    const needsAccount = () => !!selected() && !selected()!.user_id;
    let lookupTimeout: ReturnType<typeof setTimeout> | undefined;
    let lookupSeq = 0;
    onCleanup(() => clearTimeout(lookupTimeout));

    // New individual
    const [form, setForm] = createSignal<NewIndividualForm>({ ...emptyNewIndividual });
    const [genders, setGenders] = createSignal<OptionItem[]>([]);
    const [religions, setReligions] = createSignal<OptionItem[]>([]);
    const [provinces, setProvinces] = createSignal<OptionItem[]>([]);
    const [regencies, setRegencies] = createSignal<OptionItem[]>([]);
    const [subDistricts, setSubDistricts] = createSignal<OptionItem[]>([]);
    const [villages, setVillages] = createSignal<OptionItem[]>([]);

    const setField = <K extends keyof NewIndividualForm>(key: K, value: NewIndividualForm[K]) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    onMount(async () => {
        const [g, r, p] = await Promise.all([
            fetchOptions('person/reference/gender'),
            fetchOptions('person/reference/religion'),
            fetchOptions('provinces'),
        ]);
        setGenders(g);
        setReligions(r);
        setProvinces(p);
    });

    const onProvinceChange = async (id: string) => {
        setForm((prev) => ({ ...prev, province_id: id, regency_id: '', sub_district_id: '', village_id: '' }));
        setRegencies([]);
        setSubDistricts([]);
        setVillages([]);
        if (id) setRegencies(await fetchOptions('regencies', { province_id: id }));
    };

    const onRegencyChange = async (id: string) => {
        setForm((prev) => ({ ...prev, regency_id: id, sub_district_id: '', village_id: '' }));
        setSubDistricts([]);
        setVillages([]);
        if (id) setSubDistricts(await fetchOptions('sub-districts', { regency_id: id }));
    };

    const onSubDistrictChange = async (id: string) => {
        setForm((prev) => ({ ...prev, sub_district_id: id, village_id: '' }));
        setVillages([]);
        if (id) setVillages(await fetchOptions('villages', { sub_district_id: id }));
    };

    const runLookup = async (text: string) => {
        const seq = ++lookupSeq;
        if (text.trim().length < 3) {
            setLookupResults([]);
            setIsSearching(false);
            return;
        }
        setIsSearching(true);
        try {
            const data = await postJson<IndividualLookupItem[]>('institution/master/employees/individual-lookup', {
                search: text.trim(),
                institution_id: institutionId(),
            });
            // Ignore responses that arrive after a newer search was started
            if (seq === lookupSeq) setLookupResults(Array.isArray(data) ? data : []);
        } catch (err: any) {
            if (seq === lookupSeq) {
                setLookupResults([]);
                toast.danger(err.message || 'Gagal mencari data individu.');
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

    const individualLabel = (item: IndividualLookupItem) =>
        [item.front_title, item.name, item.last_title].filter(Boolean).join(' ');

    const handleSubmit = async (e: Event) => {
        e.preventDefault();

        const base = {
            institution_id: institutionId(),
            code: code().trim(),
            decree_number: decreeNumber().trim() || null,
            decree_date: decreeDate() || null,
            is_active: isActive(),
        };

        let payload: Record<string, unknown>;
        if (mode() === 'existing') {
            const ind = selected();
            if (!ind) {
                toast.danger('Pilih individu terlebih dahulu.');
                return;
            }
            if (ind.is_employee) {
                toast.danger('Individu ini sudah terdaftar sebagai pegawai di institusi ini.');
                return;
            }
            payload = { ...base, individual_id: ind.id };
            if (needsAccount()) {
                payload.new_account = { email: accountEmail().trim(), password: accountPassword() };
            }
        } else {
            const f = form();
            if (!f.gender_id || !f.religion_id) {
                toast.danger('Jenis kelamin dan agama wajib dipilih.');
                return;
            }
            payload = {
                ...base,
                new_individual: {
                    ...f,
                    front_title: f.front_title || null,
                    last_title: f.last_title || null,
                    citizens_association: Number(f.citizens_association) || 0,
                    neighborhood_association: Number(f.neighborhood_association) || 0,
                    province_id: f.province_id || null,
                    regency_id: f.regency_id || null,
                    sub_district_id: f.sub_district_id || null,
                    village_id: f.village_id || null,
                },
            };
        }

        setIsSubmitting(true);
        try {
            const created = await postJson<{ id: string }>('institution/master/employees/register', payload);
            toast.success('Pegawai berhasil ditambahkan.');
            navigate(`${listPath()}/${created.id}`);
        } catch (err: any) {
            toast.danger(err.message || 'Gagal menyimpan data pegawai.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const modeButtonClass = (m: CreateMode) =>
        `flex-1 text-left p-4 rounded-xl border-2 transition-all cursor-pointer ${mode() === m
            ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-900/20'
            : 'border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 hover:border-neutral-300 dark:hover:border-neutral-700'}`;

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
                            <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Tambah</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">Tambah Pegawai</h1>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                            Daftarkan pegawai dari individu yang sudah ada, atau buat individu dan akun baru.
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

                    {/* Mode Switch */}
                    <div class="flex flex-col sm:flex-row gap-3">
                        <button type="button" id="mode-existing" class={modeButtonClass('existing')} onClick={() => setMode('existing')}>
                            <p class="font-bold text-sm text-neutral-900 dark:text-white">Individu Sudah Terdaftar</p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Sudah memiliki data individu dan akun pengguna.</p>
                        </button>
                        <button type="button" id="mode-new" class={modeButtonClass('new')} onClick={() => setMode('new')}>
                            <p class="font-bold text-sm text-neutral-900 dark:text-white">Individu Baru</p>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Buat data individu, akun, alamat, telepon, dan email sekaligus.</p>
                        </button>
                    </div>

                    {/* Existing Individual */}
                    <Show when={mode() === 'existing'}>
                        <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                            <div class="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/30">
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Pilih Individu</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Cari berdasarkan nama, NIK, atau email akun (minimal 3 karakter).</p>
                            </div>
                            <div class="p-6 space-y-4">
                                <Show
                                    when={selected()}
                                    fallback={
                                        <>
                                            <input
                                                type="text"
                                                id="individual-lookup-input"
                                                class={inputClass}
                                                placeholder="Ketik nama, NIK, atau email..."
                                                value={lookupQuery()}
                                                onInput={handleLookupInput}
                                            />
                                            <Show when={isSearching()}>
                                                <p class="text-xs text-neutral-500">Mencari...</p>
                                            </Show>
                                            <Show when={!isSearching() && lookupQuery().trim().length >= 3 && lookupResults().length === 0}>
                                                <p class="text-xs text-neutral-500">
                                                    Tidak ditemukan. Gunakan opsi <button type="button" class="text-indigo-600 font-semibold underline cursor-pointer" onClick={() => setMode('new')}>Individu Baru</button>.
                                                </p>
                                            </Show>
                                            <div class="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-100 dark:border-neutral-800 rounded-lg overflow-hidden empty:hidden">
                                                <For each={lookupResults()}>
                                                    {(item) => (
                                                        <button
                                                            type="button"
                                                            disabled={item.is_employee}
                                                            class="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                                            onClick={() => setSelected(item)}
                                                        >
                                                            <div class="min-w-0">
                                                                <p class="text-sm font-semibold text-neutral-900 dark:text-white truncate">{individualLabel(item)}</p>
                                                                <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono truncate">
                                                                    {item.code} · {item.user_email || 'tanpa akun'}
                                                                </p>
                                                            </div>
                                                            <Show when={item.is_employee}>
                                                                <span class="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800/50">Sudah pegawai</span>
                                                            </Show>
                                                            <Show when={!item.is_employee && !item.user_id}>
                                                                <span class="shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700">Tanpa akun</span>
                                                            </Show>
                                                        </button>
                                                    )}
                                                </For>
                                            </div>
                                        </>
                                    }
                                >
                                    {(ind) => (
                                        <div class="flex items-center justify-between gap-4 p-4 rounded-lg border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/50 dark:bg-indigo-900/20">
                                            <div class="min-w-0">
                                                <p class="font-semibold text-neutral-900 dark:text-white truncate">{individualLabel(ind())}</p>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                                    NIK <span class="font-mono">{ind().code}</span> · {ind().birth_place}, {ind().birth_date}
                                                </p>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">Akun: {ind().user_email || '-'}</p>
                                            </div>
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

                        <Show when={needsAccount()}>
                            <Section title="Akun Login" description="Individu ini belum memiliki akun. Buat akun agar pegawai dapat login dan diberi peran.">
                                <Field label="Email" required>
                                    <input type="email" class={inputClass} required autocomplete="off" value={accountEmail()} onInput={(e) => setAccountEmail(e.currentTarget.value)} />
                                </Field>
                                <Field label="Kata Sandi" required>
                                    <input type="password" class={inputClass} required minLength={8} autocomplete="new-password" value={accountPassword()} onInput={(e) => setAccountPassword(e.currentTarget.value)} />
                                </Field>
                            </Section>
                        </Show>
                    </Show>

                    {/* New Individual */}
                    <Show when={mode() === 'new'}>
                        <Section title="Data Individu" description="Data pribadi sesuai KTP.">
                            <Field label="NIK" required>
                                <input class={inputClass} required inputmode="numeric" value={form().code} onInput={(e) => setField('code', e.currentTarget.value)} />
                            </Field>
                            <Field label="Nama Lengkap" required>
                                <input class={inputClass} required value={form().name} onInput={(e) => setField('name', e.currentTarget.value)} />
                            </Field>
                            <Field label="Gelar Depan">
                                <input class={inputClass} value={form().front_title} onInput={(e) => setField('front_title', e.currentTarget.value)} />
                            </Field>
                            <Field label="Gelar Belakang">
                                <input class={inputClass} value={form().last_title} onInput={(e) => setField('last_title', e.currentTarget.value)} />
                            </Field>
                            <Field label="Tempat Lahir" required>
                                <input class={inputClass} required value={form().birth_place} onInput={(e) => setField('birth_place', e.currentTarget.value)} />
                            </Field>
                            <Field label="Tanggal Lahir" required>
                                <input type="date" class={inputClass} required value={form().birth_date} onInput={(e) => setField('birth_date', e.currentTarget.value)} />
                            </Field>
                            <Field label="Jenis Kelamin" required>
                                <OptionSelect required value={form().gender_id} options={genders()} placeholder="Pilih jenis kelamin" onChange={(v) => setField('gender_id', v)} />
                            </Field>
                            <Field label="Agama" required>
                                <OptionSelect required value={form().religion_id} options={religions()} placeholder="Pilih agama" onChange={(v) => setField('religion_id', v)} />
                            </Field>
                        </Section>

                        <Section title="Akun & Kontak" description="Email digunakan untuk login dan disimpan sebagai email kontak.">
                            <Field label="Email" required>
                                <input type="email" class={inputClass} required autocomplete="off" value={form().email} onInput={(e) => setField('email', e.currentTarget.value)} />
                            </Field>
                            <Field label="Kata Sandi" required>
                                <input type="password" class={inputClass} required minLength={8} autocomplete="new-password" value={form().password} onInput={(e) => setField('password', e.currentTarget.value)} />
                            </Field>
                            <Field label="Nomor Telepon" required>
                                <input type="tel" class={inputClass} required minLength={8} maxLength={20} value={form().phone_number} onInput={(e) => setField('phone_number', e.currentTarget.value)} />
                            </Field>
                        </Section>

                        <Section title="Alamat">
                            <Field label="Jalan" required class="sm:col-span-2">
                                <input class={inputClass} required value={form().street} onInput={(e) => setField('street', e.currentTarget.value)} />
                            </Field>
                            <Field label="RT">
                                <input type="number" min="0" class={inputClass} value={form().citizens_association} onInput={(e) => setField('citizens_association', e.currentTarget.value)} />
                            </Field>
                            <Field label="RW">
                                <input type="number" min="0" class={inputClass} value={form().neighborhood_association} onInput={(e) => setField('neighborhood_association', e.currentTarget.value)} />
                            </Field>
                            <Field label="Provinsi">
                                <OptionSelect value={form().province_id} options={provinces()} placeholder="Pilih provinsi" onChange={onProvinceChange} />
                            </Field>
                            <Field label="Kabupaten / Kota">
                                <OptionSelect value={form().regency_id} options={regencies()} placeholder="Pilih kabupaten/kota" disabled={!form().province_id} onChange={onRegencyChange} />
                            </Field>
                            <Field label="Kecamatan">
                                <OptionSelect value={form().sub_district_id} options={subDistricts()} placeholder="Pilih kecamatan" disabled={!form().regency_id} onChange={onSubDistrictChange} />
                            </Field>
                            <Field label="Kelurahan / Desa">
                                <OptionSelect value={form().village_id} options={villages()} placeholder="Pilih kelurahan/desa" disabled={!form().sub_district_id} onChange={(v) => setField('village_id', v)} />
                            </Field>
                        </Section>
                    </Show>

                    {/* Employee Data */}
                    <Section title="Data Kepegawaian">
                        <Field label="Kode Pegawai" required>
                            <input id="employee-code" class={`${inputClass} font-mono`} required value={code()} onInput={(e) => setCode(e.currentTarget.value)} />
                        </Field>
                        <Field label="Status">
                            <label class="inline-flex items-center gap-2 h-[10.5] text-sm cursor-pointer">
                                <input type="checkbox" class="size-4 accent-indigo-600" checked={isActive()} onChange={(e) => setIsActive(e.currentTarget.checked)} />
                                Aktif
                            </label>
                        </Field>
                        <Field label="Nomor SK">
                            <input class={`${inputClass} font-mono`} value={decreeNumber()} onInput={(e) => setDecreeNumber(e.currentTarget.value)} />
                        </Field>
                        <Field label="Tanggal SK">
                            <input type="date" class={inputClass} value={decreeDate()} onInput={(e) => setDecreeDate(e.currentTarget.value)} />
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
                            id="employee-submit"
                            disabled={isSubmitting() || (mode() === 'existing' && !selected())}
                            class="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {isSubmitting() ? 'Menyimpan...' : 'Simpan Pegawai'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
