export interface Permission {
    id: string;
    name: string;
    uri?: string | null;
    is_open?: boolean;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
}