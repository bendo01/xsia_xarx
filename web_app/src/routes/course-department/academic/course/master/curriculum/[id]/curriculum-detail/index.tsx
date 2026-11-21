import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildListPage } from '../../../../../../../../components/crud/RecordPages';
import { getChildren } from '../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChildren('curriculumDetail', params.id as string, 1);
  },
} satisfies RouteDefinition;

export default function CurriculumDetailListRoute() {
  const params = useParams();
  return <ChildListPage resource="curriculumDetail" parentId={params.id as string} />;
}
