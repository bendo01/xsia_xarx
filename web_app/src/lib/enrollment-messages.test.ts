import { describe, expect, it } from 'vitest';
import { dropErrorMessage, enrollErrorMessage } from './enrollment-messages';

// A recording t(): returns "key|params" so tests see which message was chosen.
const t = (key: string, params?: Record<string, string | number>) => (params && Object.keys(params).length ? `${key}|${JSON.stringify(params)}` : key);
const err = (m: string) => new Error(m);

describe('enrollErrorMessage', () => {
  it('translates rule codes, filling in the course and the cap', () => {
    expect(enrollErrorMessage(err('CREDIT_LIMIT'), t, { course: 'Algo' })).toBe('st.cannotEnrollExceedsMaximumSKSAllowance|{"course":"Algo","max":24}');
    expect(enrollErrorMessage(err('DUPLICATE_COURSE'), t, { course: 'Algo' })).toContain('st.youHaveAlreadyEnrolledInCourse');
    expect(enrollErrorMessage(err('FULL'), t, { course: 'x' })).toContain('st.classFull');
    expect(enrollErrorMessage(err('LOCKED'), t, { course: 'x' })).toContain('st.cannotEnrollCoursesBecauseThisAcademic');
  });
  it('uses the generic text for codes without a dedicated message', () => {
    expect(enrollErrorMessage(err('NOT_OFFERED'), t, { course: 'x' })).toBe('st.failedToEnrollClass');
    expect(enrollErrorMessage(err('SOMETHING_NEW'), t, { course: 'x' })).toBe('st.failedToEnrollClass');
    expect(enrollErrorMessage('boom', t, { course: 'x' })).toBe('st.failedToEnrollClass');
  });
  it("passes the API's own sentence through", () => {
    expect(enrollErrorMessage(err('Kelas sudah penuh.'), t, { course: 'x' })).toBe('Kelas sudah penuh.');
  });
});

describe('dropErrorMessage', () => {
  it('maps LOCKED and falls back to generic', () => {
    expect(dropErrorMessage(err('LOCKED'), t)).toBe('st.cannotDropCoursesBecauseThisAcademic');
    expect(dropErrorMessage(err('NOT_FOUND'), t)).toBe('st.failedToDropClass');
  });
});
