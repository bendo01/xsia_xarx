export interface ContactMasterElectronicMail {
    id: string;
    email_address: string,
    electronic_mail_type_id: string,
    electronic_mailable_id: string,
    electronic_mailable_type: string,
    created_at: Date|null,
    updated_at: Date|null,
    deleted_at: Date|null,
    created_by: string|null,
    updated_by: string|null,
}