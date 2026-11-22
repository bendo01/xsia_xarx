// Types and pure rules of the candidate's admission checklist (no server imports; unit-tested).
export interface OptionItem {
  id: string;
  name: string;
}

export interface AdmissionFamilyMember {
  id: string;
  relative_type_name?: string | null;
  name?: string | null;
  nik?: string | null;
  birth_place?: string | null;
  birth_date?: string | null;
  is_deceased: boolean;
}

export interface AdmissionArchive {
  archive_type_id: string;
  archive_type_name: string;
  archive_id?: string | null;
  file_name?: string | null;
  size?: number | null;
}

export interface AdmissionRequirements {
  unit_choice: boolean;
  family_card: boolean;
  mother: boolean;
  father: boolean;
  guardian_required: boolean;
  guardian: boolean;
  parents: boolean;
  archives: boolean;
  is_complete: boolean;
}

export interface AdmissionStatus {
  candidate: { id: string; name: string; code?: string | null; nik?: string | null; email?: string | null };
  unit?: { unit_id: string; unit_name?: string | null; registration_category_id: string; registration_category_name?: string | null } | null;
  family_card?: { id: string; code?: string | null } | null;
  family_members: AdmissionFamilyMember[];
  archives: AdmissionArchive[];
  requirements: AdmissionRequirements;
}

export interface MemberInput {
  relative_type_id: string;
  name: string;
  nik: string;
  birth_place: string;
  birth_date: string;
  gender_id: string;
  is_deceased: boolean;
}

/** Relative types a candidate may register, matched by name. */
export const PARENT_RELATIVE_TYPES = ['Ayah Kandung', 'Ibu Kandung', 'Ayah Wali', 'Ibu Wali'];
export const MAX_ARCHIVE_SIZE = 5 * 1024 * 1024;
const NIK_RE = /^\d{16}$/;

/** How many of the four steps (programme, family card, parents, documents) are done. */
export const completedSteps = (r: AdmissionRequirements | undefined) =>
  r ? [r.unit_choice, r.family_card, r.parents, r.archives].filter(Boolean).length : 0;

/** Each validator returns the i18n key of the problem, or null. */
export const validateUnitChoice = (unitId: string, categoryId: string) => (unitId && categoryId ? null : 'cn.pilihProgramStudiDanKelasPendaftaran');
export const validateFamilyCard = (code: string) => (NIK_RE.test(code.trim()) ? null : 'cn.nomorKartuKeluargaHarus16Digit');

export function validateMember(m: MemberInput): string | null {
  if (!m.relative_type_id || !m.name.trim() || !m.birth_place.trim() || !m.birth_date) return 'cn.lengkapiHubunganNamaTempatDanTanggal';
  return NIK_RE.test(m.nik.trim()) ? null : 'cn.nikHarus16DigitAngka';
}

export const validateArchiveSize = (size: number) => (size > MAX_ARCHIVE_SIZE ? 'cn.ukuranBerkasMaksimal5MB' : null);

/** Keep only the parent / guardian types, in the fixed display order. */
export const parentTypes = (all: OptionItem[]): OptionItem[] =>
  PARENT_RELATIVE_TYPES.map((n) => all.find((o) => o.name === n)).filter((o): o is OptionItem => Boolean(o));

export const formatSize = (size?: number | null) => (!size ? '-' : size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`);
