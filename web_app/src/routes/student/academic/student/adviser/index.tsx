import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../components/Pager';
import PageHeader from '../../../../../components/student/PageHeader';
import { Badge } from '../../../../../components/ui/badge';
import { formatDate, t } from '../../../../../i18n';
import { getCounsellors } from '../../../../../lib/student';
import { parsePage } from '../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export const route = {
  preload: ({ location }) => {
    void getCounsellors(parsePage((location.query as Query).page));
  },
} satisfies RouteDefinition;

const ROLE_FILTERS = [
  { value: 'all', labelKey: 'st.allAdvisers' },
  { value: 'academic', labelKey: 'st.academicAdvisorPA' },
  { value: 'thesis', labelKey: 'st.thesisSupervisor' },
] as const;

export default function StudentAdvisers() {
  const [search] = useSearchParams();
  const page = () => parsePage(search.page);
  const data = createMemo(() => getCounsellors(page()));

  // Search and role filter apply to the fetched page (the API has no such filters).
  const visible = createMemo(() => {
    const q = one(search.q).trim().toLowerCase();
    const role = one(search.role) || 'all';
    return data().data.filter((a) => {
      const text = [a.lecturer_name, a.decree_number, a.lecturer_nidn].join(' ').toLowerCase();
      return (!q || text.includes(q)) && (role === 'all' || (a.role_type ?? '').toLowerCase().includes(role));
    });
  });

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('st.failedToLoadAcademicAdvisersFrom')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.student.academicAdvisers')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={t('st.myAcademicAdvisersCounsellors')}
        description={t('st.viewYourDesignatedAcademicAdvisorsDosen')}
      />

      {/* A plain GET form: filtering works before hydration and is shareable as a URL. */}
      <form method="get" class="mb-4 flex flex-wrap items-end gap-3 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
        <label class="min-w-56 flex-1">
          <span class="sr-only">{t('common.search')}</span>
          <input
            type="search"
            name="q"
            value={one(search.q)}
            placeholder={t('st.searchByAdvisorNameNIDNOr')}
            class="h-9 w-full rounded-xs border border-input bg-card px-3 text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label class="flex w-full items-center gap-2 text-sm text-muted-foreground-1 sm:w-auto">
          {t('st.roleFilter')}
          <select name="role" class="h-9 min-w-0 flex-1 rounded-xs border border-input bg-card px-2 text-sm text-foreground">
            <For each={[...ROLE_FILTERS]}>
              {(o) => (
                <option value={o.value} selected={(one(search.role) || 'all') === o.value}>
                  {t(o.labelKey)}
                </option>
              )}
            </For>
          </select>
        </label>
        <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-hidden">
          {t('common.search')}
        </button>
      </form>

      <Show
        when={visible().length > 0}
        fallback={
          <p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">
            {t('st.noAssignedAdvisersFound')}
          </p>
        }
      >
        <ul class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <For each={visible()}>
            {(a) => (
              <li class="min-w-0 rounded-xs border border-card-line bg-card p-5 shadow-2xs">
                <div class="flex flex-wrap items-start gap-3">
                  <div class="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-100 font-semibold text-primary-800 dark:bg-primary-500/20 dark:text-primary-400" aria-hidden="true">
                    {(a.lecturer_name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold text-foreground">{a.lecturer_name || '-'}</p>
                    <p class="text-xs text-muted-foreground-1">{t('st.nidn')} {a.lecturer_nidn || '-'}</p>
                  </div>
                  <Badge variant="secondary">{a.role_type || t('st.academicAdvisor')}</Badge>
                </div>
                <dl class="mt-4 space-y-1.5 text-sm">
                  <div class="flex justify-between gap-3">
                    <dt class="text-muted-foreground-1">{t('st.assignmentDecree')}</dt>
                    <dd class="font-medium text-foreground">{a.decree_number || '-'}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-muted-foreground-1">{t('st.decreeDate')}</dt>
                    <dd class="font-medium text-foreground">{a.decree_date ? formatDate(a.decree_date) : '-'}</dd>
                  </div>
                  <div class="flex justify-between gap-3">
                    <dt class="text-muted-foreground-1">{t('st.email')}</dt>
                    <dd class="min-w-0 truncate font-medium text-primary">{a.lecturer_email || '-'}</dd>
                  </div>
                </dl>
                <Show when={a.notes}>
                  <p class="mt-3 text-xs text-muted-foreground-1">{a.notes}</p>
                </Show>
              </li>
            )}
          </For>
        </ul>
      </Show>
      <Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={search as Query} />
    </Errored>
  );
}
