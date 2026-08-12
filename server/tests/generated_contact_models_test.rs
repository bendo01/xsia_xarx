use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_contact_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for contact::master::electronic_mails
    let result = models::contact::master::electronic_mails::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::master::electronic_mails");

    // Test query for contact::master::phones
    let result = models::contact::master::phones::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::master::phones");

    // Test query for contact::master::residences
    let result = models::contact::master::residences::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::master::residences");

    // Test query for contact::master::websites
    let result = models::contact::master::websites::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::master::websites");

    // Test query for contact::reference::electronic_mail_types
    let result = models::contact::reference::electronic_mail_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::reference::electronic_mail_types");

    // Test query for contact::reference::phone_types
    let result = models::contact::reference::phone_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::reference::phone_types");

    // Test query for contact::reference::residence_types
    let result = models::contact::reference::residence_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::reference::residence_types");

    // Test query for contact::reference::website_types
    let result = models::contact::reference::website_types::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for contact::reference::website_types");

}
