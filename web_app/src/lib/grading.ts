// Grading rules shared by the sheet UI (live preview) and the server (the authority on save).
export interface GradeScale {
  id: string;
  alphabet_code?: string | null;
  name: string;
  /** grade point (indeks) */
  grade: number;
  minimum: number;
  maximum: number;
}

export interface Evaluation {
  id: string;
  name: string;
  weight: number;
  thread: number;
}

const r2 = (n: number) => Math.round(n * 100) / 100;
export const clampMark = (n: unknown) => Math.min(100, Math.max(0, Number(n) || 0));

/** Weighted final mark (0-100): sum of mark x weight / 100 over the components. */
export function finalMark(marks: Record<string, number>, evaluations: Evaluation[]): number {
  return r2(evaluations.reduce((sum, e) => sum + (clampMark(marks[e.id]) * (Number(e.weight) || 0)) / 100, 0));
}

/**
 * The scale row a mark falls into. In a gap between ranges (79.995 between 79.99 and 80)
 * the mark takes the highest row whose minimum it reaches; below the whole scale, the lowest row.
 */
export function gradeForMark(mark: number, scale: GradeScale[]): GradeScale | null {
  if (scale.length === 0) return null;
  const hit = scale.find((g) => mark >= g.minimum && mark <= g.maximum);
  if (hit) return hit;
  const sorted = [...scale].sort((a, b) => a.minimum - b.minimum);
  return [...sorted].reverse().find((g) => mark >= g.minimum) ?? sorted[0];
}

export const totalWeight = (evaluations: Evaluation[]) =>
  evaluations.reduce((s, e) => s + (Number(e.weight) || 0), 0);
export const weightsValid = (evaluations: Evaluation[]) => Math.round(totalWeight(evaluations)) === 100;

/**
 * Picking only a grade back-fills every component with one mark so the weighted
 * total lands in the middle of that grade's range.
 */
export function marksForGrade(grade: GradeScale, evaluations: Evaluation[]): Record<string, number> {
  const w = totalWeight(evaluations);
  const target = clampMark((Number(grade.minimum) + Number(grade.maximum)) / 2);
  const each = w > 0 ? Math.min(100, r2((target * 100) / w)) : 0;
  return Object.fromEntries(evaluations.map((e) => [e.id, each]));
}

export function classStats(marks: number[]) {
  if (marks.length === 0) return { avg: 0, highest: 0, lowest: 0, graded: 0 };
  return {
    avg: Math.round((marks.reduce((a, b) => a + b, 0) / marks.length) * 10) / 10,
    highest: Math.max(...marks),
    lowest: Math.min(...marks),
    graded: marks.filter((m) => m > 0).length,
  };
}

/** Components a class gets when none exist yet: names are translated by the caller. */
export const DEFAULT_COMPONENTS: { key: 'tugas' | 'kuis' | 'kehadiranPartisipasi' | 'uts' | 'uas'; weight: number }[] = [
  { key: 'tugas', weight: 20 },
  { key: 'kuis', weight: 10 },
  { key: 'kehadiranPartisipasi', weight: 10 },
  { key: 'uts', weight: 30 },
  { key: 'uas', weight: 30 },
];
