export interface AcademicLecturerTransactionHomebase {
    id: string;
    lecturer_id: string;
    unit_id: string;
    institution_id: string;
    status_id: string;
    contract_id: string;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    sync_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    // Enriched fields
    unit_name?: string | null;
    status_name?: string | null;
    contract_name?: string | null;
}
