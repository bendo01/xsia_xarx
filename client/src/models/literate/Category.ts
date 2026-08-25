export interface LiterateCategory {
    id?: string;
    code: number | string;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    name: string;
    created_at?: string | Date | null;
    updated_at?: string | Date | null;
    deleted_at?: string | Date | null;
    sync_at?: string | Date | null;
    created_by?: string | null;
    updated_by?: string | null;
}
