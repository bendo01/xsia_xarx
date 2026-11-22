import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import PermissionEditor from '../../../../../../components/administrator/PermissionEditor';
import { getPermissionEditor } from '../../../../../../lib/permission-data';

export const route = {
  preload: ({ params }) => {
    void getPermissionEditor('position-type', params.id as string);
  },
} satisfies RouteDefinition;

export default function PositionTypePermissionsPage() {
  const params = useParams();
  return <PermissionEditor kind="position-type" id={params.id as string} titleKey="ad.positionTypePermissions" hintKey="ad.permissionsBelowApplyToEveryRole" backHref="/administrator/institution/reference/position-type" />;
}
