import type { ModelSelectItem } from "../../models/common/select/ModelSelectItem";
import type { ModelLocationSubDistrictPaginationResponse } from "../../models/pagination/ModelPagination";
import type { LocationSubDistrict } from "../../models/location/SubDistrict";

export interface SubDistrictWithRegency {
    sub_district: LocationSubDistrict;
    regency: {
        id: string;
        name: string;
        code: string;
    } | null;
}

export async function getSubDistrictLists(regency_id: string): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    if (regency_id) {
        try {
            const response = await fetch(`${server_api_url}locations/sub_district/list_by_regency/${regency_id}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                }
            });
            const data: ModelSelectItem[] = await response.json();
            
            if (!response.ok) {
                return {
                    code: response.status || 500,
                    message: "Gagal Mengambil Data Kecamatan"
                };
            }

            return {
                code: 200,
                message: data
            };
        } catch (error) {
            return {
                code: 500,
                message: "Internal server error"
            };
        }
    }

    return {
        code: 500,
        message: "Isikan Id Kabupaten"
    };
}

export async function getSubDistrictIndex(paginationData: {
    search?: string;
    sort_by?: string;
    column?: string;
    sort_dir?: string;
    page: number;
    per_page: number;
}): Promise<{
    code: number;
    message: string | ModelLocationSubDistrictPaginationResponse;
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/sub_district`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(paginationData),
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Kecamatan"
            };
        }

        const data: ModelLocationSubDistrictPaginationResponse = await response.json();
        return {
            code: 200,
            message: data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}

export async function getSubDistrictById(id: string): Promise<{
    code: number;
    message: string | SubDistrictWithRegency;
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/sub_district/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Kecamatan"
            };
        }

        const data: SubDistrictWithRegency = await response.json();
        return {
            code: 200,
            message: data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}

export async function createSubDistrict(subDistrictData: {
    code?: string;
    name: string;
    regency_id: string;
    dikti_code?: string;
    slug?: string;
    alt_slug?: string;
    state_ministry_code?: string;
    state_ministry_full_code?: string;
    state_post_department_code?: string;
    state_ministry_name?: string;
    dikti_name?: string;
    validation_code?: string;
    agriculture_department_name?: string;
    latitude?: number;
    longitude?: number;
    zoom?: number;
}): Promise<{
    code: number;
    message: string | LocationSubDistrict;
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/sub_district/store`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(subDistrictData),
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Membuat Data Kecamatan"
            };
        }

        const data: LocationSubDistrict = await response.json();
        return {
            code: 200,
            message: data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}

export async function updateSubDistrict(id: string, subDistrictData: {
    code?: string;
    name: string;
    regency_id: string;
    dikti_code?: string;
    slug?: string;
    alt_slug?: string;
    state_ministry_code?: string;
    state_ministry_full_code?: string;
    state_post_department_code?: string;
    state_ministry_name?: string;
    dikti_name?: string;
    validation_code?: string;
    agriculture_department_name?: string;
    latitude?: number;
    longitude?: number;
    zoom?: number;
}): Promise<{
    code: number;
    message: string | LocationSubDistrict;
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/sub_district/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(subDistrictData),
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Memperbarui Data Kecamatan"
            };
        }

        const data: LocationSubDistrict = await response.json();
        return {
            code: 200,
            message: data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}

export async function deleteSubDistrict(id: string): Promise<{
    code: number;
    message: string;
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/sub_district/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Menghapus Data Kecamatan"
            };
        }

        return {
            code: 200,
            message: "Data Kecamatan berhasil dihapus"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}