import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { RecordShowPage } from '../../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getRecord('grade', params.id as string);
  },
} satisfies RouteDefinition;

export default function GradeShowRoute() {
  const params = useParams();
  return <RecordShowPage resource="grade" id={params.id as string} />;
}
