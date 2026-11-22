// Administrator data layer.
import { query } from '@solidjs/router';

import { requireAdministrator, loadAdministratorCounts, loadPersonStatistics } from '../server/administrator';
import { requireAuth } from '../server/auth';

export const getAdministratorCounts = query(async () => {
  'use server';
  requireAdministrator(await requireAuth());
  return loadAdministratorCounts();
}, 'administrator-counts');

export const getPersonStatistics = query(async () => {
  'use server';
  return loadPersonStatistics(await requireAuth());
}, 'administrator-person-statistics');
