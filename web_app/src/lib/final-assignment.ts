// Data layer for the adviser / final-assignment lists (course-department role).
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { requireProdi } from '../server/crud';
import { loadFaList } from '../server/final-assignment';
import type { FaKind } from './final-assignment-defs';

export const getFaList = query(async (kind: FaKind, page: number) => {
  'use server';
  await requireProdi(await requireAuth());
  return loadFaList(kind, page);
}, 'fa-list');
