import { createUniqueId } from 'solid-js';

import type { Locale } from '../../i18n';

/**
 * Inline SVG flags. Flag emoji are not drawn on every system (Windows and many
 * Linux setups show the letters "ID" / "GB" instead), so the language button
 * uses vector flags that render the same everywhere.
 */
export default function Flag(props: { locale: Locale; class?: string }) {
  // Unique ids: several flags can be on a page, and SVG clipPath ids are global.
  const uid = createUniqueId();

  return (
    <svg
      class={props.class ?? 'h-3.5 w-5 shrink-0 rounded-xs'}
      viewBox="0 0 60 40"
      role="img"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {props.locale === 'id' ? (
        // Indonesia: red over white
        <>
          <rect width="60" height="20" fill="#ce1126" />
          <rect y="20" width="60" height="20" fill="#ffffff" />
          <rect width="60" height="40" fill="none" stroke="#00000022" stroke-width="1" />
        </>
      ) : (
        // United Kingdom: Union Jack
        <>
          <clipPath id={`${uid}-s`}><rect width="60" height="40" /></clipPath>
          <clipPath id={`${uid}-t`}><path d="M30,20 h30 v20 z v20 h-30 z h-30 v-20 z v-20 h30 z" /></clipPath>
          <g clip-path={`url(#${uid}-s)`}>
            <rect width="60" height="40" fill="#012169" />
            <path d="M0,0 L60,40 M60,0 L0,40" stroke="#ffffff" stroke-width="8" />
            <path d="M0,0 L60,40 M60,0 L0,40" clip-path={`url(#${uid}-t)`} stroke="#c8102e" stroke-width="5" />
            <path d="M30,0 v40 M0,20 h60" stroke="#ffffff" stroke-width="13" />
            <path d="M30,0 v40 M0,20 h60" stroke="#c8102e" stroke-width="8" />
          </g>
        </>
      )}
    </svg>
  );
}
