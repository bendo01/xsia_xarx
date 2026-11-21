import type { UserRoleItem } from './roles';
import { isStaffProgramStudi } from './roles';
import { isUuid } from './validation';

const ZERO = '00000000-0000-0000-0000-000000000000';

/**
 * The unit (study program) a Kepala/Staff Program Studi works in. The route's [id] may be a
 * placeholder ("[id]", zero UUID) when the link was built before the unit was known: that means
 * "my unit", taken from the active role (same rule as getDashboardPathForRole).
 */
export function resolveUnitId(raw: string | null | undefined, role: UserRoleItem | null | undefined): string | null {
  const v = (raw ?? '').trim();
  const placeholder = !v || v === '[id]' || v === ':id' || v === ZERO;
  let id = v;
  if (placeholder) {
    const staff = role?.roleable_type?.includes('Staff') || isStaffProgramStudi(role);
    id = role?.unit_id || (!staff && role?.roleable_id ? role.roleable_id : '') || '';
  }
  return isUuid(id) && id !== ZERO ? id : null;
}
