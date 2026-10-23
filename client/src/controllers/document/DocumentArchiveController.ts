import type { TypePaginationForm, TypePaginationResponse } from '~/lib/types';
import type { DocumentArchive } from '~/models/document/Archive';
import { getStorageItem } from '~/lib/storage';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
const path = 'document/transaction/archives';

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (typeof window !== 'undefined') {
        const token = getStorageItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};

export async function DocumentArchiveControllerIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<DocumentArchive>> {
    try {
        const params = new URLSearchParams();
        if (props.page) params.append('page', props.page.toString());
        if (props.per_page) params.append('page_size', props.per_page.toString());
        if (props.search) params.append('name', props.search);
        if (props.name) params.append('name', props.name);

        const res = await fetch(`${getBaseUrl()}/${path}?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const resJson = await res.json();
        return {
            pagination: {
                search: props.search || '',
                sort_by: props.sort_by || '',
                column: props.column || '',
                sort_dir: props.sort_dir || '',
                page: resJson.page || props.page || 1,
                per_page: resJson.page_size || props.per_page || 10,
                total_page: resJson.total_pages || 0,
                last_page: resJson.total_pages || 1,
                total_data: resJson.total ?? (Array.isArray(resJson.data) ? resJson.data.length : 0),
            },
            data: Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : []),
        };
    } catch (e) {
        console.error('Error in DocumentArchiveControllerIndex:', e);
        return {
            pagination: {
                search: props.search || '',
                sort_by: props.sort_by || '',
                column: props.column || '',
                sort_dir: props.sort_dir || '',
                page: props.page || 1,
                per_page: props.per_page || 10,
                total_page: 0,
                last_page: 1,
                total_data: 0,
            },
            data: [],
        };
    }
}

export async function DocumentArchiveControllerUpsert(
    form: {
        id?: string | null;
        name: string;
        dir: string;
        mimetype: string;
        size?: number | null;
        archiveable_id?: string | null;
        archiveable_type?: string | null;
        archive_type_id: string;
        description?: string | null;
        is_knowledge?: boolean;
    },
): Promise<{ is_error: boolean; message: string; data?: DocumentArchive }> {
    try {
        const isUpdate = Boolean(form.id && form.id !== '' && form.id !== '00000000-0000-0000-0000-000000000000');
        const url = isUpdate
            ? `${getBaseUrl()}/${path}/${form.id}`
            : `${getBaseUrl()}/${path}`;
        const method = isUpdate ? 'PUT' : 'POST';

        const payload: Record<string, any> = {
            name: form.name,
            dir: form.dir || '/uploads',
            mimetype: form.mimetype || 'application/octet-stream',
            size: form.size !== undefined && form.size !== null ? Number(form.size) : null,
            archiveable_id: form.archiveable_id || null,
            archiveable_type: form.archiveable_type || null,
            archive_type_id: form.archive_type_id,
            description: form.description || null,
            is_knowledge: Boolean(form.is_knowledge),
        };

        const res = await fetch(url, {
            method,
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || (isUpdate ? 'Failed to update archive.' : 'Failed to create archive.'),
            };
        }

        return {
            is_error: false,
            message: isUpdate ? 'Archive updated successfully.' : 'Archive created successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving archive.',
        };
    }
}

export async function DocumentArchiveControllerDelete(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/${props.id}`, {
            method: 'DELETE',
            headers: getHeaders(),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || 'Failed to delete archive.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Archive deleted successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while deleting archive.',
        };
    }
}

export interface DocumentArchiveUploadResult {
    is_error: boolean;
    message: string;
    data?: DocumentArchive;
    /** `queued` or `skipped` when the file was meant for the knowledge base */
    knowledge_status?: string | null;
    /** Why the file was not added to the knowledge base (e.g. docling is not installed) */
    warning?: string | null;
}

export async function DocumentArchiveControllerUpload(form: {
    file: File;
    archive_type_id: string;
    description?: string | null;
    is_knowledge?: boolean;
}): Promise<DocumentArchiveUploadResult> {
    try {
        const body = new FormData();
        body.append('file', form.file);
        body.append('archive_type_id', form.archive_type_id);
        if (form.description) body.append('description', form.description);
        body.append('is_knowledge', String(Boolean(form.is_knowledge)));

        // Let the browser set the multipart boundary
        const headers = getHeaders();
        delete headers['Content-Type'];

        const res = await fetch(`${getBaseUrl()}/${path}/upload`, { method: 'POST', headers, body });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: resJson.message || resJson.brief || 'Failed to upload archive.' };
        }
        return {
            is_error: false,
            message: 'Archive uploaded successfully.',
            data: resJson.archive,
            knowledge_status: resJson.knowledge_status ?? null,
            warning: resJson.warning ?? null,
        };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while uploading archive.' };
    }
}

export async function DocumentArchiveControllerReindex(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/${props.id}/reindex`, {
            method: 'POST',
            headers: getHeaders(),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: resJson.message || resJson.brief || 'Failed to queue archive.' };
        }
        return { is_error: false, message: resJson.message || 'Archive queued for the knowledge base.' };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while queueing archive.' };
    }
}

export interface KnowledgeItemStatus {
    id: string;
    name: string;
    size?: number | null;
    chunk_count: number;
    last_indexed_at?: string | null;
}

export interface KnowledgeStatus {
    items: KnowledgeItemStatus[];
    queue_length: number;
    docling_available: boolean;
    total_chunks: number;
}

export interface KnowledgeRebuildResult {
    queued: number;
    skipped: { id: string; name: string; reason: string }[];
    message: string;
}

export async function DocumentArchiveControllerKnowledgeStatus(): Promise<{
    is_error: boolean;
    message: string;
    data?: KnowledgeStatus;
}> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/knowledge/status`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: resJson.message || resJson.brief || 'Failed to load knowledge base status.' };
        }
        return { is_error: false, message: '', data: resJson as KnowledgeStatus };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while loading knowledge base status.' };
    }
}

/** Queues the given archives (all knowledge archives when `ids` is empty) for a rebuild of their chunks */
export async function DocumentArchiveControllerKnowledgeRebuild(
    props: { ids?: string[] },
): Promise<{ is_error: boolean; message: string; data?: KnowledgeRebuildResult }> {
    try {
        const res = await fetch(`${getBaseUrl()}/${path}/knowledge/reindex`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ ids: props.ids ?? [] }),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: resJson.message || resJson.brief || resJson.detail || 'Failed to rebuild the knowledge base.' };
        }
        return { is_error: false, message: resJson.message || '', data: resJson as KnowledgeRebuildResult };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while rebuilding the knowledge base.' };
    }
}

export interface RegulationItemStatus {
    id: string;
    title: string;
    number?: string | null;
    year?: number | null;
    status: string;
    source?: string | null;
    chunk_count: number;
}

export interface RegulationRebuildResult {
    queued: number;
    skipped: { name: string; reason: string }[];
    message: string;
}

export interface RegulationStatus {
    items: RegulationItemStatus[];
    folder_pdf_count: number;
    unregistered: string[];
    total_chunks: number;
    docling_available: boolean;
    folder_available: boolean;
    indexed_count: number;
    /** Embedding jobs in the shared queue, including the one being processed */
    queue_length: number;
}

const aiBaseUrl = () => `${getBaseUrl()}/ai/regulations`;

export async function RegulationKnowledgeStatus(): Promise<{
    is_error: boolean;
    message: string;
    data?: RegulationStatus;
}> {
    try {
        const res = await fetch(`${aiBaseUrl()}/status`, { method: 'GET', headers: getHeaders() });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: resJson.message || resJson.brief || 'Failed to load regulation status.' };
        }
        return { is_error: false, message: '', data: resJson as RegulationStatus };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while loading regulation status.' };
    }
}

/** Queues the regulation folder on the PGMQ embedding queue; `force` also re-embeds documents that already have chunks */
export async function RegulationKnowledgeRebuild(
    props: { force: boolean },
): Promise<{ is_error: boolean; message: string; data?: RegulationRebuildResult }> {
    try {
        const res = await fetch(`${aiBaseUrl()}/rebuild`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ force: props.force }),
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return { is_error: true, message: resJson.message || resJson.brief || resJson.detail || 'Failed to start the regulation rebuild.' };
        }
        return { is_error: false, message: resJson.message || '', data: resJson as RegulationRebuildResult };
    } catch (error: any) {
        return { is_error: true, message: error.message || 'Network error while starting the regulation rebuild.' };
    }
}
