import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { ChildFormPage } from '../../../../../../../../components/crud/RecordPages';
import { getChild } from '../../../../../../../../lib/crud';

export const route = {
  preload: ({ params }) => {
    void getChild('teachLecturer', params.id as string, '');
  },
} satisfies RouteDefinition;

export default function TeachLecturerCreateRoute() {
  const params = useParams();
  return <ChildFormPage resource="teachLecturer" parentId={params.id as string} />;
}
