import { revalidate, useNavigate } from '@solidjs/router';
import { For, Show, createSignal, onCleanup } from 'solid-js';
import { toast } from 'solid-sonner';

import { t } from '../../i18n';
import { crudErrorText } from '../../lib/crud-errors';
import type { FieldError } from '../../lib/crud-schema';
import type { WriteResult } from '../../lib/institution-write';

export interface WriteField {
  name: string;
  label: string;
  kind: 'text' | 'date' | 'datetime' | 'select' | 'lookup' | 'check';
  /** lookup: the option source searched by the form's `lookup` function. */
  source?: string;
  required?: boolean;
  options?: { id: string; name: string }[];
}

type Values = Record<string, string | boolean>;
const ERR: Record<FieldError, string> = {
  required: 'cd.errRequired',
  invalid: 'cd.errInvalid',
  tooLong: 'cd.errTooLong',
  range: 'cd.errRange',
  dateOrder: 'cd.errDateOrder',
  timeOrder: 'cd.errTimeOrder',
};
const control = 'h-9 w-full rounded-xs border border-input bg-card px-3 text-sm aria-[invalid=true]:border-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

type Opt = { id: string; name: string };

/** A search box that fills a select with the matches; the chosen option stays listed whatever the next search returns. */
function Lookup(props: { id: string; name: string; value: string; label?: string; invalid: boolean; search: (q: string) => Promise<Opt[]>; onChange: (v: string) => void }) {
  const [found, setFound] = createSignal<Opt[]>([]);
  const [chosen, setChosen] = createSignal<Opt | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(timer));
  // The selected option: the one picked from the results, else the saved id with its label (edit).
  const current = (): Opt | null => (props.value ? (chosen()?.id === props.value ? chosen() : { id: props.value, name: props.label || props.value }) : null);
  const options = () => {
    const c = current();
    return [...(c ? [c] : []), ...found().filter((o) => o.id !== c?.id)];
  };
  const find = (q: string) => {
    clearTimeout(timer);
    if (!q.trim()) return;
    timer = setTimeout(async () => {
      try {
        setFound(await props.search(q.trim()));
      } catch {
        /* keep the current options; the server's answer on save has the last word */
      }
    }, 300);
  };
  const pickValue = (v: string) => {
    setChosen(found().find((o) => o.id === v) ?? chosen());
    props.onChange(v);
  };
  return (
    <div class="space-y-1">
      <input type="search" placeholder={t('common.search')} onInput={(e) => find(e.currentTarget.value)} class={control} />
      <select id={props.id} name={props.name} value={props.value} onChange={(e) => pickValue(e.currentTarget.value)} aria-invalid={props.invalid ? 'true' : 'false'} class={control}>
        <option value="">{t('cd.selectOne')}</option>
        <For each={options()}>{(o) => <option value={o.id} selected={props.value === o.id}>{o.name}</option>}</For>
      </select>
    </div>
  );
}

/** A small controlled form for the rectorat's writes; the server's answer has the last word. */
export default function WriteForm(props: {
  fields: WriteField[];
  initial: Values;
  save: (values: Values) => Promise<WriteResult>;
  backHref: string;
  /** Searches the option source of a `lookup` field. */
  lookup?: (source: string, q: string) => Promise<Opt[]>;
  /** Labels of the ids already chosen in a `lookup` field (edit). */
  labels?: Record<string, string>;
  /** Where to go after saving (default: back to the list). */
  children?: any;
}) {
  const navigate = useNavigate();
  const [values, setValues] = createSignal<Values>(props.initial);
  const [errors, setErrors] = createSignal<Record<string, FieldError>>({});
  const [busy, setBusy] = createSignal(false);

  const set = (name: string, v: string | boolean) => {
    setValues((cur) => ({ ...cur, [name]: v }));
    setErrors((e) => {
      const { [name]: _drop, ...rest } = e;
      return rest;
    });
  };

  const submit = async (ev: Event) => {
    ev.preventDefault();
    setBusy(true);
    try {
      const res = await props.save(values());
      if (!res.ok) return void setErrors(res.errors);
      toast.success(t('cd.recordSaved'));
      await revalidate();
      navigate(props.backHref);
    } catch (e) {
      toast.error(crudErrorText(e, 'cd.saveFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={(e) => void submit(e)} class="space-y-4 rounded-xs border border-card-line bg-card p-4 shadow-2xs">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <For each={props.fields}>
          {(f) => {
            const id = `f-${f.name}`;
            const err = () => errors()[f.name];
            return (
              <div class={f.kind === 'check' ? 'flex items-center gap-2' : 'min-w-0 space-y-1'}>
                <Show
                  when={f.kind !== 'check'}
                  fallback={
                    <>
                      <input id={id} type="checkbox" checked={values()[f.name] === true} onChange={(e) => set(f.name, e.currentTarget.checked)} class="size-4 rounded-xs border-input" />
                      <label for={id} class="text-sm">{t(f.label)}</label>
                    </>
                  }
                >
                  <label for={id} class="block text-sm font-medium">
                    {t(f.label)}
                    <Show when={f.required}><span class="text-destructive"> *</span></Show>
                  </label>
                  <Show when={f.kind === 'lookup'} fallback={
                  <Show
                    when={f.kind === 'select'}
                    fallback={
                      <input id={id} name={f.name} type={f.kind === 'date' ? 'date' : f.kind === 'datetime' ? 'datetime-local' : 'text'} value={String(values()[f.name] ?? '')} onInput={(e) => set(f.name, e.currentTarget.value)} aria-invalid={err() ? 'true' : 'false'} class={control} />
                    }
                  >
                    <select id={id} name={f.name} value={String(values()[f.name] ?? '')} onChange={(e) => set(f.name, e.currentTarget.value)} aria-invalid={err() ? 'true' : 'false'} class={control}>
                      <option value="">{t('cd.selectOne')}</option>
                      <For each={f.options ?? []}>{(o) => <option value={o.id} selected={values()[f.name] === o.id}>{o.name}</option>}</For>
                    </select>
                  </Show>
                  }>
                    <Lookup id={id} name={f.name} value={String(values()[f.name] ?? '')} label={props.labels?.[f.name]} invalid={!!err()} search={(q) => (props.lookup ? props.lookup(f.source ?? '', q) : Promise.resolve([]))} onChange={(v) => set(f.name, v)} />
                  </Show>
                  <Show when={err()}><p class="text-xs text-destructive">{t(ERR[err() as FieldError])}</p></Show>
                </Show>
              </div>
            );
          }}
        </For>
      </div>
      <div class="flex items-center gap-2">
        <button type="submit" disabled={busy()} class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{t('cd.save')}</button>
        <a href={props.backHref} class="text-sm text-primary hover:underline">{t('cd.cancel')}</a>
      </div>
    </form>
  );
}
