import { createResource, For, Show } from 'solid-js';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { t } from '../../i18n';

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));

function Card(props: { title: string; children: any; rounded?: boolean }) {
    return (
        <div
            class={
                props.rounded
                    ? 'bg-card rounded-xl border border-border shadow-sm'
                    : 'bg-card rounded-md border border-border shadow-2xs'
            }
        >
            <div class={`px-4 py-3 border-b text-sm font-bold ${props.rounded ? 'border-border' : 'border-border'}`}>{props.title}</div>
            <div class="p-4 text-xs">{props.children}</div>
        </div>
    );
}

/**
 * Phones, e-mails, residences and family cards of an individual.
 * Uses `data` when supplied, otherwise fetches the individual by `individualId`.
 */
export default function IndividualContactsFamily(props: {
    individualId?: string | null;
    data?: PersonMasterIndividualDataObject | null;
    /** Match the rounded-xl card style used on the rectorat detail pages. */
    rounded?: boolean;
}) {
    const NIL = '00000000-0000-0000-0000-000000000000';
    const [fetched] = createResource(
        () => (props.data ? null : props.individualId && props.individualId !== NIL ? props.individualId : null),
        async (id) => {
            const res = await PersonMasterIndividualControllerShow(id);
            return !res.is_error && res.data ? res.data : null;
        },
    );
    const data = () => props.data ?? fetched() ?? null;
    const phones = () => data()?.phones ?? [];
    const mails = () => data()?.electronic_mails ?? [];
    const residences = () => data()?.residences ?? [];
    const cards = () => data()?.family_cards ?? [];
    const hasAny = () => phones().length + mails().length + residences().length + cards().length > 0;

    return (
        <Show when={hasAny()}>
            <div class="space-y-4">
                <h2 class="text-sm font-bold">{t('ad.contactsAndFamily')}</h2>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card rounded={props.rounded} title={t('ad.phoneNumbers')}>
                        <Show when={phones().length > 0} fallback={<p class="text-neutral-500">{t('ad.noneRecorded')}</p>}>
                            <ul class="space-y-1.5">
                                <For each={phones()}>
                                    {(p) => (
                                        <li class="flex justify-between gap-2">
                                            <span class="font-mono">{p.value}</span>
                                            <span class="text-neutral-500">{dash(p.type_name)}</span>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </Show>
                    </Card>
                    <Card rounded={props.rounded} title={t('ad.emailAddresses')}>
                        <Show when={mails().length > 0} fallback={<p class="text-neutral-500">{t('ad.noneRecorded')}</p>}>
                            <ul class="space-y-1.5">
                                <For each={mails()}>
                                    {(m) => (
                                        <li class="flex justify-between gap-2">
                                            <span class="font-mono break-all">{m.value}</span>
                                            <span class="text-neutral-500">{dash(m.type_name)}</span>
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </Show>
                    </Card>
                </div>

                <Card rounded={props.rounded} title={t('ad.residencesTitle')}>
                    <Show when={residences().length > 0} fallback={<p class="text-neutral-500">{t('ad.noneRecorded')}</p>}>
                        <ul class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                            <For each={residences()}>
                                {(r) => (
                                    <li class="py-2 space-y-0.5">
                                        <div class="font-semibold">
                                            {r.street} <span class="text-neutral-500 font-normal">({t('ad.rtRw')} {r.neighborhood_association}/{r.citizens_association})</span>
                                        </div>
                                        <div class="text-muted-foreground">
                                            {[r.village_name, r.sub_district_name, r.regency_name, r.province_name].filter(Boolean).join(', ') || '-'}
                                        </div>
                                        <Show when={r.residence_type_name}>
                                            <div class="text-neutral-500">{r.residence_type_name}</div>
                                        </Show>
                                    </li>
                                )}
                            </For>
                        </ul>
                    </Show>
                </Card>

                <For each={cards()}>
                    {(c) => (
                        <Card rounded={props.rounded} title={`${t('ad.familyCards')} · ${t('ad.familyCardNumber')} ${dash(c.code)}`}>
                            <p class="mb-2 text-neutral-500">{t('ad.familyHead')}: <span class="font-semibold text-foreground">{dash(c.head_name)}</span></p>
                            <div class="overflow-x-auto -mx-4">
                                <table class="w-full text-left">
                                    <thead class="bg-muted/30 text-neutral-500 uppercase tracking-wider">
                                        <tr>
                                            <th class="px-4 py-2 font-semibold">{t('ad.familyMember')}</th>
                                            <th class="px-4 py-2 font-semibold">{t('ad.familyRelationship')}</th>
                                            <th class="px-4 py-2 font-semibold"></th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                        <For each={c.members}>
                                            {(m) => (
                                                <tr>
                                                    <td class="px-4 py-2">{dash(m.individual_name)}</td>
                                                    <td class="px-4 py-2">{dash(m.relative_type_name)}</td>
                                                    <td class="px-4 py-2">{dash(m.relative_name)}</td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </Card>
                    )}
                </For>
            </div>
        </Show>
    );
}
