//! Loads `feeder_master` rows as comparable [`Record`]s. Reads FEEDER data only.

use super::{EntityKind, Record};
use crate::models::feeder::master::{dosen, kelas_kuliah, mahasiswa, matakuliah};
use sea_orm::{ConnectionTrait, DbErr, EntityTrait};

fn clean(v: &Option<String>) -> Option<String> {
    v.as_deref().map(str::trim).filter(|s| !s.is_empty()).map(str::to_owned)
}

pub fn student(m: &mahasiswa::Model) -> Record {
    Record {
        id: m.id,
        name: m.nama_mahasiswa.clone().unwrap_or_default(),
        number: clean(&m.nim),
        birth_date: m.tanggal_lahir,
        prodi: m.id_prodi.map(|p| p.to_string()).or_else(|| clean(&m.nama_program_studi)),
        ..Default::default()
    }
}

pub fn lecturer(m: &dosen::Model) -> Record {
    Record {
        id: m.id,
        name: m.nama_dosen.clone().unwrap_or_default(),
        number: clean(&m.nidn),
        birth_date: m.tanggal_lahir,
        ..Default::default()
    }
}

pub fn course(m: &matakuliah::Model) -> Record {
    Record {
        id: m.id,
        name: m.nama_mata_kuliah.clone().unwrap_or_default(),
        number: clean(&m.kode_mata_kuliah),
        credits: m.sks_mata_kuliah.map(f64::from),
        prodi: m.id_prodi.map(|p| p.to_string()),
        ..Default::default()
    }
}

pub fn class(m: &kelas_kuliah::Model) -> Record {
    let course_name = m.nama_mata_kuliah.clone().unwrap_or_default();
    let variant = clean(&m.nama_kelas_kuliah);
    Record {
        id: m.id_kelas_kuliah,
        name: format!("{course_name} {}", variant.as_deref().unwrap_or("")).trim().to_owned(),
        number: clean(&m.kode_mata_kuliah),
        credits: m.sks_mk.or(m.sks).map(f64::from),
        term: clean(&m.id_semester),
        parent: m.id_matkul.map(|p| p.to_string()),
        variant,
        prodi: m.id_prodi.map(|p| p.to_string()),
        ..Default::default()
    }
}

/// All non-deleted rows of `kind` from `feeder_master`.
pub async fn load<C: ConnectionTrait>(db: &C, kind: EntityKind) -> Result<Vec<Record>, DbErr> {
    Ok(match kind {
        EntityKind::Student => mahasiswa::Entity::find().all(db).await?.iter().filter(|m| m.deleted_at.is_none()).map(student).collect(),
        EntityKind::Lecturer => dosen::Entity::find().all(db).await?.iter().filter(|m| m.deleted_at.is_none()).map(lecturer).collect(),
        EntityKind::Course => matakuliah::Entity::find().all(db).await?.iter().filter(|m| m.deleted_at.is_none()).map(course).collect(),
        EntityKind::Class => kelas_kuliah::Entity::find().all(db).await?.iter().filter(|m| m.deleted_at.is_none()).map(class).collect(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn blank_strings_become_none() {
        assert_eq!(clean(&Some("  ".into())), None);
        assert_eq!(clean(&Some(" X1 ".into())), Some("X1".into()));
        assert_eq!(clean(&None), None);
    }
}
