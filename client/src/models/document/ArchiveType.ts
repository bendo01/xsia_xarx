export interface DocumentArchiveType {
    id: string;
    code: number | null;
    alphabet_code: string | null;
    name: string;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
}
