import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildFormPage } from '../../../../../../../../components/crud/RecordPages';
import { getChild } from '../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChild('teachEvaluation', params.id as string, '');
  },
} satisfies RouteDefinition;

export default function TeachEvaluationCreateRoute() {
  const params = useParams();
  return <ChildFormPage resource="teachEvaluation" parentId={params.id as string} />;
}
