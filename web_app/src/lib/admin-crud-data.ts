// Client-facing functions of the administrator CRUD pages.
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { listAdminRecords, loadAdminForm, loadAdminRecord, removeAdminRecord, saveAdminRecord, searchOptions } from '../server/admin-crud';
import type { WriteResult } from '../server/institution-write';
import { parsePageSize } from './url';

export type { WriteResult };

export const getAdminRecords = query(async (key: string, page: number, search: string, size: number) => {
  'use server';
  return listAdminRecords(await requireAuth(), key, page, search, parsePageSize(size));
}, 'admin-records');

export const getAdminForm = query(async (key: string, id: string) => {
  'use server';
  return loadAdminForm(await requireAuth(), key, id);
}, 'admin-form');

export const getAdminRecord = query(async (key: string, id: string) => {
  'use server';
  return loadAdminRecord(await requireAuth(), key, id);
}, 'admin-record');

export async function saveAdminRow(key: string, id: string, input: Record<string, unknown>): Promise<WriteResult> {
  'use server';
  return saveAdminRecord(await requireAuth(), key, id || null, input);
}

export async function deleteAdminRow(key: string, id: string): Promise<void> {
  'use server';
  await removeAdminRecord(await requireAuth(), key, id);
}

/** Matches for a lookup field of `key`'s form (the source must be one of that resource's own lookup fields). */
export async function searchAdminOptions(key: string, source: string, search: string) {
  'use server';
  return searchOptions(await requireAuth(), key, source, search);
}
