import type { TypePaginationForm } from "../../../lib/types";
import type { TypeInputEntityReferenceForm } from "../../../lib/types";
import { UpsertDeleteMessage } from "../../../models/common/reference/ModelCommonReference";
import type { ModelCommonReferencePaginationResponse } from "../../../models/pagination/ModelPagination";
// import type{ CommonMessage } from "../../../models/common/Message";
// import { getStorageItem } from "../../../lib/storage";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "institution/reference/variety";

export async function InstitutionReferenceControllerVarietyIndex(pagination : TypePaginationForm): Promise<ModelCommonReferencePaginationResponse> {
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
        const response_data: ModelCommonReferencePaginationResponse = await response.json();
        return response_data;
    }
    catch (error) {
        console.error("Error:", error);
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

export async function InstitutionReferenceControllerVarietyUpsert(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
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
            alphabet_code:data.alphabet_code,
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
                    // Authorization: `Bearer ${getStorageItem("token")}`,
                },
                body: JSON.stringify(payload), // Send form data as JSON
            });
        } else {
            response = await fetch(`${server_api_url}${path}/store`, {
                method: "POST", // HTTP method
                headers: {
                    "Content-Type": "application/json", // Specify the data format
                    Accept: "application/json",
                    // Authorization: `Bearer ${getStorageItem("token")}`,
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

export async function InstitutionReferenceControllerVarietyDelete(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
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
                // Authorization: `Bearer ${getStorageItem("token")}`,
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