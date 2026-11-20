// Shapes of the lecturer API bodies the web app reads (a subset of the Rust models).
export interface HomebaseItem {
  id: string;
  lecturer_id: string;
  unit_name?: string | null;
  status_name?: string | null;
  contract_name?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AcademicRankItem {
  id: string;
  decree_number?: string | null;
  decree_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  rank_name?: string | null;
  rank_code?: string | number | null;
  created_at?: string | null;
}

export interface AcademicGroupItem {
  id: string;
  decree_number?: string | null;
  decree_date?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  group_name?: string | null;
  group_code?: string | number | null;
  created_at?: string | null;
}

export interface AssignedTeach {
  teach_lecturer_id: string;
  teach_id: string;
  lecturer_id: string;
  planning: number;
  realization: number;
  credit: number;
  is_lecturer_home_base: boolean;
  role_name?: string | null;
  teach_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  max_member?: number;
  activity_id?: string | null;
  activity_name?: string | null;
  academic_year_id?: string | null;
  academic_year_name?: string | null;
  academic_year_code?: number | string | null;
  course_id: string;
  course_code?: string;
  course_name?: string;
  course_total_credit?: number;
  class_code_id: string;
  class_name?: string;
  class_alphabet_code?: string;
  class_capacity?: number;
}

export interface LecturerRecord {
  id: string;
  code: string;
  nidn?: string | null;
  nuptk?: string | null;
  name: string | null;
  individual_id: string;
  front_title?: string | null;
  last_title?: string | null;
  unit_name?: string | null;
  rank_name?: string | null;
  group_name?: string | null;
  status_name?: string | null;
  contract_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  homebases: HomebaseItem[];
  academic_ranks: AcademicRankItem[];
  academic_groups: AcademicGroupItem[];
  assigned_teaches: AssignedTeach[];
}
