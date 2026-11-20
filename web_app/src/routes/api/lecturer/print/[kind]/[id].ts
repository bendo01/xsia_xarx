// GET /api/lecturer/print/<kind>/<teach id>?filled=true|false  (kind: attendance | grade | grade-xlsx)
// Streams the generated file from the Rust API with the session's token, so a plain link opens it.
import type { APIEvent } from 'filesystem-routing/api';

import { isUuid } from '../../../../../lib/validation';
import { ApiError, apiFetchRaw } from '../../../../../server/api';

const KINDS: Record<string, { path: string; accept: string; type: string; ext: string; label: string }> = {
  attendance: { path: 'teach-attendance-print', accept: 'application/pdf', type: 'application/pdf', ext: 'pdf', label: 'Presensi' },
  grade: { path: 'teach-grade-print', accept: 'application/pdf', type: 'application/pdf', ext: 'pdf', label: 'Nilai' },
  'grade-xlsx': {
    path: 'teach-grade-xlsx',
    accept: '*/*',
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: 'xlsx',
    label: 'Nilai',
  },
};

export async function GET(event: APIEvent) {
  const { kind = '', id = '' } = event.params ?? {};
  const k = KINDS[kind];
  if (!k || !isUuid(id)) return new Response('Not found', { status: 404 });
  const url = new URL((event as unknown as { request: Request }).request.url);
  const filled = url.searchParams.get('filled') === 'true';

  try {
    const upstream = await apiFetchRaw(`academic/campaign/transaction/${k.path}/${id}`, { query: { filled }, accept: k.accept });
    const name = `${k.label}_${filled ? 'Terisi' : 'Kosong'}_${id.slice(0, 8)}.${k.ext}`;
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? k.type,
        'Content-Disposition': `${k.ext === 'pdf' ? 'inline' : 'attachment'}; filename="${name}"`,
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const status = err instanceof ApiError && [401, 403, 404].includes(err.status) ? err.status : 502;
    return new Response(status === 502 ? 'Could not generate the document' : 'Unavailable', { status });
  }
}
