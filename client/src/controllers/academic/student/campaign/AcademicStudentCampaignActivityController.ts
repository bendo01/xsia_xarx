import { getStorageItem } from '~/lib/storage';

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
    student_name?: string;
    student_code?: string;
    unit_name?: string;
    unit_code?: string;
    resign_status_name?: string;
    finance_name?: string;
    student?: any;
    unit_activity?: any;
    status?: any;
    resign_status?: any;
    unit?: any;
    finance?: any;
    detail_activities?: any[];
}

export async function listStudentActivities(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    student_id?: string;
    unit_id?: string;
    institution_id?: string;
    search?: string;
    status_id?: string;
    academic_year_id?: string;
    sort_by?: string;
    sort_dir?: string;
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
        if (queryParams?.unit_id) params.set('unit_id', queryParams.unit_id);
        if (queryParams?.institution_id) params.set('institution_id', queryParams.institution_id);
        if (queryParams?.search) params.set('search', queryParams.search);
        if (queryParams?.status_id) params.set('status_id', queryParams.status_id);
        if (queryParams?.academic_year_id) params.set('academic_year_id', queryParams.academic_year_id);
        if (queryParams?.sort_by) params.set('sort_by', queryParams.sort_by);
        if (queryParams?.sort_dir) params.set('sort_dir', queryParams.sort_dir);

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

export async function createStudentActivity(payload: {
    student_id: string;
    unit_activity_id: string;
    status_id: string;
    name?: string | null;
    cumulative_index?: number;
    grand_cumulative_index?: number;
    total_credit?: number | null;
    grand_total_credit?: number | null;
    unit_id?: string | null;
    resign_status_id?: string | null;
    is_lock?: boolean;
    feeder_id?: string | null;
    finance_id?: string | null;
    finance_fee?: number | null;
}): Promise<{
    is_error: boolean;
    message: string;
    data?: StudentActivityItem;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: payload.name || null,
                cumulative_index: payload.cumulative_index ?? 0,
                grand_cumulative_index: payload.grand_cumulative_index ?? 0,
                total_credit: payload.total_credit ?? 0,
                grand_total_credit: payload.grand_total_credit ?? 0,
                student_id: payload.student_id,
                unit_activity_id: payload.unit_activity_id,
                status_id: payload.status_id,
                resign_status_id: payload.resign_status_id || null,
                unit_id: payload.unit_id || null,
                is_lock: payload.is_lock ?? false,
                feeder_id: payload.feeder_id || null,
                finance_id: payload.finance_id || null,
                finance_fee: payload.finance_fee ?? null,
            }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to create student activity',
            };
        }
        return {
            is_error: false,
            message: 'Student activity created successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while creating student activity',
        };
    }
}

export async function updateStudentActivity(
    id: string,
    payload: {
        name?: string | null;
        cumulative_index?: number;
        grand_cumulative_index?: number;
        total_credit?: number | null;
        grand_total_credit?: number | null;
        student_id?: string;
        unit_activity_id?: string;
        status_id?: string;
        resign_status_id?: string | null;
        unit_id?: string | null;
        is_lock?: boolean;
        feeder_id?: string | null;
        finance_id?: string | null;
        finance_fee?: number | null;
    }
): Promise<{
    is_error: boolean;
    message: string;
    data?: StudentActivityItem;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to update student activity',
            };
        }
        return {
            is_error: false,
            message: 'Student activity updated successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while updating student activity',
        };
    }
}

export async function deleteStudentActivity(id: string): Promise<{
    is_error: boolean;
    message: string;
}> {
    if (!id) return { is_error: true, message: 'Missing ID' };
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/student-activities/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to delete student activity',
            };
        }
        return {
            is_error: false,
            message: data.message || 'Student activity deleted successfully',
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while deleting student activity',
        };
    }
}

export async function toggleStudentActivityLock(id: string, currentLockState: boolean): Promise<{
    is_error: boolean;
    message: string;
    data?: StudentActivityItem;
}> {
    return updateStudentActivity(id, { is_lock: !currentLockState });
}

export async function downloadActivityPlanPdf(activityId: string, filename = 'KRS.pdf'): Promise<boolean> {
    const blob = await printActivityPlan(activityId);
    if (!blob) return false;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
}

export async function downloadActivityResultPdf(activityId: string, filename = 'KHS.pdf'): Promise<boolean> {
    const blob = await printActivityResult(activityId);
    if (!blob) return false;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    return true;
}