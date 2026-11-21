import type { RouteDefinition } from '@solidjs/router';

import { EmployeeFormPage } from '../../../../../components/rectorat/WritePages';
import { getEmployeeForm } from '../../../../../lib/institution-write';

export const route = {
  preload: ({ params }) => {
    void getEmployeeForm(params.id as string, '', '');
  },
} satisfies RouteDefinition;

export default function Page() {
  return <EmployeeFormPage />;
}
