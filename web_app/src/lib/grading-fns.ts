// Grade sheet data layer: a query for the sheet, plain server functions for the changes.
import { query } from '@solidjs/router';

import { requireAuth } from '../server/auth';
import { loadGradeSheet, lockClass, removeEvaluation, saveEvaluation, saveGradeRows, seedEvaluations, type RowInput } from '../server/grading';
import type { DEFAULT_COMPONENTS } from './grading';

export const getGradeSheet = query(async (teachId: string) => {
  'use server';
  return loadGradeSheet(await requireAuth(), teachId);
}, 'grade-sheet');

export async function saveGrades(teachId: string, rows: RowInput[]): Promise<{ saved: string[]; failed: string[] }> {
  'use server';
  return saveGradeRows(await requireAuth(), teachId, rows);
}
export async function lockGrades(teachId: string): Promise<void> {
  'use server';
  await lockClass(await requireAuth(), teachId);
}
export async function saveComponent(teachId: string, input: { id?: string; name: string; weight: number }): Promise<void> {
  'use server';
  await saveEvaluation(await requireAuth(), teachId, input);
}
export async function deleteComponent(teachId: string, id: string): Promise<void> {
  'use server';
  await removeEvaluation(await requireAuth(), teachId, id);
}
export async function createDefaultComponents(teachId: string, names: Record<(typeof DEFAULT_COMPONENTS)[number]['key'], string>): Promise<void> {
  'use server';
  await seedEvaluations(await requireAuth(), teachId, names);
}
