import { getStorageItem } from "../../../lib/storage";
import { PerkuliahanMahasiswaResponse } from "../../../models/feeder/master/PerkuliahanMahasiswaResponse";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export interface PerkuliahanMahasiswaApiResponse {
    code: number;
    message: string;
    data?: PerkuliahanMahasiswaResponse[];
}

export async function feederMasterPerkuliahanMahasiswa(id: string): Promise<PerkuliahanMahasiswaApiResponse> {
    try {
        const url = `${server_api_url}feeder/master/perkuliahan-mahasiswa/mahasiswa/${id}`;
        console.log("🔍 Fetching perkuliahan data from:", url);
        
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        
        const data = await response.json();
        console.log("📦 Raw API Response:", {
            status: response.status,
            ok: response.ok,
            data: data
        });
        
        if (!response.ok) {
            console.error("❌ API Error:", response.status, data.message);
            return {
                code: response.status,
                message: data.message || "Gagal mengambil data perkuliahan mahasiswa"
            };
        }
        
        // The API returns the array directly without wrapping
        // Based on the backend controller (line 149), it calls format::json(data_with_detail_nilai)
        // which returns the array directly
        console.log("✅ Processing response, data is array:", Array.isArray(data));
        console.log("📊 Data length:", data?.length || 0);
        
        return {
            code: 200,
            message: "Berhasil mengambil data perkuliahan mahasiswa",
            data: data // The API returns the array directly
        };
    } catch (error) {
        console.error("💥 Exception in feederMasterPerkuliahanMahasiswa:", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}