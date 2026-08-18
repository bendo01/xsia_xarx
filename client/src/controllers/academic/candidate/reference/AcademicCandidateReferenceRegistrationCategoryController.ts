import type { ModelSelectItem } from "../../../../models/common/select/ModelSelectItem";

export async function getRegistrationCategoryLists(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
    try {
        const response = await fetch(`${server_api_url}academic/candidate/reference/registration_categories`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });
        const data: ModelSelectItem[] = await response.json();
        
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Program Studi"
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
