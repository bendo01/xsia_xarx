import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { RecordShowPage } from '../../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getRecord('curriculum', params.id as string);
  },
} satisfies RouteDefinition;

export default function CurriculumShowRoute() {
  const params = useParams();
  return <RecordShowPage resource="curriculum" id={params.id as string} />;
}
