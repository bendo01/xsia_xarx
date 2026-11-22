// Validation of an archive upload (pure): the same rules run in the browser form and on the server.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type UploadError = 'noFile' | 'tooLarge' | 'noType' | 'badOwner' | 'tooLong' | 'pdfOnly';

export interface UploadInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  archiveTypeId: string;
  archiveableId?: string;
  description?: string;
  isKnowledge?: boolean;
}

/** The first problem with an upload, or null when it may be sent. Knowledge-base documents must be PDFs. */
export function uploadProblem(i: UploadInput): UploadError | null {
  if (!i.fileName || !(i.fileSize > 0)) return 'noFile';
  if (i.fileSize > MAX_UPLOAD_BYTES) return 'tooLarge';
  if (!UUID.test(i.archiveTypeId)) return 'noType';
  if (i.archiveableId && !UUID.test(i.archiveableId)) return 'badOwner';
  if ((i.description ?? '').length > 1000) return 'tooLong';
  if (i.isKnowledge && !(i.fileType === 'application/pdf' || /\.pdf$/i.test(i.fileName))) return 'pdfOnly';
  return null;
}
