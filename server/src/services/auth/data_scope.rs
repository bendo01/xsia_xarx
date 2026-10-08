use std::collections::HashSet;

use chrono::Utc;
use salvo::prelude::*;
use sea_orm::sea_query::{Query, SelectStatement, UnionType};
use sea_orm::{ColumnTrait, Condition, ConnectionTrait, EntityTrait, QueryFilter, Select};
use uuid::Uuid;

use crate::middleware::rbac::is_administrator;
use crate::models::academic::campaign::transaction::{class_codes, teach_lecturers, teaches};
use crate::models::academic::student::adviser::{counsellors, decrees};
use crate::models::academic::student::campaign::{
    convertions, detail_activities, detail_activity_evaluation_components, student_activities,
};
use crate::models::academic::student::final_assignment::transaction::{
    advisers, evaluation_details, evaluation_summaries, final_assignment_decrees, prerequisites, schedules,
    submissions,
};
use crate::models::academic::student::master::{images, students};
use crate::models::auth::role;
use crate::models::institution::master::{staffes, units};
use crate::models::institution::reference::unit_types;
use crate::services::auth::staff_role::STAFF_ROLEABLE_TYPE;

const STUDENT_ROLEABLE_TYPE: &str = "App\\Models\\Academic\\Student\\Master\\Student";
const LECTURER_ROLEABLE_TYPE: &str = "App\\Models\\Academic\\Lecturer\\Master\\Lecturer";

// unit_types.code
const UNIT_TYPE_FACULTY: i32 = 4;
const UNIT_TYPE_STUDY_PROGRAM: i32 = 5;
const UNIT_TYPE_DEPARTMENT: i32 = 6;

/// Rows the active role may see. Route permissions decide *which endpoints* a role can call;
/// this decides *which records* those endpoints return.
#[derive(Debug, Clone)]
pub enum DataScope {
    /// Administrator
    All,
    /// Staff: study program / department staff get their own unit, faculty staff their unit and
    /// every unit below it, everyone else (rectorate, bureaus, foundation...) every unit of their institution.
    /// Empty means nothing.
    Units(HashSet<Uuid>),
    /// Student role: only their own records
    Student(Uuid),
    /// Lecturer role: students in classes they teach (those classes only), plus every record of
    /// students they advise (academic adviser / final assignment adviser)
    Lecturer(Uuid),
}

/// An entity whose rows belong to students (or units) and can be filtered by `DataScope`
pub trait ScopedEntity: EntityTrait {
    fn id_column() -> Self::Column;
    /// Condition on this entity's rows; `None` means unrestricted
    fn scope_condition(scope: &DataScope) -> Option<Condition>;
}

impl DataScope {
    /// Scope of the active role put in the depot by `RbacGuard`. No active role means no rows.
    pub async fn resolve<C: ConnectionTrait>(db: &C, depot: &Depot) -> Result<Self, StatusError> {
        let Ok(active_role) = depot.get::<role::Model>("active_role") else {
            return Ok(DataScope::Units(HashSet::new()));
        };

        if is_administrator(active_role) {
            return Ok(DataScope::All);
        }

        let Some(roleable_id) = active_role.roleable_id else {
            return Ok(DataScope::Units(HashSet::new()));
        };

        match active_role.roleable_type.as_deref() {
            Some(STAFF_ROLEABLE_TYPE) => staff_scope(db, roleable_id).await.map_err(internal),
            Some(STUDENT_ROLEABLE_TYPE) => Ok(DataScope::Student(roleable_id)),
            Some(LECTURER_ROLEABLE_TYPE) => Ok(DataScope::Lecturer(roleable_id)),
            _ => Ok(DataScope::Units(HashSet::new())),
        }
    }

    /// Whether records may be created in / moved to this unit
    pub fn allows_unit(&self, unit_id: Uuid) -> bool {
        match self {
            DataScope::All => true,
            DataScope::Units(unit_ids) => unit_ids.contains(&unit_id),
            DataScope::Student(_) | DataScope::Lecturer(_) => false,
        }
    }

    pub fn apply<E: ScopedEntity>(&self, select: Select<E>) -> Select<E> {
        match E::scope_condition(self) {
            Some(condition) => select.filter(condition),
            None => select,
        }
    }

    /// Whether the row exists and is inside the scope.
    /// Use inside the write transaction to reject creates / updates that land outside the scope.
    pub async fn is_visible<E: ScopedEntity, C: ConnectionTrait>(&self, db: &C, id: Uuid) -> Result<bool, StatusError> {
        let row = self
            .apply(E::find().filter(E::id_column().eq(id)))
            .one(db)
            .await
            .map_err(internal)?;
        Ok(row.is_some())
    }

    pub async fn ensure_visible<E: ScopedEntity, C: ConnectionTrait>(&self, db: &C, id: Uuid) -> Result<(), StatusError> {
        if self.is_visible::<E, C>(db, id).await? {
            Ok(())
        } else {
            Err(StatusError::forbidden().brief("The record would be outside your data scope"))
        }
    }

    /// Ids of students this scope may see; `None` means unrestricted
    fn student_ids(&self) -> Option<SelectStatement> {
        match self {
            DataScope::All => None,
            DataScope::Units(unit_ids) => Some(
                Query::select()
                    .column((students::Entity, students::Column::Id))
                    .from(students::Entity)
                    .and_where(students::Column::UnitId.is_in(unit_ids.iter().copied()))
                    .to_owned(),
            ),
            DataScope::Student(student_id) => Some(
                Query::select()
                    .column((students::Entity, students::Column::Id))
                    .from(students::Entity)
                    .and_where(students::Column::Id.eq(*student_id))
                    .to_owned(),
            ),
            DataScope::Lecturer(lecturer_id) => {
                let mut taught = Query::select()
                    .column((student_activities::Entity, student_activities::Column::StudentId))
                    .from(student_activities::Entity)
                    .and_where(student_activities::Column::Id.in_subquery(
                        Query::select()
                            .column((detail_activities::Entity, detail_activities::Column::ActivityId))
                            .from(detail_activities::Entity)
                            .and_where(detail_activities::Column::DeletedAt.is_null())
                            .and_where(detail_activities::Column::TeachId.in_subquery(lecturer_teach_ids(*lecturer_id)))
                            .to_owned(),
                    ))
                    .to_owned();
                Some(taught.union(UnionType::Distinct, advisee_ids(*lecturer_id)).to_owned())
            }
        }
    }

    /// Condition on a column holding a student id
    fn student_column<C: ColumnTrait>(&self, column: C) -> Option<Condition> {
        match self {
            DataScope::Student(student_id) => Some(Condition::all().add(column.eq(*student_id))),
            _ => self.student_ids().map(|ids| Condition::all().add(column.in_subquery(ids))),
        }
    }

    /// Ids of detail activities (KRS rows) this scope may see; `None` means unrestricted
    fn detail_activity_ids(&self) -> Option<SelectStatement> {
        let condition = detail_activities::Entity::scope_condition(self)?;
        Some(
            Query::select()
                .column((detail_activities::Entity, detail_activities::Column::Id))
                .from(detail_activities::Entity)
                .cond_where(condition)
                .to_owned(),
        )
    }

    fn detail_activity_column<C: ColumnTrait>(&self, column: C) -> Option<Condition> {
        self.detail_activity_ids().map(|ids| Condition::all().add(column.in_subquery(ids)))
    }
}

/// Classes the lecturer teaches
fn lecturer_teach_ids(lecturer_id: Uuid) -> SelectStatement {
    Query::select()
        .column((teach_lecturers::Entity, teach_lecturers::Column::TeachId))
        .from(teach_lecturers::Entity)
        .and_where(teach_lecturers::Column::LecturerId.eq(lecturer_id))
        .and_where(teach_lecturers::Column::DeletedAt.is_null())
        .to_owned()
}

/// Students the lecturer advises: academic adviser (counsellors) or final assignment adviser
fn advisee_ids(lecturer_id: Uuid) -> SelectStatement {
    let final_assignment = Query::select()
        .column((student_activities::Entity, student_activities::Column::StudentId))
        .from(student_activities::Entity)
        .and_where(student_activities::Column::Id.in_subquery(
            Query::select()
                .column((detail_activities::Entity, detail_activities::Column::ActivityId))
                .from(detail_activities::Entity)
                .and_where(detail_activities::Column::Id.in_subquery(
                    Query::select()
                        .column((advisers::Entity, advisers::Column::DetailActivityId))
                        .from(advisers::Entity)
                        .and_where(advisers::Column::LecturerId.eq(lecturer_id))
                        .and_where(advisers::Column::DeletedAt.is_null())
                        .to_owned(),
                ))
                .to_owned(),
        ))
        .to_owned();

    Query::select()
        .column((counsellors::Entity, counsellors::Column::StudentId))
        .from(counsellors::Entity)
        .and_where(counsellors::Column::LecturerId.eq(lecturer_id))
        .and_where(counsellors::Column::DeletedAt.is_null())
        .union(UnionType::Distinct, final_assignment)
        .to_owned()
}

fn internal(e: sea_orm::DbErr) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

async fn staff_scope<C: ConnectionTrait>(db: &C, staff_id: Uuid) -> Result<DataScope, sea_orm::DbErr> {
    let today = Utc::now().date_naive();
    let staff = staffes::Entity::find_by_id(staff_id)
        .filter(staffes::Column::DeletedAt.is_null())
        .one(db)
        .await?
        .filter(|s| s.end_date.is_none_or(|end| end >= today));

    let Some(staff) = staff else {
        return Ok(DataScope::Units(HashSet::new()));
    };

    let Some(unit) = units::Entity::find_by_id(staff.unit_id)
        .filter(units::Column::DeletedAt.is_null())
        .one(db)
        .await?
    else {
        return Ok(DataScope::Units(HashSet::new()));
    };

    let unit_type_code = unit_types::Entity::find_by_id(unit.unit_type_id)
        .one(db)
        .await?
        .map(|t| t.code);

    let unit_ids = match unit_type_code {
        Some(UNIT_TYPE_STUDY_PROGRAM | UNIT_TYPE_DEPARTMENT) => HashSet::from([unit.id]),
        Some(UNIT_TYPE_FACULTY) => unit_with_descendants(db, unit.id).await?,
        _ => units::Entity::find()
            .filter(units::Column::InstitutionId.eq(unit.institution_id))
            .filter(units::Column::DeletedAt.is_null())
            .all(db)
            .await?
            .into_iter()
            .map(|u| u.id)
            .collect(),
    };

    Ok(DataScope::Units(unit_ids))
}

/// The unit and every unit below it, following `parent_id` (lft/rght are not maintained)
async fn unit_with_descendants<C: ConnectionTrait>(db: &C, root_id: Uuid) -> Result<HashSet<Uuid>, sea_orm::DbErr> {
    let mut all = HashSet::from([root_id]);
    let mut frontier = vec![root_id];
    while !frontier.is_empty() {
        let children: Vec<Uuid> = units::Entity::find()
            .filter(units::Column::ParentId.is_in(frontier))
            .filter(units::Column::DeletedAt.is_null())
            .all(db)
            .await?
            .into_iter()
            .map(|u| u.id)
            .filter(|id| all.insert(*id))
            .collect();
        frontier = children;
    }
    Ok(all)
}

// ── Per-entity rules ─────────────────────────────────────────────────────────

impl ScopedEntity for students::Entity {
    fn id_column() -> Self::Column {
        students::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        match scope {
            DataScope::Units(unit_ids) => Some(Condition::all().add(students::Column::UnitId.is_in(unit_ids.iter().copied()))),
            _ => scope.student_column(students::Column::Id),
        }
    }
}

/// Entities with a direct `student_id` column
macro_rules! scoped_by_student {
    ($($module:ident),+ $(,)?) => {$(
        impl ScopedEntity for $module::Entity {
            fn id_column() -> Self::Column {
                $module::Column::Id
            }
            fn scope_condition(scope: &DataScope) -> Option<Condition> {
                scope.student_column($module::Column::StudentId)
            }
        }
    )+};
}

scoped_by_student!(student_activities, convertions, images, counsellors, submissions);

impl ScopedEntity for detail_activities::Entity {
    fn id_column() -> Self::Column {
        detail_activities::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        match scope {
            // Taught classes only, plus every course of an advisee
            DataScope::Lecturer(lecturer_id) => Some(
                Condition::any()
                    .add(detail_activities::Column::TeachId.in_subquery(lecturer_teach_ids(*lecturer_id)))
                    .add(detail_activities::Column::ActivityId.in_subquery(
                        Query::select()
                            .column((student_activities::Entity, student_activities::Column::Id))
                            .from(student_activities::Entity)
                            .and_where(student_activities::Column::StudentId.in_subquery(advisee_ids(*lecturer_id)))
                            .to_owned(),
                    )),
            ),
            _ => {
                let student_condition = student_activities::Entity::scope_condition(scope)?;
                Some(Condition::all().add(
                    detail_activities::Column::ActivityId.in_subquery(
                        Query::select()
                            .column((student_activities::Entity, student_activities::Column::Id))
                            .from(student_activities::Entity)
                            .cond_where(student_condition)
                            .to_owned(),
                    ),
                ))
            }
        }
    }
}

/// Entities with a `detail_activity_id` column
macro_rules! scoped_by_detail_activity {
    ($($module:ident),+ $(,)?) => {$(
        impl ScopedEntity for $module::Entity {
            fn id_column() -> Self::Column {
                $module::Column::Id
            }
            fn scope_condition(scope: &DataScope) -> Option<Condition> {
                scope.detail_activity_column($module::Column::DetailActivityId)
            }
        }
    )+};
}

scoped_by_detail_activity!(detail_activity_evaluation_components, advisers, evaluation_summaries, schedules);

impl ScopedEntity for prerequisites::Entity {
    fn id_column() -> Self::Column {
        prerequisites::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        let submission_condition = submissions::Entity::scope_condition(scope)?;
        Some(Condition::all().add(
            prerequisites::Column::SubmissionId.in_subquery(
                Query::select()
                    .column((submissions::Entity, submissions::Column::Id))
                    .from(submissions::Entity)
                    .cond_where(submission_condition)
                    .to_owned(),
            ),
        ))
    }
}

impl ScopedEntity for evaluation_details::Entity {
    fn id_column() -> Self::Column {
        evaluation_details::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        let summary_condition = evaluation_summaries::Entity::scope_condition(scope)?;
        Some(Condition::all().add(
            evaluation_details::Column::EvaluationSummaryId.in_subquery(
                Query::select()
                    .column((evaluation_summaries::Entity, evaluation_summaries::Column::Id))
                    .from(evaluation_summaries::Entity)
                    .cond_where(summary_condition)
                    .to_owned(),
            ),
        ))
    }
}

/// Academic adviser decrees: staff by unit, students / lecturers through their counsellor rows
impl ScopedEntity for decrees::Entity {
    fn id_column() -> Self::Column {
        decrees::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        match scope {
            DataScope::All => None,
            DataScope::Units(unit_ids) => Some(Condition::all().add(decrees::Column::UnitId.is_in(unit_ids.iter().copied()))),
            DataScope::Student(_) | DataScope::Lecturer(_) => {
                let counsellor_condition = counsellors::Entity::scope_condition(scope)?;
                Some(Condition::all().add(
                    decrees::Column::Id.in_subquery(
                        Query::select()
                            .column((counsellors::Entity, counsellors::Column::DecreeId))
                            .from(counsellors::Entity)
                            .cond_where(Condition::all().add(counsellors::Column::DeletedAt.is_null()).add(counsellor_condition))
                            .to_owned(),
                    ),
                ))
            }
        }
    }
}

/// Final assignment decrees: staff by unit, students / lecturers through their submissions
impl ScopedEntity for final_assignment_decrees::Entity {
    fn id_column() -> Self::Column {
        final_assignment_decrees::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        match scope {
            DataScope::All => None,
            DataScope::Units(unit_ids) => Some(
                Condition::all().add(final_assignment_decrees::Column::UnitId.is_in(unit_ids.iter().copied())),
            ),
            DataScope::Student(_) | DataScope::Lecturer(_) => {
                let submission_condition = submissions::Entity::scope_condition(scope)?;
                Some(Condition::all().add(
                    final_assignment_decrees::Column::Id.in_subquery(
                        Query::select()
                            .column((submissions::Entity, submissions::Column::FinalAssignmentDecreeId))
                            .from(submissions::Entity)
                            .cond_where(Condition::all().add(submissions::Column::DeletedAt.is_null()).add(submission_condition))
                            .to_owned(),
                    ),
                ))
            }
        }
    }
}

/// Classes: staff by the class code's unit, lecturers the classes they teach, students the classes they take
impl ScopedEntity for teaches::Entity {
    fn id_column() -> Self::Column {
        teaches::Column::Id
    }
    fn scope_condition(scope: &DataScope) -> Option<Condition> {
        match scope {
            DataScope::All => None,
            DataScope::Units(unit_ids) => Some(Condition::all().add(
                teaches::Column::ClassCodeId.in_subquery(
                    Query::select()
                        .column((class_codes::Entity, class_codes::Column::Id))
                        .from(class_codes::Entity)
                        .and_where(class_codes::Column::UnitId.is_in(unit_ids.iter().copied()))
                        .to_owned(),
                ),
            )),
            DataScope::Lecturer(lecturer_id) => {
                Some(Condition::all().add(teaches::Column::Id.in_subquery(lecturer_teach_ids(*lecturer_id))))
            }
            DataScope::Student(_) => {
                let detail_condition = detail_activities::Entity::scope_condition(scope)?;
                Some(Condition::all().add(
                    teaches::Column::Id.in_subquery(
                        Query::select()
                            .column((detail_activities::Entity, detail_activities::Column::TeachId))
                            .from(detail_activities::Entity)
                            .cond_where(Condition::all().add(detail_activities::Column::DeletedAt.is_null()).add(detail_condition))
                            .to_owned(),
                    ),
                ))
            }
        }
    }
}
