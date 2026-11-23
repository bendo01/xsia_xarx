//! Fixed, read-only queries that gather one student's data for the chatbot.
//!
//! There is no free-form SQL: each section is a hand-written query that returns a small struct. What may be read
//! is decided beforehand by [`super::student_scope`]; [`load`] receives its [`DataScope`] and never returns a
//! section the scope does not allow, even when the question asked for it.

use std::collections::HashMap;

use salvo::http::StatusError;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};
use serde::Serialize;
use uuid::Uuid;

use super::student_scope::DataScope;
use crate::models::academic::campaign::transaction::{activities, grades};
use crate::models::academic::course::master::{concentrations, courses};
use crate::models::academic::student::campaign::{detail_activities, student_activities};
use crate::models::academic::student::final_assignment::transaction::submissions;
use crate::models::academic::student::master::students;
use crate::models::academic::student::reference::{finances, statuses};
use crate::models::contact::master::{electronic_mails, owner_types, phones, residences};
use crate::models::institution::master::units;
use crate::models::person::master::{family_card, family_card_member, individual};
use crate::models::person::reference::{gender, religion, relative_type};

/// Sections the question asks for. Each is still checked against the [`DataScope`]
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub struct Wanted {
    pub profile: bool,
    pub academic: bool,
    pub finance: bool,
    pub sensitive: bool,
}

impl Wanted {
    pub fn all() -> Self {
        Self { profile: true, academic: true, finance: true, sensitive: true }
    }

    pub fn is_empty(&self) -> bool {
        !(self.profile || self.academic || self.finance || self.sensitive)
    }
}

#[derive(Debug, Default, Serialize)]
pub struct StudentData {
    pub profile: Option<Profile>,
    pub academic: Option<Academic>,
    pub finance: Option<Finance>,
    pub sensitive: Option<Sensitive>,
    /// Sections that were asked for but the caller may not see, so the answer can say so instead of guessing
    pub withheld: Vec<&'static str>,
}

#[derive(Debug, Serialize)]
pub struct Profile {
    pub code: String,
    pub name: String,
    pub unit: String,
    pub concentration: String,
    pub status: String,
    pub registered: String,
    pub counsellors: Vec<String>,
}

#[derive(Debug, Serialize)]
pub struct Semester {
    pub name: String,
    /// Index and credits of the semester itself
    pub index: f64,
    pub credit: Option<f64>,
    /// Cumulative index and credits up to this semester
    pub cumulative_index: f64,
    pub cumulative_credit: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct Grade {
    pub course_code: String,
    pub course: String,
    pub credit: Option<f64>,
    pub mark: Option<f64>,
    pub letter: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct Thesis {
    pub title: Option<String>,
    pub taken: bool,
}

#[derive(Debug, Serialize)]
pub struct Academic {
    /// Semesters, oldest first. Empty when the scope is limited to classes
    pub semesters: Vec<Semester>,
    pub latest_cumulative_index: Option<f64>,
    pub latest_cumulative_credit: Option<f64>,
    /// Name of the semester the grades below belong to
    pub grades_semester: Option<String>,
    pub grades: Vec<Grade>,
    pub final_assignment: Vec<Thesis>,
}

#[derive(Debug, Serialize)]
pub struct FeePerSemester {
    pub semester: String,
    pub fee: Option<f64>,
}

/// The database holds the fee category and the fee per semester; it has no payment records
#[derive(Debug, Serialize)]
pub struct Finance {
    pub category: Option<String>,
    pub fee: Option<f64>,
    pub per_semester: Vec<FeePerSemester>,
}

#[derive(Debug, Serialize)]
pub struct Relative {
    pub name: String,
    pub relation: String,
}

#[derive(Debug, Serialize)]
pub struct Sensitive {
    pub identity_number: String,
    pub gender: String,
    pub religion: String,
    pub birth_place: String,
    pub birth_date: String,
    pub addresses: Vec<String>,
    pub phones: Vec<String>,
    pub emails: Vec<String>,
    pub family_card_number: Option<String>,
    pub relatives: Vec<Relative>,
}

fn internal(e: impl std::fmt::Display) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

/// Reads the `name` of the row `id` in a reference table; an empty string when the row is gone
macro_rules! name_of {
    ($db:expr, $entity:path, $id:expr, $get:expr) => {
        <$entity>::find_by_id($id).one($db).await.map_err(internal)?.map($get).unwrap_or_default()
    };
}

/// Loads what was asked for and what `scope` allows. `semester` is a part of a semester name
/// (e.g. "2023/2024 Ganjil"); without it the grades of the latest semester are returned
pub async fn load(
    db: &DatabaseConnection,
    student_id: Uuid,
    scope: &DataScope,
    wanted: Wanted,
    semester: Option<&str>,
) -> Result<StudentData, StatusError> {
    let student = students::Entity::find_by_id(student_id)
        .filter(students::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

    let mut data = StudentData::default();
    let mut gate = |asked: bool, allowed: bool, label: &'static str| -> bool {
        if asked && !allowed {
            data.withheld.push(label);
        }
        asked && allowed
    };
    let (profile, academic, finance, sensitive) = (
        gate(wanted.profile, scope.profile, "profile"),
        gate(wanted.academic, scope.academic, "academic"),
        gate(wanted.finance, scope.finance, "finance"),
        gate(wanted.sensitive, scope.sensitive, "sensitive"),
    );

    if profile {
        data.profile = Some(load_profile(db, &student).await?);
    }
    if academic {
        data.academic = Some(load_academic(db, &student, scope.teach_ids.as_deref(), semester).await?);
    }
    if finance {
        data.finance = Some(load_finance(db, &student).await?);
    }
    if sensitive {
        data.sensitive = Some(load_sensitive(db, &student).await?);
    }
    Ok(data)
}

async fn load_profile(db: &DatabaseConnection, s: &students::Model) -> Result<Profile, StatusError> {
    let counsellor_rows = crate::models::academic::student::adviser::counsellors::Entity::find()
        .filter(crate::models::academic::student::adviser::counsellors::Column::StudentId.eq(s.id))
        .filter(crate::models::academic::student::adviser::counsellors::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;
    let mut counsellors = Vec::new();
    for row in counsellor_rows {
        let lecturer = crate::models::academic::lecturer::master::lecturers::Entity::find_by_id(row.lecturer_id)
            .one(db)
            .await
            .map_err(internal)?;
        if let Some(lecturer) = lecturer {
            let person = individual::Entity::find_by_id(lecturer.individual_id).one(db).await.map_err(internal)?;
            if let Some(person) = person {
                counsellors.push(person.name);
            }
        }
    }
    Ok(Profile {
        code: s.code.clone(),
        name: s.name.clone(),
        unit: name_of!(db, units::Entity, s.unit_id, |m| m.name.unwrap_or_default()),
        concentration: name_of!(db, concentrations::Entity, s.concentration_id, |m| m.name),
        status: name_of!(db, statuses::Entity, s.status_id, |m| m.name),
        registered: s.registered.to_string(),
        counsellors,
    })
}

async fn load_academic(
    db: &DatabaseConnection,
    s: &students::Model,
    teach_ids: Option<&[Uuid]>,
    semester: Option<&str>,
) -> Result<Academic, StatusError> {
    let enrolments = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(s.id))
        .filter(student_activities::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;

    let activity_ids: Vec<Uuid> = enrolments.iter().map(|e| e.unit_activity_id).collect();
    let activity_rows = activities::Entity::find()
        .filter(activities::Column::Id.is_in(activity_ids))
        .all(db)
        .await
        .map_err(internal)?;
    let activity_by_id: HashMap<Uuid, &activities::Model> = activity_rows.iter().map(|a| (a.id, a)).collect();

    // Oldest first, by the semester's start date
    let mut ordered: Vec<&student_activities::Model> = enrolments.iter().collect();
    ordered.sort_by_key(|e| activity_by_id.get(&e.unit_activity_id).and_then(|a| a.start_date));
    let semester_name = |e: &student_activities::Model| -> String {
        e.name
            .clone()
            .filter(|n| !n.is_empty())
            .or_else(|| activity_by_id.get(&e.unit_activity_id).map(|a| a.name.clone()))
            .unwrap_or_default()
    };

    // Which semester the grades are for: the one the question names, else the latest
    let chosen = match semester.map(str::trim).filter(|q| !q.is_empty()) {
        Some(q) => ordered.iter().rev().find(|e| semester_name(e).to_lowercase().contains(&q.to_lowercase())).copied(),
        None => ordered.last().copied(),
    };

    let mut grade_rows = Vec::new();
    if let Some(chosen) = chosen {
        let mut query = detail_activities::Entity::find()
            .filter(detail_activities::Column::ActivityId.eq(chosen.id))
            .filter(detail_activities::Column::DeletedAt.is_null())
            .order_by_asc(detail_activities::Column::CuriculumDetailSequence);
        if let Some(teach_ids) = teach_ids {
            query = query.filter(detail_activities::Column::TeachId.is_in(teach_ids.to_vec()));
        }
        for d in query.all(db).await.map_err(internal)? {
            let course = courses::Entity::find_by_id(d.course_id).one(db).await.map_err(internal)?;
            let letter = match d.grade_id {
                Some(id) => grades::Entity::find_by_id(id).one(db).await.map_err(internal)?.and_then(|g| g.alphabet_code),
                None => None,
            };
            grade_rows.push(Grade {
                course_code: course.as_ref().map(|c| c.code.clone()).unwrap_or_default(),
                course: course.map(|c| c.name).unwrap_or_default(),
                credit: d.credit,
                mark: d.mark,
                letter,
            });
        }
    }

    // A lecturer who only teaches the student sees those classes' grades, never the whole record
    if teach_ids.is_some() {
        return Ok(Academic {
            semesters: vec![],
            latest_cumulative_index: None,
            latest_cumulative_credit: None,
            grades_semester: chosen.map(semester_name),
            grades: grade_rows,
            final_assignment: vec![],
        });
    }

    let semesters: Vec<Semester> = ordered
        .iter()
        .map(|e| Semester {
            name: semester_name(e),
            index: e.cumulative_index,
            credit: e.total_credit,
            cumulative_index: e.grand_cumulative_index,
            cumulative_credit: e.grand_total_credit,
        })
        .collect();

    let theses = submissions::Entity::find()
        .filter(submissions::Column::StudentId.eq(s.id))
        .filter(submissions::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;

    Ok(Academic {
        latest_cumulative_index: semesters.last().map(|x| x.cumulative_index),
        latest_cumulative_credit: semesters.last().and_then(|x| x.cumulative_credit),
        semesters,
        grades_semester: chosen.map(semester_name),
        grades: grade_rows,
        final_assignment: theses.into_iter().map(|t| Thesis { title: t.title, taken: t.is_taken.is_some() }).collect(),
    })
}

async fn load_finance(db: &DatabaseConnection, s: &students::Model) -> Result<Finance, StatusError> {
    let category = match s.finance_id {
        Some(id) => finances::Entity::find_by_id(id).one(db).await.map_err(internal)?.map(|f| f.name),
        None => None,
    };
    let enrolments = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(s.id))
        .filter(student_activities::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;
    let mut per_semester = Vec::new();
    for e in enrolments {
        let name = match e.name.clone().filter(|n| !n.is_empty()) {
            Some(n) => n,
            None => name_of!(db, activities::Entity, e.unit_activity_id, |m| m.name),
        };
        per_semester.push(FeePerSemester { semester: name, fee: e.finance_fee });
    }
    Ok(Finance { category, fee: s.finance_fee, per_semester })
}

async fn load_sensitive(db: &DatabaseConnection, s: &students::Model) -> Result<Sensitive, StatusError> {
    let person = individual::Entity::find_by_id(s.individual_id)
        .filter(individual::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Personal data not found"))?;

    let residence_rows = residences::Entity::find()
        .filter(residences::Column::ResidenceableType.eq(owner_types::INDIVIDUAL))
        .filter(residences::Column::ResidenceableId.eq(person.id))
        .filter(residences::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;
    let mut addresses = Vec::new();
    for r in residence_rows {
        let mut parts = vec![format!("{} RT {}/RW {}", r.street, r.neighborhood_association, r.citizens_association)];
        if let Some(id) = r.village_id {
            parts.push(name_of!(db, crate::models::location::villages::Entity, id, |m| m.name));
        }
        if let Some(id) = r.sub_district_id {
            parts.push(name_of!(db, crate::models::location::sub_districts::Entity, id, |m| m.name));
        }
        if let Some(id) = r.regency_id {
            parts.push(name_of!(db, crate::models::location::regencies::Entity, id, |m| m.name.unwrap_or_default()));
        }
        if let Some(id) = r.province_id {
            parts.push(name_of!(db, crate::models::location::provinces::Entity, id, |m| m.name.unwrap_or_default()));
        }
        addresses.push(parts.into_iter().filter(|p| !p.is_empty()).collect::<Vec<_>>().join(", "));
    }

    let phone_numbers = phones::Entity::find()
        .filter(phones::Column::PhoneableType.eq(owner_types::INDIVIDUAL))
        .filter(phones::Column::PhoneableId.eq(person.id))
        .filter(phones::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?
        .into_iter()
        .map(|p| p.phone_number)
        .collect();
    let email_addresses = electronic_mails::Entity::find()
        .filter(electronic_mails::Column::ElectronicMailableType.eq(owner_types::INDIVIDUAL))
        .filter(electronic_mails::Column::ElectronicMailableId.eq(person.id))
        .filter(electronic_mails::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?
        .into_iter()
        .map(|e| e.email_address)
        .collect();

    let card = family_card::Entity::find()
        .filter(family_card::Column::IndividualId.eq(person.id))
        .filter(family_card::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?;
    let mut relatives = Vec::new();
    if let Some(card) = &card {
        let members = family_card_member::Entity::find()
            .filter(family_card_member::Column::FamilyCardId.eq(card.id))
            .filter(family_card_member::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(internal)?;
        for m in members {
            let relative = individual::Entity::find_by_id(m.relative_id).one(db).await.map_err(internal)?;
            let Some(relative) = relative.filter(|r| r.id != person.id) else { continue };
            relatives.push(Relative {
                name: relative.name,
                relation: name_of!(db, relative_type::Entity, m.relative_type_id, |t| t.name),
            });
        }
    }

    Ok(Sensitive {
        identity_number: person.code.clone(),
        gender: name_of!(db, gender::Entity, person.gender_id, |m| m.name),
        religion: name_of!(db, religion::Entity, person.religion_id, |m| m.name),
        birth_place: person.birth_place.clone(),
        birth_date: person.birth_date.to_string(),
        addresses,
        phones: phone_numbers,
        emails: email_addresses,
        family_card_number: card.and_then(|c| c.code),
        relatives,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn nothing_asked_is_empty() {
        assert!(Wanted::default().is_empty());
        assert!(!Wanted::all().is_empty());
    }
}
