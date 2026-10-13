//! Owner types for the polymorphic `*able_type` / `*able_id` columns on contact records
//! (phones, electronic mails, residences, websites).
//!
//! The values are model class names inherited from the original Laravel schema and must
//! match what is stored in the database exactly.

use std::borrow::Cow;

use validator::ValidationError;

pub const INDIVIDUAL: &str = "App\\Models\\Person\\Master\\Individual";
pub const INSTITUTION: &str = "App\\Models\\Institution\\Master\\Institution";
pub const UNIT: &str = "App\\Models\\Institution\\Master\\Unit";

/// Every owner type a contact record may belong to.
pub const ALL: [&str; 3] = [INDIVIDUAL, INSTITUTION, UNIT];

pub fn is_valid(owner_type: &str) -> bool {
    ALL.contains(&owner_type)
}

/// `validator` hook for request DTOs: `#[validate(custom(function = "..."))]`.
pub fn validate(owner_type: &str) -> Result<(), ValidationError> {
    if is_valid(owner_type) {
        return Ok(());
    }
    let mut error = ValidationError::new("invalid_owner_type");
    error.message = Some(Cow::Owned(format!(
        "owner type must be one of: {}",
        ALL.join(", ")
    )));
    Err(error)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn accepts_every_supported_owner_type() {
        for owner_type in ALL {
            assert!(validate(owner_type).is_ok(), "{owner_type} should be accepted");
        }
    }

    #[test]
    fn rejects_unknown_or_short_owner_types() {
        assert!(validate("Individual").is_err());
        assert!(validate("App\\Models\\Institution\\Master\\Staff").is_err());
        assert!(validate("").is_err());
    }

    #[test]
    fn linked_relations_join_on_owner_type() {
        use crate::models::contact::master::phones;
        use crate::models::institution::master::{institutions, units};
        use sea_orm::{DbBackend, EntityTrait, QueryTrait};

        // Contact → owner
        let sql = phones::Entity::find()
            .find_also_linked(phones::PhoneToInstitution)
            .build(DbBackend::Postgres)
            .to_string();
        assert!(sql.contains(r#""phones"."phoneable_id" = "r0"."id""#), "{sql}");
        assert!(sql.contains(r#""phones"."phoneable_type" = E'App\\Models\\Institution\\Master\\Institution'"#), "{sql}");

        // Owner → contacts
        let sql = units::Entity::find()
            .find_with_linked(units::UnitToPhone)
            .build(DbBackend::Postgres)
            .to_string();
        assert!(sql.contains(r#""phoneable_type" = E'App\\Models\\Institution\\Master\\Unit'"#), "{sql}");

        let sql = institutions::Entity::find()
            .find_with_linked(institutions::InstitutionToPhone)
            .build(DbBackend::Postgres)
            .to_string();
        assert!(sql.contains(r#""phoneable_type" = E'App\\Models\\Institution\\Master\\Institution'"#), "{sql}");
    }
}
