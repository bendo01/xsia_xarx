import { ModelPagination as PaginateResult } from "../../../pagination/ModelPagination";
import { PersonMasterIndividual, PersonMasterIndividualDataObject } from "../../../person/master/Individual";
import { InstitutionMasterUnit } from "../../../institution/master/Unit";
import { AcademicYear } from "../../general/AcademicYear";

export interface AcademicStudentMasterStudent {
  id: string
  code: string
  nisn: string
  name: string
  registered: string
  individual_id: string
  unit_id: string
  academic_year_id: string
  curriculum_id: string
  class_code_id: string
  status_id: string
  registration_id: string
  resign_status_id: string
  concentration_id: string
  selection_type_id: string
  transfer_unit_id: string
  transfer_code: any
  finance_fee: number
  finance_id: string
  id_mahasiswa: string
  id_registrasi_mahasiswa: string
  created_at: string
  updated_at: string
  sync_at: string
  deleted_at: any
  created_by: string
  updated_by: string
}

export interface AcademicStudentMasterStudentValidate {
  is_profile_exist: boolean
  is_family_card_exist: boolean
  is_mother_exist: boolean
  is_father_exist: boolean
  is_address_exist: boolean
  is_guardian_exist: boolean
  profile?: any
  address?: any
  family_card?: any
  father?: any
  mother?: any
  guardian?: any
}

export interface StudentDataObject {
  student: AcademicStudentMasterStudent;
  individual: PersonMasterIndividualDataObject | null;
  unit: InstitutionMasterUnit | null;
  academic_year: AcademicYear | null;
  curriculum: any; // TODO: Define Curriculum model
  class_code: any; // TODO: Define ClassCode model
  status: any; // TODO: Define Status model
  registration: any; // TODO: Define Registration model
  resign_status: any;
  concentration: any;
  selection_type: any;
  finance: any;
}

export interface ModelPagination {
  pagination: PaginateResult;
  data: StudentDataObject[];
}