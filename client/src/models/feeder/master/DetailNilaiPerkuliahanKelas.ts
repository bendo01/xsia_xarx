export interface FeederMasterDetailNilaiPerkuliahanKelas {
  id: string
  sync_at: string
  created_by: any
  updated_by: any
  created_at: string
  updated_at: string
  deleted_at: any
  id_prodi: string
  nama_program_studi: string
  id_semester: string
  nama_semester: string
  id_matkul: string
  kode_mata_kuliah: string
  nama_mata_kuliah: string
  sks_mata_kuliah: number
  id_kelas_kuliah: string
  nama_kelas_kuliah: string
  id_registrasi_mahasiswa: string
  id_mahasiswa: string
  nim: string
  nama_mahasiswa: string
  jurusan: string
  angkatan: string
  nilai_angka: number | null
  nilai_indeks: number | null
  nilai_huruf: string | null
}