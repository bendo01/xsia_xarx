import type { RouteDefinition } from '@solidjs/router';

import FaListPage, { loadFa } from '../../../../../../components/department/FaListPage';

export const route = {
  preload: ({ location }) => {
    void loadFa('adviserDecree', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function FaAdviserdecreeRoute() {
  return <FaListPage kind="adviserDecree" />;
}
