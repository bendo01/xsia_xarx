import type { AcademicStudentCampaignActivity } from "./Activity";
import type { AcademicCampaignTransactionUnitActivity } from "../../campaign/transaction/UnitActivity";
import type { AcademicYear } from "../../general/AcademicYear";
import type { InstitutionMasterUnit } from "../../../institution/master/Unit";
import type { AcademicStudentMasterStudent } from "../master/Student";
import type { AcademicStudentReferenceFinance } from "../reference/Finance";
import type { AcademicStudentReferenceStatus } from "../reference/Status";

export interface UnitActivityWithRelations {
    activity: AcademicCampaignTransactionUnitActivity;
    academic_year: AcademicYear;
    unit: InstitutionMasterUnit;
}

export interface AcademicStudentCampaignActivityResponse {
    activity: AcademicStudentCampaignActivity;
    unit_activity: UnitActivityWithRelations;
    student: AcademicStudentMasterStudent;
    finance: AcademicStudentReferenceFinance | null;
    resign_status: AcademicStudentReferenceStatus | null;
    status: AcademicStudentReferenceStatus | null;
    unit: InstitutionMasterUnit;
    detail_activities: object[] | null;
    payments: object[] | null;
}
