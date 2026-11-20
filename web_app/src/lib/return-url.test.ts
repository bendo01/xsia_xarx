import { describe, expect, it } from 'vitest';
import { safeReturnUrl } from './return-url';

describe('safeReturnUrl', () => {
  it('keeps same-origin paths', () => {
    expect(safeReturnUrl('/student/x?a=1#h')).toBe('/student/x?a=1#h');
  });
  it.each([
    'https://evil.com',
    '//evil.com',
    '/\\evil.com',
    'javascript:alert(1)',
    'student/x',
    '/a\nb',
    '',
    null,
    undefined,
  ])('rejects %s', (v) => {
    expect(safeReturnUrl(v as string | null | undefined)).toBeNull();
  });
});
