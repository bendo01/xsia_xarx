import { MAX_SKS } from './enrollment-rules';

type T = (key: string, params?: Record<string, string | number>) => string;

const ENROLL_KEYS: Record<string, string> = {
  LOCKED: 'st.cannotEnrollCoursesBecauseThisAcademic',
  ALREADY_ENROLLED: 'st.youHaveAlreadyEnrolledInCourse',
  DUPLICATE_COURSE: 'st.youHaveAlreadyEnrolledInCourse',
  FULL: 'st.classFull',
  CREDIT_LIMIT: 'st.cannotEnrollExceedsMaximumSKSAllowance',
};
const DROP_KEYS: Record<string, string> = {
  LOCKED: 'st.cannotDropCoursesBecauseThisAcademic',
};
const CODE = /^[A-Z_]{4,}$/;

function pick(err: unknown, keys: Record<string, string>, generic: string, t: T, params: Record<string, string | number>) {
  const message = err instanceof Error ? err.message : '';
  if (keys[message]) return t(keys[message], params);
  // Other rule codes (NOT_OFFERED, NOT_FOUND) and unknown codes get the generic text;
  // anything else is the API's own message, which is already meant for people.
  if (!message || CODE.test(message)) return t(generic);
  return message;
}

export const enrollErrorMessage = (err: unknown, t: T, ctx: { course: string }) =>
  pick(err, ENROLL_KEYS, 'st.failedToEnrollClass', t, { course: ctx.course, max: MAX_SKS });

export const dropErrorMessage = (err: unknown, t: T) => pick(err, DROP_KEYS, 'st.failedToDropClass', t, {});
