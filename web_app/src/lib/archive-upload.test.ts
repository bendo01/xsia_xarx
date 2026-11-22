import { describe, expect, it } from 'vitest';

import { MAX_UPLOAD_BYTES, uploadProblem } from './archive-upload';

const ID = '11111111-1111-4111-8111-111111111111';
const ok = { fileName: 'sk.pdf', fileType: 'application/pdf', fileSize: 1000, archiveTypeId: ID };

describe('uploadProblem', () => {
  it('accepts a normal upload', () => {
    expect(uploadProblem(ok)).toBeNull();
    expect(uploadProblem({ ...ok, isKnowledge: true, archiveableId: ID, description: 'x' })).toBeNull();
  });
  it('needs a non-empty file under the size cap', () => {
    expect(uploadProblem({ ...ok, fileName: '' })).toBe('noFile');
    expect(uploadProblem({ ...ok, fileSize: 0 })).toBe('noFile');
    expect(uploadProblem({ ...ok, fileSize: MAX_UPLOAD_BYTES + 1 })).toBe('tooLarge');
    expect(uploadProblem({ ...ok, fileSize: MAX_UPLOAD_BYTES })).toBeNull();
  });
  it('needs a valid archive type and, when given, a valid owner id', () => {
    expect(uploadProblem({ ...ok, archiveTypeId: '' })).toBe('noType');
    expect(uploadProblem({ ...ok, archiveTypeId: 'nope' })).toBe('noType');
    expect(uploadProblem({ ...ok, archiveableId: 'nope' })).toBe('badOwner');
  });
  it('limits the description', () => {
    expect(uploadProblem({ ...ok, description: 'x'.repeat(1001) })).toBe('tooLong');
  });
  it('lets only PDFs into the knowledge base', () => {
    expect(uploadProblem({ ...ok, fileName: 'a.docx', fileType: 'application/msword', isKnowledge: true })).toBe('pdfOnly');
    expect(uploadProblem({ ...ok, fileName: 'a.docx', fileType: 'application/msword' })).toBeNull();
    expect(uploadProblem({ ...ok, fileName: 'SCAN.PDF', fileType: '', isKnowledge: true })).toBeNull();
  });
});
