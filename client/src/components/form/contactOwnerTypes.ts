/**
 * Polymorphic owners a contact record (phone, electronic mail, residence) can belong to.
 * `value` is the model class name the server stores in the `*able_type` column;
 * `apiPath` is the list endpoint used to search for the owning record.
 */
export interface ContactOwnerType {
    value: string;
    label: string;
    apiPath: string;
}

export const CONTACT_OWNER_TYPES: ContactOwnerType[] = [
    { value: 'App\\Models\\Person\\Master\\Individual', label: 'Individual', apiPath: 'person/master/individual' },
    { value: 'App\\Models\\Institution\\Master\\Institution', label: 'Institution', apiPath: 'institution/master/institutions' },
    { value: 'App\\Models\\Institution\\Master\\Unit', label: 'Unit', apiPath: 'institution/master/units' },
];

export type ContactOwnerOption = { id: string; code?: string | null; name?: string | null };

export const findContactOwnerType = (value: string) => CONTACT_OWNER_TYPES.find((type) => type.value === value);
