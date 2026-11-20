// Runs in node against the server renderer: checks these components render
// without a DOM. LIMIT: it does NOT catch JSX evaluated at module load (the
// "getNextContextId cannot be used under non-hydrating context" failure that
// only occurs in the app's hydratable SSR build; vitest compiles without
// hydration keys). For that, curl a page from `bun run dev` and look for
// [SSR_RENDER_ERROR_CONTAINED] in the log.
import { renderToString } from '@solidjs/web';
import { describe, expect, it } from 'vitest';

import { AuthAlert, AuthField, SubmitButton } from './fields';

describe('auth field components render on the server', () => {
  it.each(['mail', 'lock', 'phone', 'key'] as const)('AuthField with %s icon', (icon) => {
    const html = renderToString(() => <AuthField label="L" icon={icon} name="n" value="v" />);
    expect(html).toContain('<input');
    expect(html).toContain('name="n"');
    expect(html).toContain('<svg');
  });

  it('password field renders a visibility toggle', () => {
    const html = renderToString(() => <AuthField label="P" icon="lock" name="p" type="password" />);
    expect(html).toContain('type="password"');
    expect(html).toContain('<button');
  });

  it('SubmitButton and AuthAlert', () => {
    const html = renderToString(() => (
      <div>
        <AuthAlert kind="error">boom</AuthAlert>
        <SubmitButton pending>go</SubmitButton>
      </div>
    ));
    expect(html).toContain('role="alert"');
    expect(html).toContain('disabled');
  });
});
