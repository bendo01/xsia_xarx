import { isKeyExists, removeStorageItem, setStorageItem, getStorageItem } from "../../../lib/storage";
import type { TypePaginationForm, TypeInputEntityReferenceForm, TypeAttachDetachUserPositionTypeInput } from "../../../lib/types";
import type { ModelInstitutionReferencePositionTypePaginationResponse } from "../../../models/pagination/ModelPagination";
import { UpsertDeleteMessage } from "../../../models/common/reference/ModelCommonReference";
import { initialAuthPermission, InstitutionReferencePositionType } from "../../../models/institution/reference/PositionType";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "institution/reference/position_types";

export async function InstitutionReferencePositionTypeIndex(pagination: TypePaginationForm): Promise<ModelInstitutionReferencePositionTypePaginationResponse> {
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
        const response_data: ModelInstitutionReferencePositionTypePaginationResponse = await response.json();
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

export async function InstitutionReferencePositionTypeUpsert(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to upsert reference.",
        errors: {},
    }
    // console.log(data);
    try {
        let payload = {
            code: Number(data.code),
            alphabet_code: data.alphabet_code,
            name: data.name
        }
        let response = null;

        if (
            ("id" in data) &&
            data.id != null &&
            data.id !== '00000000-0000-0000-0000-000000000000' &&
            data.id.length !== 0
        ) {
            response = await fetch(`${server_api_url}${path}/${data.id}`, {
                method: "PUT", // HTTP method
                headers: {
                    "Content-Type": "application/json", // Specify the data format
                    Accept: "application/json",
                    Authorization: `Bearer ${getStorageItem("token")}`,
                },
                body: JSON.stringify(payload), // Send form data as JSON
            });
        } else {
            response = await fetch(`${server_api_url}${path}/store`, {
                method: "POST", // HTTP method
                headers: {
                    "Content-Type": "application/json", // Specify the data format
                    Accept: "application/json",
                    Authorization: `Bearer ${getStorageItem("token")}`,
                },
                body: JSON.stringify(payload), // Send form data as JSON
            });
        }

        const responseData = await response.json();

        if (!response.ok) {
            // console.log(responseData);
            // console.log(responseData.errors);
            // console.log(responseData.message);
            if (responseData.errors) {
                returned.errors = responseData.errors;
            }
            returned.is_error = true;
            returned.code = 500;
            returned.message = responseData.message;
        }
        // console.log(returned);
        return returned;

    } catch (error) {
        // Return a default error message in case of exception
        returned.is_error = true;
        returned.code = 502;
        returned.message = "Failed to upserting reference.";
    }

    return returned;
}

export async function InstitutionReferencePositionTypeDelete(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to upsert reference.",
        errors: {},
    }
    if (
        ("id" in data) &&
        data.id != null &&
        data.id !== '00000000-0000-0000-0000-000000000000' &&
        data.id.length !== 0
    ) {
        const response = await fetch(`${server_api_url}${path}/${data.id}`, {
            method: "DELETE", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        if (!response.ok) {
            returned.is_error = true;
            returned.code = 500;
            returned.message = "Failed to delete reference.";
        }
    } else {
        returned.is_error = true;
        returned.code = 502;
        returned.message = "problem to delete reference.";
    }
    return returned;
}

export async function InstitutionReferencePositionTypeShow(id: string): Promise<InstitutionReferencePositionType> {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const response_data: InstitutionReferencePositionType = await response.json();
        return response_data;
    }
    catch (error) {
        // console.error("Error:", error);
        return initialAuthPermission;
    }
}

export async function InstitutionReferencePositionTypeAll(): Promise<InstitutionReferencePositionType[]> {
    try {
        const response = await fetch(`${server_api_url}${path}/all`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const response_data: InstitutionReferencePositionType[] = await response.json();
        return response_data;
    }
    catch (error) {
        // console.error("Error:", error);
        return [];
    }
}

export async function InstitutionReferencePositionTypeAttachUser(payload: TypeAttachDetachUserPositionTypeInput) {
    try {
        const response = await fetch(`${server_api_url}${path}/attach_user`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(payload), // Send form data as JSON
        });

        if (!response.ok) {
            return {
                code: 500,
                message: "Attach User failed"
            };
        }
        return {
            code: 200,
            message: "Attach User successful"
        };
    }
    catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function InstitutionReferencePositionTypeDetachUser(payload: TypeAttachDetachUserPositionTypeInput) {
    try {
        const response = await fetch(`${server_api_url}${path}/detach_user`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(payload), // Send form data as JSON
        });

        if (!response.ok) {
            return {
                code: 500,
                message: "Detach User failed"
            };
        }
        return {
            code: 200,
            message: "Detach User successful"
        };
    }
    catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function list(search: string = "") {
    try {
        const data = await InstitutionReferencePositionTypeAll();
        if (search) {
            return data.filter(item =>
                item.name.toLowerCase().includes(search.toLowerCase())
            );
        }
        return data;
    } catch (error) {
        return [];
    }
}
