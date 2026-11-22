import { Title } from '@solidjs/meta';
import { Errored, For, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { formatNumber, t } from '../../i18n';
import { getIndividualProfile } from '../../lib/individual-data';
import { ageOn, fullName } from '../../lib/individual-profile';
import PageHeader from '../student/PageHeader';
import { Card, Fields, errorBox as box } from './ProfileParts';

/** One individual: identity, classification, body measurements, login account, contacts and linked records. */
export default function IndividualProfile(props: { id: string }) {
  const profile = createMemo(() => getIndividualProfile(props.id));
  const person = () => profile().individual;
  const name = () => fullName(person().front_title, person().name, person().last_title);
  const age = () => ageOn(person().birth_date);
  return (
    <Errored fallback={(err) => <div role="alert" class={box}>{(err() as Error).message}</div>}>
      <Title>{`${name()} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm print:hidden"><a href="/administrator/person/master/individual" class="text-primary hover:underline">{t('ad.backToList')}</a></p>
      <PageHeader
        title={name()}
        description={`${t('ad.code2')} ${person().code}`}
        actions={
          <span class="print:hidden flex gap-2">
            <button type="button" onClick={() => window.print()} class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('ad.print')}</button>
            <a href={`/administrator/person/master/individual/${encodeURIComponent(props.id)}/edit`} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.edit')}</a>
          </span>
        }
      />
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={t('ad.civilRegistrationIdentity')}>
          <Fields
            rows={[
              [t('ad.birthDate'), `${String(person().birth_date ?? '').slice(0, 10)}${age() === null ? '' : ` (${t('ad.ageYears', { age: age() as number })})`}`],
              [t('ad.birthPlace'), person().birth_place],
              [t('ad.identificationType'), profile().names.identification_type_id],
              [t('ad.maritalStatus'), profile().names.marital_status_id],
              [t('ad.isSpecialNeed'), person().is_special_need],
              [t('ad.isSocialProtectionCardRecipient'), person().is_social_protection_card_recipient],
              [t('ad.isDeceased'), person().is_deceased],
            ]}
          />
        </Card>
        <Card title={t('ad.classification')}>
          <Fields
            rows={[
              [t('ad.gender'), profile().names.gender_id],
              [t('ad.religion'), profile().names.religion_id],
              [t('ad.education'), profile().names.education_id],
              [t('ad.occupation'), profile().names.occupation_id],
              [t('ad.profession'), profile().names.profession_id],
              [t('ad.income'), profile().names.income_id],
              [t('ad.ageClassification'), profile().names.age_classification_id],
            ]}
          />
        </Card>
        <Card title={t('ad.biometrics')}>
          <Show when={profile().biodata} fallback={<p class="text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
            {(b) => (
              <>
                <Fields
                  rows={[
                    [t('ad.height'), b().height],
                    [t('ad.weight'), b().weight],
                    [t('ad.bloodType'), `${profile().biodataNames.blood_type_id ?? '–'}${b().is_positive_blood_rhesus === true ? ' (Rh+)' : b().is_positive_blood_rhesus === false ? ' (Rh−)' : ''}`],
                    [t('ad.hairType'), profile().biodataNames.hair_type_id],
                    [t('ad.hairColor'), profile().biodataNames.hair_color_id],
                    [t('ad.eyeColor'), profile().biodataNames.eye_color_id],
                    [t('ad.bust'), b().bust],
                    [t('ad.waist'), b().waist],
                    [t('ad.hip'), b().hip],
                    [t('ad.armCircumference'), b().arm_circumference],
                    [t('ad.menarcheAge'), b().menarche_age],
                    [t('ad.menopauseAge'), b().menopause_age],
                  ]}
                />
                <Show when={profile().bmi}>
                  {(m) => <p class="mt-3 text-sm"><span class="text-muted-foreground-1">{t('ad.bmiCalculation')}: </span><span class="font-semibold">{formatNumber(m().value, { maximumFractionDigits: 1 })}</span> · {t(`ad.bmi_${m().category}`)}</p>}
                </Show>
              </>
            )}
          </Show>
        </Card>
        <Card title={t('ad.users')}>
          <Show when={profile().users.length > 0} fallback={<p class="text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
            <ul class="space-y-2 text-sm">
              <For each={profile().users}>
                {(u) => (
                  <li>
                    <a href={`/administrator/auth/user/${encodeURIComponent(u.id)}`} class="font-medium text-primary hover:underline">{u.name || u.email}</a>
                    <span class="block text-muted-foreground-1">{u.email} · {t(u.is_active ? 'ad.active' : 'ad.inactive')} · {t(u.email_verified_at ? 'ad.emailVerified' : 'ad.emailNotVerified')}</span>
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Card>
        <Card title={`${t('ad.eMails')} / ${t('ad.phones')}`}>
          <Show when={profile().mails.length + profile().phones.length > 0} fallback={<p class="text-sm text-muted-foreground-1">{t('cd.noRecords')}</p>}>
            <ul class="space-y-1 text-sm">
              <For each={profile().mails}>{(m) => <li>{m.value}</li>}</For>
              <For each={profile().phones}>{(p) => <li>{p.value}</li>}</For>
            </ul>
          </Show>
        </Card>
        <Show when={profile().linked.length > 0}>
          <Card title={t('ad.linkedRecords')}>
            <For each={profile().linked}>
              {(group) => (
                <div class="mb-2 text-sm">
                  <p class="font-medium">{t(group.label)}</p>
                  <ul class="ms-4 list-disc">
                    <For each={group.rows}>{(r) => <li><a href={`/administrator/${group.page}/${encodeURIComponent(r.id)}`} class="text-primary hover:underline">{r.name}</a></li>}</For>
                  </ul>
                </div>
              )}
            </For>
          </Card>
        </Show>
      </div>
    </Errored>
  );
}
