import type { ModelSelectItem } from "../../models/common/select/ModelSelectItem";
import type { ModelLocationVillagePaginationResponse } from "../../models/pagination/ModelPagination";
import type { LocationVillage } from "../../models/location/Village";

export interface VillageWithSubDistrict {
    village: LocationVillage;
    sub_district: {
        id: string;
        name: string;
        code: string;
    } | null;
}

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";

export async function getVillageLists(sub_district_id: string): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    
    if (sub_district_id) {
        try {
            const response = await fetch(`${server_api_url}locations/village/list_by_sub_district/${sub_district_id}`, {
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
                    message: "Gagal Mengambil Data Desa/Kelurahan"
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
        message: "Isikan Id Kecamatan"
    };
}

export async function getVillageIndex(paginationData: {
    search?: string;
    sort_by?: string;
    column?: string;
    sort_dir?: string;
    page: number;
    per_page: number;
}): Promise<{
    code: number;
    message: string | ModelLocationVillagePaginationResponse;
}> {
    // const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/village`, {
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
                message: "Gagal Mengambil Data Desa/Kelurahan"
            };
        }

        const data: ModelLocationVillagePaginationResponse = await response.json();
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

export async function getVillageById(id: string): Promise<{
    code: number;
    message: string | VillageWithSubDistrict;
}> {
    // const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/village/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Desa/Kelurahan"
            };
        }

        const data: VillageWithSubDistrict = await response.json();
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

export async function createVillage(villageData: {
    code: string;
    name: string;
    sub_district_id: string;
    dikti_code?: string;
    slug?: string;
    alt_slug?: string;
    state_ministry_code?: string;
    state_post_department_code?: string;
    state_ministry_name?: string;
    dikti_name?: string;
    latitude?: number;
    longitude?: number;
    zoom?: number;
}): Promise<{
    code: number;
    message: string | LocationVillage;
}> {
    // const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/village/store`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(villageData),
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Membuat Data Desa/Kelurahan"
            };
        }

        const data: LocationVillage = await response.json();
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

export async function updateVillage(id: string, villageData: {
    code: string;
    name: string;
    sub_district_id: string;
    dikti_code?: string;
    slug?: string;
    alt_slug?: string;
    state_ministry_code?: string;
    state_post_department_code?: string;
    state_ministry_name?: string;
    dikti_name?: string;
    latitude?: number;
    longitude?: number;
    zoom?: number;
}): Promise<{
    code: number;
    message: string | LocationVillage;
}> {
    // const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/village/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(villageData),
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Memperbarui Data Desa/Kelurahan"
            };
        }

        const data: LocationVillage = await response.json();
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

export async function deleteVillage(id: string): Promise<{
    code: number;
    message: string;
}> {
    // const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";
    try {
        const response = await fetch(`${server_api_url}locations/village/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Menghapus Data Desa/Kelurahan"
            };
        }

        return {
            code: 200,
            message: "Data Desa/Kelurahan berhasil dihapus"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}