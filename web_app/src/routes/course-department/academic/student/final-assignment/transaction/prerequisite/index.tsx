import type { RouteDefinition } from '@solidjs/router';

import FaListPage, { loadFa } from '../../../../../../../components/department/FaListPage';

export const route = {
  preload: ({ location }) => {
    void loadFa('prerequisite', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function FaPrerequisiteRoute() {
  return <FaListPage kind="prerequisite" />;
}
