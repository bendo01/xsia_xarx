export interface PersonReferenceAgeClassification {
    id: string;
    code: number;
    alphabet_code: string;
    name: string;
    minimum: number;
    maximum: number | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialPersonReferenceAgeClassification: PersonReferenceAgeClassification = {
    id: "",
    code: 0,
    alphabet_code: "",
    name: "",
    minimum: 0,
    maximum: null,
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};
