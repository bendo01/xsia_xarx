export interface LocationCountry {
    id: string;
    code: string | null;
    name: string | null;
    alpha2_code?: string | null;
    alpha3_code?: string | null;
    iso3166_2_code?: string | null;
    dikti_code?: string | null;
    continent_id?: string | null;
    region_id?: string | null;
    slug?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
}
