export interface AcademicStudentReferenceFinance {
    id: string;
    code: number | null;
    alphabet_code: string | null;
    name: string | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialAcademicStudentReferenceFinance: AcademicStudentReferenceFinance = {
    id: "",
    code: null,
    alphabet_code: null,
    name: null,
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};
