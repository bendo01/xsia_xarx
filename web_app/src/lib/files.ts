/** A download filename that cannot break out of a Content-Disposition header. */
export function safeFilename(raw: string | null | undefined, fallback: string): string {
  const cleaned = (raw ?? '')
    .normalize('NFKD')
    .replace(/[^A-Za-z0-9._-]+/g, '_')
    .replace(/^[._-]+|[._-]+$/g, '')
    .slice(0, 80);
  return cleaned || fallback;
}
