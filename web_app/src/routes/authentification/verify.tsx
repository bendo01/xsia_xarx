import { Title } from '@solidjs/meta';
import { useSearchParams } from '@solidjs/router';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import AuthShell from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, SubmitButton } from '../../components/auth/fields';
import { t } from '../../i18n';
import { verifyEmail } from '../../lib/auth';
import { validateVerifyToken } from '../../lib/validation';

export default function Verify() {
  const [search] = useSearchParams();
  const initialToken = () => String(Array.isArray(search.token) ? search.token[0] : (search.token ?? ''));

  const [token, setToken] = createSignal<string | null>(null);
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);
  const [success, setSuccess] = createSignal<string | null>(null);
  const tokenValue = () => token() ?? initialToken();

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    const problem = validateVerifyToken(tokenValue().trim());
    if (problem) return setError(t(problem));

    setPending(true);
    setError(null);
    try {
      const res = await verifyEmail(tokenValue().trim());
      const message = res.message || t('au.akunBerhasilDiverifikasi');
      toast.success(message);
      setSuccess(message);
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
      title={t('au.verifikasiAkun')}
      subtitle={t('au.silakanMasukkanTokenVerifikasiAnda')}
      footer={
        <a href="/authentification/login_with_session" class="transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">
          {t('au.kembaliKeLogin')}
        </a>
      }
    >
      <Title>{`${t('au.verifikasiAkun')} - ${env.VITE_APP_NAME}`}</Title>

      <Show when={error()}>
        <AuthAlert kind="error">{error()}</AuthAlert>
      </Show>
      <Show when={success()}>
        <AuthAlert kind="success">{success()}</AuthAlert>
      </Show>

      <form onSubmit={submit} class="mb-6 w-full space-y-4">
        <AuthField label={t('au.tokenVerifikasi')} icon="key" name="token" value={tokenValue()} onInput={setToken} autocomplete="off" />
        <SubmitButton pending={pending()} pendingLabel={t('au.memproses')}>
          <span>{t('au.verifikasi')}</span>
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
