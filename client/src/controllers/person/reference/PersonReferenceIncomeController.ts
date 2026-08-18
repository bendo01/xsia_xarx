import type { ModelSelectItem } from "../../../models/common/select/ModelSelectItem";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function PersonReferenceControllerIncomeList(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const response = await fetch(`${server_api_url}person/reference/incomes/list`, {
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
                message: "Gagal Mengambil Data Income"
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
