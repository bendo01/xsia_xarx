import { ModelPagination as PaginateResult } from "../../pagination/ModelPagination";

export interface DocumentTransactionArchive {
    id: string;
    name: string;
    description: string | null;
    is_knowledge: boolean;
    dir: string;
    mimetype: string;
    size: number;
    archiveable_id: string;
    archiveable_type: string | null;
    archive_type_id: string;
    created_at: string;
    updated_at: string;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export interface ModelPagination {
    pagination: PaginateResult;
    data: DocumentTransactionArchive[];
}
