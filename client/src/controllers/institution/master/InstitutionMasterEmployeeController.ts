import { getStorageItem } from "../../../lib/storage";
import { InstitutionMasterEmployee } from "../../../models/institution/master/Employee";
import type { TypePaginationForm } from "../../../lib/types";
import type { ModelInstitutionMasterEmployeePaginationResponse } from "../../../models/pagination/ModelPagination";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "institution/master/employees";

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
        const response_data: ModelInstitutionMasterEmployeePaginationResponse = await response.json();
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

export async function store(data: InstitutionMasterEmployee) {
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
                message: responseData.message || "Failed to store employee",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Employee stored successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function update(id: string, data: InstitutionMasterEmployee) {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "POST", // Using POST for update as per conventions mostly found in new systems or specific routing
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
                message: responseData.message || "Failed to update employee",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Employee updated successfully",
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
                message: responseData.message || "Failed to show employee",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Employee shown successfully",
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
                message: responseData.message || "Failed to destroy employee",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Employee destroyed successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function list(params: { search?: string, institution_id?: string }) {
    try {
        const response = await fetch(`${server_api_url}${path}/list`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(params),
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
