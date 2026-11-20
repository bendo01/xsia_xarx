import { Show } from 'solid-js';

import { t } from '../../i18n';

/** Error state shared by the activity pages: a missing/foreign activity reads as "not found". */
export default function ActivityError(props: { error: unknown; fallbackKey: string }) {
  const message = () => (props.error instanceof Error ? props.error.message : '');
  const notFound = () => message() === 'NOT_FOUND';

  return (
    <div role="alert" class="mx-auto max-w-xl rounded-xs border border-card-line bg-card p-8 text-center shadow-2xs">
      <h2 class="text-base font-semibold text-foreground">
        {notFound() ? t('st.aktivitasSemesterTidakDitemukan') : t(props.fallbackKey)}
      </h2>
      <Show when={notFound()} fallback={<p class="mt-2 text-sm text-muted-foreground-1">{message()}</p>}>
        <p class="mt-2 text-sm text-muted-foreground-1">{t('st.halamanKRSMemerlukanIDAktivitasSemester')}</p>
      </Show>
      <a
        href="/student/academic/student/campaign/activity"
        class="mt-5 inline-flex rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-hidden"
      >
        {t('st.kembaliKeAktivitasSemester')}
      </a>
    </div>
  );
}
