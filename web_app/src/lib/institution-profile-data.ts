import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadInstitutionProfile, type InstitutionProfile } from '../server/institution-profile';

export type { InstitutionProfile };

export const getInstitutionProfile = query(async (id: string) => {
  'use server';
  return loadInstitutionProfile(await requireAuth(), id);
}, 'administrator-institution-profile');
