import LecturerDecreeAssignmentPage from '~/components/admin/LecturerDecreeAssignmentPage';
import { t } from '../../../../../../i18n';

export default function AcademicLecturerTransactionAcademicrankPage() {
    return (
        <LecturerDecreeAssignmentPage
            config={{
                apiPath: 'academic/lecturer/transaction/academic-ranks',
                referenceApiPath: 'academic/lecturer/reference/ranks',
                referenceKey: 'rank_id',
                basePath: '/administrator/academic/lecturer/transaction/academic-rank',
                breadcrumb: t('ad.academicRank'),
                title: t('ad.lecturerAcademicRanks'),
                description: t('ad.manageLecturerAcademicRankHistoryJabatan'),
                referenceLabel: t('ad.rank'),
                recordLabel: t('ad.academicRank'),
            }}
        />
    );
}
