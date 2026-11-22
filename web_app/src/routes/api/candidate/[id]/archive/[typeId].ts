// POST /api/candidate/<candidate id>/archive/<archive type id>  (multipart, field "file")
// Forwards one document upload with the session's token; ownership and size are checked here too.
import type { APIEvent } from 'filesystem-routing/api';

import { validateArchiveSize } from '../../../../../lib/admission-types';
import { ApiError } from '../../../../../server/api';
import { ownCandidateId, uploadAdmissionArchive } from '../../../../../server/admission';
import { getAuth } from '../../../../../server/auth';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'private, no-store' } });

export async function POST(event: APIEvent) {
  const { id = '', typeId = '' } = event.params ?? {};
  try {
    const candidateId = ownCandidateId(await getAuth(), id);
    const incoming = await (event as unknown as { request: Request }).request.formData();
    const file = incoming.get('file');
    if (!(file instanceof File) || file.size === 0) return json({ message: 'No file' }, 400);
    const tooBig = validateArchiveSize(file.size);
    if (tooBig) return json({ message: tooBig }, 413);
    const form = new FormData();
    form.append('file', file, file.name);
    await uploadAdmissionArchive(candidateId, typeId, form);
    return json({ ok: true });
  } catch (err) {
    const status = err instanceof ApiError ? err.status : (err as { status?: number }).status ?? 502;
    // 4xx messages are meant for the user (the API says why a file is refused); 5xx stay generic.
    const message = status < 500 ? (err as Error).message : 'Upload failed';
    return json({ message }, status >= 400 && status < 600 ? status : 502);
  }
}
