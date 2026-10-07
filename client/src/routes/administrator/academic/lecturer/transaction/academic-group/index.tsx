import LecturerDecreeAssignmentPage from '~/components/admin/LecturerDecreeAssignmentPage';

export default function AcademicLecturerTransactionAcademicgroupPage() {
    return (
        <LecturerDecreeAssignmentPage
            config={{
                apiPath: 'academic/lecturer/transaction/academic-groups',
                referenceApiPath: 'academic/lecturer/reference/groups',
                referenceKey: 'group_id',
                basePath: '/administrator/academic/lecturer/transaction/academic-group',
                breadcrumb: 'Academic Group',
                title: 'Lecturer Academic Groups',
                description: 'Manage lecturer academic group history (golongan / pangkat): assigned group, decree (SK) number and date, and validity period.',
                referenceLabel: 'Group',
                recordLabel: 'Academic Group',
            }}
        />
    );
}
