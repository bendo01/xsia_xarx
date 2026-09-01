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

export interface CampaignActivityItem {
    id: string;
    name: string;
    unit_id: string;
    academic_year_id: string;
    week_quantity?: number;
    student_target?: number;
    candidate_number?: number;
    candidate_pass?: number;
    became_student?: number;
    transfer_student?: number;
    total_class_member?: number;
    start_date?: string | null;
    end_date?: string | null;
    start_transaction?: string | null;
    end_transaction?: string | null;
    is_active?: boolean;
    feeder_id?: string | null;
}

export async function listActivities(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
}): Promise<{
    data: CampaignActivityItem[];
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

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/activities?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!res.ok) {
            return { data: [], total: 0, page: 1, page_size: 10, total_pages: 0 };
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
        console.warn('Error fetching activities list:', err);
        return { data: [], total: 0, page: 1, page_size: 10, total_pages: 0 };
    }
}

export async function getActivityById(id: string): Promise<CampaignActivityItem | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/activities/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching activity ${id}:`, err);
        return null;
    }
}

export async function academicCampaignTransactionActivityShow(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/campaign/transaction/activities/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: 'Gagal mengambil detail aktivitas transaksi',
            };
        }

        return {
            code: 200,
            message: data,
        };
    } catch (error) {
        return {
            code: 500,
            message: 'Internal server error',
        };
    }
}
