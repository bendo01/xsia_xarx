//! The single gate between the chatbot and a student's data.
//!
//! Who may see which student is decided here and nowhere else: the question text, the model and the
//! client never choose the student or the categories. The decision itself ([`decide`]) is a pure function
//! over facts gathered from the database ([`authorize_student`]), so every rule is unit-tested without one.

use salvo::http::StatusError;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QuerySelect};
use uuid::Uuid;

use crate::middleware::rbac::{INSTITUTION_WIDE_POSITION_TYPE_IDS, UNIT_SCOPED_POSITION_TYPE_IDS, is_administrator};
use crate::models::academic::campaign::transaction::teach_lecturers;
use crate::models::academic::student::adviser::counsellors;
use crate::models::academic::student::campaign::{detail_activities, student_activities};
use crate::models::academic::student::master::students;
use crate::models::auth::role;
use crate::models::institution::master::staffes;

const STUDENT_ROLEABLE_TYPE: &str = "App\\Models\\Academic\\Student\\Master\\Student";
const LECTURER_ROLEABLE_TYPE: &str = "App\\Models\\Academic\\Lecturer\\Master\\Lecturer";
const STAFF_ROLEABLE_TYPE: &str = "App\\Models\\Institution\\Master\\Staff";

/// The categories of a student's data the caller may read, and for classes the classes they are limited to
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DataScope {
    pub profile: bool,
    pub academic: bool,
    pub finance: bool,
    pub sensitive: bool,
    /// `Some` limits academic data to these classes (`teaches.id`), e.g. a lecturer who only teaches the student
    pub teach_ids: Option<Vec<Uuid>>,
}

impl DataScope {
    fn full() -> Self {
        Self { profile: true, academic: true, finance: true, sensitive: true, teach_ids: None }
    }

    fn classes_only(teach_ids: Vec<Uuid>) -> Self {
        Self { profile: false, academic: true, finance: false, sensitive: false, teach_ids: Some(teach_ids) }
    }
}

/// Who is asking, resolved from the active role
#[derive(Clone, Debug, PartialEq, Eq)]
pub enum Actor {
    Administrator,
    Student(Uuid),
    Lecturer(Uuid),
    Staff { unit_id: Uuid, position_type_id: Option<Uuid> },
}

/// Facts about the asked student that the rules need; the lecturer facts are only gathered for lecturers
#[derive(Clone, Debug, Default, PartialEq, Eq)]
pub struct Relation {
    pub student_id: Uuid,
    pub student_unit_id: Uuid,
    pub is_counsellee: bool,
    /// Classes the lecturer teaches in which the student is enrolled
    pub shared_teach_ids: Vec<Uuid>,
}

/// The rules. `None` means access is denied
pub fn decide(actor: &Actor, relation: &Relation) -> Option<DataScope> {
    match actor {
        Actor::Administrator => Some(DataScope::full()),
        Actor::Student(own_id) => (*own_id == relation.student_id).then(DataScope::full),
        Actor::Lecturer(_) => {
            if relation.is_counsellee {
                Some(DataScope::full())
            } else if !relation.shared_teach_ids.is_empty() {
                Some(DataScope::classes_only(relation.shared_teach_ids.clone()))
            } else {
                None
            }
        }
        Actor::Staff { unit_id, position_type_id } => {
            let position = (*position_type_id)?;
            if INSTITUTION_WIDE_POSITION_TYPE_IDS.contains(&position) {
                Some(DataScope::full())
            } else if UNIT_SCOPED_POSITION_TYPE_IDS.contains(&position) && *unit_id == relation.student_unit_id {
                Some(DataScope::full())
            } else {
                None
            }
        }
    }
}

fn forbidden() -> StatusError {
    StatusError::forbidden().brief("You are not allowed to see this student's data")
}

fn internal(e: impl std::fmt::Display) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

/// Resolves the active role to an [`Actor`]. A role that is not linked to a person gets nothing
pub async fn actor_of(db: &DatabaseConnection, active_role: &role::Model) -> Result<Actor, StatusError> {
    if is_administrator(active_role) {
        return Ok(Actor::Administrator);
    }
    let (Some(roleable_id), Some(roleable_type)) = (active_role.roleable_id, active_role.roleable_type.as_deref()) else {
        return Err(forbidden());
    };
    match roleable_type {
        STUDENT_ROLEABLE_TYPE => Ok(Actor::Student(roleable_id)),
        LECTURER_ROLEABLE_TYPE => Ok(Actor::Lecturer(roleable_id)),
        STAFF_ROLEABLE_TYPE => {
            let staff = staffes::Entity::find_by_id(roleable_id)
                .filter(staffes::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(internal)?
                .ok_or_else(forbidden)?;
            Ok(Actor::Staff {
                unit_id: staff.unit_id,
                position_type_id: active_role.position_type_id.or(staff.position_type_id),
            })
        }
        _ => Err(forbidden()),
    }
}

/// Decides whether `active_role` may read `requested` student and returns the student id with what may be read.
/// A student always gets their own record: `requested` is ignored for them, so a forged id changes nothing.
pub async fn authorize_student(
    db: &DatabaseConnection,
    active_role: &role::Model,
    requested: Option<Uuid>,
) -> Result<(Uuid, DataScope), StatusError> {
    let actor = actor_of(db, active_role).await?;
    let student_id = match (&actor, requested) {
        (Actor::Student(own_id), _) => *own_id,
        (_, Some(id)) => id,
        (_, None) => return Err(StatusError::bad_request().brief("Say which student you mean")),
    };

    let student = students::Entity::find_by_id(student_id)
        .filter(students::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        // Same answer as a refusal, so the chatbot cannot be used to probe which ids exist
        .ok_or_else(forbidden)?;

    let mut relation = Relation { student_id, student_unit_id: student.unit_id, ..Relation::default() };
    if let Actor::Lecturer(lecturer_id) = &actor {
        relation.is_counsellee = counsellors::Entity::find()
            .filter(counsellors::Column::LecturerId.eq(*lecturer_id))
            .filter(counsellors::Column::StudentId.eq(student_id))
            .filter(counsellors::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(internal)?
            .is_some();
        if !relation.is_counsellee {
            relation.shared_teach_ids = shared_classes(db, *lecturer_id, student_id).await?;
        }
    }

    let scope = decide(&actor, &relation).ok_or_else(forbidden)?;
    Ok((student_id, scope))
}

/// Classes (`teaches.id`) the lecturer teaches in which the student is enrolled.
/// Enrolment is `detail_activities.teach_id`, and `detail_activities.activity_id` is the student's `student_activities.id`.
async fn shared_classes(db: &DatabaseConnection, lecturer_id: Uuid, student_id: Uuid) -> Result<Vec<Uuid>, StatusError> {
    let taught: Vec<Uuid> = teach_lecturers::Entity::find()
        .filter(teach_lecturers::Column::LecturerId.eq(lecturer_id))
        .filter(teach_lecturers::Column::DeletedAt.is_null())
        .select_only()
        .column(teach_lecturers::Column::TeachId)
        .into_tuple()
        .all(db)
        .await
        .map_err(internal)?;
    if taught.is_empty() {
        return Ok(vec![]);
    }

    let activity_ids: Vec<Uuid> = student_activities::Entity::find()
        .filter(student_activities::Column::StudentId.eq(student_id))
        .filter(student_activities::Column::DeletedAt.is_null())
        .select_only()
        .column(student_activities::Column::Id)
        .into_tuple()
        .all(db)
        .await
        .map_err(internal)?;
    if activity_ids.is_empty() {
        return Ok(vec![]);
    }

    let enrolled: Vec<Option<Uuid>> = detail_activities::Entity::find()
        .filter(detail_activities::Column::ActivityId.is_in(activity_ids))
        .filter(detail_activities::Column::TeachId.is_in(taught))
        .filter(detail_activities::Column::DeletedAt.is_null())
        .select_only()
        .column(detail_activities::Column::TeachId)
        .distinct()
        .into_tuple()
        .all(db)
        .await
        .map_err(internal)?;
    Ok(enrolled.into_iter().flatten().collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    const REKTOR: Uuid = uuid::uuid!("e34401db-84ec-450b-bdba-6b9640fc3ae8");
    const KAPRODI: Uuid = uuid::uuid!("b3ad82b8-520b-4b77-8cca-b487bf77a91c");
    const STAFF_PRODI: Uuid = uuid::uuid!("72f230bc-0bb2-40ee-810c-dfa2a1e94503");

    fn relation(unit: Uuid) -> Relation {
        Relation { student_id: Uuid::from_u128(1), student_unit_id: unit, ..Relation::default() }
    }

    #[test]
    fn administrator_sees_everyone() {
        assert_eq!(decide(&Actor::Administrator, &relation(Uuid::from_u128(10))), Some(DataScope::full()));
    }

    #[test]
    fn student_sees_only_themselves() {
        let r = relation(Uuid::from_u128(10));
        assert!(decide(&Actor::Student(r.student_id), &r).is_some());
        assert!(decide(&Actor::Student(Uuid::from_u128(2)), &r).is_none());
    }

    #[test]
    fn lecturer_sees_counsellees_in_full() {
        let r = Relation { is_counsellee: true, ..relation(Uuid::from_u128(10)) };
        assert_eq!(decide(&Actor::Lecturer(Uuid::from_u128(5)), &r), Some(DataScope::full()));
    }

    #[test]
    fn lecturer_sees_only_class_grades_of_a_class_student() {
        let class = Uuid::from_u128(77);
        let r = Relation { shared_teach_ids: vec![class], ..relation(Uuid::from_u128(10)) };
        let scope = decide(&Actor::Lecturer(Uuid::from_u128(5)), &r).expect("allowed");
        assert!(scope.academic && !scope.profile && !scope.finance && !scope.sensitive);
        assert_eq!(scope.teach_ids, Some(vec![class]));
    }

    #[test]
    fn lecturer_without_any_link_is_refused() {
        assert!(decide(&Actor::Lecturer(Uuid::from_u128(5)), &relation(Uuid::from_u128(10))).is_none());
    }

    #[test]
    fn institution_wide_positions_see_every_unit() {
        let staff = Actor::Staff { unit_id: Uuid::from_u128(1), position_type_id: Some(REKTOR) };
        assert!(decide(&staff, &relation(Uuid::from_u128(99))).is_some());
    }

    #[test]
    fn program_head_is_limited_to_their_unit() {
        let unit = Uuid::from_u128(10);
        let head = Actor::Staff { unit_id: unit, position_type_id: Some(KAPRODI) };
        assert!(decide(&head, &relation(unit)).is_some());
        assert!(decide(&head, &relation(Uuid::from_u128(11))).is_none());
    }

    #[test]
    fn other_staff_positions_are_refused() {
        let unit = Uuid::from_u128(10);
        let staff = Actor::Staff { unit_id: unit, position_type_id: Some(STAFF_PRODI) };
        assert!(decide(&staff, &relation(unit)).is_none());
        assert!(decide(&Actor::Staff { unit_id: unit, position_type_id: None }, &relation(unit)).is_none());
    }
}
