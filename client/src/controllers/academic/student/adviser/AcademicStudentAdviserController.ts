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

export interface CounsellorItem {
    id: string;
    decree_id: string;
    student_id: string;
    lecturer_id: string;
    created_at?: string;
    updated_at?: string;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string;
    updated_by?: string;
    // Enriched fields
    lecturer_name?: string;
    lecturer_nidn?: string;
    lecturer_email?: string;
    decree_number?: string;
    decree_date?: string;
    student_name?: string;
    student_code?: string;
    role_type?: 'Academic Advisor (PA)' | 'Thesis Supervisor' | 'Field Counselor';
    notes?: string;
}

export interface DecreeItem {
    id: string;
    decree_date: string;
    decree_number: string;
    unit_id: string;
    staff_id?: string;
    created_at?: string;
    updated_at?: string;
}

export async function listCounsellors(queryParams?: {
    page?: number;
    page_size?: number;
    student_id?: string;
    lecturer_id?: string;
}): Promise<{
    data: CounsellorItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}> {
    try {
        const params = new URLSearchParams();
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.page_size) params.set('page_size', String(queryParams.page_size));

        const res = await fetch(`${getBaseUrl()}/academic/student/adviser/counsellors?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error(`Failed to fetch counsellors: ${res.status}`);
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
        console.warn('Error in listCounsellors:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };
    }
}

export async function listDecrees(): Promise<DecreeItem[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/adviser/decrees`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching decrees:', err);
        return [];
    }
}

export async function listFinalAssignmentAdvisers(): Promise<any[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/final_assignment/transaction/advisers`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching final assignment advisers:', err);
        return [];
    }
}
