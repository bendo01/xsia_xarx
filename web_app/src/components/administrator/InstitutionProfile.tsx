import { Title } from '@solidjs/meta';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { formatNumber, t } from '../../i18n';
import { getInstitutionProfile } from '../../lib/institution-profile-data';
import PageHeader from '../student/PageHeader';
import { Card, Fields, errorBox } from './ProfileParts';

/** One institution: identity, its reference names, headline totals and units. */
export default function InstitutionProfile(props: { id: string }) {
  const profile = createMemo(() => getInstitutionProfile(props.id));
  const inst = () => profile().institution;
  return (
    <Errored fallback={(err) => <div role="alert" class={errorBox}>{(err() as Error).message}</div>}>
      <Title>{`${inst().name} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm print:hidden"><a href="/administrator/institution/master/institution" class="text-primary hover:underline">{t('ad.backToList')}</a></p>
      <PageHeader
        title={String(inst().name ?? '')}
        description={[inst().code, inst().alphabet_code].filter(Boolean).join(' · ')}
        actions={
          <>
            <button type="button" onClick={() => window.print()} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.print')}</button>
            <a href={`/administrator/institution/master/institution/${encodeURIComponent(props.id)}/edit`} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.edit')}</a>
          </>
        }
      />
      <div class="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <For each={profile().totals}>
          {(x) => (
            <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs print:break-inside-avoid">
              <p class="text-xs font-medium uppercase text-muted-foreground-1">{t(x.label)}</p>
              <p class="mt-1 text-2xl font-semibold">{x.value === null ? '–' : formatNumber(x.value)}</p>
            </div>
          )}
        </For>
      </div>
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('ad.n1BasicDetails')}>
          <Fields
            rows={[
              [t('ad.institutionCode'), inst().code],
              [t('ad.alphabetCodeAcronym'), inst().alphabet_code],
              [t('ad.operationalStatus'), inst().is_active],
              [t('ad.variety'), profile().names.variety_id],
              [t('ad.category'), profile().names.category_id],
              [t('ad.country'), profile().names.country_id],
              [t('ad.parentInstitutionOptional'), profile().names.parent_id],
              [t('ad.academicYear'), profile().names.academic_year_id],
            ]}
          />
        </Card>
        <Card title={t('ad.units')}>
          <Show when={profile().units.length > 0} fallback={<p class="text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
            <ul class="space-y-1 text-sm">
              <For each={profile().units}>
                {(u) => <li><a href={`/administrator/institution/master/unit/${encodeURIComponent(u.id)}`} class="text-primary hover:underline">{u.name}</a><Show when={u.code}><span class="text-muted-foreground-1"> · {u.code}</span></Show></li>}
              </For>
            </ul>
          </Show>
        </Card>
      </div>
    </Errored>
  );
}
