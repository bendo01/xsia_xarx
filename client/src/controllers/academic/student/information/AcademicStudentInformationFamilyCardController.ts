import { getStorageItem } from "../../../../lib/storage";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function familyCardCreate(id: string, code: string) {
    try {
        const response = await fetch(`${server_api_url}person/master/family_cards/store/student/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify({ code }),
        });
        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to create family card",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Family card created successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}
