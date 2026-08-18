import type { ModelSelectItem } from "../../../models/common/select/ModelSelectItem";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5155/api/";

export async function getUnitLists(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    const institution_id = import.meta.env.VITE_INSTITUTION_ID ?? "00000000-0000-0000-0000-000000000000";
    try {
        const response = await fetch(`${server_api_url}institution/master/unit/list/${institution_id}`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            }
        });
        const data: ModelSelectItem[] = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Unit"
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

export interface SummaryStats {
    total_unit: number;
    total_student: number;
    total_lecturer: number;
    total_course: number;
    total_alumni: number;
}

export interface UnitSummaryResponse {
    summary: SummaryStats;
    lecturers: any[]; // Using any[] for now as Lecturer model is generic on client side
}

export async function getUnitSummary(unit_id: string): Promise<{
    code: number;
    message: string | UnitSummaryResponse;
}> {
    try {
        const response = await fetch(`${server_api_url}institution/master/units/${unit_id}/summary`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        const data: UnitSummaryResponse = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Summary Unit"
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

export interface CurriculumModel {
    id: string;
    name: string;
    total_credit: number;
    mandatory_course_credit: number;
    optional_course_credit: number;
    academic_year_id: string;
    curriculum_type_id: string;
    unit_id: string;
    created_at: string;
    updated_at: string;
}

export interface CourseInfo {
    id: string;
    code: string;
    name: string;
    lecture_credit: number;
    practice_credit: number;
    simulation_credit: number;
    total_credit: number;
    unit_id: string;
}

export interface LearnPlanning {
    id: string;
    code: number;
    name: string;
    decription_indonesian: string;
}

export interface CourseWrapper {
    info: CourseInfo;
    learn_plannings: LearnPlanning[];
    evaluation_plannings: any[];
}

export interface CurriculumDetail {
    id: string;
    curriculum_id: string;
    course_id: string;
    semester_id: string;
    credit: number;
}

export interface CurriculumDetailWrapper {
    course: CourseWrapper;
    detail: CurriculumDetail;
}

export interface LatestCurriculumResponse {
    curriculum: CurriculumModel;
    details: CurriculumDetailWrapper[];
}

export async function getLatestCurriculum(unit_id: string): Promise<{
    code: number;
    message: string | LatestCurriculumResponse;
}> {
    try {
        const response = await fetch(`${server_api_url}institution/master/units/${unit_id}/latest_curriculum`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        const data: LatestCurriculumResponse = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Kurikulum Terbaru"
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

export async function list(institution_id: string): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const response = await fetch(`${server_api_url}institution/master/units/list/${institution_id}`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            }
        });
        const data: ModelSelectItem[] = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Gagal Mengambil Data Unit"
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