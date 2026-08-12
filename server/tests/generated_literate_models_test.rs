use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_literate_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for literate::categories
    let result = models::literate::categories::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for literate::categories");

    // Test query for literate::educations
    let result = models::literate::educations::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for literate::educations");

    // Test query for literate::groups
    let result = models::literate::groups::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for literate::groups");

    // Test query for literate::levels
    let result = models::literate::levels::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for literate::levels");

    // Test query for literate::varieties
    let result = models::literate::varieties::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for literate::varieties");

}
