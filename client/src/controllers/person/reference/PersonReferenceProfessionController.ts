// import type { TypePaginationForm } from "../../../lib/types";
// import type { TypeInputEntityReferenceForm } from "../../../lib/types";
// import { UpsertDeleteMessage } from "../../../models/common/reference/ModelCommonReference";
// import type { ModelCommonReferencePaginationResponse } from "../../../models/pagination/ModelPagination";
import type { ModelSelectItem } from "../../../models/common/select/ModelSelectItem";
// import type{ CommonMessage } from "../../../models/common/Message";
// import { getStorageItem } from "../../../lib/storage";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
// const path = "person/reference/profession";

export async function PersonReferenceControllerProfessionList(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    try {
        const response = await fetch(`${server_api_url}person/reference/professions/list`, {
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
                message: "Gagal Mengambil Data Profesi"
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