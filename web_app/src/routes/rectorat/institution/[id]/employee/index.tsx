import type { RouteDefinition } from '@solidjs/router';

import { t } from '../../../../../i18n';
import SimpleList, { loadSimple } from '../../../../../components/rectorat/SimpleList';
import { AddButton, RowActions } from '../../../../../components/rectorat/WritePages';
import { getInstitutionEmployees } from '../../../../../lib/institution-data';
import { getInstitutionRights } from '../../../../../lib/institution-write';

export const route = {
  preload: ({ params, location }) => {
    void loadSimple(getInstitutionEmployees, params.id as string, location.query as Record<string, string | undefined>);
    void getInstitutionRights();
  },
} satisfies RouteDefinition;

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));

/** Employees of the institution (read-only). */
export default function Page() {
  return (
    <SimpleList
      titleKey="menu.rectorat.employees"
      load={getInstitutionEmployees}
      actions={<AddButton kind="employee" />}
      rowActions={(r) => <RowActions kind="employee" id={String(r.id)} />}
      columns={[
        { label: 'cd.fName', cell: (r) => dash(r.name) },
        { label: 'cd.fCode', cell: (r) => dash(r.code) },
        { label: 'cd.fDecree', cell: (r) => dash(r.decree_number) },
        { label: 'cd.status', cell: (r) => (r.is_active ? t('rt.active') : '-') },
      ]}
    />
  );
}
