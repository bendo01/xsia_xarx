import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildListPage } from '../../../../../../../../components/crud/RecordPages';
import { getChildren } from '../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChildren('teachDecree', params.id as string, 1);
  },
} satisfies RouteDefinition;

export default function TeachDecreeListRoute() {
  const params = useParams();
  return <ChildListPage resource="teachDecree" parentId={params.id as string} />;
}
