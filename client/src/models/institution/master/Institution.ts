import type { InstitutionReferenceCategory } from "~/models/institution/reference/Category";
import type { InstitutionReferenceVariety } from "~/models/institution/reference/Variety";
import type { LocationCountry } from "~/models/location/Country";
import type { AcademicGeneralReferenceAcademicYear } from "~/models/academic/general/reference/AcademicYear";

export interface InstitutionMasterInstitution {
    id: string;
    code: string | null;
    name: string | null;
    alphabet_code: string | null;
    is_active: boolean;
    variety_id: string;
    category_id: string;
    country_id: string;
    parent_id: string | null;
    feeder_id: string | null;
    academic_year_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    sync_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export interface InstitutionMasterInstitutionDataObject {
    institution: InstitutionMasterInstitution;
    variety?: InstitutionReferenceVariety | null;
    category?: InstitutionReferenceCategory | null;
    country?: LocationCountry | null;
    parent?: InstitutionMasterInstitution | null;
    academic_year?: AcademicGeneralReferenceAcademicYear | null;
}

export interface ModelInstitutionMasterInstitutionPaginationResponse {
    pagination: {
        search: string;
        sort_by: string;
        column: string;
        sort_dir: string;
        page: number;
        per_page: number;
        total_page: number;
        last_page: number;
        total_data: number;
    };
    data: InstitutionMasterInstitutionDataObject[];
}
