import { getStorageItem, setStorageItem } from "../../../lib/storage";
import { FeederMasterMahasiswa } from "../../../models/feeder/master/Mahasiswa";
import { ModelFeederMasterMahasiswaPaginationResponse } from "../../../models/pagination/ModelPagination";
import { ModelPaginationForm, initialPaginationForm } from "../../../models/pagination/ModelPagination";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "feeder/master/mahasiswa";

export async function academicStudentMasterStudentIndex(
    pagination: ModelPaginationForm = initialPaginationForm,
): Promise<ModelFeederMasterMahasiswaPaginationResponse> {
    const response = await fetch(`${server_api_url}${path}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getStorageItem("token")}`,
        },
        body: JSON.stringify(pagination),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    return await response.json();
}

export async function academicStudentMasterStudentShow(id: string): Promise<FeederMasterMahasiswa> {
    const response = await fetch(`${server_api_url}${path}/${id}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getStorageItem("token")}`,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch data");
    }

    return await response.json();
}