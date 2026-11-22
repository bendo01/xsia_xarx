import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import InstitutionProfile from '../../../../../../components/administrator/InstitutionProfile';
import { getInstitutionProfile } from '../../../../../../lib/institution-profile-data';

export const route = {
  preload: ({ params }) => {
    void getInstitutionProfile(params.id as string);
  },
} satisfies RouteDefinition;

export default function InstitutionProfilePage() {
  const params = useParams();
  return <InstitutionProfile id={params.id as string} />;
}
