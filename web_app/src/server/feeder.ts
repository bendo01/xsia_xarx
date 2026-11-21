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

export const isFeederSlug = (slug: string) => Object.prototype.hasOwnProperty.call(FEEDER_PATHS, slug);

/** One page of a Feeder master table; only slugs of the allow-list are fetched. */
export async function loadFeederPage(slug: string, page: number, pageSize = 20) {
  if (!isFeederSlug(slug)) throw markSafeError(new Error('Not found'));
  return apiPaginated<Raw>(FEEDER_PATHS[slug], { page, per_page: pageSize });
}
