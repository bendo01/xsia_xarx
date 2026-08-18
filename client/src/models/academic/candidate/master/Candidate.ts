import { AcademicCandidateMasterRegistrationType } from "./RegistrationType";
import { AcademicYear } from "../../general/AcademicYear";
import { LocationRegency } from "../../../location/Regency";
import { PersonMasterIndividual } from "../../../person/master/Individual";

export interface AcademicCandidateMasterCandidateRegistration {
    email: string,
    password: string,
    name: string,
    phone: string,
    registration_type_id: string,
    school_name: string,
    school_regency_id: string,
    student_national_number?: string,
    state_smart_card_number?: string,
    guidence_name?: string,
    academic_year_id?: string,
    institution_id?: string,
    guidence_phone_number?: string,
}

export interface AcademicCandidateMasterCandidateValidate {
    is_profile_exist: boolean,
    is_family_card_exist: boolean,
    is_mother_exist: boolean,
    is_father_exist: boolean,
    is_address_exist: boolean,
    is_guardian_exist: boolean,
    registration_id: string,
    candidate_id: string,
    recognition_id: string,
    profile?: any,
    address?: any,
    family_card?: any,
    father?: any,
    mother?: any,
    guardian?: any,
}

export interface AcademicCandidateMasterCandidate {
    id: string;
    code: string;
    name: string;
    student_national_number: string;
    school_name: string;
    state_smart_card_number: string;
    guidence_name: string;
    guidence_phone_number: string;
    created_at: string;
    updated_at: string;
    created_by: string;
    updated_by: string;
    // Add other fields from API response if necessary
    thread: number;
    school_regency_id: string;
    individual_id: string;
    student_id: string | null;
    academic_year_id: string;
    institution_id: string;
    user_id: string;
    registration_type_id: string;
    sync_at: string | null;
    deleted_at: string | null;
}

export interface CandidateIndexData {
    candidate: AcademicCandidateMasterCandidate;
    registration_type: AcademicCandidateMasterRegistrationType;
    academic_year: AcademicYear;
    regency: LocationRegency;
    individual: {
        individual: PersonMasterIndividual;
    } | null;
    is_profile_exist: boolean;
    is_family_card_exist: boolean;
    is_mother_exist: boolean;
    is_father_exist: boolean;
    is_address_exist: boolean;
    is_guardian_exist: boolean;
}

export interface CandidateShowData {
    candidate: AcademicCandidateMasterCandidate;
    registration_type: AcademicCandidateMasterRegistrationType;
    academic_year: AcademicYear;
    regency: LocationRegency;
    individual: {
        individual: PersonMasterIndividual;
        gender: any; // PersonReferenceGender
        religion: any; // PersonReferenceReligion
        identification_type: any; // PersonReferenceIdentificationType
        income: any; // PersonReferenceIncome
        marital_status: any; // PersonReferenceMaritalStatus
        occupation: any; // PersonReferenceOccupation
        profession: any; // PersonReferenceProfession
        age_classification: any; // PersonReferenceAgeClassification
        biodata: any; // PersonMasterBiodata
        picture: any; // PersonMasterImage
        lecturer: any; // AcademicLecturerMasterLecturer
        students: any[]; // AcademicStudentMasterStudent[]
        employees: any[]; // InstitutionMasterEmployee[]
        family_card_members: any[]; // PersonMasterFamilyCardMember[]
    } | null;
    is_profile_exist: boolean;
    is_family_card_exist: boolean;
    is_mother_exist: boolean;
    is_father_exist: boolean;
    is_address_exist: boolean;
    is_guardian_exist: boolean;
}