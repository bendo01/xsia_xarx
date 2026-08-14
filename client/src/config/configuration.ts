export const configuration = {
    academicYearId: import.meta.env.CURRENT_ACADEMIC_YEAR_ID || '00000000-0000-0000-0000-000000000000',
    studentAdmissionAcademicYearId: import.meta.env.CURRENT_STUDENT_ADMISSION_ACADEMIC_YEAR_ID || '00000000-0000-0000-0000-000000000000',
    institutionId: import.meta.env.CURRENT_INSTITUTION_ID || '00000000-0000-0000-0000-000000000000',
    institutionCode: import.meta.env.CURRENT_INSTITUTION_CODE || '000000',
};

export default configuration;
