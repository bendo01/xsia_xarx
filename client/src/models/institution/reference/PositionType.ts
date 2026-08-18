import { Permission } from "../../auth/Permission";

export interface InstitutionReferencePositionType {
    id: string;
    code: number;
    alphabet_code: string;
    name: string;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
    permissions: Permission[];
}

export const initialAuthPermission: InstitutionReferencePositionType = {
    id: "",
    code: 0,
    alphabet_code: "",
    name: "",
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
    permissions: [],
};