import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getRecord('classCode', params.id as string);
  },
} satisfies RouteDefinition;

export default function ClassCodeEditRoute() {
  const params = useParams();
  return <RecordFormPage resource="classCode" id={params.id as string} />;
}
