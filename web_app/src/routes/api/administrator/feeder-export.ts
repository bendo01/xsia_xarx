// GET /api/administrator/feeder-export?group=master&slug=mahasiswa  ->  that Feeder table as a CSV download
// (all pages, capped). Administrator only; only tables of the allow-list are fetched.
import type { APIEvent } from 'filesystem-routing/api';

import { getAuth } from '../../../server/auth';
import { listFeeder } from '../../../server/feeder-admin';
import { toCsv } from '../../../lib/csv';
import { FEEDER_GROUPS, feederExportColumns, isFeederGroup } from '../../../lib/feeder-admin';
import { feederLabel } from '../../../lib/feeder';
import { safeFilename } from '../../../lib/files';

const PAGE_SIZE = 500;
const MAX_EXPORT_ROWS = 10_000;

export async function GET(event: APIEvent) {
  const auth = await getAuth();
  if (!auth.authenticated) return new Response('Unauthorized', { status: 401 });
  if (auth.activeRole !== 'administrator') return new Response('Forbidden', { status: 403 });

  const url = new URL((event as unknown as { request: Request }).request.url);
  const group = url.searchParams.get('group') ?? '';
  const slug = url.searchParams.get('slug') ?? '';
  if (!isFeederGroup(group) || !FEEDER_GROUPS[group].includes(slug)) return new Response('Not found', { status: 404 });

  const rows: Record<string, unknown>[] = [];
  try {
    for (let page = 1; rows.length < MAX_EXPORT_ROWS; page++) {
      const res = await listFeeder(auth, group, slug, page, PAGE_SIZE);
      rows.push(...res.data);
      if (page >= res.pagination.total_page) break;
    }
  } catch (e) {
    return new Response((e as Error).message || 'Export failed', { status: 502 });
  }
  const capped = rows.slice(0, MAX_EXPORT_ROWS);
  const csv = toCsv(capped, feederExportColumns(capped).map((field) => ({ field, header: feederLabel(field) })));
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeFilename(`feeder-${group}-${slug}`, 'feeder')}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
