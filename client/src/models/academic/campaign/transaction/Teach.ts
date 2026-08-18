import { AcademicCourseMasterCourse } from "../../course/master/Course";
import { AcademicCampaignTransactionUnitActivity } from "./UnitActivity";
import { AcademicCampaignTransactionTeachDecree } from "./TeachDecree";
import { AcademicCampaignTransactionClassCode } from "./ClassCode";
import { AcademicCourseMasterCurriculum } from "../../course/master/Curriculum";
import { AcademicCourseReferenceSemester } from "../../course/reference/Semester";
import { AcademicCourseMasterCurriculumDetail } from "../../course/master/CurriculumDetail";

export interface AcademicCampaignTransactionTeach {
    id: string;
    name: string | null;
    description: string | null;
    start_date: string | null;
    end_date: string | null;
    practice_start_date: string | null;
    practice_end_date: string | null;
    is_lecturer_credit_sum_problem: boolean;
    is_lock: boolean;
    max_member: number;
    class_code_id: string;
    course_id: string;
    activity_id: string;
    scope_id: string;
    curriculum_detail_id: string;
    teach_decree_id: string;
    encounter_category_id: string;
    feeder_id: string;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string;
    updated_by: string;
}

export interface AcademicCampaignTransactionTeachResponse {
    teach: AcademicCampaignTransactionTeach;
    encounter_category: any | null;
    scope: any | null;
    activity: AcademicCampaignTransactionUnitActivity;
    course: AcademicCourseMasterCourse;
    teach_decree: AcademicCampaignTransactionTeachDecree;
    class_code: AcademicCampaignTransactionClassCode;
    curriculum: AcademicCourseMasterCurriculum | null;
    semester: AcademicCourseReferenceSemester | null;
    curriculum_detail: AcademicCourseMasterCurriculumDetail | null;
}
