// POST /api/administrator/archive-upload (multipart)  ->  JSON of the stored archive.
// Relays the file to the API with the session's token; the rules are checked in server/archives.ts first.
import type { APIEvent } from 'filesystem-routing/api';

import { getAuth } from '../../../server/auth';
import { uploadArchive } from '../../../server/archives';

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export async function POST(event: APIEvent) {
  const auth = await getAuth();
  if (!auth.authenticated) return json({ message: 'Unauthorized' }, 401);
  if (auth.activeRole !== 'administrator') return json({ message: 'Forbidden' }, 403);
  let form: FormData;
  try {
    form = await (event as unknown as { request: Request }).request.formData();
  } catch {
    return json({ message: 'Invalid form' }, 400);
  }
  try {
    return json(await uploadArchive(auth, form));
  } catch (e) {
    const status = typeof (e as { status?: number }).status === 'number' ? (e as { status: number }).status : 500;
    return json({ message: status < 500 ? (e as Error).message : 'The upload failed' }, status);
  }
}
