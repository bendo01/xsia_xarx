export interface PersonReferenceProfession {
    id: string | null;
    code: number | null;
    alphabetic_code: string | null;
    alphabet_code?: string | null;
    name: string | null;
    created_at: Date | string | null;
    updated_at: Date | string | null;
    deleted_at: Date | string | null;
    created_by: string | null;
    updated_by: string | null;
}
