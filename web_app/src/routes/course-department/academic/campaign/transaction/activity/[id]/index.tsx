import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { RecordShowPage } from '../../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getRecord('activity', params.id as string);
  },
} satisfies RouteDefinition;

export default function ActivityShowRoute() {
  const params = useParams();
  return <RecordShowPage resource="activity" id={params.id as string} />;
}
