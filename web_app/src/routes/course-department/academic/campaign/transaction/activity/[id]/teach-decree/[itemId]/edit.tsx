import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildFormPage } from '../../../../../../../../../components/crud/RecordPages';
import { getChild } from '../../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChild('teachDecree', params.id as string, params.itemId as string);
  },
} satisfies RouteDefinition;

export default function TeachDecreeEditRoute() {
  const params = useParams();
  return <ChildFormPage resource="teachDecree" parentId={params.id as string} id={params.itemId as string} />;
}
