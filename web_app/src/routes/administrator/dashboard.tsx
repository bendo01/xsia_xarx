import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Errored, For, Show, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import BarChart from '../../components/chart/BarChart';
import Kpi from '../../components/chart/Kpi';
import PieChart from '../../components/chart/PieChart';
import PageHeader from '../../components/student/PageHeader';
import { formatNumber, t } from '../../i18n';
import { getAdministratorCounts, getPersonStatistics } from '../../lib/administrator-data';
import { chartVariant, sharePercent, type StatItem } from '../../lib/person-statistics';
import { ADMIN_OVERVIEWS, ADMIN_RESOURCES, adminUrl } from '../../lib/admin-resources';

interface Module {
  group: string;
  /** The area's own overview page, when it has one. */
  href?: string;
  links: { href: string; title: string }[];
}

const overviewHref = (group: string) => {
  const path = Object.keys(ADMIN_OVERVIEWS).find((p) => ADMIN_OVERVIEWS[p] === group);
  return path ? `/administrator/${path}` : undefined;
};

/** Module cards: registered resources by their top-level menu group, then the custom pages. */
const MODULES: Module[] = (() => {
  const by = new Map<string, Module>();
  for (const r of ADMIN_RESOURCES) {
    const g = r.group?.[0];
    if (g) (by.get(g) ?? by.set(g, { group: g, href: overviewHref(g), links: [] }).get(g)!).links.push({ href: adminUrl(r), title: r.titleKey });
  }
  return [
    ...by.values(),
    { group: 'ad.feederPDDikti', links: [{ href: '/administrator/feeder', title: 'ad.feederPDDikti' }] },
    { group: 'ad.agent', links: [{ href: '/administrator/agent/chatbot', title: 'ad.ragTitle' }] },
    { group: 'ad.preference', links: [{ href: '/administrator/preference/application', title: 'ad.applicationPreference' }] },
  ];
})();

/** What each distribution chart says, by the API's distribution key. */
const DISTRIBUTION_NOTE: Record<string, string> = {
  gender: 'ad.individualsByGender',
  marital_status: 'ad.individualsByMaritalStatus',
  religion: 'ad.individualsByReligion',
  age_classification: 'ad.individualsByAgeClassificationReference',
  education: 'ad.individualsByHighestEducationLevel',
  identification_type: 'ad.individualsByIdentificationDocumentType',
  occupation: 'ad.individualsByOccupation',
  profession: 'ad.individualsByProfession',
  income: 'ad.individualsByIncomeBracket',
};

function ChartCard(props: { title: string; note?: string; items: StatItem[]; variant: 'donut' | 'bar' }) {
  return (
    <section class="min-w-0 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
      <h3 class="font-semibold text-foreground">{props.title}</h3>
      <Show when={props.note}><p class="mb-3 text-xs text-muted-foreground-1">{props.note}</p></Show>
      <Show when={props.items.some((i) => i.value > 0)} fallback={<p class="text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
        {props.variant === 'bar' ? <BarChart items={props.items} ariaLabel={props.title} /> : <PieChart items={props.items} ariaLabel={props.title} />}
      </Show>
    </section>
  );
}

/** Headline numbers and distributions of the individual master records. */
function Demographics() {
  const stats = createMemo(() => getPersonStatistics());
  const living = () => stats().total - stats().deceased;
  const cards = () => [
    { label: t('ad.livingIndividuals'), value: living() },
    { label: t('ad.deceased'), value: stats().deceased },
    { label: t('ad.specialNeeds'), value: stats().specialNeed },
    { label: t('ad.kpsRecipients'), value: stats().socialProtectionCardRecipient },
  ];
  return (
    <Errored fallback={() => <p class="rounded-xs border border-card-line bg-card p-6 text-center text-sm text-muted-foreground-1">{t('ad.demographicStatisticsAreUnavailable')}</p>}>
      <div class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <For each={cards()}>{(c) => <Kpi label={c.label} value={formatNumber(c.value)} caption={t('ad.shareOfIndividuals', { pct: sharePercent(c.value, stats().total) })} />}</For>
      </div>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ChartCard title={t('ad.kelompokUmur')} note={t('ad.livingIndividualsByAgeComputedFrom')} items={stats().ageGroups} variant="bar" />
        <For each={stats().distributions}>
          {(d) => <ChartCard title={d.label} note={DISTRIBUTION_NOTE[d.key] ? t(DISTRIBUTION_NOTE[d.key]) : undefined} items={d.items} variant={chartVariant(d.key, d.items.length)} />}
        </For>
      </div>
    </Errored>
  );
}

export const route = {
  preload: () => {
    void getAdministratorCounts();
    void getPersonStatistics();
  },
} satisfies RouteDefinition;

/** Administrator home: system-wide totals. Module shortcuts are added as each area is ported. */
export default function AdministratorDashboard() {
  const counts = createMemo(() => getAdministratorCounts());
  const refreshing = () => isPending(() => counts());
  const cards = () => [
    { key: 'users', label: t('ad.users'), value: counts().users },
    { key: 'roles', label: t('ad.roles'), value: counts().roles },
    { key: 'permissions', label: t('ad.permissions'), value: counts().permissions },
    { key: 'individuals', label: t('ad.individuals'), value: counts().individuals },
    { key: 'institutions', label: t('ad.institutions'), value: counts().institutions },
  ];

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="mt-1">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('ad.administratorDashboard')} - ${env.VITE_APP_NAME}`}</Title>
      <div class={['space-y-6 transition-opacity', { 'opacity-60': refreshing() }]} aria-busy={refreshing() ? 'true' : 'false'}>
        <PageHeader title={t('ad.administratorDashboard')} description={t('ad.quickAccessToTheMainAdministration')} />
        <div class="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          <For each={cards()}>{(c) => <Kpi label={c.label} value={formatNumber(c.value)} />}</For>
        </div>
        <div>
          <h2 class="text-lg font-semibold text-foreground">{t('ad.personDemographics')}</h2>
          <p class="text-xs text-muted-foreground-1">{t('ad.distributionOfIndividualMasterRecordsAcross')}</p>
        </div>
        <Demographics />
        <h2 class="text-lg font-semibold text-foreground">{t('ad.modules')}</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <For each={MODULES}>
            {(m) => (
              <section class="rounded-xs border border-card-line bg-card p-4 shadow-2xs">
                <h3 class="font-semibold text-foreground"><Show when={m.href} fallback={t(m.group)}><a href={m.href} class="hover:text-primary">{t(m.group)}</a></Show></h3>
                <div class="mt-3 flex flex-wrap gap-2 border-t border-card-divider pt-3">
                  <For each={m.links}>{(l) => <a href={l.href} class="rounded-xs bg-secondary px-2 py-1 text-xs font-medium text-foreground/80 hover:text-primary">{t(l.title)}</a>}</For>
                </div>
              </section>
            )}
          </For>
        </div>
      </div>
    </Errored>
  );
}
