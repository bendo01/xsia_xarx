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
    activity_id?: string;
    teach_decree_id?: string;
    course_id?: string;
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
        if (queryParams?.activity_id) params.set('activity_id', queryParams.activity_id);
        if (queryParams?.teach_decree_id) params.set('teach_decree_id', queryParams.teach_decree_id);
        if (queryParams?.course_id) params.set('course_id', queryParams.course_id);

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

export async function getCourseById(id: string): Promise<any | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/course/master/courses/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching course ${id}:`, err);
        return null;
    }
}

export async function getClassCodeById(id: string): Promise<any | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching class code ${id}:`, err);
        return null;
    }
}

export async function listCourses(queryParams?: { page?: number; page_size?: number; name?: string; code?: string; unit_id?: string }): Promise<any[]> {
    try {
        const params = new URLSearchParams();
        const size = queryParams?.page_size || 500;
        params.set('page_size', String(size));
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.name) params.set('name', queryParams.name);
        if (queryParams?.code) params.set('code', queryParams.code);
        if (queryParams?.unit_id) params.set('unit_id', queryParams.unit_id);

        const res = await fetch(`${getBaseUrl()}/academic/course/master/courses?${params.toString()}`, {
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

export async function listTeachDecrees(queryParams?: { page?: number; page_size?: number; activity_id?: string }): Promise<any[]> {
    try {
        const params = new URLSearchParams();
        const size = queryParams?.page_size || 200;
        params.set('page_size', String(size));
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.activity_id) params.set('activity_id', queryParams.activity_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-decrees?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching teach decrees:', err);
        return [];
    }
}

export async function listClassCodes(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching class codes:', err);
        return [];
    }
}

export async function listTeachLecturers(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-lecturers?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching teach lecturers:', err);
        return [];
    }
}

export async function listSchedules(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/schedules?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching schedules:', err);
        return [];
    }
}

export async function listLecturers(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/lecturer/master/lecturers?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching lecturers:', err);
        return [];
    }
}

export async function listRooms(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/building/master/rooms?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching rooms:', err);
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