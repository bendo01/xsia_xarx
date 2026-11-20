import { Show } from 'solid-js';

import { t } from '../i18n';
import { withParams } from '../lib/url';

/** Previous/next links that keep the rest of the query string (filters, selected student). */
export default function Pager(props: {
  page: number;
  totalPages: number;
  search: Record<string, string | string[] | undefined>;
}) {
  const link = (p: number) => withParams(props.search, { page: p === 1 ? null : p });
  const base = 'rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden';
  return (
    <Show when={props.totalPages > 1}>
      <nav class="flex items-center justify-between gap-3 pt-4" aria-label={t('st.page')}>
        <p class="text-sm text-muted-foreground-1">
          {t('st.page')} {props.page} / {props.totalPages}
        </p>
        <div class="flex gap-2">
          <Show when={props.page > 1}>
            <a href={link(props.page - 1)} rel="prev" class={base}>{t('st.previous')}</a>
          </Show>
          <Show when={props.page < props.totalPages}>
            <a href={link(props.page + 1)} rel="next" class={base}>{t('st.next')}</a>
          </Show>
        </div>
      </nav>
    </Show>
  );
}
