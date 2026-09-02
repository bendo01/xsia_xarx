export interface AcademicLecturerMasterLecturer {
    id: string;
    code: string; // NIDN or Lecturer Code
    name: string | null;
    individual_id: string;
    institution_id: string | null;
    alternative_code: string | null;
    accessor_number: string | null;
    identification_number: string | null;
    status_id: string | null;
    contract_id: string | null;
    rank_id: string | null;
    start_date: string | null;
    end_date: string | null;
    front_title: string | null;
    last_title: string | null;
    id_dosen: string | null;
    id_registrasi_dosen: string | null;
    group_id: string | null;
    nuptk: string | null;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    // Enriched fields for UI display
    unit_name?: string | null;
    rank_name?: string | null;
    group_name?: string | null;
    status_name?: string | null;
    nidn?: string | null;
}
