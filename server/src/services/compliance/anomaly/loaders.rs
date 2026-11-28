//! Builds anomaly-detection inputs from `feeder_master`. Reads FEEDER data only.

use super::{ClassEnrolment, LecturerLoad, StudentSpan, StudentTerm};
use crate::models::feeder::master::{dosen_pengajar_kelas_kuliah, kelas_kuliah, mahasiswa, nilai_perkuliahan_kelas, perkuliahan_mahasiswa};
use chrono::{Datelike, NaiveDate};
use sea_orm::{ConnectionTrait, DbErr, EntityTrait};
use std::collections::HashMap;
use uuid::Uuid;

/// Teaching load per (lecturer, semester). A class counts once per lecturer even when it has several
/// rows (one per evaluation type); its SKS is the largest `sks_substansi_total` seen.
pub async fn lecturer_loads<C: ConnectionTrait>(db: &C) -> Result<Vec<LecturerLoad>, DbErr> {
    let rows = dosen_pengajar_kelas_kuliah::Entity::find().all(db).await?;
    let mut per_class: HashMap<(Uuid, String, Uuid), f64> = HashMap::new();
    for r in rows.iter().filter(|r| r.deleted_at.is_none()) {
        let (Some(lecturer), Some(semester), Some(class)) = (r.id_dosen, r.id_semester.clone(), r.id_kelas_kuliah) else { continue };
        let sks = f64::from(r.sks_substansi_total.unwrap_or(0.0));
        let slot = per_class.entry((lecturer, semester, class)).or_insert(0.0);
        *slot = slot.max(sks);
    }
    Ok(sum_loads(per_class))
}

/// Sums the SKS of each class, keyed `(lecturer, semester, class)`, into one load per (lecturer, semester).
fn sum_loads(per_class: HashMap<(Uuid, String, Uuid), f64>) -> Vec<LecturerLoad> {
    let mut totals: HashMap<(Uuid, String), (f64, u32)> = HashMap::new();
    for ((lecturer, semester, _), sks) in per_class {
        let t = totals.entry((lecturer, semester)).or_default();
        t.0 += sks;
        t.1 += 1;
    }
    totals
        .into_iter()
        .map(|((lecturer_id, semester), (credits, classes))| LecturerLoad { lecturer_id, semester, credits, classes })
        .collect()
}

/// Classes with their enrolment and, when `nilai_perkuliahan_kelas` has the class, the share of KRS students graded.
pub async fn class_enrolments<C: ConnectionTrait>(db: &C) -> Result<Vec<ClassEnrolment>, DbErr> {
    let graded: HashMap<Uuid, f64> = nilai_perkuliahan_kelas::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .filter(|n| n.deleted_at.is_none())
        .filter_map(|n| {
            let (class, krs, got) = (n.id_kelas_kuliah?, n.jumlah_mahasiswa_krs?, n.jumlah_mahasiswa_dapat_nilai?);
            (krs > 0).then(|| (class, (f64::from(got) / f64::from(krs)).min(1.0)))
        })
        .collect();
    Ok(kelas_kuliah::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .filter(|c| c.deleted_at.is_none())
        .filter_map(|c| {
            Some(ClassEnrolment {
                class_id: c.id_kelas_kuliah,
                capacity: c.kapasitas?,
                enrolled: c.jumlah_mahasiswa?,
                semester: c.id_semester,
                sks: c.sks.map(f64::from),
                graded_ratio: graded.get(&c.id_kelas_kuliah).copied().unwrap_or(1.0),
            })
        })
        .collect())
}

/// Builds a term from the columns of one `perkuliahan_mahasiswa` row, ordered
/// `[ips, ipk, sks_semester, sks_total, biaya_kuliah_smt]`. `students` maps a registration id to
/// `mahasiswa.id`. `None` if the registration is unknown or any value is missing.
fn student_term(registration: Option<Uuid>, semester: Option<String>, values: [Option<f32>; 5], students: &HashMap<Uuid, Uuid>) -> Option<StudentTerm> {
    let [ips, ipk, sks_semester, sks_total, tuition] = values;
    Some(StudentTerm {
        student_id: *students.get(&registration?)?,
        semester: semester?,
        ips: f64::from(ips?),
        ipk: f64::from(ipk?),
        sks_semester: f64::from(sks_semester?),
        sks_total: f64::from(sks_total?),
        tuition: f64::from(tuition?),
    })
}

/// One row per (student, semester) from `perkuliahan_mahasiswa`. The student id is `mahasiswa.id`,
/// the same one [`student_spans`] uses; rows without a matching student or missing a value are skipped.
pub async fn student_terms<C: ConnectionTrait>(db: &C) -> Result<Vec<StudentTerm>, DbErr> {
    let students: HashMap<Uuid, Uuid> = mahasiswa::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .filter(|m| m.deleted_at.is_none())
        .filter_map(|m| Some((m.id_registrasi_mahasiswa?, m.id)))
        .collect();
    Ok(perkuliahan_mahasiswa::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .filter(|p| p.deleted_at.is_none())
        .filter_map(|p| {
            let values = [p.ips, p.ipk, p.sks_semester, p.sks_total, p.biaya_kuliah_smt];
            student_term(p.id_registrasi_mahasiswa, p.id_semester, values, &students)
        })
        .collect())
}

/// Entry year from a FEEDER period id such as `20231` (year + semester digit).
fn period_year(period: &str) -> Option<f64> {
    let year: i32 = period.get(..4)?.parse().ok()?;
    let half: f64 = match period.get(4..5) {
        Some("2") => 0.5,
        _ => 0.0,
    };
    Some(f64::from(year) + half)
}

pub async fn student_spans<C: ConnectionTrait>(db: &C, today: NaiveDate) -> Result<Vec<StudentSpan>, DbErr> {
    let now = f64::from(today.year()) + f64::from(today.ordinal0()) / 365.0;
    Ok(mahasiswa::Entity::find()
        .all(db)
        .await?
        .into_iter()
        .filter(|m| m.deleted_at.is_none())
        .filter_map(|m| {
            let start = period_year(m.id_periode.as_deref()?)?;
            let end = m
                .tanggal_keluar
                .map(|d| f64::from(d.year()) + f64::from(d.ordinal0()) / 365.0)
                .or_else(|| m.id_periode_keluar.as_deref().and_then(period_year));
            Some(StudentSpan { student_id: m.id, years: (end.unwrap_or(now) - start).max(0.0), active: end.is_none() })
        })
        .collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn student_term_uses_the_student_id_of_the_registration() {
        let (registration, student) = (Uuid::new_v4(), Uuid::new_v4());
        let students = HashMap::from([(registration, student)]);
        let values = [Some(3.0), Some(3.5), Some(20.0), Some(40.0), Some(1_000_000.0)];
        let term = |registration, values| student_term(registration, Some("20231".into()), values, &students);

        let found = term(Some(registration), values).unwrap();
        assert_eq!((found.student_id, found.ipk, found.tuition), (student, 3.5, 1_000_000.0));
        assert!(term(Some(Uuid::new_v4()), values).is_none());
        assert!(term(None, values).is_none());
        assert!(term(Some(registration), [None, values[1], values[2], values[3], values[4]]).is_none());
    }

    #[test]
    fn loads_are_summed_in_a_fixed_order() {
        let per_class: HashMap<_, _> = (0..60u128)
            .map(|i| ((Uuid::from_u128(i % 30), format!("2023{}", 1 + i / 30), Uuid::from_u128(100 + i)), 2.0))
            .collect();
        let keys: Vec<_> = sum_loads(per_class).into_iter().map(|l| (l.semester, l.lecturer_id)).collect();
        let mut sorted = keys.clone();
        sorted.sort();
        assert_eq!(keys.len(), 60);
        assert_eq!(keys, sorted);
    }

    #[test]
    fn period_year_reads_year_and_semester() {
        assert_eq!(period_year("20231"), Some(2023.0));
        assert_eq!(period_year("20232"), Some(2023.5));
        assert_eq!(period_year("abc"), None);
        assert_eq!(period_year("20"), None);
    }
}
