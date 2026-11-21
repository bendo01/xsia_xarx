import type { RouteDefinition } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../lib/crud';

export const route = {
  preload: () => {
    void getRecord('classCode', '');
  },
} satisfies RouteDefinition;

export default function ClassCodeCreateRoute() {
  return <RecordFormPage resource="classCode" />;
}
