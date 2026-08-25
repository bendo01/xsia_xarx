import type { TypePaginationForm, TypePaginationResponse } from '~/lib/types';
import type { LiterateEducation, TypeInputLiterateEducationForm } from '~/models/literate/Education';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'educations';

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

export async function LiterateEducationControllerIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<LiterateEducation>> {
    try {
        const params = new URLSearchParams();
        if (props.page) params.append('page', props.page.toString());
        if (props.per_page) params.append('page_size', props.per_page.toString());
        if (props.search) params.append('name', props.search);
        if (props.name) params.append('name', props.name);
        if (props.code !== undefined && props.code !== null && !isNaN(Number(props.code))) {
            params.append('code', props.code.toString());
        }
        if (props.level_id) params.append('level_id', props.level_id);
        if (props.group_id) params.append('group_id', props.group_id);
        if (props.category_id) params.append('category_id', props.category_id);
        if (props.variety_id) params.append('variety_id', props.variety_id);

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
        console.error('Error in LiterateEducationControllerIndex:', e);
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

export async function LiterateEducationControllerUpsert(
    form: TypeInputLiterateEducationForm,
): Promise<{ is_error: boolean; message: string; data?: LiterateEducation }> {
    try {
        const isUpdate = Boolean(form.id && form.id !== '' && form.id !== '00000000-0000-0000-0000-000000000000');
        const url = isUpdate
            ? `${getBaseUrl()}/${path}/${form.id}`
            : `${getBaseUrl()}/${path}`;
        const method = isUpdate ? 'PUT' : 'POST';

        const payload: Record<string, any> = {
            code: isNaN(Number(form.code)) ? form.code : Number(form.code),
            alphabet_code: form.alphabet_code || form.alphabetic_code || '',
            abbreviation: form.abbreviation,
            name: form.name,
            level_id: form.level_id,
            group_id: form.group_id,
            category_id: form.category_id,
            variety_id: form.variety_id,
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
                message: resJson.message || resJson.brief || (isUpdate ? 'Failed to update education.' : 'Failed to create education.'),
            };
        }

        return {
            is_error: false,
            message: isUpdate ? 'Education updated successfully.' : 'Education created successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving education.',
        };
    }
}

export async function LiterateEducationControllerDelete(
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
                message: resJson.message || resJson.brief || 'Failed to delete education.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Education deleted successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while deleting education.',
        };
    }
}

export async function fetchEducationOptions(): Promise<ModelSelectItem[]> {
    const headers = getHeaders();

    try {
        // 1. Try POST /educations/options
        const response = await fetch(`${getBaseUrl()}/${path}/options`, {
            method: 'POST',
            headers,
            body: JSON.stringify({}),
        });

        if (response.ok) {
            const resData = await response.json();
            const list = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
            if (list.length > 0) {
                return list.map((item: any) => ({
                    id: item.id,
                    value: item.id,
                    label: item.name || item.alphabet_code || item.code || String(item.id),
                }));
            }
        }

        // 2. Try GET /educations/options
        const getOptionsRes = await fetch(`${getBaseUrl()}/${path}/options`, {
            method: 'GET',
            headers,
        });

        if (getOptionsRes.ok) {
            const resData = await getOptionsRes.json();
            const list = Array.isArray(resData) ? resData : (Array.isArray(resData?.data) ? resData.data : []);
            if (list.length > 0) {
                return list.map((item: any) => ({
                    id: item.id,
                    value: item.id,
                    label: item.name || item.alphabet_code || item.code || String(item.id),
                }));
            }
        }

        // 3. Fallback: GET /educations?page=1&page_size=1000
        const fallbackRes = await fetch(`${getBaseUrl()}/${path}?page=1&page_size=1000`, {
            method: 'GET',
            headers,
        });

        if (fallbackRes.ok) {
            const fallbackData = await fallbackRes.json();
            const list = Array.isArray(fallbackData.data) ? fallbackData.data : (Array.isArray(fallbackData) ? fallbackData : []);
            if (list.length > 0) {
                return list.map((item: any) => ({
                    id: item.id,
                    value: item.id,
                    label: item.name
                        ? `${item.name}${item.abbreviation ? ` (${item.abbreviation})` : item.alphabet_code ? ` (${item.alphabet_code})` : ''}`
                        : (item.abbreviation || item.alphabet_code || item.code || String(item.id)),
                }));
            }
        }

        // 4. Fallback: GET /levels?page=1&page_size=1000
        const levelsRes = await fetch(`${getBaseUrl()}/levels?page=1&page_size=1000`, {
            method: 'GET',
            headers,
        });

        if (levelsRes.ok) {
            const levelsData = await levelsRes.json();
            const list = Array.isArray(levelsData.data) ? levelsData.data : (Array.isArray(levelsData) ? levelsData : []);
            if (list.length > 0) {
                return list.map((item: any) => ({
                    id: item.id,
                    value: item.id,
                    label: item.name
                        ? `${item.name}${item.alphabet_code ? ` (${item.alphabet_code})` : ''}`
                        : (item.alphabet_code || item.code || String(item.id)),
                }));
            }
        }

        return [];
    } catch (error) {
        console.error('Error fetching education options:', error);
        return [];
    }
}

export async function LiterateEducationControllerList(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const items = await fetchEducationOptions();
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
