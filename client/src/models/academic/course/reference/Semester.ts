export interface AcademicCourseReferenceSemester {
    id?: string;
    code: string | number;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    name: string;
    is_odd?: boolean;
    start_effective_date?: string | null;
    end_effective_date?: string | null;
    created_at?: string | Date | null;
    updated_at?: string | Date | null;
    deleted_at?: string | Date | null;
    sync_at?: string | Date | null;
    created_by?: string | null;
    updated_by?: string | null;
}
