export interface InstitutionReferenceUnitType {
    id: string | null;
    code: number | null;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    name: string | null;
    created_at: Date | string | null;
    updated_at: Date | string | null;
    deleted_at: Date | string | null;
    sync_at?: Date | string | null;
    created_by: string | null;
    updated_by: string | null;
}
