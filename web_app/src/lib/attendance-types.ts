export interface AttendTypeOption {
  id: string;
  code: number;
  alphabet_code: string;
  name: string;
}
export type MeetingType = 'regular' | 'midterm' | 'final';
export interface MeetingItem {
  id: string;
  teach_id: string;
  sequence: number;
  meeting_type: MeetingType;
  topic?: string | null;
  held_on?: string | null;
  is_qr_open: boolean;
  qr_open_until?: string | null;
}
export interface RosterItem {
  student_id: string;
  student_name: string;
  student_code: string;
  /** null until attendance was recorded for the student */
  attend_type_id: string | null;
  method?: 'manual' | 'qr' | null;
  marked_at?: string | null;
}
export interface RosterResponse {
  attend_types: AttendTypeOption[];
  entries: RosterItem[];
}
export interface QrToken {
  token: string;
  expires_in: number;
}
