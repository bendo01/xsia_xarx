import { cleanup, render } from '@solidjs/testing-library';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { findAdminResourceByKey } from '../../lib/admin-resources';
import AdminShow from './AdminShow';

const ID = '11111111-1111-4111-8111-111111111111';
const UNIT = '22222222-2222-4222-8222-222222222222';

const { current } = vi.hoisted(() => ({ current: { value: null as unknown } }));
vi.mock('../../lib/admin-crud-data', () => ({ getAdminRecord: () => current.value }));

afterEach(cleanup);

const show = (key: string) => render(() => <AdminShow resource={findAdminResourceByKey(key)!} id={ID} />);
const hrefs = (c: HTMLElement) => [...c.querySelectorAll('a')].map((a) => a.getAttribute('href'));

describe('AdminShow', () => {
  it('shows attributes, links a resolved foreign key to its page and hides bookkeeping fields', () => {
    current.value = {
      record: { id: ID, code: 'U1', name: 'Unit Satu', unit_id: UNIT, deleted_at: null, created_by: 'someone' },
      links: { unit_id: { label: 'Prodi Biologi', href: `/administrator/institution/master/unit/${UNIT}` } },
      related: [],
    };
    const { container } = show('academic-course-master-concentration');
    expect(container.textContent).toContain('Unit Satu');
    expect(container.textContent).toContain('Prodi Biologi');
    expect(container.textContent).not.toContain('someone');
    expect(hrefs(container)).toContain(`/administrator/institution/master/unit/${UNIT}`);
    expect(container.textContent).not.toContain(UNIT);
  });

  it('shows a foreign key without a page as plain text', () => {
    current.value = { record: { id: ID, name: 'X', institution_id: UNIT }, links: { institution_id: { label: 'Universitas' } }, related: [] };
    const { container } = show('unit');
    expect(container.textContent).toContain('Universitas');
    expect(hrefs(container).some((h) => h?.includes(UNIT))).toBe(false);
  });

  it('lists related records with a link to each and to the full list', () => {
    current.value = {
      record: { id: ID, name: 'Semester Ganjil' },
      links: {},
      related: [{ key: 'k', titleKey: 'ad.teach', total: 25, listHref: '/administrator/academic/campaign/transaction/teach', columns: [{ field: 'name', label: 'ad.name' }, { field: 'max_member', label: 'ad.maxMember' }], rows: [{ id: UNIT, href: `/administrator/academic/campaign/transaction/teach/${UNIT}`, cells: ['Kelas A', 40] }] }],
    };
    const { container } = show('academic-campaign-transaction-activity');
    expect(container.textContent).toContain('25');
    expect(container.textContent).toContain('Kelas A');
    expect(container.textContent).toContain('40');
    expect(hrefs(container)).toEqual(expect.arrayContaining(['/administrator/academic/campaign/transaction/teach', `/administrator/academic/campaign/transaction/teach/${UNIT}`]));
  });

  it('offers edit only for editable resources, and print for all', () => {
    current.value = { record: { id: ID, name: 'N' }, links: {}, related: [] };
    const editable = show('unit').container;
    expect(hrefs(editable)).toContain(`/administrator/institution/master/unit/${ID}/edit`);
    cleanup();
    current.value = { record: { id: ID, student_id: UNIT }, links: {}, related: [] };
    const readOnly = show('academic-student-adviser-counsellor').container;
    expect(hrefs(readOnly).some((h) => h?.endsWith('/edit'))).toBe(false);
    expect([...readOnly.querySelectorAll('button')].length).toBeGreaterThan(0);
  });
});
