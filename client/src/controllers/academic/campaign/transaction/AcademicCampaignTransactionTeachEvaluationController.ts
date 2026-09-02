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

export interface TeachEvaluationItem {
    id: string;
    thread?: number | null;
    name?: string | null;
    english_name?: string | null;
    evaluation_weight?: number | null;
    evaluation_type_id?: string | null;
    feeder_id?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    teach_id?: string | null;
}

export async function listTeachEvaluations(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    teach_id?: string;
}): Promise<{
    data: TeachEvaluationItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}> {
    try {
        const params = new URLSearchParams();
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.page_size) params.set('page_size', String(queryParams.page_size || 50));
        if (queryParams?.name) params.set('name', queryParams.name);
        if (queryParams?.teach_id) params.set('teach_id', queryParams.teach_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-evaluations?${params.toString()}`, {
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
            page_size: json.page_size || 50,
            total_pages: json.total_pages || 1,
        };
    } catch (err) {
        console.warn('Error fetching teach evaluations list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 50,
            total_pages: 0,
        };
    }
}

export async function getTeachEvaluation(id: string): Promise<TeachEvaluationItem | null> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-evaluations/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function createTeachEvaluation(payload: {
    thread?: number;
    name?: string;
    english_name?: string;
    evaluation_weight?: number;
    evaluation_type_id?: string;
    teach_id?: string;
}): Promise<{ is_error: boolean; message: string; data?: TeachEvaluationItem }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-evaluations`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                thread: payload.thread || 1,
                name: payload.name || '',
                english_name: payload.english_name || null,
                evaluation_weight: payload.evaluation_weight || 0,
                evaluation_type_id: payload.evaluation_type_id || null,
                feeder_id: null,
                teach_id: payload.teach_id || null,
            }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to create teach evaluation',
            };
        }

        return {
            is_error: false,
            message: 'Teach evaluation created successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while creating teach evaluation',
        };
    }
}

export async function updateTeachEvaluation(
    id: string,
    payload: {
        thread?: number;
        name?: string;
        english_name?: string;
        evaluation_weight?: number;
        evaluation_type_id?: string;
        teach_id?: string;
    }
): Promise<{ is_error: boolean; message: string; data?: TeachEvaluationItem }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-evaluations/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to update teach evaluation',
            };
        }

        return {
            is_error: false,
            message: 'Teach evaluation updated successfully',
            data,
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while updating teach evaluation',
        };
    }
}

export async function deleteTeachEvaluation(id: string): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-evaluations/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: data.message || data.brief || 'Failed to delete teach evaluation',
            };
        }
        return {
            is_error: false,
            message: 'Teach evaluation deleted successfully',
        };
    } catch (err: any) {
        return {
            is_error: true,
            message: err?.message || 'Network error while deleting teach evaluation',
        };
    }
}
