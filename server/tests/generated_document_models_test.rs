use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_document_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for document::reference::archive_types
    let result = models::document::reference::archive_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for document::reference::archive_types");

    // Test query for document::transaction::archives
    let result = models::document::transaction::archives::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for document::transaction::archives");

}
