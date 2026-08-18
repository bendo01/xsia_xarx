export interface LocationVillage {
    id: string;
    code: string;
    name: string;
    sub_district_id: string;
    slug: string | null;
    alt_slug: string | null;
    state_ministry_code: string | null;
    state_post_department_code: string | null;
    state_ministry_name: string | null;
    dikti_name: string | null;
    dikti_code: string | null;
    latitude: number | null;
    longitude: number | null;
    zoom: number | null;
    created_at: Date | null;
    updated_at: Date | null;
    deleted_at: Date | null;
    created_by: string | null;
    updated_by: string | null;
}

export const initialLocationVillage: LocationVillage = {
    id: "",
    code: "",
    name: "",
    sub_district_id: "",
    slug: null,
    alt_slug: null,
    state_ministry_code: null,
    state_post_department_code: null,
    state_ministry_name: null,
    dikti_name: null,
    dikti_code: null,
    latitude: null,
    longitude: null,
    zoom: null,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};