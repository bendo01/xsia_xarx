const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
import { getStorageItem } from "../../../../lib/storage";
import { ModelPagination as PaginateResult, ModelPaginationForm } from "../../../../models/pagination/ModelPagination";
import { AcademicStudentCampaignActivityResponse } from "../../../../models/academic/student/campaign/ActivityResponse";

export interface ModelPagination {
    pagination: PaginateResult;
    data: AcademicStudentCampaignActivityResponse[];
}

export async function academicStudentCampaignActivityIndex(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/activities/index_by_student/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal mengambil data aktivitas kuliah"
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

export async function academicStudentCampaignActivityShow(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/activities/show_student/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal mengambil detail aktivitas kuliah"
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

export async function toggleIsLocked(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/activities/toggle_is_locked/${id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal mengubah status terkunci"
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

export async function academicStudentCampaignActivityIndexInstitution(paginate_input: ModelPaginationForm): Promise<{
    code: number;
    message: string | ModelPagination;
}> {
    const institution_id = import.meta.env.VITE_INSTITUTION_ID ?? "00000000-0000-0000-0000-000000000000";
    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/activities/index_institution/${institution_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(paginate_input),
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal mengambil detail aktivitas kuliah"
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

export async function updateStudentCampaignActivityStatus(activity_id: string, status_id: string): Promise<{
    code: number;
    message: string;
}> {

    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/activities/update_status`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify({
                activity_id,
                status_id
            })
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengupdate Data Keuangan Mahasiswa"
            };
        }

        return {
            code: 200,
            message: "Data Keuangan Mahasiswa Berhasil Diupdate"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}