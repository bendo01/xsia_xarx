import { describe, expect, it } from 'vitest';

import { loadArchiveTypes, loadKnowledgeStatus, reindexAll, reindexArchive, uploadArchive } from './archives';
import type { AuthState } from './auth';

const ID = '11111111-1111-4111-8111-111111111111';
const as = (activeRole: string) => ({ activeRole }) as AuthState;
const admin = as('administrator');
const form = (over: Record<string, string> = {}, file: File | null = new File(['%PDF'], 'sk.pdf', { type: 'application/pdf' })) => {
  const f = new FormData();
  if (file) f.set('file', file);
  f.set('archive_type_id', ID);
  for (const [k, v] of Object.entries(over)) f.set(k, v);
  return f;
};

describe('archive guards', () => {
  it('is administrator-only', async () => {
    await expect(uploadArchive(as('rectorat'), form())).rejects.toThrow('Forbidden');
    await expect(loadArchiveTypes(as('student'))).rejects.toThrow('Forbidden');
    await expect(loadKnowledgeStatus(as('lecturer'))).rejects.toThrow('Forbidden');
    await expect(reindexArchive(as('rectorat'), ID)).rejects.toThrow('Forbidden');
    await expect(reindexAll(as('rectorat'))).rejects.toThrow('Forbidden');
  });
});

describe('uploadArchive validation (before any request)', () => {
  it('needs a file, an archive type and a PDF for the knowledge base', async () => {
    await expect(uploadArchive(admin, form({}, null))).rejects.toThrow('Choose a file');
    await expect(uploadArchive(admin, form({ archive_type_id: 'x' }))).rejects.toThrow('archive type');
    await expect(uploadArchive(admin, form({ is_knowledge: 'true' }, new File(['x'], 'a.docx', { type: 'text/plain' })))).rejects.toThrow('PDF');
    await expect(uploadArchive(admin, form({ archiveable_id: 'x' }))).rejects.toThrow('owner id');
  });
  it('rejects bad ids for re-indexing', async () => {
    await expect(reindexArchive(admin, 'x')).rejects.toThrow('Not found');
    await expect(reindexAll(admin, [ID, 'x'])).rejects.toThrow('Not found');
  });
});
