import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import StudentProfileView from '../../../../../../../components/student/StudentProfileView';
import { t } from '../../../../../../../i18n';
import { getUnitStudentProfile } from '../../../../../../../lib/unit';

type Query = Record<string, string | string[] | undefined>;

export const route = {
  preload: ({ params }) => {
    void getUnitStudentProfile(params.id as string);
  },
} satisfies RouteDefinition;

/** A student of the unit: the same profile the student sees (identity, semesters, advisers, trend). */
export default function UnitStudentDetail() {
  const params = useParams();
  const [search] = useSearchParams();
  const profile = createMemo(() => getUnitStudentProfile(params.id as string));
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
      <Title>{`${profile().individual.name} - ${env.VITE_APP_NAME}`}</Title>
      <p class="mb-3 text-sm"><a href="/course-department/academic/student/master/student" class="text-primary hover:underline">{t('menu.courseDepartment.studentDirectory')}</a></p>
      <StudentProfileView profile={profile()} search={search as Query} refreshing={refreshing} />
    </Errored>
  );
}
