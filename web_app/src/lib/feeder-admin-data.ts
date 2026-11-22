// Client-facing functions of the administrator's Feeder pages.
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { listFeeder, loadFeederForm, loadFeederRecord, removeFeederRecord, saveFeederRecord } from '../server/feeder-admin';
import type { WriteResult } from '../server/institution-write';
import type { FeederGroup } from './feeder-admin';
import { parsePageSize } from './url';

export type { WriteResult };

export const getFeederList = query(async (group: FeederGroup, slug: string, page: number, size: number) => {
  'use server';
  return listFeeder(await requireAuth(), group, slug, page, parsePageSize(size));
}, 'admin-feeder-list');

export const getFeederRecord = query(async (group: FeederGroup, slug: string, id: string) => {
  'use server';
  return loadFeederRecord(await requireAuth(), group, slug, id);
}, 'admin-feeder-record');

export const getFeederForm = query(async (slug: string, id: string) => {
  'use server';
  return loadFeederForm(await requireAuth(), slug, id);
}, 'admin-feeder-form');

export async function saveFeederRow(slug: string, id: string, input: Record<string, unknown>): Promise<WriteResult> {
  'use server';
  return saveFeederRecord(await requireAuth(), slug, id || null, input);
}

export async function deleteFeederRow(slug: string, id: string): Promise<void> {
  'use server';
  await removeFeederRecord(await requireAuth(), slug, id);
}
