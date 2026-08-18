import type { AcademicStudentCampaignDetailActivity, AcademicStudentCampaignDetailActivityDataObject } from "./DetailActivity";

export interface AcademicStudentCampaignActivity {
    id: string;
    name: string | null;
    cumulative_index: number | null;
    grand_cumulative_index: number | null;
    total_credit: number | null;
    grand_total_credit: number | null;
    student_id: string;
    unit_activity_id: string;
    status_id: string;
    resign_status_id: string;
    unit_id: string;
    is_lock: boolean;
    feeder_id: string | null;
    finance_fee: number | null;
    finance_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    detail_activities?: AcademicStudentCampaignDetailActivityDataObject[] | null;
    is_has_detail_activities: boolean;
}

export const initialAcademicStudentCampaignActivity: AcademicStudentCampaignActivity = {
    id: "",
    name: null,
    cumulative_index: null,
    grand_cumulative_index: null,
    total_credit: null,
    grand_total_credit: null,
    student_id: "",
    unit_activity_id: "",
    status_id: "",
    resign_status_id: "",
    unit_id: "",
    is_lock: false,
    is_has_detail_activities: false,
    feeder_id: null,
    finance_fee: null,
    finance_id: null,
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};
