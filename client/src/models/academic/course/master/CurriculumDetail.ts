export interface AcademicCourseMasterCurriculumDetail {
    id: string;
    code: number;
    name: string;
    credit: number;
    curriculum_id: string;
    semester_id: string;
    course_id: string;
    concentration_id: string;
    is_convertable_to_mbkm: boolean;
    is_convertable_to_prior_learning_recognition: boolean;
    feeder_id: string | null;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
}
