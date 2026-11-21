import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildFormPage } from '../../../../../../../../components/crud/RecordPages';
import { getChild } from '../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChild('curriculumDetail', params.id as string, '');
  },
} satisfies RouteDefinition;

export default function CurriculumDetailCreateRoute() {
  const params = useParams();
  return <ChildFormPage resource="curriculumDetail" parentId={params.id as string} />;
}
