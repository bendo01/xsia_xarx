import type { ModelSelectItem } from "~/models/common/select/ModelSelectItem";

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "");
const path = "educations";

export async function LiterateEducationControllerList(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/${path}/options`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({}),
        });

        if (response.ok) {
            const resData = await response.json();
            if (Array.isArray(resData) && resData.length > 0) {
                const items: ModelSelectItem[] = resData.map((item: any) => ({
                    id: item.id,
                    value: item.id,
                    label: item.name,
                }));
                return {
                    code: 200,
                    message: items,
                };
            }
        }

        // Fallback to GET /educations?page=1&page_size=1000
        const fallbackRes = await fetch(`${getBaseUrl()}/${path}?page=1&page_size=1000`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const fallbackData = await fallbackRes.json();

        if (!fallbackRes.ok) {
            return {
                code: fallbackRes.status || 500,
                message: "Failed to fetch education list",
            };
        }

        const items: ModelSelectItem[] = (fallbackData.data || []).map((item: any) => ({
            id: item.id,
            value: item.id,
            label: item.name
                ? `${item.name}${item.abbreviation ? ` (${item.abbreviation})` : item.alphabet_code ? ` (${item.alphabet_code})` : ''}`
                : (item.abbreviation || item.alphabet_code || item.code),
        }));

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

export async function fetchEducationOptions(): Promise<ModelSelectItem[]> {
    const res = await LiterateEducationControllerList();
    if (typeof res.message !== "string" && Array.isArray(res.message)) {
        return res.message;
    }
    return [];
}
