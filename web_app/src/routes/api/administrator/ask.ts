// POST /api/administrator/ask  ->  text/event-stream of the regulation chatbot's answer.
// The browser never sees the JWT: this relays the API's server-sent events with it.
import type { APIEvent } from 'filesystem-routing/api';

import { buildApiUrl } from '../../../server/api';
import { getAuth } from '../../../server/auth';
import { parseAskSettings } from '../../../server/chatbot';
import { getSession } from '../../../server/session';

export async function POST(event: APIEvent) {
  const auth = await getAuth();
  const token = (await getSession())?.token;
  if (!auth.authenticated || !token) return new Response('Unauthorized', { status: 401 });
  if (auth.activeRole !== 'administrator') return new Response('Forbidden', { status: 403 });

  const request = (event as unknown as { request: Request }).request;
  let settings;
  try {
    settings = parseAskSettings(await request.json());
  } catch {
    return new Response('Bad request', { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(buildApiUrl('ai/rag/ask'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
      signal: request.signal,
    });
  } catch {
    return new Response('Cannot reach the API server', { status: 502 });
  }
  if (!upstream.ok || !upstream.body) {
    const body = await upstream.json().catch(() => ({}));
    return new Response(JSON.stringify({ message: body?.message || body?.brief || 'The question could not be answered.' }), { status: upstream.status || 502, headers: { 'Content-Type': 'application/json' } });
  }
  return new Response(upstream.body, {
    headers: { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-store, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' },
  });
}
