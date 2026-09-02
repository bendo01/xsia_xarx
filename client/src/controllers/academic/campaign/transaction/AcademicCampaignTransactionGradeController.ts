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

export interface GradeItem {
    id: string;
    code?: number | null;
    alphabet_code?: string | null;
    name: string;
    grade: number;
    minimum: number;
    maximum: number;
    unit_id: string;
}

export async function listGrades(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    unit_id?: string;
}): Promise<{
    data: GradeItem[];
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
        if (queryParams?.unit_id) params.set('unit_id', queryParams.unit_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/grades?${params.toString()}`, {
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
        console.warn('Error fetching grades list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 50,
            total_pages: 0,
        };
    }
}
