export interface DocumentArchive {
    id: string;
    name: string;
    dir: string;
    mimetype: string;
    size?: number | null;
    archiveable_id?: string | null;
    archiveable_type?: string | null;
    archive_type_id: string;
    description?: string | null;
    is_knowledge: boolean;
    created_at?: string | null;
    updated_at?: string | null;
    deleted_at?: string | null;
    sync_at?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
}
