import type { ModelSelectItem } from "../../models/common/select/ModelSelectItem";

export async function getProvinceLists(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/province/list`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            }
        });
        const data: ModelSelectItem[] = await response.json();
        
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Propinsi"
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