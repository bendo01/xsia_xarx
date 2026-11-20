import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import { env } from 'virtual:solid-env/client';

import { t } from '../i18n';

// The catch-all route. httpStatus() sets the response status during SSR
// (a no-op in the browser); it runs in preload so the status code is set
// before the response head flushes.
export const route = {
  preload: () => httpStatus(404),
} satisfies RouteDefinition;

export default function NotFound() {
  return (
    <main class="mx-auto max-w-md p-8 text-center">
      <Title>{`404 - ${env.VITE_APP_NAME}`}</Title>
      <h1 class="text-2xl font-semibold">404</h1>
      <p class="mt-2 text-slate-600 dark:text-slate-400">{t('common.noData')}</p>
      <a class="mt-4 inline-block underline" href="/">
        {t('common.back')}
      </a>
    </main>
  );
}
