import type { ModelPagination } from '../models/pagination/ModelPagination';

export interface TypePaginationForm {
    search?: string;
    sort_by?: string;
    column?: string;
    sort_dir?: string;
    page: number;
    per_page: number;
    name?: string;
    code?: number;
}

export interface TypePaginationResponse<T = any> {
    pagination: ModelPagination;
    data: T[];
}

export interface TypeInputEntityReferenceForm {
    id?: string | null;
    code: number | string;
    alphabet_code?: string | null;
    alphabetic_code?: string | null;
    name: string;
    minimum?: number | null;
    maximum?: number | null;
}

export interface TypeAttachDetachPositionTypeInput {
    position_type_id: string;
    permission_ids: string[];
}

export interface TypeAttachDetachUserInput {
    user_id: string;
    permission_ids: string[];
}

export interface TypeAttachDetachUserPositionTypeInput {
    user_id: string;
    position_type_ids: string[];
}
