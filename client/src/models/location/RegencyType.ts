export interface LocationRegencyType {
    id: string;
    code: string|null,
    alphabet_code: string|null,
    name: string|null,
    created_at: Date|null,
    updated_at: Date|null,
    deleted_at: Date|null,
    created_by: string|null,
    updated_by: string|null
}

export var initialLocationRegencyType: LocationRegencyType = {
    id: "",
    code: "",
    alphabet_code: null,
    name: "",
    created_at: null,
    updated_at: null,
    deleted_at: null,
    created_by: "",
    updated_by: "",
};