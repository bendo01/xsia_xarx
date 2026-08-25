import type { TypePaginationForm, TypePaginationResponse } from '~/lib/types';
import type { LocationRegency } from '~/models/location/Regency';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'regencies';

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

export async function LocationRegencyControllerIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<LocationRegency>> {
    try {
        const params = new URLSearchParams();
        if (props.page) params.append('page', props.page.toString());
        if (props.per_page) params.append('page_size', props.per_page.toString());
        if (props.search) params.append('name', props.search);
        if (props.name) params.append('name', props.name);
        if (props.code) params.append('code', props.code.toString());
        if (props.province_id) params.append('province_id', props.province_id);

        const res = await fetch(`${getBaseUrl()}/${path}?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resJson = await res.json();
        return {
            pagination: {
                search: props.search || '',
                sort_by: props.sort_by || '',
                column: props.column || '',
                sort_dir: props.sort_dir || '',
                page: resJson.page || props.page || 1,
                per_page: resJson.page_size || props.per_page || 10,
                total_page: resJson.total_pages || 0,
                last_page: resJson.total_pages || 1,
                total_data: resJson.total ?? (Array.isArray(resJson.data) ? resJson.data.length : 0),
            },
            data: Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : []),
        };
    } catch (e) {
        console.error('Error in LocationRegencyControllerIndex:', e);
        return {
            pagination: {
                search: props.search || '',
                sort_by: props.sort_by || '',
                column: props.column || '',
                sort_dir: props.sort_dir || '',
                page: props.page || 1,
                per_page: props.per_page || 10,
                total_page: 0,
                last_page: 1,
                total_data: 0,
            },
            data: [],
        };
    }
}

export async function LocationRegencyControllerUpsert(
    form: {
        id?: string | null;
        code?: string | null;
        name: string;
        dikti_code?: string | null;
        epsbed_code?: string | null;
        province_id: string;
        regency_type_id: string;
        description?: string | null;
        slug?: string | null;
    },
): Promise<{ is_error: boolean; message: string; data?: LocationRegency }> {
    try {
        const isUpdate = Boolean(form.id && form.id !== '' && form.id !== '00000000-0000-0000-0000-000000000000');
        const url = isUpdate
            ? `${getBaseUrl()}/${path}/${form.id}`
            : `${getBaseUrl()}/${path}`;
        const method = isUpdate ? 'PUT' : 'POST';

        const payload: Record<string, any> = {
            code: form.code || null,
            name: form.name,
            dikti_code: form.dikti_code || null,
            epsbed_code: form.epsbed_code || null,
            province_id: form.province_id,
            regency_type_id: form.regency_type_id,
            description: form.description || null,
            slug: form.slug || null,
        };

        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || (isUpdate ? 'Failed to update regency.' : 'Failed to create regency.'),
            };
        }

        return {
            is_error: false,
            message: isUpdate ? 'Regency updated successfully.' : 'Regency created successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving regency.',
        };
    }
}

export async function LocationRegencyControllerDelete(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/${props.id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || 'Failed to delete regency.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Regency deleted successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while deleting regency.',
        };
    }
}

export async function getRegencyLists(province_id?: string): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const params = new URLSearchParams();
        params.append('page', '1');
        params.append('page_size', '1000');
        if (province_id) params.append('province_id', province_id);

        const res = await fetch(`${getBaseUrl()}/${path}?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                code: res.status || 500,
                message: 'Failed to fetch regencies',
            };
        }
        const list = Array.isArray(resData.data) ? resData.data : (Array.isArray(resData) ? resData : []);
        const items: ModelSelectItem[] = list.map((item: any) => ({
            id: item.id,
            value: item.id,
            label: item.name || item.code || String(item.id),
        }));
        return {
            code: 200,
            message: items,
        };
    } catch (error: any) {
        return {
            code: 500,
            message: error?.message || 'Internal server error',
        };
    }
}

export const LocationRegencyControllerList = getRegencyLists;