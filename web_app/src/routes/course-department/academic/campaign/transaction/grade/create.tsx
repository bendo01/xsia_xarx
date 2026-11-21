import type { RouteDefinition } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../lib/crud';

export const route = {
  preload: () => {
    void getRecord('grade', '');
  },
} satisfies RouteDefinition;

export default function GradeCreateRoute() {
  return <RecordFormPage resource="grade" />;
}
