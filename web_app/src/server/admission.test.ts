import { describe, expect, it } from 'vitest';


import { ownCandidateId } from './admission';

const ID = '123e4567-e89b-42d3-a456-426614174000';
const auth = (activeRole: string, roleable_id?: string) => ({ activeRole, activeRoleItem: { roleable_id } }) as never;

describe('ownCandidateId', () => {
  it('accepts only the active candidate role\'s own id', () => {
    expect(ownCandidateId(auth('candidate', ID), ID)).toBe(ID);
  });
  it('refuses another role', () => {
    expect(() => ownCandidateId(auth('student', ID), ID)).toThrow('Forbidden');
  });
  it('treats someone else\'s id or junk as not found', () => {
    expect(() => ownCandidateId(auth('candidate', ID), '223e4567-e89b-42d3-a456-426614174000')).toThrow('Not found');
    expect(() => ownCandidateId(auth('candidate', ID), 'nope')).toThrow('Not found');
  });
});
