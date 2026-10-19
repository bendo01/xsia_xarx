import LecturerDecreeAssignmentPage from '~/components/admin/LecturerDecreeAssignmentPage';
import { t } from '../../../../../../i18n';

export default function AcademicLecturerTransactionAcademicgroupPage() {
    return (
        <LecturerDecreeAssignmentPage
            config={{
                apiPath: 'academic/lecturer/transaction/academic-groups',
                referenceApiPath: 'academic/lecturer/reference/groups',
                referenceKey: 'group_id',
                basePath: '/administrator/academic/lecturer/transaction/academic-group',
                breadcrumb: t('ad.academicGroup'),
                title: t('ad.lecturerAcademicGroups'),
                description: t('ad.manageLecturerAcademicGroupHistoryGolongan'),
                referenceLabel: t('ad.group'),
                recordLabel: t('ad.academicGroup'),
            }}
        />
    );
}
