import { createForm } from '@tanstack/solid-form';
import { createSignal, onMount, Show, For, type JSX } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { toast } from '~/components/toast/Toaster';
import { getInstitutionLogo } from '~/lib/institutionLogo';
import { processLoginSuccess } from '~/lib/authStore';
import configuration from '~/config/configuration';
import ThemeToggle from '../../components/navigation/ThemeToggle';
import {
    admissionRegister,
    fetchPublicOptions,
    type OptionItem,
} from '~/controllers/academic/candidate/AcademicCandidateAdmissionController';
import { t, getLocale, toggleLocale } from '../../i18n';

const inputClass = "w-full bg-white dark:bg-[#111827]/70 border border-neutral-300 dark:border-emerald-500/20 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-white/30 px-4 py-3 rounded-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all text-sm shadow-inner";

function FieldShell(props: { label: string; error?: string; children: JSX.Element }) {
    return (
        <div class="space-y-1">
            <label class="block text-xs font-medium text-neutral-700 dark:text-white/80 px-1">{props.label}</label>
            {props.children}
            <Show when={props.error}>
                <p class="text-[11px] text-red-700 dark:text-red-300 px-1">{props.error}</p>
            </Show>
        </div>
    );
}

export default function CandidateAdmissionForm() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
    const [showPassword, setShowPassword] = createSignal(false);
    const [genders, setGenders] = createSignal<OptionItem[]>([]);
    const [religions, setReligions] = createSignal<OptionItem[]>([]);

    onMount(async () => {
        const [genderOptions, religionOptions] = await Promise.all([
            fetchPublicOptions('person/reference/gender'),
            fetchPublicOptions('person/reference/religion'),
        ]);
        setGenders(genderOptions);
        setReligions(religionOptions);
    });

    const digitsOnly = (value: string, length: number, label: string) => {
        if (!value) return `${label} wajib diisi`;
        if (!/^\d+$/.test(value)) return `${label} hanya boleh berisi angka`;
        if (value.length !== length) return `${label} harus ${length} digit`;
        return undefined;
    };
    const required = (label: string) => ({ value }: { value: string }) => (value?.trim() ? undefined : `${label} wajib diisi`);

    const form = createForm(() => ({
        defaultValues: {
            name: '',
            nik: '',
            birth_place: '',
            birth_date: '',
            gender_id: '',
            religion_id: '',
            student_national_number: '',
            school_name: '',
            phone_number: '',
            email: '',
            password: '',
            password_confirmation: '',
        },
        onSubmit: async ({ value }) => {
            setIsLoading(true);
            setErrorMessage(null);

            try {
                const result = await admissionRegister({
                    institution_code: configuration.institutionCode,
                    name: value.name.trim(),
                    nik: value.nik.trim(),
                    birth_place: value.birth_place.trim(),
                    birth_date: value.birth_date,
                    gender_id: value.gender_id,
                    religion_id: value.religion_id,
                    student_national_number: value.student_national_number.trim() || null,
                    school_name: value.school_name.trim() || null,
                    phone_number: value.phone_number.trim(),
                    email: value.email.trim(),
                    password: value.password,
                });

                if (!result.ok || !result.data) {
                    const msg = result.message || t('au.pendaftaranGagal');
                    setErrorMessage(msg);
                    toast.danger(msg);
                    return;
                }

                toast.success(t('au.pendaftaranBerhasilSelamatDatang'));
                await processLoginSuccess(result.data, true);
                navigate(`/candidate/academic/candidate/master/candidate/${result.data.candidate_id}`, { replace: true });
            } catch (err: any) {
                const msg = err?.message || t('au.networkError');
                setErrorMessage(msg);
                toast.danger(msg);
            } finally {
                setIsLoading(false);
            }
        },
    }));

    return (
        <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-neutral-50 dark:bg-[#0A0F1D] px-4 py-8">
            <div class="absolute top-4 right-4 z-20 flex items-center gap-2">
                <ThemeToggle />
                <button
                    onClick={toggleLocale}
                    type="button"
                    class="flex items-center gap-1.5 px-3 py-1.5 rounded-xs bg-neutral-900/5 dark:bg-white/10 hover:bg-neutral-900/10 dark:hover:bg-white/20 border border-neutral-200 dark:border-white/15 text-neutral-900 dark:text-white text-xs font-semibold backdrop-blur-md transition-all shadow-lg"
                    aria-label={t('nav.selectLanguage')}
                    title={t('nav.selectLanguage')}
                >
                    <span class="text-sm">{getLocale() === 'id' ? '🇮🇩' : '🇬🇧'}</span>
                    <span class="font-mono text-xs uppercase font-bold">{getLocale()}</span>
                </button>
            </div>
            {/* Ambient Background Gradient Spheres */}
            <div class="absolute inset-0 w-full h-full pointer-events-none z-0 opacity-50 dark:opacity-100">
                <div class="absolute top-[-15%] left-[-10%] w-[65%] h-[65%] bg-[#0d9488]/30 rounded-xs mix-blend-screen filter blur-[120px] opacity-70"></div>
                <div class="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-[#3b82f6]/25 rounded-xs mix-blend-screen filter blur-[120px] opacity-60"></div>
                <div class="absolute bottom-[-15%] right-[-10%] w-[65%] h-[65%] bg-[#10b981]/25 rounded-xs mix-blend-screen filter blur-[120px] opacity-60"></div>
            </div>

            {/* Glassmorphic Card */}
            <div class="relative z-10 w-full max-w-3xl p-8 sm:p-10 bg-white/95 dark:bg-slate-900/60 backdrop-blur-2xl border border-neutral-300 dark:border-emerald-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.15)] dark:shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xs flex flex-col items-center">
                <Show when={getInstitutionLogo()}>
                    {(logo) => (
                        <img src={logo()} alt={t('au.logo')} class="size-20 object-contain mb-4 drop-shadow-lg" />
                    )}
                </Show>

                <h1 class="text-[26px] sm:text-[30px] font-bold text-neutral-900 dark:text-white tracking-wide mb-1 font-sans text-center">
                    {t('au.formulirPendaftaranCalonMahasiswa')}
                </h1>
                <p class="text-neutral-600 dark:text-white/60 text-xs font-semibold tracking-wider uppercase mb-6 font-mono text-center">
                    {t('au.lengkapiDataDiriUntukMembuatAkun')}
                </p>

                <Show when={errorMessage()}>
                    <div class="w-full mb-5 p-3.5 bg-red-50 dark:bg-red-500/15 border border-red-500/30 rounded-xs flex items-center gap-3 text-red-700 dark:text-red-200 text-xs font-medium">
                        <svg class="shrink-0 size-4 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span class="flex-1 leading-snug">{errorMessage()}</span>
                        <button type="button" onClick={() => setErrorMessage(null)} class="text-red-600 dark:text-red-400 hover:text-neutral-900 dark:hover:text-white transition-colors">
                            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </Show>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    class="w-full space-y-6 mb-6"
                >
                    {/* Identity */}
                    <section class="space-y-4">
                        <h2 class="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300/90 border-b border-neutral-200 dark:border-white/10 pb-2">{t('au.dataDiri')}</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <form.Field name="name" validators={{ onChange: required('Nama lengkap') }}>
                                {(field) => (
                                    <div class="sm:col-span-2">
                                        <FieldShell label={t('au.namaLengkapSesuaiKTPIjazah')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                            <input type="text" placeholder={t('au.namaLengkap')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                        </FieldShell>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="nik" validators={{ onChange: ({ value }) => digitsOnly(value, 16, t('au.nik')) }}>
                                {(field) => (
                                    <FieldShell label={t('au.nik')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <input type="text" inputmode="numeric" maxlength={16} placeholder={t('au.n16DigitNomorIndukKependudukan')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field name="gender_id" validators={{ onChange: required('Jenis kelamin') }}>
                                {(field) => (
                                    <FieldShell label={t('au.jenisKelamin')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <select value={field().state.value} onBlur={field().handleBlur} onChange={(e) => field().handleChange(e.currentTarget.value)} class={inputClass}>
                                            <option value="">{t('au.pilihJenisKelamin')}</option>
                                            <For each={genders()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
                                        </select>
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field name="birth_place" validators={{ onChange: required('Tempat lahir') }}>
                                {(field) => (
                                    <FieldShell label={t('au.tempatLahir')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <input type="text" placeholder={t('au.kotaKabupaten')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field name="birth_date" validators={{ onChange: required('Tanggal lahir') }}>
                                {(field) => (
                                    <FieldShell label={t('au.tanggalLahir')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <input type="date" value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={`${inputClass} [scheme:dark]`} />
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field name="religion_id" validators={{ onChange: required('Agama') }}>
                                {(field) => (
                                    <FieldShell label={t('au.agama')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <select value={field().state.value} onBlur={field().handleBlur} onChange={(e) => field().handleChange(e.currentTarget.value)} class={inputClass}>
                                            <option value="">{t('au.pilihAgama')}</option>
                                            <For each={religions()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
                                        </select>
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field name="phone_number" validators={{ onChange: ({ value }) => (/^\+?\d{8,20}$/.test(value.trim()) ? undefined : t('au.nomorWhatsAppTidakValid')) }}>
                                {(field) => (
                                    <FieldShell label={t('au.nomorWhatsApp')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <input type="tel" placeholder={t('au.contoh62812')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                    </FieldShell>
                                )}
                            </form.Field>
                        </div>
                    </section>

                    {/* School */}
                    <section class="space-y-4">
                        <h2 class="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300/90 border-b border-neutral-200 dark:border-white/10 pb-2">{t('au.asalSekolah')}</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <form.Field name="student_national_number" validators={{ onChange: ({ value }) => (value && !/^\d{10}$/.test(value) ? t('au.nisnHarus10DigitAngka') : undefined) }}>
                                {(field) => (
                                    <FieldShell label={t('au.nisnOpsional')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <input type="text" inputmode="numeric" maxlength={10} placeholder={t('au.nomorIndukSiswaNasional')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field name="school_name">
                                {(field) => (
                                    <FieldShell label={t('au.namaSekolahAsalOpsional')}>
                                        <input type="text" placeholder={t('au.smaSMKMA')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                    </FieldShell>
                                )}
                            </form.Field>
                        </div>
                    </section>

                    {/* Account */}
                    <section class="space-y-4">
                        <h2 class="text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:text-emerald-300/90 border-b border-neutral-200 dark:border-white/10 pb-2">{t('au.akunPendaftaran')}</h2>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <form.Field name="email" validators={{ onChange: ({ value }) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ? undefined : t('au.emailTidakValid')) }}>
                                {(field) => (
                                    <div class="sm:col-span-2">
                                        <FieldShell label={t('au.email')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                            <input type="email" placeholder={t('au.alamatEmailAktif2')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                        </FieldShell>
                                    </div>
                                )}
                            </form.Field>

                            <form.Field name="password" validators={{ onChange: ({ value }) => (value.length >= 6 ? undefined : t('au.kataSandiMinimal6Karakter2')) }}>
                                {(field) => (
                                    <FieldShell label={t('au.kataSandi')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <div class="relative flex items-center">
                                            <input type={showPassword() ? 'text' : 'password'} placeholder={t('au.minimal6Karakter')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={`${inputClass} pr-11`} />
                                            <button type="button" onClick={() => setShowPassword(!showPassword())} class="absolute right-3.5 text-neutral-400 dark:text-white/40 hover:text-neutral-900 dark:hover:text-white/90 transition-colors p-1">
                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                    <circle cx="12" cy="12" r="3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </FieldShell>
                                )}
                            </form.Field>

                            <form.Field
                                name="password_confirmation"
                                validators={{
                                    onChangeListenTo: ['password'],
                                    onChange: ({ value, fieldApi }) => (value === fieldApi.form.getFieldValue('password') ? undefined : t('au.konfirmasiKataSandiTidakSama')),
                                }}
                            >
                                {(field) => (
                                    <FieldShell label={t('au.konfirmasiKataSandi')} error={field().state.meta.isTouched ? field().state.meta.errors[0] as string : undefined}>
                                        <input type={showPassword() ? 'text' : 'password'} placeholder={t('au.ulangiKataSandi')} value={field().state.value} onBlur={field().handleBlur} onInput={(e) => field().handleChange(e.currentTarget.value)} class={inputClass} />
                                    </FieldShell>
                                )}
                            </form.Field>
                        </div>
                    </section>

                    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting] as const}>
                        {(state) => (
                            <button
                                type="submit"
                                disabled={!state()[0] || isLoading()}
                                class="w-full mt-2 bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xs border border-emerald-400/20 transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)] active:scale-[0.99] text-xs tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Show when={isLoading()} fallback={<span>{t('au.daftarSekarang')}</span>}>
                                    <svg class="animate-spin size-4 text-neutral-900 dark:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>{t('au.memproses')}</span>
                                </Show>
                            </button>
                        )}
                    </form.Subscribe>
                </form>

                <div class="w-full pt-4 border-t border-neutral-200 dark:border-white/10 flex items-center justify-between text-xs text-neutral-500 dark:text-white/50">
                    <A href="/authentification/login_with_session" class="hover:text-emerald-800 dark:hover:text-emerald-300 transition-colors flex items-center gap-1">
                        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        {t('au.sudahPunyaAkunMasuk')}
                    </A>
                </div>
            </div>
        </div>
    );
}
