// Registry of the administrator's master/reference CRUD pages. One entry drives the list, the
// create/edit form and the server calls, so porting an area of the old client is data, not pages.
// Pure (no server imports): shared by the routes, the menu and the server.
import { parseForm, type FieldSpec, type ParseResult, type Raw } from './crud-schema';

/** Where a select field gets its options (a list endpoint). */
export const OPTION_SOURCES = {
  variety: 'institution/reference/varieties',
  category: 'institution/reference/categories',
  unit_type: 'institution/reference/unit-types',
  position_type: 'institution/reference/position-type',
  institution: 'institution/master/institutions',
  unit: 'institution/master/units',
  country: 'countries',
  academic_year: 'academic/general/reference/academic-years',
  education: 'educations',
} as const;
export type OptionSource = keyof typeof OPTION_SOURCES;

export interface AdminField extends FieldSpec {
  /** i18n key of the label. */
  label: string;
  input?: 'text' | 'date' | 'select' | 'check';
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
  columns: AdminColumn[];
  fields: AdminField[];
  /** Hide create/edit/delete (read-only resources). */
  readOnly?: boolean;
}


const text = (name: string, label: string, over: Partial<AdminField> = {}): AdminField => ({ name, label, kind: 'text', input: 'text', ...over });
const select = (name: string, label: string, options: OptionSource, over: Partial<AdminField> = {}): AdminField => ({ name, label, kind: 'uuid', input: 'select', options, ...over });
const date = (name: string, label: string): AdminField => ({ name, label, kind: 'date', input: 'date' });
const check = (name: string, label: string): AdminField => ({ name, label, kind: 'bool', input: 'check' });

/** The reference tables share one shape: an integer code, an alphabet code and a name. */
const reference = (key: string, path: string, api: string, titleKey: string): AdminResource => ({
  key,
  path,
  api,
  titleKey,
  columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.alphabetCode', field: 'alphabet_code' }, { label: 'ad.name', field: 'name' }],
  fields: [
    { name: 'code', label: 'ad.code2', kind: 'int', input: 'text', required: true, min: 0, max: 9999 },
    text('alphabet_code', 'ad.alphabetCode', { required: true, max: 20 }),
    text('name', 'ad.name', { required: true, max: 200 }),
  ],
});

export const ADMIN_RESOURCES: AdminResource[] = [
  {
    key: 'institution',
    path: 'institution/master/institution',
    api: 'institution/master/institutions',
    titleKey: 'ad.institutions',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.alphabetCode', field: 'alphabet_code' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      text('name', 'ad.name', { required: true, max: 200 }),
      text('code', 'ad.code2', { required: true, max: 50 }),
      text('alphabet_code', 'ad.alphabetCodeAcronym', { max: 50 }),
      check('is_active', 'ad.operationalStatus'),
      select('variety_id', 'ad.variety', 'variety', { required: true }),
      select('category_id', 'ad.category', 'category', { required: true }),
      select('country_id', 'ad.country', 'country', { required: true }),
      select('parent_id', 'ad.parentInstitutionOptional', 'institution'),
      select('academic_year_id', 'ad.academicYear', 'academic_year'),
      { name: 'feeder_id', label: 'ad.feederID', kind: 'uuid', input: 'text' },
    ],
  },
  {
    key: 'unit',
    path: 'institution/master/unit',
    api: 'institution/master/units',
    titleKey: 'ad.units',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      text('name', 'ad.name', { required: true, max: 200 }),
      text('code', 'ad.code2', { required: true, max: 50 }),
      check('is_active', 'ad.operationalStatus'),
      select('institution_id', 'ad.institution', 'institution', { required: true }),
      select('unit_type_id', 'ad.unitType', 'unit_type', { required: true }),
      select('education_id', 'ad.education', 'education', { required: true }),
      select('parent_id', 'ad.unit', 'unit'),
      { name: 'feeder_id', label: 'ad.feederID', kind: 'uuid', input: 'text' },
    ],
  },
  {
    key: 'employee',
    path: 'institution/master/employee',
    api: 'institution/master/employees',
    titleKey: 'ad.employees',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.active', field: 'is_active' }],
    fields: [
      text('name', 'ad.name', { required: true, max: 200 }),
      text('code', 'ad.code2', { required: true, max: 50 }),
      select('institution_id', 'ad.institution', 'institution', { required: true }),
      { name: 'individual_id', label: 'rt.person', kind: 'uuid', input: 'text', required: true },
      text('decree_number', 'cd.fDecreeNumber', { max: 100 }),
      date('decree_date', 'cd.fDecreeDate'),
      check('is_active', 'ad.active'),
    ],
  },
  {
    key: 'staff',
    path: 'institution/master/staff',
    api: 'institution/master/staffes',
    titleKey: 'ad.staff',
    columns: [{ label: 'ad.code2', field: 'code' }, { label: 'ad.name', field: 'name' }, { label: 'ad.startDate', field: 'start_date' }, { label: 'ad.endDate', field: 'end_date' }],
    fields: [
      { name: 'employee_id', label: 'ad.employee', kind: 'uuid', input: 'text', required: true },
      select('unit_id', 'ad.unit', 'unit', { required: true }),
      select('position_type_id', 'ad.positionType', 'position_type'),
      text('name', 'ad.name', { max: 200 }),
      text('code', 'ad.code2', { max: 50 }),
      text('decree_number', 'cd.fDecreeNumber', { max: 100 }),
      date('decree_date', 'cd.fDecreeDate'),
      date('start_date', 'cd.fStartDate'),
      date('end_date', 'cd.fEndDate'),
    ],
  },
  reference('category', 'institution/reference/category', 'institution/reference/categories', 'ad.category'),
  reference('variety', 'institution/reference/variety', 'institution/reference/varieties', 'ad.variety'),
  reference('unit-type', 'institution/reference/unit-type', 'institution/reference/unit-types', 'ad.unitType'),
  reference('position-type', 'institution/reference/position-type', 'institution/reference/position-type', 'ad.positionType'),
];

export type AdminView = { resource: AdminResource; view: 'list' } | { resource: AdminResource; view: 'create' } | { resource: AdminResource; view: 'edit'; id: string };

export function findAdminResourceByKey(key: string): AdminResource | undefined {
  return ADMIN_RESOURCES.find((r) => r.key === key);
}

/** Map the URL under /administrator (`institution/master/unit`, `.../create`, `.../<id>/edit`) to a resource and view. */
export function matchAdminPath(path: string): AdminView | null {
  const parts = path.split('/').filter(Boolean);
  for (const resource of ADMIN_RESOURCES) {
    const base = resource.path.split('/');
    if (parts.length < base.length || !base.every((s, i) => parts[i] === s)) continue;
    const rest = parts.slice(base.length);
    if (rest.length === 0) return { resource, view: 'list' };
    if (resource.readOnly) return null;
    if (rest.length === 1 && rest[0] === 'create') return { resource, view: 'create' };
    if (rest.length === 2 && rest[1] === 'edit') return { resource, view: 'edit', id: rest[0] };
  }
  return null;
}

export const adminUrl = (r: AdminResource, ...rest: string[]) => `/administrator/${[r.path, ...rest].join('/')}`;

export const parseAdminForm = (r: AdminResource, input: Raw): ParseResult => parseForm(r.fields, input);
