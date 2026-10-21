use chrono::Utc;
use indicatif::ProgressBar;
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use uuid::Uuid;

use crate::tasks::Task;
use crate::models::academic::student::master::students;
use crate::models::auth::user;
use crate::models::auth::role;
use crate::models::institution::reference::position_type;

const CANDIDATE_ROLE_NAME: &str = "Kandidat Mahasiswa";

pub struct SyncStudentRolesTask;

#[async_trait]
impl Task for SyncStudentRolesTask {
    fn name(&self) -> &str {
        "utility:sync-student-roles"
    }

    fn description(&self) -> &str {
        "Synchronizes student roles into the auth.roles table"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("==> Starting Student Roles Synchronization...");
        
        let show_progress = args.contains(&"--progress".to_string()) || args.contains(&"-p".to_string());
        
        // Find position type "Mahasiswa"
        let pt = position_type::Entity::find()
            .filter(position_type::Column::Name.eq("Mahasiswa"))
            .filter(position_type::Column::DeletedAt.is_null())
            .one(db)
            .await?;
            
        let pt_model = if let Some(p) = pt {
            p
        } else {
            println!("Error: Position type 'Mahasiswa' not found!");
            return Ok(());
        };
        
        let students = students::Entity::find()
            .filter(students::Column::DeletedAt.is_null())
            .all(db)
            .await?;
            
        let pb = if show_progress {
            let pb = ProgressBar::new(students.len() as u64);
            Some(pb)
        } else {
            None
        };
        
        let now = Utc::now().naive_utc();
        let mut created_count = 0;
        let mut existing_count = 0;
        let mut no_user_count = 0;
        let mut switched_count = 0;
        // Placeholder individual shared by many unlinked users; never a real match.
        let nil_individual = Uuid::nil();
        // roleable_type = "App\\Models\\Academic\\Student\\Master\\Student"
        let roleable_type_str = "App\\Models\\Academic\\Student\\Master\\Student";

        for student in students {
            // An individual can own several active users, so sync every one of them.
            let users = if student.individual_id == nil_individual {
                Vec::new()
            } else {
                user::Entity::find()
                    .filter(user::Column::IndividualId.eq(student.individual_id))
                    .filter(user::Column::DeletedAt.is_null())
                    .all(db)
                    .await?
            };

            if users.is_empty() {
                no_user_count += 1;
            }

            for u in users {
                let existing_role = role::Entity::find()
                    .filter(role::Column::RoleableType.eq(roleable_type_str))
                    .filter(role::Column::RoleableId.eq(student.id))
                    .filter(role::Column::UserId.eq(u.id))
                    .filter(role::Column::PositionTypeId.eq(pt_model.id))
                    .filter(role::Column::DeletedAt.is_null())
                    .one(db)
                    .await?;

                let student_role_id = match existing_role {
                    Some(role) => {
                        existing_count += 1;
                        role.id
                    }
                    None => {
                        let id = Uuid::new_v4();
                        let active_model = role::ActiveModel {
                            id: Set(id),
                            name: Set(pt_model.name.clone()),
                            user_id: Set(Some(u.id)),
                            position_type_id: Set(Some(pt_model.id)),
                            roleable_id: Set(Some(student.id)),
                            roleable_type: Set(Some(roleable_type_str.to_string())),
                            created_at: Set(now),
                            updated_at: Set(now),
                            deleted_at: Set(None),
                            sync_at: Set(Some(now)),
                            created_by: Set(None),
                            updated_by: Set(None),
                        };
                        active_model.insert(db).await?;
                        created_count += 1;
                        id
                    }
                };

                // Only replace an empty, dead or candidate current role; keep any other deliberate choice.
                let current_role = match u.current_role_id {
                    Some(id) => role::Entity::find_by_id(id).one(db).await?,
                    None => None,
                };
                let should_switch = match &current_role {
                    None => true,
                    Some(r) => r.deleted_at.is_some() || r.name == CANDIDATE_ROLE_NAME,
                };
                if should_switch && u.current_role_id != Some(student_role_id) {
                    let mut user_active: user::ActiveModel = u.into();
                    user_active.current_role_id = Set(Some(student_role_id));
                    user_active.updated_at = Set(now);
                    user_active.update(db).await?;
                    switched_count += 1;
                }
            }

            if let Some(p) = &pb {
                p.inc(1);
            }
        }
        
        if let Some(p) = &pb {
            p.finish_with_message("Done");
        }
        
        println!("==> Student Roles Sync Completed!");
        println!("    Created: {}, Already had role: {}, Current role switched: {}, Student without user: {}", created_count, existing_count, switched_count, no_user_count);

        Ok(())
    }
}
