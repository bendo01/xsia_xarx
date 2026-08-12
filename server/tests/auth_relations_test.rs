use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models::auth::{permission, permission_role, role, user};

#[tokio::test]
async fn test_role_permission_relation() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Test querying roles with their permissions (HasMany via permission_role)
    let roles_with_permissions = role::Entity::find()
        .find_with_related(permission::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch roles with permissions");

    println!(
        "Fetched {} roles with permission relations.",
        roles_with_permissions.len()
    );

    // Test querying permission_role join table with role and permission
    let p_roles = permission_role::Entity::find()
        .find_also_related(role::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch permission_role relations with role");

    println!(
        "Fetched {} permission_role entries with role.",
        p_roles.len()
    );

    let p_permissions = permission_role::Entity::find()
        .find_also_related(permission::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch permission_role relations with permission");

    println!(
        "Fetched {} permission_role entries with permission.",
        p_permissions.len()
    );
}

#[tokio::test]
async fn test_user_role_relation() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Test querying users with their roles (HasMany)
    let users_with_roles = user::Entity::find()
        .find_with_related(role::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch users with roles");

    println!(
        "Fetched {} users with role relations.",
        users_with_roles.len()
    );

    // Test querying roles with their user (BelongsTo)
    let roles_with_user = role::Entity::find()
        .find_also_related(user::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch roles with user");

    println!(
        "Fetched {} role entries with user.",
        roles_with_user.len()
    );
}
