import { AcademicCampaignTransactionTeachResponse } from "../../campaign/transaction/Teach";
import { AcademicCourseMasterCourse } from "../../course/master/Course";
import { AcademicStudentCampaignActivity } from "./Activity";

export interface AcademicStudentCampaignDetailActivity {
    id: string;
    name: string | null;
    feeder_id: string;
    feeder_grade_id: string;
    curiculum_detail_sequence: number;
    mark: number | null;
    credit: number | null;
    grade_id: string;
    course_id: string;
    activity_id: string;
    teach_id: string;
    is_lock: boolean;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export interface AcademicStudentCampaignDetailActivityDataObject {
    detail_activity: AcademicStudentCampaignDetailActivity;
    activity: AcademicStudentCampaignActivity | null;
    course: AcademicCourseMasterCourse | null;
    grade: any | null; // Placeholder for Grade model if not available
    teach_activity: AcademicCampaignTransactionTeachResponse | null;
}
