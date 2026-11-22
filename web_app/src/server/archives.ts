// Document archives for the administrator: file upload (relayed to the API's multipart endpoint
// with the same rules checked here first), the knowledge base status and re-indexing.
import { markSafeError } from '@solidjs/web';

import { apiFetch, apiPaginated } from './api';
import type { AuthState } from './auth';
import { requireAdministrator } from './administrator';
import { uploadProblem, type UploadError } from '../lib/archive-upload';
import { isUuid } from '../lib/validation';

type Raw = Record<string, any>;
const enc = encodeURIComponent;
const fail = (m: string, status?: number) => markSafeError(Object.assign(new Error(m), status ? { status } : {}));

const MESSAGES: Record<UploadError, string> = {
  noFile: 'Choose a file to upload',
  tooLarge: 'The file is larger than 50 MB',
  noType: 'Choose an archive type',
  badOwner: 'The owner id is not valid',
  tooLong: 'The description is too long',
  pdfOnly: 'Only PDF files can join the knowledge base',
};

/** Send an uploaded file to the API; only the fields the endpoint knows are forwarded. */
export async function uploadArchive(auth: AuthState, input: FormData): Promise<Raw> {
  requireAdministrator(auth);
  const file = input.get('file');
  if (!(file instanceof File)) throw fail(MESSAGES.noFile, 400);
  const text = (k: string) => String(input.get(k) ?? '').trim();
  const isKnowledge = ['true', '1', 'on'].includes(text('is_knowledge'));
  const problem = uploadProblem({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    archiveTypeId: text('archive_type_id'),
    archiveableId: text('archiveable_id') || undefined,
    description: text('description'),
    isKnowledge,
  });
  if (problem) throw fail(MESSAGES[problem], 400);

  const out = new FormData();
  out.set('file', file, file.name);
  out.set('archive_type_id', text('archive_type_id'));
  if (text('description')) out.set('description', text('description'));
  if (isKnowledge) out.set('is_knowledge', 'true');
  if (text('archiveable_id')) {
    out.set('archiveable_id', text('archiveable_id'));
    if (text('archiveable_type')) out.set('archiveable_type', text('archiveable_type').slice(0, 100));
  }
  return apiFetch<Raw>('document/transaction/archives/upload', { method: 'POST', body: out });
}

export async function loadArchiveTypes(auth: AuthState): Promise<{ id: string; name: string }[]> {
  requireAdministrator(auth);
  const res = await apiPaginated<Raw>('document/reference/archive-types', { page: 1, per_page: 200 });
  return res.data.map((t) => ({ id: String(t.id), name: String(t.name ?? t.code ?? t.id) }));
}

export async function loadKnowledgeStatus(auth: AuthState): Promise<Raw> {
  requireAdministrator(auth);
  return apiFetch<Raw>('document/transaction/archives/knowledge/status');
}

export async function reindexArchive(auth: AuthState, id: string): Promise<Raw> {
  requireAdministrator(auth);
  if (!isUuid(id)) throw fail('Not found', 404);
  return apiFetch<Raw>(`document/transaction/archives/${enc(id)}/reindex`, { method: 'POST' });
}

/** Rebuild the knowledge base: every archive, or only `ids`. */
export async function reindexAll(auth: AuthState, ids?: string[]): Promise<Raw> {
  requireAdministrator(auth);
  if (ids && !ids.every(isUuid)) throw fail('Not found', 404);
  return apiFetch<Raw>('document/transaction/archives/knowledge/reindex', { method: 'POST', body: ids?.length ? { ids } : {} });
}
