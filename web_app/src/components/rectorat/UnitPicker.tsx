import { For, Show } from 'solid-js';

import { t } from '../../i18n';

const field = 'h-9 rounded-xs border border-layer-line bg-layer px-3 text-sm';

/** Plain GET filter form: unit select + search (+ extra selects as children); keeps the URL as state. */
export default function UnitPicker(props: {
  units: { id: string; name: string }[];
  unitId: string;
  q: string;
  children?: any;
  filtered?: boolean;
}) {
  return (
    <form method="get" class="flex flex-wrap items-center gap-2">
      <select name="unit" class={`${field} min-w-0 max-w-full sm:max-w-xs`} aria-label={t('rt.programStudi')}>
        <For each={props.units}>{(u) => <option value={u.id} selected={u.id === props.unitId}>{u.name}</option>}</For>
      </select>
      <input type="search" name="q" value={props.q} placeholder={t('common.search')} class={`${field} min-w-0 flex-1 sm:max-w-sm`} />
      {props.children}
      <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">{t('cd.applyFilters')}</button>
      <Show when={props.filtered}>
        <a href="?" class="text-sm text-primary hover:underline">{t('cd.reset')}</a>
      </Show>
    </form>
  );
}
