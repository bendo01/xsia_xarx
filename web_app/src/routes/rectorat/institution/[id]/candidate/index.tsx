import type { RouteDefinition } from '@solidjs/router';

import SimpleList, { loadSimple } from '../../../../../components/rectorat/SimpleList';
import { getInstitutionCandidates } from '../../../../../lib/institution-data';

export const route = {
  preload: ({ params, location }) => {
    void loadSimple(getInstitutionCandidates, params.id as string, location.query as Record<string, string | undefined>);
  },
} satisfies RouteDefinition;

const dash = (v: unknown) => (v === null || v === undefined || v === '' ? '-' : String(v));

/** Prospective students of the institution (read-only). */
export default function Page() {
  return (
    <SimpleList
      titleKey="menu.rectorat.candidateList"
      load={getInstitutionCandidates}
      columns={[
        { label: 'cd.fName', cell: (r) => dash(r.name) },
        { label: 'cd.fCode', cell: (r) => dash(r.code) },
        { label: 'rt.schoolName', cell: (r) => dash(r.school_name) },
      ]}
    />
  );
}
