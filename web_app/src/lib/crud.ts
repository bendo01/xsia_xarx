// CRUD data layer for courses, curricula and class codes (course-department role).
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import {
  listChildren, listRecords, loadFormOptions, removeChild, removeRecord, requireProdi, saveChild, saveRecord, setClassLock, showChild, showRecord,
  type SaveResult,
} from '../server/crud';
import { FORMS, parentOfChild } from './crud-forms';
import type { ChildKey, ResourceKey, TopKey } from './crud-schema';

export const getRecords = query(async (key: TopKey, page: number, search: string) => {
  'use server';
  const unitId = await requireProdi(await requireAuth());
  return listRecords(key, unitId, page, search);
}, 'crud-list');

/** One record of my unit plus the options its form needs (`id` empty = the create form). */
/** A select must still offer the value a record already has, even if the option list is capped. */
function keepCurrent(key: ResourceKey, record: Record<string, any> | null, options: Record<string, { id: string; name: string }[]>) {
  if (!record) return;
  for (const f of FORMS[key]) {
    const v = record[f.name];
    if (f.widget === 'select' && typeof v === 'string' && v && !options[f.name]?.some((o) => o.id === v)) {
      (options[f.name] ??= []).unshift({ id: v, name: `${v.slice(0, 8)}…` });
    }
  }
}

export const getRecord = query(async (key: TopKey, id: string, search = '') => {
  'use server';
  const unitId = await requireProdi(await requireAuth());
  const [record, options] = await Promise.all([id ? showRecord(key, unitId, id) : null, loadFormOptions(key, unitId, search)]);
  // Editing a staff member: the current employee must be among the options even without a search.
  if (key === 'staff' && record?.employee_id && !options.employee_id?.some((o) => o.id === record.employee_id)) {
    (options.employee_id ??= []).unshift({ id: String(record.employee_id), name: String(record.name ?? record.employee_id) });
  }
  keepCurrent(key, record, options);
  return { record, options };
}, 'crud-record');

export async function saveRow(key: TopKey, id: string, input: Record<string, unknown>): Promise<SaveResult> {
  'use server';
  return saveRecord(await requireAuth(), key, id || null, input);
}

export async function deleteRow(key: TopKey, id: string): Promise<void> {
  'use server';
  await removeRecord(await requireAuth(), key, id);
}

export const getChildren = query(async (key: ChildKey, parentId: string, page: number) => {
  'use server';
  const unitId = await requireProdi(await requireAuth());
  const [parent, rows] = await Promise.all([showRecord(parentOfChild(key), unitId, parentId), listChildren(key, unitId, parentId, page)]);
  return { parent, rows };
}, 'crud-children');

/** One child (empty `id` = create form) with its parent and the form's select options. */
export const getChild = query(async (key: ChildKey, parentId: string, id: string) => {
  'use server';
  const unitId = await requireProdi(await requireAuth());
  const [parent, record, options] = await Promise.all([
    showRecord(parentOfChild(key), unitId, parentId),
    id ? showChild(key, unitId, parentId, id) : null,
    loadFormOptions(key as ResourceKey, unitId),
  ]);
  keepCurrent(key, record, options);
  return { parent, record, options };
}, 'crud-child');

export async function saveChildRow(key: ChildKey, parentId: string, id: string, input: Record<string, unknown>): Promise<SaveResult> {
  'use server';
  return saveChild(await requireAuth(), key, parentId, id || null, input);
}

export async function deleteChildRow(key: ChildKey, parentId: string, id: string): Promise<void> {
  'use server';
  await removeChild(await requireAuth(), key, parentId, id);
}


/** Locks (true) or unlocks (false) a teaching class of my unit. */
export async function lockClassRow(teachId: string, locked: boolean): Promise<void> {
  'use server';
  await setClassLock(await requireAuth(), teachId, locked);
}
