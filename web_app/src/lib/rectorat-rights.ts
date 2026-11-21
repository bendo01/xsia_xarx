// Who may change staff appointments and employees in the rectorat area. Matches the API grants of
// the `rectorat-admin` area (server utility_12): Rektor, Kepala Biro Administrasi Umum and Kepala Pengembangan Teknologi Informasi only.
// Everyone else in the area (Wakil Rektor, Dekan, Yayasan, Staff Biro...) is read-only.
import type { UserRoleItem } from './roles';

/** Position types (institution_reference.position_types) allowed to write. */
export const INSTITUTION_ADMIN_POSITION_TYPES = [
  'e34401db-84ec-450b-bdba-6b9640fc3ae8', // Rektor
  'b92fb48d-53c6-4219-a826-432bdae23ae5', // Kepala Biro Administrasi Umum
  'd7208431-ba92-4c75-855c-3f8ab651646f', // Kepala Pengembangan Teknologi Informasi
];

export function canManageInstitution(role: UserRoleItem | null | undefined): boolean {
  return !!role?.position_type_id && INSTITUTION_ADMIN_POSITION_TYPES.includes(role.position_type_id);
}
