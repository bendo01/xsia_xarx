import { describe, expect, it } from 'vitest';

import {
  MAX_ARCHIVE_SIZE, completedSteps, formatSize, parentTypes, validateArchiveSize, validateFamilyCard, validateMember, validateUnitChoice,
  type AdmissionRequirements, type MemberInput,
} from './admission-types';

const req = (o: Partial<AdmissionRequirements>): AdmissionRequirements => ({
  unit_choice: false, family_card: false, mother: false, father: false, guardian_required: false, guardian: false, parents: false, archives: false, is_complete: false, ...o,
});
const member: MemberInput = { relative_type_id: 'r', name: 'Ani', nik: '1234567890123456', birth_place: 'Jakarta', birth_date: '1970-01-01', gender_id: '', is_deceased: false };

describe('admission rules', () => {
  it('counts completed steps', () => {
    expect(completedSteps(undefined)).toBe(0);
    expect(completedSteps(req({ unit_choice: true, archives: true, mother: true }))).toBe(2);
    expect(completedSteps(req({ unit_choice: true, family_card: true, parents: true, archives: true }))).toBe(4);
  });
  it('validates the programme choice and family card', () => {
    expect(validateUnitChoice('u', '')).toBe('cn.pilihProgramStudiDanKelasPendaftaran');
    expect(validateUnitChoice('u', 'c')).toBeNull();
    expect(validateFamilyCard('123')).toBe('cn.nomorKartuKeluargaHarus16Digit');
    expect(validateFamilyCard(' 1234567890123456 ')).toBeNull();
  });
  it('validates a family member', () => {
    expect(validateMember(member)).toBeNull();
    expect(validateMember({ ...member, name: ' ' })).toBe('cn.lengkapiHubunganNamaTempatDanTanggal');
    expect(validateMember({ ...member, nik: '12' })).toBe('cn.nikHarus16DigitAngka');
  });
  it('limits file size to 5 MB', () => {
    expect(validateArchiveSize(MAX_ARCHIVE_SIZE)).toBeNull();
    expect(validateArchiveSize(MAX_ARCHIVE_SIZE + 1)).toBe('cn.ukuranBerkasMaksimal5MB');
    expect(formatSize(2048)).toBe('2 KB');
    expect(formatSize(null)).toBe('-');
  });
  it('keeps only parent / guardian relative types in order', () => {
    const all = [{ id: '1', name: 'Saudara' }, { id: '2', name: 'Ibu Kandung' }, { id: '3', name: 'Ayah Kandung' }];
    expect(parentTypes(all).map((o) => o.name)).toEqual(['Ayah Kandung', 'Ibu Kandung']);
  });
});
