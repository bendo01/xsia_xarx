import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';
import { Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import AuthShell from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, AuthSelect, SubmitButton } from '../../components/auth/fields';
import { t } from '../../i18n';
import { getAdmissionOptions, registerCandidateAccount } from '../../lib/auth';
import { validateAdmission, type AdmissionForm } from '../../lib/validation';

const empty: AdmissionForm = {
  name: '', nik: '', birth_place: '', birth_date: '', gender_id: '', religion_id: '',
  student_national_number: '', school_name: '', phone_number: '', email: '', password: '', password_confirmation: '',
};

const Section = (props: { title: string; children: any }) => (
  <section class="space-y-4">
    <h2 class="border-b border-neutral-200 pb-2 text-xs font-bold uppercase tracking-[0.15em] text-emerald-700 dark:border-white/10 dark:text-emerald-300/90">{props.title}</h2>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">{props.children}</div>
  </section>
);

/** Public: a prospective student registers an account and is signed in at once. */
export default function CandidateAdmissionForm() {
  const navigate = useNavigate();
  const options = createMemo(() => getAdmissionOptions());
  const [form, setForm] = createSignal<AdmissionForm>({ ...empty });
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const set = (key: keyof AdmissionForm) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const problem = validateAdmission(form());
    if (problem) return setError(t(problem));

    setPending(true);
    setError(null);
    try {
      const { redirectTo } = await registerCandidateAccount(form());
      toast.success(t('au.pendaftaranBerhasilSelamatDatang'));
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg = (err as Error).message || t('au.pendaftaranGagal');
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      wide
      title={t('au.formulirPendaftaranCalonMahasiswa')}
      subtitle={t('au.lengkapiDataDiriUntukMembuatAkun')}
      footer={
        <a href="/authentification/login_with_session" class="transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">
          {t('au.sudahPunyaAkunMasuk')}
        </a>
      }
    >
      <Title>{`${t('au.formulirPendaftaranCalonMahasiswa')} - ${env.VITE_APP_NAME}`}</Title>

      <Show when={error()}>
        <AuthAlert kind="error">{error()}</AuthAlert>
      </Show>

      <form onSubmit={submit} class="mb-6 w-full space-y-6">
        <Section title={t('au.dataDiri')}>
          <div class="sm:col-span-2">
            <AuthField label={t('au.namaLengkapSesuaiKTPIjazah')} name="name" autocomplete="name" placeholder={t('au.namaLengkap')} value={form().name} onInput={set('name')} />
          </div>
          <AuthField label={t('au.nik')} name="nik" inputmode="numeric" maxlength={16} placeholder={t('au.n16DigitNomorIndukKependudukan')} value={form().nik} onInput={set('nik')} />
          <AuthSelect label={t('au.jenisKelamin')} name="gender_id" placeholder={t('au.pilihJenisKelamin')} options={options().genders} value={form().gender_id} onChange={set('gender_id')} />
          <AuthField label={t('au.tempatLahir')} name="birth_place" placeholder={t('au.kotaKabupaten')} value={form().birth_place} onInput={set('birth_place')} />
          <AuthField label={t('au.tanggalLahir')} name="birth_date" type="date" value={form().birth_date} onInput={set('birth_date')} />
          <AuthSelect label={t('au.agama')} name="religion_id" placeholder={t('au.pilihAgama')} options={options().religions} value={form().religion_id} onChange={set('religion_id')} />
          <AuthField label={t('au.nomorWhatsApp')} icon="phone" name="phone_number" type="tel" autocomplete="tel" placeholder={t('au.contoh62812')} value={form().phone_number} onInput={set('phone_number')} />
        </Section>

        <Section title={t('au.asalSekolah')}>
          <AuthField label={t('au.nisnOpsional')} name="student_national_number" inputmode="numeric" maxlength={10} required={false} placeholder={t('au.nomorIndukSiswaNasional')} value={form().student_national_number} onInput={set('student_national_number')} />
          <AuthField label={t('au.namaSekolahAsalOpsional')} name="school_name" required={false} placeholder={t('au.smaSMKMA')} value={form().school_name} onInput={set('school_name')} />
        </Section>

        <Section title={t('au.akunPendaftaran')}>
          <div class="sm:col-span-2">
            <AuthField label={t('au.email')} icon="mail" name="email" type="email" autocomplete="email" placeholder={t('au.alamatEmailAktif2')} value={form().email} onInput={set('email')} />
          </div>
          <AuthField label={t('au.kataSandi')} icon="lock" name="password" type="password" autocomplete="new-password" minlength={6} placeholder={t('au.minimal6Karakter')} value={form().password} onInput={set('password')} />
          <AuthField label={t('au.konfirmasiKataSandi')} icon="lock" name="password_confirmation" type="password" autocomplete="new-password" placeholder={t('au.ulangiKataSandi')} value={form().password_confirmation} onInput={set('password_confirmation')} />
        </Section>

        <SubmitButton pending={pending()} pendingLabel={t('au.memproses')}>
          <span>{t('au.daftarSekarang')}</span>
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
