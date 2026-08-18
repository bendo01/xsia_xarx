import { FeederMasterPerkuliahanMahasiswa } from './PerkuliahanMahasiswa'
import { FeederMasterDetailNilaiPerkuliahanKelas } from './DetailNilaiPerkuliahanKelas'

/**
 * Response structure from feederMasterPerkuliahanMahasiswa API
 * Each item contains enrollment info for a semester and complete grade history
 */
export interface PerkuliahanMahasiswaResponse {
  perkuliahan: FeederMasterPerkuliahanMahasiswa
  detail_nilai: FeederMasterDetailNilaiPerkuliahanKelas[]
}

/**
 * Grouped grades by semester for easier display
 */
export interface GradesBySemester {
  id_semester: string
  nama_semester: string
  grades: FeederMasterDetailNilaiPerkuliahanKelas[]
  totalSKS: number
  completedSKS: number
  averageGrade: number | null
}
