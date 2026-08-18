export interface AcademicCampaignTransactionUnitActivity {
    id: string;
    name: string | null;
    unit_id: string;
    academic_year_id: string;
    week_quantity: number | null;
    student_target: number | null;
    candidate_number: number | null;
    candidate_pass: number | null;
    became_student: number | null;
    transfer_student: number | null;
    total_class_member: number | null;
    start_date: string | null;
    end_date: string | null;
    start_transaction: string | null;
    end_transaction: string | null;
    is_active: boolean;
    feeder_id: string | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialAcademicCampaignTransactionUnitActivity: AcademicCampaignTransactionUnitActivity = {
    id: "",
    name: null,
    unit_id: "",
    academic_year_id: "",
    week_quantity: null,
    student_target: null,
    candidate_number: null,
    candidate_pass: null,
    became_student: null,
    transfer_student: null,
    total_class_member: null,
    start_date: null,
    end_date: null,
    start_transaction: null,
    end_transaction: null,
    is_active: false,
    feeder_id: null,
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};
