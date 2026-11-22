// Shapes the student pages need (a lean subset of the API's records).

export interface NamedRef {
  id?: string;
  name?: string | null;
  code?: string | null;
}

export interface StudentItem {
  id: string;
  code: string;
  name?: string;
  registered?: string;
  individual_id?: string;
  unit_id?: string;
  // Relations the API embeds on the single-student endpoint.
  unit?: NamedRef | null;
  status?: NamedRef | null;
  curriculum?: NamedRef | null;
  academic_year?: NamedRef | null;
  registration?: NamedRef | null;
  selection_type?: NamedRef | null;
  // Flattened names some list endpoints return instead.
  unit_name?: string;
  status_name?: string;
  curriculum_name?: string;
  academic_year_name?: string;
}

export interface ActivityItem {
  id: string;
  name?: string | null;
  cumulative_index: number;
  grand_cumulative_index: number;
  total_credit: number;
  grand_total_credit: number;
  is_lock: boolean;
  semester_name?: string;
  status_name?: string;
  academic_year?: NamedRef | null;
  academic_year_name?: string;
  created_at?: string;
}

export interface CounsellorItem {
  id: string;
  lecturer_name?: string;
  lecturer_nidn?: string;
  lecturer_email?: string;
  decree_number?: string;
  decree_date?: string;
  role_type?: string;
  notes?: string;
}

export interface ResidenceItem {
  id: string;
  street?: string | null;
  citizens_association?: number | null;
  neighborhood_association?: number | null;
  residence_type_name?: string | null;
  province_name?: string | null;
  regency_name?: string | null;
  sub_district_name?: string | null;
  village_name?: string | null;
}

export interface FamilyMemberItem {
  id: string;
  individual_id?: string | null;
  individual_name?: string | null;
  relative_id?: string | null;
  relative_name?: string | null;
  relative_type_name?: string | null;
}

export interface FamilyCardItem {
  id: string;
  code?: string | null;
  head_name?: string | null;
  members: FamilyMemberItem[];
}

export interface ContactItem {
  id: string;
  value: string;
  type_name?: string | null;
}

export interface Individual {
  id: string;
  code: string;
  name: string;
  front_title: string | null;
  last_title: string | null;
  birth_date: string;
  birth_place: string;
  is_special_need?: boolean;
}

import type { TrendPoint } from './academic-trend';

export interface StudentProfile {
  individual: Individual;
  refs: {
    gender: string | null;
    religion: string | null;
    marital_status: string | null;
    education: string | null;
    occupation: string | null;
  };
  phones: ContactItem[];
  emails: ContactItem[];
  residences: ResidenceItem[];
  familyCards: FamilyCardItem[];
  students: StudentItem[];
  selected: StudentItem | null;
  activities: ActivityItem[];
  advisers: CounsellorItem[];
  /** Semester GPA / credit trend, oldest first (for the home charts). */
  trend: TrendPoint[];
}
