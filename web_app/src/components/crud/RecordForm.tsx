import { revalidate, useNavigate } from '@solidjs/router';
import { For, Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { t } from '../../i18n';
import { crudErrorText } from '../../lib/crud-errors';
import { saveChildRow, saveRow } from '../../lib/crud';
import { BASE, FORMS, childBase, isChild, toFormValues, type FormFieldDef } from '../../lib/crud-forms';
import { parseResource, type FieldError, type ResourceKey } from '../../lib/crud-schema';
import type { Option } from '../../server/crud';

type Values = Record<string, string | boolean>;
const ERR_KEY: Record<FieldError, string> = {
  required: 'cd.errRequired',
  invalid: 'cd.errInvalid',
  tooShort: 'cd.errTooShort',
  tooLong: 'cd.errTooLong',
  range: 'cd.errRange',
  dateOrder: 'cd.errDateOrder',
  timeOrder: 'cd.errTimeOrder',
};
const control = 'h-9 w-full rounded-xs border border-input bg-card px-3 text-sm aria-[invalid=true]:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
const CREDITS = ['lecture_credit', 'practice_credit', 'field_practice_credit', 'simulation_credit'];

/**
 * One form for a course, curriculum or class code (create when `id` is empty). Values are checked
 * with the same schema the server uses; the server's answer has the last word.
 */
export default function RecordForm(props: {
  resource: ResourceKey;
  id?: string;
  /** Course / curriculum a child record belongs to. */
  parentId?: string;
  record: Record<string, any> | null;
  options: Record<string, Option[]>;
}) {
  const navigate = useNavigate();
  const [values, setValues] = createSignal<Values>(toFormValues(props.resource, props.record));
  const [errors, setErrors] = createSignal<Record<string, FieldError>>({});
  const [busy, setBusy] = createSignal(false);
  // Course total credit follows the four credit parts until the user types a total themselves.
  const [manualTotal, setManualTotal] = createSignal(false);

  const set = (name: string, v: string | boolean) => {
    setValues((cur) => {
      const next = { ...cur, [name]: v };
      if (props.resource === 'course' && !manualTotal()) {
        if (CREDITS.includes(name)) next.total_credit = String(CREDITS.reduce((s, c) => s + (Number(String(next[c]).replace(',', '.')) || 0), 0));
        if (name === 'practice_credit' && Number(v) > 0) next.has_practice = true;
      }
      return next;
    });
    if (name === 'total_credit') setManualTotal(true);
    setErrors((e) => {
      const { [name]: _drop, ...rest } = e;
      return rest;
    });
  };

  const submit = async (ev: Event) => {
    ev.preventDefault();
    const local = parseResource(props.resource, values());
    if (!local.ok) return void setErrors(local.errors);
    setBusy(true);
    try {
      const key = props.resource;
      const res = isChild(key) ? await saveChildRow(key, props.parentId ?? '', props.id ?? '', values()) : await saveRow(key, props.id ?? '', values());
      if (!res.ok) return void setErrors(res.errors);
      toast.success(t('cd.recordSaved'));
      await revalidate();
      navigate(isChild(key) ? childBase(key, props.parentId ?? '') : `${BASE[key]}/${encodeURIComponent(res.id)}`);
    } catch (e) {
      toast.error(crudErrorText(e, 'cd.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  const cancelHref = () => {
    const key = props.resource;
    if (isChild(key)) return childBase(key, props.parentId ?? '');
    return props.id ? `${BASE[key]}/${encodeURIComponent(props.id)}` : BASE[key];
  };

  const Field = (p: { def: FormFieldDef }) => {
    const id = `f-${p.def.name}`;
    const err = () => errors()[p.def.name];
    const val = () => values()[p.def.name];
    return (
      <div class={p.def.widget === 'check' ? 'flex items-center gap-2 sm:col-span-1' : 'space-y-1'}>
        <Show
          when={p.def.widget !== 'check'}
          fallback={
            <>
              <input id={id} type="checkbox" checked={val() === true} onChange={(e) => set(p.def.name, e.currentTarget.checked)} class="size-4 rounded-xs border-input" />
              <label for={id} class="text-sm">{t(p.def.label)}</label>
            </>
          }
        >
          <label for={id} class="block text-sm font-medium">
            {t(p.def.label)}
            <Show when={p.def.required}><span class="text-destructive"> *</span></Show>
          </label>
          <Show
            when={p.def.widget === 'select'}
            fallback={
              <Show
                when={p.def.widget === 'textarea'}
                fallback={
              <input
                id={id}
                name={p.def.name}
                type={p.def.widget === 'date' ? 'date' : p.def.widget === 'time' ? 'time' : p.def.widget === 'text' ? 'text' : 'number'}
                step={p.def.widget === 'number' ? (p.def.step ?? '0.5') : p.def.widget === 'int' ? '1' : undefined}
                min={p.def.widget === 'number' || p.def.widget === 'int' ? '0' : undefined}
                value={String(val() ?? '')}
                onInput={(e) => set(p.def.name, e.currentTarget.value)}
                aria-invalid={err() ? 'true' : 'false'}
                class={control}
              />
                }
              >
                <textarea id={id} name={p.def.name} rows="4" value={String(val() ?? '')} onInput={(e) => set(p.def.name, e.currentTarget.value)} aria-invalid={err() ? 'true' : 'false'} class={`${control} h-auto py-2`} />
              </Show>
            }
          >
            <select id={id} name={p.def.name} onChange={(e) => set(p.def.name, e.currentTarget.value)} aria-invalid={err() ? 'true' : 'false'} class={control}>
              <option value="" selected={!val()}>{t('cd.selectOne')}</option>
              <For each={props.options[p.def.name] ?? []}>{(o) => <option value={o.id} selected={val() === o.id}>{o.name}</option>}</For>
            </select>
          </Show>
        </Show>
        <Show when={err()}>{(e) => <p class="text-xs text-destructive" role="alert">{t(ERR_KEY[e()])}</p>}</Show>
      </div>
    );
  };

  return (
    <form onSubmit={submit} class="space-y-6" novalidate>
      <div class="grid grid-cols-1 gap-4 rounded-xs border border-card-line bg-card p-5 shadow-2xs sm:grid-cols-2">
        <For each={FORMS[props.resource]}>{(def) => <Field def={def} />}</For>
      </div>
      <div class="flex flex-wrap gap-2">
        <button type="submit" disabled={busy()} class="rounded-xs bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
          {busy() ? t('cd.saving') : t('cd.save')}
        </button>
        <a href={cancelHref()} class="rounded-xs border border-layer-line bg-layer px-4 py-2 text-sm hover:bg-layer-hover">{t('cd.cancel')}</a>
      </div>
    </form>
  );
}
