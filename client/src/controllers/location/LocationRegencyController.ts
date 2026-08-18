import type { TypePaginationForm } from "../../lib/types";
import type { ModelSelectItem } from "../../models/common/select/ModelSelectItem";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "locations/regency";

import type { ModelLocationRegencyWithRelationPaginationResponse } from "../../models/pagination/ModelPagination";

export async function LocationRegencyIndex(pagination : TypePaginationForm): Promise<ModelLocationRegencyWithRelationPaginationResponse> {
    try {
        const response = await fetch(`${server_api_url}${path}`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                // Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(pagination), // Send form data as JSON
        });
        const response_data: ModelLocationRegencyWithRelationPaginationResponse = await response.json();
        return response_data;
    }
    catch (error) {
        // console.error("Error:", error);
        return {
            pagination: {
                search: "",
                sort_by: "",
                column: "",
                sort_dir: "",
                page: 1,
                per_page: 10,
                total_page: 0,
                last_page: 1,
                total_data: 0,
            },
            data: [],
        }
    }
}

export async function getRegencyLists(province_id: string): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    if (province_id) {
        try {
            const response = await fetch(`${server_api_url}locations/regency/list_by_province/${province_id}`, {
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
                    message: "Gagal Mengambil Data Kabupaten"
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

    return {
        code: 500,
        message: "Isikan Id Propinsi"
    };
    
}