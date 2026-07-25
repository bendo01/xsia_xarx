use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models::auth::{permission, permission_user, user, user_position_type};
use xsia_xarx::models::institution::reference::position_type;

#[tokio::test]
async fn test_user_permission_relation() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Test querying users with their permissions (HasMany via permission_user)
    let users_with_permissions = user::Entity::find()
        .find_with_related(permission::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch users with permissions");

    println!(
        "Fetched {} users with permission relations.",
        users_with_permissions.len()
    );

    // Test querying permission_user join table with user and permission
    let p_users = permission_user::Entity::find()
        .find_also_related(user::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch permission_user relations with user");

    println!(
        "Fetched {} permission_user entries with user.",
        p_users.len()
    );

    let p_permissions = permission_user::Entity::find()
        .find_also_related(permission::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch permission_user relations with permission");

    println!(
        "Fetched {} permission_user entries with permission.",
        p_permissions.len()
    );
}

#[tokio::test]
async fn test_user_position_type_relation() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Test querying users with their position_types (HasMany via user_position_type)
    let users_with_positions = user::Entity::find()
        .find_with_related(position_type::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch users with position_types");

    println!(
        "Fetched {} users with position_type relations.",
        users_with_positions.len()
    );

    // Test querying user_position_type join table with user
    let user_positions = user_position_type::Entity::find()
        .find_also_related(user::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch user_position_type entries with user");

    println!(
        "Fetched {} user_position_type entries with user.",
        user_positions.len()
    );

    // Test querying user_position_type join table with position_type
    let user_positions_with_pt = user_position_type::Entity::find()
        .find_also_related(position_type::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch user_position_type entries with position_type");

    println!(
        "Fetched {} user_position_type entries with position_type.",
        user_positions_with_pt.len()
    );
}

#[tokio::test]
async fn test_position_type_users_relation() {
    let db = connect_db()
        .await
        .expect("Failed to connect to the database");

    // Test querying position_types with associated users (HasMany via user_position_type)
    let position_types_with_users = position_type::Entity::find()
        .find_with_related(user::Entity)
        .all(&db)
        .await
        .expect("Failed to fetch position_types with users");

    println!(
        "Fetched {} position types with user relations.",
        position_types_with_users.len()
    );
}
