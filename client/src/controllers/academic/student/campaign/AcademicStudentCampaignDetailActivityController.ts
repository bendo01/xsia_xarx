const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

import { getStorageItem } from "../../../../lib/storage";

export async function academicStudentCampaignDetailActivityAttend(student_activity_id: string, teach_id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/detail_activities/attend`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify({
                student_activity_id: student_activity_id,
                teach_id: teach_id
            })
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: data
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

export async function academicStudentCampaignDetailActivityDelete(id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${server_api_url}academic/student/campaign/detail_activities/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: data
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