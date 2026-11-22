import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { assignPermission, loadPermissionEditor, revokePermission, type PermissionEditorData } from '../server/role-permissions';
import type { PermissionOwnerKind } from './permission-toggles';

export type { PermissionEditorData };

export const getPermissionEditor = query(async (kind: PermissionOwnerKind, id: string) => {
  'use server';
  return loadPermissionEditor(await requireAuth(), kind, id);
}, 'permission-editor');

export async function assignPermissionRow(kind: PermissionOwnerKind, id: string, permissionId: string): Promise<string> {
  'use server';
  return assignPermission(await requireAuth(), kind, id, permissionId);
}

export async function revokePermissionRow(kind: PermissionOwnerKind, id: string, linkId: string): Promise<void> {
  'use server';
  await revokePermission(await requireAuth(), kind, id, linkId);
}
