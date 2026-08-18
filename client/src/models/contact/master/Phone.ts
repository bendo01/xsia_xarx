export interface ContactMasterPhone {
    id: string;
    phone_number: string,
    phone_type_id: string,
    phoneable_id: string,
    phoneable_type: string,
    created_at: Date|null,
    updated_at: Date|null,
    deleted_at: Date|null,
    created_by: string|null,
    updated_by: string|null,
}