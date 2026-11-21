import type { RouteDefinition } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../lib/crud';

export const route = {
  preload: () => {
    void getRecord('curriculum', '');
  },
} satisfies RouteDefinition;

export default function CurriculumCreateRoute() {
  return <RecordFormPage resource="curriculum" />;
}
