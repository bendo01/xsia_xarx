import type { ModelSelectItem } from "~/models/common/select/ModelSelectItem";
import { getStorageItem } from "~/lib/storage";

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "");
const path = "educations";

const getHeaders = (): Record<string, string> => {
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

export async function fetchEducationOptions(): Promise<ModelSelectItem[]> {
    const headers = getHeaders();

    try {
        // 1. Try POST /educations/options
        const response = await fetch(`${getBaseUrl()}/${path}/options`, {
            method: "POST",
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
            method: "GET",
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
            method: "GET",
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
            method: "GET",
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
        console.error("Error fetching education options:", error);
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
            message: error?.message || "Internal server error",
        };
    }
}
