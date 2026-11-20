// GET /api/student/print/krs/<activity id>  (or /khs/...): streams the PDF from
// the Rust API using the session's token. A plain link opens it, so there is no
// blob handling and no popup-blocker problem (the old client's PopupBlockedAlert).
import type { APIEvent } from 'filesystem-routing/api';

import { isUuid } from '../../../../../lib/validation';
import { safeFilename } from '../../../../../lib/files';
import { ApiError, apiFetchRaw } from '../../../../../server/api';

const PATHS: Record<string, string> = {
  krs: 'print_activity_plan',
  khs: 'print_activity_result',
};

export async function GET(event: APIEvent) {
  const { kind = '', id = '' } = event.params ?? {};
  if (!(kind in PATHS) || !isUuid(id)) return new Response('Not found', { status: 404 });

  try {
    const upstream = await apiFetchRaw(
      `academic/student/campaign/student-activities/${PATHS[kind]}/${id}`,
      { accept: 'application/pdf' },
    );
    const name = new URL((event as unknown as { request: Request }).request.url).searchParams.get('name');
    const filename = safeFilename(name, `${kind.toUpperCase()}.pdf`);
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/pdf',
        'Content-Disposition': `inline; filename="${filename.endsWith('.pdf') ? filename : `${filename}.pdf`}"`,
        // Personal academic records: never cache in shared caches.
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const status = err instanceof ApiError && [401, 403, 404].includes(err.status) ? err.status : 502;
    return new Response(status === 502 ? 'Could not generate the document' : 'Unavailable', { status });
  }
}
