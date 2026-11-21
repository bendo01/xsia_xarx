import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { RecordShowPage } from '../../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getRecord('course', params.id as string);
  },
} satisfies RouteDefinition;

export default function CourseShowRoute() {
  const params = useParams();
  return <RecordShowPage resource="course" id={params.id as string} />;
}
