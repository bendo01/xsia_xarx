import { useInRouter, useLocation, useNavigate } from '@solidjs/router';
import { For, Show } from 'solid-js';

import { t } from '../i18n';
import { PAGE_SIZES, withParams } from '../lib/url';

/** Previous/next links that keep the rest of the query string (filters, selected student). */
export default function Pager(props: {
  page: number;
  totalPages: number;
  search: Record<string, string | string[] | undefined>;
  /** Current rows per page; passing it (with `total`) adds the "rows per page" selector and the "x–y of n" label. */
  pageSize?: number;
  total?: number;
}) {
  // Inside the app the router navigates (no reload); without one (server-render tests) the form submits itself.
  const inRouter = useInRouter();
  const navigate = inRouter ? useNavigate() : undefined;
  const location = inRouter ? useLocation() : undefined;
  // Changing the size keeps every filter and returns to page 1.
  const setSize = (el: HTMLSelectElement) => {
    if (navigate && location) navigate(`${location.pathname}${withParams(props.search, { page: null, size: el.value })}`);
    else el.form?.requestSubmit();
  };
  const link = (p: number) => withParams(props.search, { page: p === 1 ? null : p });
  const base = 'rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden';
  const sizes = () => (props.pageSize && !(PAGE_SIZES as readonly number[]).includes(props.pageSize) ? [...PAGE_SIZES, props.pageSize].sort((a, b) => a - b) : [...PAGE_SIZES]);
  const range = () => {
    const size = props.pageSize ?? 0;
    const total = props.total ?? 0;
    return { from: total === 0 ? 0 : (props.page - 1) * size + 1, to: Math.min(props.page * size, total), total };
  };
  // Other filters ride along as hidden fields; changing the size goes back to page 1.
  const carried = () => Object.entries(props.search).flatMap(([k, v]) => (k === 'size' || k === 'page' ? [] : [[k, Array.isArray(v) ? (v[0] ?? '') : (v ?? '')] as const])).filter(([, v]) => v !== '');
  return (
    <Show when={props.totalPages > 1 || (props.pageSize !== undefined && (props.total ?? 0) > PAGE_SIZES[0])}>
      <nav class="flex items-center justify-between gap-3 pt-4" aria-label={t('st.page')}>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground-1">
          <Show when={props.pageSize !== undefined} fallback={<p>{t('st.page')} {props.page} / {props.totalPages}</p>}>
            <p>{t('rt.showingRange', { from: range().from, to: range().to, total: range().total })}</p>
            <p>{t('st.page')} {props.page} / {props.totalPages}</p>
            <form method="get" class="flex items-center gap-2">
              <For each={carried()}>{([k, v]) => <input type="hidden" name={k} value={v} />}</For>
              <label class="flex items-center gap-2">
                <span>{t('cd.rowsPerPage')}</span>
                <select
                  name="size"
                  aria-label={t('cd.rowsPerPage')}
                  class="h-8 rounded-xs border border-layer-line bg-layer px-2 text-sm text-layer-foreground"
                  onChange={(e) => setSize(e.currentTarget)}
                >
                  <For each={sizes()}>{(n) => <option value={n} selected={n === props.pageSize}>{n}</option>}</For>
                </select>
              </label>
              <button type="submit" class="sr-only">{t('cd.applyFilters')}</button>
            </form>
          </Show>
        </div>
        <Show when={props.totalPages > 1}>
        <div class="flex gap-2">
          <Show when={props.page > 1}>
            <a href={link(props.page - 1)} rel="prev" class={base}>{t('st.previous')}</a>
          </Show>
          <Show when={props.page < props.totalPages}>
            <a href={link(props.page + 1)} rel="next" class={base}>{t('st.next')}</a>
          </Show>
        </div>
        </Show>
      </nav>
    </Show>
  );
}
