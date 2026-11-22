// GET /api/candidate/<candidate id>/file/<archive id>: streams an uploaded document back to its owner.
import type { APIEvent } from 'filesystem-routing/api';

import { ApiError, apiFetchRaw } from '../../../../../server/api';
import { archiveFilePath, ownCandidateId } from '../../../../../server/admission';
import { getAuth } from '../../../../../server/auth';
import { isUuid } from '../../../../../lib/validation';

export async function GET(event: APIEvent) {
  const { id = '', archiveId = '' } = event.params ?? {};
  try {
    const candidateId = ownCandidateId(await getAuth(), id);
    if (!isUuid(archiveId)) return new Response('Not found', { status: 404 });
    const upstream = await apiFetchRaw(archiveFilePath(candidateId, archiveId));
    return new Response(upstream.body, {
      headers: {
        'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
        'Content-Disposition': 'inline',
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : (err as { status?: number }).status;
    return new Response('Unavailable', { status: status && [401, 403, 404].includes(status) ? status : 502 });
  }
}
