import { Title } from '@solidjs/meta';
import { Errored, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import { adminUrl, type AdminResource } from '../../lib/admin-resources';
import { getAdminForm, saveAdminRow, searchAdminOptions } from '../../lib/admin-crud-data';
import PageHeader from '../student/PageHeader';
import WriteForm from '../rectorat/WriteForm';

/** Create (no id) or edit one record of a registered resource. */
export default function AdminForm(props: { resource: AdminResource; id?: string }) {
  const r = () => props.resource;
  const data = createMemo(() => getAdminForm(r().key, props.id ?? ''));
  const title = () => `${t(props.id ? 'cd.edit' : 'cd.addNew')} · ${t(r().titleKey)}`;
  const initial = () => {
    const rec = data().record;
    return Object.fromEntries(
      r().fields.map((f) => {
        if (f.input === 'check') return [f.name, rec ? rec[f.name] === true : f.name === 'is_active'];
        const v = rec?.[f.name];
        return [f.name, v === null || v === undefined ? '' : String(v).slice(0, f.input === 'date' ? 10 : f.input === 'datetime' ? 16 : undefined)];
      }),
    );
  };
  return (
    <Errored fallback={(err) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(err() as Error).message}</div>}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={title()} />
      {/* Mount the form only once the (possibly pending) query has landed: it seeds its state from it. */}
      <Show when={data()}>
        {(_d) => (
          <WriteForm
            fields={r().fields.map((f) => ({
              name: f.name,
              label: f.label,
              kind: f.input ?? 'text',
              required: f.required,
              source: f.input === 'lookup' ? f.options : undefined,
              options: f.input === 'select' && f.options ? data().options[f.options] : undefined,
            }))}
            initial={initial()}
            labels={data().labels}
            lookup={(source, q) => searchAdminOptions(r().key, source, q)}
            save={(v) => saveAdminRow(r().key, props.id ?? '', v)}
            backHref={adminUrl(r())}
          />
        )}
      </Show>
    </Errored>
  );
}
