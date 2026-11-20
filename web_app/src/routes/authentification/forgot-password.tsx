import { Title } from '@solidjs/meta';
import { useNavigate } from '@solidjs/router';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import AuthShell from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, SubmitButton } from '../../components/auth/fields';
import { t } from '../../i18n';
import { forgotPassword } from '../../lib/auth';
import { safeHttpsUrl, validateForgotPassword } from '../../lib/validation';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = createSignal('');
  const [phone, setPhone] = createSignal('');
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<{ message: string; waLink: string | null } | null>(null);

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const problem = validateForgotPassword({ email: email(), phone_number: phone() });
    if (problem) return setError(t(problem));

    setPending(true);
    setError(null);
    try {
      const res = await forgotPassword(email(), phone());
      const message = res.message || t('au.tautanResetKataSandiTelahDikirim');
      toast.success(message);
      setSuccess({ message, waLink: safeHttpsUrl(res.wa_link) });
      setTimeout(() => navigate('/authentification/password-reset'), 4000);
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
      title={t('au.lupaKataSandi')}
      subtitle={t('au.isiDetailAndaUntukMemulihkanAkun')}
      footer={
        <a href="/authentification/login_with_session" class="transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">
          {t('au.kembaliKeLogin')}
        </a>
      }
    >
      <Title>{`${t('au.lupaKataSandi')} - ${env.VITE_APP_NAME}`}</Title>

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
        <AuthField label={t('auth.login.emailLabel')} icon="mail" name="email" type="email" autocomplete="email" value={email()} onInput={setEmail} />
        <AuthField label={t('au.nomorWhatsApp')} icon="phone" name="phone_number" type="tel" autocomplete="tel" placeholder={t('au.contoh62812')} value={phone()} onInput={setPhone} />
        <SubmitButton pending={pending()} pendingLabel={t('au.memproses')}>
          <span>{t('au.kirimPermintaanReset')}</span>
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
