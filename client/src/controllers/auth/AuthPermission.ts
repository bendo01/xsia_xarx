import type { TypePaginationForm, TypeInputEntityReferenceForm, TypeAttachDetachPositionTypeInput, TypeAttachDetachUserInput } from "../../lib/types";
import { UpsertDeleteMessage } from "../../models/common/reference/ModelCommonReference";
import { getStorageItem } from "../../lib/storage";
import { ModelCommonReferencePaginationResponse } from "../../models/pagination/ModelPagination";
import { Permission } from "../../models/auth/Permission";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "auth/permissions";

export async function AuthPermissionIndex(pagination : TypePaginationForm): Promise<ModelCommonReferencePaginationResponse> {
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
        const response_data: ModelCommonReferencePaginationResponse = await response.json();
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

export async function AuthPermissionUpsert(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to upsert permission.",
        errors: {},
    }
    // console.log(data);
    try {
        let payload = {
            name: data.name,
            is_open: true
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
        returned.message = "Failed to upserting permission.";
    }

    return returned;
}

export async function AuthPermissionDelete(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to upsert permission.",
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
            returned.message = "Failed to delete permission.";
        }
    } else {
        returned.is_error = true;
        returned.code = 502;
        returned.message = "problem to delete permission.";
    }
    return returned;
}

/* AuthPermissionAttach */
export async function AuthPermissionAttachPositionType(data: TypeAttachDetachPositionTypeInput): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to attach permission.",
        errors: {},
    }
    try {
        const response = await fetch(`${server_api_url}${path}/attach_position_type`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(data), // Send form data as JSON
        });

        if (!response.ok) {
            returned.is_error = true;
            returned.code = 500;
            returned.message = "Failed to attach permission.";
        }
        return returned;

    } catch (error) {
        // Return a default error message in case of exception
        returned.is_error = true;
        returned.code = 502;
        returned.message = "Failed to attach permission.";
        return returned;
    }
}

/* AuthPermissionDetach */
export async function AuthPermissionDetachPositionType(data: TypeAttachDetachPositionTypeInput): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to detach permission.",
        errors: {},
    }
    try {
        const response = await fetch(`${server_api_url}${path}/detach_position_type`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(data), // Send form data as JSON
        });

        if (!response.ok) {
            returned.is_error = true;
            returned.code = 500;
            returned.message = "Failed to detach permission.";
        }
        return returned;

    } catch (error) {
        // Return a default error message in case of exception
        returned.is_error = true;
        returned.code = 502;
        returned.message = "Failed to detach permission.";
        return returned;
    }
}


/* AuthPermissionAttachUser */
export async function AuthPermissionAttachUser(data: TypeAttachDetachUserInput): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to attach permission to user.",
        errors: {},
    }
    try {
        const response = await fetch(`${server_api_url}${path}/attach_user`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(data), // Send form data as JSON
        });

        if (!response.ok) {
            returned.is_error = true;
            returned.code = 500;
            returned.message = "Failed to attach permission to user.";
        }
        return returned;

    } catch (error) {
        // Return a default error message in case of exception
        returned.is_error = true;
        returned.code = 502;
        returned.message = "Failed to attach permission to user.";
        return returned;
    }
}

/* AuthPermissionDetachUser */
export async function AuthPermissionDetachUser(data: TypeAttachDetachUserInput): Promise<UpsertDeleteMessage> {
    let returned = {
        is_error: false,
        code: 200,
        message: "success to detach permission from user.",
        errors: {},
    }
    try {
        const response = await fetch(`${server_api_url}${path}/detach_user`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(data), // Send form data as JSON
        });

        if (!response.ok) {
            returned.is_error = true;
            returned.code = 500;
            returned.message = "Failed to detach permission from user.";
        }
        return returned;

    } catch (error) {
        // Return a default error message in case of exception
        returned.is_error = true;
        returned.code = 502;
        returned.message = "Failed to detach permission from user.";
        return returned;
    }
}

/* AuthPermissionAll */
export async function AuthPermissionAll(): Promise<Permission[]> {
    try {
        const response = await fetch(`${server_api_url}${path}/all`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const response_data: Permission[] = await response.json();
        return response_data;
    }
    catch (error) {
        // console.error("Error:", error);
        return [];
    }
}
