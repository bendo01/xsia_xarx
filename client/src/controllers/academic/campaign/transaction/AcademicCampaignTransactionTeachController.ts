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

export interface TeachItem {
    id: string;
    name?: string | null;
    class_code_id: string;
    course_id: string;
    activity_id?: string | null;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    practice_start_date?: string | null;
    practice_end_date?: string | null;
    curriculum_detail_id?: string | null;
    teach_decree_id: string;
    is_lecturer_credit_sum_problem?: boolean;
    is_lock?: boolean;
    encounter_category_id?: string | null;
    scope_id?: string | null;
    created_at?: string;
    updated_at?: string;
    max_member?: number;
    feeder_id?: string | null;
    // Enhanced UI fields
    course_code?: string;
    course_name?: string;
    credits?: number;
    lecturer_name?: string;
    class_name?: string;
    schedule_time?: string;
    room_name?: string;
    enrolled_count?: number;
}

export async function listTeaches(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
}): Promise<{
    data: TeachItem[];
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

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teaches?${params.toString()}`, {
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
        console.warn('Error fetching teaches list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };
    }
}

export async function getTeachById(id: string): Promise<TeachItem | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teaches/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching teach ${id}:`, err);
        return null;
    }
}

export async function listCourses(): Promise<any[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/course/master/courses?page_size=100`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching courses:', err);
        return [];
    }
}

export async function academicCampaignTransactionTeachList(unit_activity_id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teaches`, {
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