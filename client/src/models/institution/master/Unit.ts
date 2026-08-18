export interface InstitutionMasterUnit {
    id: string;
    code: string | null;
    name: string | null;
    is_active: boolean;
    unit_type_id: string | null;
    institution_id: string | null;
    parent_id: string | null;
    education_id: string | null;
    feeder_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialInstitutionMasterUnit: InstitutionMasterUnit = {
    id: "",
    code: null,
    name: null,
    is_active: false,
    unit_type_id: null,
    institution_id: null,
    parent_id: null,
    education_id: null,
    feeder_id: null,
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};
