// GET /api/realtime/enrollment/<student activity id>  ->  text/event-stream
// Live seat counts for the classes of a semester plus changes to the student's
// own study plan. The browser connects here with EventSource; this server holds
// the API's WebSocket (and the JWT) and relays only those events. See
// src/server/realtime.ts.
import type { APIEvent } from 'filesystem-routing/api';
import { env } from 'virtual:solid-env/server';

import { getAuth } from '../../../../server/auth';
import { loadRealtimeChannels } from '../../../../server/enrollment';
import { createRelayStream, toWsUrl } from '../../../../server/realtime';
import { getSession } from '../../../../server/session';

export async function GET(event: APIEvent) {
  const auth = await getAuth();
  const token = (await getSession())?.token;
  if (!auth.authenticated || !token) return new Response('Unauthorized', { status: 401 });

  let channels: string[];
  try {
    channels = await loadRealtimeChannels(auth, event.params?.id ?? '');
  } catch {
    // Not yours, not a UUID, or not found: indistinguishable on purpose.
    return new Response('Not found', { status: 404 });
  }

  const request = (event as unknown as { request: Request }).request;
  const stream = createRelayStream({
    url: toWsUrl(env.API_SERVER_URL, token),
    channels,
    signal: request.signal,
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // tell nginx-style proxies not to buffer the stream
    },
  });
}
