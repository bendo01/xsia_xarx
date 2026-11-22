import { describe, expect, it } from 'vitest';
import { asList, fullName, parentsOf, pickStudent, resolveIndividualId, shapeIndividual } from './student-select';
import type { StudentItem } from './student-types';

const A = '123e4567-e89b-42d3-a456-426614174000';
const B = '223e4567-e89b-42d3-a456-426614174000';
const ZERO = '00000000-0000-0000-0000-000000000000';

describe('resolveIndividualId', () => {
  it('uses a real UUID as is', () => expect(resolveIndividualId(A, B)).toBe(A));
  it.each(['[id]', ':id', '', ZERO, undefined])('placeholder %s means "me"', (raw) => {
    expect(resolveIndividualId(raw as string | undefined, B)).toBe(B);
  });
  it('refuses anything that is not a UUID (it goes into an API path)', () => {
    expect(resolveIndividualId('../user', B)).toBeNull();
    expect(resolveIndividualId('1/../../x', B)).toBeNull();
  });
  it('is null when there is no id at all', () => {
    expect(resolveIndividualId('[id]', null)).toBeNull();
    expect(resolveIndividualId('[id]', ZERO)).toBeNull();
  });
});

describe('pickStudent', () => {
  const s = (id: string, code: string): StudentItem => ({ id, code });
  const list = [s('1', 'A'), s('2', 'B'), s('3', 'C')];
  it('prefers explicit id, then code, then the role preference, then the first', () => {
    expect(pickStudent(list, { studentId: '3', code: 'B', preferredId: '2' })?.id).toBe('3');
    expect(pickStudent(list, { code: 'B', preferredId: '3' })?.id).toBe('2');
    expect(pickStudent(list, { preferredId: '3' })?.id).toBe('3');
    expect(pickStudent(list, {})?.id).toBe('1');
  });
  it('ignores unknown choices and handles an empty list', () => {
    expect(pickStudent(list, { studentId: 'nope', code: 'zzz' })?.id).toBe('1');
    expect(pickStudent([], { studentId: '1' })).toBeNull();
  });
});

describe('fullName', () => {
  it('adds titles around the name', () => {
    expect(fullName({ name: 'Budi', front_title: 'Dr.', last_title: 'M.Kom' })).toBe('Dr. Budi, M.Kom');
    expect(fullName({ name: 'Budi', front_title: null, last_title: null })).toBe('Budi');
  });
});

describe('shapeIndividual', () => {
  it('flattens reference objects to names and tolerates a missing body', () => {
    const out = shapeIndividual({
      individual: { id: 'i', code: 'c', name: 'N', birth_date: '2000-01-02', birth_place: 'P' },
      gender: { id: 'g', name: 'Laki-laki' },
      religion: null,
      electronic_mails: [{ id: 'e', value: 'a@b.c' }],
      students: [{ id: 's1', code: 'A' }],
    });
    expect(out.individual).toMatchObject({ id: 'i', name: 'N', front_title: null });
    expect(out.refs).toMatchObject({ gender: 'Laki-laki', religion: null });
    expect(out.emails).toHaveLength(1);
    expect(out.phones).toEqual([]);
    expect(out.students[0].code).toBe('A');
    expect(shapeIndividual({}).individual.name).toBe('');
  });
  it('asList accepts an array or a {data} envelope', () => {
    expect(asList([1])).toEqual([1]);
    expect(asList({ data: [2] })).toEqual([2]);
    expect(asList(null)).toEqual([]);
  });
});

describe('parentsOf', () => {
  const me = 'i-me';
  const card = (members: any[]) => [{ id: 'c', code: '3201', members }];
  it('lists parent and guardian members, naming the person who is not the student', () => {
    const rows = parentsOf(
      card([
        { id: 'm1', individual_id: 'i-mom', individual_name: 'Siti', relative_id: me, relative_name: 'Budi', relative_type_name: 'Ibu Kandung' },
        { id: 'm2', individual_id: me, individual_name: 'Budi', relative_id: 'i-dad', relative_name: 'Ahmad', relative_type_name: 'Ayah Kandung' },
        { id: 'm3', individual_id: 'i-sis', individual_name: 'Ani', relative_id: me, relative_name: 'Budi', relative_type_name: 'Saudara Kandung' },
      ]),
      me,
    );
    expect(rows.map((r) => [r.name, r.relation])).toEqual([['Siti', 'Ibu Kandung'], ['Ahmad', 'Ayah Kandung']]);
  });
  it('ignores rows without a name and duplicates; empty cards give nothing', () => {
    expect(parentsOf(card([{ id: 'm', individual_name: null, relative_type_name: 'Ayah Wali' }]), me)).toEqual([]);
    expect(parentsOf([], me)).toEqual([]);
  });
});
