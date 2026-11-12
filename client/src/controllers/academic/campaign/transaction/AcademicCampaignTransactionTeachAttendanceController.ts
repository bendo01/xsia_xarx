import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () =>
    (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const ROOT = '/academic/campaign/transaction';

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json'
    };
    const token = getStorageItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

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

export interface ScanResult {
    meeting_id: string;
    teach_id: string;
    sequence: number;
    attend_type: AttendTypeOption;
}

export interface ApiResult<T> {
    is_error: boolean;
    message: string;
    data?: T;
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
    try {
        const res = await fetch(`${getBaseUrl()}${ROOT}${path}`, { ...init, headers: getHeaders() });
        const body = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: body.brief || body.message || body.detail || `Request failed (${res.status})` };
        }
        return { is_error: false, message: body.message ?? 'OK', data: body as T };
    } catch (err: any) {
        return { is_error: true, message: err?.message || 'Network error' };
    }
}

export const listMeetings = (teachId: string) =>
    request<MeetingItem[]>(`/teach-meetings?teach_id=${encodeURIComponent(teachId)}`);

export const getRoster = (meetingId: string) =>
    request<RosterResponse>(`/teach-meetings/${meetingId}/attendances`);

export const saveAttendances = (
    meetingId: string,
    entries: { student_id: string; attend_type_id: string }[]
) =>
    request<{ message: string }>(`/teach-meetings/${meetingId}/attendances`, {
        method: 'PUT',
        body: JSON.stringify({ entries })
    });

export const openQr = (meetingId: string, minutes?: number) =>
    request<QrToken>(`/teach-meetings/${meetingId}/qr`, {
        method: 'POST',
        body: JSON.stringify({ minutes })
    });

export const getQrToken = (meetingId: string) => request<QrToken>(`/teach-meetings/${meetingId}/qr`);

export const closeQr = (meetingId: string) =>
    request<{ message: string }>(`/teach-meetings/${meetingId}/qr`, { method: 'DELETE' });

export const scanAttendanceQr = (token: string) =>
    request<ScanResult>('/attendance-scan', { method: 'POST', body: JSON.stringify({ token }) });

export async function printAttendance(teachId: string, filled: boolean): Promise<Blob | null> {
    try {
        const headers: Record<string, string> = { Accept: 'application/pdf' };
        const token = getStorageItem('token');
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${getBaseUrl()}${ROOT}/teach-attendance-print/${teachId}?filled=${filled}`, { headers });
        if (!res.ok) return null;
        return await res.blob();
    } catch {
        return null;
    }
}
