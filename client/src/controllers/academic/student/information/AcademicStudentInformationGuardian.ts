import { getStorageItem } from "../../../../lib/storage";
import type { PersonMasterIndividual } from "../../../../models/person/master/Individual";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function candidateCreateGuardian(student_id: string, relative_type_id: string, data: PersonMasterIndividual) {
    try {
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const { id: _, ...payload } = data;
        const response = await fetch(`${server_api_url}person/master/individuals/store/student/${student_id}/relative_type/${relative_type_id}`, {
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
                message: responseData.message || "Failed to create guardian",
                errors: responseData.errors
            }
        }

        return {
            code: responseData.code || 200,
            message: responseData.message || "Guardian created successfully",
            data: responseData.data
        };

    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}