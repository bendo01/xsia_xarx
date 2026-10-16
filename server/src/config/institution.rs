use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter, QuerySelect};
use uuid::Uuid;

use super::ConfigResult;
use crate::models::feeder::akun::kredential;
use crate::models::institution::master::institutions;

/// The institution this installation serves: the one the stored Feeder
/// credential belongs to (set with `task utility:feeder-add-credential`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CurrentInstitution {
    pub id: Uuid,
    pub code: Option<String>,
}

impl CurrentInstitution {
    /// Loads the institution of the Feeder credential. Fails if no credential is
    /// stored, or if credentials exist for more than one institution.
    pub async fn load<C: ConnectionTrait>(db: &C) -> ConfigResult<Self> {
        let ids: Vec<Uuid> = kredential::Entity::find()
            .select_only()
            .column(kredential::Column::InstitutionId)
            .distinct()
            .filter(kredential::Column::DeletedAt.is_null())
            .limit(2)
            .into_tuple()
            .all(db)
            .await?;

        let id = match ids.as_slice() {
            [id] => *id,
            [] => {
                return Err("No Feeder credential is stored, so the current institution is unknown; \
                            run `task utility:feeder-add-credential`"
                    .into());
            }
            _ => {
                return Err("Feeder credentials exist for more than one institution, so the current \
                            institution is ambiguous; delete the ones that don't belong to this installation"
                    .into());
            }
        };

        let code: Option<String> = institutions::Entity::find_by_id(id)
            .select_only()
            .column(institutions::Column::Code)
            .into_tuple::<Option<String>>()
            .one(db)
            .await?
            .flatten();

        Ok(Self { id, code })
    }
}
