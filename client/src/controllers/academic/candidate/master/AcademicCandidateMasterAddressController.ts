import { getStorageItem } from "../../../../lib/storage";
import type { ContactMasterResidence } from "../../../../models/contact/master/Residence";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function storeAddress(id: string, data: ContactMasterResidence) {
    try {
        const payload = {
            ...data,
            residence_type_id: "00000000-0000-0000-0000-000000000000",
            residenceable_type: "App\\Models\\Person\\Master\\Individual",
            residenceable_id: "00000000-0000-0000-0000-000000000000"
        };
        const response = await fetch(`${server_api_url}contact/master/residences/store/candidate/${id}`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(payload), // Send form data as JSON
        });
        const responseData = await response.json();
        
        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to create address",
                errors: responseData.errors
            }
        }

        return {
            code: responseData.code || 200,
            message: responseData.message || "Address created successfully",
            data: responseData.data
        };
            
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}
