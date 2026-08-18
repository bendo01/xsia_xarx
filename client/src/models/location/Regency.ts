import type { LocationProvince } from "./Province";
import type { LocationRegencyType } from "./RegencyType";

export interface LocationRegency {
    id: string;
    code: string|null,
    name: string|null,
    dikti_code: string|null,
    epsbed_code: string|null,
    province_id: string|null,
    regency_type_id: string|null,
    description: string|null,
    slug: string|null,
    alt_slug: string|null,
    state_ministry_code: string|null,
    state_ministry_full_code: string|null,
    state_post_department_code: string|null,
    state_ministry_name: string|null,
    dikti_name: string|null,
    validation_code: string|null,
    latitude: number|null,
    longitude: number|null,
    zoom: number|null,
    created_at: Date|null,
    updated_at: Date|null,
    deleted_at: Date|null,
    created_by: string|null,
    updated_by: string|null
}

export interface LocationRegencyWithRelations extends LocationRegency {
    regency: LocationRegency|null,
    province: LocationProvince|null,
    regency_type: LocationRegencyType|null,
}

export var initialLocationRegency: LocationRegency = {
    id: "",
    code: "",
    name: "",
    dikti_code: "",
    epsbed_code: "",
    province_id: "",
    regency_type_id: "",
    slug: "",
    description: null,
    alt_slug: null,
    state_ministry_code: null,
    state_ministry_full_code: null,
    state_post_department_code: null,
    state_ministry_name: null,
    dikti_name: null,
    validation_code: null,
    latitude: 0,
    longitude: 0,
    zoom: 0,
    created_at: null,
    updated_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};