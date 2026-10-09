import { getBaseApiUrl, getAuthHeaders } from "../../master/masterApiController";
import { getStorageItem, setStorageItem } from "../../../lib/storage";

const path = "academic/candidate/admission";

export interface OptionItem {
    id: string;
    name: string;
    code?: string | null;
}

export interface AdmissionRegisterPayload {
    institution_code: string;
    academic_year_id?: string | null;
    name: string;
    nik: string;
    birth_place: string;
    birth_date: string;
    gender_id: string;
    religion_id: string;
    student_national_number?: string | null;
    school_name?: string | null;
    phone_number: string;
    email: string;
    password: string;
}

export interface AdmissionUnitOptions {
    units: OptionItem[];
    registration_categories: OptionItem[];
}

export interface AdmissionFamilyMemberPayload {
    relative_type_id: string;
    name: string;
    nik: string;
    birth_place: string;
    birth_date: string;
    gender_id?: string | null;
    religion_id?: string | null;
    is_deceased: boolean;
}

export interface AdmissionFamilyMember {
    id: string;
    relative_id: string;
    relative_type_id: string;
    relative_type_name?: string | null;
    name?: string | null;
    nik?: string | null;
    birth_place?: string | null;
    birth_date?: string | null;
    is_deceased: boolean;
}

export interface AdmissionArchive {
    archive_type_id: string;
    archive_type_name: string;
    archive_id?: string | null;
    file_name?: string | null;
    mimetype?: string | null;
    size?: number | null;
    uploaded_at?: string | null;
}

export interface AdmissionRequirements {
    unit_choice: boolean;
    family_card: boolean;
    mother: boolean;
    father: boolean;
    guardian_required: boolean;
    guardian: boolean;
    parents: boolean;
    archives: boolean;
    is_complete: boolean;
}

export interface AdmissionStatus {
    candidate: {
        id: string;
        name: string;
        code?: string | null;
        nik?: string | null;
        email?: string | null;
        student_national_number?: string | null;
        school_name?: string | null;
        institution_id: string;
        individual_id?: string | null;
        created_at?: string | null;
    };
    unit?: {
        id: string;
        unit_id: string;
        unit_name?: string | null;
        registration_category_id: string;
        registration_category_name?: string | null;
    } | null;
    family_card?: { id: string; code?: string | null } | null;
    family_members: AdmissionFamilyMember[];
    archives: AdmissionArchive[];
    requirements: AdmissionRequirements;
}

export interface ApiResult<T> {
    ok: boolean;
    status: number;
    data?: T;
    message?: string;
}

async function parseResponse<T>(response: Response): Promise<ApiResult<T>> {
    let data: any = null;
    try {
        data = await response.json();
    } catch {
        data = null;
    }
    if (!response.ok) {
        const message = data?.brief || data?.message || data?.error?.brief || data?.error?.message || `HTTP error ${response.status}`;
        return { ok: false, status: response.status, message: typeof message === "string" ? message : JSON.stringify(message) };
    }
    return { ok: true, status: response.status, data };
}

async function request<T>(url: string, init: RequestInit): Promise<ApiResult<T>> {
    try {
        const response = await fetch(url, init);
        return await parseResponse<T>(response);
    } catch (error: any) {
        return { ok: false, status: 500, message: error?.message || "Gagal terhubung ke server" };
    }
}

/** Public option list (`{id, name}`) from an open `.../options` endpoint, e.g. `person/reference/gender` */
export async function fetchPublicOptions(apiPath: string): Promise<OptionItem[]> {
    const result = await request<OptionItem[]>(`${getBaseApiUrl()}/${apiPath}/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
    });
    return result.ok && Array.isArray(result.data) ? result.data : [];
}

export async function admissionRegister(payload: AdmissionRegisterPayload) {
    const result = await request<any>(`${getBaseApiUrl()}/${path}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(payload),
    });

    // Persist the new session the same way as LoginUserWithSession
    if (result.ok && result.data) {
        const data = result.data;
        if (data.session_id) setStorageItem("session_id", data.session_id, true);
        if (data.token) setStorageItem("token", data.token, true);
        if (data.user) {
            setStorageItem("user", JSON.stringify(data.user), true);
            if (data.user.id) setStorageItem("id", String(data.user.id), true);
            if (data.user.pid) setStorageItem("pid", String(data.user.pid), true);
            if (data.user.individual_id) setStorageItem("individual_id", String(data.user.individual_id), true);
            if (data.user.name) setStorageItem("name", data.user.name, true);
            if (data.user.email) setStorageItem("email", data.user.email, true);
            if (data.user.is_active !== undefined) setStorageItem("is_verified", String(data.user.is_active), true);
            if (data.user.current_role_id) setStorageItem("current_role", String(data.user.current_role_id), true);
            if (Array.isArray(data.user.roles)) setStorageItem("roles", JSON.stringify(data.user.roles), true);
        }
    }
    return result;
}

export async function admissionUnitOptions(institutionCode: string) {
    return request<AdmissionUnitOptions>(
        `${getBaseApiUrl()}/${path}/units?institution_code=${encodeURIComponent(institutionCode)}`,
        { method: "GET", headers: { Accept: "application/json" } },
    );
}

export async function admissionStatus(candidateId: string) {
    return request<AdmissionStatus>(`${getBaseApiUrl()}/${path}/${candidateId}/status`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
}

export async function admissionSaveUnit(candidateId: string, unitId: string, registrationCategoryId: string) {
    return request<AdmissionStatus>(`${getBaseApiUrl()}/${path}/${candidateId}/unit`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ unit_id: unitId, registration_category_id: registrationCategoryId }),
    });
}

export async function admissionSaveFamilyCard(candidateId: string, code: string) {
    return request<AdmissionStatus>(`${getBaseApiUrl()}/${path}/${candidateId}/family-card`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ code }),
    });
}

export async function admissionStoreFamilyMember(candidateId: string, payload: AdmissionFamilyMemberPayload) {
    return request<AdmissionStatus>(`${getBaseApiUrl()}/${path}/${candidateId}/family-members`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(payload),
    });
}

export async function admissionDeleteFamilyMember(candidateId: string, memberId: string) {
    return request<AdmissionStatus>(`${getBaseApiUrl()}/${path}/${candidateId}/family-members/${memberId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });
}

export async function admissionUploadArchive(candidateId: string, archiveTypeId: string, file: File) {
    const body = new FormData();
    body.append("file", file);
    const headers: Record<string, string> = { Accept: "application/json" };
    const token = getStorageItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    return request<AdmissionStatus>(`${getBaseApiUrl()}/${path}/${candidateId}/archives/${archiveTypeId}`, {
        method: "POST",
        headers,
        body,
    });
}

/** Fetches an uploaded archive as an object URL (the endpoint requires the bearer token) */
export async function admissionArchiveObjectUrl(candidateId: string, archiveId: string): Promise<string | null> {
    try {
        const headers: Record<string, string> = {};
        const token = getStorageItem("token");
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const response = await fetch(`${getBaseApiUrl()}/${path}/${candidateId}/archives/file/${archiveId}`, { headers });
        if (!response.ok) return null;
        return URL.createObjectURL(await response.blob());
    } catch {
        return null;
    }
}
