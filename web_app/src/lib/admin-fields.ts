// Types and field builders of the administrator registry (see admin-resources.ts).
import type { FieldSpec } from './crud-schema';

/** A key of OPTION_SOURCES, or the key of another registered resource whose list gives the options. */
export type OptionSource = string;

export interface AdminField extends FieldSpec {
  /** i18n key of the label. */
  label: string;
  input?: 'text' | 'date' | 'datetime' | 'select' | 'lookup' | 'check';
  options?: OptionSource;
}

export interface AdminColumn {
  label: string;
  field: string;
}

export interface AdminResource {
  key: string;
  /** URL path under /administrator (no leading slash). */
  path: string;
  /** API list endpoint. */
  api: string;
  titleKey: string;
  /** Menu heading, outermost first (i18n keys). */
  group?: string[];
  columns: AdminColumn[];
  fields: AdminField[];
  /** Hide create/edit/delete (read-only resources). */
  readOnly?: boolean;
  /** Editable, but records cannot be created here (the API needs data this form must not collect, such as a password). */
  noCreate?: boolean;
  /** `noCreate`, but `<path>/create` is a route of its own (so the list still offers the Add button). */
  customCreate?: boolean;
  /** Records of this resource hold permissions that can be edited on `<path>/<id>/permissions`. */
  permissionOwner?: 'role' | 'position-type';
  /** Records have a richer page at `<path>/<id>/profile`. */
  hasProfile?: boolean;
  /** Extra buttons in the list header: `<path>/<segment>` pages with their own route. */
  extraLinks?: { segment: string; label: string }[];
}

/** `week_quantity` -> `ad.weekQuantity`; a trailing `_id` is dropped (`unit_id` -> `ad.unit`). */
export const labelKey = (name: string): string =>
  `ad.${name.replace(/_id$/, '').replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase())}`;

export const text = (name: string, label = labelKey(name), over: Partial<AdminField> = {}): AdminField => ({ name, label, kind: 'text', input: 'text', ...over });
export const select = (name: string, label: string, options: OptionSource, over: Partial<AdminField> = {}): AdminField => ({ name, label, kind: 'uuid', input: 'select', options, ...over });
export const date = (name: string, label = labelKey(name)): AdminField => ({ name, label, kind: 'date', input: 'date' });
export const check = (name: string, label = labelKey(name)): AdminField => ({ name, label, kind: 'bool', input: 'check' });

// Short builders for the generated labels: required fields pass `true`.
export const str = (name: string, req = false, max = 200): AdminField => text(name, labelKey(name), { required: req, max });
export const num = (name: string, req = false, min = 0, max = 1_000_000): AdminField => ({ name, label: labelKey(name), kind: 'number', input: 'text', required: req, min, max });
export const int = (name: string, req = false, min = 0, max = 1_000_000): AdminField => ({ name, label: labelKey(name), kind: 'int', input: 'text', required: req, min, max });
export const day = (name: string, req = false): AdminField => ({ name, label: labelKey(name), kind: 'date', input: 'date', required: req });
export const clock = (name: string, req = false): AdminField => ({ name, label: labelKey(name), kind: 'time', input: 'text', required: req });
export const stamp = (name: string, req = false): AdminField => ({ name, label: labelKey(name), kind: 'datetime', input: 'datetime', required: req });
/** A foreign key to a small table: a select over `source`. */
export const fk = (name: string, source: OptionSource, req = false): AdminField => select(name, labelKey(name), source, { required: req });
/** A foreign key to a big table (students, courses...): a search box that fills a select. */
export const pick = (name: string, source: OptionSource, req = false): AdminField => ({ name, label: labelKey(name), kind: 'uuid', input: 'lookup', options: source, required: req });
/** A foreign key to a table that is not registered: the id as text. */
export const uid = (name: string, req = false): AdminField => ({ name, label: labelKey(name), kind: 'uuid', input: 'text', required: req });
export const flag = (name: string): AdminField => check(name, labelKey(name));

export interface RefOpts {
  /** 'required' (default), 'optional' or 'none' for the alphabet code column. */
  alphabet?: 'required' | 'optional' | 'none';
  /** The integer code is nullable in the model. */
  codeOptional?: boolean;
  /** Replaces the default name field(s). */
  name?: AdminField[];
  extra?: AdminField[];
  columns?: AdminColumn[];
  group?: string[];
}

/** The reference tables share one shape: an integer code, an alphabet code and a name. */
export const reference = (key: string, path: string, api: string, titleKey: string, o: RefOpts = {}): AdminResource => {
  const alphabet = o.alphabet ?? 'required';
  const fields: AdminField[] = [
    { name: 'code', label: 'ad.code2', kind: 'int', input: 'text', required: !o.codeOptional, min: 0, max: 99999 },
    ...(alphabet === 'none' ? [] : [text('alphabet_code', 'ad.alphabetCode', { required: alphabet === 'required', max: 20 })]),
    ...(o.name ?? [text('name', 'ad.name', { required: true, max: 200 })]),
    ...(o.extra ?? []),
  ];
  return {
    key,
    path,
    api,
    titleKey,
    group: o.group,
    columns: o.columns ?? [{ label: 'ad.code2', field: 'code' }, ...(alphabet === 'none' ? [] : [{ label: 'ad.alphabetCode', field: 'alphabet_code' }]), { label: 'ad.name', field: 'name' }],
    fields,
  };
};

