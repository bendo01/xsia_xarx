const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
import { getStorageItem } from "../../lib/storage";

export interface StatusDistribution {
    status_name: string;
    count: number;
}

export interface GenerationDistribution {
    generation: number;
    count: number;
}

export interface DashboardStats {
    student_status_distribution: StatusDistribution[];
    student_generation_distribution: GenerationDistribution[];
}

export async function academicInstitutionDashboardIndex(): Promise<{
    code: number;
    message: string | DashboardStats;
}> {
    const institution_id = import.meta.env.VITE_INSTITUTION_ID ?? "00000000-0000-0000-0000-000000000000";
    try {
        const response = await fetch(`${server_api_url}academic/dashboard/institution/${institution_id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal mengambil data dashboard"
            };
        }

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
