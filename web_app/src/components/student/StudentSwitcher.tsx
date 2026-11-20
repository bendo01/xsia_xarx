import { For, Show } from 'solid-js';

import { t } from '../../i18n';
import type { StudentItem } from '../../lib/student-types';
import { withParams } from '../../lib/url';

const unitName = (s: StudentItem) => s.unit?.name ?? s.unit_name ?? '-';

/**
 * An individual can hold several student identities (several programmes).
 * Choosing one is a link that sets ?student_id= (and resets paging), so the
 * choice survives reloads and can be shared.
 */
export default function StudentSwitcher(props: {
  students: StudentItem[];
  selectedId: string | undefined;
  search: Record<string, string | string[] | undefined>;
}) {
  return (
    <Show when={props.students.length > 1}>
      <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs">
        <p class="mb-2 text-xs font-medium uppercase text-muted-foreground-1">{t('st.pilihProfilMahasiswaAktif')}</p>
        <div class="flex flex-wrap gap-2">
          <For each={props.students}>
            {(s) => (
              <a
                href={withParams(props.search, { student_id: s.id, code: null, page: null })}
                aria-current={s.id === props.selectedId ? 'true' : undefined}
                class={[
                  'rounded-xs border px-3 py-1.5 text-sm focus:outline-hidden',
                  s.id === props.selectedId
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-layer-line bg-layer text-layer-foreground hover:bg-layer-hover',
                ]}
              >
                {s.code} · {unitName(s)}
              </a>
            )}
          </For>
        </div>
      </div>
    </Show>
  );
}
