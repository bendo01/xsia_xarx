import { Title } from '@solidjs/meta';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { t } from '../../i18n';
import {
  deleteEmployeeRow, deleteStaffRow, getEmployeeForm, getInstitutionRights, getStaffForm, saveEmployeeRow, saveStaffRow,
} from '../../lib/institution-write';
import PageHeader from '../student/PageHeader';
import DeleteRow from './DeleteRow';
import WriteForm from './WriteForm';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';
const field = 'h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm';
const btn = 'h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90';
export const addBtn = 'rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90';

const base = (id: string, kind: 'staff' | 'employee') => `/rectorat/institution/${encodeURIComponent(id)}/${kind}`;

/** Add button, shown only to the positions that may write. */
export function AddButton(props: { kind: 'staff' | 'employee' }) {
  const params = useParams();
  const rights = createMemo(() => getInstitutionRights());
  return (
    <Show when={rights().canManage}>
      <a href={`${base(params.id as string, props.kind)}/create`} class={addBtn}>{t('cd.addNew')}</a>
    </Show>
  );
}

/** Edit + delete links of one row, shown only to the positions that may write. */
export function RowActions(props: { kind: 'staff' | 'employee'; id: string }) {
  const params = useParams();
  const rights = createMemo(() => getInstitutionRights());
  const instId = () => params.id as string;
  return (
    <Show when={rights().canManage}>
      <a href={`${base(instId(), props.kind)}/${encodeURIComponent(props.id)}/edit`} class="text-sm font-medium text-primary hover:underline">{t('cd.edit')}</a>
      <DeleteRow remove={() => (props.kind === 'staff' ? deleteStaffRow(instId(), props.id) : deleteEmployeeRow(instId(), props.id))} />
    </Show>
  );
}

const ErrorBox = (p: { error: unknown }) => <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{(p.error as Error).message}</div>;

/** Create / edit one staff appointment (pick an employee by searching, then the unit and position). */
export function StaffFormPage(props: { staffId?: string }) {
  const params = useParams();
  const [search] = useSearchParams();
  const emp = () => one((search as Query).emp);
  const data = createMemo(() => getStaffForm(params.id as string, props.staffId ?? '', emp()));
  const title = () => t(props.staffId ? 'rt.editStaff' : 'rt.newStaff');
  const back = () => base(params.id as string, 'staff');
  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={title()} />
      <Show when={!props.staffId}>
        <form method="get" class="mb-4 flex flex-wrap items-center gap-2">
          <input type="search" name="emp" value={emp()} placeholder={t('cd.fEmployeeSearch')} class={field} />
          <button type="submit" class={btn}>{t('cd.applyFilters')}</button>
          <span class="text-xs text-muted-foreground-1">{t('cd.employeeSearchHint')}</span>
        </form>
      </Show>
      {/* Mount the form only once the (possibly pending) query has landed: it seeds its state from it. */}
      <Show when={data()}>
        {(_d) => (
        <WriteForm
          fields={[
            { name: 'employee_id', label: 'cd.fEmployee', kind: 'select', required: true, options: data().options.employee_id },
            { name: 'unit_id', label: 'rt.programStudi', kind: 'select', required: true, options: data().options.unit_id },
            { name: 'position_type_id', label: 'cd.fPosition', kind: 'select', options: data().options.position_type_id },
            { name: 'name', label: 'cd.fName', kind: 'text' },
            { name: 'code', label: 'cd.fCode', kind: 'text' },
            { name: 'decree_number', label: 'cd.fDecreeNumber', kind: 'text' },
            { name: 'decree_date', label: 'cd.fDecreeDate', kind: 'date' },
            { name: 'start_date', label: 'cd.fStartDate', kind: 'date' },
            { name: 'end_date', label: 'cd.fEndDate', kind: 'date' },
          ]}
          initial={Object.fromEntries(['employee_id', 'unit_id', 'position_type_id', 'name', 'code', 'decree_number', 'decree_date', 'start_date', 'end_date'].map((k) => [k, String(data().record?.[k] ?? '').slice(0, k.endsWith('date') ? 10 : undefined)]))}
          save={(v) => saveStaffRow(params.id as string, props.staffId ?? '', v)}
          backHref={back()}
        />
        )}
      </Show>
    </Errored>
  );
}

/** Create / edit one employee (link to a person found by name). */
export function EmployeeFormPage(props: { employeeId?: string }) {
  const params = useParams();
  const [search] = useSearchParams();
  const person = () => one((search as Query).person);
  const data = createMemo(() => getEmployeeForm(params.id as string, props.employeeId ?? '', person()));
  const title = () => t(props.employeeId ? 'rt.editEmployee' : 'rt.newEmployee');
  const rec = () => data().record;
  return (
    <Errored fallback={(err) => <ErrorBox error={err()} />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader title={title()} />
      <form method="get" class="mb-4 flex flex-wrap items-center gap-2">
        <input type="search" name="person" value={person()} placeholder={t('rt.searchPerson')} class={field} />
        <button type="submit" class={btn}>{t('cd.applyFilters')}</button>
        <span class="text-xs text-muted-foreground-1">{t('cd.employeeSearchHint')}</span>
      </form>
      {/* Mount the form only once the (possibly pending) query has landed: it seeds its state from it. */}
      <Show when={data()}>
        {(_d) => (
        <WriteForm
          fields={[
            { name: 'individual_id', label: 'rt.person', kind: 'select', required: true, options: data().options.individual_id },
            { name: 'name', label: 'cd.fName', kind: 'text', required: true },
            { name: 'code', label: 'cd.fCode', kind: 'text', required: true },
            { name: 'decree_number', label: 'cd.fDecreeNumber', kind: 'text' },
            { name: 'decree_date', label: 'cd.fDecreeDate', kind: 'date' },
            { name: 'is_active', label: 'rt.active', kind: 'check' },
          ]}
          initial={{
            individual_id: String(rec()?.individual_id ?? ''), name: String(rec()?.name ?? ''), code: String(rec()?.code ?? ''),
            decree_number: String(rec()?.decree_number ?? ''), decree_date: String(rec()?.decree_date ?? '').slice(0, 10),
            is_active: rec() ? rec()?.is_active === true : true,
          }}
          save={(v) => saveEmployeeRow(params.id as string, props.employeeId ?? '', v)}
          backHref={base(params.id as string, 'employee')}
        />
        )}
      </Show>
    </Errored>
  );
}
