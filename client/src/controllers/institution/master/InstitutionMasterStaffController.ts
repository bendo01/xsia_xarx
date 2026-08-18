import { getStorageItem } from "../../../lib/storage";
import { InstitutionMasterStaff, ConnectAccountParams, GenerateAccountParams } from "../../../models/institution/master/Staff";
import type { TypePaginationForm } from "../../../lib/types";
import type { ModelInstitutionMasterStaffPaginationResponse } from "../../../models/pagination/ModelPagination";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "institution/master/staffes";

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
        const response_data: ModelInstitutionMasterStaffPaginationResponse = await response.json();
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

export async function store(data: InstitutionMasterStaff) {
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
                message: responseData.message || "Failed to store staff",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Staff stored successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function update(id: string, data: InstitutionMasterStaff) {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "PUT", // Using PUT for update
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
                message: responseData.message || "Failed to update staff",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Staff updated successfully",
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
                message: responseData.message || "Failed to show staff",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Staff shown successfully",
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
                message: responseData.message || "Failed to destroy staff",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Staff destroyed successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function connectAccount(data: ConnectAccountParams) {
    try {
        const response = await fetch(`${server_api_url}${path}/connect-account`, {
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
                message: responseData.message || "Failed to connect account",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Account connected successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function generateAccount(data: GenerateAccountParams) {
    try {
        const response = await fetch(`${server_api_url}${path}/generate-account`, {
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
                message: responseData.message || "Failed to generate account",
                errors: responseData.errors
            }
        }

        return {
            code: 200,
            message: "Account generated successfully",
            data: responseData
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}