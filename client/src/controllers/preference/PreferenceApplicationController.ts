import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'preference/application';

export interface PreferenceApplication {
    is_llm_enable: boolean;
}

type Result<T> = { is_error: false; message: string; data: T } | { is_error: true; message: string; data?: undefined };

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
    const token = getStorageItem('token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
};

const request = async (method: 'GET' | 'PUT', body?: PreferenceApplication): Promise<Result<PreferenceApplication>> => {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}`, {
            method,
            headers: getHeaders(),
            body: body ? JSON.stringify(body) : undefined,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return { is_error: true, message: data?.brief || data?.message || 'Request failed' };
        return { is_error: false, message: '', data: data as PreferenceApplication };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error' };
    }
};

export const PreferenceApplicationShow = () => request('GET');
export const PreferenceApplicationUpdate = (payload: PreferenceApplication) => request('PUT', payload);
