import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getRecord('curriculum', params.id as string);
  },
} satisfies RouteDefinition;

export default function CurriculumEditRoute() {
  const params = useParams();
  return <RecordFormPage resource="curriculum" id={params.id as string} />;
}
