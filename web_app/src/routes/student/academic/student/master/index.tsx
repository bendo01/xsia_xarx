import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import Pager from '../../../../../components/Pager';
import PageHeader from '../../../../../components/student/PageHeader';
import { Badge } from '../../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../components/ui/table';
import { formatDate, t } from '../../../../../i18n';
import { getStudentDirectory } from '../../../../../lib/student';
import { parsePage } from '../../../../../lib/url';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

// Same call shape in preload and render (query() keys on the arguments).
const load = (q: Query) => getStudentDirectory(parsePage(q.page), one(q.q).trim());

export const route = {
  preload: ({ location }) => {
    void load(location.query as Query);
  },
} satisfies RouteDefinition;

/** "Admitted students": the signed-in person's own student records (one per programme). */
export default function StudentDirectory() {
  const [search] = useSearchParams();
  const data = createMemo(() => load(search as Query));

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('st.failedToLoadAdmittedStudentDirectory')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.student.admittedStudents')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={t('st.admittedStudentsDirectory')}
        description={t('st.comprehensiveInstitutionalRegistryOfAdmittedStudents')}
      />

      <form method="get" class="mb-4 flex items-center gap-3 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
        <label class="flex-1">
          <span class="sr-only">{t('common.search')}</span>
          <input
            type="search"
            name="q"
            value={one(search.q)}
            placeholder={t('st.searchByStudentNIMOrName')}
            class="h-9 w-full rounded-xs border border-input bg-card px-3 text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-hidden">
          {t('common.search')}
        </button>
        <p class="hidden text-sm text-muted-foreground-1 sm:block">
          {t('st.students')}: <strong class="text-foreground">{data().pagination.total_data}</strong>
        </p>
      </form>

      <Show
        when={data().data.length > 0}
        fallback={
          <p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">
            {one(search.q) ? t('st.noStudentsMatchingQueryWereFound', { query: one(search.q) }) : t('st.thereAreCurrentlyNoAdmittedStudent')}
          </p>
        }
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('st.studentNIM')}</TableHead>
              <TableHead>{t('st.fullName')}</TableHead>
              <TableHead>{t('st.studyProgram')}</TableHead>
              <TableHead>{t('st.admissionPath')}</TableHead>
              <TableHead>{t('st.registrationDate')}</TableHead>
              <TableHead>{t('st.status')}</TableHead>
              <TableHead class="text-end">{t('st.action')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <For each={data().data}>
              {(s) => (
                <TableRow>
                  <TableCell class="font-mono font-semibold text-primary" label={t('st.studentNIM')}>{s.code}</TableCell>
                  <TableCell class="font-medium" label={t('st.fullName')}>{s.name || '-'}</TableCell>
                  <TableCell label={t('st.studyProgram')}>{s.unit?.name ?? s.unit_name ?? '-'}</TableCell>
                  <TableCell label={t('st.admissionPath')}>{s.selection_type?.name ?? '-'}</TableCell>
                  <TableCell label={t('st.registrationDate')}>{s.registered ? formatDate(s.registered) : '-'}</TableCell>
                  <TableCell label={t('st.status')}>
                    <Badge variant="success">{s.status?.name ?? s.status_name ?? t('st.active')}</Badge>
                  </TableCell>
                  <TableCell class="text-end">
                    {/* The detail view is the student home's academic tab, scoped to this identity. */}
                    <a
                      href={`/student/person/master/individual/${encodeURIComponent(s.individual_id ?? '[id]')}?student_id=${encodeURIComponent(s.id)}`}
                      class="text-sm font-medium text-primary hover:underline"
                    >
                      {t('st.viewDetail')}
                    </a>
                  </TableCell>
                </TableRow>
              )}
            </For>
          </TableBody>
        </Table>
      </Show>
      <Pager page={data().pagination.page} totalPages={data().pagination.total_page} search={search as Query} />
    </Errored>
  );
}
