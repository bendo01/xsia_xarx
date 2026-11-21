import type { RouteDefinition } from '@solidjs/router';

import RecordDirectory, { loadRecords } from '../../../../../components/rectorat/RecordDirectory';

export const route = {
  preload: ({ params, location }) => {
    void loadRecords(params.id as string, 'curriculum', location.query as Record<string, string | undefined>);
  },
} satisfies RouteDefinition;

export default function Page() {
  return <RecordDirectory resource="curriculum" titleKey="menu.rectorat.curriculumList" />;
}
