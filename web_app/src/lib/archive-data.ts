import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadArchiveTypes, loadKnowledgeStatus, reindexAll, reindexArchive } from '../server/archives';

export const getArchiveTypes = query(async () => {
  'use server';
  return loadArchiveTypes(await requireAuth());
}, 'archive-types');

export const getKnowledgeStatus = query(async () => {
  'use server';
  return loadKnowledgeStatus(await requireAuth());
}, 'knowledge-status');

export async function reindexArchiveRow(id: string): Promise<{ message: string }> {
  'use server';
  const res = await reindexArchive(await requireAuth(), id);
  return { message: String(res?.message ?? '') };
}

export async function reindexAllRows(): Promise<{ queued: number; skipped: number; message: string }> {
  'use server';
  const res = await reindexAll(await requireAuth());
  return { queued: Number(res?.queued ?? 0), skipped: Array.isArray(res?.skipped) ? res.skipped.length : 0, message: String(res?.message ?? '') };
}
