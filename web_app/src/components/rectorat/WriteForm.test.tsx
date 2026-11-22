import { flush } from 'solid-js';
import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import WriteForm from './WriteForm';

const navigate = vi.fn();
vi.mock('@solidjs/router', async (orig) => ({ ...(await orig<typeof import('@solidjs/router')>()), useNavigate: () => navigate, revalidate: async () => {} }));
vi.mock('solid-sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const okSave = async () => ({ ok: true as const, id: '' });

const wait = async (ms: number) => {
  await vi.advanceTimersByTimeAsync(ms);
  flush();
};
const type = (el: HTMLElement, value: string) => {
  (el as HTMLInputElement).value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
};
const choose = (el: HTMLElement, value: string) => {
  (el as HTMLSelectElement).value = value;
  el.dispatchEvent(new Event('change', { bubbles: true }));
};

beforeEach(() => {
  vi.useFakeTimers();
  navigate.mockClear();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const ID = '11111111-1111-4111-8111-111111111111';
const OTHER = '22222222-2222-4222-8222-222222222222';

describe('WriteForm lookup field', () => {
  const setup = (over: Record<string, unknown> = {}) => {
    const lookup = vi.fn(async () => [{ id: ID, name: 'Siti Aminah' }, { id: OTHER, name: 'Budi' }]);
    const save = vi.fn(async () => ({ ok: true as const, id: 'x' }));
    const view = render(() => (
      <WriteForm fields={[{ name: 'individual_id', label: 'rt.person', kind: 'lookup', source: 'individual' }]} initial={{ individual_id: '' }} save={save} lookup={lookup} backHref="/back" {...over} />
    ));
    return { lookup, save, ...view };
  };

  it('waits for a pause in typing, then lists the matches of the field\'s source', async () => {
    const { lookup, container } = setup();
    const search = container.querySelector('input[type="search"]') as HTMLElement;
    type(search, 'si');
    type(search, 'siti');
    await wait(299);
    expect(lookup).not.toHaveBeenCalled();
    await wait(2);
    expect(lookup).toHaveBeenCalledTimes(1);
    expect(lookup).toHaveBeenCalledWith('individual', 'siti');
    expect([...container.querySelectorAll('select option')].map((o) => o.textContent)).toEqual(expect.arrayContaining(['Siti Aminah', 'Budi']));
  });

  it('does not search for blank text', async () => {
    const { lookup, container } = setup();
    type(container.querySelector('input[type="search"]') as HTMLElement, '   ');
    await wait(400);
    expect(lookup).not.toHaveBeenCalled();
  });

  it('saves the id of the chosen match', async () => {
    const { save, container } = setup();
    type(container.querySelector('input[type="search"]') as HTMLElement, 'budi');
    await wait(350);
    choose(container.querySelector('select') as HTMLElement, OTHER);
    flush();
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(0);
    expect(save).toHaveBeenCalledWith({ individual_id: OTHER });
    expect(navigate).toHaveBeenCalledWith('/back');
  });

  it('shows the saved choice by its label on edit and keeps it listed after another search', async () => {
    const lookup = vi.fn(async () => [{ id: OTHER, name: 'Budi' }]);
    const { container } = setup({ initial: { individual_id: ID }, labels: { individual_id: 'Siti Aminah' }, lookup });
    const select = () => container.querySelector('select') as HTMLSelectElement;
    expect(select().value).toBe(ID);
    expect(select().selectedOptions[0].textContent).toBe('Siti Aminah');
    type(container.querySelector('input[type="search"]') as HTMLElement, 'bud');
    await wait(350);
    expect([...select().options].map((o) => o.value)).toEqual(['', ID, OTHER]);
    expect(select().value).toBe(ID);
  });

  it('keeps the form usable when a search fails', async () => {
    const { container } = setup({ lookup: vi.fn(async () => { throw new Error('down'); }) });
    type(container.querySelector('input[type="search"]') as HTMLElement, 'x');
    await wait(350);
    expect(container.querySelectorAll('select option')).toHaveLength(1);
  });
});

describe('WriteForm field kinds', () => {
  it('hides a password as it is typed and asks the browser not to autofill it', () => {
    const { container } = render(() => <WriteForm fields={[{ name: 'password', label: 'ad.password', kind: 'password' }]} initial={{ password: '' }} save={okSave} backHref="/b" />);
    const input = container.querySelector('input[name="password"]') as HTMLInputElement;
    expect(input.type).toBe('password');
    expect(input.getAttribute('autocomplete')).toBe('new-password');
  });

  it('marks the fields the server rejected and does not navigate', async () => {
    const save = vi.fn(async () => ({ ok: false as const, errors: { name: 'required' as const } }));
    const { container } = render(() => <WriteForm fields={[{ name: 'name', label: 'ad.name', kind: 'text', required: true }]} initial={{ name: '' }} save={save} backHref="/b" />);
    container.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await wait(0);
    expect(container.querySelector('input[name="name"]')!.getAttribute('aria-invalid')).toBe('true');
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders a datetime field as a datetime-local input', () => {
    const { container } = render(() => <WriteForm fields={[{ name: 'start', label: 'ad.startDate', kind: 'datetime' }]} initial={{ start: '2026-01-02T03:04' }} save={okSave} backHref="/b" />);
    const input = container.querySelector('input[name="start"]') as HTMLInputElement;
    expect(input.type).toBe('datetime-local');
    expect(input.value).toBe('2026-01-02T03:04');
  });
});
