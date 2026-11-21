import { t } from '../i18n';

/** Server rule codes thrown as safe messages (see server/crud.ts) -> translated text. */
const CODES: Record<string, string> = {
  locked: 'cd.teachLocked',
  hasStudents: 'cd.teachHasStudents',
  classLocked: 'lc.classLocked',
};

export function crudErrorText(e: unknown, fallbackKey: string): string {
  const m = e instanceof Error ? e.message : '';
  return CODES[m] ? t(CODES[m]) : m || t(fallbackKey);
}
