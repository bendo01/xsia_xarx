import { PersonMasterIndividual } from "../../person/master/Individual";
import { InstitutionMasterInstitution } from "./Institution";
import { InstitutionMasterEmployee } from "./Employee";

export interface InstitutionMasterStaff {
    id: string;
    code: string | null;
    name: string | null;
    decree_number: string | null;
    decree_date: string | null;
    start_date: string | null;
    end_date: string | null;
    employee_id: string | null;
    unit_id: string | null;
    position_type_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialInstitutionMasterStaff: InstitutionMasterStaff = {
    id: "",
    code: "",
    name: "",
    decree_number: "",
    decree_date: null,
    start_date: null,
    end_date: null,
    employee_id: null,
    unit_id: null,
    position_type_id: null,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null
};

export interface InstitutionMasterStaffDataObject extends InstitutionMasterStaff {
    employee: InstitutionMasterEmployee | null;
    unit: any | null; // Placeholder until Unit model is available
    position_type: any | null; // Placeholder until PositionType model is available
}

export interface ConnectAccountParams {
    staff_id: string;
    user_id: string;
}

export interface GenerateAccountParams {
    staff_id: string;
    email: string;
    password: string;
}