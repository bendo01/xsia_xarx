import type { ModelSelectItem } from "../../../../models/common/select/ModelSelectItem";
import { getStorageItem } from "../../../../lib/storage";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";

export async function getFinanceLists(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    
    try {
        const response = await fetch(`${server_api_url}academic/student/reference/finances/list`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data: ModelSelectItem[] = await response.json();
        
        if (!response.ok) {
            return {
                code: response.status || 500,
                    message: "Gagal Mengambil Data Keuangan Mahasiswa"
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
