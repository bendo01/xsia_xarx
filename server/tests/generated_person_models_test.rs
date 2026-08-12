use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_person_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for person::master::biodata
    let result = models::person::master::biodata::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::master::biodata");

    // Test query for person::master::individual
    let result = models::person::master::individual::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::master::individual");

    // Test query for person::reference::age_classification
    let result = models::person::reference::age_classification::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::age_classification");

    // Test query for person::reference::blood_type
    let result = models::person::reference::blood_type::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::blood_type");

    // Test query for person::reference::eye_color
    let result = models::person::reference::eye_color::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::eye_color");

    // Test query for person::reference::gender
    let result = models::person::reference::gender::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::gender");

    // Test query for person::reference::hair_color
    let result = models::person::reference::hair_color::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::hair_color");

    // Test query for person::reference::hair_type
    let result = models::person::reference::hair_type::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::hair_type");

    // Test query for person::reference::identification_type
    let result = models::person::reference::identification_type::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::identification_type");

    // Test query for person::reference::income
    let result = models::person::reference::income::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::income");

    // Test query for person::reference::marital_status
    let result = models::person::reference::marital_status::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::marital_status");

    // Test query for person::reference::occupation
    let result = models::person::reference::occupation::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::occupation");

    // Test query for person::reference::profession
    let result = models::person::reference::profession::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::profession");

    // Test query for person::reference::relative_type
    let result = models::person::reference::relative_type::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::relative_type");

    // Test query for person::reference::religion
    let result = models::person::reference::religion::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for person::reference::religion");

}
