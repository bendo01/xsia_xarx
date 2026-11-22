import { flush } from 'solid-js';
import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import PermissionEditor from './PermissionEditor';

const { data, assign, revoke, toast } = vi.hoisted(() => ({
  data: {
    owner: { id: 'r1', name: 'Rektor' },
    permissions: [
      { id: 'p1', name: 'academic.student.index', uri: '/api/v1/academic/student' },
      { id: 'p2', name: 'academic.student.create', uri: '/api/v1/academic/student' },
      { id: 'p3', name: 'auth.role.index', uri: '/api/v1/role' },
    ],
    assigned: { p1: 'link-1' } as Record<string, string>,
  },
  assign: vi.fn(),
  revoke: vi.fn(),
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('../../lib/permission-data', () => ({
  getPermissionEditor: () => data,
  assignPermissionRow: (...a: unknown[]) => assign(...a),
  revokePermissionRow: (...a: unknown[]) => revoke(...a),
}));
vi.mock('solid-sonner', () => ({ toast }));

const settle = async () => {
  await new Promise((r) => setTimeout(r, 0));
  flush();
  await new Promise((r) => setTimeout(r, 0));
  flush();
};
const switches = (c: HTMLElement) => [...c.querySelectorAll('input[role="switch"]')] as HTMLInputElement[];
const buttonByText = (c: HTMLElement, text: string) => [...c.querySelectorAll('button')].filter((b) => b.textContent === text);

beforeEach(() => {
  data.assigned = { p1: 'link-1' };
  assign.mockReset().mockImplementation(async (_k: string, _o: string, p: string) => `link-for-${p}`);
  revoke.mockReset().mockResolvedValue(undefined);
  toast.success.mockClear();
  toast.error.mockClear();
});
afterEach(cleanup);

const view = () => render(() => <PermissionEditor kind="role" id="r1" titleKey="ad.rolePermissions" hintKey="ad.permissionsBelowApplyToThisRole" backHref="/back" />);

describe('PermissionEditor', () => {
  it('shows the owner, one switch per permission and which are on', () => {
    const { container } = view();
    expect(container.textContent).toContain('Rektor');
    expect(switches(container).map((s) => s.checked)).toEqual([true, false, false]);
    expect(container.textContent).toContain('academic.student');
    expect(container.textContent).toContain('auth.role');
    expect(container.textContent).toContain('1 / 3');
  });

  it('grants a permission through the server and keeps the returned link id for a later revoke', async () => {
    const { container } = view();
    switches(container)[1].click();
    await settle();
    expect(assign).toHaveBeenCalledWith('role', 'r1', 'p2');
    expect(switches(container)[1].checked).toBe(true);
    expect(container.textContent).toContain('2 / 3');
    switches(container)[1].click();
    await settle();
    expect(revoke).toHaveBeenCalledWith('role', 'r1', 'link-for-p2');
    expect(switches(container)[1].checked).toBe(false);
  });

  it('revokes with the link id that came with the page', async () => {
    const { container } = view();
    switches(container)[0].click();
    await settle();
    expect(revoke).toHaveBeenCalledWith('role', 'r1', 'link-1');
    expect(container.textContent).toContain('0 / 3');
  });

  it('leaves the switch as it was and tells the user when the server refuses', async () => {
    assign.mockRejectedValueOnce(new Error('Forbidden'));
    const { container } = view();
    switches(container)[2].click();
    await settle();
    expect(switches(container)[2].checked).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Forbidden');
  });

  it('"Allow all" of a group grants only what is still missing', async () => {
    const { container } = view();
    buttonByText(container, 'Izinkan semua')[0].click(); // the academic.student group: p1 is already on
    await settle();
    expect(assign.mock.calls.map((c) => c[2])).toEqual(['p2']);
    expect(switches(container).map((s) => s.checked)).toEqual([true, true, false]);
  });

  it('"Revoke all" of a group revokes what is on', async () => {
    const { container } = view();
    buttonByText(container, 'Cabut semua')[0].click();
    await settle();
    expect(revoke.mock.calls.map((c) => c[2])).toEqual(['link-1']);
    expect(switches(container).map((s) => s.checked)).toEqual([false, false, false]);
  });

  it('filters by the search text', async () => {
    const { container } = view();
    const search = container.querySelector('input[type="search"]') as HTMLInputElement;
    search.value = 'role';
    search.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    expect(switches(container)).toHaveLength(1);
    expect(container.textContent).not.toContain('academic.student');
  });
});
