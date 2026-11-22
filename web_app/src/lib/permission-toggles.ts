// Pure parts of the permission editor: which owners can hold permissions and how permissions are grouped.
export type PermissionOwnerKind = 'role' | 'position-type';

export interface PermissionOwner {
  /** The owner record's endpoint. */
  api: string;
  /** The link table (owner <-> permission). */
  linkApi: string;
  /** The owner's column in the link table. */
  linkField: 'role_id' | 'position_type_id';
}

export const PERMISSION_OWNERS: Record<PermissionOwnerKind, PermissionOwner> = {
  role: { api: 'role', linkApi: 'permission-role', linkField: 'role_id' },
  'position-type': { api: 'institution/reference/position-type', linkApi: 'permission-position-type', linkField: 'position_type_id' },
};

export interface PermissionRow {
  id: string;
  name: string;
  uri?: string | null;
}

export interface PermissionGroup {
  controller: string;
  permissions: PermissionRow[];
}

/** Permission names follow the route name convention `<module>.<controller>.<action>`. */
export function splitPermissionName(name: string): { controller: string; action: string } {
  const i = name.lastIndexOf('.');
  return i === -1 ? { controller: 'other', action: name } : { controller: name.slice(0, i), action: name.slice(i + 1) };
}

/** Group by controller (A-Z), keeping only those matching `query` (name or uri) and, optionally, the assigned ones. */
export function groupPermissions(permissions: PermissionRow[], assigned: Record<string, string>, query = '', assignedOnly = false): PermissionGroup[] {
  const q = query.trim().toLowerCase();
  const by = new Map<string, PermissionRow[]>();
  for (const p of permissions) {
    if (q && !p.name.toLowerCase().includes(q) && !(p.uri ?? '').toLowerCase().includes(q)) continue;
    if (assignedOnly && !assigned[p.id]) continue;
    const { controller } = splitPermissionName(p.name);
    by.set(controller, [...(by.get(controller) ?? []), p]);
  }
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([controller, items]) => ({ controller, permissions: items }));
}
