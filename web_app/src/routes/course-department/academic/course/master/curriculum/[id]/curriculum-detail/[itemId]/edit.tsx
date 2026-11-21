import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildFormPage } from '../../../../../../../../../components/crud/RecordPages';
import { getChild } from '../../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChild('curriculumDetail', params.id as string, params.itemId as string);
  },
} satisfies RouteDefinition;

export default function CurriculumDetailEditRoute() {
  const params = useParams();
  return <ChildFormPage resource="curriculumDetail" parentId={params.id as string} id={params.itemId as string} />;
}
