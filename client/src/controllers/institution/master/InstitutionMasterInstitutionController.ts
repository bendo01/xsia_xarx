import type { TypePaginationForm } from "~/lib/types";
import type { UpsertDeleteMessage } from "~/models/common/reference/ModelCommonReference";
import type {
    InstitutionMasterInstitution,
    InstitutionMasterInstitutionDataObject,
    ModelInstitutionMasterInstitutionPaginationResponse,
} from "~/models/institution/master/Institution";
import type { ModelSelectItem } from "~/models/common/select/ModelSelectItem";
import { getStorageItem } from "~/lib/storage";

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "");
const path = "institution/master/institutions";

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
    };
    if (typeof window !== "undefined") {
        const token = getStorageItem("token");
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return headers;
};

export async function InstitutionMasterInstitutionControllerIndex(
    pagination: TypePaginationForm
): Promise<ModelInstitutionMasterInstitutionPaginationResponse> {
    try {
        const queryParams = new URLSearchParams();
        if (pagination.page) queryParams.set("page", String(pagination.page));
        if (pagination.per_page) queryParams.set("page_size", String(pagination.per_page));
        if (pagination.search) {
            queryParams.set("search", pagination.search);
        }
        if (pagination.name) queryParams.set("name", pagination.name);
        if (pagination.code !== undefined && pagination.code !== null && String(pagination.code).trim() !== "") {
            queryParams.set("code", String(pagination.code));
        }
        if (pagination.sort_by) queryParams.set("sort_by", pagination.sort_by);
        if (pagination.sort_dir) queryParams.set("sort_dir", pagination.sort_dir);
        if (pagination.column) queryParams.set("column", pagination.column);

        const url = `${getBaseUrl()}/${path}?${queryParams.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const resJson = await response.json();
        const rawItems = resJson.data || [];

        const formattedData: InstitutionMasterInstitutionDataObject[] = rawItems.map((item: any) => {
            if (item.institution) {
                return item as InstitutionMasterInstitutionDataObject;
            }
            return {
                institution: item as InstitutionMasterInstitution,
                variety: null,
                category: null,
                country: null,
                parent: null,
                academic_year: null,
            };
        });

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
            data: formattedData,
        };
    } catch (error) {
        console.error("Error fetching institution list:", error);
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

export async function InstitutionMasterInstitutionControllerShow(
    id: string
): Promise<{ is_error: boolean; message: string; data: InstitutionMasterInstitutionDataObject | null }> {
    try {
        const response = await fetch(`${getBaseUrl()}/${path}/${id}`, {
            method: "GET",
            headers: getHeaders(),
        });

        const resJson = await response.json().catch(() => ({}));
        if (!response.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || "Failed to load institution details.",
                data: null,
            };
        }

        const institution: InstitutionMasterInstitution = resJson;
        return {
            is_error: false,
            message: "Successfully loaded institution details.",
            data: {
                institution,
                variety: null,
                category: null,
                country: null,
                parent: null,
                academic_year: null,
            },
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || "Network error loading institution details.",
            data: null,
        };
    }
}

export async function InstitutionMasterInstitutionControllerCreate(
    payload: Partial<InstitutionMasterInstitution>
): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully created institution record.",
        errors: {},
    };

    try {
        const bodyPayload = {
            code: payload.code || null,
            name: payload.name || null,
            alphabet_code: payload.alphabet_code || null,
            is_active: payload.is_active ?? true,
            variety_id: payload.variety_id,
            category_id: payload.category_id,
            country_id: payload.country_id,
            parent_id: payload.parent_id || null,
            feeder_id: payload.feeder_id || null,
            academic_year_id: payload.academic_year_id || null,
        };

        const response = await fetch(`${getBaseUrl()}/${path}`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify(bodyPayload),
        });

        const responseData = await response.json().catch(() => ({}));
        if (!response.ok) {
            returned.is_error = true;
            returned.code = response.status;
            returned.message = responseData.message || responseData.brief || "Failed to create institution record.";
            if (responseData.errors) returned.errors = responseData.errors;
            return returned;
        }

        returned.message = "Successfully created institution record.";
        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while creating institution record.";
        return returned;
    }
}

export async function InstitutionMasterInstitutionControllerUpdate(
    id: string,
    payload: Partial<InstitutionMasterInstitution>
): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully updated institution record.",
        errors: {},
    };

    try {
        const bodyPayload = {
            code: payload.code || null,
            name: payload.name || null,
            alphabet_code: payload.alphabet_code || null,
            is_active: payload.is_active ?? true,
            variety_id: payload.variety_id || null,
            category_id: payload.category_id || null,
            country_id: payload.country_id || null,
            parent_id: payload.parent_id || null,
            feeder_id: payload.feeder_id || null,
            academic_year_id: payload.academic_year_id || null,
        };

        const response = await fetch(`${getBaseUrl()}/${path}/${id}`, {
            method: "PUT",
            headers: getHeaders(),
            body: JSON.stringify(bodyPayload),
        });

        const responseData = await response.json().catch(() => ({}));
        if (!response.ok) {
            returned.is_error = true;
            returned.code = response.status;
            returned.message = responseData.message || responseData.brief || "Failed to update institution record.";
            if (responseData.errors) returned.errors = responseData.errors;
            return returned;
        }

        returned.message = "Successfully updated institution record.";
        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while updating institution record.";
        return returned;
    }
}

export async function InstitutionMasterInstitutionControllerDelete(
    id: string
): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully deleted institution record.",
        errors: {},
    };

    if (!id) {
        returned.is_error = true;
        returned.code = 400;
        returned.message = "Missing or invalid institution ID.";
        return returned;
    }

    try {
        const response = await fetch(`${getBaseUrl()}/${path}/${id}`, {
            method: "DELETE",
            headers: getHeaders(),
        });

        const responseData = await response.json().catch(() => ({}));
        if (!response.ok) {
            returned.is_error = true;
            returned.code = response.status;
            returned.message = responseData.message || responseData.brief || "Failed to delete institution record.";
            return returned;
        }

        returned.message = "Successfully deleted institution record.";
        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while deleting institution record.";
        return returned;
    }
}

export async function InstitutionMasterInstitutionControllerList(
    search: string = ""
): Promise<ModelSelectItem[]> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", "1");
        queryParams.set("page_size", "200");
        if (search) queryParams.set("name", search);

        const response = await fetch(`${getBaseUrl()}/${path}?${queryParams.toString()}`, {
            method: "GET",
            headers: getHeaders(),
        });

        if (!response.ok) return [];
        const resData = await response.json();
        const items = resData.data || [];
        return items.map((item: any) => ({
            id: item.id,
            value: item.id,
            label: item.name ? `${item.name}${item.code ? ` (${item.code})` : ""}` : item.id,
        }));
    } catch {
        return [];
    }
}

// Reference Fetchers
export async function fetchInstitutionVarietyOptions(): Promise<ModelSelectItem[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/institution/reference/varieties?page=1&page_size=1000`, {
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data || []).map((v: any) => ({
            id: v.id,
            value: v.id,
            label: v.name,
        }));
    } catch {
        return [];
    }
}

export async function fetchInstitutionCategoryOptions(): Promise<ModelSelectItem[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/institution/reference/categories?page=1&page_size=1000`, {
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data || []).map((c: any) => ({
            id: c.id,
            value: c.id,
            label: c.name,
        }));
    } catch {
        return [];
    }
}

export async function fetchCountryOptions(): Promise<ModelSelectItem[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/countries?page=1&page_size=1000`, {
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data || []).map((c: any) => ({
            id: c.id,
            value: c.id,
            label: c.name,
        }));
    } catch {
        return [];
    }
}

export async function fetchAcademicYearOptions(): Promise<ModelSelectItem[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/general/reference/academic-years?page=1&page_size=1000`, {
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data || []).map((y: any) => ({
            id: y.id,
            value: y.id,
            label: y.name || y.code || y.id,
        }));
    } catch {
        return [];
    }
}
