import { getStorageItem } from '~/lib/storage';
import { queryFetch } from '~/lib/queryFetch';

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
    start_date?: string | null;
    end_date?: string | null;
    unit_id: string;
    unit_name?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    feeder_id?: string | null;
}

export async function listGrades(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    code?: string;
    unit_id?: string;
    institution_id?: string;
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
        if (queryParams?.code) params.set('code', queryParams.code);
        if (queryParams?.unit_id) params.set('unit_id', queryParams.unit_id);
        if (queryParams?.institution_id) params.set('institution_id', queryParams.institution_id);

        const res = await queryFetch(`${getBaseUrl()}/academic/campaign/transaction/grades?${params.toString()}`, {
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

export async function getGradeById(id: string): Promise<GradeItem | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/grades/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching grade ${id}:`, err);
        return null;
    }
}

export async function getGradesByUnit(unitId: string): Promise<GradeItem[]> {
    if (!unitId || unitId === '00000000-0000-0000-0000-000000000000') return [];
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/grades/unit/${unitId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) {
            console.warn(`Failed to fetch grades for unit ${unitId}: ${res.status}`);
            return [];
        }
        const json = await res.json();
        return Array.isArray(json) ? json : (json.data || []);
    } catch (err) {
        console.warn(`Error fetching grades for unit ${unitId}:`, err);
        return [];
    }
}

export async function createGrade(payload: Partial<GradeItem>): Promise<{
    success: boolean;
    data?: GradeItem;
    message?: string;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/grades`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data.message || 'Gagal menambahkan skala nilai' };
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
}

export async function updateGrade(id: string, payload: Partial<GradeItem>): Promise<{
    success: boolean;
    data?: GradeItem;
    message?: string;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/grades/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data.message || 'Gagal memperbarui skala nilai' };
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
}

export async function deleteGrade(id: string): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/grades/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data.message || 'Gagal menghapus skala nilai' };
        }
        return { success: true, message: data.message || 'Skala nilai berhasil dihapus' };
    } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
}
