import type { RouteDefinition } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../lib/crud';

export const route = {
  preload: () => {
    void getRecord('activity', '');
  },
} satisfies RouteDefinition;

export default function ActivityCreateRoute() {
  return <RecordFormPage resource="activity" />;
}
