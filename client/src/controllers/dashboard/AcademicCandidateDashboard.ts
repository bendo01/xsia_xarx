const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
import { getStorageItem } from "../../lib/storage";
import { CandidateSummary } from "../../models/dashboard/candidate";

export async function getSummary(institution_id: string, academic_year_id: string): Promise<{
    code: number;
    message: string | CandidateSummary;
}> {
    try {
        const response = await fetch(`${server_api_url}dashboard/candidate/summary/${institution_id}/academic_year/${academic_year_id}`, {
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
                message: "Gagal mengambil data dashboard"
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

export async function exportExcel(institution_id: string): Promise<{
    code: number;
    message: string;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/candidate/master/candidates/index_institution_excel_export/${institution_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal mengekspor data"
            };
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "daftar_kandidat.xlsx";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);

        return {
            code: 200,
            message: "Berhasil mengekspor data"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Internal server error"
        };
    }
}
