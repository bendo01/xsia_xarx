// What a study-program position may do. Kepala (head) and Sekretaris: everything. An explicit
// Staff position: create and edit, but no delete, no class lock/unlock, no staff-directory changes.
// Any other role that maps to the study-program area (Kajur, BAAK...) keeps full rights, so nobody
// loses access because of how their position happens to be named.
import { positionName, type UserRoleItem } from './roles';

export type ProdiRank = 'head' | 'secretary' | 'staff' | 'other';

export interface ProdiRights {
  canDelete: boolean;
  canLockClass: boolean;
  canManageStaff: boolean;
}

export type ProdiRight = keyof ProdiRights;

const names = (role: UserRoleItem) =>
  [role.name, role.position_type_name, positionName(role.position_type)].map((v) => positionName(v).toLowerCase());

export function prodiRank(role: UserRoleItem | null | undefined): ProdiRank {
  if (!role) return 'other';
  const all = names(role);
  const has = (...words: string[]) => all.some((n) => words.some((w) => n.includes(w)));
  // Head and secretary first: "Staff Sekretaris" style names are not expected, but the stronger title wins.
  if (has('kepala program studi', 'kaprodi')) return 'head';
  if (has('sekretaris', 'sekertaris', 'sekprodi')) return 'secretary';
  if (has('staff', 'staf')) return 'staff';
  return 'other';
}

export function prodiRights(role: UserRoleItem | null | undefined): ProdiRights {
  const limited = prodiRank(role) === 'staff';
  return { canDelete: !limited, canLockClass: !limited, canManageStaff: !limited };
}
