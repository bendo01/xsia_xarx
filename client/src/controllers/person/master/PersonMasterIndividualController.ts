import { getStorageItem } from "../../../lib/storage";
import { PersonMasterIndividual } from "../../../models/person/master/Individual";
import type { TypePaginationForm } from "../../../lib/types";
import type { ModelPersonMasterIndividualPaginationResponse } from "../../../models/pagination/ModelPagination";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "person/master/individuals";

export async function index(pagination: TypePaginationForm) {
    try {
        const response = await fetch(`${server_api_url}${path}`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(pagination), // Send form data as JSON
        });
        const response_data: ModelPersonMasterIndividualPaginationResponse = await response.json();
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

export async function store(data: PersonMasterIndividual) {
    try {
        const response = await fetch(`${server_api_url}${path}/store`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to store individual",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Individual stored successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function update(id: string, data: PersonMasterIndividual) {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(data),
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to update individual",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Individual updated successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function show(id: string) {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to show individual",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Individual shown successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function destroy(id: string) {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
        });

        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to destroy individual",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Individual destroyed successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function list(search: string = "") {
    try {
        const response = await fetch(`${server_api_url}${path}/list?search=${search}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
        });

        if (!response.ok) {
            return [];
        }

        const data = await response.json();
        return data;
    } catch (error) {
        return [];
    }
}
