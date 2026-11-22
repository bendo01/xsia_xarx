// GET /api/administrator/export/<resource key>?q=&sort=&dir=  ->  the list as a CSV download
// (all pages, capped). Same search and sort as the list; administrator only.
import type { APIEvent } from 'filesystem-routing/api';

import { getAuth } from '../../../../server/auth';
import { listAdminRecords } from '../../../../server/admin-crud';
import { toCsv } from '../../../../lib/csv';
import { exportFields, findAdminResourceByKey } from '../../../../lib/admin-resources';
import { safeFilename } from '../../../../lib/files';
import { t } from '../../../../i18n';

const PAGE_SIZE = 500;
const MAX_EXPORT_ROWS = 10_000;

export async function GET(event: APIEvent) {
  const auth = await getAuth();
  if (!auth.authenticated) return new Response('Unauthorized', { status: 401 });
  if (auth.activeRole !== 'administrator') return new Response('Forbidden', { status: 403 });
  const resource = findAdminResourceByKey(event.params?.key ?? '');
  if (!resource) return new Response('Not found', { status: 404 });

  const url = new URL((event as unknown as { request: Request }).request.url);
  const search = url.searchParams.get('q') ?? '';
  const sort = url.searchParams.get('sort') ?? '';
  const dir = url.searchParams.get('dir') ?? '';

  const rows: Record<string, unknown>[] = [];
  try {
    for (let page = 1; rows.length < MAX_EXPORT_ROWS; page++) {
      const res = await listAdminRecords(auth, resource.key, page, search, PAGE_SIZE, sort, dir);
      rows.push(...res.data);
      if (page >= res.pagination.total_page) break;
    }
  } catch (e) {
    return new Response((e as Error).message || 'Export failed', { status: 502 });
  }

  const csv = toCsv(rows.slice(0, MAX_EXPORT_ROWS), exportFields(resource).map((f) => ({ field: f.field, header: t(f.label) })));
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename(resource.key, 'export')}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
