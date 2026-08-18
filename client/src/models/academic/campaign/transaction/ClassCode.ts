export interface AcademicCampaignTransactionClassCode {
    id: string;
    code: string | null;
    alphabet_code: string;
    name: string;
    activity_id: string;
    unit_id: string;
    capacity: number;
    start_effective_date: string;
    end_effective_date: string;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
}