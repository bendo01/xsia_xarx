import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams, useSearchParams } from '@solidjs/router';
import { Errored, createMemo, isPending } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import StudentProfileView from '../../../../../../components/student/StudentProfileView';
import { t } from '../../../../../../i18n';
import { getInstitutionStudentProfile } from '../../../../../../lib/institution-data';

type Query = Record<string, string | string[] | undefined>;

export const route = {
  preload: ({ params }) => {
    void getInstitutionStudentProfile(params.id as string, params.studentId as string);
  },
} satisfies RouteDefinition;

/** A student of the institution: the same profile the student sees (read-only). */
export default function InstitutionStudentDetail() {
  const params = useParams();
  const [search] = useSearchParams();
  const profile = createMemo(() => getInstitutionStudentProfile(params.id as string, params.studentId as string));
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
      <p class="mb-3 text-sm"><a href={`/rectorat/institution/${encodeURIComponent(params.id as string)}/student`} class="text-primary hover:underline">{t('menu.rectorat.studentList')}</a></p>
      <StudentProfileView profile={profile()} search={search as Query} refreshing={refreshing} />
    </Errored>
  );
}
