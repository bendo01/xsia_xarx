import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import { Match, Switch, createMemo } from 'solid-js';

import { FeederForm, FeederIndex, FeederList, FeederShow, loadFeederList } from '../../../components/administrator/FeederPages';
import { getFeederForm, getFeederRecord } from '../../../lib/feeder-admin-data';
import { matchFeederPath, type FeederView } from '../../../lib/feeder-admin';
import NotFound from '../../[...404]';

export const route = {
  preload: ({ params, location }) => {
    const m = matchFeederPath((params.path as string) ?? '');
    if (!m) httpStatus(404);
    else if (m.kind === 'list') void loadFeederList(m.group, m.slug, location.query as Record<string, string | undefined>);
    else if (m.kind === 'show') void getFeederRecord(m.group, m.slug, m.id);
    else if (m.kind === 'create' || m.kind === 'edit') void getFeederForm(m.slug, m.kind === 'edit' ? m.id : '');
  },
} satisfies RouteDefinition;

/** Every Feeder (PDDikti) page of the administrator: index, lists, details, and reference-table forms. */
export default function AdministratorFeederPage() {
  const params = useParams();
  const view = createMemo(() => matchFeederPath((params.path as string) ?? ''));
  const of = <K extends FeederView['kind']>(...kinds: K[]) => createMemo(() => {
    const v = view();
    return v && (kinds as string[]).includes(v.kind) ? (v as Extract<FeederView, { kind: K }>) : undefined;
  });
  const index = of('index');
  const list = of('list');
  const show = of('show');
  const form = of('create', 'edit');
  return (
    <Switch fallback={<NotFound />}>
      <Match when={index()}><FeederIndex /></Match>
      <Match when={list()}>{(v) => <FeederList group={v().group} slug={v().slug} />}</Match>
      <Match when={show()}>{(v) => <FeederShow group={v().group} slug={v().slug} id={v().id} />}</Match>
      <Match when={form()}>{(v) => <FeederForm slug={v().slug} id={'id' in v() ? (v() as { id: string }).id : undefined} />}</Match>
    </Switch>
  );
}
