export interface ContactMasterWebsite {
    id: string;
    website_url: string,
    website_type_id: string,
    websiteable_id: string,
    websiteable_type: string,
    created_at: Date|null,
    updated_at: Date|null,
    deleted_at: Date|null,
    created_by: string|null,
    updated_by: string|null,
}