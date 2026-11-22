import { Title } from '@solidjs/meta';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import AuthShell from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, SubmitButton } from '../../components/auth/fields';
import { t } from '../../i18n';
import { requestAccount } from '../../lib/auth';
import { safeHttpsUrl, validateAccountAcquisition } from '../../lib/validation';

/** Public: an existing student claims a login with NIK + student code. */
export default function AccountAcquisitionRequest() {
  const [nik, setNik] = createSignal('');
  const [code, setCode] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [password, setPassword] = createSignal('');
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<{ message: string; waLink: string | null } | null>(null);

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const form = { nik: nik(), student_code: code(), email: email(), phone_number: phone(), password: password() };
    const problem = validateAccountAcquisition(form);
    if (problem) return setError(t(problem));

    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await requestAccount(form);
      const message = res.message || t('au.akunBerhasilDibuat');
      toast.success(message);
      setSuccess({ message, waLink: safeHttpsUrl(res.wa_link) });
    } catch (err) {
      const msg = (err as Error).message || t('au.networkError');
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title={t('au.dapatkanAkun')}
      footer={
        <a href="/authentification/login_with_session" class="transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">
          {t('au.kembaliKeLogin')}
        </a>
      }
    >
      <Title>{`${t('au.dapatkanAkun')} - ${env.VITE_APP_NAME}`}</Title>

      <Show when={error()}>
        <AuthAlert kind="error">{error()}</AuthAlert>
      </Show>
      <Show when={success()}>
        {(ok) => (
          <AuthAlert kind="success">
            <span class="flex-1">{ok().message}</span>
            <Show when={ok().waLink}>
              {(link) => (
                <a href={link()} target="_blank" rel="noopener noreferrer" class="font-bold underline">
                  {t('au.bukaTautanWhatsApp')}
                </a>
              )}
            </Show>
          </AuthAlert>
        )}
      </Show>

      <form onSubmit={submit} class="mb-6 w-full space-y-4">
        <AuthField label={t('au.nik')} name="nik" inputmode="numeric" placeholder={t('au.nomorIndukKependudukan')} value={nik()} onInput={setNik} />
        <AuthField label={t('au.studentCode')} name="student_code" placeholder={t('au.nimNISN')} value={code()} onInput={setCode} />
        <AuthField label={t('au.email')} icon="mail" name="email" type="email" autocomplete="email" placeholder={t('au.alamatEmailAktif')} value={email()} onInput={setEmail} />
        <AuthField label={t('au.nomorWhatsApp')} icon="phone" name="phone_number" type="tel" autocomplete="tel" placeholder={t('au.contoh62812')} value={phone()} onInput={setPhone} />
        <AuthField label={t('au.kataSandi')} icon="lock" name="password" type="password" autocomplete="new-password" minlength={6} placeholder={t('au.kataSandiMinimal6Karakter')} value={password()} onInput={setPassword} />
        <SubmitButton pending={pending()} pendingLabel={t('au.memproses')}>
          <span>{t('au.dapatkanAkun')}</span>
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
