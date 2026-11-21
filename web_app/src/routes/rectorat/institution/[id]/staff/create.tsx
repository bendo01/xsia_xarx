import type { RouteDefinition } from '@solidjs/router';

import { StaffFormPage } from '../../../../../components/rectorat/WritePages';
import { getStaffForm } from '../../../../../lib/institution-write';

export const route = {
  preload: ({ params }) => {
    void getStaffForm(params.id as string, '', '');
  },
} satisfies RouteDefinition;

export default function Page() {
  return <StaffFormPage />;
}
