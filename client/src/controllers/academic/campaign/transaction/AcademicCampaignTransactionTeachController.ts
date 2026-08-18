const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
import { getStorageItem } from "../../../../lib/storage";

export async function academicCampaignTransactionTeachList(unit_activity_id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/campaign/transaction/teaches/list_by_unit_activity/${unit_activity_id}`, {
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
                message: "Gagal mengambil detail aktivitas kuliah"
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