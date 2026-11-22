// Which loading skeleton to show for a page, from its URL (pure, unit-tested).
export type SkeletonKind = 'dashboard' | 'list' | 'detail';

/** Role homes and analytics-style pages are charts + KPI cards; lists are filter + table; the rest are detail/forms. */
export function skeletonKind(pathname: string): SkeletonKind {
  const p = pathname.split('?')[0].replace(/\/+$/, '');
  if (
    /^\/rectorat\/institution\/[^/]+$/.test(p) ||
    /^\/rectorat\/institution\/[^/]+\/unit\/[^/]+$/.test(p) ||
    /^\/course-department\/institution\/master\/unit\/[^/]+$/.test(p) ||
    /^\/student\/person\/master\/individual\/[^/]+$/.test(p) ||
    /^\/lecturer\/person\/master\/individual\/[^/]+\/show$/.test(p) ||
    /^\/administrator\/dashboard$/.test(p) ||
    /^\/candidate\/academic\/candidate\/master\/candidate\/[^/]+$/.test(p)
  ) {
    return 'dashboard';
  }
  if (/\/(create|edit|attendance|grade|enrollment)$/.test(p) || /(?<!\/institution)\/[0-9a-f]{8}-[0-9a-f-]{27}(\/(edit|attendance|grade|enrollment))?$/i.test(p)) return 'detail';
  return 'list';
}
