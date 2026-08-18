export interface AcademicYear {
    id: string;
    code: number | null;
    year: number | null;
    name: string | null;
    feeder_name: string | null;
    academic_year_category_id: string | null;
    is_active: boolean;
    start_date: string | null;
    end_date: string | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialAcademicYear: AcademicYear = {
    id: "",
    code: null,
    year: null,
    name: null,
    feeder_name: null,
    academic_year_category_id: null,
    is_active: false,
    start_date: null,
    end_date: null,
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};
