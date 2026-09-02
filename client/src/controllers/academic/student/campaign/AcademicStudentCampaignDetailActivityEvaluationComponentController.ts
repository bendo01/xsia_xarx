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

export interface DetailActivityEvaluationComponentItem {
    id: string;
    name?: string | null;
    detail_activity_id: string;
    course_evaluation_planning_id: string;
    mark?: number | null;
    percentage?: number | null;
    total?: number | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export async function listDetailActivityEvaluationComponents(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    detail_activity_id?: string;
    course_evaluation_planning_id?: string;
}): Promise<{
    data: DetailActivityEvaluationComponentItem[];
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
        if (queryParams?.detail_activity_id) params.set('detail_activity_id', queryParams.detail_activity_id);
        if (queryParams?.course_evaluation_planning_id) params.set('course_evaluation_planning_id', queryParams.course_evaluation_planning_id);

        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activity-evaluation-components?${params.toString()}`, {
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
            page_size: json.page_size || 100,
            total_pages: json.total_pages || 1,
        };
    } catch (err) {
        console.warn('Error fetching detail activity evaluation components:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 100,
            total_pages: 0,
        };
    }
}

export async function getDetailActivityEvaluationComponent(id: string): Promise<DetailActivityEvaluationComponentItem | null> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activity-evaluation-components/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function createDetailActivityEvaluationComponent(payload: {
    name?: string;
    detail_activity_id: string;
    course_evaluation_planning_id: string;
    mark?: number;
    percentage?: number;
    total?: number;
}): Promise<{ is_error: boolean; message: string; data?: DetailActivityEvaluationComponentItem }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activity-evaluation-components`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                name: payload.name || '',
                detail_activity_id: payload.detail_activity_id,
                course_evaluation_planning_id: payload.course_evaluation_planning_id,
                mark: payload.mark ?? 0,
                percentage: payload.percentage ?? 0,
                total: payload.total ?? 0,
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to create evaluation component',
            };
        }

        return {
            is_error: false,
            message: 'Evaluation component created successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while creating evaluation component',
        };
    }
}

export async function updateDetailActivityEvaluationComponent(
    id: string,
    payload: {
        name?: string;
        detail_activity_id?: string;
        course_evaluation_planning_id?: string;
        mark?: number;
        percentage?: number;
        total?: number;
    }
): Promise<{ is_error: boolean; message: string; data?: DetailActivityEvaluationComponentItem }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activity-evaluation-components/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to update evaluation component',
            };
        }

        return {
            is_error: false,
            message: 'Evaluation component updated successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while updating evaluation component',
        };
    }
}

export async function deleteDetailActivityEvaluationComponent(id: string): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/campaign/detail-activity-evaluation-components/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to delete evaluation component',
            };
        }
        return {
            is_error: false,
            message: 'Evaluation component deleted successfully',
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while deleting evaluation component',
        };
    }
}
