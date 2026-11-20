import { Title } from '@solidjs/meta';
import { useSearchParams, useSubmissions } from '@solidjs/router';
import { Show, createSignal } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import AuthShell from '../../components/auth/AuthShell';
import { AuthAlert, AuthField, SubmitButton } from '../../components/auth/fields';
import { t } from '../../i18n';
import { signInAction } from '../../lib/auth';

export default function LoginWithSession() {
  const [search] = useSearchParams();
  const submissions = useSubmissions(signInAction);
  const [dismissed, setDismissed] = createSignal<unknown>(null);

  const last = () => submissions.at(-1);
  const pending = () => last()?.result === undefined && last() !== undefined && !last()?.error;
  const error = () => {
    const e = last()?.error;
    return e && e !== dismissed() ? (e as Error) : null;
  };

  return (
    <AuthShell
      badge={t('auth.sessionLogin.title')}
      title={t('auth.sessionLogin.title')}
      subtitle={t('auth.sessionLogin.subtitle')}
      footer={<span />}
    >
      <Title>{`${t('auth.sessionLogin.title')} - ${env.VITE_APP_NAME}`}</Title>

      <div class="mb-6 w-full rounded-xs border border-emerald-500/20 bg-emerald-50 p-3 text-xs leading-relaxed text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200/90">
        {t('auth.sessionLogin.notice')}
      </div>

      <Show when={error()}>
        {(err) => (
          <AuthAlert kind="error">
            <span class="flex-1">{err().message || t('auth.login.networkError')}</span>
            <button type="button" onClick={() => setDismissed(last()?.error)} aria-label={t('au.dismissError')}>
              ×
            </button>
          </AuthAlert>
        )}
      </Show>

      {/* A plain form post: works before hydration; the action redirects on success. */}
      <form action={signInAction} method="post" class="mb-6 w-full space-y-4">
        <input type="hidden" name="return_url" value={String(search.return_url ?? '')} />
        <AuthField
          label={t('auth.login.emailLabel')}
          icon="mail"
          name="email"
          type="email"
          placeholder={t('auth.login.emailPlaceholder')}
          autocomplete="username"
        />
        <AuthField
          label={t('auth.login.passwordLabel')}
          icon="lock"
          name="password"
          type="password"
          placeholder={t('auth.login.passwordPlaceholder')}
          autocomplete="current-password"
        />
        <div class="flex items-center justify-end pt-1 text-xs">
          <a href="/authentification/forgot-password" class="text-emerald-700 transition-colors hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300">
            {t('au.forgotPassword')}
          </a>
        </div>
        <SubmitButton pending={pending()} pendingLabel={t('auth.sessionLogin.startingSession')}>
          <span>{t('auth.sessionLogin.startSessionButton')}</span>
        </SubmitButton>
      </form>
    </AuthShell>
  );
}
