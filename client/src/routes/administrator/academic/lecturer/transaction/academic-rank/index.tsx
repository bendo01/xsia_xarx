import LecturerDecreeAssignmentPage from '~/components/admin/LecturerDecreeAssignmentPage';

export default function AcademicLecturerTransactionAcademicrankPage() {
    return (
        <LecturerDecreeAssignmentPage
            config={{
                apiPath: 'academic/lecturer/transaction/academic-ranks',
                referenceApiPath: 'academic/lecturer/reference/ranks',
                referenceKey: 'rank_id',
                basePath: '/administrator/academic/lecturer/transaction/academic-rank',
                breadcrumb: 'Academic Rank',
                title: 'Lecturer Academic Ranks',
                description: 'Manage lecturer academic rank history (jabatan fungsional): assigned rank, decree (SK) number and date, and validity period.',
                referenceLabel: 'Rank',
                recordLabel: 'Academic Rank',
            }}
        />
    );
}
