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

export interface DetailActivityItem {
    id: string;
    mark?: number | null;
    credit?: number | null;
    grade_id?: string | null;
    course_id: string;
    activity_id: string;
    teach_id?: string | null;
    is_lock?: boolean;
    created_at?: string;
    updated_at?: string;
    name?: string | null;
    feeder_grade_id?: string | null;
    curiculum_detail_sequence?: number;
    // Enhanced info
    course_name?: string;
    course_code?: string;
    class_name?: string;
    lecturer_code?: string;
    lecturer_name?: string;
    lecturers?: (string | { code?: string; name: string })[];
    grade_letter?: string;
    grade_point?: number;
    // Nested relation data from backend
    grade?: any;
    course?: any;
    teach?: any;
    teach_lecturers?: any[];
}

export async function listDetailActivities(queryParams?: {
    page?: number;
    page_size?: number;
    activity_id?: string;
    course_id?: string;
    teach_id?: string;
    name?: string;
}): Promise<{
    data: DetailActivityItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}> {
    try {
        const params = new URLSearchParams();
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.page_size) params.set('page_size', String(queryParams.page_size || 100));
        if (queryParams?.name) params.set('name', queryParams.name);
        if (queryParams?.activity_id) params.set('activity_id', queryParams.activity_id);
        if (queryParams?.course_id) params.set('course_id', queryParams.course_id);
        if (queryParams?.teach_id) params.set('teach_id', queryParams.teach_id);

        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activities?${params.toString()}`, {
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
        console.warn('Error fetching detail activities list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };
    }
}

export async function createDetailActivity(payload: {
    name?: string;
    credit?: number;
    course_id: string;
    activity_id: string;
    teach_id?: string;
}): Promise<{
    is_error: boolean;
    message: string;
    data?: DetailActivityItem;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activities`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: payload.name || '',
                credit: payload.credit || 3,
                course_id: payload.course_id,
                activity_id: payload.activity_id,
                teach_id: payload.teach_id || '00000000-0000-0000-0000-000000000000',
                grade_id: '00000000-0000-0000-0000-000000000000',
                feeder_grade_id: '00000000-0000-0000-0000-000000000000',
                curiculum_detail_sequence: 0,
                mark: 0,
                is_lock: false,
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to enroll course',
            };
        }

        return {
            is_error: false,
            message: 'Course enrolled successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while enrolling course',
        };
    }
}

export async function getDetailActivity(id: string): Promise<DetailActivityItem | null> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activities/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function updateDetailActivity(
    id: string,
    payload: {
        mark?: number | null;
        credit?: number | null;
        grade_id?: string | null;
        course_id?: string;
        activity_id?: string;
        teach_id?: string | null;
        is_lock?: boolean | null;
        name?: string | null;
        feeder_grade_id?: string | null;
        curiculum_detail_sequence?: number;
    }
): Promise<{ is_error: boolean; message: string; data?: DetailActivityItem }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activities/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to update detail activity',
            };
        }

        return {
            is_error: false,
            message: 'Detail activity updated successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while updating detail activity',
        };
    }
}

export async function deleteDetailActivity(id: string): Promise<{
    is_error: boolean;
    message: string;
}> {
    if (!id) return { is_error: true, message: 'Missing ID' };
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activities/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to drop course',
            };
        }
        return {
            is_error: false,
            message: 'Course dropped successfully',
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while dropping course',
        };
    }
}

export async function academicStudentCampaignDetailActivityAttend(student_activity_id: string, teach_id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/student/campaign/detail_activities/attend`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                student_activity_id,
                teach_id,
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: data,
            };
        }
        return { code: 200, message: data };
    } catch (error) {
        return { code: 500, message: 'Internal server error' };
    }
}

export async function academicStudentCampaignDetailActivityDelete(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    return deleteDetailActivity(id).then(r => ({
        code: r.is_error ? 500 : 200,
        message: r.message,
    }));
}