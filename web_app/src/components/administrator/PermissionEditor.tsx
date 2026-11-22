import { Title } from '@solidjs/meta';
import { Errored, For, Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { crudErrorText } from '../../lib/crud-errors';
import { assignPermissionRow, getPermissionEditor, revokePermissionRow } from '../../lib/permission-data';
import { groupPermissions, splitPermissionName, type PermissionGroup, type PermissionOwnerKind, type PermissionRow } from '../../lib/permission-toggles';
import PageHeader from '../student/PageHeader';
import { Switch } from '../ui/switch';

const box = 'rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive';

/** Grant or revoke permissions of one role / position type, grouped by controller. */
export default function PermissionEditor(props: { kind: PermissionOwnerKind; id: string; titleKey: string; hintKey: string; backHref: string }) {
  const data = createMemo(() => getPermissionEditor(props.kind, props.id));
  return (
    <Errored fallback={(err) => <div role="alert" class={box}>{(err() as Error).message}</div>}>
      <Title>{`${t(props.titleKey)} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-2 text-sm"><a href={props.backHref} class="text-primary hover:underline">{t('ad.backToList')}</a></p>
      <PageHeader title={`${t(props.titleKey)} · ${data().owner.name}`} description={t(props.hintKey)} />
      {/* Mount the editor only once the (possibly pending) query has landed: it seeds its state from it. */}
      <Show when={data()}>{(_d) => <Toggles kind={props.kind} id={props.id} permissions={data().permissions} initial={data().assigned} />}</Show>
    </Errored>
  );
}

function Toggles(props: { kind: PermissionOwnerKind; id: string; permissions: PermissionRow[]; initial: Record<string, string> }) {
  // permission id -> link id
  const [assigned, setAssigned] = createSignal<Record<string, string>>(() => props.initial);
  const [pending, setPending] = createSignal<Record<string, boolean>>({});
  const [query, setQuery] = createSignal('');
  const [onlyAssigned, setOnlyAssigned] = createSignal(false);
  const groups = createMemo(() => groupPermissions(props.permissions, assigned(), query(), onlyAssigned()));
  const count = () => Object.keys(assigned()).length;

  /** Returns an error message, or null when done. */
  const apply = async (p: PermissionRow, allow: boolean): Promise<string | null> => {
    if (pending()[p.id] || Boolean(assigned()[p.id]) === allow) return null;
    setPending((x) => ({ ...x, [p.id]: true }));
    try {
      if (allow) {
        const link = await assignPermissionRow(props.kind, props.id, p.id);
        setAssigned((x) => ({ ...x, [p.id]: link }));
      } else {
        await revokePermissionRow(props.kind, props.id, assigned()[p.id]);
        setAssigned(({ [p.id]: _gone, ...rest }) => rest);
      }
      return null;
    } catch (e) {
      return crudErrorText(e, 'cd.saveFailed');
    } finally {
      setPending(({ [p.id]: _done, ...rest }) => rest);
    }
  };

  const toggle = async (p: PermissionRow, allow: boolean) => {
    const err = await apply(p, allow);
    if (err) toast.error(err);
    else toast.success(t(allow ? 'ad.permAllowedToast' : 'ad.permRevokedToast', { name: p.name }));
  };

  const setGroup = async (g: PermissionGroup, allow: boolean) => {
    const targets = g.permissions.filter((p) => Boolean(assigned()[p.id]) !== allow);
    if (!targets.length) return;
    const errors = (await Promise.all(targets.map((p) => apply(p, allow)))).filter(Boolean);
    if (errors.length) toast.error(t('ad.permGroupFailed', { failed: errors.length, total: targets.length }));
    else toast.success(t(allow ? 'ad.permGroupAllowed' : 'ad.permGroupRevoked', { count: targets.length, group: g.controller }));
  };

  return (
    <div class="space-y-4">
      <div class="flex flex-wrap items-center gap-3">
        <input type="search" value={query()} onInput={(e) => setQuery(e.currentTarget.value)} placeholder={t('ad.permSearch')} class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm" />
        <label class="flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyAssigned()} onChange={(e) => setOnlyAssigned(e.currentTarget.checked)} />{t('ad.permAllowedOnly')}</label>
        <span class="text-sm text-muted-foreground-1">{t('ad.permAllowedCount', { count: count(), total: props.permissions.length })}</span>
      </div>
      <Show when={groups().length > 0} fallback={<p class="rounded-xs border border-card-line bg-card p-8 text-center text-sm text-muted-foreground-1">{t('ad.permNoMatch')}</p>}>
        <For each={groups()}>
          {(g) => (
            <section class="rounded-xs border border-card-line bg-card shadow-2xs">
              <header class="flex flex-wrap items-center justify-between gap-2 border-b border-card-divider px-4 py-2">
                <h3 class="font-mono text-sm font-semibold">{g.controller}</h3>
                <span class="flex gap-2">
                  <button type="button" onClick={() => void setGroup(g, true)} class="rounded-xs border border-layer-line px-2 py-1 text-xs text-primary hover:bg-layer-hover">{t('ad.permAllowAll')}</button>
                  <button type="button" onClick={() => void setGroup(g, false)} class="rounded-xs border border-layer-line px-2 py-1 text-xs text-destructive hover:bg-layer-hover">{t('ad.permRevokeAll')}</button>
                </span>
              </header>
              <ul class="divide-y divide-card-divider">
                <For each={g.permissions}>
                  {(p) => (
                    <li class="flex items-center justify-between gap-3 px-4 py-2">
                      <span class="min-w-0">
                        <span class="block truncate text-sm font-medium">{splitPermissionName(p.name).action}</span>
                        <Show when={p.uri}><span class="block truncate font-mono text-xs text-muted-foreground-1">{p.uri}</span></Show>
                      </span>
                      <Switch checked={Boolean(assigned()[p.id])} disabled={Boolean(pending()[p.id])} label={p.name} onChange={(v) => void toggle(p, v)} class="[&_label]:sr-only" />
                    </li>
                  )}
                </For>
              </ul>
            </section>
          )}
        </For>
      </Show>
    </div>
  );
}
