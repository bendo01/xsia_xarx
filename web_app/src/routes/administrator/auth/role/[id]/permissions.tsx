import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import PermissionEditor from '../../../../../components/administrator/PermissionEditor';
import { getPermissionEditor } from '../../../../../lib/permission-data';

export const route = {
  preload: ({ params }) => {
    void getPermissionEditor('role', params.id as string);
  },
} satisfies RouteDefinition;

export default function RolePermissionsPage() {
  const params = useParams();
  return <PermissionEditor kind="role" id={params.id as string} titleKey="ad.rolePermissions" hintKey="ad.permissionsBelowApplyToThisRole" backHref="/administrator/auth/role" />;
}
