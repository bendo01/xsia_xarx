import { getStorageItem } from "../../../lib/storage";

export interface SummaryData {
    total_unit: number;
    total_student: number;
    total_lecturer: number;
    total_course: number;
    total_alumni: number;
}

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";

export async function getSummaryData(): Promise<{
    code: number;
    message: string | SummaryData;
}> {
    const institution_id = import.meta.env.VITE_INSTITUTION_ID ?? "00000000-0000-0000-0000-000000000000";
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}institution/master/institutions/${institution_id}/summary`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Summary"
            };
        }

        const data: SummaryData = await response.json();
        return {
            code: 200,
            message: data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}

export async function list(search: string = "") {
    try {
        const response = await fetch(`${server_api_url}institution/master/institutions/list?search=${search}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return [];
    }
}
