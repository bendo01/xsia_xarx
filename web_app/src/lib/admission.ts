// Client-facing functions for the candidate dashboard (BFF: the token stays in the cookie).
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import {
  addAdmissionMember, loadAdmissionLookups, loadAdmissionStatus, ownCandidateId, removeAdmissionMember,
  saveAdmissionFamilyCard, saveAdmissionUnit,
} from '../server/admission';
import { validateFamilyCard, validateMember, validateUnitChoice, type MemberInput } from './admission-types';

import { markSafeError } from '@solidjs/web';

const invalid = (key: string | null) => {
  if (key) throw markSafeError(new Error(key));
};

export const getAdmissionStatus = query(async (rawId: string) => {
  'use server';
  return loadAdmissionStatus(ownCandidateId(await requireAuth(), rawId));
}, 'admission-status');

export const getAdmissionLookups = query(async () => {
  'use server';
  await requireAuth();
  return loadAdmissionLookups();
}, 'admission-lookups');

export async function chooseUnit(rawId: string, unitId: string, categoryId: string): Promise<void> {
  'use server';
  invalid(validateUnitChoice(unitId, categoryId));
  await saveAdmissionUnit(ownCandidateId(await requireAuth(), rawId), unitId, categoryId);
}

export async function saveFamilyCard(rawId: string, code: string): Promise<void> {
  'use server';
  invalid(validateFamilyCard(code));
  await saveAdmissionFamilyCard(ownCandidateId(await requireAuth(), rawId), code);
}

export async function addFamilyMember(rawId: string, member: MemberInput): Promise<void> {
  'use server';
  invalid(validateMember(member));
  await addAdmissionMember(ownCandidateId(await requireAuth(), rawId), member);
}

export async function removeFamilyMember(rawId: string, memberId: string): Promise<void> {
  'use server';
  await removeAdmissionMember(ownCandidateId(await requireAuth(), rawId), memberId);
}
