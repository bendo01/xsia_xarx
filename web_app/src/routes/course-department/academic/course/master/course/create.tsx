import type { RouteDefinition } from '@solidjs/router';

import { RecordFormPage } from '../../../../../../components/crud/RecordPages';
import { getRecord } from '../../../../../../lib/crud';

export const route = {
  preload: () => {
    void getRecord('course', '');
  },
} satisfies RouteDefinition;

export default function CourseCreateRoute() {
  return <RecordFormPage resource="course" />;
}
