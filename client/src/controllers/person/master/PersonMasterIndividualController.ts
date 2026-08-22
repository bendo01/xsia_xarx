import type { TypePaginationForm } from "../../../lib/types";
import type { UpsertDeleteMessage } from "../../../models/common/reference/ModelCommonReference";
import type { PersonMasterIndividual, PersonMasterIndividualDataObject } from "../../../models/person/master/Individual";
import type { ModelPersonMasterIndividualPaginationResponse } from "../../../models/pagination/ModelPagination";
import type { ModelSelectItem } from "../../../models/common/select/ModelSelectItem";
import { getStorageItem } from "../../../lib/storage";

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "");
const path = "person/master/individual";

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

export async function PersonMasterIndividualControllerIndex(pagination: TypePaginationForm): Promise<ModelPersonMasterIndividualPaginationResponse> {
    try {
        const queryParams = new URLSearchParams();
        if (pagination.page) queryParams.set("page", String(pagination.page));
        if (pagination.per_page) queryParams.set("page_size", String(pagination.per_page));
        if (pagination.search) {
            queryParams.set("search", pagination.search);
        }
        if (pagination.name) queryParams.set("name", pagination.name);
        if (pagination.code !== undefined && pagination.code !== null && !isNaN(pagination.code)) {
            queryParams.set("code", String(pagination.code));
        }

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

        // Wrap individual objects in PersonMasterIndividualDataObject format
        const formattedData: PersonMasterIndividualDataObject[] = rawItems.map((item: any) => {
            if (item.individual) {
                return item as PersonMasterIndividualDataObject;
            }
            return {
                individual: item as PersonMasterIndividual,
                gender: null,
                religion: null,
                identification_type: null,
                income: null,
                marital_status: null,
                occupation: null,
                profession: null,
                age_classification: null,
                biodata: null,
                picture: null,
                lecturer: null,
                students: null,
                employees: null,
                family_card_members: null,
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
        console.error("Error fetching individual list:", error);
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

export async function PersonMasterIndividualControllerShow(id: string): Promise<{
    is_error: boolean;
    code: number;
    message: string;
    data?: PersonMasterIndividualDataObject;
}> {
    if (!id || id === "" || id === "00000000-0000-0000-0000-000000000000") {
        return {
            is_error: true,
            code: 400,
            message: "Individual ID is required.",
        };
    }

    try {
        const response = await fetch(`${getBaseUrl()}/${path}/${id}`, {
            method: "GET",
            headers: getHeaders(),
        });

        const resData = await response.json().catch(() => ({}));

        if (!response.ok) {
            return {
                is_error: true,
                code: response.status,
                message: resData.message || resData.brief || "Failed to load individual details.",
            };
        }

        const individual = (resData.individual ?? resData) as PersonMasterIndividual;
        const formattedData: PersonMasterIndividualDataObject = {
            individual,
            gender: resData.gender ?? null,
            religion: resData.religion ?? null,
            identification_type: resData.identification_type ?? null,
            income: resData.income ?? null,
            marital_status: resData.marital_status ?? null,
            occupation: resData.occupation ?? null,
            profession: resData.profession ?? null,
            education: resData.education ?? null,
            age_classification: resData.age_classification ?? null,
            biodata: resData.biodata ?? null,
            picture: resData.picture ?? null,
            lecturer: resData.lecturer ?? null,
            students: resData.students ?? null,
            employees: resData.employees ?? null,
            family_card_members: resData.family_card_members ?? null,
        };

        return {
            is_error: false,
            code: 200,
            message: "Success",
            data: formattedData,
        };
    } catch (error: any) {
        return {
            is_error: true,
            code: 500,
            message: error.message || "Network error while loading individual details.",
        };
    }
}

export async function PersonMasterIndividualControllerUpsert(data: Partial<PersonMasterIndividual>): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully saved individual record.",
        errors: {},
    };

    try {
        const isUpdate = Boolean(data.id && data.id !== "" && data.id !== "00000000-0000-0000-0000-000000000000");
        const url = isUpdate ? `${getBaseUrl()}/${path}/${data.id}` : `${getBaseUrl()}/${path}`;
        const method = isUpdate ? "PUT" : "POST";

        const response = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(data),
        });

        const responseData = await response.json().catch(() => ({}));

        if (!response.ok) {
            returned.is_error = true;
            returned.code = response.status;
            returned.message = responseData.message || responseData.brief || "Failed to save individual record.";
            if (responseData.errors) returned.errors = responseData.errors;
            return returned;
        }

        returned.message = isUpdate ? "Successfully updated individual record." : "Successfully created individual record.";
        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while saving individual record.";
        return returned;
    }
}

export async function PersonMasterIndividualControllerDelete(id: string): Promise<UpsertDeleteMessage> {
    const returned: UpsertDeleteMessage = {
        is_error: false,
        code: 200,
        message: "Successfully deleted individual record.",
        errors: {},
    };

    if (!id || id === "" || id === "00000000-0000-0000-0000-000000000000") {
        returned.is_error = true;
        returned.code = 400;
        returned.message = "Missing or invalid individual ID to delete.";
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
            returned.message = responseData.message || responseData.brief || "Failed to delete individual record.";
            return returned;
        }

        return returned;
    } catch (error: any) {
        returned.is_error = true;
        returned.code = 500;
        returned.message = error.message || "Network error while deleting individual record.";
        return returned;
    }
}

export async function PersonMasterIndividualControllerList(params?: { search?: string }): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const queryParams = new URLSearchParams();
        queryParams.set("page", "1");
        queryParams.set("page_size", "100");
        if (params?.search) queryParams.set("name", params.search);

        const response = await fetch(`${getBaseUrl()}/${path}?${queryParams.toString()}`, {
            method: "GET",
            headers: getHeaders(),
        });
        const resData = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Failed to fetch individual list",
            };
        }

        const items: ModelSelectItem[] = (resData.data || []).map((item: any) => {
            const raw = item.individual || item;
            const fullName = [raw.front_title, raw.name, raw.last_title].filter(Boolean).join(" ");
            return {
                id: raw.id,
                value: raw.id,
                label: `${raw.code ? `[${raw.code}] ` : ""}${fullName || raw.name || "Unnamed Individual"}`,
            };
        });

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
