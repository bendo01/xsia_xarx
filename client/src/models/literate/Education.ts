export interface LiterateEducation {
    id?: string;
    code: number | string;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    abbreviation: string;
    name: string;
    level_id: string;
    group_id: string;
    category_id: string;
    variety_id: string;
    created_at?: string | Date | null;
    updated_at?: string | Date | null;
    deleted_at?: string | Date | null;
    sync_at?: string | Date | null;
    created_by?: string | null;
    updated_by?: string | null;
}

export interface TypeInputLiterateEducationForm {
    id?: string | null;
    code: number | string;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    abbreviation: string;
    name: string;
    level_id: string;
    group_id: string;
    category_id: string;
    variety_id: string;
}
