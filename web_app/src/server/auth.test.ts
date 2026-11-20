import { afterEach, describe, expect, it, vi } from 'vitest';

// session.ts refuses to load without a secret; set it before the import.
vi.hoisted(() => {
  process.env.SESSION_SECRET = 'test-secret-test-secret-test-secret-12';
});

import { enrichRoles, authStateFrom, isTokenLive, jwtExpiry, sessionFromLogin, slimRoles } from './auth';

const jwt = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;
const future = Math.floor(Date.now() / 1000) + 3600;
const past = Math.floor(Date.now() / 1000) - 10;

describe('jwt expiry', () => {
  it('reads exp and judges liveness', () => {
    expect(jwtExpiry(jwt({ exp: future }))).toBe(future);
    expect(isTokenLive(jwt({ exp: future }))).toBe(true);
    expect(isTokenLive(jwt({ exp: past }))).toBe(false);
  });
  it('treats missing/garbled tokens safely', () => {
    expect(isTokenLive(undefined)).toBe(false);
    expect(jwtExpiry('not-a-jwt')).toBeNull();
    expect(jwtExpiry('a.!!!.c')).toBeNull();
  });
});

describe('slimRoles', () => {
  it('drops audit fields and nulls', () => {
    expect(
      slimRoles([
        {
          id: 'r1',
          name: 'Mahasiswa',
          user_id: 'u',
          position_type_id: null,
          roleable_id: 'x',
          roleable_type: 'Student',
          // @ts-expect-error extra backend fields must not survive
          created_at: '2026-01-01',
        },
      ]),
    ).toEqual([
      { id: 'r1', name: 'Mahasiswa', user_id: 'u', roleable_id: 'x', roleable_type: 'Student' },
    ]);
    expect(slimRoles(null)).toEqual([]);
  });
});

describe('sessionFromLogin / authStateFrom', () => {
  const login = {
    token: jwt({ exp: future }),
    user: {
      id: 'u1',
      name: 'Budi',
      email: 'b@x.id',
      individual_id: 'ind-1',
      current_role_id: 'r2',
      roles: [
        { id: 'r1', name: 'Dosen' },
        { id: 'r2', name: 'Mahasiswa' },
      ],
    },
  };

  it('keeps the token in the session and picks the current role', () => {
    const s = sessionFromLogin(login);
    expect(s.token).toBe(login.token);
    expect(s.activeRoleId).toBe('r2');
    expect(s.user).toEqual({ id: 'u1', name: 'Budi', email: 'b@x.id', individual_id: 'ind-1' });
  });

  it('falls back to the first role when none is current', () => {
    const s = sessionFromLogin({ ...login, user: { ...login.user, current_role_id: null } });
    expect(s.activeRoleId).toBe('r1');
  });

  it('derives the normalised active role', () => {
    const a = authStateFrom(sessionFromLogin(login));
    expect(a.authenticated).toBe(true);
    expect(a.activeRole).toBe('student');
  });

  it('is signed out for no session or an expired token', () => {
    expect(authStateFrom(null).authenticated).toBe(false);
    const expired = sessionFromLogin({ ...login, token: jwt({ exp: past }) });
    expect(authStateFrom(expired)).toMatchObject({ authenticated: false, activeRole: 'guest' });
  });
});

describe('enrichRoles', () => {
  afterEach(() => vi.unstubAllGlobals());

  const routes: Record<string, unknown> = {
    '/academic/student/master/students/s1': { data: { code: 'A1', unit_id: 'u1' } },
    '/institution/master/staffes/st1': { unit_id: 'u2' },
    '/institution/master/units/u1': { data: { institution_id: 'i1' } },
    '/institution/master/units/u2': { data: { institution: { id: 'i2' } } },
  };
  const stub = () =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        const hit = routes[new URL(url).pathname.replace('/api/v1', '')];
        return hit ? new Response(JSON.stringify(hit)) : new Response('{}', { status: 404 });
      }),
    );

  it('adds student code, unit and institution; staff unit and institution', async () => {
    stub();
    const out = await enrichRoles(
      [
        { id: 'a', name: 'Mahasiswa', roleable_id: 's1', roleable_type: 'Student' },
        { id: 'b', name: 'Kepala Program Studi', roleable_id: 'st1', roleable_type: 'Staff' },
        { id: 'c', name: 'Administrator' },
      ],
      'tok',
    );
    expect(out[0]).toMatchObject({ code: 'A1', unit_id: 'u1', institution_id: 'i1' });
    expect(out[1]).toMatchObject({ unit_id: 'u2', institution_id: 'i2' });
    expect(out[2]).toEqual({ id: 'c', name: 'Administrator' });
  });

  it('never blocks sign-in when lookups fail', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('down'); }));
    const roles = [{ id: 'a', name: 'Mahasiswa', roleable_id: 's1', roleable_type: 'Student' }];
    expect(await enrichRoles(roles, 'tok')).toEqual(roles);
  });
});
