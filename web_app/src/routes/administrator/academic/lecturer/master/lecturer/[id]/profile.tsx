import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';

import LecturerProfile from '../../../../../../../components/administrator/LecturerProfile';
import { getLecturerProfile } from '../../../../../../../lib/lecturer-profile-data';

export const route = {
  preload: ({ params }) => {
    void getLecturerProfile(params.id as string);
  },
} satisfies RouteDefinition;

export default function LecturerProfilePage() {
  const params = useParams();
  return <LecturerProfile id={params.id as string} />;
}
