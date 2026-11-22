import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import InstitutionDashboard from '../../../../components/rectorat/InstitutionDashboard';
import PageHeader from '../../../../components/student/PageHeader';
import UnitAnalytics from '../../../../components/unit/UnitAnalytics';
import { t } from '../../../../i18n';
import { getInstitutionAnalytics, getInstitutionProgram, getInstitutionSummary } from '../../../../lib/institution-data';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export const route = {
  preload: ({ params }) => {
    void getInstitutionAnalytics(params.id as string);
    void getInstitutionSummary(params.id as string);
  },
} satisfies RouteDefinition;

/** Rectorat home: the institution-wide executive dashboard over all of its study programs. */
export default function InstitutionHome() {
  const params = useParams();
  const [search] = useSearchParams();
  const q = () => search as Query;
  const data = createMemo(() => getInstitutionAnalytics(params.id as string));
  const summary = createMemo(() => getInstitutionSummary(params.id as string));
  const refreshing = () => isPending(() => data());
  // The program shown in detail: the one asked for, else the one with the most students.
  const selectedId = () => one(q().program) || data().programs.find((p) => p.loaded)?.id || '';
  const detail = createMemo(() => (selectedId() ? getInstitutionProgram(params.id as string, selectedId()) : null));

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="mt-1">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('rt.dashboardInstitusi')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader
          title={t('rt.dashboardInstitusi')}
          description={[data().institutionName, t('rt.ringkasanSeluruhProgramStudiStatistikMahasiswa')].filter(Boolean).join(' · ')}
        />
        <InstitutionDashboard
          institutionId={params.id as string}
          data={data()}
          statuses={summary().studentsByStatus}
          query={one(q().q)}
          selectedId={selectedId()}
        >
          <Errored fallback={(err) => <p role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</p>}>
            <Show when={detail()}>{(dash) => <UnitAnalytics unit={dash() as Record<string, any>} />}</Show>
          </Errored>
        </InstitutionDashboard>
      </div>
    </Errored>
  );
}
