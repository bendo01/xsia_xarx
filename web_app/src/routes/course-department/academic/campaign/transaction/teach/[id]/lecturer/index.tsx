import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildListPage } from '../../../../../../../../components/crud/RecordPages';
import { getChildren } from '../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChildren('teachLecturer', params.id as string, 1);
  },
} satisfies RouteDefinition;

export default function TeachLecturerListRoute() {
  const params = useParams();
  return <ChildListPage resource="teachLecturer" parentId={params.id as string} />;
}
