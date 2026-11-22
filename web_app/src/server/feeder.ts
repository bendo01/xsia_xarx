// Read-only browser over the Feeder (PDDikti) master tables for the rectorat role.
import { markSafeError } from '@solidjs/web';

import { apiPaginated } from './api';

type Raw = Record<string, any>;

// Listed literally so scripts/extract-api-usage.mjs sees every path (permissions come from client usage).
export const FEEDER_PATHS: Record<string, string> = {
  'aktifitas-kuliah-mahasiswa': 'feeder/master/aktifitas-kuliah-mahasiswa',
  'aktifitas-mahasiswa': 'feeder/master/aktifitas-mahasiswa',
  'aktifitas-mengajar-dosen': 'feeder/master/aktifitas-mengajar-dosen',
  'anggota-aktifitas-mahasiswa': 'feeder/master/anggota-aktifitas-mahasiswa',
  'bidang-minat-perguruan-tinggi': 'feeder/master/bidang-minat-perguruan-tinggi',
  'bimbing-mahasiswa': 'feeder/master/bimbing-mahasiswa',
  'biodata-dosen': 'feeder/master/biodata-dosen',
  'biodata-mahasiswa': 'feeder/master/biodata-mahasiswa',
  'detail-nilai-perkuliahan-kelas': 'feeder/master/detail-nilai-perkuliahan-kelas',
  'dosen': 'feeder/master/dosen',
  'dosen-pembimbing': 'feeder/master/dosen-pembimbing',
  'dosen-pengajar-kelas-kuliah': 'feeder/master/dosen-pengajar-kelas-kuliah',
  'fakultas': 'feeder/master/fakultas',
  'hitung-transkrip-angkatan-mahasiswa': 'feeder/master/hitung-transkrip-angkatan-mahasiswa',
  'kartu-rencana-studi-mahasiswa': 'feeder/master/kartu-rencana-studi-mahasiswa',
  'kelas-kuliah': 'feeder/master/kelas-kuliah',
  'komponen-evaluasi-kelas': 'feeder/master/komponen-evaluasi-kelas',
  'konsistensi-data': 'feeder/master/konsistensi-data',
  'konversi-kampus-merdeka': 'feeder/master/konversi-kampus-merdeka',
  'kurikulum': 'feeder/master/kurikulum',
  'mahasiswa': 'feeder/master/mahasiswa',
  'mahasiswa-bimbingan-dosen': 'feeder/master/mahasiswa-bimbingan-dosen',
  'mahasiswa-lulusan-dropout': 'feeder/master/mahasiswa-lulusan-dropout',
  'matakuliah': 'feeder/master/matakuliah',
  'matakuliah-kurikulum': 'feeder/master/matakuliah-kurikulum',
  'nilai-perkuliahan-kelas': 'feeder/master/nilai-perkuliahan-kelas',
  'nilai-transfer-pendidikan-mahasiswa': 'feeder/master/nilai-transfer-pendidikan-mahasiswa',
  'penugasan-dosen': 'feeder/master/penugasan-dosen',
  'perguruan-tinggi': 'feeder/master/perguruan-tinggi',
  'periode-aktif': 'feeder/master/periode-aktif',
  'periode-perkuliahan': 'feeder/master/periode-perkuliahan',
  'perkuliahan-mahasiswa': 'feeder/master/perkuliahan-mahasiswa',
  'peserta-kelas-kuliah': 'feeder/master/peserta-kelas-kuliah',
  'prestasi-mahasiswa': 'feeder/master/prestasi-mahasiswa',
  'profil-perguruan-tinggi': 'feeder/master/profil-perguruan-tinggi',
  'program-studi': 'feeder/master/program-studi',
  'rencana-evaluasi': 'feeder/master/rencana-evaluasi',
  'rencana-pembelajaran': 'feeder/master/rencana-pembelajaran',
  'riwayat-fungsional-dosen': 'feeder/master/riwayat-fungsional-dosen',
  'riwayat-nilai-mahasiswa': 'feeder/master/riwayat-nilai-mahasiswa',
  'riwayat-pangkat-dosen': 'feeder/master/riwayat-pangkat-dosen',
  'riwayat-pendidikan-dosen': 'feeder/master/riwayat-pendidikan-dosen',
  'riwayat-pendidikan-mahasiswa': 'feeder/master/riwayat-pendidikan-mahasiswa',
  'riwayat-penelitian-dosen': 'feeder/master/riwayat-penelitian-dosen',
  'riwayat-sertifikasi-dosen': 'feeder/master/riwayat-sertifikasi-dosen',
  'skala-nilai-program-studi': 'feeder/master/skala-nilai-program-studi',
  'substansi-matakuliah': 'feeder/master/substansi-matakuliah',
  'transkrip-mahasiswa': 'feeder/master/transkrip-mahasiswa',
  'uji-mahasiswa': 'feeder/master/uji-mahasiswa',
};

// Reference (lookup) tables, same literal-path rule.
export const REFERENSI_PATHS: Record<string, string> = {
  'agama': 'feeder/referensi/agama',
  'alat-transportasi': 'feeder/referensi/alat-transportasi',
  'bentuk-pendidikan': 'feeder/referensi/bentuk-pendidikan',
  'ikatan-kerja-sumber-daya-manusia': 'feeder/referensi/ikatan-kerja-sumber-daya-manusia',
  'jabatan-fungsional': 'feeder/referensi/jabatan-fungsional',
  'jalur-masuk': 'feeder/referensi/jalur-masuk',
  'jenis-aktifitas-mahasiswa': 'feeder/referensi/jenis-aktifitas-mahasiswa',
  'jenis-evaluasi': 'feeder/referensi/jenis-evaluasi',
  'jenis-keluar': 'feeder/referensi/jenis-keluar',
  'jenis-pendaftaran': 'feeder/referensi/jenis-pendaftaran',
  'jenis-prestasi': 'feeder/referensi/jenis-prestasi',
  'jenis-satuan-manajemen-sumberdaya': 'feeder/referensi/jenis-satuan-manajemen-sumberdaya',
  'jenis-sertifikasi': 'feeder/referensi/jenis-sertifikasi',
  'jenis-substansi': 'feeder/referensi/jenis-substansi',
  'jenis-tinggal': 'feeder/referensi/jenis-tinggal',
  'jenjang-pendidikan': 'feeder/referensi/jenjang-pendidikan',
  'kategori-kegiatan': 'feeder/referensi/kategori-kegiatan',
  'kebutuhan-khusus': 'feeder/referensi/kebutuhan-khusus',
  'lembaga-pengangkat': 'feeder/referensi/lembaga-pengangkat',
  'level-wilayah': 'feeder/referensi/level-wilayah',
  'negara': 'feeder/referensi/negara',
  'pangkat-golongan': 'feeder/referensi/pangkat-golongan',
  'pekerjaan': 'feeder/referensi/pekerjaan',
  'pembiayaan': 'feeder/referensi/pembiayaan',
  'penghasilan': 'feeder/referensi/penghasilan',
  'periode-lampau': 'feeder/referensi/periode-lampau',
  'semester': 'feeder/referensi/semester',
  'status-keaktifan-pegawai': 'feeder/referensi/status-keaktifan-pegawai',
  'status-kepegawaian': 'feeder/referensi/status-kepegawaian',
  'status-mahasiswa': 'feeder/referensi/status-mahasiswa',
  'tahun-ajaran': 'feeder/referensi/tahun-ajaran',
  'tingkat-prestasi': 'feeder/referensi/tingkat-prestasi',
  'wilayah': 'feeder/referensi/wilayah',
};

export type FeederGroup = 'master' | 'referensi';

export const isFeederSlug = (slug: string, group: FeederGroup = 'master') => Object.prototype.hasOwnProperty.call(group === 'referensi' ? REFERENSI_PATHS : FEEDER_PATHS, slug);

/** One page of a Feeder master table; only slugs of the allow-list are fetched. */
export async function loadFeederPage(group: FeederGroup, slug: string, page: number, pageSize = 20) {
  if (!isFeederSlug(slug, group)) throw markSafeError(new Error('Not found'));
  if (group === 'referensi') return apiPaginated<Raw>(REFERENSI_PATHS[slug], { page, per_page: pageSize });
  return apiPaginated<Raw>(FEEDER_PATHS[slug], { page, per_page: pageSize });
}
