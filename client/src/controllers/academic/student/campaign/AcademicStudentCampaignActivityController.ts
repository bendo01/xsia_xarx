import { getStorageItem } from '~/lib/storage';
import { ModelPagination as PaginateResult, ModelPaginationForm } from '~/models/pagination/ModelPagination';
import { AcademicStudentCampaignActivityResponse } from '~/models/academic/student/campaign/ActivityResponse';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (typeof window !== 'undefined') {
        const token = getStorageItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};

export interface StudentActivityItem {
    id: string;
    name?: string | null;
    cumulative_index: number;
    grand_cumulative_index: number;
    total_credit: number;
    grand_total_credit: number;
    student_id: string;
    unit_activity_id: string;
    status_id: string;
    resign_status_id?: string | null;
    unit_id?: string | null;
    is_lock: boolean;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string;
    updated_by?: string;
    feeder_id?: string | null;
    finance_id?: string | null;
    finance_fee?: number;
    // UI enhancements
    semester_name?: string;
    status_name?: string;
    academic_year?: { id?: string; name?: string; code?: string } | null;
    academic_year_name?: string;
}

export async function listStudentActivities(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    student_id?: string;
}): Promise<{
    data: StudentActivityItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}> {
    try {
        const params = new URLSearchParams();
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.page_size) params.set('page_size', String(queryParams.page_size));
        if (queryParams?.name) params.set('name', queryParams.name);
        if (queryParams?.student_id) params.set('student_id', queryParams.student_id);

        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        return {
            data: json.data || [],
            total: json.total || (json.data ? json.data.length : 0),
            page: json.page || 1,
            page_size: json.page_size || 10,
            total_pages: json.total_pages || 1,
        };
    } catch (err) {
        console.warn('Error fetching student activities list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };
    }
}

export async function getStudentActivityById(id: string): Promise<StudentActivityItem | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching student activity ${id}:`, err);
        return null;
    }
}

export async function academicStudentCampaignActivityIndex(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/student/campaign/activities/index_by_student/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: 'Gagal mengambil data aktivitas kuliah',
            };
        }
        return { code: 200, message: data };
    } catch (error) {
        return { code: 500, message: 'Internal server error' };
    }
}

export async function academicStudentCampaignActivityShow(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/student/campaign/activities/show_student/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: 'Gagal mengambil detail aktivitas kuliah',
            };
        }
        return { code: 200, message: data };
    } catch (error) {
        return { code: 500, message: 'Internal server error' };
    }
}

export async function toggleIsLocked(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/student/campaign/activities/toggle_is_locked/${id}`, {
            method: 'POST',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: 'Gagal mengubah status terkunci',
            };
        }
        return { code: 200, message: data };
    } catch (error) {
        return { code: 500, message: 'Internal server error' };
    }
}

export async function printActivityPlan(activityId: string): Promise<Blob | null> {
    try {
        const token = getStorageItem('token');
        const headers: Record<string, string> = {
            Accept: 'application/pdf',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities/print_activity_plan/${activityId}`, {
            method: 'GET',
            headers,
        });

        if (!res.ok) {
            console.error(`Failed to print activity plan: HTTP ${res.status}`);
            return null;
        }

        return await res.blob();
    } catch (err) {
        console.error('Error fetching activity plan PDF:', err);
        return null;
    }
}

export async function printActivityResult(activityId: string): Promise<Blob | null> {
    try {
        const token = getStorageItem('token');
        const headers: Record<string, string> = {
            Accept: 'application/pdf',
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities/print_activity_result/${activityId}`, {
            method: 'GET',
            headers,
        });

        if (!res.ok) {
            console.error(`Failed to print activity result: HTTP ${res.status}`);
            return null;
        }

        return await res.blob();
    } catch (err) {
        console.error('Error fetching activity result PDF:', err);
        return null;
    }
}