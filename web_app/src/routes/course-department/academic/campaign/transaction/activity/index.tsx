import type { RouteDefinition } from '@solidjs/router';

import { RecordListPage, loadList } from '../../../../../../components/crud/RecordPages';

export const route = {
  preload: ({ location }) => {
    void loadList('activity', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function ActivityListRoute() {
  return <RecordListPage resource="activity" />;
}
