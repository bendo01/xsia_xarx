export interface ContactMasterResidence {
    street: string,
    citizens_association: number,
    neighborhood_association: number,
    province_id: string,
    regency_id: string,
    sub_district_id: string,
    village_id: string,
}

export const initialContactMasterResidence: ContactMasterResidence = {
    street: "",
    citizens_association: 0,
    neighborhood_association: 0,
    province_id: "",
    regency_id: "",
    sub_district_id: "",
    village_id: "",
}