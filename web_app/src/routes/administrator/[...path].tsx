import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { httpStatus } from '@solidjs/web';
import { Match, Switch, createMemo } from 'solid-js';

import AdminOverview from '../../components/administrator/AdminOverview';
import AdminShow from '../../components/administrator/AdminShow';
import AdminForm from '../../components/administrator/AdminForm';
import AdminList, { loadAdminList } from '../../components/administrator/AdminList';
import { getAdminForm, getAdminRecord } from '../../lib/admin-crud-data';
import { matchAdminPath } from '../../lib/admin-resources';
import NotFound from '../[...404]';

export const route = {
  preload: ({ params, location }) => {
    const m = matchAdminPath((params.path as string) ?? '');
    if (!m) httpStatus(404);
    else if (m.view === 'overview') return;
    else if (m.view === 'list') void loadAdminList(m.resource.key, location.query as Record<string, string | undefined>);
    else if (m.view === 'show') void getAdminRecord(m.resource.key, m.id);
    else void getAdminForm(m.resource.key, m.view === 'edit' ? m.id : '');
  },
} satisfies RouteDefinition;

/** Every registered administrator CRUD page (see lib/admin-resources.ts): list, create and edit. */
export default function AdministratorResourcePage() {
  const params = useParams();
  const match = createMemo(() => matchAdminPath((params.path as string) ?? ''));
  return (
    <Switch fallback={<NotFound />}>
      <Match when={match()?.view === 'overview'}><AdminOverview group={(match() as { group: string }).group} /></Match>
      <Match when={match()?.view === 'list'}><AdminList resource={match()!.resource!} /></Match>
      <Match when={match()?.view === 'create'}><AdminForm resource={match()!.resource!} /></Match>
      <Match when={match()?.view === 'show'}><AdminShow resource={match()!.resource!} id={(match() as { id: string }).id} /></Match>
      <Match when={match()?.view === 'edit'}><AdminForm resource={match()!.resource!} id={(match() as { id: string }).id} /></Match>
    </Switch>
  );
}
