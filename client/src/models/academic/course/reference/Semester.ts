export interface AcademicCourseReferenceSemester {
    id: string;
    code: number;
    alphabet_code: string;
    name: string;
    is_odd: boolean;
    start_effective_date: string | null;
    end_effective_date: string | null;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string;
}
