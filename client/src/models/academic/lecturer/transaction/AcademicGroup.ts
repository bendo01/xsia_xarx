export interface AcademicLecturerTransactionAcademicGroup {
    id: string;
    decree_number: string | null;
    decree_date: string | null;
    lecturer_id: string;
    group_id: string;
    start_date: string | null;
    end_date: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    sync_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    // Enriched fields
    group_name?: string | null;
    group_code?: string | number | null;
}
