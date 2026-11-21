// Grade sheet for one class. The old client did ~15 browser calls and computed
// marks/grades itself; here the server loads everything in one go and, on save,
// recomputes every mark and grade from the raw component marks (the client's
// numbers are only a preview). It also checks the caller really teaches the class
// and refuses edits to locked rows.
import { markSafeError } from '@solidjs/web';

import { apiFetch } from './api';
import type { AuthState } from './auth';
import { loadAssignedTeaches, loadLecturerProfile } from './lecturer';
import { DEFAULT_COMPONENTS, clampMark, finalMark, gradeForMark, weightsValid, type Evaluation, type GradeScale } from '../lib/grading';
import { asList } from '../lib/student-select';
import { resolveIndividualId } from '../lib/student-select';
import { isUuid } from '../lib/validation';

const T = 'academic/campaign/transaction';
const S = 'academic/student/campaign';
const enc = encodeURIComponent;
type Raw = Record<string, any>;
const fail = (m: string) => markSafeError(new Error(m));

export interface SheetRow {
  detail_activity_id: string;
  name: string;
  code: string;
  is_lock: boolean;
  marks: Record<string, number>;
  mark: number;
  grade_id: string | null;
}

export interface GradeSheet {
  teach: { id: string; name: string };
  course: { code: string; name: string; credit: number } | null;
  academicYear: string;
  unitId: string;
  /** The study program locked this class: grades and components are read-only. */
  classLocked: boolean;
  evaluations: Evaluation[];
  scale: GradeScale[];
  rows: SheetRow[];
}

/** The class must be one of the signed-in lecturer's own. */
export async function assertOwnClass(auth: AuthState, teachId: string): Promise<void> {
  if (!isUuid(teachId)) throw fail('Invalid class');
  const role = auth.activeRole === 'lecturer' ? auth.activeRoleItem?.roleable_id : null;
  let lecturerId = role && isUuid(role) ? role : null;
  if (!lecturerId) {
    const ind = resolveIndividualId('', auth.user?.individual_id);
    lecturerId = ind ? ((await loadLecturerProfile(ind)).lecturer?.id ?? null) : null;
  }
  if (!lecturerId) throw fail('No lecturer record');
  const mine = await loadAssignedTeaches(lecturerId);
  if (!mine.some((t) => t.teach_id === teachId)) throw markSafeError(Object.assign(new Error('Not your class'), { status: 403 }));
}

/** A class the study program has locked takes no more grade or component changes. */
const assertClassOpen = (teach: Raw) => {
  if (teach.is_lock) throw fail('classLocked');
};

const toEval = (e: Raw): Evaluation => ({
  id: String(e.id),
  name: String(e.name ?? ''),
  weight: Number(e.evaluation_weight) || 0,
  thread: Number(e.thread) || 0,
});
const toScale = (g: Raw): GradeScale => ({
  id: String(g.id),
  alphabet_code: g.alphabet_code ?? null,
  name: String(g.name ?? ''),
  grade: Number(g.grade) || 0,
  minimum: Number(g.minimum) || 0,
  maximum: Number(g.maximum) || 0,
});

async function readTeach(teachId: string): Promise<Raw> {
  const raw = await apiFetch<Raw>(`${T}/teaches/${enc(teachId)}`);
  return (raw.data ?? raw) as Raw;
}

async function readScale(teach: Raw, course: Raw | null, activity: Raw | null): Promise<{ unitId: string; scale: GradeScale[] }> {
  let unit: string | undefined = teach.activity?.unit_id || teach.class_code?.unit_id || activity?.unit_id;
  if (!unit && teach.class_code_id) {
    unit = (await apiFetch<Raw>(`${T}/class-codes/${enc(teach.class_code_id)}`).catch(() => ({}) as Raw)).unit_id;
  }
  unit = unit || course?.unit_id || '';
  if (!unit || !isUuid(unit)) return { unitId: '', scale: [] };
  const list = asList<Raw>(await apiFetch<unknown>(`${T}/grades/unit/${enc(unit)}`).catch(() => []));
  return { unitId: unit, scale: list.map(toScale).sort((a, b) => b.grade - a.grade || b.minimum - a.minimum) };
}

export async function loadGradeSheet(auth: AuthState, teachId: string): Promise<GradeSheet> {
  await assertOwnClass(auth, teachId);
  const teach = await readTeach(teachId);

  const [course, activity] = await Promise.all([
    teach.course_id ? apiFetch<Raw>(`academic/course/master/courses/${enc(teach.course_id)}`).catch(() => null) : null,
    teach.activity_id ? apiFetch<Raw>(`${T}/activities/${enc(teach.activity_id)}`).catch(() => null) : null,
  ]);
  const year = activity?.academic_year_id
    ? await apiFetch<Raw>(`academic/general/reference/academic-years/${enc(activity.academic_year_id)}`).catch(() => null)
    : null;
  const { unitId, scale } = await readScale(teach, course, activity);

  const evaluations = asList<Raw>(teach.teach_evaluations).map(toEval).sort((a, b) => a.thread - b.thread);
  const details = asList<Raw>(teach.detail_activities);
  const comps = asList<Raw>(teach.detail_activity_evaluation_components);

  const rows: SheetRow[] = details.map((da, i) => {
    const mine = comps.filter((c) => c.detail_activity_id === da.id);
    const marks: Record<string, number> = {};
    for (const e of evaluations) marks[e.id] = Number(mine.find((c) => c.course_evaluation_planning_id === e.id)?.mark) || 0;
    const stored = Number(da.mark);
    const mark = mine.length > 0 && evaluations.length > 0 ? finalMark(marks, evaluations) : Number.isFinite(stored) ? stored : 0;
    const gradeId = da.grade_id || da.feeder_grade_id || (mark > 0 ? gradeForMark(mark, scale)?.id : null) || null;
    return {
      detail_activity_id: String(da.id),
      name: da.student_name || (da.name && !String(da.name).startsWith('DetailAktifitasPerkuliahan') ? da.name : `#${i + 1}`),
      code: da.student_nim || (da.curiculum_detail_sequence ? String(da.curiculum_detail_sequence) : String(da.id).slice(0, 8)),
      is_lock: Boolean(da.is_lock),
      marks,
      mark,
      grade_id: gradeId,
    };
  });

  return {
    teach: { id: teachId, name: String(teach.name ?? '') },
    course: course ? { code: String(course.code ?? ''), name: String(course.name ?? ''), credit: Number(course.total_credit) || 0 } : null,
    academicYear: year ? String(year.name || year.code || '') : '',
    unitId,
    classLocked: Boolean(teach.is_lock),
    evaluations,
    scale,
    rows,
  };
}

export interface RowInput {
  detail_activity_id: string;
  marks: Record<string, number>;
}

/** Saves the component marks and the recomputed final mark + grade of each row. Returns how many succeeded. */
export async function saveGradeRows(auth: AuthState, teachId: string, rows: RowInput[]): Promise<{ saved: string[]; failed: string[] }> {
  await assertOwnClass(auth, teachId);
  if (rows.length === 0 || rows.length > 500) throw fail('Invalid rows');
  const teach = await readTeach(teachId);
  assertClassOpen(teach);
  const evaluations = asList<Raw>(teach.teach_evaluations).map(toEval);
  const details = new Map(asList<Raw>(teach.detail_activities).map((d) => [String(d.id), d]));
  const comps = asList<Raw>(teach.detail_activity_evaluation_components);
  const { scale } = await readScale(teach, null, null);

  const saved: string[] = [];
  const failed: string[] = [];
  for (const row of rows) {
    const da = details.get(row.detail_activity_id);
    if (!da || da.is_lock) {
      failed.push(row.detail_activity_id);
      continue;
    }
    try {
      const marks = Object.fromEntries(evaluations.map((e) => [e.id, clampMark(row.marks[e.id])]));
      for (const e of evaluations) {
        const mark = marks[e.id];
        const body = { mark, percentage: e.weight, total: (mark * e.weight) / 100, name: e.name };
        const existing = comps.find((c) => c.detail_activity_id === da.id && c.course_evaluation_planning_id === e.id);
        if (existing) {
          await apiFetch(`${S}/detail-activity-evaluation-components/${enc(existing.id)}`, { method: 'PUT', body });
        } else {
          await apiFetch(`${S}/detail-activity-evaluation-components`, {
            method: 'POST',
            body: { ...body, detail_activity_id: da.id, course_evaluation_planning_id: e.id },
          });
        }
      }
      const mark = finalMark(marks, evaluations);
      await apiFetch(`${S}/detail-activities/${enc(String(da.id))}`, {
        method: 'PUT',
        body: { mark, grade_id: gradeForMark(mark, scale)?.id },
      });
      saved.push(row.detail_activity_id);
    } catch {
      failed.push(row.detail_activity_id);
    }
  }
  return { saved, failed };
}

/** Finalises the class: every student's grade becomes locked (a lecturer cannot undo this). */
export async function lockClass(auth: AuthState, teachId: string): Promise<void> {
  await assertOwnClass(auth, teachId);
  const teach = await readTeach(teachId);
  const evaluations = asList<Raw>(teach.teach_evaluations).map(toEval);
  if (!weightsValid(evaluations)) throw fail('weights');
  for (const da of asList<Raw>(teach.detail_activities)) {
    if (!da.is_lock) await apiFetch(`${S}/detail-activities/${enc(String(da.id))}`, { method: 'PUT', body: { is_lock: true } });
  }
}

const anyLocked = (teach: Raw) => asList<Raw>(teach.detail_activities).some((d) => d.is_lock);

export async function saveEvaluation(auth: AuthState, teachId: string, input: { id?: string; name: string; weight: number }) {
  await assertOwnClass(auth, teachId);
  const name = input.name.trim();
  const weight = Number(input.weight);
  if (!name || name.length > 100 || !(weight >= 0 && weight <= 100)) throw fail('Invalid component');
  const teach = await readTeach(teachId);
  assertClassOpen(teach);
  if (anyLocked(teach)) throw fail('locked');
  const evals = asList<Raw>(teach.teach_evaluations);
  if (input.id) {
    if (!evals.some((e) => e.id === input.id)) throw fail('Not found');
    await apiFetch(`${T}/teach-evaluations/${enc(input.id)}`, { method: 'PUT', body: { name, evaluation_weight: weight, teach_id: teachId } });
  } else {
    await apiFetch(`${T}/teach-evaluations`, {
      method: 'POST',
      body: { thread: evals.length + 1, name, evaluation_weight: weight, english_name: null, evaluation_type_id: null, feeder_id: null, teach_id: teachId },
    });
  }
}

export async function removeEvaluation(auth: AuthState, teachId: string, id: string) {
  await assertOwnClass(auth, teachId);
  const teach = await readTeach(teachId);
  assertClassOpen(teach);
  if (anyLocked(teach)) throw fail('locked');
  if (!asList<Raw>(teach.teach_evaluations).some((e) => e.id === id)) throw fail('Not found');
  await apiFetch(`${T}/teach-evaluations/${enc(id)}`, { method: 'DELETE' });
}

/** Creates the class's components from the course plan, or the standard five, when it has none. */
export async function seedEvaluations(auth: AuthState, teachId: string, names: Record<(typeof DEFAULT_COMPONENTS)[number]['key'], string>) {
  await assertOwnClass(auth, teachId);
  const teach = await readTeach(teachId);
  assertClassOpen(teach);
  if (asList<Raw>(teach.teach_evaluations).length > 0) return;
  const course = teach.course_id ? await apiFetch<Raw>(`academic/course/master/courses/${enc(teach.course_id)}`).catch(() => null) : null;
  const plan = asList<Raw>(course?.course_evaluation_plannings ?? teach.course_evaluation_plannings);
  const items =
    plan.length > 0
      ? plan.map((p, i) => ({ name: p.name, weight: Number(p.percentage) || 0, thread: i + 1, type: p.evaluation_type_id ?? null }))
      : DEFAULT_COMPONENTS.map((c, i) => ({ name: names[c.key], weight: c.weight, thread: i + 1, type: null }));
  for (const it of items) {
    await apiFetch(`${T}/teach-evaluations`, {
      method: 'POST',
      body: { thread: it.thread, name: it.name || '', english_name: null, evaluation_weight: it.weight, evaluation_type_id: it.type, feeder_id: null, teach_id: teachId },
    });
  }
}
