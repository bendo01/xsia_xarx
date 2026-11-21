import type { RouteDefinition } from '@solidjs/router';

import { RecordListPage, loadList } from '../../../../../../components/crud/RecordPages';

export const route = {
  preload: ({ location }) => {
    void loadList('course', location.query as Record<string, string | string[] | undefined>);
  },
} satisfies RouteDefinition;

export default function CourseListRoute() {
  return <RecordListPage resource="course" />;
}
