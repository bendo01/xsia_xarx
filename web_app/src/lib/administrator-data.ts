// Administrator data layer.
import { query } from '@solidjs/router';

import { requireAdministrator, loadAdministratorCounts } from '../server/administrator';
import { requireAuth } from '../server/auth';

export const getAdministratorCounts = query(async () => {
  'use server';
  requireAdministrator(await requireAuth());
  return loadAdministratorCounts();
}, 'administrator-counts');
