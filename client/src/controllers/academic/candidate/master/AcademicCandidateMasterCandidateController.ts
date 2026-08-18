import type { AcademicCandidateMasterCandidateRegistration } from "../../../../models/academic/candidate/master/Candidate";
import { getStorageItem } from "../../../../lib/storage";
import type { PersonMasterIndividual } from "../../../../models/person/master/Individual";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function candidateRegister(registration: AcademicCandidateMasterCandidateRegistration) {

    try {
        const response = await fetch(`${server_api_url}academic/candidate/master/candidates/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(registration),
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                code: data.code || response.status,
                message: data.message || "Registration failed",
                errors: data.errors
            };
        }

        return {
            code: data.code || 200,
            message: data.message || "Registration successful"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function candidateValidate(id: string) {
    try {
        const response = await fetch(`${server_api_url}academic/candidate/master/candidates/candidate_validation/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                "Authorization": `Bearer ${getStorageItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                code: data.code || response.status,
                message: data.message || "Validation failed"
            };
        }

        return {
            code: 200,
            message: data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function candidateCreateProfile(id: string, data: PersonMasterIndividual) {
    try {
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const { id: _, ...payload } = data;
        const response = await fetch(`${server_api_url}person/master/individuals/store/candidate/${id}`, {
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
                message: responseData.message || "Failed to create profile",
                errors: responseData.errors
            }
        }

        return {
            code: responseData.code || 200,
            message: responseData.message || "Profile created successfully",
            data: responseData.data
        };

    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function candidateCreateGuardian(candidate_id: string, relative_type_id: string, data: PersonMasterIndividual) {
    try {
        // biome-ignore lint/correctness/noUnusedVariables: <explanation>
        const { id: _, ...payload } = data;
        const response = await fetch(`${server_api_url}person/master/individuals/store/candidate/${candidate_id}/relative_type/${relative_type_id}`, {
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

export async function candidateIndex(institution_id: string, academic_year_id: string, pagination?: any) {
    try {
        const response = await fetch(`${server_api_url}academic/candidate/master/candidates/index_institution/${institution_id}/academic_year/${academic_year_id}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(pagination || {
                page: 1,
                per_page: 10,
                search: "",
                sort_by: "created_at",
                sort_dir: "desc"
            }),
        });
        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to get candidates",
                errors: responseData.errors
            }
        }

        return {
            code: responseData.code || 200,
            message: responseData.message || "Candidates retrieved successfully",
            data: responseData // Return full object: { pagination: ..., data: ... }
        };

    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
// biome-ignore lint/style/noDefaultExport: <explanation>
export async function candidateShow(id: string) {
    try {
        const response = await fetch(`${server_api_url}academic/candidate/master/candidates/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const responseData = await response.json();

        if (!response.ok) {
            return {
                code: responseData.code || response.status,
                message: responseData.message || "Failed to get candidate",
                errors: responseData.errors
            }
        }

        return {
            code: responseData.code || 200,
            message: responseData.message || "Candidate retrieved successfully",
            data: responseData
        };

    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}


