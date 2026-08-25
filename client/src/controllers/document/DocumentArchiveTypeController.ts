import type { TypePaginationForm, TypePaginationResponse } from '~/lib/types';
import type { DocumentArchiveType } from '~/models/document/ArchiveType';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'document/reference/archive-types';

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

export async function DocumentArchiveTypeControllerIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<DocumentArchiveType>> {
    try {
        const params = new URLSearchParams();
        if (props.page) params.append('page', props.page.toString());
        if (props.per_page) params.append('page_size', props.per_page.toString());
        if (props.search) params.append('name', props.search);
        if (props.name) params.append('name', props.name);
        if (props.code !== undefined && props.code !== null && !isNaN(Number(props.code))) {
            params.append('code', props.code.toString());
        }

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
        console.error('Error in DocumentArchiveTypeControllerIndex:', e);
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

export async function DocumentArchiveTypeControllerUpsert(
    form: { id?: string | null; code?: number | string | null; alphabet_code?: string | null; name: string },
): Promise<{ is_error: boolean; message: string; data?: DocumentArchiveType }> {
    try {
        const isUpdate = Boolean(form.id && form.id !== '' && form.id !== '00000000-0000-0000-0000-000000000000');
        const url = isUpdate
            ? `${getBaseUrl()}/${path}/${form.id}`
            : `${getBaseUrl()}/${path}`;
        const method = isUpdate ? 'PUT' : 'POST';

        const payload: Record<string, any> = {
            code: form.code !== null && form.code !== undefined && !isNaN(Number(form.code)) ? Number(form.code) : 1,
            alphabet_code: form.alphabet_code || '',
            name: form.name,
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
                message: resJson.message || resJson.brief || (isUpdate ? 'Failed to update archive type.' : 'Failed to create archive type.'),
            };
        }

        return {
            is_error: false,
            message: isUpdate ? 'Archive type updated successfully.' : 'Archive type created successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving archive type.',
        };
    }
}

export async function DocumentArchiveTypeControllerDelete(
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
                message: resJson.message || resJson.brief || 'Failed to delete archive type.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Archive type deleted successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while deleting archive type.',
        };
    }
}

export async function DocumentArchiveTypeControllerList(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/options`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const resData = await res.json().catch(() => ({}));
        if (!res.ok) {
            // fallback to index if options endpoint not available
            const indexRes = await fetch(`${getBaseUrl()}/${path}?page=1&page_size=1000`, {
                method: 'GET',
                headers: getHeaders(),
            });
            const indexData = await indexRes.json().catch(() => ({}));
            const list = Array.isArray(indexData.data) ? indexData.data : (Array.isArray(indexData) ? indexData : []);
            const items: ModelSelectItem[] = list.map((item: any) => ({
                id: item.id,
                value: item.id,
                label: item.name || item.alphabet_code || String(item.id),
            }));
            return { code: 200, message: items };
        }
        const list = Array.isArray(resData.data) ? resData.data : (Array.isArray(resData) ? resData : []);
        const items: ModelSelectItem[] = list.map((item: any) => ({
            id: item.id || item.value,
            value: item.id || item.value,
            label: item.name || item.label || item.alphabet_code || String(item.id),
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
