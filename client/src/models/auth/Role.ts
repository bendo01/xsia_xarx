export interface Role {
    id: string;
    name: string;
    user_id: string;
    position_type_id: string;
    roleable_id: string;
    roleable_type: string;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
}