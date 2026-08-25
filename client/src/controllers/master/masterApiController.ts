import { getStorageItem } from "../../lib/storage";
import type { TypePaginationForm } from "../../lib/types";

export const getBaseApiUrl = () => {
    const envUrl = import.meta.env.VITE_API_SERVER_URL;
    if (envUrl) {
        return envUrl.replace(/\/+$/, "");
    }
    return "http://127.0.0.1:5800/api/v1";
};

export const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    if (typeof window !== "undefined") {
        const token = getStorageItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return headers;
};

export interface MasterPaginationResponse<T = any> {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
    data: T[];
    pagination?: {
        page: number;
        per_page: number;
        total_data: number;
        total_page: number;
    };
}

export async function masterApiIndex<T = any>(
    apiPath: string,
    params: TypePaginationForm = { page: 1, per_page: 10 }
): Promise<MasterPaginationResponse<T>> {
    try {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.set("page", String(params.page));
        if (params.per_page) queryParams.set("page_size", String(params.per_page));
        if (params.search) queryParams.set("search", params.search);
        if (params.name) queryParams.set("name", params.name);
        if (params.code !== undefined && params.code !== null && params.code !== "") {
            queryParams.set("code", String(params.code));
        }
        if (params.sort_by) queryParams.set("sort_by", params.sort_by);
        if (params.sort_dir) queryParams.set("sort_dir", params.sort_dir);

        const url = `${getBaseApiUrl()}/${apiPath.replace(/^\/+/, "")}?${queryParams.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const resJson = await response.json();
        
        const rawData = Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : []);
        const total = resJson.total ?? resJson.pagination?.total_data ?? rawData.length;
        const page = resJson.page ?? resJson.pagination?.page ?? params.page ?? 1;
        const pageSize = resJson.page_size ?? resJson.pagination?.per_page ?? params.per_page ?? 10;
        const totalPages = resJson.total_pages ?? resJson.pagination?.total_page ?? Math.max(1, Math.ceil(total / (pageSize || 1)));

        return {
            page,
            page_size: pageSize,
            total,
            total_pages: totalPages,
            data: rawData,
            pagination: {
                page,
                per_page: pageSize,
                total_data: total,
                total_page: totalPages,
            }
        };
    } catch (error) {
        console.error(`Error fetching master index for ${apiPath}:`, error);
        return {
            page: params.page || 1,
            page_size: params.per_page || 10,
            total: 0,
            total_pages: 1,
            data: [],
            pagination: {
                page: params.page || 1,
                per_page: params.per_page || 10,
                total_data: 0,
                total_page: 1,
            }
        };
    }
}

export async function masterApiShow<T = any>(apiPath: string, id: string): Promise<{ data: T | null; error?: string }> {
    try {
        const url = `${getBaseApiUrl()}/${apiPath.replace(/^\/+/, "")}/${encodeURIComponent(id)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}`);
        }

        const resJson = await response.json();
        const data = resJson.data ?? resJson;
        return { data };
    } catch (error: any) {
        console.error(`Error fetching master show for ${apiPath}/${id}:`, error);
        return { data: null, error: error.message || "Failed to load record" };
    }
}

export async function masterApiCreate<T = any>(apiPath: string, payload: any): Promise<{ data?: T; success: boolean; message: string; errors?: any }> {
    try {
        const url = `${getBaseApiUrl()}/${apiPath.replace(/^\/+/, "")}`;
        const response = await fetch(url, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        const resJson = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: resJson.message || `Failed with status ${response.status}`,
                errors: resJson.errors,
            };
        }

        return {
            success: true,
            message: resJson.message || "Record created successfully",
            data: resJson.data ?? resJson,
        };
    } catch (error: any) {
        console.error(`Error creating master record for ${apiPath}:`, error);
        return {
            success: false,
            message: error.message || "Internal network connection error",
        };
    }
}

export async function masterApiUpdate<T = any>(apiPath: string, id: string, payload: any): Promise<{ data?: T; success: boolean; message: string; errors?: any }> {
    try {
        const url = `${getBaseApiUrl()}/${apiPath.replace(/^\/+/, "")}/${encodeURIComponent(id)}`;
        const response = await fetch(url, {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });

        const resJson = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: resJson.message || `Failed with status ${response.status}`,
                errors: resJson.errors,
            };
        }

        return {
            success: true,
            message: resJson.message || "Record updated successfully",
            data: resJson.data ?? resJson,
        };
    } catch (error: any) {
        console.error(`Error updating master record for ${apiPath}/${id}:`, error);
        return {
            success: false,
            message: error.message || "Internal network connection error",
        };
    }
}

export async function masterApiDelete(apiPath: string, id: string): Promise<{ success: boolean; message: string }> {
    try {
        const url = `${getBaseApiUrl()}/${apiPath.replace(/^\/+/, "")}/${encodeURIComponent(id)}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: getAuthHeaders(),
        });

        const resJson = await response.json();
        if (!response.ok) {
            return {
                success: false,
                message: resJson.message || `Failed to delete with status ${response.status}`,
            };
        }

        return {
            success: true,
            message: resJson.message || "Record deleted successfully",
        };
    } catch (error: any) {
        console.error(`Error deleting master record for ${apiPath}/${id}:`, error);
        return {
            success: false,
            message: error.message || "Internal network connection error",
        };
    }
}
