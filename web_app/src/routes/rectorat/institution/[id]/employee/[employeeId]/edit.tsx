import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import { EmployeeFormPage } from '../../../../../../components/rectorat/WritePages';
import { getEmployeeForm } from '../../../../../../lib/institution-write';

export const route = {
  preload: ({ params }) => {
    void getEmployeeForm(params.id as string, params.employeeId as string, '');
  },
} satisfies RouteDefinition;

export default function Page() {
  const params = useParams();
  return <EmployeeFormPage employeeId={params.employeeId as string} />;
}
