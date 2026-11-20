// GET /api/realtime/meeting/<meeting id>  ->  text/event-stream of that meeting's
// attendance changes (QR scans from students, edits from another device). Same relay
// as the enrollment feed: this server holds the WebSocket and the JWT.
import type { APIEvent } from 'filesystem-routing/api';
import { env } from 'virtual:solid-env/server';

import { getAuth } from '../../../../server/auth';
import { loadRoster } from '../../../../server/attendance';
import { createRelayStream, toWsUrl } from '../../../../server/realtime';
import { getSession } from '../../../../server/session';
import { isUuid } from '../../../../lib/validation';

export async function GET(event: APIEvent) {
  const auth = await getAuth();
  const token = (await getSession())?.token;
  if (!auth.authenticated || !token) return new Response('Unauthorized', { status: 401 });

  const id = event.params?.id ?? '';
  if (!isUuid(id)) return new Response('Not found', { status: 404 });
  try {
    // The API only returns the roster to someone allowed to see the meeting.
    await loadRoster(id);
  } catch {
    return new Response('Not found', { status: 404 });
  }

  const request = (event as unknown as { request: Request }).request;
  const stream = createRelayStream({ url: toWsUrl(env.API_SERVER_URL, token), channels: [`meeting:${id}`], signal: request.signal });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
