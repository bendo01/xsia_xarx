import { PersonMasterIndividual } from "../../person/master/Individual";
import { InstitutionMasterInstitution } from "./Institution";
// import { InstitutionMasterStaff } from "./Staff";

export interface InstitutionMasterEmployee {
    id: string;
    code: string | null,
    name?: string | null,
    institution_id: string | null,
    individual_id: string | null,
    decree_date: string | null,
    decree_number: string | null,
    is_active: boolean | null,
    created_at: string | null,
    updated_at: string | null,
    deleted_at: string | null,
    created_by: string | null,
    updated_by: string | null
}

export const initialInstitutionMasterEmployee: InstitutionMasterEmployee = {
    id: "",
    code: "",
    name: "",
    institution_id: null,
    individual_id: null,
    decree_date: null,
    decree_number: "",
    is_active: true,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null
};

export interface InstitutionMasterEmployeeDataObject extends InstitutionMasterEmployee {
    institution: InstitutionMasterInstitution | null;
    individual: PersonMasterIndividual | null;
    staffes: any[] | null; // InstitutionMasterStaff[] | null;
}
