import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import ActivityError from '../../../../../../../components/student/ActivityError';
import PageHeader from '../../../../../../../components/student/PageHeader';
import ActivityCourses from '../../../../../../../components/student/ActivityCourses';
import PrintLink from '../../../../../../../components/student/PrintLink';
import { t } from '../../../../../../../i18n';
import { getActivityDetail } from '../../../../../../../lib/enrollment';

export const route = {
  preload: ({ params }) => {
    void getActivityDetail(params.id as string);
  },
} satisfies RouteDefinition;

/** One semester: the courses on the study plan with marks and grades, plus the semester summary. */
export default function ActivityDetailPage() {
  const params = useParams();
  const data = createMemo(() => getActivityDetail(params.id as string));

  const title = () =>
    data().activity.academic_year?.name ?? data().activity.academic_year_name ?? data().activity.name ?? t('st.academicActivityDetail');
  const printHref = (kind: 'krs' | 'khs') =>
    `/api/student/print/${kind}/${encodeURIComponent(data().activity.id)}?name=${encodeURIComponent(`${kind.toUpperCase()}_${title()}`)}`;

  return (
    <Errored fallback={(err) => <ActivityError error={err()} fallbackKey="st.failedToLoadSemesterCourseDetails" />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={title()}
        description={t('st.studyPlanCardKRSAcademicGrade')}
        actions={
          <>
            <a href="/student/academic/student/campaign/activity" class="rounded-xs border border-layer-line bg-layer px-3 py-2 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden">
              {t('st.backToActivities')}
            </a>
            <PrintLink variant="button" href={printHref('krs')} label={t('st.printKRS')} title={t('st.printStudyPlanCardKRS')} />
            <PrintLink variant="button" href={printHref('khs')} label={t('st.printKHS')} title={t('st.printStudyResultCardKHS')} />
            <Show
              when={!data().activity.is_lock}
              fallback={
                <span title={t('st.academicActivityIsLocked')} class="cursor-not-allowed rounded-xs bg-muted px-3 py-2 text-sm text-muted-foreground">
                  {t('st.addEnrollCourses')}
                </span>
              }
            >
              <a href={`/student/academic/student/campaign/activity/${encodeURIComponent(data().activity.id)}/enrollment`} class="rounded-xs bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-hidden">
                {t('st.addEnrollCourses')}
              </a>
            </Show>
          </>
        }
      />

      <ActivityCourses data={data()} />
    </Errored>
  );
}
