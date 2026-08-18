export interface AcademicCourseMasterCurriculum {
    id: string;
    name: string;
    unit_id: string;
    academic_year_id: string;
    curriculum_type_id: string;
    total_credit: number;
    mandatory_course_credit: number;
    optional_course_credit: number;
    feeder_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
    start_date: string | null;
    end_date: string | null;
}
