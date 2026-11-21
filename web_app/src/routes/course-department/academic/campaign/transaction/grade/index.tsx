import type { RouteDefinition } from '@solidjs/router';

import { RecordListPage, loadList } from '../../../../../../components/crud/RecordPages';

export const route = {
  preload: ({ location }) => {
    void loadList('grade', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function GradeListRoute() {
  return <RecordListPage resource="grade" />;
}
