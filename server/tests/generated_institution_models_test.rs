use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_institution_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for institution::master::employees
    let result = models::institution::master::employees::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::master::employees");

    // Test query for institution::master::institutions
    let result = models::institution::master::institutions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::master::institutions");

    // Test query for institution::master::staffes
    let result = models::institution::master::staffes::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::master::staffes");

    // Test query for institution::master::units
    let result = models::institution::master::units::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::master::units");

    // Test query for institution::reference::categories
    let result = models::institution::reference::categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::reference::categories");

    // Test query for institution::reference::position_type
    let result = models::institution::reference::position_type::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::reference::position_type");

    // Test query for institution::reference::unit_types
    let result = models::institution::reference::unit_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::reference::unit_types");

    // Test query for institution::reference::varieties
    let result = models::institution::reference::varieties::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for institution::reference::varieties");

}
