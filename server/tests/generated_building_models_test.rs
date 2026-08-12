use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_building_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for building::master::buildings
    let result = models::building::master::buildings::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for building::master::buildings");

    // Test query for building::master::rooms
    let result = models::building::master::rooms::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for building::master::rooms");

    // Test query for building::reference::categories
    let result = models::building::reference::categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for building::reference::categories");

    // Test query for building::reference::conditions
    let result = models::building::reference::conditions::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for building::reference::conditions");

    // Test query for building::reference::room_types
    let result = models::building::reference::room_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for building::reference::room_types");

    // Test query for building::reference::varieties
    let result = models::building::reference::varieties::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for building::reference::varieties");

}
