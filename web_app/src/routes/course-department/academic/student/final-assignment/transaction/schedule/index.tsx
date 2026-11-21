import type { RouteDefinition } from '@solidjs/router';

import FaListPage, { loadFa } from '../../../../../../../components/department/FaListPage';

export const route = {
  preload: ({ location }) => {
    void loadFa('schedule', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function FaScheduleRoute() {
  return <FaListPage kind="schedule" />;
}
