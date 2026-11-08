import { PersonReferenceGender } from "../reference/Gender";
import { PersonReferenceReligion } from "../reference/Religion";
import { PersonReferenceIdentificationType } from "../reference/IdentificationType";
import { PersonReferenceIncome } from "../reference/Income";
import { PersonReferenceMaritalStatus } from "../reference/MaritalStatus";
import { PersonReferenceOccupation } from "../reference/Occupation";
import { PersonReferenceAgeClassification } from "../reference/AgeClassification";

export interface PersonMasterIndividual {
  id: string;
  code: string;
  name: string;
  front_title: string | null;
  last_title: string | null;
  birth_date: string;
  birth_place: string;
  gender_id: string;
  religion_id: string;
  occupation_id: string | null;
  education_id: string | null;
  income_id: string;
  identification_type_id: string;
  marital_status_id: string;
  profession_id: string;
  age_classification_id: string | null;
  is_special_need: boolean;
  is_social_protection_card_recipient: boolean;
  is_deceased: boolean;
  created_at: string | null;
  updated_at: string | null;
  sync_at: string | null;
  deleted_at: string | null;
  created_by: string | null;
  updated_by: string | null;
};

export const initialPersonMasterIndividual: PersonMasterIndividual = {
  id: "",
  code: "",
  name: "",
  birth_date: "",
  birth_place: "",
  gender_id: "00000000-0000-0000-0000-000000000000",
  religion_id: "00000000-0000-0000-0000-000000000000",
  occupation_id: "00000000-0000-0000-0000-000000000000",
  education_id: "00000000-0000-0000-0000-000000000000",
  income_id: "00000000-0000-0000-0000-000000000000",
  identification_type_id: "3d59fc95-b07d-46ad-95ff-206b7e7f253f",
  marital_status_id: "00000000-0000-0000-0000-000000000000",
  profession_id: "00000000-0000-0000-0000-000000000000",
  is_special_need: false,
  is_social_protection_card_recipient: false,
  is_deceased: false,
  front_title: null,
  last_title: null,
  age_classification_id: null,
  created_at: null,
  updated_at: null,
  sync_at: null,
  deleted_at: null,
  created_by: null,
  updated_by: null,
};

export interface PersonMasterIndividualDataObject {
  individual: PersonMasterIndividual;
  gender: PersonReferenceGender | null;
  religion: PersonReferenceReligion | null;
  identification_type: PersonReferenceIdentificationType | null;
  income: PersonReferenceIncome | null;
  marital_status: PersonReferenceMaritalStatus | null;
  occupation: PersonReferenceOccupation | null;
  profession: any | null; // PersonReferenceProfession
  education?: any | null; // LiterateEducation
  age_classification: PersonReferenceAgeClassification | null;
  biodata: any | null; // PersonMasterBiodata
  picture: any | null; // PersonMasterImage
  user: any | null; // AuthUser
  lecturer: any | null; // AcademicLecturerMasterLecturer
  students: any[] | null; // AcademicStudentMasterStudent[]
  employees: any[] | null; // InstitutionMasterEmployee[]
  candidates: any[] | null; // AcademicCandidateMasterCandidate[]
  evaluators: any[] | null; // AcademicPriorLearningRecognitionTransactionEvaluator[]
  family_card_members: any[] | null; // PersonMasterFamilyCardMember[]
  phones?: IndividualContactItem[] | null;
  electronic_mails?: IndividualContactItem[] | null;
  residences?: IndividualResidenceItem[] | null;
  family_cards?: IndividualFamilyCardItem[] | null;
}

export interface IndividualContactItem {
  id: string;
  value: string;
  type_name?: string | null;
}

export interface IndividualResidenceItem {
  id: string;
  street: string;
  citizens_association: number;
  neighborhood_association: number;
  residence_type_name?: string | null;
  province_name?: string | null;
  regency_name?: string | null;
  sub_district_name?: string | null;
  village_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

export interface IndividualFamilyCardMemberItem {
  id: string;
  individual_id: string;
  individual_name?: string | null;
  relative_id: string;
  relative_name?: string | null;
  relative_type_name?: string | null;
}

export interface IndividualFamilyCardItem {
  id: string;
  code?: string | null;
  head_individual_id?: string | null;
  head_name?: string | null;
  members: IndividualFamilyCardMemberItem[];
}