import type { TypePaginationForm, TypeInputEntityReferenceForm } from "../../../lib/types";
import type { UpsertDeleteMessage } from "../../../models/common/reference/ModelCommonReference";
import type { ModelCommonReferencePaginationResponse } from "../../../models/pagination/ModelPagination";
import type { ModelSelectItem } from "../../../models/common/select/ModelSelectItem";

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "");
const path = "institution/reference/position-type";

export async function InstitutionReferencePositionTypeIndex(pagination: TypePaginationForm): Promise<ModelCommonReferencePaginationResponse> {
    try {
        const queryParams = new URLSearchParams();
        if (pagination.page) queryParams.set("page", String(pagination.page));
        if (pagination.per_page) queryParams.set("page_size", String(pagination.per_page));
        if (pagination.search) queryParams.set("name", pagination.search);
        if (pagination.name) queryParams.set("name", pagination.name);
        if (pagination.code !== undefined && pagination.code !== null && !isNaN(pagination.code)) {
            queryParams.set("code", String(pagination.code));
        }

        const url = `${getBaseUrl()}/${path}?${queryParams.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resJson = await response.json();
        return {
            pagination: {
                search: pagination.search || "",
                sort_by: pagination.sort_by || "",
                column: pagination.column || "",
                sort_dir: pagination.sort_dir || "",
                page: resJson.page || 1,
                per_page: resJson.page_size || 10,
                total_page: resJson.total_pages || 0,
                last_page: resJson.total_pages || 1,
                total_data: resJson.total || 0,
            },
            data: resJson.data || [],
        };
    } catch (error) {
        console.error("Error fetching position type reference:", error);
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
        };
    }
}

export async function InstitutionReferencePositionTypeUpsert(data: TypeInputEntityReferenceForm): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully saved position type reference.",
        errors: {},
    };

    try {
        const payload = {
            code: Number(data.code),
            alphabet_code: data.alphabet_code || data.alphabetic_code || "",
            name: data.name,
        };

        const isUpdate = Boolean(data.id && data.id !== "" && data.id !== "00000000-0000-0000-0000-000000000000");
        const url = isUpdate ? `${getBaseUrl()}/${path}/${data.id}` : `${getBaseUrl()}/${path}`;
        const method = isUpdate ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(payload),
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            returned.is_error = true;
            returned.code = response.status;
            returned.message = responseData.message || responseData.brief || "Failed to save position type reference.";
            if (responseData.errors) returned.errors = responseData.errors;
            return returned;
        }

        returned.message = isUpdate ? "Successfully updated position type reference." : "Successfully created position type reference.";
        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while saving position type reference.";
        return returned;
    }
}

export async function InstitutionReferencePositionTypeDelete(data: TypeInputEntityReferenceForm | { id?: string | null }): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully deleted position type reference.",
        errors: {},
    };

    if (!data.id || data.id === "" || data.id === "00000000-0000-0000-0000-000000000000") {
        returned.is_error = true;
        returned.code = 400;
        returned.message = "Missing or invalid ID to delete reference.";
        return returned;
    }

    try {
        const response = await fetch(`${getBaseUrl()}/${path}/${data.id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            returned.is_error = true;
            returned.code = response.status;
            returned.message = responseData.message || responseData.brief || "Failed to delete position type reference.";
            return returned;
        }

        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while deleting position type reference.";
        return returned;
    }
}

export async function InstitutionReferencePositionTypeList(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/${path}?page=1&page_size=1000`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
        });
        const resData = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Failed to fetch position type list",
            };
        }

        const items: ModelSelectItem[] = (resData.data || []).map((item: any) => ({
            id: item.id,
            value: item.id,
            label: item.name,
        }));

        return {
            code: 200,
            message: items,
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error",
        };
    }
}
