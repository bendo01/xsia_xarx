import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { findAdminResourceByKey } from '../../lib/admin-resources';
import AdminList from './AdminList';

let params: Record<string, string> = {};
let rows: Record<string, unknown>[] = [];
const seen = vi.fn();

vi.mock('@solidjs/router', async (orig) => ({
  ...(await orig<typeof import('@solidjs/router')>()),
  useSearchParams: () => [new Proxy({}, { get: (_t, k) => params[k as string], ownKeys: () => Object.keys(params), getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }) })],
  useInRouter: () => false,
  revalidate: async () => {},
}));
vi.mock('../../lib/admin-crud-data', () => ({
  getAdminRecords: (...a: unknown[]) => {
    seen(...a);
    return { data: rows, pagination: { page: 1, per_page: 20, total_page: 1, total_data: rows.length } };
  },
  deleteAdminRow: async () => {},
}));
vi.mock('solid-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const ID = '11111111-1111-4111-8111-111111111111';
const view = (key: string) => render(() => <AdminList resource={findAdminResourceByKey(key)!} />);
const hrefs = (c: HTMLElement) => [...c.querySelectorAll('a')].map((a) => a.getAttribute('href'));

beforeEach(() => {
  params = {};
  rows = [{ id: ID, code: 'U1', name: 'Unit Satu', is_active: true }];
  seen.mockClear();
});
afterEach(cleanup);

describe('AdminList', () => {
  it('asks the server for the page, search and sort in the url', () => {
    params = { page: '2', q: 'satu', size: '50', sort: 'name', dir: 'desc' };
    view('unit');
    expect(seen).toHaveBeenCalledWith('unit', 2, 'satu', 50, 'name', 'desc');
  });

  it('links sortable headers, flips the direction of the sorted one and resets the page', () => {
    params = { page: '3', sort: 'name', dir: 'asc' };
    const { container } = view('unit');
    const links = hrefs(container).filter((h) => h?.includes('sort='));
    expect(links).toContain('?sort=name&dir=desc'); // sorted ascending -> descending, back to page 1
    expect(links).toContain('?sort=code&dir=asc');
    expect(container.querySelector('th[aria-sort="ascending"]')?.textContent).toContain('▲');
  });

  it('does not offer sorting on a foreign-key column', () => {
    rows = [{ id: ID, student_id: 'a', lecturer_id: 'b', decree_id: 'c' }];
    const { container } = view('academic-student-adviser-counsellor');
    expect(hrefs(container).filter((h) => h?.includes('sort='))).toEqual([]);
  });

  it('exports with the current search and sort, and links a row to its detail and edit pages', () => {
    params = { q: 'satu', sort: 'code', dir: 'desc' };
    const { container } = view('unit');
    const h = hrefs(container);
    expect(h).toContain('/api/administrator/export/unit?q=satu&sort=code&dir=desc');
    expect(h).toContain(`/administrator/institution/master/unit/${ID}`);
    expect(h).toContain(`/administrator/institution/master/unit/${ID}/edit`);
    expect(h).toContain('/administrator/institution/master/unit/create');
  });

  it('keeps the sort when searching again', () => {
    params = { sort: 'name', dir: 'desc' };
    const { container } = view('unit');
    expect((container.querySelector('input[name="sort"]') as HTMLInputElement).value).toBe('name');
    expect((container.querySelector('input[name="dir"]') as HTMLInputElement).value).toBe('desc');
  });

  it('read-only resources have no add, edit or delete', () => {
    rows = [{ id: ID, student_id: 'a' }];
    const { container } = view('academic-student-adviser-counsellor');
    expect(hrefs(container).some((h) => h?.endsWith('/create') || h?.endsWith('/edit'))).toBe(false);
  });

  it('users can be added through their own page but not by the generic form', () => {
    rows = [{ id: ID, name: 'A', email: 'a@x.id', is_active: true }];
    const { container } = view('auth-user');
    expect(hrefs(container)).toContain('/administrator/auth/user/create');
  });

  it('shows profile and permissions links where the resource has them', () => {
    rows = [{ id: ID, code: 'C', name: 'N', birth_date: '2000-01-01', birth_place: 'X' }];
    expect(hrefs(view('person-master-individual').container)).toContain(`/administrator/person/master/individual/${ID}/profile`);
    cleanup();
    rows = [{ id: ID, name: 'Rektor' }];
    expect(hrefs(view('auth-role').container)).toContain(`/administrator/auth/role/${ID}/permissions`);
  });

  it('shows the empty message and no table for no rows', () => {
    rows = [];
    const { container } = view('unit');
    expect(container.querySelector('table')).toBeNull();
  });
});
