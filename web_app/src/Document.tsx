import type { ParentProps } from 'solid-js';
import { HydrationScript } from '@solidjs/web';

import { currentLocale } from './i18n';
import { THEME_INIT_SCRIPT } from './lib/theme';

// The document shell (the index.html replacement), picked up by the
// src/Document.* convention; it must render the full <html> and ships no
// client JS. <HydrationScript /> is stripped from the prerendered shell in
// client mode and activates under `ssr: true`.
export default function Document(props: ParentProps) {
  return (
    <html lang={currentLocale()}>
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        {/* Static constant (no user input); escaped text children would corrupt the script. */}
        {/* oxlint-disable-next-line solid/no-innerhtml */}
        <script innerHTML={THEME_INIT_SCRIPT} />
        <HydrationScript />
      </head>
      <body>{props.children}</body>
    </html>
  );
}
