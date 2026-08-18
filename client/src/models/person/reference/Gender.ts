export interface PersonReferenceGender {
    id: string | null;
    code: number | null;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    name: string | null;
    created_at: string | Date | null;
    updated_at: string | Date | null;
    deleted_at: string | Date | null;
    sync_at?: string | Date | null;
    created_by: string | null;
    updated_by: string | null;
}