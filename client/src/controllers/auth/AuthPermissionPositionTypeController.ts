import type { PermissionPositionType } from '~/models/auth/PermissionPositionType';
import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'permission-position-type';

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

export async function AuthPermissionPositionTypeControllerByPositionType(positionTypeId: string): Promise<PermissionPositionType[]> {
    const pageSize = 1000;
    const all: PermissionPositionType[] = [];
    let page = 1;
    let totalPages = 1;
    do {
        const params = new URLSearchParams({
            page: page.toString(),
            page_size: pageSize.toString(),
            position_type_id: positionTypeId,
        });
        const res = await fetch(`${getBaseUrl()}/${path}?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const resJson = await res.json();
        all.push(...(Array.isArray(resJson.data) ? resJson.data : []));
        totalPages = resJson.total_pages || 1;
        page++;
    } while (page <= totalPages);
    return all;
}

export async function AuthPermissionPositionTypeControllerCreate(
    form: { position_type_id: string; permission_id: string },
): Promise<{ is_error: boolean; message: string; data?: PermissionPositionType }> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(form),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || 'Failed to assign permission to position type.',
            };
        }
        return {
            is_error: false,
            message: 'Permission assigned to position type successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving assignment.',
        };
    }
}

export async function AuthPermissionPositionTypeControllerDelete(
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
                message: resJson.message || resJson.brief || 'Failed to remove permission from position type.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Permission removed from position type successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while removing assignment.',
        };
    }
}
