import { Title } from '@solidjs/meta';
import { useNavigate, useSearchParams } from '@solidjs/router';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import AuthShell from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, SubmitButton } from '../../components/auth/fields';
import { t } from '../../i18n';
import { resetPassword } from '../../lib/auth';
import { validateResetPassword } from '../../lib/validation';

export default function PasswordReset() {
  const navigate = useNavigate();
  const [search] = useSearchParams();
  const initialToken = () => String(Array.isArray(search.token) ? search.token[0] : (search.token ?? ''));

  const [token, setToken] = createSignal<string | null>(null);
  const [password, setPassword] = createSignal('');
  const [confirm, setConfirm] = createSignal('');
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);

  // The token field follows ?token= until the user types their own.
  const tokenValue = () => token() ?? initialToken();

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const problem = validateResetPassword({
      token: tokenValue().trim(),
      new_password: password(),
      confirm_password: confirm(),
    });
    if (problem) return setError(t(problem));

    setPending(true);
    setError(null);
    try {
      const res = await resetPassword(tokenValue().trim(), password());
      const message = res.message || t('au.kataSandiBerhasilDiresetSilakanMasuk');
      toast.success(message);
      setSuccess(message);
      setTimeout(() => navigate('/authentification/login_with_session'), 1500);
    } catch (err) {
      const msg = (err as Error).message || t('au.gagalMeresetKataSandi');
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <AuthShell
      title={t('au.resetKataSandi')}
      subtitle={t('au.silakanMasukkanKataSandiBaruAnda')}
      footer={
        <a href="/authentification/login_with_session" class="transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">
          {t('au.kembaliKeLogin')}
        </a>
      }
    >
      <Title>{`${t('au.resetKataSandi')} - ${env.VITE_APP_NAME}`}</Title>

      <Show when={error()}>
        <AuthAlert kind="error">{error()}</AuthAlert>
      </Show>
      <Show when={success()}>
        <AuthAlert kind="success">{success()}</AuthAlert>
      </Show>

      <form onSubmit={submit} class="mb-6 w-full space-y-4">
        <AuthField label={t('au.tokenReset')} icon="key" name="token" value={tokenValue()} onInput={setToken} autocomplete="off" placeholder={t('au.masukkanTokenDariEmailWA')} />
        <AuthField label={t('au.kataSandiBaru')} icon="lock" name="new_password" type="password" autocomplete="new-password" value={password()} onInput={setPassword} />
        <AuthField label={t('au.ulangiKataSandi')} icon="lock" name="confirm_password" type="password" autocomplete="new-password" value={confirm()} onInput={setConfirm} />
        <SubmitButton pending={pending()} pendingLabel={t('au.memproses')}>
          <span>{t('au.resetKataSandi')}</span>
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
