import { describe, expect, it } from 'vitest';

import { MIN_PASSWORD, parseNewUser } from './new-user';

const ID = '11111111-1111-4111-8111-111111111111';
const ok = { name: ' Siti ', email: ' Siti@Kampus.AC.ID ', password: 'secret-pass', individual_id: ID };

describe('parseNewUser', () => {
  it('trims, lower-cases the email and keeps the password as typed', () => {
    expect(parseNewUser({ ...ok, password: ' pass word ', is_active: true })).toEqual({ ok: true, user: { name: 'Siti', email: 'siti@kampus.ac.id', password: ' pass word ', individual_id: ID, is_active: true } });
    expect(parseNewUser(ok)).toMatchObject({ ok: true, user: { is_active: false } });
  });
  it('requires every field', () => {
    expect(parseNewUser({})).toMatchObject({ ok: false, errors: { name: 'required', email: 'required', password: 'required', individual_id: 'required' } });
  });
  it('rejects bad emails, short passwords and bad person ids', () => {
    const r = parseNewUser({ ...ok, email: 'nope', password: 'x'.repeat(MIN_PASSWORD - 1), individual_id: 'x' });
    expect(r).toMatchObject({ ok: false, errors: { email: 'invalid', password: 'tooShort', individual_id: 'invalid' } });
  });
  it('limits lengths', () => {
    expect(parseNewUser({ ...ok, name: 'n'.repeat(201) })).toMatchObject({ errors: { name: 'tooLong' } });
    expect(parseNewUser({ ...ok, password: 'p'.repeat(129) })).toMatchObject({ errors: { password: 'tooLong' } });
  });
});
