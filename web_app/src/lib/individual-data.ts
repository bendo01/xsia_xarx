import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadIndividualProfile, type IndividualProfile } from '../server/individual-profile';

export type { IndividualProfile };

export const getIndividualProfile = query(async (id: string) => {
  'use server';
  return loadIndividualProfile(await requireAuth(), id);
}, 'administrator-individual-profile');
