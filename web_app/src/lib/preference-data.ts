import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadApplicationPreference, saveApplicationPreference, type ApplicationPreference } from '../server/preference';

export type { ApplicationPreference };

export const getApplicationPreference = query(async () => {
  'use server';
  return loadApplicationPreference(await requireAuth());
}, 'application-preference');

export async function saveApplicationPreferenceRow(input: { is_llm_enable: boolean; llm_backend: string }): Promise<ApplicationPreference> {
  'use server';
  return saveApplicationPreference(await requireAuth(), input);
}
