import type { RouteDefinition } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../lib/crud';

export const route = {
  preload: () => {
    void getRecord('teach', '');
  },
} satisfies RouteDefinition;

export default function TeachCreateRoute() {
  return <RecordFormPage resource="teach" />;
}
