import { describe, expect, it } from 'vitest';

import { parseSse } from './sse';

describe('parseSse', () => {
  it('parses complete events and keeps the unfinished tail', () => {
    const r = parseSse('event: token\ndata: {"text":"Hel"}\n\nevent: token\ndata: {"text":"lo"}\n\nevent: do');
    expect(r.events).toEqual([{ event: 'token', data: { text: 'Hel' } }, { event: 'token', data: { text: 'lo' } }]);
    expect(r.rest).toBe('event: do');
  });
  it('handles CRLF, multi-line data and the default event name', () => {
    expect(parseSse('data: {"a":\r\ndata: 1}\r\n\r\n').events).toEqual([{ event: 'message', data: { a: 1 } }]);
  });
  it('skips blocks without data or with invalid JSON', () => {
    expect(parseSse(': ping\n\nevent: x\ndata: nope\n\n').events).toEqual([]);
  });
});
