// Server-sent events, parsed from a fetch stream (EventSource cannot POST).
export interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Split `buffer` into complete events and the unfinished remainder. Blocks end with a blank line;
 * `data:` lines are joined; a block whose data is not JSON is skipped.
 */
export function parseSse(buffer: string): { events: SseEvent[]; rest: string } {
  const text = buffer.replace(/\r\n/g, '\n');
  const events: SseEvent[] = [];
  let rest = text;
  let end: number;
  while ((end = rest.indexOf('\n\n')) >= 0) {
    const block = rest.slice(0, end);
    rest = rest.slice(end + 2);
    let event = 'message';
    const data: string[] = [];
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) event = line.slice(6).trim();
      else if (line.startsWith('data:')) data.push(line.slice(5).replace(/^ /, ''));
    }
    if (!data.length) continue;
    try {
      events.push({ event, data: JSON.parse(data.join('\n')) });
    } catch {
      /* not JSON: skip */
    }
  }
  return { events, rest };
}
