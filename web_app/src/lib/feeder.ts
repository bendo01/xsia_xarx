// Pure helpers for the generic Feeder browser (testable without the API).

type Rec = Record<string, unknown>;

/** The Feeder master tables (kept in step with FEEDER_PATHS in server/feeder.ts by a test). */
export const FEEDER_SLUGS: string[] = [
  'aktifitas-kuliah-mahasiswa',
  'aktifitas-mahasiswa',
  'aktifitas-mengajar-dosen',
  'anggota-aktifitas-mahasiswa',
  'bidang-minat-perguruan-tinggi',
  'bimbing-mahasiswa',
  'biodata-dosen',
  'biodata-mahasiswa',
  'detail-nilai-perkuliahan-kelas',
  'dosen',
  'dosen-pembimbing',
  'dosen-pengajar-kelas-kuliah',
  'fakultas',
  'hitung-transkrip-angkatan-mahasiswa',
  'kartu-rencana-studi-mahasiswa',
  'kelas-kuliah',
  'komponen-evaluasi-kelas',
  'konsistensi-data',
  'konversi-kampus-merdeka',
  'kurikulum',
  'mahasiswa',
  'mahasiswa-bimbingan-dosen',
  'mahasiswa-lulusan-dropout',
  'matakuliah',
  'matakuliah-kurikulum',
  'nilai-perkuliahan-kelas',
  'nilai-transfer-pendidikan-mahasiswa',
  'penugasan-dosen',
  'perguruan-tinggi',
  'periode-aktif',
  'periode-perkuliahan',
  'perkuliahan-mahasiswa',
  'peserta-kelas-kuliah',
  'prestasi-mahasiswa',
  'profil-perguruan-tinggi',
  'program-studi',
  'rencana-evaluasi',
  'rencana-pembelajaran',
  'riwayat-fungsional-dosen',
  'riwayat-nilai-mahasiswa',
  'riwayat-pangkat-dosen',
  'riwayat-pendidikan-dosen',
  'riwayat-pendidikan-mahasiswa',
  'riwayat-penelitian-dosen',
  'riwayat-sertifikasi-dosen',
  'skala-nilai-program-studi',
  'substansi-matakuliah',
  'transkrip-mahasiswa',
  'uji-mahasiswa',
];

/** Bookkeeping columns that tell the reader nothing. */
const HIDDEN = new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'sync_at', 'created_by', 'updated_by']);

/** "kelas-kuliah" -> "Kelas Kuliah". */
export const feederTitle = (slug: string) => slug.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/** "nama_mahasiswa" -> "Nama Mahasiswa". */
export const feederLabel = (key: string) => key.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

/**
 * Up to `max` columns for rows of unknown shape: scalar fields from the first row, skipping
 * bookkeeping fields and the raw `id_*` identifiers when readable `nama_*` / other fields exist.
 */
export function feederColumns(rows: Rec[], max = 6): string[] {
  const first = rows[0];
  if (!first) return [];
  const scalar = Object.keys(first).filter((k) => !HIDDEN.has(k) && (first[k] === null || typeof first[k] !== 'object'));
  const readable = scalar.filter((k) => !/^id_/.test(k));
  return (readable.length ? readable : scalar).slice(0, max);
}

export const feederCell = (v: unknown): string => (v === null || v === undefined || v === '' ? '-' : typeof v === 'boolean' ? (v ? '✓' : '-') : String(v));
