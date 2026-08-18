export interface Permission {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
}