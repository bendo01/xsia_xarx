import type { RouteDefinition } from '@solidjs/router';

import FaListPage, { loadFa } from '../../../../../../../components/department/FaListPage';

export const route = {
  preload: ({ location }) => {
    void loadFa('adviser', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function FaAdviserRoute() {
  return <FaListPage kind="adviser" />;
}
