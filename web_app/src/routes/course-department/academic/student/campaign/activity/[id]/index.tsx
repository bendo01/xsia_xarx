import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import ActivityCourses from '../../../../../../../components/student/ActivityCourses';
import ActivityError from '../../../../../../../components/student/ActivityError';
import PageHeader from '../../../../../../../components/student/PageHeader';
import PrintLink from '../../../../../../../components/student/PrintLink';
import { t } from '../../../../../../../i18n';
import { getUnitActivityDetail } from '../../../../../../../lib/unit';

export const route = {
  preload: ({ params }) => {
    void getUnitActivityDetail(params.id as string);
  },
} satisfies RouteDefinition;

/** One semester of a student of the unit: courses, marks and grades (read-only), with KRS/KHS PDFs. */
export default function UnitActivityDetail() {
  const params = useParams();
  const data = createMemo(() => getUnitActivityDetail(params.id as string));
  const title = () => data().activity.academic_year?.name ?? data().activity.academic_year_name ?? data().activity.name ?? t('st.academicActivityDetail');
  const printHref = (kind: 'krs' | 'khs') =>
    `/api/student/print/${kind}/${encodeURIComponent(data().activity.id)}?name=${encodeURIComponent(`${kind.toUpperCase()}_${title()}`)}`;

  return (
    <Errored fallback={(err) => <ActivityError error={err()} fallbackKey="st.failedToLoadSemesterCourseDetails" />}>
      <Title>{`${title()} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={title()}
        actions={
          <>
            <a href="/course-department/academic/student/campaign/activity" class="rounded-xs border border-layer-line bg-layer px-3 py-2 text-sm hover:bg-layer-hover">{t('st.backToActivities')}</a>
            <PrintLink variant="button" href={printHref('krs')} label={t('st.printKRS')} title={t('st.printStudyPlanCardKRS')} />
            <PrintLink variant="button" href={printHref('khs')} label={t('st.printKHS')} title={t('st.printStudyResultCardKHS')} />
          </>
        }
      />
      <ActivityCourses data={data()} />
    </Errored>
  );
}
