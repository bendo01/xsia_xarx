use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_auth_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for auth::permission
    let result = models::auth::permission::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for auth::permission");

    // Test query for auth::permission_user
    let result = models::auth::permission_user::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for auth::permission_user");

    // Test query for auth::user
    let result = models::auth::user::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for auth::user");

    // Test query for auth::user_position_type
    let result = models::auth::user_position_type::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for auth::user_position_type");

}
