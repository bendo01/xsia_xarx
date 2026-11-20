import { describe, expect, it } from 'vitest';
import { buildEnrolled, buildOfferings, classLetter, cleanName, lecturerLabel } from './enrollment-build';

describe('small helpers', () => {
  it('cleanName drops the backend placeholder', () => {
    expect(cleanName('DosenAktifitasPengajaran123')).toBe('');
    expect(cleanName('  Dr. Ani ')).toBe('Dr. Ani');
    expect(cleanName(undefined)).toBe('');
  });
  it('lecturerLabel joins code and name', () => {
    expect(lecturerLabel({ code: '01', name: 'Ani' })).toBe('01 - Ani');
    expect(lecturerLabel({ name: 'Ani' })).toBe('Ani');
    expect(lecturerLabel({ code: '01', name: '' })).toBe('01');
  });
  it('classLetter prefers alphabet_code, then the last word of the name', () => {
    expect(classLetter({ alphabet_code: ' B ' })).toBe('B');
    expect(classLetter({ name: 'Kelas Reguler A' })).toBe('A');
    expect(classLetter({ name: 'Kelas Karyawan Malam' })).toBe('Malam'); // last word, 8 chars or fewer
    expect(classLetter({ name: 'Kelas Internasional' })).toBe('Kelas Internasional'); // last word too long: whole name
    expect(classLetter({ code: 'K-9' })).toBe('K-9');
    expect(classLetter(null)).toBe('-');
  });
});

const base = {
  activityId: 'act1',
  unitId: 'u1',
  decreeIds: new Set<string>(['dec1']),
  courses: [{ id: 'c1', code: 'IF101', name: 'Algoritma', total_credit: 3, unit_id: 'u1' }, { id: 'c2', code: 'MK2', name: 'Lain', credit: 2, unit_id: 'u9' }],
  classCodes: [{ id: 'cc1', alphabet_code: 'A' }],
  teachLecturers: [{ teach_id: 't1', lecturer_id: 'l1' }, { teach_id: 't1', lecturer_id: 'l2', name: 'DosenAktifitasPengajaranX' }],
  lecturers: [{ id: 'l1', code: '001', name: 'Dr. Ani' }, { id: 'l2', code: '002', name: '' }],
  schedules: [{ teach_id: 't1', start_hour: '08:00:00', end_hour: '10:30:00', room_id: 'r1' }],
  rooms: [{ id: 'r1', name: 'Lab 1' }],
};

describe('buildOfferings', () => {
  it('keeps classes of this activity or its decrees, drops others', () => {
    const out = buildOfferings({
      ...base,
      teaches: [
        { id: 't1', course_id: 'c1', class_code_id: 'cc1', activity_id: 'act1' },
        { id: 't2', course_id: 'c1', class_code_id: 'cc1', teach_decree_id: 'dec1' },
        { id: 't3', course_id: 'c1', class_code_id: 'cc1', activity_id: 'other' },
      ],
    });
    expect(out.map((o) => o.id)).toEqual(['t1', 't2']);
  });

  it('hides classes of another unit unless tied to this activity', () => {
    const out = buildOfferings({
      ...base,
      teaches: [
        { id: 'tA', course_id: 'c2', class_code_id: 'cc1', teach_decree_id: 'dec1' }, // other unit, only via decree
        { id: 'tB', course_id: 'c2', class_code_id: 'cc1', activity_id: 'act1' }, // other unit but on this activity
      ],
    });
    expect(out.map((o) => o.id)).toEqual(['tB']);
  });

  it('joins course, class letter, lecturers, schedule and room', () => {
    const [o] = buildOfferings({
      ...base,
      teaches: [{ id: 't1', course_id: 'c1', class_code_id: 'cc1', activity_id: 'act1', enrolled_count: 12, max_member: 30 }],
    });
    expect(o).toMatchObject({
      course_code: 'IF101', course_name: 'Algoritma', credits: 3, class_name: 'A',
      lecturer_name: '001 - Dr. Ani, 002', schedule_time: '08:00 - 10:30', room_name: 'Lab 1',
      enrolled_count: 12, max_member: 30,
    });
  });

  it('defaults seats and tolerates missing relations', () => {
    const [o] = buildOfferings({
      ...base, courses: [], classCodes: [], teachLecturers: [], schedules: [],
      teaches: [{ id: 'tx', course_id: 'zz', class_code_id: 'nn', activity_id: 'act1', name: 'Nama', credits: 4 }],
    });
    expect(o).toMatchObject({ course_code: '-', course_name: 'Nama', credits: 4, class_name: '-', lecturer_name: '-', max_member: 40, enrolled_count: 0 });
  });
});

describe('buildEnrolled', () => {
  const lookups = {
    courses: new Map([['c1', { id: 'c1', code: 'IF101', name: 'Algoritma', total_credit: 3 }]]),
    teaches: new Map([['t1', { id: 't1', class_code_id: 'cc1', lecturer_name: 'Dr. Ani', lecturer_code: '001' }]]),
    classCodes: new Map([['cc1', { id: 'cc1', alphabet_code: 'B' }]]),
    grades: new Map([['g1', { id: 'g1', alphabet_code: 'A', grade: 4 }]]),
  };

  it('fills course, class, lecturer and grade from lookups', () => {
    const [e] = buildEnrolled([{ id: 'd1', course_id: 'c1', teach_id: 't1', grade_id: 'g1', mark: 88.5 }], lookups);
    expect(e).toMatchObject({
      course_code: 'IF101', course_name: 'Algoritma', class_name: 'B', credit: 3,
      grade_letter: 'A', grade_point: 4, mark: 88.5, teach_id: 't1', is_lock: false,
    });
    expect(e.lecturers).toEqual([{ code: '001', name: 'Dr. Ani' }]);
  });

  it('prefers embedded relations and teach_lecturers', () => {
    const [e] = buildEnrolled(
      [{ id: 'd', course_id: 'c1', course: { code: 'X1', name: 'Embedded' }, grade: { name: 'B+', grade: 3.5 }, teach_lecturers: [{ code: '9', name: 'Pak Budi' }, 'Bu Sari'], credit: 2 }],
      lookups,
    );
    expect(e).toMatchObject({ course_code: 'X1', course_name: 'Embedded', grade_letter: 'B+', grade_point: 3.5, credit: 2 });
    expect(e.lecturers).toEqual([{ code: '9', name: 'Pak Budi' }, { code: '', name: 'Bu Sari' }]);
  });

  it('treats the zero-UUID teach as no class, and ungraded as "-"', () => {
    const [e] = buildEnrolled([{ id: 'd', course_id: 'c1', teach_id: '00000000-0000-0000-0000-000000000000', mark: 0 }], lookups);
    expect(e.teach_id).toBeNull();
    expect(e.grade_letter).toBe('-');
    expect(e.grade_point).toBeNull();
    expect(e.mark).toBe(0);
  });
});
