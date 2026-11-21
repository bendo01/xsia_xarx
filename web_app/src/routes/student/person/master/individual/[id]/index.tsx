import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import StudentProfileView from '../../../../../../components/student/StudentProfileView';
import { t } from '../../../../../../i18n';
import { getStudentProfile } from '../../../../../../lib/student';

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

// One call shape for preload and render: query() keys the cache on the arguments,
// so any difference (even a missing trailing argument) would fetch twice.
type Query = Record<string, string | string[] | undefined>;
const loadProfile = (id: string, q: Query) => getStudentProfile(id, first(q.student_id) ?? '', first(q.code) ?? '');

export const route = {
  preload: ({ params, location }) => {
    void loadProfile(params.id as string, location.query as Query);
  },
} satisfies RouteDefinition;

/** Student home: identity header, student switcher, and overview / biodata / academic tabs. */
export default function StudentHome() {
  const params = useParams();
  const [search] = useSearchParams();
  const profile = createMemo(() => loadProfile(params.id as string, search as Query));
  const refreshing = () => isPending(() => profile());

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('st.failedToLoadStudentProfileFrom')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('menu.student.dashboardProfile')} - ${env.VITE_APP_NAME}`}</Title>
      <StudentProfileView profile={profile()} search={search as Query} refreshing={refreshing} />
    </Errored>
  );
}
