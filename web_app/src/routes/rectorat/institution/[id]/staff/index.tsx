import type { RouteDefinition } from '@solidjs/router';

import RecordDirectory, { loadRecords } from '../../../../../components/rectorat/RecordDirectory';
import { AddButton, RowActions } from '../../../../../components/rectorat/WritePages';
import { getInstitutionRights } from '../../../../../lib/institution-write';

export const route = {
  preload: ({ params, location }) => {
    void loadRecords(params.id as string, 'staff', location.query as Record<string, string | undefined>);
    void getInstitutionRights();
  },
} satisfies RouteDefinition;

export default function Page() {
  return (
    <RecordDirectory
      resource="staff"
      titleKey="menu.rectorat.staff"
      actions={<AddButton kind="staff" />}
      rowActions={(r) => <RowActions kind="staff" id={String(r.id)} />}
    />
  );
}
