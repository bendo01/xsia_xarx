import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadLecturerProfile, type LecturerProfile } from '../server/lecturer-profile';

export type { LecturerProfile };

export const getLecturerProfile = query(async (id: string) => {
  'use server';
  return loadLecturerProfile(await requireAuth(), id);
}, 'administrator-lecturer-profile');
