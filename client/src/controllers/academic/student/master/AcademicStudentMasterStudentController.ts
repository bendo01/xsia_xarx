import { getStorageItem, setStorageItem } from "../../../../lib/storage";
import { AcademicStudentMasterStudent, ModelPagination, StudentDataObject } from "../../../../models/academic/student/master/Student";
import { AcademicStudentMasterStudentValidate } from "../../../../models/academic/student/master/Student";
import type { PersonMasterIndividual } from "../../../../models/person/master/Individual";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function academicStudentMasterStudent(id: string): Promise<StudentDataObject | null> {
    try {
        const response = await fetch(`${server_api_url}academic/student/master/students/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Pengambilan Data Mahasiswa Gagal", data);
            return null;
        }
        setStorageItem("student", JSON.stringify(data));

        return data;
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return null;
    }
}

export async function academicStudentMasterStudentShow(id: string): Promise<StudentDataObject | null> {
    try {
        const response = await fetch(`${server_api_url}academic/student/master/students/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Pengambilan Data Mahasiswa Gagal", data);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return null;
    }
}

export async function academicStudentMasterStudentValidate(id: string): Promise<AcademicStudentMasterStudentValidate | null> {
    try {
        const response = await fetch(`${server_api_url}academic/student/master/students/student_validation/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Pengambilan Data Mahasiswa Gagal", data);
            return null;
        }
        setStorageItem("student", JSON.stringify(data));

        return data;
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return null;
    }
}


export async function academicStudentMasterStudentIndexInstitution(institution_id: string, paginationData: {
    search?: string;
    sort_by?: string;
    column?: string;
    sort_dir?: string;
    page: number;
    per_page: number;
}): Promise<{
    code: number;
    message: string | ModelPagination; // Use ModelPagination which contains student data list
}> {
    try {
        const response = await fetch(`${server_api_url}academic/student/master/students/index_institution/${institution_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(paginationData),
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal mengambil data mahasiswa", data);
            return {
                code: response.status,
                message: data.message || "Gagal mengambil data mahasiswa",
            };
        }

        return {
            code: 200,
            message: data,
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}

export async function updateStudentFinance(student_id: string, finance_id: string): Promise<{
    code: number;
    message: string;
}> {

    try {
        const response = await fetch(`${server_api_url}academic/student/master/students/update_finance`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify({
                student_id,
                finance_id
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

export async function studentCreateGuardian(student_id: string, relative_type_id: string, data: PersonMasterIndividual) {
    try {
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const { id: _, ...payload } = data;
        const response = await fetch(`${server_api_url}person/master/individuals/store/student/${student_id}/relative_type/${relative_type_id}`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(payload), // Send form data as JSON
        });
        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to create guardian",
                errors: responseData.errors
            }
        }

        return {
            code: responseData.code || 200,
            message: responseData.message || "Guardian created successfully",
            data: responseData.data
        };

    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}