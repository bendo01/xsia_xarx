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

export interface ClassCodeItem {
    id: string;
    code?: number | null;
    alphabet_code?: string | null;
    name: string;
    activity_id: string;
    start_effective_date?: string | null;
    end_effective_date?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    unit_id?: string | null;
    capacity?: number | null;
    unit_name?: string | null;
    activity_name?: string | null;
}

export async function listClassCodes(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    code?: string;
    unit_id?: string;
    institution_id?: string;
    activity_id?: string;
}): Promise<{
    data: ClassCodeItem[];
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
        if (queryParams?.code) params.set('code', queryParams.code);
        if (queryParams?.unit_id) params.set('unit_id', queryParams.unit_id);
        if (queryParams?.institution_id) params.set('institution_id', queryParams.institution_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes?${params.toString()}`, {
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
        console.warn('Error fetching class codes list:', err);
        return { data: [], total: 0, page: 1, page_size: 10, total_pages: 0 };
    }
}

export async function getClassCodeById(id: string): Promise<ClassCodeItem | null> {
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

export async function createClassCode(payload: Partial<ClassCodeItem>): Promise<{
    success: boolean;
    data?: ClassCodeItem;
    message?: string;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data.message || 'Gagal menambahkan kode kelas' };
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
}

export async function updateClassCode(id: string, payload: Partial<ClassCodeItem>): Promise<{
    success: boolean;
    data?: ClassCodeItem;
    message?: string;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes/${id}`, {
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data.message || 'Gagal memperbarui kode kelas' };
        }
        return { success: true, data };
    } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
}

export async function deleteClassCode(id: string): Promise<{ success: boolean; message?: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes/${id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const data = await res.json();
        if (!res.ok) {
            return { success: false, message: data.message || 'Gagal menghapus kode kelas' };
        }
        return { success: true, message: data.message || 'Kode kelas berhasil dihapus' };
    } catch (err: any) {
        return { success: false, message: err.message || 'Terjadi kesalahan sistem' };
    }
}
