import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import IndividualProfile from '../../../../../../components/administrator/IndividualProfile';
import { getIndividualProfile } from '../../../../../../lib/individual-data';

export const route = {
  preload: ({ params }) => {
    void getIndividualProfile(params.id as string);
  },
} satisfies RouteDefinition;

export default function IndividualProfilePage() {
  const params = useParams();
  return <IndividualProfile id={params.id as string} />;
}
